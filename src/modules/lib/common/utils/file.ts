import fs from "node:fs"
/**
 * Read a JSON file and return the parsed object, or an empty object if the file does not exist.
 * @param path - The path to the file.
 * @returns The parsed object, or an empty object if the file does not exist.
 */
export const readJsonFileOrDefault = <T extends Partial<object>>(path: string): T => {
    try {
        return JSON.parse(
            fs.readFileSync(
                path,
                "utf8"
            )
        ) as T
    } catch {
        return {
        } as T
    }
}

/**
 * Read a markdown file and return the content, or an empty string if the file does not exist.
 * @param path - The path to the file.
 * @returns The content of the file, or an empty string if the file does not exist.
 */
export const readMdFileOrDefault = (path: string): string => {
    try {
        return fs.readFileSync(path,
            "utf8")
    } catch {
        return ""
    }
}