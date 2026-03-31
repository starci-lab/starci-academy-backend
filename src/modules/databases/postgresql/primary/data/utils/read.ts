import {
    Locale 
} from "@modules/databases"
import {
    envConfig 
} from "@modules/env"
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

/**
 * Read a title from the filesystem and return the contents as a string.
 * If the file does not exist, return the default value.
 * @param path - The path to the file.
 * @param defaultValue - The default value to return if the file does not exist.
 * @returns The contents of the file as a string.
 */
export const readMetadataOrDefault = (
    id: string,
    locale: Locale, 
    defaultValue: string
) => {
    try {
        const metadata = JSON.parse(
            readFileOrDefault(
                envConfig().mountPath.config.metadata, 
                ""
            )
        )
        return metadata[id][locale]
    } catch {
        return defaultValue
    }
}