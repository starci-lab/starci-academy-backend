import {
    PutObjectCommand,
    S3Client,
} from "@aws-sdk/client-s3"
import {
    Injectable,
} from "@nestjs/common"
import {
    envConfig,
} from "@modules/env"
import type {
    UploadJsonParams,
    UploadJsonResult,
} from "./types"
import {
    InjectS3,
} from "./s3.decorators"

/**
 * Service for uploading files to S3.
 */
@Injectable()
export class S3UploadService {
    constructor(
        @InjectS3()
        private readonly s3: S3Client,
    ) {}

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
        return this.s3.send(
            new PutObjectCommand({
                Bucket: envConfig().s3.bucket,
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
        return this.s3.send(
            new PutObjectCommand({
                Bucket: envConfig().s3.bucket,
                Key: name,
                Body: json,
                ACL: acl,
                ContentType: "application/json",
            }),
        )
    }
}