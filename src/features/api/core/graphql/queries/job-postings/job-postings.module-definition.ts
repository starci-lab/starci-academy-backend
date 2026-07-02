import {
    ConfigurableModuleBuilder,
} from "@nestjs/common"

export interface JobPostingsModuleOptions {
    isGlobal?: boolean
}

export const {
    ConfigurableModuleClass,
    MODULE_OPTIONS_TOKEN,
    OPTIONS_TYPE,
    ASYNC_OPTIONS_TYPE,
} = new ConfigurableModuleBuilder<JobPostingsModuleOptions>().build()
