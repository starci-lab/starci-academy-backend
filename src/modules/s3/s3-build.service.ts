import {
    GetObjectCommand,
    PutObjectCommand,
    S3Client,
} from "@aws-sdk/client-s3"
import {
    getSignedUrl,
} from "@aws-sdk/s3-request-presigner"
import {
    envConfig,
} from "@modules/env"
import {
    Injectable,
} from "@nestjs/common"
import {
    S3Provider,
} from "./enums"
import {
    InjectDigitalOceanS3,
    InjectMinioS3,
} from "./s3.decorators"
import {
    BuildPublicUrlParams,
    BuildSignedGetUrlParams,
    BuildSignedPutUrlParams,
} from "./types/build"

/**
 * Helpers for building public URLs for objects in the configured S3-compatible bucket.
 */
@Injectable()
export class S3BuildService {
    /**
     * Constructor.
     * @param s3 - The DigitalOcean S3 client.
     * @param minioS3 - The MinIO S3 client.
     */
    constructor(
        @InjectDigitalOceanS3()
        private readonly s3: S3Client,
        @InjectMinioS3()
        private readonly minioS3: S3Client,
    ) {}

    /**
     * Build the public URL for an S3 object key.
     * @param params - The build public URL params.
     * @returns The public URL.
     */
    buildPublicObjectUrl(
        {
            key,
            provider,
        }: BuildPublicUrlParams,
    ): string {
        const config =
            provider === S3Provider.DigitalOcean
                ? envConfig().s3.digitalOcean
                : envConfig().s3.minio

        const { endpoint, bucket } = config
        let base = endpoint
        if (endpoint.endsWith("/")) {
            base = endpoint.slice(0,
                -1)
        }
        return `${base}/${bucket}/${key}`
    }

    /**
     * Build a time-limited signed URL for reading an object.
     * @param params - The build signed get URL params.
     * @returns The signed URL.
     */
    async buildSignedGetObjectUrl(
        {
            key,
            provider,
            expiresInSeconds: expiresInSecondsOverride,
        }: BuildSignedGetUrlParams,
    ): Promise<string> {
        let s3Client: S3Client
        let bucket: string
        let expiration: number

        switch (provider) {
        case S3Provider.DigitalOcean:
            s3Client = this.s3
            bucket = envConfig().s3.digitalOcean.bucket
            expiration = envConfig().s3.digitalOcean.presignedUrl.expiration / 1000
            break
        case S3Provider.Minio:
            s3Client = this.minioS3
            bucket = envConfig().s3.minio.bucket
            expiration = envConfig().s3.minio.presignedUrl.expiration / 1000
            break
        }

        const expiresIn =
            typeof expiresInSecondsOverride === "number" && expiresInSecondsOverride > 0
                ? expiresInSecondsOverride
                : expiration

        return getSignedUrl(
            s3Client,
            new GetObjectCommand({
                Bucket: bucket,
                Key: key,
            }),
            {
                expiresIn,
            },
        )
    }

    /**
     * Build a time-limited signed URL for uploading an object (PUT).
     * @param params - The build signed put URL params.
     * @returns The signed URL.
     */
    async buildSignedPutObjectUrl(
        {
            key,
            provider,
            contentType,
        }: BuildSignedPutUrlParams,
    ): Promise<string> {
        let s3Client: S3Client
        let bucket: string
        let expiration: number

        switch (provider) {
        case S3Provider.DigitalOcean:
            s3Client = this.s3
            bucket = envConfig().s3.digitalOcean.bucket
            expiration = envConfig().s3.digitalOcean.presignedUrl.expiration / 1000
            break
        case S3Provider.Minio:
            s3Client = this.minioS3
            bucket = envConfig().s3.minio.bucket
            expiration = envConfig().s3.minio.presignedUrl.expiration / 1000
            break
        }

        return getSignedUrl(
            s3Client,
            new PutObjectCommand({
                Bucket: bucket,
                Key: key,
                ContentType: contentType,
            }),
            {
                expiresIn: expiration,
            },
        )
    }
}
