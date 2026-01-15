#!/usr/bin/env node

import { readFileSync, writeFileSync, existsSync } from "fs"
import { join, dirname } from "path"
import { fileURLToPath } from "url"

const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)

// Paths relative to this script's location
const packageJsonPath = join(__dirname, "..", "package.json")
const publicPackageJsonPath = join(__dirname, "..", "package.public.json")

try {
  // Check if package.json exists
  if (!existsSync(packageJsonPath)) {
    console.error(`Error: package.json not found at ${packageJsonPath}`)
    process.exit(1)
  }

  // Read and parse package.json
  const packageJsonContent = readFileSync(packageJsonPath, "utf-8")
  const packageJson = JSON.parse(packageJsonContent)

  // Extract only the specified fields
  const publicPackage = {
    name: packageJson.name,
    version: packageJson.version,
    description: packageJson.description,
    repository: packageJson.repository
  }

  // Write to package.public.json with proper formatting
  const publicPackageJsonContent = JSON.stringify(publicPackage, null, 2)
  writeFileSync(publicPackageJsonPath, publicPackageJsonContent + "\n", "utf-8")

  console.log(`Created ${publicPackageJsonPath}`)
} catch (error) {
  console.error("Error creating public package.json:", error.message)
  process.exit(1)
}
