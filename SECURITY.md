# Security

Do not post vulnerabilities, credentials or exploit details in public issues. Use GitHub private vulnerability reporting if the repository Security tab provides it. A dedicated Alliance security contact has not yet been supplied; maintainers must enable private reporting or publish a verified private contact before accepting reports. Upstream-only reports should follow the relevant upstream security policy.

Keep credentials out of patches. Actions use job-specific permissions; untrusted pull requests build without write tokens. Stable publication automatically follows successful trusted main push builds, using a separate publisher job. Configure review requirements on main to control promotion into production. Preserve GPL source and dependency notices when redistributing builds.
