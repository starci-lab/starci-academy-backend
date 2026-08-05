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
/**
 * Nest DI for `sandboxRepoUrl` -- enrollment-gated Minio presign for sandbox trees.
 */
export class SandboxRepoUrlModule extends ConfigurableModuleClass { }
