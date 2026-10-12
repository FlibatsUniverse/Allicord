# Allicord terminal installer

Adapted from [Equicord/Equilotl](https://github.com/Equicord/Equilotl/tree/ce3e54d9609717a7db6369fa82a8ad10781d982c), originally Vendicated's Vencord Installer, under GPL-3.0. Original copyright and license notices are retained. This source snapshot contains the terminal installer and shared installation code; GUI assets and GUI entry point are not included.

Build with Go 1.26.2: go build -mod=readonly -tags cli .
Run the downloaded executable to select a Discord installation and install, repair or uninstall Allicord. --help lists command-line options. Windows users can double-click the .exe to open the interactive terminal menu. These are unsigned builds.

Client downloads and installer self-updates both use FlibatsUniverse/Allicord releases. The client asset is Allicord-desktop.asar. Existing Equicord environment variables and data paths are retained for loader compatibility. The existing modification must be replaced rather than installed side by side in one Discord instance.

Tests exercise installation and uninstallation only in temporary simulated Discord directories, plus the release endpoint, ASAR asset selection and self-update links. Live Discord runtime and platform integration still need real-world testing.
