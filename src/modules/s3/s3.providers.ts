import {
    Provider,
} from "@nestjs/common"
import {
    S3,
    AWS_S3,
    MINIO,
} from "./constants"
import {
    S3Client,
} from "@aws-sdk/client-s3"
import {
    MODULE_OPTIONS_TOKEN,
} from "./s3.module-definition"
import {
    S3ModuleOptions,
    S3Config,
} from "./interfaces"

/**
 * Helper to create an S3Client from configuration.
 */
const createS3Client = (config?: S3Config): S3Client | null => {
    if (!config) {
        return null
    }
    return new S3Client({
        endpoint: config.endpoint,
        region: config.region,
        forcePathStyle: config.forcePathStyle,
        credentials: {
            accessKeyId: config.accessKeyId,
            secretAccessKey: config.secretAccessKey,
        },
    })
}

/**
 * Provider for AWS S3 specifically.
 */
export const createAwsS3Provider = (): Provider<S3Client | null> => ({
    provide: AWS_S3,
    inject: [MODULE_OPTIONS_TOKEN],
    useFactory: (options: S3ModuleOptions) => createS3Client(options.aws),
})

/**
 * Provider for MinIO specifically.
 */
export const createMinioProvider = (): Provider<S3Client | null> => ({
    provide: MINIO,
    inject: [MODULE_OPTIONS_TOKEN],
    useFactory: (options: S3ModuleOptions) => createS3Client(options.minio),
})

/**
 * Provider for the default S3 instance (resolves to AWS or MinIO based on config).
 */
export const createS3ServiceProvider = (): Provider<S3Client | null> => ({
    provide: S3,
    inject: [MODULE_OPTIONS_TOKEN, AWS_S3, MINIO],
    useFactory: (
        options: S3ModuleOptions,
        awsS3: S3Client | null,
        minio: S3Client | null,
    ) => {
        if (options.defaultProvider === "minio") {
            return minio ?? awsS3
        }
        return awsS3 ?? minio
    },
})