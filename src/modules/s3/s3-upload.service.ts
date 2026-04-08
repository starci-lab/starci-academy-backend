import {
    PutObjectCommand,
    S3Client,
} from "@aws-sdk/client-s3"
import {
    Inject,
    Injectable,
} from "@nestjs/common"
import type {
    UploadJsonParams,
    UploadPayload,
} from "./types"
import {
    S3ProviderNotFoundException,
} from "./exceptions/s3-provider-not-found.exception"
import {
    InjectDigitalOceanS3,
    InjectMinioS3,
} from "./s3.decorators"
import {
    MODULE_OPTIONS_TOKEN,
} from "./s3.module-definition"
import {
    type S3ModuleOptions,
} from "./interfaces"
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
        @Inject(MODULE_OPTIONS_TOKEN)
        private readonly options: S3ModuleOptions,
        private readonly asyncService: AsyncService,
        @InjectSuperJson()
        private readonly superJson: SuperJSON,
        private readonly s3ReadService: S3ReadService,
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
                        const readResult = await this.s3ReadService.json<UploadPayload>({
                            key: name,
                            provider: S3Provider.Minio,
                        })
                        const hash = readResult?.hash
                        // if the hash is the same as the payload hash, return the existing result
                        if (hash !== payload.hash) {
                            return 
                        }
                        this.minioS3.send(
                            new PutObjectCommand({
                                Bucket: envConfig().s3.minio.bucket,
                                Key: name,
                                Body: this.superJson.stringify(payload),
                                ACL: acl,
                                ContentType: "application/json",
                            }),
                        )
                        await this.minioS3.send(
                            new PutObjectCommand(
                                {
                                    Bucket: envConfig().s3.minio.bucket,
                                    Key: name,
                                    Body: this.superJson.stringify(payload),
                                    ACL: acl,
                                    ContentType: "application/json",
                                }
                            ),
                        )
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
}