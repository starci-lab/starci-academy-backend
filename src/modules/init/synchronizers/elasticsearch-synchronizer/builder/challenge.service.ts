import {
    ChallengeEntity,
} from "@modules/databases/postgresql/primary/entities/challenge.entity"
import {
    Locale,
} from "@modules/databases/postgresql/primary/enums/locale"
import {
    ChallengeHydrationService,
} from "@modules/databases/postgresql/primary/hydration/challenge-hydration.service"
import {
    ChallengeResolverService,
} from "@modules/databases/postgresql/primary/resolvers/challenge-resolver.service"
import {
    Injectable,
} from "@nestjs/common"
import type {
    LocalizedElasticsearchEntity,
} from "./types"
import {
    ElasticsearchService,
} from "@modules/integrations/elasticsearch/elasticsearch.service"
import {
    buildCompletionSuggest,
} from "@modules/integrations/elasticsearch/utils/completion"
import _ from "lodash"

@Injectable()
/**
 * Hydrates a challenge and indexes **per-locale** ES docs with completion
 * suggest on the resolved title. Search cannot join PG translations, so each
 * locale is a standalone document.
 */
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
                // populate the ES completion field: the clean challenge title as the
                // suggest input, weighted by display order (earlier = more popular) so
                // the FST-backed autocomplete returns clean, ranked suggestions.
                const label = (localizedChallenge.title ?? "").trim()
                const suggest = buildCompletionSuggest({
                    inputs: [label],
                    weight: Math.max(1,
                        100 - (localizedChallenge.orderIndex ?? 0)),
                })
                return {
                    locale,
                    entity: Object.assign(
                        localizedChallenge,
                        {
                            suggest,
                        },
                    ),
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
