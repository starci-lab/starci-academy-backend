import {
    Injectable 
} from "@nestjs/common"
import {
    S3Provider,
} from "@modules/integrations/s3/enums/s3"
import {
    S3ReadService,
} from "@modules/integrations/s3/s3-read.service"
import {
    S3ContextNotFoundException,
} from "@modules/platform/exceptions/errors/courses/s3-context-not-found"
import {
    S3ContextTypeMismatchException,
} from "@modules/platform/exceptions/errors/courses/s3-context-type-mismatch"
import {
    envConfig,
} from "@modules/platform/env/config"
import {
    ContextType,
} from "@modules/platform/env/enums/context"
import {
    WinstonLog,
} from "@modules/platform/winston/enums/winston-log"
import {
    WinstonService,
} from "@modules/platform/winston/winston.service"

@Injectable()
/**
 * Service for reading files from S3.
 */
export class S3ContextService {
    constructor(
        private readonly s3ReadService: S3ReadService,
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
        /** Find the context by index. */
        const context = envConfig().contexts.find(
            (context) => context.index === index,
        )
        if (!context) {
            throw new S3ContextNotFoundException(
                {
                    index,
                },
            )
        }
        if (context.type !== ContextType.S3) {
            throw new S3ContextTypeMismatchException(
                {
                    index,
                },
            )
        }
        const provider = (context.provider as S3Provider) ?? S3Provider.DigitalOcean
        const text = await this.s3ReadService.text(
            {
                key: `${baseDir}/${relativePath}`,
                provider,
            },
        )
        if (text === null) {
            return null
        }
        this.winstonService.log(
            WinstonLog.ContextFileLoadedSuccessfully,
            {
                index,
                relativePath,
                type: ContextType.S3,
                provider,
            },
        )
        return text
    }
}