import {
    GetObjectCommand,
    NoSuchKey,
    S3Client,
} from "@aws-sdk/client-s3"
import {
    envConfig,
} from "@modules/env"
import {
    Injectable,
} from "@nestjs/common"
import type {
    Readable,
} from "stream"
import {
    InjectS3,
} from "./s3.decorators"

@Injectable()
export class S3ReadService {
    constructor(
        @InjectS3()
        private readonly s3: S3Client,
    ) {}

    /**
     * Read an object from S3 as string.
     *
     * @returns String body or null when key not found.
     */
    async text(
        key: string,
    ): Promise<string | null> {
        try {
            const result = await this.s3.send(
                new GetObjectCommand({
                    Bucket: envConfig().s3.bucket,
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
        return JSON.parse(content) as T
    }
}

