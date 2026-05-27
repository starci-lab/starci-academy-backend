import {
    Module,
} from "@nestjs/common"
import {
    S3Module,
} from "@modules/s3"
import {
    ConfigurableModuleClass,
} from "./cv-url.module-definition"
import {
    CvUrlResolver,
} from "./cv-url.resolver"
import {
    CvUrlService,
} from "./cv-url.service"
import {
    CvUrlHandler,
} from "./cv-url.handler"

@Module({
    imports: [
        S3Module,
    ],
    providers: [
        CvUrlResolver,
        CvUrlService,
        CvUrlHandler,
    ],
})
export class CvUrlSingleQueryModule extends ConfigurableModuleClass {}
