#!/usr/bin/env node
// ESM version of the Codex scrubber
import fs from "node:fs";
import path from "node:path";


const exts = new Set([
  ".ts",".tsx",".js",".jsx",".mjs",".cjs",
  ".css",".scss",".sass",".less",".html",
  ".json",".yml",".yaml",".env",".txt",
  ".md",".mdx"
]);

const SKIP_DIRS = new Set([".git","node_modules",".next","dist","build",".vercel",".cache",".turbo"]);

function* walk(dir) {
  for (const name of fs.readdirSync(dir)) {
    if (SKIP_DIRS.has(name)) continue;
    const p = path.join(dir, name);
    const st = fs.statSync(p);
    if (st.isDirectory()) yield* walk(p);
    else yield p;
  }
}

function isCodeLike(p){ return exts.has(path.extname(p).toLowerCase()); }

function scrubText(text, filePath) {
  const isMarkdown = filePath.endsWith(".md") || filePath.endsWith(".mdx");
  let out = text;

  // 1) Strip triple-backtick code fences in NON-markdown files
  if (!isMarkdown) {
    out = out.replace(/```[\s\S]*?```/g, "");
  }

  // 2) Remove common chat/diff artifacts
  out = out
    .replace(/^\s*main,?\s*$/gmi, "")
    .replace(/^[ \t]*(?:code|src|app|pages|public|components|lib|server)\/[^\n]*$/gmi, "")
    .replace(/^[ \t]*(?:File|Filename|Path)\s*:\s*.*$/gmi, "")
    .replace(/^diff --git.*$/gmi, "")
    .replace(/^index [0-9a-f]+\.\.[0-9a-f]+.*$/gmi, "")
    .replace(/^--- a\/.*$/gmi, "")
    .replace(/^\+\+\+ b\/.*$/gmi, "")
    .replace(/^@@ .* @@.*$/gmi, "")
    // drop leading + / - from pasted diffs (best‑effort)
    .replace(/^[+-](?=[^+\-*/=].*)/gmi, "");

  // 3) Collapse accidental multiple blank lines
  out = out.replace(/\n{3,}/g, "\n\n");
  return out;
}

// Execute scrubbing across repo
let changed = 0;
for (const file of walk(process.cwd())) {
  if (!isCodeLike(file)) continue;
  const orig = fs.readFileSync(file, "utf8");
  const scrb = scrubText(orig, file);
  if (scrb !== orig) {
    fs.writeFileSync(file, scrb, "utf8");
    changed++;
  }
}

console.log(`scrub-codex: cleaned ${changed} file(s).`);
