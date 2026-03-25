import {
    Inject,
    Provider
} from "@nestjs/common"
import {
    S3,
} from "./constants"
import {
    S3Client
} from "@aws-sdk/client-s3"
import {
    envConfig 
} from "@modules/env"

export const InjectS3 = () => Inject(S3)

export const createS3ServiceProvider = (): Provider<S3Client> => ({
    provide: S3,
    useFactory: () => {
        return new S3Client({
            endpoint: envConfig().s3.endpoint,
            region: envConfig().s3.region,
            credentials: {
                accessKeyId: envConfig().s3.accessKeyId,
                secretAccessKey: envConfig().s3.secretAccessKey,
            },
        })
    },
})