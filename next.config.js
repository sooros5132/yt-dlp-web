/** @type {import('next').NextConfig} */
const nextConfig = {
  swcMinify: true,
  modularizeImports: {
    lodash: {
      transform: 'lodash/{{member}}'
    }
  },
  reactStrictMode: true,
  output: 'standalone'
};

module.exports = nextConfig;
