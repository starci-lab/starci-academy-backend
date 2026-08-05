import {
    Module,
} from "@nestjs/common"
import {
    ConfigurableModuleClass,
} from "./user-coding-progress.module-definition"
import {
    UserCodingProgressResolver,
} from "./user-coding-progress.resolver"

@Module({
    providers: [
        UserCodingProgressResolver,
    ],
})
/**
 * NestJS module for the `userCodingProgress` public-profile query. Wires only
 * the resolver — the data comes from `CodingProgressService`, provided by the
 * coding business module.
 */
export class UserCodingProgressSingleQueryModule extends ConfigurableModuleClass {}
