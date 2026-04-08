import {
    DynamicModule,
    Module 
} from "@nestjs/common"
import {
    createDigitalOceanS3Provider,
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

/**
 * S3 module.
 */
@Module({
})
export class S3Module extends ConfigurableModuleClass {
    static register(options: typeof OPTIONS_TYPE): DynamicModule {
        const dynamicModule = super.register(options)
        
        const digitalOceanS3Provider = createDigitalOceanS3Provider()
        const minioS3Provider = createMinioProvider()

        return {
            ...dynamicModule,
            providers: [
                ...(dynamicModule.providers ?? []),
                digitalOceanS3Provider,
                minioS3Provider,
                S3UploadService,
                S3ReadService,
                S3BuildService,
                S3NameResolverService,
            ],
            exports: [
                digitalOceanS3Provider,
                minioS3Provider,
                S3UploadService,
                S3ReadService,
                S3BuildService,
                S3NameResolverService,
            ],
        }
    }
}