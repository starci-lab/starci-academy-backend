#!/usr/bin/env node

/**
 * Canonical backend gate entrypoint.
 *
 * This first slice deliberately runs only checks that are already authoritative
 * in this repository. Business-policy and semantic gates are added here only
 * after their operation inventory and fixture contract are approved; an
 * orchestration command must never claim to prove a policy it does not scan.
 */

import { spawnSync } from "node:child_process";

const commands = [
    {
        name: "lint:check",
        command: process.platform === "win32" ? "npm.cmd" : "npm",
        args: ["run", "lint:check"],
    },
    {
        name: "build",
        command: process.platform === "win32" ? "npm.cmd" : "npm",
        args: ["run", "build"],
    },
];

for (const step of commands) {
    console.log(`\n[gate] ${step.name}`);
    const command = process.platform === "win32" ? (process.env.ComSpec ?? "cmd.exe") : step.command;
    const args = process.platform === "win32"
        ? ["/d", "/s", "/c", [step.command, ...step.args].join(" ")]
        : step.args;
    const result = spawnSync(command, args, {
        stdio: "inherit",
        shell: false,
    });
    if (result.error) {
        console.error(`[gate] ${step.name} could not start: ${result.error.message}`);
        process.exit(1);
    }
    if (result.status !== 0) {
        console.error(`[gate] ${step.name} failed with exit code ${result.status}`);
        process.exit(result.status ?? 1);
    }
}

console.log("\nbackend gates: OK");
