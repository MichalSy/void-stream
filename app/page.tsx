import Link from 'next/link'

export default function Home() {
  return (
    <main className="min-h-screen void-gradient flex items-center justify-center">
      <div className="text-center space-y-8">
        <h1 className="text-6xl font-bold bg-gradient-to-r from-purple-400 to-indigo-500 bg-clip-text text-transparent">
          Void Stream
        </h1>
        <p className="text-gray-400 text-xl">
          Enter the void. Watch anything.
        </p>
        <Link 
          href="/player" 
          className="inline-block px-8 py-3 bg-indigo-600 hover:bg-indigo-700 rounded-lg font-medium transition glow-purple"
        >
          Open Player
        </Link>
      </div>
    </main>
  )
}
