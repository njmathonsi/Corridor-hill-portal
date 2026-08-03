export default function Logo({ size = 32 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <linearGradient id="logo-blade-1" x1="14" y1="6" x2="30" y2="50" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#5EEAD4" />
          <stop offset="100%" stopColor="#2E4FCC" />
        </linearGradient>
        <linearGradient id="logo-blade-2" x1="26" y1="14" x2="40" y2="50" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#3B82F6" />
          <stop offset="100%" stopColor="#6C2BD9" />
        </linearGradient>
        <linearGradient id="logo-blade-3" x1="38" y1="20" x2="49" y2="50" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#8B5CF6" />
          <stop offset="100%" stopColor="#A78BFA" />
        </linearGradient>
      </defs>
      <path d="M14 50 Q19 16 26 6 Q33 16 30 50 Z" fill="url(#logo-blade-1)" />
      <path d="M26 50 Q30 22 37 14 Q43 22 40 50 Z" fill="url(#logo-blade-2)" />
      <path d="M38 50 Q41 26 47 20 Q52 26 49 50 Z" fill="url(#logo-blade-3)" />
    </svg>
  )
}
