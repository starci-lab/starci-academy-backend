import {
    GetObjectCommand,
    HeadObjectCommand,
    ListObjectsV2Command,
    NoSuchKey,
    S3Client,
} from "@aws-sdk/client-s3"
import {
    envConfig
} from "@modules/env"
import {
    InjectSuperJson
} from "@modules/mixin"
import {
    Injectable
} from "@nestjs/common"
import type {
    Readable,
} from "stream"
import SuperJSON from "superjson"
import {
    S3Provider
} from "./enums"
import {
    InjectDigitalOceanS3,
    InjectMinioS3,
} from "./s3.decorators"
import {
    ListAllParams,
    ListParams,
    ReadBufferParams,
    ReadJsonParams,
    ReadTextParams,
} from "./types"

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
    ) { }

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
        let bucket: string
        switch (provider) {
        case S3Provider.DigitalOcean: {
            s3Client = this.s3
            bucket = envConfig().s3.digitalOcean.bucket
            break
        }
        case S3Provider.Minio: {
            s3Client = this.minioS3
            bucket = envConfig().s3.minio.bucket
            break
        }
        }
        try {
            const result = await s3Client.send(
                new GetObjectCommand({
                    Bucket: bucket,
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
     * Read an object from S3 and parse it as JSON.
     *
     * @returns Parsed value or null when key not found.
     */
    async json<T>(
        {
            key,
            provider,
        }: ReadJsonParams,
    ): Promise<T | null> {
        /** Read the content as string. */
        const content = await this.text({
            key,
            provider,
        })
        /** If the content is null, return null. */
        if (content === null) {
            return null
        }
        /** Parse the content as JSON. */
        return this.superJson.parse<T>(content)
    }

    /**
     * Read an object from S3 as Buffer.
     *
     * @returns Buffer or null when key not found.
     */
    async buffer(
        {
            key,
            provider,
        }: ReadBufferParams,
    ): Promise<Buffer | null> {
        // take the appropriate S3 client based on the provider
        let s3Client: S3Client
        let bucket: string
        switch (provider) {
        case S3Provider.DigitalOcean: {
            s3Client = this.s3
            bucket = envConfig().s3.digitalOcean.bucket
            break
        }
        case S3Provider.Minio: {
            s3Client = this.minioS3
            bucket = envConfig().s3.minio.bucket
            break
        }
        }
        try {
            const result = await s3Client.send(
                new GetObjectCommand({
                    Bucket: bucket,
                    Key: key,
                }),
            )

            const body = result.Body as unknown as Readable | undefined
            if (!body) return Buffer.alloc(0)

            const chunks: Array<Buffer> = []
            for await (const chunk of body) {
                chunks.push(Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk))
            }
            return Buffer.concat(chunks)
        } catch (error) {
            if (error instanceof NoSuchKey) return null
            return null
        }
    }

    /**
     * List objects from S3.
     *
     * @returns List of objects.
     */
    async list(
        {
            key,
            provider,
        }: ListParams,
    ): Promise<Array<string>> {
        // take the appropriate S3 client based on the provider
        let s3Client: S3Client
        let bucket: string
        switch (provider) {
        case S3Provider.DigitalOcean: {
            s3Client = this.s3
            bucket = envConfig().s3.digitalOcean.bucket
            break
        }
        case S3Provider.Minio: {
            s3Client = this.minioS3
            bucket = envConfig().s3.minio.bucket
            break
        }
        }
        const prefix = key.endsWith("/") ? key : `${key}/`
        const result = await s3Client.send(
            new ListObjectsV2Command(
                {
                    Bucket: bucket,
                    Prefix: prefix,
                    Delimiter: "/",
                }
            ),
        )
        return (
            result.CommonPrefixes ?? []).map(
            p =>
            p.Prefix!.replace(
                prefix,
                ""
            ).replace(
                "/",
                ""
            )
        ) ?? []
    }

    /**
     * List every object key under a prefix, following pagination.
     *
     * Unlike {@link list} (which uses a `/` delimiter and returns folder-like
     * common prefixes), this returns the FULL flat key of every object so the
     * caller can both enumerate id segments and delete the exact keys.
     *
     * @returns All object keys under the prefix across every page.
     */
    async listAll(
        {
            prefix,
            provider,
        }: ListAllParams,
    ): Promise<Array<string>> {
        // pick the client + bucket for the requested provider
        let s3Client: S3Client
        let bucket: string
        switch (provider) {
        case S3Provider.DigitalOcean: {
            s3Client = this.s3
            bucket = envConfig().s3.digitalOcean.bucket
            break
        }
        case S3Provider.Minio: {
            s3Client = this.minioS3
            bucket = envConfig().s3.minio.bucket
            break
        }
        }
        // accumulate keys across pages — a bucket can hold far more than the 1000/page S3 cap
        const keys: Array<string> = []
        // ContinuationToken drives pagination; undefined on the first request
        let continuationToken: string | undefined = undefined
        do {
            // request one page of objects under the prefix (no Delimiter → flat key list)
            const result = await s3Client.send(
                new ListObjectsV2Command({
                    Bucket: bucket,
                    Prefix: prefix,
                    ContinuationToken: continuationToken,
                }),
            )
            // collect each key in this page, skipping any entry missing a Key
            for (const object of result.Contents ?? []) {
                if (object.Key) {
                    keys.push(object.Key)
                }
            }
            // advance only while S3 signals more pages remain
            continuationToken = result.IsTruncated ? result.NextContinuationToken : undefined
        } while (continuationToken)
        return keys
    }

    /**
     * Check whether an object exists in S3.
     *
     * @returns true when the key exists, false otherwise.
     */
    async exists(
        {
            key,
            provider,
        }: ReadTextParams,
    ): Promise<boolean> {
        let s3Client: S3Client
        let bucket: string
        switch (provider) {
        case S3Provider.DigitalOcean: {
            s3Client = this.s3
            bucket = envConfig().s3.digitalOcean.bucket
            break
        }
        case S3Provider.Minio: {
            s3Client = this.minioS3
            bucket = envConfig().s3.minio.bucket
            break
        }
        }
        try {
            await s3Client.send(
                new HeadObjectCommand({
                    Bucket: bucket,
                    Key: key,
                }),
            )
            return true
        } catch (error) {
            if (error instanceof NoSuchKey) return false
            throw error
        }
    }
}
