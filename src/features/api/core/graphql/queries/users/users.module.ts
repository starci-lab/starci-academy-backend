import {
    Module,
} from "@nestjs/common"
import {
    ConfigurableModuleClass,
} from "./users.module-definition"
import {
    UserStatsSingleQueryModule,
} from "./user-stats"
import {
    UserProfileSingleQueryModule,
} from "./user-profile"

/**
 * User query group — resolved fields layered onto the shared `UserEntity`
 * GraphQL type (follower / following counts) plus the public profile query.
 */
@Module({
    imports: [
        UserStatsSingleQueryModule.register({
            isGlobal: true,
        }),
        UserProfileSingleQueryModule.register({
            isGlobal: true,
        }),
    ],
})
export class UsersQueriesModule extends ConfigurableModuleClass {}
