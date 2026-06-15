import {
    Module,
} from "@nestjs/common"
import {
    ConfigurableModuleClass,
} from "./my-league.module-definition"
import {
    MyLeagueResolver,
} from "./my-league.resolver"

@Module({
    providers: [
        MyLeagueResolver,
    ],
})
export class MyLeagueSingleQueryModule extends ConfigurableModuleClass {}
