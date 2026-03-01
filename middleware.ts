import { createMiddleware } from '@michalsy/aiko-webapp-core/middleware'

export const middleware = createMiddleware({
  protectedPaths: ['/player', '/api'],
  publicPaths: ['/', '/login', '/auth/callback'],
})

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico).*)'],
}
