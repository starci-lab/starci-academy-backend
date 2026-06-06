import {
    Module,
} from "@nestjs/common"
import {
    ConfigurableModuleClass,
} from "./sandbox-repo-url.module-definition"
import {
    SandboxRepoUrlResolver,
} from "./sandbox-repo-url.resolver"
import {
    SandboxRepoUrlService,
} from "./sandbox-repo-url.service"

@Module({
    providers: [
        SandboxRepoUrlResolver,
        SandboxRepoUrlService,
    ],
})
export class SandboxRepoUrlModule extends ConfigurableModuleClass { }
