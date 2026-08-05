import {
    DynamicModule,
    Module 
} from "@nestjs/common"
import {
    createDigitalOceanS3PresignProvider,
    createDigitalOceanS3Provider,
    createMinioPresignProvider,
    createMinioProvider,
} from "./s3.providers"
import {
    ConfigurableModuleClass, OPTIONS_TYPE 
} from "./s3.module-definition"
import {
    S3ReadService,
} from "./s3-read.service"
import {
    S3BuildService,
} from "./s3-build.service"
import {
    S3UploadService,
} from "./s3-upload.service"
import {
    S3NameResolverService 
} from "./s3-name-resolver.service"
import {
    S3BucketService,
} from "./s3-bucket.service"
import {
    S3CopyService,
} from "./s3-copy.service"
import {
    S3DeleteService,
} from "./s3-delete.service"

@Module({
})
/**
 * S3 module.
 */
export class S3Module extends ConfigurableModuleClass {
    static register(options: typeof OPTIONS_TYPE): DynamicModule {
        const dynamicModule = super.register(options)
        
        const digitalOceanS3Provider = createDigitalOceanS3Provider()
        const digitalOceanS3PresignProvider = createDigitalOceanS3PresignProvider()
        const minioS3Provider = createMinioProvider()
        const minioS3PresignProvider = createMinioPresignProvider()

        return {
            ...dynamicModule,
            providers: [
                ...(dynamicModule.providers ?? []),
                digitalOceanS3Provider,
                digitalOceanS3PresignProvider,
                minioS3Provider,
                minioS3PresignProvider,
                S3UploadService,
                S3ReadService,
                S3BuildService,
                S3NameResolverService,
                S3BucketService,
                S3CopyService,
                S3DeleteService,
            ],
            exports: [
                digitalOceanS3Provider,
                digitalOceanS3PresignProvider,
                minioS3Provider,
                minioS3PresignProvider,
                S3UploadService,
                S3ReadService,
                S3BuildService,
                S3NameResolverService,
                S3BucketService,
                S3CopyService,
                S3DeleteService,
            ],
        }
    }
}