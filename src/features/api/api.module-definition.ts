import {
    ConfigurableModuleBuilder
} from "@nestjs/common"
import {
    ServiceOptions,
} from "@modules/lib/common/types/service"

export const { ConfigurableModuleClass, MODULE_OPTIONS_TOKEN, OPTIONS_TYPE } =
    new ConfigurableModuleBuilder<ServiceOptions>()
        .setExtras(
            {
                isGlobal: true,
            },
            (definition, extras) => ({
                ...definition,
                global: extras.isGlobal,
            }),
        )
        .build()
