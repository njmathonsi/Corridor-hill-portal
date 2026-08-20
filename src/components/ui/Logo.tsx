/**
 * TENTSARI mark — direction "1c Stack": the letter T read as a pitched roof,
 * drawn as two nested chevrons. Single-weight vector, so it survives 24px
 * (favicon) and a single-colour reversal.
 *
 * `animated` swaps the fill for a stroke-draw reveal; the paths carry
 * pathLength="1" so the dash animation in glass.css is length-independent
 * and does not need recomputing if the geometry is ever retuned.
 */
export default function Logo({ size = 32, animated = false }: { size?: number; animated?: boolean }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 64 64"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={animated ? 'logo-draw' : undefined}
      aria-hidden="true"
    >
      <defs>
        <linearGradient id="logo-roof-outer" x1="32" y1="15" x2="32" y2="50" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="var(--brand-hi)" />
          <stop offset="100%" stopColor="var(--brand-deep)" />
        </linearGradient>
        <linearGradient id="logo-roof-inner" x1="32" y1="34" x2="32" y2="50" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="var(--brand)" />
          <stop offset="100%" stopColor="var(--brand-mid)" />
        </linearGradient>
      </defs>
      <path
        d="M8 50 L32 15 L56 50"
        stroke="url(#logo-roof-outer)"
        strokeWidth="6.5"
        strokeLinecap="round"
        strokeLinejoin="round"
        pathLength={1}
      />
      <path
        d="M21 50 L32 34 L43 50"
        stroke="url(#logo-roof-inner)"
        strokeWidth="5.5"
        strokeLinecap="round"
        strokeLinejoin="round"
        pathLength={1}
      />
    </svg>
  )
}
