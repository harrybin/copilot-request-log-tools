---
description: Add a new recognized section-header type to the Copilot Log Request extension (grammar, auto-detection heuristic, and sample file).
mode: agent
tools: [read_file, replace_string_in_file, run_in_terminal]
---

Add a new section name to the Copilot Log Request extension. Section names appear as `--- <Name> ---` or `### <Name>` delimiters in `.copilotlog` files.

## What the user must provide

Ask for the new section name if not already given (e.g. `"Reasoning"`, `"Output"`, `"Metadata"`).

## Files to update (all three must be changed together)

### 1. [syntaxes/copilot-request.tmLanguage.json](../../syntaxes/copilot-request.tmLanguage.json)

In the `"sections"` → `"match"` pattern, add the new name to both alternation groups (the `--- … ---` group and the `### …` group). The pattern currently reads:

```
System|Input Messages|Tools|Request Shape|Attachments|Context
```

Append `|<NewName>` inside both groups.

### 2. [src/extension.ts](../../src/extension.ts)

In `isLikelyCopilotLogRequest`, the `hasRoleSection` regex contains the same alternation list. Add `|<NewName>` there too.

### 3. [examples/sample.copilotlog](../../examples/sample.copilotlog)

Add a minimal example of the new section delimiter at the end of the file so it is exercised during manual testing:

```
--- <NewName> ---
(example content)
```

## After editing

Run `npm run compile` to verify no TypeScript errors were introduced. Changes to `package.json` are not needed for new section names — only the grammar and the heuristic regex require updating.

Remind the user to **reload the Extension Development Host** (or re-package with the bump-and-install prompt) so the grammar change takes effect.
