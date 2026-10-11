# Architecture

Allicord is a native GitHub fork of Equicord, with Vencord as the root source. Upstream TypeScript APIs, renderer globals, plugin directories, protocols and data formats stay compatible. The GPL license and inherited notices remain unchanged.

Alliance additions live under src/allicordplugins and assets/. Plugin discovery, native companions and catalog generation include that directory. Allicord uses the existing PluginManager and Settings system. Upstream contributor badges and cloud service identities continue to identify their actual providers.

The build pipeline uses Node 24, pinned pnpm and the frozen lockfile. CI validates types, lint, patch patterns, catalogs and standalone desktop/browser builds. Build artifacts are universal bundles; no native installer platform matrix is claimed. Existing upstream workflow files are retained with .upstream suffix for reference and are not active on dev.

Release is manual from prod, checks the SemVer tag against package.json, creates an immutable tag at the validated commit and attaches Allicord-named ASARs, browser bundles and checksums. Development builds use separate prerelease tags. The HTTP updater derives the repository from the build's git remote, selects Allicord-named ASAR assets, and expects the release name to end in the full source SHA. Source builds continue using the inherited git updater. No release is published during setup.

The installer is external Equicord/Equilotl. Allicord requires a dedicated installer fork and runtime testing before general installation instructions can be advertised. No additional repository is created by this change.
