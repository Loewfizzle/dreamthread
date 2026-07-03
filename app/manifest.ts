import type { MetadataRoute } from 'next'

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: 'Dreamthread',
    short_name: 'Dreamthread',
    description: 'A calm, artistic space to capture, revisit, and reflect on your dreams.',
    // Installed for bedside use: open straight into voice capture
    start_url: '/journal/new?capture=voice',
    display: 'standalone',
    background_color: '#040507',
    theme_color: '#040507',
    icons: [
      { src: '/icon-192.png', sizes: '192x192', type: 'image/png' },
      { src: '/icon-512.png', sizes: '512x512', type: 'image/png' },
      { src: '/icon-512.png', sizes: '512x512', type: 'image/png', purpose: 'maskable' },
    ],
  }
}
