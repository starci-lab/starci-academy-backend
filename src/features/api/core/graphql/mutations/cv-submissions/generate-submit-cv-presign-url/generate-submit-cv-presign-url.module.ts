import {
    Module,
} from "@nestjs/common"
import {
    ConfigurableModuleClass,
} from "./generate-submit-cv-presign-url.module-definition"
import {
    GenerateSubmitCvPresignUrlResolver,
} from "./generate-submit-cv-presign-url.resolver"
import {
    GenerateSubmitCvPresignUrlService,
} from "./generate-submit-cv-presign-url.service"
import {
    GenerateSubmitCvPresignUrlHandler,
} from "./generate-submit-cv-presign-url.handler"

@Module({
    imports: [],
    providers: [
        GenerateSubmitCvPresignUrlResolver,
        GenerateSubmitCvPresignUrlService,
        GenerateSubmitCvPresignUrlHandler,
    ],
})
export class GenerateSubmitCvPresignUrlSingleMutationModule extends ConfigurableModuleClass {}
