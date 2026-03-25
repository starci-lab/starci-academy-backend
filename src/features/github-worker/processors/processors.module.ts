import {
    Module,
} from "@nestjs/common"
import {
    ConfigurableModuleClass,
} from "./processors.module-definition"
import {
    TestService,
} from "./test.service"

@Module({
    providers: [
        TestService,
    ],
})
export class ProcessorsModule extends ConfigurableModuleClass {}
