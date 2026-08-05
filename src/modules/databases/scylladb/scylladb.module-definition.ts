import {
    ConfigurableModuleBuilder,
} from "@nestjs/common"
import type {
    ScyllaDBModuleOptions,
} from "./types/options"

export const { 
    ConfigurableModuleClass: ScyllaConfigurableModuleClass, 
    MODULE_OPTIONS_TOKEN: SCYLLADB_MODULE_OPTIONS_TOKEN, 
    OPTIONS_TYPE: SCYLLADB_OPTIONS_TYPE 
} =
    new ConfigurableModuleBuilder<ScyllaDBModuleOptions>()
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
