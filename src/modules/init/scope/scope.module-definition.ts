import {
    ConfigurableModuleBuilder,
} from "@nestjs/common"

/** Options for {@link ScopeModule}. */
export interface ScopeOptions {
    /** When true, register the module globally (services injectable app-wide). */
    isGlobal?: boolean
}

export const {
    ConfigurableModuleClass,
    MODULE_OPTIONS_TOKEN,
    OPTIONS_TYPE,
} = new ConfigurableModuleBuilder<ScopeOptions>().setExtras(
    {
        isGlobal: false,
    },
    (definition, extras) => ({
        ...definition,
        global: extras.isGlobal,
    }),
).build()
