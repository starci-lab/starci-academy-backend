import {
    Module,
} from "@nestjs/common"
import {
    ConfigurableModuleClass,
} from "./processors.module-definition"
import {
    EnrollModule,
} from "./enroll"
import {
    ProccessGitUrlModule,
} from "./proccess-git-url"

/**
 * Module for the processors.
 */
@Module({
    imports: [
        EnrollModule.register(
            {
                isGlobal: true,
            }
        ),
        ProccessGitUrlModule.register(
            {
                isGlobal: true,
            }
        ),
    ],
})
export class ProcessorsModule extends ConfigurableModuleClass {}
