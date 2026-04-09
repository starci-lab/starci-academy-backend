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
    InjectDigitalOceanS3,
    InjectMinioS3,
} from "./s3.decorators"
import SuperJSON from "superjson"
import {
    MODULE_OPTIONS_TOKEN,
} from "./s3.module-definition"
import {
    type S3ModuleOptions,
} from "./interfaces"
import {
    ReadJsonParams, ReadTextParams 
} from "./types/read"
import {
    UploadPayload 
} from "./types"
import {
    InjectSuperJson 
} from "@modules/mixin"
import {
    envConfig 
} from "@modules/env"
import {
    S3Provider 
} from "./enums"

/**
 * Service for reading objects from S3.
 */
@Injectable()
export class S3ReadService {
    /**
     * Constructor.
     * @param s3 - The S3 client.
     * @param minioS3 - The Minio S3 client.
     * @param options - The S3 module options.
     * @param superJson - The SuperJSON instance.
     */
    constructor(
        @InjectDigitalOceanS3()
        private readonly s3: S3Client,
        @InjectMinioS3()
        private readonly minioS3: S3Client,
        @InjectSuperJson()
        private readonly superJson: SuperJSON,
    ) {}

    /**
     * Read an object from S3 as string.
     *
     * @returns String body or null when key not found.
     */
    async text(
        {
            key,
            provider,
        }: ReadTextParams,
    ): Promise<string | null> {
        // take the appropriate S3 client based on the provider
        let s3Client: S3Client
        switch (provider) {
        case S3Provider.DigitalOcean:
            s3Client = this.s3
            break
        case S3Provider.Minio:
            s3Client = this.minioS3
            break
        }
        try {
            const result = await s3Client.send(
                new GetObjectCommand({
                    Bucket: envConfig().s3.digitalOcean.bucket,
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
    async json<T extends UploadPayload>(
        {
            key,
            provider,
        }: ReadJsonParams,
    ): Promise<T | null> {
        /** Read the content as string. */
        const content = await this.text({
            key, 
            provider 
        })
        /** If the content is null, throw an error. */
        if (content === null) {
            return null
        }
        /** Parse the content as JSON. */
        return this.superJson.parse<T>(content)
    }
}

