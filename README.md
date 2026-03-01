# Void Stream 🎬

> Enter the void. Watch anything.

Nerd-grade video streaming platform with aiko-webapp-core.

## Features

- 🎥 HLS Video Player (hls.js)
- 🔐 Google OAuth via Supabase
- 🎨 Dark void theme
- 📱 Responsive design

## Tech Stack

- **Frontend**: Next.js 15 + React 19
- **Auth**: aiko-webapp-core + Supabase
- **Video**: HLS.js
- **Styling**: Tailwind CSS
- **Deployment**: k3s + ArgoCD

## Development

\`\`\`bash
npm install
npm run dev
\`\`\`

## Deployment

Automatically deployed via GitOps (ArgoCD) to k3s cluster.

## License

MIT
