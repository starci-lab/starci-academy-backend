import {
    ConfigurableModuleBuilder
} from "@nestjs/common"

/** Nest dynamic-module options for the foundations query group. */
export interface FoundationsModuleOptions {
    /** When true, the module registers its providers in the global DI scope. */
    isGlobal?: boolean
}

export const {
    ConfigurableModuleClass,
    MODULE_OPTIONS_TOKEN,
    OPTIONS_TYPE,
    ASYNC_OPTIONS_TYPE,
} = new ConfigurableModuleBuilder<FoundationsModuleOptions>().build()
