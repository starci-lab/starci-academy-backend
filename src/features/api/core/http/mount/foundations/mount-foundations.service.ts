import {
    ContextType,
    envConfig,
} from "@modules/env"
import {
    Injectable,
    NotFoundException,
} from "@nestjs/common"
import fs from "fs/promises"
import {
    join,
} from "path"

/**
 * Serves files from `.mount/data/foundations` for external-link resources.
 */
@Injectable()
export class MountFoundationsService {
    async readFile(
        relativePath: string,
    ): Promise<{
        absolutePath: string
        buffer: Buffer
    }> {
        const normalized = relativePath.replace(/^\/+/,
            "")
        if (!normalized || normalized.includes("..")) {
            throw new NotFoundException()
        }

        const context = envConfig().contexts
            .filter((item) => item.enabled)
            .sort((prev, next) => prev.priority - next.priority)
            .find((item) => item.type === ContextType.Filesystem)

        if (!context) {
            throw new NotFoundException()
        }

        const absolutePath = join(
            context.path,
            "foundations",
            normalized,
        )

        const buffer = await fs.readFile(absolutePath)
        return {
            absolutePath,
            buffer,
        }
    }
}
