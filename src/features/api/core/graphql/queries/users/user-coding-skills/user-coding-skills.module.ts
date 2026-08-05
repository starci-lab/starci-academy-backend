import {
    Module,
} from "@nestjs/common"
import {
    ConfigurableModuleClass,
} from "./user-coding-skills.module-definition"
import {
    UserCodingSkillsResolver,
} from "./user-coding-skills.resolver"

@Module({
    providers: [
        UserCodingSkillsResolver,
    ],
})
/**
 * NestJS module for the `userCodingSkills` public-profile query. Wires only
 * the resolver — the data comes from `UserCodingProjectionService`, which is
 * provided globally by the coding-projection module.
 */
export class UserCodingSkillsSingleQueryModule extends ConfigurableModuleClass {}
