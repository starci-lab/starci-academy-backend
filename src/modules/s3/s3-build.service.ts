import {
    GetObjectCommand,
    S3Client,
} from "@aws-sdk/client-s3"
import {
    getSignedUrl,
} from "@aws-sdk/s3-request-presigner"
import {
    Injectable,
} from "@nestjs/common"
import {
    envConfig,
} from "@modules/env"
import {
    InjectS3,
} from "./s3.decorators"

/**
 * Helpers for building public URLs for objects in the configured S3-compatible bucket.
 */
@Injectable()
export class S3BuildService {
    constructor(
        @InjectS3()
        private readonly s3: S3Client,
    ) {}

    /**
     * Build the public URL for an S3 object key.
     *
     * `S3UploadService` uploads with `ACL: public-read`, so this should be reachable without auth.
     */
    buildPublicObjectUrl(
        objectKey: string,
    ): string {
        const endpoint = envConfig().s3.endpoint
        const bucket = envConfig().s3.bucket
        let base = endpoint
        if (endpoint.endsWith("/")) {
            base = endpoint.slice(0,
                -1)
        }
        return `${base}/${bucket}/${objectKey}`
    }

    /**
     * Build a time-limited signed URL for reading an object.
     */
    async buildSignedGetObjectUrl(
        objectKey: string
    ): Promise<string> {
        return getSignedUrl(
            this.s3,
            new GetObjectCommand({
                Bucket: envConfig().s3.bucket,
                Key: objectKey,
            }),
            {
                expiresIn: envConfig().s3.signedUrlExpiration,
            },
        )
    }
}

