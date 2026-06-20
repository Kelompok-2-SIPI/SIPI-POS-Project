/** @type {import('next').NextConfig} */
const nextConfig = {
  // Output standalone untuk Docker production build
  // output: 'standalone', // aktifkan saat production build

  // Env yang diekspos ke browser
  env: {
    NEXT_PUBLIC_API_URL: process.env.NEXT_PUBLIC_API_URL,
  },
};

module.exports = nextConfig;
