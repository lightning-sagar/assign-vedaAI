import fs from "node:fs";
import path from "node:path";

for (const envPath of [path.resolve(process.cwd(), "../.env"), path.resolve(process.cwd(), ".env")]) {
  if (!fs.existsSync(envPath)) continue;
  const lines = fs.readFileSync(envPath, "utf8").split(/\r?\n/);
  for (const line of lines) {
    const match = line.match(/^\s*([A-Za-z_][A-Za-z0-9_]*)\s*=\s*(.*)\s*$/);
    if (!match) continue;
    const [, key, rawValue] = match;
    if (process.env[key]) continue;
    process.env[key] = rawValue.replace(/^["']|["']$/g, "");
  }
}

/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true
};

export default nextConfig;
