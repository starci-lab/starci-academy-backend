import {
    Injectable 
} from "@nestjs/common"
import {
    FilesystemContextService, 
    S3ContextService 
} from "."
import {
    ContextType, 
    envConfig 
} from "@modules/env"
import {
    ContextFileNotFoundException,
} from "@modules/exceptions"

@Injectable()
/**
 * Service for loading context files.
 */
export class ContextLoaderService {
    constructor(
        private readonly s3ContextService: S3ContextService,
        private readonly filesystemContextService: FilesystemContextService,
    ) {}
    /**
     * Load a text file relative to the root.
     */
    async load(
        /** The base directory of the files. */
        baseDir: string,
        /** The relative path to the file. */
        relativePath: string,
    ): Promise<string> {
        /** Get the enabled contexts and sort them by priority. */
        const contexts = envConfig().contexts.filter(context => context.enabled)
        /** Sort the contexts by priority. */
        const sorted = contexts
            .filter(context => context.enabled)
            .sort((prev, next) => prev.priority - next.priority)
        /** Loop through the sorted contexts and load the file. */
        for (const context of sorted) {
            switch (context.type) {
            case ContextType.S3: {
                const text = await this.s3ContextService.load(
                    context.index,
                    baseDir,
                    relativePath,
                )
                if (text !== null) {
                    return text
                }
                continue
            }
            case ContextType.Filesystem: {
                const text = await this.filesystemContextService.load(
                    context.index,
                    baseDir,
                    relativePath,
                )
                if (text !== null) {
                    return text
                }
                continue
            }
            }
        }
        throw new ContextFileNotFoundException(
            {
                relativePath,
            },
        )
    }
}