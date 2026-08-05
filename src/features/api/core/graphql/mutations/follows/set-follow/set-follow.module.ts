import {
    Module,
} from "@nestjs/common"
import {
    ConfigurableModuleClass,
} from "./set-follow.module-definition"
import {
    SetFollowResolver,
} from "./set-follow.resolver"

@Module({
    providers: [
        SetFollowResolver,
    ],
})
/**
 * Registers setFollow (follow / unfollow toggle) so social graph writes
 * stay out of the profile aggregator.
 */
export class SetFollowSingleMutationModule extends ConfigurableModuleClass {}
