import {
    Provider,
} from "@nestjs/common"
import {
    DIGITAL_OCEAN_S3,
    MINIO_S3,
} from "./constants"
import {
    S3Client,
} from "@aws-sdk/client-s3"
import {
    envConfig 
} from "@modules/env"
import {
    getS3SecretAccessKey 
} from "@modules/filesystem"

/**
 * Provider for AWS S3 specifically.
 */
export const createDigitalOceanS3Provider = (): Provider<S3Client | null> => ({
    provide: DIGITAL_OCEAN_S3,
    useFactory: () => new S3Client({
        endpoint: envConfig().s3.digitalOcean.endpoint,
        region: envConfig().s3.digitalOcean.region,
        credentials: {
            accessKeyId: envConfig().s3.digitalOcean.accessKeyId,
            secretAccessKey: getS3SecretAccessKey(),
        },
    }),
})

/**
 * Provider for MinIO specifically.
 */
export const createMinioProvider = (): Provider<S3Client | null> => ({
    provide: MINIO_S3,
    useFactory: () => new S3Client({
        endpoint: envConfig().s3.minio.endpoint,
        region: envConfig().s3.minio.region,
        credentials: {
            accessKeyId: envConfig().s3.minio.accessKeyId,
            secretAccessKey: envConfig().s3.minio.secretAccessKey,
        },
        forcePathStyle: true,
    }),
}) 
