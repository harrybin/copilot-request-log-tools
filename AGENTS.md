# GH Copilot Request Log Tools — Agent Instructions

VS Code extension that provides syntax highlighting and document formatting for Copilot request artifacts captured from log files (`.copilotlog`, `.cplog`).

## Build & Run

```bash
npm install
npm run compile       # single build
npm run watch         # incremental watch
```

To test manually: press **F5** in VS Code to launch the Extension Development Host, then open `examples/sample.copilotlog` and run **Format Document**.

To package and install locally:
```powershell
npm version patch --no-git-tag-version && npm run compile && npx @vscode/vsce package --allow-missing-repository --no-dependencies && code --install-extension (Get-Item *.vsix | Sort-Object LastWriteTime -Descending | Select-Object -First 1).Name --force
```

There are no automated tests beyond `npm run compile`.

## Project structure

| Path | Purpose |
|---|---|
| [src/extension.ts](src/extension.ts) | All extension logic: activation, formatter, language auto-detection |
| [syntaxes/copilot-request.tmLanguage.json](syntaxes/copilot-request.tmLanguage.json) | TextMate grammar for syntax highlighting |
| [language-configuration.json](language-configuration.json) | Language bracket/comment configuration |
| [package.json](package.json) | Extension manifest; contributions (commands, languages, grammars) |
| [examples/sample.copilotlog](examples/sample.copilotlog) | Reference file for manual testing |

## Key conventions

- **Single source file**: all TypeScript logic lives in `src/extension.ts`. Do not split into multiple files unless the file grows substantially.
- **Frontmatter key order**: `description`, `mode`, `tools`, `model` — defined by `HEADER_ORDER` in `extension.ts`. Unknown keys are sorted alphabetically after known ones.
- **Formatter behaviour**: normalizes CRLF→LF, strips trailing whitespace, collapses 3+ blank lines to 2, normalises list-item prefix to `- `.
- **Language auto-detection** applies only to `untitled:` scheme documents. File-based `.copilotlog`/`.cplog` files get the language from the extension contribution in `package.json`.
- **`isLikelyCopilotLogRequest`** heuristic: triggers on a role section line (`--- System ---` etc.) + telemetry header, OR frontmatter + a known frontmatter key.
- **No runtime dependencies** — only `@types/node`, `@types/vscode`, and `typescript` as devDependencies.
- Output goes to `out/` (gitignored by convention); compiled from `src/` with `commonjs`/`ES2020` target.

## Common pitfalls

- Changes to `package.json` contributions (commands, grammars, languages) require re-packaging or reloading the Extension Development Host — a compile alone is not sufficient.
- The grammar file uses `text.html.markdown` as a base grammar fallback; ensure TextMate scope names follow the `*.copilot-log-request` suffix convention.
- When modifying the formatter, verify both frontmatter-present and frontmatter-absent code paths, and check the `normalizeBody` blank-line collapsing logic independently.

## Agent workflow guardrails

- **Task-first execution**: when a matching VS Code task exists (compile/package/install), prefer running the task over ad hoc shell commands.
- **Always verify current file state first**: before iterative doc/media edits (especially `README.md`), re-read at minimum the first 50 lines of the file (or through the end of the first H2 section, whichever is longer) to confirm current state before patching only the targeted block.
- **GitHub README compatibility**: prefer GitHub-safe Markdown constructs. Do not rely on HTML video embedding in `README.md`; use GIF/image or a link fallback.
- **No "done" without runtime proof**: before reporting completion for user-visible behavior changes (grammar, highlighting, language config, contributions), paste the actual terminal output of the compile/package command and describe the exact observed behavior (for example, a token scope shown in VS Code hover or a color applied to a specific line in `sample.copilotlog`).

## Validation checklist for grammar/contribution changes

When editing `syntaxes/copilot-request.tmLanguage.json`, `package.json` contributions, or `language-configuration.json`, complete all steps:

1. Run compile (`npm run compile` or workspace compile task).
2. Re-package and reinstall the VSIX (or run Extension Development Host via F5 when appropriate).
3. Validate behavior in `examples/sample.copilotlog`.
4. Report what was verified (command/task run + file opened + expected behavior observed).
