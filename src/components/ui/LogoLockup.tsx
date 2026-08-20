import Logo from './Logo'

/**
 * The full "1c Stack" lockup: mark on top, wide-tracked wordmark beneath,
 * registration line last. Used where the brand gets room to breathe (login,
 * print headers) — the sidebars keep the mark-only form.
 *
 * `animated` runs the staged reveal: the roof draws itself, then the wordmark
 * settles in from wider tracking. Both are disabled under
 * prefers-reduced-motion by the rules in glass.css.
 */
export default function LogoLockup({
  markSize = 44,
  reg = 'REG. 2024/126249/07',
  animated = false,
}: {
  markSize?: number
  reg?: string | null
  animated?: boolean
}) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 10 }}>
      <Logo size={markSize} animated={animated} />
      <div
        className={animated ? 'wordmark-reveal' : undefined}
        style={{
          fontSize: 21,
          fontWeight: 600,
          color: '#fafafa',
          letterSpacing: '0.34em',
          textIndent: '0.34em',
          lineHeight: 1,
        }}
      >
        TENTSARI
      </div>
      {reg && (
        <div
          className={animated ? 'wordmark-reveal-late' : undefined}
          style={{ fontSize: 9, fontWeight: 500, color: '#71717a', letterSpacing: '0.18em', textIndent: '0.18em' }}
        >
          {reg}
        </div>
      )}
    </div>
  )
}
