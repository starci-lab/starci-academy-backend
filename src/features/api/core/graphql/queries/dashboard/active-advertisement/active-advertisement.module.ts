import {
    Module,
} from "@nestjs/common"
import {
    MembershipModule,
} from "@modules/membership/membership.module"
import {
    ConfigurableModuleClass,
} from "./active-advertisement.module-definition"
import {
    ActiveAdvertisementResolver,
} from "./active-advertisement.resolver"

@Module({
    // MembershipService is not globally provided (unlike the bussiness services),
    // so import its module here to resolve the member-exemption dependency
    imports: [
        MembershipModule.register({
        }),
    ],
    providers: [
        ActiveAdvertisementResolver,
    ],
})
/**
 * Feature-module boundary for the `activeAdvertisement` query -- wires its resolver
 * and locally imports MembershipModule so member-exemption can run (that service is not global).
 */
export class ActiveAdvertisementSingleQueryModule extends ConfigurableModuleClass {}
