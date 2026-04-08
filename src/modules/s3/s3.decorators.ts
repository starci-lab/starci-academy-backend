import {
    Inject,
} from "@nestjs/common"
import {
    DIGITAL_OCEAN_S3,
    MINIO_S3,
} from "./constants"

/** Inject the default S3 configuration. */
export const InjectDigitalOceanS3 = () => Inject(DIGITAL_OCEAN_S3)

/** Inject the AWS S3 configuration specifically. */
export const InjectMinioS3 = () => Inject(MINIO_S3)