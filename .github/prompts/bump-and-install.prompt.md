---
description: Compile the extension, package a VSIX, and install it into the running VS Code instance.
mode: agent
tools: [run_in_terminal, get_terminal_output]
---

Compile the extension, build a VSIX package, and install it into the running VS Code instance so changes take effect immediately.

## Steps

Run the following single command in the workspace root (PowerShell):

```powershell
npm version patch --no-git-tag-version && npm run compile && npx @vscode/vsce package --allow-missing-repository --no-dependencies && code --install-extension (Get-Item *.vsix | Sort-Object LastWriteTime -Descending | Select-Object -First 1).Name --force
```

## After installing

Remind the user to run **Developer: Restart Extension Host** (or reload the VS Code window with `Ctrl+Shift+P` → `Reload Window`) so the newly installed extension version is activated.

## Notes

- `--allow-missing-repository --no-dependencies` makes packaging unattended (no prompts).
- The `Get-Item *.vsix | Sort-Object LastWriteTime -Descending | Select-Object -First 1` pattern picks the newest VSIX if multiple exist from previous runs.
- Changes to `package.json` contributions (commands, grammars, languages) only take effect after the extension is reinstalled **and** the Extension Host is reloaded.
