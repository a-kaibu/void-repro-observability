import { defineConfig } from "void/config";

export default defineConfig({
  target: "cloudflare",
  cloudflare: {
    name: "void-repro-observability",
    workers_dev: true,
    preview_urls: true,
    routes: [],
    observability: {
      enabled: true,
      head_sampling_rate: 1,
      logs: { enabled: true, invocation_logs: true },
      traces: { enabled: true, head_sampling_rate: 1 },
    },
  },
});
