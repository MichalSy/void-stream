import { handleAuthCallback } from '@michalsy/aiko-webapp-core/auth/callback'

export const GET = (req: Request) => 
  handleAuthCallback(req, { 
    successRedirect: '/player' 
  })
