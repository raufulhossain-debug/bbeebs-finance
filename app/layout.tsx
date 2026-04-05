import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'BBs & Beebs | Financial Command Center',
  description: 'Personal financial OS',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  )
}
