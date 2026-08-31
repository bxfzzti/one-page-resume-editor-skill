import { spawn } from "node:child_process";
import { readFile, writeFile } from "node:fs/promises";
import { join } from "node:path";

const generatedConfigFiles = ["next-env.d.ts", "tsconfig.json"];

async function run() {
  const originals = new Map<string, string>();
  for (const relativePath of generatedConfigFiles) {
    const path = join(process.cwd(), relativePath);
    originals.set(path, await readFile(path, "utf8"));
  }

  let exitCode = 1;
  try {
    exitCode = await new Promise<number>((resolve, reject) => {
      const executable = process.platform === "win32" ? "npx.cmd" : "npx";
      const child = spawn(
        executable,
        ["playwright", "test", ...process.argv.slice(2)],
        { env: process.env, stdio: "inherit" },
      );
      child.once("error", reject);
      child.once("exit", (code) => resolve(code ?? 1));
    });
  } finally {
    await Promise.all(
      [...originals].map(([path, content]) => writeFile(path, content)),
    );
  }

  process.exitCode = exitCode;
}

void run();
