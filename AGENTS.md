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
