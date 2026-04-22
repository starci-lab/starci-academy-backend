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
    ChallengesHandler,
} from "./challenges.handler"
import {
    ElasticsearchModule,
} from "@modules/elasticsearch"
import {
    ScyllaDBModule,
} from "@modules/databases"

@Module({
    imports: [
        ElasticsearchModule,
        ScyllaDBModule,
    ],
    providers: [
        ChallengesService,
        ChallengesResolver,
        ChallengesHandler,
    ],
})
export class ChallengesSingleQueryModule extends ConfigurableModuleClass {}
