import {
    Module,
} from "@nestjs/common"
import {
    ConfigurableModuleClass,
} from "./active-advertisement.module-definition"
import {
    ActiveAdvertisementResolver,
} from "./active-advertisement.resolver"

@Module({
    providers: [
        ActiveAdvertisementResolver,
    ],
})
/**
 * Feature-module boundary for the `activeAdvertisement` query -- wires its resolver
 * and locally imports MembershipModule so member-exemption can run (that service is not global).
 */
export class ActiveAdvertisementSingleQueryModule extends ConfigurableModuleClass {}
