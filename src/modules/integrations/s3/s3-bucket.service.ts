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
    S3_PUBLIC_READ_PREFIXES,
} from "./constants"
import {
    S3LikeError,
} from "./types"

@Injectable()
/**
 * Bucket lifecycle for DigitalOcean (create/exists) and MinIO (public-read
 * prefixes). Kept separate from upload/read so a missing bucket is fixed here
 * instead of each synchronizer inventing its own Head/Create/Policy calls.
 */
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
     * Ensure every public object-key prefix in the Minio bucket allows anonymous GET.
     *
     * MinIO exposes a single bucket policy, so this grants `s3:GetObject` to all
     * principals (`"*"`) on every prefix listed in {@link S3_PUBLIC_READ_PREFIXES}
     * (currently `repo/*` for sandbox code trees and `assets/*` for brand assets) in
     * one statement. Because the full prefix list is enumerated here, the policy is
     * identical no matter which synchronizer re-applies it — idempotent and free of
     * the clobbering that separate per-prefix policies would cause.
     *
     * @param bucket - Target bucket name.
     */
    async ensurePublicReadPrefixes(bucket: string): Promise<void> {
        // expand each public prefix into its wildcard object ARN for the policy resource list
        const resources = S3_PUBLIC_READ_PREFIXES.map(
            (prefix) => `arn:aws:s3:::${bucket}/${prefix}/*`,
        )
        // single statement covering all public prefixes — keeps the one-policy bucket consistent
        const policy = {
            Version: "2012-10-17",
            Statement: [
                {
                    Sid: "PublicRead",
                    Effect: "Allow",
                    Principal: {
                        AWS: ["*"],
                    },
                    Action: ["s3:GetObject"],
                    Resource: resources,
                },
            ],
        }
        // overwrite the bucket policy (idempotent: the resource list is deterministic)
        await this.minioS3.send(
            new PutBucketPolicyCommand({
                Bucket: bucket,
                Policy: JSON.stringify(policy),
            }),
        )
    }
}