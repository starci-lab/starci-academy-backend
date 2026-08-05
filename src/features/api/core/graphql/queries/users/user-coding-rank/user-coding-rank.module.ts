import {
    Module,
} from "@nestjs/common"
import {
    ConfigurableModuleClass,
} from "./user-coding-rank.module-definition"
import {
    UserCodingRankResolver,
} from "./user-coding-rank.resolver"

@Module({
    providers: [
        UserCodingRankResolver,
    ],
})
/**
 * NestJS module for the `userCodingRank` public-profile query. Wires only the
 * resolver -- the data comes from `UserCodingProjectionService`, which is
 * provided globally by the coding-projection module.
 */
export class UserCodingRankSingleQueryModule extends ConfigurableModuleClass {}
