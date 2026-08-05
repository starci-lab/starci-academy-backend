import {
    Module,
} from "@nestjs/common"
import {
    ConfigurableModuleClass,
} from "./judge0.module-definition"
import {
    Judge0Service,
} from "./judge0.service"

@Module({
    providers: [Judge0Service],
    exports: [Judge0Service],
})
/**
 * Provides the {@link Judge0Service} client for talking to the self-hosted
 * Judge0 sandbox. Register with `.register({ isGlobal: true })` so the judging
 * worker can inject the service without re-importing the module.
 */
export class Judge0Module extends ConfigurableModuleClass {}
