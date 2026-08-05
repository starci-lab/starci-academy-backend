import {
    Logger 
} from "@nestjs/common"
import {
    CommandFactory 
} from "nest-commander"
import {
    AppModule 
} from "./app.module"

/** Entry point for the StarCi playground Docker agent CLI (shebang added by webpack BannerPlugin). */
const bootstrap = async (): Promise<void> => {
    await CommandFactory.run(AppModule,
        new Logger())
}

void bootstrap()
