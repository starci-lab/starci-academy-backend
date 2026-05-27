import {
    Module,
} from "@nestjs/common"
import {
    ConfigurableModuleClass,
} from "./verify-submit-cv-presign-url.module-definition"
import {
    VerifySubmitCvPresignUrlResolver,
} from "./verify-submit-cv-presign-url.resolver"
import {
    VerifySubmitCvPresignUrlService,
} from "./verify-submit-cv-presign-url.service"
import {
    VerifySubmitCvPresignUrlHandler,
} from "./verify-submit-cv-presign-url.handler"

@Module({
    imports: [],
    providers: [
        VerifySubmitCvPresignUrlResolver,
        VerifySubmitCvPresignUrlService,
        VerifySubmitCvPresignUrlHandler,
    ],
})
export class VerifySubmitCvPresignUrlSingleMutationModule extends ConfigurableModuleClass {}
