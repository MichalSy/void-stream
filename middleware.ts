import { createMiddleware } from '@michalsy/aiko-webapp-core/middleware'

export const middleware = createMiddleware({
  protectedPaths: ['/player'],
  publicPaths: ['/', '/login', '/auth/callback', '/api/extract'],
})

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico).*)'],
}
