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
    UploadPayload,
    UploadStreamParams,
} from "./types"
import {
    S3ProviderNotFoundException,
} from "./exceptions/s3-provider-not-found.exception"
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
import {
    S3ReadService 
} from "./s3-read.service"

/**
 * Service for uploading files to S3.
 */
@Injectable()
export class S3UploadService {
    constructor(
        @InjectDigitalOceanS3()
        private readonly digitalOceanS3: S3Client,
        @InjectMinioS3()
        private readonly minioS3: S3Client,
        private readonly asyncService: AsyncService,
        @InjectSuperJson()
        private readonly superJson: SuperJSON,
        private readonly s3ReadService: S3ReadService,
    ) {}

    /**
     * Upload a JSON file to S3.
     * @param param - Upload JSON parameters.
     * @returns The command output.
     */
    async json<T extends UploadPayload>(
        {
            name,
            payload,
            acl,
            providers,
        }: UploadJsonParams<T>,
    ) {
        const promises = Array<Promise<void>>()
        for (const provider of providers) {
            switch (provider) {
            case S3Provider.DigitalOcean: {
                promises.push(
                    (async () => {
                        const readResult = await this.s3ReadService.json<UploadPayload>({
                            key: name,
                            provider: S3Provider.DigitalOcean,
                        })
                        const hash = readResult?.hash
                        // if the hash is the same as the payload hash, return the existing result
                        if (hash !== payload.hash) {
                            return 
                        }
                        this.digitalOceanS3.send(
                            new PutObjectCommand({
                                Bucket: envConfig().s3.digitalOcean.bucket,
                                Key: name,
                                Body: this.superJson.stringify(payload),
                                ACL: acl,
                                ContentType: "application/json",
                            }),
                        )    
                    })())
                break
            }
            case S3Provider.Minio: {
                promises.push(
                    (async () => {
                        try {
                            const readResult =
                          await this.s3ReadService.json<UploadPayload>({
                              key: name,
                              provider: S3Provider.Minio,
                          })
                            if(readResult) {
                                if (readResult?.hash === payload.hash) {
                                    return
                                }
                            }
                            await this.minioS3.send(
                                new PutObjectCommand({
                                    Bucket: envConfig().s3.minio.bucket,
                                    Key: name,
                                    Body: this.superJson.stringify(payload),
                                    ACL: acl,
                                    ContentType: "application/json",
                                }),
                            )
                        } catch (error) {
                            console.error("Error reading from S3 Minio",
                                error)
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
        await this.asyncService.allIgnoreError(promises)
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