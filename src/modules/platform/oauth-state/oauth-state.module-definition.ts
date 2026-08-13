import {
    ConfigurableModuleBuilder,
} from "@nestjs/common"

/** Lets the composition root decide whether OAuth state is shared application-wide. */
export const { ConfigurableModuleClass } = new ConfigurableModuleBuilder().setExtras(
    {
        isGlobal: false,
    },
    (definition, extras) => ({
        ...definition,
        global: extras.isGlobal,
    }),
).build()
