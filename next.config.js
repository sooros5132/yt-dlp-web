/** @type {import('next').NextConfig} */
const nextConfig = {
  experimental: {
    appDir: true
  },
  swcMinify: true,
  modularizeImports: {
    lodash: {
      transform: 'lodash/{{member}}'
    }
  },
  reactStrictMode: true
};

module.exports = nextConfig;
