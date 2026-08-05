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
/** Feature-module boundary for the `rewards` query — wires its resolver so the dashboard group can mount this widget independently. */
export class RewardsSingleQueryModule extends ConfigurableModuleClass {}
