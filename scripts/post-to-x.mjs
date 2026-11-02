// Posts the next approved item from marketing/x-posts.json to X, then marks it
// as posted. Run daily by .github/workflows/post-to-x.yml. See docs/MARKETING.md.
//
//   node scripts/post-to-x.mjs --check     validate every post (CI runs this)
//   node scripts/post-to-x.mjs --dry-run   show what would be posted, post nothing
//   node scripts/post-to-x.mjs             post for real (needs the X_* secrets)
import { appendFileSync, readFileSync, writeFileSync } from 'node:fs'
import { extname } from 'node:path'

const QUEUE = new URL('../marketing/x-posts.json', import.meta.url)
const ROOT = new URL('../', import.meta.url)
const args = new Set(process.argv.slice(2))
const queue = JSON.parse(readFileSync(QUEUE, 'utf8'))

// X counts every link as 23 characters, however long it is.
const LINK = /(?:https?:\/\/)?(?:[\w-]+\.)+(?:app|com|org|net|dev|io)(?:\/[^\s]*)?/g
const length = (text) => [...text.replace(LINK, 'x'.repeat(23))].length

const STATUSES = new Set(['draft', 'approved', 'posted'])
const MEDIA_TYPES = { '.mp4': 'video/mp4', '.png': 'image/png', '.jpg': 'image/jpeg', '.jpeg': 'image/jpeg', '.gif': 'image/gif' }

function check() {
  const problems = []
  const ids = new Set()
  for (const post of queue.posts) {
    if (ids.has(post.id)) problems.push(`duplicate id "${post.id}"`)
    ids.add(post.id)
    if (!STATUSES.has(post.status)) problems.push(`${post.id}: status must be draft, approved or posted (got "${post.status}")`)
    if (!Array.isArray(post.thread) || post.thread.length === 0) problems.push(`${post.id}: needs at least one post in "thread"`)
    post.thread?.forEach((text, i) => {
      if (length(text) > 280) problems.push(`${post.id} part ${i + 1}: ${length(text)} characters, the limit is 280`)
    })
    if (post.media) {
      if (!MEDIA_TYPES[extname(post.media).toLowerCase()]) problems.push(`${post.id}: media must be .mp4, .png, .jpg or .gif`)
      try {
        readFileSync(new URL(post.media, ROOT))
      } catch {
        problems.push(`${post.id}: media file not found: ${post.media}`)
      }
    }
  }
  return problems
}

function summary(line) {
  console.log(line)
  if (process.env.GITHUB_STEP_SUMMARY) appendFileSync(process.env.GITHUB_STEP_SUMMARY, line + '\n')
}

const problems = check()
if (problems.length) {
  console.error('marketing/x-posts.json has problems:\n- ' + problems.join('\n- '))
  process.exit(1)
}
if (args.has('--check')) {
  const counts = queue.posts.reduce((c, p) => ({ ...c, [p.status]: (c[p.status] ?? 0) + 1 }), {})
  console.log(`x-posts.json is valid: ${JSON.stringify(counts)}`)
  process.exit(0)
}

const next = queue.posts.find((p) => p.status === 'approved')
if (!next) {
  summary('Nothing to post: no post has "status": "approved" in marketing/x-posts.json.')
  process.exit(0)
}

if (args.has('--dry-run')) {
  summary(`### Would post "${next.id}"${next.media ? ` with ${next.media}` : ''}`)
  next.thread.forEach((text, i) => summary(`\n**${i === 0 ? 'Post' : `Reply ${i}`}** (${length(text)}/280)\n\n${text}`))
  process.exit(0)
}

const { X_API_KEY, X_API_SECRET, X_ACCESS_TOKEN, X_ACCESS_SECRET } = process.env
if (!X_API_KEY || !X_API_SECRET || !X_ACCESS_TOKEN || !X_ACCESS_SECRET) {
  console.error('Missing X keys. Add X_API_KEY, X_API_SECRET, X_ACCESS_TOKEN and X_ACCESS_SECRET as repository secrets (docs/MARKETING.md).')
  process.exit(1)
}

const { TwitterApi } = await import('twitter-api-v2')
const client = new TwitterApi({ appKey: X_API_KEY, appSecret: X_API_SECRET, accessToken: X_ACCESS_TOKEN, accessSecret: X_ACCESS_SECRET }).readWrite

let mediaId
if (next.media) {
  const media_type = MEDIA_TYPES[extname(next.media).toLowerCase()]
  console.log(`Uploading ${next.media} (${media_type})…`)
  mediaId = await client.v2.uploadMedia(readFileSync(new URL(next.media, ROOT)), { media_type })
}

const parts = next.thread.map((text, i) => (i === 0 && mediaId ? { text, media: { media_ids: [mediaId] } } : { text }))
const results = await client.v2.tweetThread(parts)
const me = await client.v2.me()
const url = `https://x.com/${me.data.username}/status/${results[0].data.id}`

// Record it straight away so a later failure can never post it twice.
next.status = 'posted'
next.postedAt = new Date().toISOString()
next.url = url
writeFileSync(QUEUE, JSON.stringify(queue, null, 2) + '\n')
summary(`Posted "${next.id}": ${url}`)
