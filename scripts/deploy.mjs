#!/usr/bin/env node

import { execSync } from "child_process";
import { writeFileSync, existsSync } from "fs";
import { join } from "path";

console.log("Building web app...");
// process.env.VITE_BASE_PATH = basePath;
execSync("pnpm --filter @hexed/web build", { stdio: "inherit" });

// Create .nojekyll file in dist directory
const distPath = join(process.cwd(), "apps", "web", "dist");
const nojekyllPath = join(distPath, ".nojekyll");

if (!existsSync(distPath)) {
  console.error(`Error: dist directory not found at ${distPath}`);
  process.exit(1);
}

console.log("Creating .nojekyll file...");
writeFileSync(nojekyllPath, "");

// Deploy to GitHub Pages
console.log("Deploying to GitHub Pages...");
execSync(`npx gh-pages -d ${distPath}`, { stdio: "inherit" });

console.log("Deployment complete!");
