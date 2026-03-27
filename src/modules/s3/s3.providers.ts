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
import {
    getS3SecretAccessKey,
    MountStorageService 
} from "@modules/filesystem"
import {
    ReadinessWatcherFactoryService 
} from "@modules/mixin"

export const InjectS3 = () => Inject(S3)

export const createS3ServiceProvider = (): Provider<S3Client> => ({
    provide: S3,
    inject: [
        MountStorageService,
        ReadinessWatcherFactoryService
    ],
    useFactory: () => {
        return new S3Client({
            endpoint: envConfig().s3.endpoint,
            region: envConfig().s3.region,
            credentials: {
                accessKeyId: envConfig().s3.accessKeyId,
                secretAccessKey: getS3SecretAccessKey(),
            },
        })
    },
})