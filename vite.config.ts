
import { defineConfig } from "@lovable.dev/vite-tanstack-config";

export default defineConfig({
  tanstackStart: {
    server: { entry: "server" },
    allowedHosts: ['frontend-production-6e8f.up.railway.app/']
  },
});
