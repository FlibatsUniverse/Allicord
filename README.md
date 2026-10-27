# [<img src="./assets/alliance.svg" width="40" align="left" alt="Allicord">](https://github.com/FlibatsUniverse/Allicord) Allicord

[![Version](https://img.shields.io/github/package-json/v/FlibatsUniverse/Allicord?style=for-the-badge&logo=github&logoColor=d3869b&label=&color=1d2021&labelColor=282828)](https://github.com/FlibatsUniverse/Allicord/releases/latest)
[![Build](https://img.shields.io/github/actions/workflow/status/FlibatsUniverse/Allicord/build.yml?branch=main&style=for-the-badge&logo=githubactions&logoColor=d3869b&label=Build&labelColor=282828)](https://github.com/FlibatsUniverse/Allicord/actions/workflows/build.yml)
[![License](https://img.shields.io/badge/License-GPL--3.0--or--later-1d2021?style=for-the-badge&logo=gnu&logoColor=d3869b&labelColor=282828)](LICENSE)

The undisputed cutest Discord client mod

## Features

-   Easy to install, with a graphical installer for Windows and terminal installers for every platform
-   Hundreds of built-in plugins, plus plugins made for Allicord
-   Badges for Allicord and other client mods, built in
-   Run Allicord in your browser through an extension or a userscript
-   Works on any Discord branch: Stable, Canary and PTB all work
-   Custom CSS and themes: an inbuilt CSS editor that can import any CSS file, including BetterDiscord themes
-   Privacy friendly: blocks Discord analytics and crash reporting out of the box and has no telemetry
-   Update channels: stay on stable releases, or follow the `dev` and `dev2` builds
-   Settings sync: keep your plugins and their settings in step between devices and apps (optional)

## Installing, repairing and uninstalling

Download the installer for your platform. The Windows x64 download is an unsigned **graphical installer** adapted from the Vencord Installer. Windows users can double-click the .exe, select their Discord installation, and choose Install, Repair or Uninstall. Close Discord before making changes, then restart it afterward. Installation and uninstallation are tested with simulated Discord files; live Discord and cross-platform runtime validation remain ongoing.

| Platform | x64 | ARM64 |
| --- | --- | --- |
| Windows GUI | [Download .exe](https://github.com/FlibatsUniverse/Allicord/releases/latest/download/AllicordInstaller.exe) | Use the ARM64 CLI below |
| Windows CLI | [Download](https://github.com/FlibatsUniverse/Allicord/releases/latest/download/AllicordInstallerCli.exe) | [Download](https://github.com/FlibatsUniverse/Allicord/releases/latest/download/AllicordInstallerCli-arm64.exe) |
| macOS CLI | [Download](https://github.com/FlibatsUniverse/Allicord/releases/latest/download/AllicordInstaller-macos-x64) | [Download](https://github.com/FlibatsUniverse/Allicord/releases/latest/download/AllicordInstaller-macos-arm64) |
| Linux CLI | [Download](https://github.com/FlibatsUniverse/Allicord/releases/latest/download/AllicordInstaller-linux-x64) | [Download](https://github.com/FlibatsUniverse/Allicord/releases/latest/download/AllicordInstaller-linux-arm64) |

On macOS and Linux, run `chmod +x` on the downloaded file and launch it from your terminal. `--help` lists the options, including `--install`, `--repair` and `--uninstall`. The installer downloads Allicord's own client bundle and verifies its SHA-256 checksum before replacing an existing build. Existing installations are identified by the actual client loaded by Discord, so other client mods are labeled by their own name. Allicord uses a separate data folder and client bundle; installing it replaces the modification only in the selected Discord installation. Previous Allicord settings stored in the old shared Equicord folder, and settings exported from Vencord, can be transferred with settings export/import.

## Browser and client downloads

| Download | Link |
| --- | --- |
| Chromium extension | [ZIP](https://github.com/FlibatsUniverse/Allicord/releases/latest/download/Allicord-extension-chrome.zip) |
| Firefox extension | [ZIP](https://github.com/FlibatsUniverse/Allicord/releases/latest/download/Allicord-extension-firefox.zip) |
| Userscript | [Allicord.user.js](https://github.com/FlibatsUniverse/Allicord/releases/latest/download/Allicord.user.js) |
| Desktop client bundle | [ASAR](https://github.com/FlibatsUniverse/Allicord/releases/latest/download/Allicord-desktop.asar) |
| Equibop client bundle | [ASAR](https://github.com/FlibatsUniverse/Allicord/releases/latest/download/Allicord-equibop.asar) |
| Source code | [Archive](https://github.com/FlibatsUniverse/Allicord/releases/latest/download/Allicord-source.tar.gz) |
| Checksums | [SHA256SUMS](https://github.com/FlibatsUniverse/Allicord/releases/latest/download/SHA256SUMS) |

Load the Chromium ZIP unpacked through your browser's extension developer mode. Firefox unsigned extensions require a browser edition or configuration that supports them. ASAR downloads are client bundles; use the installer to patch Discord. All links refer to this repository's latest successfully validated release.

## Release channels

`main` holds stable Allicord code and is the default branch. Every `main` push is validated, then automatically published with its client bundles, a Windows graphical installer and six terminal installers. Failed builds are not released. Release tags use the package's semantic version with unique build metadata, for example `v0.1.0+build.12`, and keep their exact source commit.

`dev` and `dev2` are the development branches. Their builds are published as prereleases, and you can follow them from the update channel setting in Allicord's Updater tab. See [UPSTREAM.md](UPSTREAM.md) for how upstream changes are merged.

## Installing an Allicord dev build

### Dependencies

[Git](https://git-scm.com/download) and [Bun](https://bun.sh/) 1.3.14 or newer are required.

Install Bun from [bun.sh](https://bun.sh/docs/installation), then close and reopen your terminal so `bun` is in your PATH.

> :exclamation: **IMPORTANT** Make sure you aren't using an admin/root terminal from here onwards. It **will** mess up your Discord/Allicord instance and you **will** most likely have to reinstall.

Clone Allicord:

```shell
git clone https://github.com/FlibatsUniverse/Allicord.git
cd Allicord
git switch dev
```

Install dependencies:

```shell
bun install --frozen-lockfile
```

Check and build Allicord:

```shell
bun run testTsc
bun run lint
bun run buildStandalone
```

Build Allicord for web:

```shell
bun run buildWebStandalone
```

Outputs are in `dist/`. After building the web extension, find the matching ZIP file in `dist` and follow your browser's guide for installing custom extensions, if it supports them.

To build the terminal installer, use Go 1.26.2 in `installer/` with `go build -mod=readonly -tags cli .`.

## Contributing

Custom Alliance plugins live under `src/allicordplugins/`. See [CONTRIBUTING.md](CONTRIBUTING.md), the [plugin guide](src/allicordplugins/README.md) and [ARCHITECTURE.md](ARCHITECTURE.md). Use Conventional Commits.

## Credits

Allicord is built on [Equicord](https://github.com/Equicord/Equicord), a fork of [Vencord](https://github.com/Vendicated/Vencord) by Vendicated and contributors. The installer is adapted from the [Vencord Installer](https://github.com/Vencord/Installer). Original notices and contributor identities are retained. See [LICENSE](LICENSE), [installer attribution](installer/README.md), and the dependency notices supplied with releases. Alliance artwork was supplied from AllianceBot.

## Star History

<a href="https://star-history.com/#FlibatsUniverse/Allicord&Timeline">
  <picture>
    <source media="(prefers-color-scheme: dark)" srcset="https://api.star-history.com/svg?repos=FlibatsUniverse/Allicord&type=Timeline&theme=dark" />
    <source media="(prefers-color-scheme: light)" srcset="https://api.star-history.com/svg?repos=FlibatsUniverse/Allicord&type=Timeline" />
    <img alt="Star History Chart" src="https://api.star-history.com/svg?repos=FlibatsUniverse/Allicord&type=Timeline" />
  </picture>
</a>

</details>
