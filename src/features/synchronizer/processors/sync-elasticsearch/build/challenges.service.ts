import {
    ElasticsearchEntityChallengesService,
} from "@modules/elasticsearch"
import {
    Injectable,
} from "@nestjs/common"

/**
 * On-demand challenge indexing (delegates to {@link ElasticsearchEntityChallengesService}).
 */
@Injectable()
export class ElasticsearchChallengesBuildService {
    constructor(
        private readonly entityChallenges: ElasticsearchEntityChallengesService,
    ) {
    }

    async buildIndexById(
        challengeId: string,
    ): Promise<void> {
        await this.entityChallenges.indexById(
            challengeId,
        )
    }
}
