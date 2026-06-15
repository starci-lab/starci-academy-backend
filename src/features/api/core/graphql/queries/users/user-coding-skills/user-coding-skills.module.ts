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
export class UserCodingSkillsSingleQueryModule extends ConfigurableModuleClass {}
