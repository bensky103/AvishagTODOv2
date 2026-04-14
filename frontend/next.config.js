/** @type {import('next').NextConfig} */
const nextConfig =
  process.env.NEXT_PUBLIC_BUILD_MODE === "export"
    ? { output: "export" }
    : {};

module.exports = nextConfig;
