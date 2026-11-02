/** @type {import('tailwindcss').Config} */
// "Lab notebook" design tokens: a dark chalkboard by default, with a light theme.
// Every protocol has one ink colour and one highlighter tint, used everywhere.
// See docs/DESIGN_SYSTEM.md and docs/decisions/0017-lab-notebook-visual-direction.md.
export default {
  content: ['./index.html', './src/**/*.{ts,tsx}', '!./src/vendor/**'],
  theme: {
    extend: {
      colors: {
        // Values live in src/index.css as CSS variables, one set per theme (ADR 0022).
        paper: { DEFAULT: 'rgb(var(--pw-paper) / <alpha-value>)', 2: 'rgb(var(--pw-paper-2) / <alpha-value>)' },
        card: 'rgb(var(--pw-card) / <alpha-value>)',
        wash: 'rgb(var(--pw-wash) / <alpha-value>)',
        rule: { DEFAULT: 'rgb(var(--pw-rule) / <alpha-value>)', strong: 'rgb(var(--pw-rule-strong) / <alpha-value>)' },
        /** Card outlines and their flat offset edge. */
        edge: 'rgb(var(--pw-edge) / <alpha-value>)',
        fg: {
          DEFAULT: 'rgb(var(--pw-fg) / <alpha-value>)',
          muted: 'rgb(var(--pw-fg-muted) / <alpha-value>)',
          faint: 'rgb(var(--pw-fg-faint) / <alpha-value>)',
        },
        proto: {
          dns: 'rgb(var(--pw-dns) / <alpha-value>)',
          tcp: 'rgb(var(--pw-tcp) / <alpha-value>)',
          udp: 'rgb(var(--pw-udp) / <alpha-value>)',
          tls: 'rgb(var(--pw-tls) / <alpha-value>)',
          http: 'rgb(var(--pw-http) / <alpha-value>)',
          ip: 'rgb(var(--pw-ip) / <alpha-value>)',
          error: 'rgb(var(--pw-error) / <alpha-value>)',
          warn: 'rgb(var(--pw-warn) / <alpha-value>)',
        },
        tint: {
          dns: 'rgb(var(--pw-t-dns) / <alpha-value>)',
          tcp: 'rgb(var(--pw-t-tcp) / <alpha-value>)',
          udp: 'rgb(var(--pw-t-udp) / <alpha-value>)',
          tls: 'rgb(var(--pw-t-tls) / <alpha-value>)',
          http: 'rgb(var(--pw-t-http) / <alpha-value>)',
          ip: 'rgb(var(--pw-t-ip) / <alpha-value>)',
          error: 'rgb(var(--pw-t-error) / <alpha-value>)',
          warn: 'rgb(var(--pw-t-warn) / <alpha-value>)',
          marker: 'rgb(var(--pw-t-marker) / <alpha-value>)',
        },
      },
      fontFamily: {
        display: ['"Fraunces Variable"', 'Fraunces', 'Georgia', 'serif'],
        sans: ['"Atkinson Hyperlegible"', 'system-ui', 'sans-serif'],
        mono: ['"IBM Plex Mono"', 'ui-monospace', 'monospace'],
      },
      fontSize: {
        '2xs': ['0.75rem', { lineHeight: '1.1rem' }],
      },
      boxShadow: {
        // A flat, offset "card on the desk" edge. No blur.
        note: '3px 3px 0 0 rgb(var(--pw-edge))',
        'note-sm': '2px 2px 0 0 rgb(var(--pw-edge))',
      },
      keyframes: {
        'fade-up': {
          from: { opacity: '0', transform: 'translateY(6px)' },
          to: { opacity: '1', transform: 'translateY(0)' },
        },
      },
      animation: {
        'fade-up': 'fade-up 0.3s cubic-bezier(0.25, 0.8, 0.25, 1) both',
      },
    },
  },
  plugins: [],
}
