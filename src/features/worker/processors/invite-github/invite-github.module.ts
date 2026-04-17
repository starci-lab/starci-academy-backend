import {
    Module,
} from "@nestjs/common"
import {
    InviteGithubWorker,
} from "./invite-github.worker"
import {
    ConfigurableModuleClass,
} from "./invite-github.module-definition"

@Module({
    providers: [
        InviteGithubWorker,
    ],
})
export class InviteGithubModule extends ConfigurableModuleClass {}
