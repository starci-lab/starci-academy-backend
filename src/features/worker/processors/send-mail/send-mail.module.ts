import {
    Module,
} from "@nestjs/common"
import {
    SendMailWorker,
} from "./send-mail.worker"
import {
    MailcowService,
} from "./mailcow.service"
import {
    ConfigurableModuleClass,
} from "./send-mail.module-definition"

@Module({
    providers: [
        MailcowService,
        SendMailWorker,
    ],
    exports: [
        MailcowService,
    ],
})
export class SendMailModule extends ConfigurableModuleClass {}
