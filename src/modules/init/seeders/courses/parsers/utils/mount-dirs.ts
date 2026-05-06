import fs from "fs"
import path from "path"

/**
 * Parsed `{orderIndex}-{slug}` mount folder (or legacy numeric-only `0`, `1`, …).
 */
export interface ParsedIndexedMountDir {
    orderIndex: number
    displaySlug: string
}

/**
 * Parses a child folder name under `contents/`, `challenges/`, `lession-videos/`, etc.
 */
export function parseIndexedMountDirName(
    dirName: string,
): ParsedIndexedMountDir | null {
    const m = /^(\d+)(?:-(.+))?$/.exec(dirName)
    if (!m) {
        return null
    }
    const orderIndex = parseInt(
        m[1],
        10,
    )
    const displaySlug = m[2] ?? m[1]
    return {
        orderIndex,
        displaySlug,
    }
}

/**
 * Lists distinct leading indices for indexed child directories under `parentDir`.
 */
export function listIndexedMountChildIndices(
    parentDir: string,
): Array<number> {
    if (!fs.existsSync(parentDir)) {
        return []
    }
    const indices = new Set<number>()
    for (const name of fs.readdirSync(parentDir)) {
        const full = path.join(
            parentDir,
            name,
        )
        if (!fs.statSync(full).isDirectory()) {
            continue
        }
        const parsed = parseIndexedMountDirName(name)
        if (parsed) {
            indices.add(parsed.orderIndex)
        }
    }
    return [...indices].sort(
        (
            a,
            b,
        ) => a - b,
    )
}
