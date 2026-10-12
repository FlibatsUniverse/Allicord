# Contributing to Allicord

## Branches and pull requests

main is the stable Allicord branch. upstream mirrors Equicord/Equicord:main without Allicord commits. Create feature branches from dev and target dev, then promote validated changes into main. Never force-push main, dev or upstream, and never rewrite inherited history. Every main push is automatically released only after the full Allicord Build workflow succeeds.

## Conventional Commits

Use Conventional Commits for new Allicord commits and pull request titles:

```text
feat(plugins): add Alliance example plugin
fix(updater): select the Allicord release asset
docs(contributing): explain upstream integration
ci(sync): validate upstream changes before integration
```

Format: type(optional-scope): description. Types include feat, fix, docs, style, refactor, perf, test, build, ci, chore and revert. Use ! or a BREAKING CHANGE: footer for breaking changes. Squash titles must follow this format. Inherited upstream commits and history-preserving merge commits keep their original messages.

## Code and plugins

Follow .rules for TypeScript, supported APIs, GPL headers and plugin policy. Use existing Discord components and utilities. Put Alliance plugins in src/allicordplugins/<name>/index.ts or index.tsx. Retain upstream plugin directories and authors. The example uses the upstream nobody placeholder author; replace it with a verified contributor identity before adding real functionality. See [the plugin guide](src/allicordplugins/README.md).

## Validation

Install with pnpm install --frozen-lockfile using Node 24 and packageManager from package.json. Run pnpm testTsc, pnpm lint, pnpm lint-styles, pnpm lint:intl, pnpm lint:patches, pnpm generatePluginJson, pnpm buildStandalone and pnpm buildWebStandalone. These cover the inherited test script without its automatic lint fixes. Upstream has no separate unit test command. Review workflow changes and dependency compatibility. Test affected behavior in Discord; compilation alone does not validate runtime patches.

## Upstream synchronization

Equicord changes are merged into dev manually; resolve conflicts on an integration branch, preserve Alliance changes and upstream attribution, run all checks, and merge with history preserved. See [UPSTREAM.md](UPSTREAM.md).

## AI assistance

Disclose the tool and scope of AI assistance. Human contributors must review and understand submitted changes. Keep issues and pull request descriptions concise and relevant.
