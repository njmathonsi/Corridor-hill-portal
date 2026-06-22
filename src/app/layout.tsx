import type { Metadata } from 'next'
import './globals.css'
import { Toaster } from '@/components/ui/toaster'

export const metadata: Metadata = {
  title: 'Corridor Hill — Residence Management',
  description: 'Enterprise student accommodation portal · eMalahleni',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>
        <Toaster>{children}</Toaster>
      </body>
    </html>
  )
}
