import {
    Module,
} from "@nestjs/common"
import {
    ConfigurableModuleClass,
} from "./follows.module-definition"
import {
    SetFollowSingleMutationModule,
} from "./set-follow/set-follow.module"

@Module({
    imports: [
        SetFollowSingleMutationModule.register({
            isGlobal: true,
        }),
    ],
})
/**
 * Follow mutation group (follow / unfollow another user).
 */
export class FollowsMutationsModule extends ConfigurableModuleClass {}
