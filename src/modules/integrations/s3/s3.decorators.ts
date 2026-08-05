import {
    Inject,
} from "@nestjs/common"
import {
    DIGITAL_OCEAN_S3,
    DIGITAL_OCEAN_S3_PRESIGN,
    MINIO_S3,
    MINIO_S3_PRESIGN,
} from "./constants/s3"

/** Inject the default S3 configuration. */
export const InjectDigitalOceanS3 = () => Inject(DIGITAL_OCEAN_S3)

/** Inject DigitalOcean S3 client for presign / public URL host. */
export const InjectDigitalOceanS3Presign = () => Inject(DIGITAL_OCEAN_S3_PRESIGN)

/** Inject the AWS S3 configuration specifically. */
export const InjectMinioS3 = () => Inject(MINIO_S3)

/** Inject MinIO S3 client for presign / public URL host. */
export const InjectMinioS3Presign = () => Inject(MINIO_S3_PRESIGN)