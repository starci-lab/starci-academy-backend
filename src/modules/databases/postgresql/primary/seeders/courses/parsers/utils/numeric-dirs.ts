import fs from "fs"

/**
 * Lists immediate child directories whose names are non-negative integers, sorted ascending.
 *
 * @param dirPath - Absolute path to the parent directory
 * @returns Sorted indices; empty if missing or not a directory
 */
export const listNumericChildDirectoryIndices = (
    dirPath: string,
): Array<number> => {
    if (!fs.existsSync(dirPath)) {
        return []
    }
    const entries = fs.readdirSync(
        dirPath,
        {
            withFileTypes: true,
        },
    )
    const indices: Array<number> = []
    for (const entry of entries) {
        if (!entry.isDirectory()) {
            continue
        }
        const n = Number.parseInt(
            entry.name,
            10,
        )
        if (Number.isNaN(n) || n < 0 || String(n) !== entry.name) {
            continue
        }
        indices.push(n)
    }
    indices.sort(
        (a, b) => a - b,
    )
    return indices
}
