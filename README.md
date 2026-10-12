# Allicord

<img src="assets/alliance.svg" width="96" alt="Alliance logo">

Allicord is an enhanced Discord client modification by Alliance, built on [Equicord](https://github.com/Equicord/Equicord) and [Vencord](https://github.com/Vendicated/Vencord).

[![Build](https://github.com/FlibatsUniverse/Allicord/actions/workflows/build.yml/badge.svg?branch=main)](https://github.com/FlibatsUniverse/Allicord/actions/workflows/build.yml)
[Latest release](https://github.com/FlibatsUniverse/Allicord/releases/latest) · [Alliance projects](https://github.com/FlibatsUniverse) · [AllianceBot](https://github.com/FlibatsUniverse/AllianceBot)

## Installing, repairing and uninstalling

Download the installer for your platform. The Windows x64 download is an unsigned **graphical installer** adapted from Equilotl. Windows users can double-click the .exe, select their Discord installation, and choose Install, Repair or Uninstall. Close Discord before making changes, then restart it afterward. Installation and uninstallation are tested with simulated Discord files; live Discord and cross-platform runtime validation remain ongoing.

| Platform | x64 | ARM64 |
| --- | --- | --- |
| Windows GUI | [Download .exe](https://github.com/FlibatsUniverse/Allicord/releases/latest/download/AllicordInstaller.exe) | Use the ARM64 CLI below |
| Windows CLI | [Download](https://github.com/FlibatsUniverse/Allicord/releases/latest/download/AllicordInstallerCli.exe) | [Download](https://github.com/FlibatsUniverse/Allicord/releases/latest/download/AllicordInstallerCli-arm64.exe) |
| macOS CLI | [Download](https://github.com/FlibatsUniverse/Allicord/releases/latest/download/AllicordInstaller-macos-x64) | [Download](https://github.com/FlibatsUniverse/Allicord/releases/latest/download/AllicordInstaller-macos-arm64) |
| Linux CLI | [Download](https://github.com/FlibatsUniverse/Allicord/releases/latest/download/AllicordInstaller-linux-x64) | [Download](https://github.com/FlibatsUniverse/Allicord/releases/latest/download/AllicordInstaller-linux-arm64) |

On macOS/Linux, run chmod +x on the downloaded file and launch it from your terminal. --help lists options, including --install, --repair and --uninstall. The installer downloads Allicord's own client bundle and verifies its SHA-256 checksum before replacing an existing build. Existing installations are identified by the actual client loaded by Discord, so Equicord is labeled as Equicord. Allicord uses a separate data folder and client bundle; installing it replaces the modification only in the selected Discord installation. Previous Allicord settings stored in the old shared Equicord folder can be transferred with settings export/import.

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

Load the Chromium ZIP unpacked through your browser's extension developer mode. Firefox unsigned extensions require a browser edition/configuration that supports them. ASAR downloads are client bundles; use the installer to patch Discord. All links refer to this repository's latest successfully validated release.

## Automatic releases

main contains stable Allicord code and is the default branch. Every main push is validated, then automatically published with its client bundles and a Windows graphical installer and six terminal installers. Failed builds are not released. Release tags use the package's semantic version with unique build metadata, for example v0.1.0+build.12, and retain their exact source commit. dev is the development branch. See [UPSTREAM.md](UPSTREAM.md) for how Equicord changes are merged.

## Build and contribute

Use Node.js 24 and pnpm 12.8.1:

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

Outputs are in dist/. To build the terminal installer, use Go 1.26.2 in installer/ with go build -mod=readonly -tags cli . Custom Alliance plugins live under src/allicordplugins/. See [CONTRIBUTING.md](CONTRIBUTING.md), the [plugin guide](src/allicordplugins/README.md), and [ARCHITECTURE.md](ARCHITECTURE.md). Use Conventional Commits.

## Attribution and license

Built on Equicord, originally Vencord by Vendicated and contributors, with Suncord contributing to Equicord's history. The terminal installer is adapted from [Equilotl](https://github.com/Equicord/Equilotl), originally the Vencord Installer. Original notices and contributor identities are retained. See [LICENSE](LICENSE), [installer attribution](installer/README.md), and the dependency notices supplied with releases. Alliance artwork was supplied from AllianceBot.

Allicord is not affiliated with or endorsed by Discord. Client modifications are unsupported by Discord and may carry compatibility or account risks.
