import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'Secourisme — Gestion du matériel',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="fr">
      <body className="overscroll-none">{children}</body>
    </html>
  )
}
