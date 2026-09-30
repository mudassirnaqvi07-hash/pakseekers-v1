import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  reactCompiler: true,
  allowedDevOrigins: [
    "192.168.18.143",
    "192.168.18.143:3000",
    "192.168.137.1",
    "192.168.137.1:3000",
    "localhost",
    "localhost:3000",
    "127.0.0.1",
    "127.0.0.1:3000",
  ],
  async redirects() {
    return [
      {
        source: "/tests",
        destination: "/student/tests",
        permanent: false,
      },
      {
        source: "/practice",
        destination: "/student/tests",
        permanent: false,
      },
      {
        source: "/results",
        destination: "/student/attempts",
        permanent: false,
      },
      {
        source: "/results/:id",
        destination: "/student/attempts/:id",
        permanent: false,
      },
    ];
  },
};

export default nextConfig;
