import { Suspense } from 'react'
import LoginForm from '@michalsy/aiko-webapp-core/login'
import '@michalsy/aiko-webapp-core/core.css'

export default function LoginPage() {
  return (
    <main className="min-h-screen void-gradient flex items-center justify-center">
      <Suspense fallback={
        <div className="text-white">Loading...</div>
      }>
        <LoginForm 
          title="Void Stream"
          subtitle="Enter the void"
        />
      </Suspense>
    </main>
  )
}
