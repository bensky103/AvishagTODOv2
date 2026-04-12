/** @type {import('next').NextConfig} */
const nextConfig =
  process.env.NEXT_PUBLIC_BUILD_MODE === "export"
    ? { output: "export" }
    : {
        async rewrites() {
          return [
            {
              source: "/api/:path*",
              destination: "http://localhost:8000/api/:path*",
            },
          ];
        },
      };

module.exports = nextConfig;
