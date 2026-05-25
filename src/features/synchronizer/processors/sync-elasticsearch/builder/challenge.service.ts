import {
    ChallengeEntity,
    ChallengeHydrationService,
    ChallengeResolverService,
    Locale,
} from "@modules/databases"
import {
    Injectable,
} from "@nestjs/common"
import type {
    LocalizedElasticsearchEntity,
} from "./types"
import {
    ElasticsearchService,
} from "@modules/elasticsearch"
import _ from "lodash"

@Injectable()
export class ElasticsearchChallengeBuildService {
    constructor(
        private readonly challengeHydration: ChallengeHydrationService,
        private readonly challengeResolver: ChallengeResolverService,
        private readonly elasticsearchService: ElasticsearchService,
    ) {}

    async buildMultilingualByChallengeId(
        challengeId: string,
    ): Promise<Array<LocalizedElasticsearchEntity<ChallengeEntity>>> {
        const hydratedChallenge = await this.challengeHydration.loadById(
            challengeId,
        )
        const defaultLocale = hydratedChallenge.defaultLocale ?? Locale.En
        return Object.values(Locale).map(
            (
                locale,
            ) => {
                const localizedChallenge = _.cloneDeep(hydratedChallenge)
                this.challengeResolver.transform(
                    localizedChallenge,
                    locale,
                    defaultLocale,
                )
                return {
                    locale,
                    entity: localizedChallenge,
                }
            },
        )
    }

    async buildIndexById(
        id: string,
    ): Promise<void> {
        const multilingualEntities = await this.buildMultilingualByChallengeId(id)
        for (const multilingualEntity of multilingualEntities) {
            await this.elasticsearchService.indexEntity(
                {
                    entity: ChallengeEntity,
                    data: multilingualEntity.entity,
                    locale: multilingualEntity.locale,
                },
            )
        }
    }
}
