# Upstream maintenance

Direct upstream: https://github.com/Equicord/Equicord (main). Original upstream: https://github.com/Vendicated/Vencord.

main is stable Allicord and the default branch, matching Equicord's production branch convention. dev contains development work. upstream is a clean mirror of Equicord/main. The former prod branch is retained as a historical reference and is no longer used by build, release or update workflows.

sync-upstream.yml runs every six hours at minute 17 and supports manual dispatch from main. It fetches full upstream history and fast-forwards upstream. It refuses divergence and never force-pushes. GitHub schedules may be delayed. Successful runs trigger sync-development.yml through workflow_run even when bot pushes do not trigger push workflows.

Development integration merges upstream into a temporary branch, validates it with read-only permissions, and uses a separate publisher to push the validated commit and reuse one PR to dev. Conflicts leave dev unchanged and attempt to update a tracking issue. Never auto-promote unreviewed upstream changes into stable main.

Current repository settings leave issues disabled and Actions PR creation disabled. A changed upstream integration will therefore need those permissions or maintainer intervention; failures remain visible in Actions. No settings were changed by the branch migration. No-op synchronization can run with the current settings.

For conflicts, reproduce the merge on an integration branch, preserve Alliance changes and upstream attribution, run client/installer validation, and merge into dev. Promote validated development into main to publish downloads automatically. Never reset or force-push any maintenance branch. main's history includes the original mirror and all Alliance commits.
