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
/**
 * Wires send-mail + complete steps so SMTP delivery is a processor concern, not an inline
 * call from every emitter.
 */
export class SendMailModule extends ConfigurableModuleClass {}
