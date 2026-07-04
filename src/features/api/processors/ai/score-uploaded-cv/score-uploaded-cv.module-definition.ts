import {
    ConfigurableModuleBuilder,
} from "@nestjs/common"

// `.setExtras` wires `{isGlobal}` through to the DynamicModule's `global` flag —
// WITHOUT it, `ScoreUploadedCvModule.register({ isGlobal: true })` silently no-ops
// (isGlobal just sits unused on the injected OPTIONS token) and the module never
// actually becomes global, breaking cross-module injection of its exports
// (`EnqueueScoreUploadedCvJobService`, injected by the `uploadCv` mutation).
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
