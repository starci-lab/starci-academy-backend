import {
    Module,
} from "@nestjs/common"
import {
    ConfigurableModuleClass,
} from "./rewards.module-definition"
import {
    RewardsResolver,
} from "./rewards.resolver"

@Module({
    providers: [
        RewardsResolver,
    ],
})
export class RewardsSingleQueryModule extends ConfigurableModuleClass {}
