import {
    GetObjectCommand,
    NoSuchKey,
    S3Client,
} from "@aws-sdk/client-s3"
import {
    Inject,
    Injectable,
} from "@nestjs/common"
import type {
    Readable,
} from "stream"
import {
    InjectS3,
} from "./s3.decorators"
import {
    InjectSuperJson 
} from "@modules/mixin"
import SuperJSON from "superjson"
import {
    MODULE_OPTIONS_TOKEN,
} from "./s3.module-definition"
import {
    type S3ModuleOptions,
} from "./interfaces"

@Injectable()
export class S3ReadService {
    constructor(
        @InjectS3()
        private readonly s3: S3Client,
        @InjectSuperJson()
        private readonly superJson: SuperJSON,
        @Inject(MODULE_OPTIONS_TOKEN)
        private readonly options: S3ModuleOptions,
    ) {}

    /**
     * Get the active configuration based on defaultProvider.
     */
    private get config() {
        if (this.options.defaultProvider === "minio") {
            return this.options.minio ?? this.options.aws
        }
        return this.options.aws ?? this.options.minio
    }

    /**
     * Read an object from S3 as string.
     *
     * @returns String body or null when key not found.
     */
    async text(
        key: string,
    ): Promise<string | null> {
        try {
            const config = this.config
            if (!config) {
                return null
            }
            const result = await this.s3.send(
                new GetObjectCommand({
                    Bucket: config.bucket,
                    Key: key,
                }),
            )

            const body = result.Body as unknown as Readable | undefined
            if (!body) return ""

            const chunks: Array<Buffer> = []
            for await (const chunk of body) {
                chunks.push(Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk))
            }
            return Buffer.concat(chunks).toString("utf8")
        } catch (error) {
            // S3-compatible endpoints may throw different error shapes; NoSuchKey covers AWS.
            if (error instanceof NoSuchKey) return null
            return null
        }
    }

    /**
     * Read JSON from S3 and parse it.
     *
     * @returns Parsed value or null when key not found.
     */
    async json<T>(
        key: string,
    ): Promise<T | null> {
        const content = await this.text(key)
        if (content === null) return null
        return this.superJson.parse(content) as T
    }
}

