/** @type {import('next').NextConfig} */
const nextConfig = {
  // Required for Three.js
  transpilePackages: ['three', '@react-three/fiber', '@react-three/drei', '@react-three/postprocessing'],

  async headers() {
    return [
      {
        source: '/(.*)',
        headers: [
          { key: 'X-Content-Type-Options', value: 'nosniff' },
          { key: 'X-Frame-Options', value: 'DENY' },
          { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
          { key: 'Content-Security-Policy', value: "default-src 'self'; script-src 'self' 'unsafe-eval' 'unsafe-inline'; style-src 'self' 'unsafe-inline' https://fonts.googleapis.com; font-src 'self' https://fonts.gstatic.com; img-src 'self' data: blob: https://api.unsplash.com https://images.unsplash.com https://upload.wikimedia.org https://*.wikipedia.org https://*.wikimedia.org; connect-src 'self' https://api.open-meteo.com https://services.swpc.noaa.gov https://api.coingecko.com https://wikimedia.org https://earthquake.usgs.gov https://api.gdeltproject.org https://nominatim.openstreetmap.org https://api.unsplash.com; frame-ancestors 'none'" },
        ],
      },
    ]
  },
}

export default nextConfig
