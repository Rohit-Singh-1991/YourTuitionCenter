#!/usr/bin/env node
import { spawnSync } from "node:child_process";
import { mkdirSync } from "node:fs";

const baseUrl = process.env.PLAYWRIGHT_BASE_URL || "https://teachnation.in";
const output = process.env.PLAYWRIGHT_CODEGEN_OUTPUT || "tests/e2e/recorded.spec.ts";
mkdirSync("tests/e2e", { recursive: true });

const command = process.platform === "win32" ? "npx.cmd" : "npx";
const args = [
  "--yes",
  "playwright@latest",
  "codegen",
  "--target=playwright-test",
  "-o",
  output,
  baseUrl,
  ...process.argv.slice(2),
];

const result = spawnSync(command, args, { stdio: "inherit", shell: process.platform === "win32" });
if (result.error) {
  console.error(`Could not start Playwright Codegen: ${result.error.message}`);
  process.exit(1);
}
process.exit(result.status ?? 1);
