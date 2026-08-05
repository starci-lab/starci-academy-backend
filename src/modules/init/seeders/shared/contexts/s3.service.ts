import {
    Injectable 
} from "@nestjs/common"
import {
    S3Provider,
    S3ReadService,
} from "@modules/s3"
import {
    S3ContextNotFoundException,
    S3ContextTypeMismatchException,
} from "@modules/exceptions"
import { 
    envConfig, 
    ContextType 
} from "@modules/env"
import {
    WinstonLog,
    WinstonService,
} from "@modules/winston"

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