/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 's.jyj.cx',
        pathname: '/proj/GenImg/**',
      },
    ],
  },
}

export default nextConfig
