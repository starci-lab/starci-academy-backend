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

@Module({
    imports: [
        ElasticsearchModule,
    ],
    providers: [
        ChallengesService,
        ChallengesResolver,
        ChallengesHandler,
    ],
})
/**
 * Wires resolver, service, handler, and Elasticsearch for the `challenges`
 * leaf. Registered globally from {@link ChallengesModule}.
 */
export class ChallengesSingleQueryModule extends ConfigurableModuleClass {}
