import {
    Injectable,
} from "@nestjs/common"
import {
    listVolumeDir,
    readVolumeDoc,
    volumeExists,
} from "./volume"
import type {
    VolumeDoc,
} from "./volume"

@Injectable()
/**
 * Nest facade over the `.volume` SSOT readers.
 *
 * Import-time `describe.skip` gates still call the plain {@link volumeExists}
 * / {@link readVolumeDoc} functions -- those run before any testing module
 * exists. In-test reads go through this provider once {@link TestHelpersModule}
 * is imported.
 */
export class VolumeService {
    /**
     * Read a real content doc from the `.volume` SSOT mount.
     *
     * @param relDir - path under `.volume/data`
     * @param locale - `"en"` (default) or `"vi"`
     * @returns the parsed {@link VolumeDoc}
     */
    public readVolumeDoc(
        relDir: string,
        locale: "en" | "vi" = "en",
    ): VolumeDoc {
        return readVolumeDoc(relDir,
            locale)
    }

    /**
     * List the non-dot entries under a `.volume/data` directory, sorted.
     *
     * @param relDir - path under `.volume/data`
     * @returns entry names
     */
    public listVolumeDir(
        relDir: string,
    ): Array<string> {
        return listVolumeDir(relDir)
    }

    /**
     * Whether a `.volume/data` path exists.
     *
     * @param relDir - path under `.volume/data`
     * @returns true when the path is present
     */
    public volumeExists(
        relDir: string,
    ): boolean {
        return volumeExists(relDir)
    }
}
