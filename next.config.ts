import type { NextConfig } from "next";
import dns from "dns";
import os from "os";

// Ensure Node.js c-ares DNS resolver has access to public resolvers (Google & Cloudflare)
// This resolves Windows Mobile Hotspot (192.168.137.1) / loopback SRV resolution failures.
try {
  dns.setServers(["8.8.8.8", "1.1.1.1", "8.8.4.4"]);
} catch {
  // Graceful fallback if restricted
}

/**
 * Dynamically collects active local IPv4 addresses on the host machine
 * so that LAN access (e.g., http://192.168.119.54:3000) works seamlessly
 * without manual IP editing when switching Wi-Fi or hotspot networks.
 * Formats entries strictly as hostnames without ports, per Next.js specification.
 */
function getDevAllowedOrigins(): string[] {
  const origins = new Set<string>(["localhost", "127.0.0.1", "192.168.137.1"]);

  try {
    const interfaces = os.networkInterfaces();
    for (const name of Object.keys(interfaces)) {
      const netList = interfaces[name];
      if (netList) {
        for (const net of netList) {
          // Include non-internal active IPv4 LAN addresses
          if ((net.family === "IPv4" || net.family === (4 as unknown)) && !net.internal) {
            origins.add(net.address);
          }
        }
      }
    }
  } catch {
    // If network interfaces cannot be inspected, fallback to loopback
  }

  if (process.env.DEV_ALLOWED_ORIGIN) {
    origins.add(process.env.DEV_ALLOWED_ORIGIN.trim());
  }

  return Array.from(origins);
}

const nextConfig: NextConfig = {
  /* config options here */
  reactCompiler: true,
  allowedDevOrigins: getDevAllowedOrigins(),
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
