# Alliance plugins

Create a folder with index.ts or index.tsx and a default definePlugin export. Put the literal name first, followed by description, authors and settings. Names must be unique across all upstream and Alliance plugins. Follow the existing definePluginSettings API and supported lifecycle hooks. Declare API dependencies. Prefer no patches for simple integrations.

scripts/build/common.mjs discovers this directory for every renderer target. scripts/build/build.mjs discovers native.ts companions. scripts/generatePluginList.ts includes Alliance plugins in the combined catalog and rejects duplicate names. Existing plugin settings and enable/disable controls work unchanged. Platform folder suffixes follow upstream conventions.

AllicordExample is disabled by default and only exposes an inert text setting. It has no patches, network requests or lifecycle effects. Use a verified contributor entry for real plugins. Run the checks in CONTRIBUTING.md and enable the plugin manually in a development client for runtime testing. Keep upstream plugins in their original directories to simplify merges.
