/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'lh3.googleusercontent.com', // profile pictures for google users
        port: '',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: 'wallet-asset.matic.network', // crypto assets logos
        port: '',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: 'raw.githubusercontent.com', // crypto assets logos
        port: '',
        pathname: '/**',
      },
    ],
  },
  reactStrictMode: true,
  async redirects() {
    return [{
      source: '/',
      destination: '/browse/bots',
      permanent: true
    }]
  },
}

module.exports = nextConfig