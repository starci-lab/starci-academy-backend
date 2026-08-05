import {
    ConfigurableModuleBuilder
} from "@nestjs/common"

/**
 * Nest register options for the headhuntings query group. `isGlobal`
 * publishes company + consultant resolvers app-wide so other GraphQL modules
 * do not re-import this group.
 */
export interface HeadhuntingsModuleOptions {
    isGlobal?: boolean
}

export const {
    ConfigurableModuleClass,
    MODULE_OPTIONS_TOKEN,
    OPTIONS_TYPE,
    ASYNC_OPTIONS_TYPE,
} = new ConfigurableModuleBuilder<HeadhuntingsModuleOptions>().build()
