import { readdirSync, existsSync } from "node:fs";
import { join } from "node:path";

const changesDir = join(process.cwd(), "openspec", "changes");

if (!existsSync(changesDir)) {
  console.log("No OpenSpec changes directory found.");
  process.exit(0);
}

const changes = readdirSync(changesDir, { withFileTypes: true })
  .filter((entry) => entry.isDirectory())
  .map((entry) => entry.name);

if (!changes.length) {
  console.log("No active OpenSpec changes.");
  process.exit(0);
}

console.log("Active OpenSpec changes:");
for (const change of changes) {
  console.log(`- ${change}`);
}
