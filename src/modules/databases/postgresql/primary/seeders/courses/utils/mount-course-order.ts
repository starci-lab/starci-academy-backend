/**
 * Leading integer from a directory name, used to sort `modules/<n>/` folders.
 *
 * @param name - Directory entry name (e.g. `1`, `2-intro`).
 * @returns Parsed integer or `Number.MAX_SAFE_INTEGER` when none.
 */
export function leadingIntDirOrder(name: string): number {
    const match = /^(\d+)/.exec(name)
    return match ? parseInt(match[1],
        10) : Number.MAX_SAFE_INTEGER
}

/**
 * Leading integer from a flat `*.json` filename under `modules/`.
 *
 * @param filename - File name (e.g. `1.json`).
 * @returns Parsed integer or `Number.MAX_SAFE_INTEGER` when none.
 */
export function moduleJsonOrder(filename: string): number {
    const match = /^(\d+)/.exec(filename)
    return match ? parseInt(match[1],
        10) : Number.MAX_SAFE_INTEGER
}
