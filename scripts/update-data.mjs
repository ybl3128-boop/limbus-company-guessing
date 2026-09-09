import { spawn } from "node:child_process";
import { fileURLToPath } from "node:url";

const root = fileURLToPath(new URL("../", import.meta.url));
const commands = [
  ["scripts/sync-wiki.mjs", []],
  ["scripts/generate-puzzles.mjs", []],
  ["scripts/check-game-data.mjs", []],
  ["scripts/check-duplicates.mjs", []],
];

for (const [script, args] of commands) {
  await runNode(script, args);
}

console.log("Data update pipeline completed.");

function runNode(script, args) {
  return new Promise((resolve, reject) => {
    const child = spawn(process.execPath, [script, ...args], {
      cwd: root,
      stdio: "inherit",
      env: process.env,
    });
    child.on("error", reject);
    child.on("exit", (code) => {
      if (code === 0) {
        resolve();
      } else {
        reject(new Error(`${script} exited with code ${code}`));
      }
    });
  });
}
