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
    UploadJsonResult,
} from "./types"
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
 * Service for uploading files to S3.
 */
@Injectable()
export class S3UploadService {
    constructor(
        @InjectS3()
        private readonly s3: S3Client,
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
     * Upload a JSON file to S3.
     * @param param - Upload JSON parameters.
     * @returns The command output.
     */
    async json(
        {
            name,
            json,
            acl,
        }: UploadJsonParams,
    ): Promise<UploadJsonResult> {
        const config = this.config
        if (!config) {
            throw new Error("No S3 configuration found")
        }
        return this.s3.send(
            new PutObjectCommand({
                Bucket: config.bucket,
                Key: name,
                Body: json,
                ACL: acl,
                ContentType: "application/json",
            }),
        )
    }

    /**
     * Upload a JSON file with custom ACL.
     * @param name - The name of the file.
     * @param json - The JSON content to upload.
     * @param acl - Access control list for object.
     * @returns The command output.
     */
    async uploadJson({
        name,
        json,
        acl = "private",
    }: UploadJsonParams): Promise<UploadJsonResult> {
        const config = this.config
        if (!config) {
            throw new Error("No S3 configuration found")
        }
        return this.s3.send(
            new PutObjectCommand({
                Bucket: config.bucket,
                Key: name,
                Body: json,
                ACL: acl,
                ContentType: "application/json",
            }),
        )
    }
}