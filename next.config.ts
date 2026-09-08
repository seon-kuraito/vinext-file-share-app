import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  experimental: {
    serverActions: {
      // vinext caps POST multipart/form-data bodies at 1 MB by default
      bodySizeLimit: "10mb",

      /**
       * Cloudflare caps request bodies at 100 MB (Free and Pro),
       * but Worker memory is 128 MB per isolate and c.req.formData() 
       * holds the whole file, so the real ceiling is well below 100 MB
       */
    },
  },
};

export default nextConfig;
