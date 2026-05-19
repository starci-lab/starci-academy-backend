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

@Module({})
export class MountFoundationsModule extends ConfigurableModuleClass {
    static register(
        options: typeof OPTIONS_TYPE = {},
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
