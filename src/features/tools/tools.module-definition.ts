import {
    ConfigurableModuleBuilder,
} from "@nestjs/common"

/**
 * Configurable module scaffolding for {@link ToolsModule}.
 *
 * Mirrors the other feature modules so the app root can opt the module into the
 * global injector scope via `.register({ isGlobal: true })`.
 */
export const { ConfigurableModuleClass, MODULE_OPTIONS_TOKEN, OPTIONS_TYPE } =
    new ConfigurableModuleBuilder()
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
