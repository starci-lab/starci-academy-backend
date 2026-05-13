import {
    CopyObjectCommand,
    S3Client,
} from "@aws-sdk/client-s3"
import {
    Injectable,
} from "@nestjs/common"
import {
    envConfig,
} from "@modules/env"
import {
    InjectMinioS3,
} from "./s3.decorators"
import {
    S3Provider,
} from "./enums"

export interface S3CopySameBucketParams {
    /** Existing object key. */
    sourceKey: string
    /** Destination key in the same bucket. */
    destKey: string
    provider: S3Provider
}

/**
 * Server-side copy within one S3-compatible bucket (used to freeze CV bytes under `attempts/…`).
 */
@Injectable()
export class S3CopyService {
    constructor(
        @InjectMinioS3()
        private readonly minioS3: S3Client,
    ) {}

    /**
     * Copy an object to a new key in the same bucket (no download/re-upload).
     */
    async copySameBucket(
        {
            sourceKey,
            destKey,
            provider,
        }: S3CopySameBucketParams,
    ): Promise<void> {
        if (sourceKey === destKey) {
            return
        }
        if (provider !== S3Provider.Minio) {
            throw new Error(
                `S3CopyService.copySameBucket: only ${S3Provider.Minio} is implemented (got ${provider}).`,
            )
        }
        const bucket = envConfig().s3.minio.bucket
        const encodedSource = sourceKey.split("/").map((segment) => encodeURIComponent(segment)).join("/")
        await this.minioS3.send(
            new CopyObjectCommand({
                Bucket: bucket,
                Key: destKey,
                CopySource: `${bucket}/${encodedSource}`,
            }),
        )
    }
}
