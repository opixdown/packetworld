/** The PacketWorld mark: two hosts and a packet between them, in protocol colours. */
export function Logo({ size = 22 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 32 32" aria-hidden="true">
      <rect x="0.75" y="0.75" width="30.5" height="30.5" rx="7.5" fill="rgb(var(--pw-paper-2))" stroke="rgb(var(--pw-edge))" strokeWidth="1.5" />
      <path d="M8 16h16" stroke="rgb(var(--pw-rule-strong))" strokeWidth="2" strokeLinecap="round" />
      <circle cx="8" cy="16" r="3.5" fill="rgb(var(--pw-tcp))" />
      <circle cx="24" cy="16" r="3.5" fill="rgb(var(--pw-http))" />
      <rect x="13" y="12.5" width="7" height="7" rx="2" fill="rgb(var(--pw-dns))" />
    </svg>
  )
}
