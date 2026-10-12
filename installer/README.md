# Allicord installer

Adapted from [Equicord/Equilotl](https://github.com/Equicord/Equilotl/tree/ce3e54d9609717a7db6369fa82a8ad10781d982c), originally Vendicated's Vencord Installer, under GPL-3.0. Original copyright and license notices are retained. Includes the upstream graphical interface with Alliance branding and a separate terminal interface. The release workflow builds the Windows x64 GUI with MinGW and the terminal binaries for all six targets.

Build with Go 1.26.2: go build -mod=readonly -tags cli .
Run the downloaded executable to select a Discord installation and install, repair or uninstall Allicord. --help lists command-line options. The default Windows .exe opens the graphical installer; AllicordInstallerCli.exe opens the terminal installer. These are unsigned builds.

Client downloads and installer self-updates both use FlibatsUniverse/Allicord releases. The client asset is Allicord-desktop.asar. Explicit Equicord environment variable overrides remain compatible for development. Default Allicord data paths are separate from Equicord. The existing modification must be replaced rather than installed side by side in one Discord instance.

Tests exercise installation and uninstallation only in temporary simulated Discord directories, plus the release endpoint, ASAR asset selection and self-update links. Live Discord runtime and platform integration still need real-world testing.
