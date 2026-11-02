# Marketing: getting PacketWorld in front of people

Two things are automated: **posting to X** from an approved queue, and **counting visits** with privacy-friendly analytics. Everything else here is a checklist you do by hand.

## 1. See who's using it (Vercel Web Analytics)

The code is already in place. Turn it on once:

1. Open https://vercel.com, go to the **packetworld** project, then the **Analytics** tab.
2. Click **Enable**.

From the next visit on, you'll see visitors, the pages they open (`/journey`, `/learn/dns`…), where they came from (x.com, reddit.com, github.com) and their country and device. No cookies, no personal data.

## 2. Post to X automatically (with your approval)

### One-time setup

1. Go to https://developer.x.com and sign in with the X account you want to post from. Create a project and an app (the free plan is enough to start).
2. In the app's **User authentication settings**, set **App permissions** to **Read and write**. Do this *before* step 3, or the token will be read-only.
3. In **Keys and tokens**, generate and copy:
   - **API Key** and **API Key Secret**
   - **Access Token** and **Access Token Secret**
4. On GitHub, open the repository → **Settings** → **Secrets and variables** → **Actions** → **New repository secret**, and add four secrets with exactly these names:

   | Name | Value |
   |---|---|
   | `X_API_KEY` | API Key |
   | `X_API_SECRET` | API Key Secret |
   | `X_ACCESS_TOKEN` | Access Token |
   | `X_ACCESS_SECRET` | Access Token Secret |

### Approving a post

All posts live in [`marketing/x-posts.json`](../marketing/x-posts.json). Each one starts as `"status": "draft"`.

1. On GitHub, open `marketing/x-posts.json` and click the pencil icon to edit.
2. Change one post's `"status": "draft"` to `"status": "approved"`.
3. Click **Commit changes**.

Every day at **8:00 PM India time** (14:30 UTC) the **Post to X** action posts the first approved post, then changes it to `"posted"` and saves the link. Approve several and they go out one per day, in order.

- Each item in `"thread"` is one post; the second and later items are posted as replies.
- `"media"` attaches a video or image to the first post.
- CI checks every post on each push and fails if one is over 280 characters.

### Testing it

On GitHub, open **Actions** → **Post to X** → **Run workflow**. With **dry run** ticked (the default) it shows what it *would* post and posts nothing. Untick it to post the next approved post right away.

If X rejects the video on your API plan, delete the `"media"` line for that post. It will go out as text, and the link shows the preview card.

To change the time, edit the `cron` line in `.github/workflows/post-to-x.yml` (it's in UTC).

## 3. Places to post by hand

These communities don't allow automated posting. Post once, as yourself, and reply to comments.

- **Hacker News:** "Show HN: PacketWorld, watch every packet when you open a website", linking to the site.
- **Reddit:** r/learnprogramming, r/networking, r/ccna, r/compsci, r/webdev. Read each subreddit's self-promotion rules first.
- **Teachers and students:** CS teachers, college coding clubs, Discord and Telegram study groups.
- **Articles:** a dev.to or Hashnode post about how it works, linking to the repo.
- **Lists:** pull requests to "awesome" lists such as awesome-computer-science.

## 4. New video clips

When the site changes, re-record the intro (see [design/INTRO_VIDEO.md](design/INTRO_VIDEO.md)) and attach the new file to a post in the queue.
