import {
    Inject,
    Injectable,
    OnModuleInit,
} from "@nestjs/common"
import {
    CreateBucketCommand,
    HeadBucketCommand,
    S3Client,
} from "@aws-sdk/client-s3"
import {
    InjectS3,
} from "./s3.decorators"
import {
    MODULE_OPTIONS_TOKEN,
} from "./s3.module-definition"
import {
    type S3ModuleOptions,
} from "./interfaces"

/**
 * Service to initialize S3 resources (like buckets) on application startup.
 */
@Injectable()
export class S3InitializationService implements OnModuleInit {
    constructor(
        @InjectS3()
        private readonly s3: S3Client,
        @Inject(MODULE_OPTIONS_TOKEN)
        private readonly options: S3ModuleOptions,
    ) {}

    /**
     * Check if the configured bucket exists and create it if it doesn't.
     */
    async onModuleInit() {
        const config = this.options.defaultProvider === "minio" 
            ? (this.options.minio ?? this.options.aws) 
            : (this.options.aws ?? this.options.minio)

        if (!config || !config.bucket) {
            return
        }

        try {
            // Check if bucket exists
            await this.s3.send(new HeadBucketCommand({
                Bucket: config.bucket,
            }))
        } catch (error: any) {
            // If error is 404 (Not Found), try to create the bucket
            if (error.name === "NotFound" || error.$metadata?.httpStatusCode === 404) {
                try {
                    await this.s3.send(new CreateBucketCommand({
                        Bucket: config.bucket,
                    }))
                    console.log(`[S3Module] Created missing bucket: ${config.bucket}`)
                } catch (createError: any) {
                    console.error(`[S3Module] Failed to create bucket ${config.bucket}:`, createError.message)
                }
            } else {
                console.warn(`[S3Module] Could not verify bucket ${config.bucket}:`, error.message)
            }
        }
    }
}
