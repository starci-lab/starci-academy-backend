import {
    Module,
} from "@nestjs/common"
import {
    SendMailWorker,
} from "./send-mail.worker"
import {
    ConfigurableModuleClass,
} from "./send-mail.module-definition"
import {
    ProcessSendMailStepService,
    ProcessSendMailCompleteStepService,
} from "./steps"
import {
    SendMailStepMappingService,
} from "./step-mapping.service"

@Module({
    providers: [
        ProcessSendMailStepService,
        ProcessSendMailCompleteStepService,
        SendMailStepMappingService,
        SendMailWorker,
    ],
})
export class SendMailModule extends ConfigurableModuleClass {}
