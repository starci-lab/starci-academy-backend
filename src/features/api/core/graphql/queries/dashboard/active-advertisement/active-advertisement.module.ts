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
export class ActiveAdvertisementSingleQueryModule extends ConfigurableModuleClass {}
