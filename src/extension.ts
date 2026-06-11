import * as vscode from "vscode";

// Section headers look like:  --- System ---  or  --- Input Messages ---
const SECTION_HEADER_RE = /^---[ \t]+.+[ \t]+---$/;

function getWrapWidth(): number {
  const cfg = vscode.workspace.getConfiguration("copilotLogRequest");
  return cfg.get<number>("wrapWidth", 120);
}

export function activate(context: vscode.ExtensionContext): void {
  const provider: vscode.DocumentFormattingEditProvider = {
    provideDocumentFormattingEdits(document: vscode.TextDocument): vscode.TextEdit[] {
      const full = document.getText();
      const formatted = formatCopilotLog(full, getWrapWidth());
      if (full === formatted) {
        return [];
      }

      const fullRange = new vscode.Range(
        document.positionAt(0),
        document.positionAt(full.length)
      );

      return [vscode.TextEdit.replace(fullRange, formatted)];
    }
  };

  context.subscriptions.push(
    vscode.languages.registerDocumentFormattingEditProvider("copilot-log-request", provider)
  );

  context.subscriptions.push(
    vscode.commands.registerCommand("copilotLogRequest.useForActiveDocument", async () => {
      const editor = vscode.window.activeTextEditor;
      if (!editor) {
        return;
      }

      await vscode.languages.setTextDocumentLanguage(editor.document, "copilot-log-request");
    })
  );

  const maybeAssignLanguage = (document: vscode.TextDocument): void => {
    void maybeAssignCopilotLogLanguage(document);
  };

  for (const document of vscode.workspace.textDocuments) {
    maybeAssignLanguage(document);
  }

  context.subscriptions.push(vscode.workspace.onDidOpenTextDocument(maybeAssignLanguage));
  context.subscriptions.push(
    vscode.workspace.onDidChangeTextDocument((event) => {
      maybeAssignLanguage(event.document);
    })
  );
}

export function deactivate(): void {
  // No-op.
}

function formatCopilotLog(input: string, wrapWidth: number): string {
  const normalized = input.replace(/\r\n/g, "\n");
  const lines = normalized.split("\n");
  const result: string[] = [];
  let i = 0;

  // Top metadata block: key-value lines before the first section header
  while (i < lines.length && !SECTION_HEADER_RE.test(lines[i])) {
    result.push(lines[i].replace(/\s+$/, ""));
    i++;
  }

  // Trim trailing blanks from metadata, then add one blank line separator
  while (result.length > 0 && result[result.length - 1] === "") {
    result.pop();
  }
  if (i < lines.length) {
    result.push("");
  }

  // Sections
  while (i < lines.length) {
    const line = lines[i];
    if (SECTION_HEADER_RE.test(line)) {
      result.push(line);
      i++;

      // Collect payload lines until next section header or end of file
      const payloadLines: string[] = [];
      while (i < lines.length && !SECTION_HEADER_RE.test(lines[i])) {
        payloadLines.push(lines[i]);
        i++;
      }

      const payload = payloadLines.join("\n").trim();
      if (payload.length > 0) {
        result.push("");
        result.push(formatPayload(payload, wrapWidth));
      }
      result.push("");
    } else {
      result.push(line.replace(/\s+$/, ""));
      i++;
    }
  }

  return result.join("\n").replace(/\n{3,}/g, "\n\n").trimEnd() + "\n";
}

function sanitizeJsonControlChars(s: string): string {
  // Escape bare control characters that are invalid inside JSON strings.
  // This handles log payloads captured with literal \t, \r, \n in string values.
  let out = "";
  let inString = false;
  let escape = false;
  for (let i = 0; i < s.length; i++) {
    const ch = s[i];
    if (escape) { out += ch; escape = false; continue; }
    if (ch === "\\") { out += ch; escape = true; continue; }
    if (ch === '"') { inString = !inString; out += ch; continue; }
    if (inString) {
      const code = ch.charCodeAt(0);
      if (code === 0x09) { out += "\\t"; continue; }
      if (code === 0x0a) { out += "\\n"; continue; }
      if (code === 0x0d) { out += "\\r"; continue; }
      if (code < 0x20) { out += "\\u" + code.toString(16).padStart(4, "0"); continue; }
    }
    out += ch;
  }
  return out;
}

function formatPayload(raw: string, wrapWidth: number): string {
  const trimmed = raw.trim();
  if (trimmed.startsWith("[") || trimmed.startsWith("{")) {
    try {
      const parsed = JSON.parse(sanitizeJsonControlChars(trimmed)) as unknown;
      return prettyPrintJson(parsed, 0, wrapWidth);
    } catch {
      // Not valid JSON, return as-is
    }
  }
  return raw;
}

function prettyPrintJson(value: unknown, indent: number, wrapWidth: number): string {
  const pad = "  ".repeat(indent);
  const padInner = "  ".repeat(indent + 1);

  if (value === null) { return "null"; }
  if (typeof value === "boolean" || typeof value === "number") { return JSON.stringify(value); }

  if (typeof value === "string") {
    // When the string contains real newlines (from JSON-parsed \n sequences),
    // render them as actual line breaks for readability, with continuation indent.
    if (value.includes("\n")) {
      const parts = value.split("\n").map(part =>
        part
          .replace(/\\/g, "\\\\")
          .replace(/"/g, '\\"')
          .replace(/\r/g, "\\r")
          .replace(/\t/g, "\\t")
      );
      return `"${parts.join(`\n${padInner}`)}"`;
    }
    // For single-line strings that are very long, keep as-is (JSON-encoded).
    return JSON.stringify(value);
  }

  if (Array.isArray(value)) {
    if (value.length === 0) { return "[]"; }
    const items = value.map(item => `${padInner}${prettyPrintJson(item, indent + 1, wrapWidth)}`);
    return `[\n${items.join(",\n")}\n${pad}]`;
  }

  if (typeof value === "object") {
    const entries = Object.entries(value as Record<string, unknown>);
    if (entries.length === 0) { return "{}"; }
    const items = entries.map(([k, v]) => {
      const valStr = prettyPrintJson(v, indent + 1, wrapWidth);
      return `${padInner}${JSON.stringify(k)}: ${valStr}`;
    });
    return `{\n${items.join(",\n")}\n${pad}}`;
  }

  return JSON.stringify(value);
}


async function maybeAssignCopilotLogLanguage(document: vscode.TextDocument): Promise<void> {
  if (document.languageId === "copilot-log-request") {
    return;
  }

  if (document.uri.scheme !== "untitled") {
    return;
  }

  if (!isLikelyCopilotLogRequest(document.getText())) {
    return;
  }

  await vscode.languages.setTextDocumentLanguage(document, "copilot-log-request");
}

function isLikelyCopilotLogRequest(text: string): boolean {
  const hasRoleSection = /^---\s*(System|Input Messages|Tools|Request Shape|Attachments|Context)\s*---$/im.test(text);
  const hasTelemetryHeader = /^Request:\s+/im.test(text) && /^Model:\s+/im.test(text);
  const hasFrontmatter = /^---\n[\s\S]*\n---\n/m.test(text);
  const hasKnownFrontmatterKey = /^(description|mode|tools|model)\s*:/im.test(text);

  if (hasRoleSection && hasTelemetryHeader) {
    return true;
  }

  return hasFrontmatter && hasKnownFrontmatterKey;
}
