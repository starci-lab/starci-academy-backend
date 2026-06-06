import {
    Module
} from "@nestjs/common"
import {
    ConfigurableModuleClass
} from "./session.module-definition"
import {
    SessionService
} from "./session.service"

@Module({
    providers: [
        SessionService,
    ],
    exports: [
        SessionService,
    ],
})
export class SessionModule extends ConfigurableModuleClass {}
