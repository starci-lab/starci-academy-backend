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
export class SetFollowSingleMutationModule extends ConfigurableModuleClass {}
