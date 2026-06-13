[View demo video](./demo.mp4)

# GH Copilot Request Log Tools

VS Code extension for:
- Formatting Copilot request artifacts extracted from GitHub Copilot logs
- Syntax highlighting for common Copilot log request structures, especially system prompt blocks

## Supported files
- `*.copilotlog`
- `*.cplog`
- `copilot-system.copilotlog`

## Features
- Document formatter for language `copilot-log-request`
- Frontmatter normalization (ordering and spacing)
- Body normalization (trailing whitespace and blank-line compaction)
- Auto-detection for untitled files when content matches Copilot log request patterns
- Command to force language mode on any open file: `Copilot Log Request: Use Copilot Log Request Language For Active Document`
- Highlighting for:
  - Frontmatter delimiters and keys
  - Section markers like `--- System ---` or `### System`
  - Placeholders like `{{VSCODE_TARGET_SESSION_LOG}}` and `${input:htmlFile}`

## Build
```bash
npm install
npm run compile
```

## Package and publish

1. Create a local token file from template:

```bash
cp .env.template .env
```

2. Set your Marketplace token in `.env`:

```env
MARKETPLACE_TOKEN=your_vscode_marketplace_pat
```

3. Package a VSIX:

```bash
npm run package:vscode
```

4. Publish to VS Code Marketplace:

```bash
npm run publish:vscode
```

Notes:
- `publish:vscode` matches the `visuals-mcp` token style by reading `MARKETPLACE_TOKEN` from `.env`.
- In CI, `VSCE_PAT` is also supported as a fallback.

## Run in VS Code
1. Open this folder in VS Code.
2. Press `F5` to launch Extension Development Host.
3. Open `examples/sample.copilotlog` and run `Format Document`.
4. For unsaved files (`Untitled-*`), run the command above if auto-detection does not switch language mode yet.

