import {
    Module,
} from "@nestjs/common"
import {
    ConfigurableModuleClass,
} from "./submit-personal-github-url.module-definition"
import {
    SubmitPersonalGithubUrlResolver,
} from "./submit-personal-github-url.resolver"
import {
    SubmitPersonalGithubUrlService,
} from "./submit-personal-github-url.service"
import {
    SubmitPersonalGithubUrlHandler,
} from "./submit-personal-github-url.handler"

@Module({
    providers: [
        SubmitPersonalGithubUrlResolver,
        SubmitPersonalGithubUrlService,
        SubmitPersonalGithubUrlHandler,
    ],
})
export class SubmitPersonalGithubUrlModule extends ConfigurableModuleClass {}
