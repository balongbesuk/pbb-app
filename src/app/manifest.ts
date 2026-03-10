import { MetadataRoute } from 'next'

export default function manifest(): MetadataRoute.Manifest {
    return {
        name: 'PBB Manager',
        short_name: 'PBB Manager',
        description: 'Aplikasi Manajemen Pajak Bumi dan Bangunan Desa',
        start_url: '/dashboard',
        display: 'standalone',
        background_color: '#f8fafc',
        theme_color: '#1e293b',
        orientation: 'portrait-primary',
        icons: [
            {
                src: '/favicon.ico',
                sizes: 'any',
                type: 'image/x-icon',
            },
            {
                src: '/globe.svg',
                sizes: 'any',
                type: 'image/svg+xml',
                purpose: 'maskable',
            },
            {
                src: '/globe.svg',
                sizes: '192x192 512x512',
                type: 'image/svg+xml',
                purpose: 'any',
            },
        ],
    }
}
