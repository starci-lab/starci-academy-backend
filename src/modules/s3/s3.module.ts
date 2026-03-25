import {
    DynamicModule,
    Module 
} from "@nestjs/common"
import {
    createS3ServiceProvider 
} from "./s3.providers"
import {
    ConfigurableModuleClass, OPTIONS_TYPE 
} from "./s3.module-definition"
import {
    S3UploadService 
} from "./s3-upload.service"

@Module({
})
export class S3Module extends ConfigurableModuleClass {
    static register(options: typeof OPTIONS_TYPE): DynamicModule {
        const dynamicModule = super.register(options)
        const s3ServiceProvider = createS3ServiceProvider()
        return {
            ...dynamicModule,
            providers: [
                ...(dynamicModule.providers ?? []),
                s3ServiceProvider,
                S3UploadService,
            ],
            exports: [
                s3ServiceProvider,
                S3UploadService,
            ],
        }
    }
}