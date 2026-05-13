import type {
    Dirent,
} from "fs"

/**
 * Keep only directory entries from a `readdir` result.
 */
export const filterDirectories = (
    entries: Array<Dirent>,
): Array<Dirent> => {
    return entries.filter((entry) => entry.isDirectory())
}
