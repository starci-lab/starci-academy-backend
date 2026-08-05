import {
    Injectable 
} from "@nestjs/common"
import {
    envConfig,
    ContextType
} from "@modules/env"
import {
    ContextNotFoundException,
    ContextTypeMismatchException,
} from "@modules/exceptions"
import {
    getRuntimeContextRoot,
} from "@modules/filesystem"
import fs from "fs/promises"
import {
    WinstonLog,
    WinstonService,
} from "@modules/winston"

@Injectable()
/**
 * Service for reading files from filesystem.
 */
export class FilesystemContextService {
    constructor(
        private readonly winstonService: WinstonService,
    ) {}
    /**
     * Load a file from S3.
     */
    async load(
        /** The index of the context. */
        index: number,
        /** The base directory of the files. */
        baseDir: string,
        /** The relative path to the file. */
        relativePath: string,
    ): Promise<string | null> {
        try {
            /** Find the context by index. */
            const context = envConfig().contexts.find(
                (context) => context.index === index,
            )
            if (!context) {
                throw new ContextNotFoundException(
                    {
                        index,
                    },
                )
            }
            if (context.type !== ContextType.Filesystem) {
                throw new ContextTypeMismatchException(
                    {
                        index,
                        expectedType: ContextType.Filesystem,
                        actualType: context.type,
                    },
                )
            }
            // seed from the staging root when set, else the configured context path
            const root = getRuntimeContextRoot() ?? context.path
            const text = await fs.readFile(
                `${root}/${baseDir}/${relativePath}`,
                "utf8",
            )
            this.winstonService.log(
                WinstonLog.ContextFileLoadedSuccessfully,
                {
                    index,
                    relativePath,
                    type: ContextType.Filesystem,
                },
            )
            return text
        } catch {
            return null
        }
    }
}