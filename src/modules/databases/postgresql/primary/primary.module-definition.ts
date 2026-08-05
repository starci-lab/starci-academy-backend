import {
    ConfigurableModuleBuilder 
} from "@nestjs/common"
import {
    PrimaryPostgresqlOptions,
} from "./types/options"

export const { ConfigurableModuleClass, MODULE_OPTIONS_TOKEN, OPTIONS_TYPE } =
    new ConfigurableModuleBuilder<PrimaryPostgresqlOptions>().setExtras(
        {
            isGlobal: false
        },
        (definition, extras) => ({
            ...definition,
            global: extras.isGlobal
        })
    ).build()
