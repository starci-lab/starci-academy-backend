import {
    DynamicModule,
    Module,
} from "@nestjs/common"
import {
    ConfigurableModuleClass,
    OPTIONS_TYPE,
} from "./job.module-definition"
import {
    JobActionService,
} from "./job-action.service"
import {
    JobCommonService,
} from "./job-common.service"
import {
    JobStalledService,
} from "./job-stalled.service"

@Module({
})
export class JobModule extends ConfigurableModuleClass {
    static register(options: typeof OPTIONS_TYPE): DynamicModule {
        const dynamicModule = super.register(options)
        return {
            ...dynamicModule,
            providers: [
                ...(dynamicModule.providers ?? []),
                JobCommonService,
                JobActionService,
                JobStalledService,
            ],
            exports: [
                JobCommonService,
                JobActionService,
                JobStalledService,
            ],
        }
    }
}
