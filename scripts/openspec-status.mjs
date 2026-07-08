import { execSync } from "node:child_process";
import { existsSync } from "node:fs";
import { join } from "node:path";

const root = process.cwd();
const openspecBin = join(root, "node_modules", ".bin", process.platform === "win32" ? "openspec.CMD" : "openspec");

function readOpenSpecList() {
  if (!existsSync(openspecBin)) {
    throw new Error("未找到本地 OpenSpec CLI，请先运行 pnpm install。");
  }

  const output = execSync(`"${openspecBin}" list --json`, {
    cwd: root,
    encoding: "utf8",
    stdio: ["ignore", "pipe", "pipe"],
    shell: true
  });
  const jsonStart = output.indexOf("{");

  if (jsonStart < 0) {
    throw new Error("OpenSpec CLI 未返回 JSON 状态。");
  }

  return JSON.parse(output.slice(jsonStart));
}

let changes;

try {
  changes = readOpenSpecList().changes ?? [];
} catch (error) {
  console.error(error instanceof Error ? error.message : String(error));
  process.exit(1);
}

if (!changes.length) {
  console.log("No active OpenSpec changes.");
  process.exit(0);
}

console.log("Active OpenSpec changes:");

const readyToArchive = changes.filter((change) => change.status === "complete");
const inProgress = changes.filter((change) => change.status !== "complete");

if (readyToArchive.length) {
  console.log("\nReady to archive:");
  for (const change of readyToArchive) {
    console.log(`- ${change.name} (${change.completedTasks}/${change.totalTasks} tasks)`);
  }
  console.log("\nArchive one change with: pnpm spec:archive <change-id>");
}

if (inProgress.length) {
  console.log("\nIn progress:");
  for (const change of inProgress) {
    console.log(`- ${change.name} (${change.completedTasks}/${change.totalTasks} tasks)`);
  }
}
