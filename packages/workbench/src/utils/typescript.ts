import ts from "typescript"

/**
 * Validates TypeScript code and returns whether it has any errors.
 * Uses the same compiler options as Monaco editor setup.
 *
 * @param code - The TypeScript code to validate
 * @returns `true` if the code has no errors, `false` if errors exist
 */
export const validateTypeScript = (code: string): boolean => {
  const result = ts.transpileModule(code, {
    compilerOptions: {
      target: ts.ScriptTarget.ES2020,
      module: ts.ModuleKind.ESNext,
      moduleResolution: ts.ModuleResolutionKind.NodeJs,
      lib: ["es2022", "dom", "dom.iterable"],
      strict: true,
      esModuleInterop: true,
      skipLibCheck: true,
      resolveJsonModule: true,
      allowSyntheticDefaultImports: true,
      allowNonTsExtensions: true,
      noEmit: true,
      isolatedModules: true
    },
    fileName: "user.ts",
    reportDiagnostics: true
  })
  console.log("Errors?", result)
  // Filter to only error-level diagnostics (ignore warnings)
  const errors = result.diagnostics?.filter(
    (diagnostic) => diagnostic.category === ts.DiagnosticCategory.Error
  )

  return errors === undefined || errors.length === 0
}
