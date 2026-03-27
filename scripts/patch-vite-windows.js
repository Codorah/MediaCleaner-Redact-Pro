import fs from "node:fs";
import path from "node:path";

const targetPath = path.resolve("node_modules", "vite", "dist", "node", "chunks", "config.js");
const marker = 'process.env.VITE_DISABLE_WINDOWS_NET_USE !== "0"';
const originalSnippet = '\texec("net use", (error$1, stdout) => {';
const patchedSnippet = '\tif (process.env.VITE_DISABLE_WINDOWS_NET_USE !== "0") {\n\t\tsafeRealpathSync = fs.realpathSync.native;\n\t\treturn;\n\t}\n\texec("net use", (error$1, stdout) => {';

if (!fs.existsSync(targetPath)) {
  console.log("[patch-vite-windows] vite config chunk not found, skipping.");
  process.exit(0);
}

const source = fs.readFileSync(targetPath, "utf8");

if (source.includes(marker)) {
  console.log("[patch-vite-windows] patch already applied.");
  process.exit(0);
}

if (!source.includes(originalSnippet)) {
  console.warn("[patch-vite-windows] expected snippet not found, skipping.");
  process.exit(0);
}

fs.writeFileSync(targetPath, source.replace(originalSnippet, patchedSnippet), "utf8");
console.log("[patch-vite-windows] patch applied.");
