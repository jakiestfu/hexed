#!/usr/bin/env node

import { execSync } from "child_process";
import { writeFileSync, existsSync } from "fs";
import { join } from "path";

// ANSI escape codes for styling
const dim = "\x1b[2m";
const reset = "\x1b[0m";

console.log("🚀 Deploying to GitHub Pages...");

// Build web app
console.log(`${dim}  Building web app...${reset}`);
// process.env.VITE_BASE_PATH = basePath;
execSync("pnpm --filter @hexed/web build", { stdio: "inherit" });

// Create .nojekyll file in dist directory
const distPath = join(process.cwd(), "apps", "web", "dist");
const nojekyllPath = join(distPath, ".nojekyll");

if (!existsSync(distPath)) {
  console.error(`✗ Error: dist directory not found at ${distPath}`);
  process.exit(1);
}

console.log(`${dim}  Creating .nojekyll file...${reset}`);
writeFileSync(nojekyllPath, "");

// Deploy to GitHub Pages
console.log(`${dim}  Uploading to GitHub Pages...${reset}`);
execSync(`npx gh-pages -d ${distPath}`, { stdio: "inherit" });

console.log("✓ Deployment complete!");
