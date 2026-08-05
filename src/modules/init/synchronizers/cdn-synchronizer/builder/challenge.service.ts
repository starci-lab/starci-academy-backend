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
    LocalizedCdnEntity,
} from "./types"
import {
    S3NameResolverService,
} from "@modules/s3"
import {
    MaterializeAndUploadService,
} from "./materialize-and-upload.service"
import _ from "lodash"

@Injectable()
/**
 * Loads a challenge from PostgreSQL and materializes **per-locale** plain objects for CDN JSON.
 */
export class CdnChallengeBuildService {
    constructor(
        private readonly challengeHydration: ChallengeHydrationService,
        private readonly challengeResolver: ChallengeResolverService,
        private readonly s3NameResolverService: S3NameResolverService,
        private readonly materializeAndUploadService: MaterializeAndUploadService,
    ) {}

    async buildMultilingualByChallengeId(
        challengeId: string,
    ): Promise<Array<LocalizedCdnEntity<ChallengeEntity>>> {
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

    async materializeAndUpload(
        challengeId: string,
    ): Promise<void> {
        const challenges = await this.buildMultilingualByChallengeId(
            challengeId,
        )
        await this.materializeAndUploadService.process(
            challenges,
            (
                id,
                locale,
            ) => this.s3NameResolverService.challenge(
                id,
                locale,
            ),
        )
    }
}
