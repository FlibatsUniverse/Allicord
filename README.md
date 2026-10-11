# Allicord

<img src="assets/alliance.svg" width="96" alt="Alliance logo">

Allicord is an enhanced Discord client modification by Alliance, built on Equicord.

Developed by the [Alliance team](https://github.com/FlibatsUniverse), Allicord inherits Equicord and Vencord plugins, themes, settings and customization while keeping Alliance development isolated. [AllianceBot](https://github.com/FlibatsUniverse/AllianceBot) is the companion Discord bot project.

## Installation and platforms

No dedicated Allicord installer is validated or published yet. Do not use Equicord's installer expecting it to download Allicord. The source installer remains Equilotl and requires an explicit ALLICORD_USE_UPSTREAM_INSTALLER=1 opt-in for advanced local development; installation, updates and uninstallation are unverified.

Upstream targets Windows, macOS and Linux. Allicord builds universal JavaScript/ASAR bundles and browser extensions, not six native executable installers. Platform support is inherited in design and needs runtime validation. Download only verified assets from [Allicord releases](https://github.com/FlibatsUniverse/Allicord/releases).

## Build from source

Use Node.js 24 and the exact pnpm version in package.json (12.8.1). Enable Corepack or install that version, then:

```sh
git clone https://github.com/FlibatsUniverse/Allicord.git
cd Allicord
git switch dev
pnpm install --frozen-lockfile
pnpm testTsc
pnpm lint
pnpm buildStandalone
pnpm buildWebStandalone
```

Outputs are in dist/. Internal Vencord globals, Equicord extension payload filenames, protocol names and data directories are retained for compatibility. Allicord release ASAR assets and userscripts use Allicord names. No candidate Alliance domain is treated as a live website.

## Development

Add plugins under src/allicordplugins/; see [plugin development](src/allicordplugins/README.md) and [CONTRIBUTING.md](CONTRIBUTING.md). Use Conventional Commits. main is an upstream mirror, dev is Allicord integration, and prod is stable promotion after validation. See [ARCHITECTURE.md](ARCHITECTURE.md) and [UPSTREAM.md](UPSTREAM.md).

## Attribution and license

Built on [Equicord](https://github.com/Equicord/Equicord), originally [Vencord](https://github.com/Vendicated/Vencord) by Vendicated and contributors. Suncord contributed to Equicord's history. Original copyright notices, contributor badges and upstream plugin identity remain intact. Distributed under [GPL-3.0-or-later](LICENSE); redistributed dependency notices accompany builds. Alliance artwork was supplied from AllianceBot.

Allicord is not affiliated with or endorsed by Discord. Client modifications are unsupported by Discord and may carry compatibility or account risks.
