import type { Metadata } from 'next'
import './globals.css'
import '@michalsy/aiko-webapp-core/core.css'
import { AuthProvider } from '@michalsy/aiko-webapp-core'

export const metadata: Metadata = {
  title: 'Void Stream',
  description: 'Nerd-grade video streaming platform',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>
        <AuthProvider>
          {children}
        </AuthProvider>
      </body>
    </html>
  )
}
