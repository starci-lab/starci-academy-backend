import {
    Module,
} from "@nestjs/common"
import {
    ConfigurableModuleClass,
} from "./membership.module-definition"
import {
    MembershipService,
} from "./membership.service"

@Module({
    providers: [
        MembershipService,
    ],
    exports: [
        MembershipService,
    ],
})
export class MembershipModule extends ConfigurableModuleClass {}
