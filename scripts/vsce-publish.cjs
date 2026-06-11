/**
 * Publishes to VS Code Marketplace using MARKETPLACE_TOKEN from .env.
 * Falls back to VSCE_PAT from environment (useful in CI).
 */
const { execSync } = require("child_process");
const fs = require("fs");
const path = require("path");

const repoRoot = path.join(__dirname, "..");
const envPath = path.join(repoRoot, ".env");

if (fs.existsSync(envPath)) {
  const envContent = fs.readFileSync(envPath, "utf-8");
  for (const line of envContent.split("\n")) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;
    const eqIndex = trimmed.indexOf("=");
    if (eqIndex === -1) continue;
    const key = trimmed.slice(0, eqIndex).trim();
    const value = trimmed.slice(eqIndex + 1).trim();
    if (!(key in process.env)) {
      process.env[key] = value;
    }
  }
}

const token = process.env.MARKETPLACE_TOKEN || process.env.VSCE_PAT;
if (!token) {
  console.error(
    "Error: Missing marketplace token. Set MARKETPLACE_TOKEN in .env or VSCE_PAT in environment.",
  );
  process.exit(1);
}

const pkg = JSON.parse(fs.readFileSync(path.join(repoRoot, "package.json"), "utf-8"));
console.log(`Publishing ${pkg.name}@${pkg.version} to VS Code Marketplace...`);

try {
  execSync(`npx @vscode/vsce publish --no-dependencies -p ${token}`, {
    stdio: "inherit",
    cwd: repoRoot,
  });
  console.log("Published successfully.");
} catch (e) {
  const output = [e.stderr, e.stdout, e.message]
    .map((s) => (s || "").toString())
    .join("\n");

  if (output.includes("already exists") || output.includes("Version")) {
    console.log(`Version ${pkg.version} may already be published - skipping.`);
  } else {
    process.exit(1);
  }
}
