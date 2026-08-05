import {
    Module,
} from "@nestjs/common"
import {
    ConfigurableModuleClass,
} from "./user-coding-history.module-definition"
import {
    UserCodingHistoryResolver,
} from "./user-coding-history.resolver"

@Module({
    providers: [
        UserCodingHistoryResolver,
    ],
})
/**
 * NestJS module for the `userCodingHistory` public-profile query. Wires only
 * the resolver -- the data comes from `UserCodingProjectionService`, which is
 * provided globally by the coding-projection module.
 */
export class UserCodingHistorySingleQueryModule extends ConfigurableModuleClass {}
