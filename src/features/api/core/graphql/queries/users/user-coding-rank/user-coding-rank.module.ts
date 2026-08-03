import {
    Module,
} from "@nestjs/common"
import {
    ConfigurableModuleClass,
} from "./user-coding-rank.module-definition"
import {
    UserCodingRankResolver,
} from "./user-coding-rank.resolver"

/**
 * NestJS module for the `userCodingRank` public-profile query. Wires only the
 * resolver — the data comes from `UserCodingProjectionService`, which is
 * provided globally by the coding-projection module.
 */
@Module({
    providers: [
        UserCodingRankResolver,
    ],
})
export class UserCodingRankSingleQueryModule extends ConfigurableModuleClass {}
