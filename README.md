![demo](./demo.gif)

# GH Copilot Request Log Tools

VS Code extension for:
- Formatting Copilot request artifacts extracted from GitHub Copilot logs
- Syntax highlighting for common Copilot log request structures, especially system prompt blocks

## Supported files
- `*.copilotlog`
- `*.cplog`

## Features
- Document formatter for language `copilot-request-log`
- Frontmatter normalization (ordering and spacing)
- Body normalization (trailing whitespace and blank-line compaction)
- Auto-detection for untitled files when content matches Copilot log request patterns
- Command to force language mode on any open file: `Copilot Request Log: Use Copilot Request Log Language For Active Document`
- Highlighting for:
  - Frontmatter delimiters and keys
  - Section markers like `--- System ---` or `### System`
  - Placeholders like `{{VSCODE_TARGET_SESSION_LOG}}` and `${input:htmlFile}`

## Build
```bash
npm install
npm run compile
```


## Run in VS Code
1. Open this folder in VS Code.
2. Press `F5` to launch Extension Development Host.
3. Open `examples/sample.copilotlog` and run `Format Document`.
4. For unsaved files (`Untitled-*`), run the command above if auto-detection does not switch language mode yet.

