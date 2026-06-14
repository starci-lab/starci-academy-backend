import {
    Module,
} from "@nestjs/common"
import {
    ConfigurableModuleClass,
} from "./follows.module-definition"
import {
    SetFollowSingleMutationModule,
} from "./set-follow"

/**
 * Follow mutation group (follow / unfollow another user).
 */
@Module({
    imports: [
        SetFollowSingleMutationModule.register({
            isGlobal: true,
        }),
    ],
})
export class FollowsMutationsModule extends ConfigurableModuleClass {}
