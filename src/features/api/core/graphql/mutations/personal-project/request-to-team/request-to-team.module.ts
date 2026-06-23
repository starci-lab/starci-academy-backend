import {
    Module,
} from "@nestjs/common"
import {
    ConfigurableModuleClass,
} from "./request-to-team.module-definition"
import {
    RequestToTeamResolver,
} from "./request-to-team.resolver"
import {
    RequestToTeamService,
} from "./request-to-team.service"
import {
    RequestToTeamHandler,
} from "./request-to-team.handler"

@Module({
    providers: [
        RequestToTeamResolver,
        RequestToTeamService,
        RequestToTeamHandler,
    ],
})
export class RequestToTeamSingleMutationModule extends ConfigurableModuleClass {}
