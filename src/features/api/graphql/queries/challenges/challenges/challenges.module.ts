import {
    Module,
} from "@nestjs/common"
import {
    ConfigurableModuleClass,
} from "./challenges.module-definition"
import {
    ChallengesResolver,
} from "./challenges.resolver"
import {
    ChallengesService,
} from "./challenges.service"
import {
    ElasticsearchModule,
} from "@modules/elasticsearch"

@Module({
    imports: [
        ElasticsearchModule,
    ],
    providers: [
        ChallengesService,
        ChallengesResolver,
    ],
})
export class ChallengesSingleQueryModule extends ConfigurableModuleClass {}
