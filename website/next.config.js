/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  transpilePackages: ['three'],
  typescript: {
    // TypeScript 7 is the native (Go) compiler and no longer exposes the JS
    // compiler API that Next's built-in type check relies on. Type safety is
    // enforced by a dedicated `tsc --noEmit` step (npm run typecheck / CI)
    // instead of during `next build`.
    ignoreBuildErrors: true,
  },
}

module.exports = nextConfig
