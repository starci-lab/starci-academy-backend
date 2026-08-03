import {
    Module,
} from "@nestjs/common"
import {
    ConfigurableModuleClass,
} from "./user-coding-progress.module-definition"
import {
    UserCodingProgressResolver,
} from "./user-coding-progress.resolver"

/**
 * NestJS module for the `userCodingProgress` public-profile query. Wires only
 * the resolver — the data comes from `CodingProgressService`, provided by the
 * coding business module.
 */
@Module({
    providers: [
        UserCodingProgressResolver,
    ],
})
export class UserCodingProgressSingleQueryModule extends ConfigurableModuleClass {}
