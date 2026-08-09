import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  eslint: { ignoreDuringBuilds: false },
  // Prisma's engine-less "client" generator (queryCompiler preview feature,
  // see prisma/schema.prisma) loads query_compiler_bg.wasm via a dynamic
  // require that Next's output file tracer can't follow statically, so it
  // gets dropped from the serverless function bundle on Vercel unless
  // force-included here. Without this, every prisma.* call 500s in
  // production with ENOENT on query_compiler_bg.wasm.
  outputFileTracingIncludes: {
    "/**": ["./node_modules/.prisma/client/**/*.wasm"],
  },
};

export default nextConfig;
