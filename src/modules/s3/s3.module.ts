import {
    DynamicModule,
    Module 
} from "@nestjs/common"
import {
    createS3ServiceProvider,
    createAwsS3Provider,
    createMinioProvider 
} from "./s3.providers"
import {
    ConfigurableModuleClass, OPTIONS_TYPE 
} from "./s3.module-definition"
import {
    S3UploadService 
} from "./s3-upload.service"
import {
    S3BuildService,
} from "./s3-build.service"
import {
    S3ReadService,
} from "./s3-read.service"
import {
    S3InitializationService,
} from "./s3-initialization.service"

@Module({
})
export class S3Module extends ConfigurableModuleClass {
    static register(options: typeof OPTIONS_TYPE): DynamicModule {
        const dynamicModule = super.register(options)
        
        const s3ServiceProvider = createS3ServiceProvider()
        const awsS3Provider = createAwsS3Provider()
        const minioS3Provider = createMinioProvider()

        return {
            ...dynamicModule,
            providers: [
                ...(dynamicModule.providers ?? []),
                s3ServiceProvider,
                awsS3Provider,
                minioS3Provider,
                S3UploadService,
                S3BuildService,
                S3ReadService,
                S3InitializationService,
            ],
            exports: [
                s3ServiceProvider,
                awsS3Provider,
                minioS3Provider,
                S3UploadService,
                S3BuildService,
                S3ReadService,
            ],
        }
    }
}