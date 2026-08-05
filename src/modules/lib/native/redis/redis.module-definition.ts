import {
    ConfigurableModuleBuilder 
} from "@nestjs/common"
import {
    RedisOptions,
} from "./types/options"

export const { ConfigurableModuleClass, MODULE_OPTIONS_TOKEN, OPTIONS_TYPE } =
  new ConfigurableModuleBuilder<RedisOptions>()
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
