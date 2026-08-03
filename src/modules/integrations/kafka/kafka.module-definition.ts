import {
    ConfigurableModuleBuilder,
} from "@nestjs/common"

/**
 * Configurable-module plumbing for {@link import("./kafka.module").KafkaModule}.
 * Exposes an `isGlobal` extra so the broker client can be registered once and
 * injected anywhere (every CDC/event listener shares the single connection).
 */
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
