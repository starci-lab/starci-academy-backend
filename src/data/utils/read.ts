import fs from "fs"

/**
 * Read a file from the filesystem and return the contents as a string.
 * If the file does not exist, return the default value.
 * @param path - The path to the file.
 * @param defaultValue - The default value to return if the file does not exist.
 * @returns The contents of the file as a string.
 */
export const readFileOrDefault = (
    path: string, 
    defaultValue: string
) => {
    try {
        return fs.readFileSync(
            path,
            "utf8"
        )
    } catch {
        return defaultValue
    }
}