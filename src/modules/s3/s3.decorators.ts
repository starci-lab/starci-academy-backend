import {
    Inject,
} from "@nestjs/common"
import {
    S3,
    AWS_S3,
    MINIO,
} from "./constants"

/** Inject the default S3 configuration. */
export const InjectS3 = () => Inject(S3)

/** Inject the AWS S3 configuration specifically. */
export const InjectAwsS3 = () => Inject(AWS_S3)

/** Inject the MinIO configuration specifically. */
export const InjectMinio = () => Inject(MINIO)