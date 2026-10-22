import type { NextConfig } from "next";

const config: NextConfig = {
  poweredByHeader: false,
  reactStrictMode: true,
  allowedDevOrigins: ["127.0.0.1"],
  // Keep the connected browser test server separate from an open local app.
  distDir: process.env.QUIETSPACE_TEST_OUTPUT ?? ".next",
};

export default config;
