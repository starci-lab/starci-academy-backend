import {
    // CommandFactory's console adapter is constructed before the Nest injector exists.
    // eslint-disable-next-line starci-be/no-nest-logger -- pre-DI agent CLI bootstrap
    Logger,
} from "@nestjs/common"
import {
    CommandFactory 
} from "nest-commander"
import {
    AppModule 
} from "./app.module"

/** Entry point for the StarCi playground on-device RAG agent CLI (shebang added by webpack BannerPlugin). */
const bootstrap = async (): Promise<void> => {
    await CommandFactory.run(AppModule,
        // eslint-disable-next-line starci-be/no-nest-logger -- pre-DI agent CLI bootstrap
        new Logger())
}

void bootstrap()
