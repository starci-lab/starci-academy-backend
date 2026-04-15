import {
    CommandFactory 
} from "nest-commander"
import {
    AppModule 
} from "./app.module"
import {
    Logger 
} from "@nestjs/common"

/**
 * Bootstrap the application.
 */
const bootstrap = async () => {
    await CommandFactory.run(
        AppModule,
        new Logger()
    )
}
bootstrap()
