const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const Module = require("node:module");

const originalLoad = Module._load;
Module._load = function patchedLoad(request, parent, isMain) {
  if (request === "vscode") {
    return {};
  }
  return originalLoad.call(this, request, parent, isMain);
};

const { formatCopilotLog, isLikelyCopilotLogRequest } = require("../out/extension.js");
const grammar = JSON.parse(
  fs.readFileSync(path.join(__dirname, "..", "syntaxes", "copilot-request.tmLanguage.json"), "utf8")
);

function getSectionRegex() {
  return new RegExp(grammar.repository.sections.match, "m");
}

function getPathRegexes() {
  return grammar.repository.paths.patterns.map((entry) => new RegExp(entry.match));
}

test("detects telemetry header plus role section", () => {
  const text = [
    "Request: chat:gpt-5.3-codex",
    "Model: gpt-5.3-codex",
    "",
    "--- System ---",
    "hello"
  ].join("\n");

  assert.equal(isLikelyCopilotLogRequest(text), true);
});

test("does not detect unrelated prose as copilot request", () => {
  const text = "this is not a request file\njust random content";
  assert.equal(isLikelyCopilotLogRequest(text), false);
});

test("formatter normalizes whitespace and preserves section content", () => {
  const input = [
    "Request: chat:gpt-5.3-codex   ",
    "Model: gpt-5.3-codex",
    "",
    "",
    "--- System ---",
    "",
    "Keep output concise.   ",
    "",
    "",
    ""
  ].join("\n");

  const output = formatCopilotLog(input, 120);

  assert.equal(
    output,
    [
      "Request: chat:gpt-5.3-codex",
      "Model: gpt-5.3-codex",
      "",
      "--- System ---",
      "",
      "Keep output concise.",
      ""
    ].join("\n")
  );
});

test("sections regex includes User Request headings", () => {
  const sectionRe = getSectionRegex();
  assert.equal(sectionRe.test("--- User Request ---"), true);
  assert.equal(sectionRe.test("### User Request"), true);
});

test("root patterns use top-metadata instead of global metadata", () => {
  const includes = grammar.patterns
    .map((entry) => entry.include)
    .filter(Boolean);

  assert.equal(includes.includes("#top-metadata"), true);
  assert.equal(includes.includes("#metadata"), false);
});

test("path regexes match relative workspace paths", () => {
  const regexes = getPathRegexes();
  const example = "src/models/person.ts";
  const matched = regexes.some((re) => re.test(example));

  assert.equal(matched, true);
});
