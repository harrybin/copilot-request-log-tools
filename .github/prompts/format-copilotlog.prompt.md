---
description: Run the Copilot Log Request formatter on one or more .copilotlog / .cplog files and report any issues.
mode: agent
tools: [read_file, run_in_terminal, get_errors]
---

You are helping validate and apply the Copilot Log Request document formatter.

## Steps

1. If the user named a specific file, use that. Otherwise, operate on all `*.copilotlog` and `*.cplog` files in the workspace.

2. For each file:
   - Read its current content.
   - Open it in VS Code (or confirm it is already open).
   - Run **Format Document** (`editor.action.formatDocument`) on it.
   - Read the file again after formatting.
   - Report whether anything changed and summarise the normalizations applied (frontmatter key reordering, trailing whitespace removal, blank-line collapsing, list-prefix normalization).

3. Check for compile errors with `npm run compile` and report any TypeScript errors from `src/extension.ts`.

4. If no files were changed, confirm the files are already well-formatted.

## Formatter rules (from [src/extension.ts](../../src/extension.ts))

- CRLF → LF
- Trailing whitespace stripped from every line
- 3+ consecutive blank lines collapsed to 2
- List-item prefix normalized to `- `
- Frontmatter keys reordered: `description`, `mode`, `tools`, `model`; unknown keys sorted alphabetically after known ones
- Frontmatter values: internal whitespace collapsed to single space
