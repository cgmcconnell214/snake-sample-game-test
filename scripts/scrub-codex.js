#!/usr/bin/env node
/* Scrubs chat/agent artifacts from source files before commit. */
const fs = require("fs");
const path = require("path");

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

  // 2) Remove common “chat dump” headers/paths and diff artifacts
  out = out
    // lines like "main," or "main"
    .replace(/^\s*main,?\s*$/gmi, "")
    // stray path lines like "code/..., src/..., pages/..." (standalone lines)
    .replace(/^[ \t]*(?:code|src|app|pages|public|components|lib|server)\/[^\n]*$/gmi, "")
    // “File:” / “Path:” labels
    .replace(/^[ \t]*(?:File|Filename|Path)\s*:\s*.*$/gmi, "")
    // diff/unified patch headers
    .replace(/^diff --git.*$/gmi, "")
    .replace(/^index [0-9a-f]+\.\.[0-9a-f]+.*$/gmi, "")
    .replace(/^--- a\/.*$/gmi, "")
    .replace(/^\+\+\+ b\/.*$/gmi, "")
    .replace(/^@@ .* @@.*$/gmi, "")
    // leading + / - from pasted diffs (but keep legitimate TypeScript import lines, etc.)
    .replace(/^[+-](?=[^+\-*/=].*)/gmi, (m, i, s) => {
      // if the line looks like diff noise, drop the plus/minus
      return "";
    })
    // “```ts title=..” or “```json title=..” fence markers
    .replace(/^```[a-z0-9-]+.*$/gmi, "")
    .replace(/^```$/gmi, "");

  // 3) Try to heal JSON-ish blobs (remove trailing commas)
  if (filePath.endsWith(".json")) {
    // remove // and /* */ comments
    out = out.replace(/\/\/.*$/gm, "").replace(/\/\*[\s\S]*?\*\//g, "");
    // remove trailing commas before ] or }
    out = out.replace(/,(\s*[\]}])/g, "$1");
    // best-effort min check
    try { JSON.parse(out); } catch { /* leave as-is if still invalid */ }
  }

  // 4) Collapse accidental multiple blank lines
  out = out.replace(/\n{3,}/g, "\n\n");

  return out;
}

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
