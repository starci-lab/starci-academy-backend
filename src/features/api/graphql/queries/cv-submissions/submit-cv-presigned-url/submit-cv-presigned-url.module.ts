import {
    Module,
} from "@nestjs/common"
import {
    ConfigurableModuleClass
} from "../cv-submissions.module-definition"
import {
    SubmitCvPresignedUrlResolver 
} from "./submit-cv-presigned-url.resolver"
import {
    SubmitCvPresignedUrlService 
} from "./submit-cv-presigned-url.service"

@Module({
    imports: [],
    providers: [
        SubmitCvPresignedUrlResolver,
        SubmitCvPresignedUrlService,
    ],
})
export class SubmitCvSinglePresignedUrlModule extends ConfigurableModuleClass {}
