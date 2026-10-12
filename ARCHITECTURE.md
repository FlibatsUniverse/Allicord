# Architecture

Allicord is a genuine GitHub fork of Equicord, with Vencord as the root source. Upstream APIs, renderer globals, plugin directories, protocols and settings formats remain compatible. Copyright notices and GPL licensing are preserved.

Alliance plugins live in src/allicordplugins/, with renderer discovery, native companions and combined plugin catalog integration. They use the existing PluginManager and Settings APIs. Original Equicord/Vencord plugin and contributor identities remain intact.

main is stable Allicord and the default branch. dev is development and upstream is the clean Equicord mirror. prod is a retained historical reference. Every push to main/dev runs client validation and installer tests/builds. Only successful main push runs can trigger automatic stable publication.

Client builds use Node 24, pnpm 12.8.1 and the frozen lockfile. The terminal installer source in installer/ is adapted from a pinned Equilotl commit under GPL, with Go 1.26.2 and a locked module graph. Six CGO-free CLI binaries are cross-compiled for Windows, macOS and Linux x64/ARM64. Tests check temporary-file installation/uninstallation and valid/invalid downloaded client checksums. Cross-compilation does not establish live platform compatibility.

release.yml uses workflow_run from Allicord Build on main, restricts the source to successful trusted push runs, and downloads artifacts from that exact run. A read-only packaging job collects notices, source archives and SHA-256 checksums. A separate write job verifies checksums and publishes an immutable source tag with SemVer build metadata. Repeated publication of the same tag is skipped. Older queued builds do not replace the latest release pointer.

The client HTTP updater derives the repository from its build remote and selects Allicord-named ASARs. Release names end in the full source SHA. The installer and its self-updater use the same Allicord release repository. Client downloads are checksum-verified before replacing an existing ASAR. Equicord environment variables and data paths remain for loader compatibility. Installation into a real Discord client is still subject to runtime validation.

prerelease.yml remains an optional manual development build, separate from stable main releases. Private security reporting and branch/tag protection settings remain maintainer responsibilities.
