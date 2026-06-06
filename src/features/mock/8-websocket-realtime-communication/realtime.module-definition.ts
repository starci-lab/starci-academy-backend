import {
    ConfigurableModuleBuilder,
} from "@nestjs/common"

/** Configurable wiring so the parent module can register this gateway as global. */
export const {
    ConfigurableModuleClass,
} = new ConfigurableModuleBuilder()
    .setExtras(
        {
            isGlobal: false,
        },
        (definition, extras) => ({
            ...definition,
            global: extras.isGlobal,
        }),
    )
    .build()
