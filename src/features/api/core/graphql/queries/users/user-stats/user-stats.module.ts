import {
    Module,
} from "@nestjs/common"
import {
    ConfigurableModuleClass,
} from "./user-stats.module-definition"
import {
    UserStatsResolver,
} from "./user-stats.resolver"

@Module({
    providers: [
        UserStatsResolver,
    ],
})
/**
 * Feature-module boundary for UserEntity field resolvers (`followerCount`,
 * `followingCount`, `isFollowedByMe`) -- social counts live here so the shared
 * user type stays free of follow-graph imports.
 */
export class UserStatsSingleQueryModule extends ConfigurableModuleClass {}
