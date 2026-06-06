import {
    CreateBucketCommand,
    HeadBucketCommand,
    PutBucketPolicyCommand,
    S3Client,
} from "@aws-sdk/client-s3"
import {
    Injectable 
} from "@nestjs/common"
import {
    S3BucketCreationFailedException,
} from "@modules/exceptions"
import {
    InjectDigitalOceanS3,
    InjectMinioS3
} from "./s3.decorators"
import {
    S3LikeError,
} from "./types"

@Injectable()
export class S3BucketService {
    constructor(
        @InjectDigitalOceanS3()
        private readonly digitalOceanS3: S3Client,
        @InjectMinioS3()
        private readonly minioS3: S3Client,
    ) {}

    /**
     * Check if a bucket exists.
     * @param bucket - The bucket name.
     * @returns True if the bucket exists, false otherwise.
     */
    async checkExists(bucket: string): Promise<boolean> {
        try {
            const result = await this.digitalOceanS3.send(
                new HeadBucketCommand({
                    Bucket: bucket,
                }),
            )
            return result.$metadata.httpStatusCode === 200
        } catch {
            return false
        }
    }

    /**
     * Create a bucket.
     * @param bucket - The bucket name.
     */
    async create(bucket: string): Promise<void> {
        try {
            const result = await this.digitalOceanS3.send(
                new CreateBucketCommand({
                    Bucket: bucket,
                })
            )
            if (result.$metadata.httpStatusCode !== 200) {
                throw new S3BucketCreationFailedException({
                    bucket,
                    statusCode: result.$metadata.httpStatusCode,
                })
            }
        } catch (error) {
            const providerError = error as S3LikeError
            throw new S3BucketCreationFailedException({
                bucket,
                statusCode: providerError?.$metadata?.httpStatusCode,
                providerCode: providerError?.Code,
                requestId: providerError?.RequestId ?? providerError?.$metadata?.requestId,
                resource: providerError?.Resource,
                originalError: providerError,
            })
        }
    }

    /**
     * Ensure the `repo/` prefix in the Minio bucket allows anonymous GET.
     *
     * Sets a bucket policy statement that grants `s3:GetObject` on
     * `arn:aws:s3:::{bucket}/repo/*` to all principals (`"*"`).  The policy is
     * idempotent — safe to call on every sync cycle.
     *
     * @param bucket - Target bucket name.
     */
    async ensureRepoPrefixPublic(bucket: string): Promise<void> {
        const policy = {
            Version: "2012-10-17",
            Statement: [
                {
                    Sid: "RepoPublicRead",
                    Effect: "Allow",
                    Principal: {
                        AWS: ["*"],
                    },
                    Action: ["s3:GetObject"],
                    Resource: [`arn:aws:s3:::${bucket}/repo/*`],
                },
            ],
        }
        await this.minioS3.send(
            new PutBucketPolicyCommand({
                Bucket: bucket,
                Policy: JSON.stringify(policy),
            }),
        )
    }
}