import {
    CommandFactory 
} from "nest-commander"
import {
    AppModule 
} from "./app.module"
import {
    // CommandFactory's console adapter is constructed before the Nest injector exists.
    // eslint-disable-next-line starci-be/no-nest-logger -- pre-DI CLI bootstrap
    Logger,
} from "@nestjs/common"

/**
 * Bootstrap the application.
 */
const bootstrap = async () => {
    await CommandFactory.run(
        AppModule,
        // eslint-disable-next-line starci-be/no-nest-logger -- pre-DI CLI bootstrap
        new Logger(),
    )
}
bootstrap()
