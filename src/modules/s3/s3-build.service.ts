import {
    GetObjectCommand,
    S3Client,
} from "@aws-sdk/client-s3"
import {
    getSignedUrl,
} from "@aws-sdk/s3-request-presigner"
import {
    Inject,
    Injectable,
} from "@nestjs/common"
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

/**
 * Helpers for building public URLs for objects in the configured S3-compatible bucket.
 */
@Injectable()
export class S3BuildService {
    constructor(
        @InjectDigitalOceanS3()
        private readonly digitalOceanS3: S3Client,
        @InjectMinioS3()
        private readonly minioS3: S3Client,
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
     * Build the public URL for an S3 object key.
     *
     * `S3UploadService` uploads with `ACL: public-read`, so this should be reachable without auth.
     */
    buildPublicObjectUrl(
        objectKey: string,
    ): string {
        const config = this.config
        if (!config) {
            return ""
        }
        const { endpoint, bucket } = config
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
        const config = this.config
        if (!config) {
            return ""
        }
        return getSignedUrl(
          this.digitalOceanS3,
          new GetObjectCommand({
            Bucket: config.bucket,
            Key: objectKey,
          }),
          {
            expiresIn: config.signedUrlExpiration ?? 900,
          },
        );
    }
}

