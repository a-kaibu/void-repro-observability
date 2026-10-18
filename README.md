# void-repro-observability

Minimal reproduction: `cloudflare.observability` in `void.config.ts` is accepted, but `void deploy` does not apply it to the Worker.

- void: 1.1.11
- Target: Cloudflare Workers

## Problem

`void.config.ts` enables Workers Logs and traces:

```ts
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
```

`void deploy` finishes without any warning.
After the deploy, the Worker's settings still have observability disabled, and no logs or traces are recorded in the dashboard.

The setting is not rejected either.
`observability` is in the list of keys Void accepts for the Worker output, so nothing tells the user that it was dropped.
With Wrangler, the same `observability` block in `wrangler.jsonc` is applied on `wrangler deploy`.

## Cause

Void uploads the Worker through the Workers Versions API (`/workers/workers/{id}/versions`).
The upload body carries bindings, compatibility settings, assets, containers and so on, but no `observability` field:

```js
// void/dist/deploy-DsW-PrRQ.mjs:2468 (upload of the Worker version)
const uploaded = await apiResult(`${accountUrl}/workers/workers/${...}/versions`, ...)
```

Observability is a script-level setting (`/workers/scripts/{name}/script-settings`), not part of a version, so it has to be set separately.
Void does not do that for the Worker.

In the Void source, `observability` is used in two places only:

- the list of accepted keys for the built Worker config (`void/dist/deploy-DsW-PrRQ.mjs:2388`), so it passes validation
- the settings of Cloudflare **Containers** (`void/dist/deploy-DsW-PrRQ.mjs:2180`), where only `logs.enabled` is forwarded

## Steps to reproduce

1. Run:

   ```sh
   pnpm install
   pnpm run build
   pnpm exec void deploy --platform cloudflare
   ```

2. Read the Worker's script settings:

   ```sh
   curl -s -H "Authorization: Bearer $CLOUDFLARE_API_TOKEN" \
     "https://api.cloudflare.com/client/v4/accounts/$CLOUDFLARE_ACCOUNT_ID/workers/scripts/void-repro-observability/script-settings"
   ```

3. `result.observability` is missing or has `enabled: false`; the dashboard shows Workers Logs as disabled for this Worker.

## Expected

After `void deploy`, the Worker's observability settings match `cloudflare.observability` in `void.config.ts`, as they do with `wrangler deploy`.
