import {
    ConfigurableModuleBuilder,
} from "@nestjs/common"

// `.setExtras` wires `{isGlobal}` through to the DynamicModule's `global` flag --
// WITHOUT it, `GenerateCvModule.register({ isGlobal: true })` silently no-ops
// (isGlobal just sits unused on the injected OPTIONS token) and the module never
// actually becomes global, breaking every cross-module injection of its exports
// (`EnqueueGenerateCvJobService`) -- this crashed boot with
// "Nest can't resolve dependencies of the GenerateCvHandler" until fixed.
export const { ConfigurableModuleClass, MODULE_OPTIONS_TOKEN, OPTIONS_TYPE } =
    new ConfigurableModuleBuilder()
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
