import {
    ConfigurableModuleBuilder,
} from "@nestjs/common"

/**
 * Nest register options for the job-postings query group. `isGlobal`
 * publishes listing + detail resolvers app-wide so other GraphQL modules
 * do not re-import this group.
 */
export interface JobPostingsModuleOptions {
    isGlobal?: boolean
}

export const {
    ConfigurableModuleClass,
    MODULE_OPTIONS_TOKEN,
    OPTIONS_TYPE,
    ASYNC_OPTIONS_TYPE,
} = new ConfigurableModuleBuilder<JobPostingsModuleOptions>().build()
