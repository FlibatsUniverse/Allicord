# Upstream maintenance

Direct upstream: https://github.com/Equicord/Equicord (main). Original upstream: https://github.com/Vendicated/Vencord.

main is stable Allicord, the default branch and production. dev contains development work. There are no prod or upstream branches.

To pull in Equicord changes, add Equicord as a local remote, merge its main into dev, resolve conflicts while preserving Alliance changes and upstream attribution, run client and installer validation, then promote dev into main to publish downloads automatically.

```sh
git remote add upstream https://github.com/Equicord/Equicord.git
git fetch upstream
git switch dev
git merge upstream/main
```

Never reset or force-push main or dev.
