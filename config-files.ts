// ═══════════════════════════════════════════════
// tailwind.config.ts
// ═══════════════════════════════════════════════
import type { Config } from 'tailwindcss'

const config: Config = {
  content: [
    './app/**/*.{ts,tsx}',
    './components/**/*.{ts,tsx}',
    './lib/**/*.{ts,tsx}',
  ],
  theme: {
    extend: {
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
        mono: ['JetBrains Mono', 'Fira Code', 'monospace'],
      },
      colors: {
        // Map CSS variables for Tailwind utility class use
        base:    'var(--bg-base)',
        surface: 'var(--bg-surface)',
        card:    'var(--bg-card)',
        raised:  'var(--bg-raised)',
        hover:   'var(--bg-hover)',
      },
      borderRadius: {
        sm: 'var(--r-sm)',
        md: 'var(--r-md)',
        lg: 'var(--r-lg)',
      },
      animation: {
        page:  'fadeSlide 0.2s ease both',
        pulse: 'pulse-dot 2s ease-in-out infinite',
        toast: 'toastIn 0.2s ease both',
        modal: 'modalIn 0.18s ease both',
      },
    },
  },
  plugins: [],
}

export default config


// ═══════════════════════════════════════════════
// next.config.ts
// ═══════════════════════════════════════════════
// (save as next.config.ts in project root)
import type { NextConfig } from 'next'

const nextConfig: NextConfig = {
  experimental: {
    serverActions: { allowedOrigins: ['localhost:3000'] },
  },
  images: {
    remotePatterns: [
      {
        protocol:  'https',
        hostname:  '*.supabase.co',
        pathname:  '/storage/v1/object/**',
      },
    ],
  },
  // Exclude @react-pdf/renderer from SSR bundling
  webpack: (config, { isServer }) => {
    if (isServer) {
      config.externals = [
        ...(config.externals ?? []),
        '@react-pdf/renderer',
        'canvas',
      ]
    }
    return config
  },
}

export default nextConfig
