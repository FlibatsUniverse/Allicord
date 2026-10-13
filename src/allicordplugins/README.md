# Alliance plugins

Create a folder with index.ts or index.tsx and a default definePlugin export. Put the literal name first, followed by description, authors and settings. Names must be unique across all upstream and Alliance plugins. Follow the existing definePluginSettings API and supported lifecycle hooks. Declare API dependencies. Prefer no patches for simple integrations.

scripts/build/common.mjs discovers this directory for every renderer target. scripts/build/build.mjs discovers native.ts companions. scripts/generatePluginList.ts includes Alliance plugins in the combined catalog and rejects duplicate names. Existing plugin settings and enable/disable controls work unchanged. Platform folder suffixes follow upstream conventions.

Keep upstream plugins in their original directories to simplify merges.
