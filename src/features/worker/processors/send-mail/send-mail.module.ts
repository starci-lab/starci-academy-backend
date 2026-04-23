import {
    Module,
} from "@nestjs/common"
import {
    SendMailWorker,
} from "./send-mail.worker"
import {
    ConfigurableModuleClass,
} from "./send-mail.module-definition"

@Module({
    providers: [
        SendMailWorker,
    ],
    exports: [],
})
export class SendMailModule extends ConfigurableModuleClass {}
