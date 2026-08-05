import {
    ConfigurableModuleBuilder,
} from "@nestjs/common"
import type {
    GoogleApisModuleOptions,
} from "./types/googleapis"

export const { ConfigurableModuleClass, MODULE_OPTIONS_TOKEN, OPTIONS_TYPE } =
    new ConfigurableModuleBuilder<GoogleApisModuleOptions>()
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

