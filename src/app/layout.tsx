import './glass.css';
import type { Metadata } from 'next'
import './globals.css'
import { Toaster } from '@/components/ui/toaster'

export const metadata: Metadata = {
  title: 'TENTSARI — Residence Management',
  description: 'Enterprise student accommodation portal · eMalahleni',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>
        <div className="app-bg" />
        {/* Ambient motion over the still .app-bg. CSS hides this below 769px
            and under reduced-motion, where the poster — the same still — is
            what remains, so the two paths look identical apart from movement. */}
        <video
          className="app-bg-video"
          src="/video/tentsari-bg.mp4"
          poster="/images/tentsari-bg.jpg"
          autoPlay
          muted
          loop
          playsInline
          aria-hidden="true"
        />
        <div className="app-bg-overlay" />
        <Toaster>{children}</Toaster>
      </body>
    </html>
  )
}
