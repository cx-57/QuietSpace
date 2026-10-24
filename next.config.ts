import type { NextConfig } from "next";

const config: NextConfig = {
  poweredByHeader: false,
  reactStrictMode: true,
  output: "standalone",
  outputFileTracingExcludes: { "/*": ["./.env*", "./artifacts/**/*", "./tests/**/*"] },
  async headers() {
    return [{ source: "/:path*", headers: [
      { key: "X-Content-Type-Options", value: "nosniff" },
      { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
      { key: "X-Frame-Options", value: "DENY" },
      { key: "Permissions-Policy", value: "geolocation=(), camera=(), microphone=()" },
      { key: "Content-Security-Policy", value: "object-src 'none'; base-uri 'self'; frame-ancestors 'none'; form-action 'self'" },
    ] }];
  },
  allowedDevOrigins: ["127.0.0.1"],
  // Keep the connected browser test server separate from an open local app.
  distDir: process.env.QUIETSPACE_TEST_OUTPUT ?? ".next",
};

export default config;
