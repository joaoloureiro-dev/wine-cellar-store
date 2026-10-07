import { execSync } from "node:child_process";

/** Seeds the e2e accounts before the suite (see seed-users.ts). */
export default function globalSetup() {
    execSync("npx tsx tests/e2e/seed-users.ts", { stdio: "inherit" });
}
