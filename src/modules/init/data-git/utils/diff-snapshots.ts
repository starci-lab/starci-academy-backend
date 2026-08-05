import {
    createHash,
} from "crypto"
import {
    readdir,
    readFile,
} from "fs/promises"
import {
    existsSync,
} from "fs"
import {
    join,
} from "path"

/**
 * Recursively index every file under `root` as `relativePath -> contentHash`.
 *
 * Hashing by content (not mtime/size) makes the diff robust: a fresh tarball
 * extract resets mtimes, so only the bytes can tell whether a file truly changed.
 *
 * @param root - Absolute snapshot root to walk
 * @param dir - Relative sub-path being walked (empty at the top level)
 * @param out - Accumulator mutated in place (`relativePath -> sha1`)
 */
const indexFiles = async (
    root: string,
    dir: string,
    out: Map<string, string>,
): Promise<void> => {
    const entries = await readdir(join(root,
        dir),
    {
        withFileTypes: true,
    })
    for (const entry of entries) {
        // build the slash-joined relative path so it matches the GitHub-compare format
        const relative = dir
            ? `${dir}/${entry.name}`
            : entry.name
        if (entry.isDirectory()) {
            await indexFiles(root,
                relative,
                out)
            continue
        }
        // only regular files carry seedable content; skip symlinks/sockets/etc.
        if (!entry.isFile()) {
            continue
        }
        const bytes = await readFile(join(root,
            relative))
        out.set(relative,
            createHash("sha1").update(bytes).digest("hex"))
    }
}

/**
 * Computes the set of file paths that differ between two snapshot directories.
 *
 * A path is "changed" when it is added (in new only), removed (in old only), or
 * modified (present in both with a different content hash). Paths are returned
 * relative to the snapshot roots -- already free of any repo sub-directory prefix
 * -- so they feed straight into `parseDataGitDiff(paths, "")`.
 *
 * @param oldRoot - Absolute path of the previous snapshot (baseline)
 * @param newRoot - Absolute path of the freshly-pulled snapshot
 * @returns Changed relative paths (added + removed + modified), unsorted
 */
export const diffSnapshots = async (
    oldRoot: string,
    newRoot: string,
): Promise<Array<string>> => {
    const oldIndex = new Map<string, string>()
    const newIndex = new Map<string, string>()
    // a missing baseline yields an empty index -> every new file reads as "added"
    if (existsSync(oldRoot)) {
        await indexFiles(oldRoot,
            "",
            oldIndex)
    }
    if (existsSync(newRoot)) {
        await indexFiles(newRoot,
            "",
            newIndex)
    }
    const changed = new Set<string>()
    // added (absent in old) or modified (hash differs)
    for (const [
        path,
        hash,
    ] of newIndex) {
        if (oldIndex.get(path) !== hash) {
            changed.add(path)
        }
    }
    // removed (present in old, gone in new)
    for (const path of oldIndex.keys()) {
        if (!newIndex.has(path)) {
            changed.add(path)
        }
    }
    return [
        ...changed,
    ]
}
