import {
    ConfigurableModuleBuilder,
} from "@nestjs/common"

/**
 * Configurable module wiring for {@link AssetsModule}, exposing an `isGlobal`
 * extra so the module can be registered globally from the root app module.
 */
export const { ConfigurableModuleClass, MODULE_OPTIONS_TOKEN, OPTIONS_TYPE } =
    new ConfigurableModuleBuilder()
        .setExtras({
            isGlobal: false,
        },
        (definition, extras) => ({
            ...definition,
            global: extras.isGlobal,
        }))
        .build()
