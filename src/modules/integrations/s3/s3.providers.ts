import {
    Provider,
} from "@nestjs/common"
import {
    DIGITAL_OCEAN_S3,
    DIGITAL_OCEAN_S3_PRESIGN,
    MINIO_S3,
    MINIO_S3_PRESIGN,
} from "./constants/s3"
import {
    S3Client,
} from "@aws-sdk/client-s3"
import {
    envConfig,
} from "@modules/platform/env/config"
import {
    getS3SecretAccessKey,
} from "@modules/filesystem/utils/mount-secrets"

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

const resolveDigitalOceanPresignEndpoint = (): string => {
    const {
        endpoint,
        publicEndpoint,
    } = envConfig().s3.digitalOcean
    const trimmed = publicEndpoint.trim()
    return trimmed.length > 0
        ? trimmed
        : endpoint
}

/**
 * DigitalOcean client used only for presigned URLs so the Host matches what browsers can reach.
 */
export const createDigitalOceanS3PresignProvider = (): Provider<S3Client | null> => ({
    provide: DIGITAL_OCEAN_S3_PRESIGN,
    useFactory: () => new S3Client({
        endpoint: resolveDigitalOceanPresignEndpoint(),
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

const resolveMinioPresignEndpoint = (): string => {
    const {
        endpoint,
        publicEndpoint,
    } = envConfig().s3.minio
    const trimmed = publicEndpoint.trim()
    return trimmed.length > 0
        ? trimmed
        : endpoint
}

/**
 * MinIO client used only for presigned URLs so the Host matches what browsers can reach.
 */
export const createMinioPresignProvider = (): Provider<S3Client | null> => ({
    provide: MINIO_S3_PRESIGN,
    useFactory: () => new S3Client({
        endpoint: resolveMinioPresignEndpoint(),
        region: envConfig().s3.minio.region,
        credentials: {
            accessKeyId: envConfig().s3.minio.accessKeyId,
            secretAccessKey: envConfig().s3.minio.secretAccessKey,
        },
        forcePathStyle: true,
    }),
})
