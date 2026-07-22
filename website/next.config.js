/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  transpilePackages: ['three'],
  experimental: {
    // TypeScript 7 (native compiler) dropped the JS compiler API, so `next build`
    // must invoke the `tsc` CLI directly instead of the removed JS API.
    // Requires Next.js 16.3+. Fixes the CI build (issue vercel/next.js#95490).
    useTypeScriptCli: true,
  },
}

module.exports = nextConfig
