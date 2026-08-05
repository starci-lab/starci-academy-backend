import {
    DynamicModule,
    Module,
} from "@nestjs/common"
import {
    ConfigurableModuleClass,
    OPTIONS_TYPE,
} from "../../http.module-definition"
import {
    MountFoundationsController,
} from "./mount-foundations.controller"
import {
    MountFoundationsService,
} from "./mount-foundations.service"

@Module({
})
/**
 * Dynamic mount of foundation JSON for the CMS — registered from HttpModule options so
 * non-CMS deploys can omit the endpoint.
 */
export class MountFoundationsModule extends ConfigurableModuleClass {
    static register(
        options: typeof OPTIONS_TYPE = {
        },
    ): DynamicModule {
        const dynamicModule = super.register(options)
        return {
            ...dynamicModule,
            controllers: [
                MountFoundationsController,
            ],
            providers: [
                MountFoundationsService,
            ],
        }
    }
}
