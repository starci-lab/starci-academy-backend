import {
    Module,
} from "@nestjs/common"
import {
    MembershipModule,
} from "@modules/membership"
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
export class ActiveAdvertisementSingleQueryModule extends ConfigurableModuleClass {}
