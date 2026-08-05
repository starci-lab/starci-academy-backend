import {
    PutObjectCommand,
    S3Client,
} from "@aws-sdk/client-s3"
import {
    Injectable,
} from "@nestjs/common"
import type {
    UploadBufferParams,
    UploadJsonParams,
    UploadStreamParams,
} from "./types"
import {
    S3ProviderNotFoundException,
} from "./exceptions/s3-provider-not-found.exception"
import {
    S3UploadFailedException,
} from "@modules/exceptions"
import {
    InjectDigitalOceanS3,
    InjectMinioS3,
} from "./s3.decorators"
import {
    S3Provider 
} from "./enums"
import {
    envConfig 
} from "@modules/env"
import {
    AsyncService, 
    InjectSuperJson
} from "@modules/mixin"
import SuperJSON from "superjson"

@Injectable()
/**
 * Service for uploading files to S3.
 */
export class S3UploadService {
    constructor(
        @InjectDigitalOceanS3()
        private readonly digitalOceanS3: S3Client,
        @InjectMinioS3()
        private readonly minioS3: S3Client,
        private readonly asyncService: AsyncService,
        @InjectSuperJson()
        private readonly superJson: SuperJSON,
    ) {}

    /**
     * Whether DigitalOcean is configured (has an access key). When false, every DigitalOcean
     * upload is skipped instead of hitting Spaces with empty creds (which returns 400
     * InvalidArgument) — a single switch to disable DO across all upload paths.
     */
    private isDigitalOceanEnabled(): boolean {
        return envConfig().s3.digitalOcean.accessKeyId.trim().length > 0
    }

    /**
     * Upload a JSON file to S3.
     * @param param - Upload JSON parameters.
     * @returns The command output.
     */
    async json<T>(
        {
            name,
            payload,
            acl,
            providers,
            encoding = "superjson",
        }: UploadJsonParams<T>,
    ) {
        // Serialize once: SuperJSON for typed-rich consumers (default), or plain
        // JSON.stringify when the consumer reads the object with a raw JSON.parse.
        const body = encoding === "json"
            ? JSON.stringify(payload)
            : this.superJson.stringify(payload)
        const promises = Array<Promise<void>>()
        for (const provider of providers) {
            switch (provider) {
            case S3Provider.DigitalOcean: {
                // skip when DigitalOcean is not configured (empty creds → 400 InvalidArgument)
                if (!this.isDigitalOceanEnabled()) {
                    break
                }
                // upload unconditionally — the caller (MaterializeAndUploadService) already
                // does the hash/snapshot skip, so re-reading here would be a wasted round-trip
                promises.push(
                    (async () => {
                        const bucket = envConfig().s3.digitalOcean.bucket
                        try {
                            await this.digitalOceanS3.send(
                                new PutObjectCommand({
                                    Bucket: bucket,
                                    Key: name,
                                    Body: body,
                                    ACL: acl,
                                    ContentType: "application/json",
                                }),
                            )
                        } catch (error) {
                            throw new S3UploadFailedException({
                                provider: String(provider),
                                bucket,
                                key: name,
                                originalError: error instanceof Error ? error : new Error(String(error)),
                            })
                        }
                    })())
                break
            }
            case S3Provider.Minio: {
                // upload unconditionally — hash-equality skipping is the caller's responsibility
                promises.push(
                    (async () => {
                        const bucket = envConfig().s3.minio.bucket
                        try {
                            await this.minioS3.send(
                                new PutObjectCommand({
                                    Bucket: bucket,
                                    Key: name,
                                    Body: body,
                                    // MinIO may reject/ignore ACL headers depending on server config.
                                    // Keep ACL handling for DigitalOcean only; MinIO access is usually controlled by bucket policy.
                                    ContentType: "application/json",
                                }),
                            )
                        } catch (error) {
                            throw new S3UploadFailedException({
                                provider: String(provider),
                                bucket,
                                key: name,
                                originalError: error instanceof Error ? error : new Error(String(error)),
                            })
                        }
                    })())
                break
            }
            default: {
                throw new S3ProviderNotFoundException({
                    provider,
                    supportedProviders: Object.values(S3Provider),
                })
            }
            }
        }
        await this.asyncService.allMustDone(promises)
    }

    /**
     * Upload a raw buffer to S3.
     * @param param - Upload buffer parameters.
     */
    async buffer(
        {
            name,
            buffer,
            acl,
            provider,
            contentType,
        }: UploadBufferParams,
    ): Promise<void> {
        // skip DigitalOcean uploads entirely when DO is not configured (empty creds → 400)
        if (provider === S3Provider.DigitalOcean && !this.isDigitalOceanEnabled()) {
            return
        }
        let s3Client: S3Client
        let bucket: string
        switch (provider) {
        case S3Provider.DigitalOcean:
            s3Client = this.digitalOceanS3
            bucket = envConfig().s3.digitalOcean.bucket
            break
        case S3Provider.Minio:
            s3Client = this.minioS3
            bucket = envConfig().s3.minio.bucket
            break
        default:
            throw new S3ProviderNotFoundException({
                provider,
                supportedProviders: Object.values(S3Provider),
            })
        }

        await s3Client.send(
            new PutObjectCommand({
                Bucket: bucket,
                Key: name,
                Body: buffer,
                ACL: acl,
                ContentType: contentType,
            }),
        )
    }

    /**
     * Upload a stream to S3.
     * @param param - Upload stream parameters.
     */
    async stream(
        {
            name,
            stream,
            acl,
            provider,
            contentType,
        }: UploadStreamParams,
    ): Promise<void> {
        // skip DigitalOcean uploads entirely when DO is not configured (empty creds → 400)
        if (provider === S3Provider.DigitalOcean && !this.isDigitalOceanEnabled()) {
            return
        }
        let s3Client: S3Client
        let bucket: string

        switch (provider) {
        case S3Provider.DigitalOcean:
            s3Client = this.digitalOceanS3
            bucket = envConfig().s3.digitalOcean.bucket
            break
    
        case S3Provider.Minio:
            s3Client = this.minioS3
            bucket = envConfig().s3.minio.bucket
            break
    
        default:
            throw new S3ProviderNotFoundException(
                {
                    provider,
                    supportedProviders: Object.values(S3Provider),
                }
            )
        }
    
        await s3Client.send(
            new PutObjectCommand({
                Bucket: bucket,
                Key: name,
                Body: stream,
                ACL: acl,
                ContentType: contentType,
            }),
        )
    }
}