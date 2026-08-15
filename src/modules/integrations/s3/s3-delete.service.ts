import {
    ChecksumAlgorithm,
    DeleteObjectsCommand,
    S3Client,
} from "@aws-sdk/client-s3"
import {
    Injectable,
} from "@nestjs/common"
import {
    envConfig,
} from "@modules/platform/env/config"
import _ from "lodash"
import {
    InjectDigitalOceanS3,
    InjectMinioS3,
} from "./s3.decorators"
import {
    S3Provider,
} from "./enums/s3"
import {
    S3ProviderNotFoundException,
} from "@modules/platform/exceptions/errors/s3/provider-not-found"
import {
    DeleteObjectsParams,
} from "./types/delete"

/** Max keys S3 accepts in a single DeleteObjects request. */
const DELETE_BATCH_SIZE = 1000

@Injectable()
/**
 * Service for deleting objects from S3 (used by the synchronizer reconcile pass
 * to prune orphaned CDN keys whose entity no longer exists in the database).
 */
export class S3DeleteService {
    constructor(
        @InjectDigitalOceanS3()
        private readonly digitalOceanS3: S3Client,
        @InjectMinioS3()
        private readonly minioS3: S3Client,
    ) {}

    /**
     * Batch-delete object keys from the given provider's bucket.
     *
     * @param params - Keys to delete and the target provider.
     * @returns The number of keys requested for deletion.
     *
     * @example
     * await service.deleteObjects({ keys: ["courses/x/vi.json"], provider: S3Provider.Minio })
     */
    async deleteObjects(
        {
            keys,
            provider,
        }: DeleteObjectsParams,
    ): Promise<number> {
        // nothing to delete -> avoid an empty (and invalid) DeleteObjects request
        if (keys.length === 0) {
            return 0
        }
        // resolve the client + bucket for the requested provider
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
            // unknown provider -> surface a typed exception instead of silently no-op
            throw new S3ProviderNotFoundException({
                provider,
                supportedProviders: Object.values(S3Provider),
            })
        }
        // running tally of keys we asked S3 to remove
        let deleted = 0
        // S3 caps DeleteObjects at 1000 keys/request -> split into batches
        for (const batch of _.chunk(keys,
            DELETE_BATCH_SIZE)) {
            // Quiet mode suppresses the per-key success list, keeping the response small
            await s3Client.send(
                new DeleteObjectsCommand({
                    Bucket: bucket,
                    // MinIO requires Content-MD5 for the multi-delete XML body.
                    // Asking the AWS SDK for MD5 lets its checksum middleware
                    // calculate the header from the exact serialized payload.
                    ChecksumAlgorithm: ChecksumAlgorithm.MD5,
                    Delete: {
                        Objects: batch.map((key) => ({
                            Key: key,
                        })),
                        Quiet: true,
                    },
                }),
            )
            // count this batch as deleted once the request resolves
            deleted += batch.length
        }
        return deleted
    }
}
