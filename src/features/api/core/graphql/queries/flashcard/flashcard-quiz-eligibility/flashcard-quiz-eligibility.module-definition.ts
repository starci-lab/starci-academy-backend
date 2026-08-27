import {
    ConfigurableModuleBuilder
} from "@nestjs/common"

export const { ConfigurableModuleClass } = new ConfigurableModuleBuilder()
    .setExtras({
        isGlobal: false
    },
    (definition, extras) => ({
        ...definition, global: extras.isGlobal
    }))
    .build()
