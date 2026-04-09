import {
    ChallengeEntity,
} from "@modules/databases"
import {
    ChallengeNotFoundException,
} from "@modules/exceptions"
import {
    Injectable,
} from "@nestjs/common"
import {
    ChallengeTransformerService,
} from "../../../utils"
import type {
    ChallengeRequest,
} from "./graphql-types"
import type {
    ExecuteParams,
} from "../../../../types"
import {
    S3NameResolverService,
    S3Provider,
    S3ReadService,
    UploadPayload,
} from "@modules/s3"
import {
    InjectSuperJson,
} from "@modules/mixin"
import SuperJSON from "superjson"

/**
 * Service for querying challenges.
 */
@Injectable()
export class ChallengeQueryService {
    constructor(
        private readonly challengeTransformer: ChallengeTransformerService,
        private readonly s3ReadService: S3ReadService,
        private readonly s3NameResolverService: S3NameResolverService,
        @InjectSuperJson()
        private readonly superJson: SuperJSON,
    ) {}

    /**
     * Entry: returns one challenge by primary id.
     *
     * @param request - Wrapper with challenge id
     * @param request.id - Challenge id
     * @throws {ChallengeNotFoundException} When no challenge exists for `id`.
     */
    async execute(
        {
            request,
            locale,
        }: ExecuteParams<ChallengeRequest>,
    ): Promise<ChallengeEntity> {
        const objectKey = this.s3NameResolverService.challenge(request.id)

        const cdnPayload = await this.s3ReadService.json<UploadPayload>({
            key: objectKey,
            provider: S3Provider.Minio,
        }).catch(() => null)

        if (!cdnPayload) {
            throw new ChallengeNotFoundException(
                {
                    id: request.id,
                },
            )
        }

        const hydratedChallenge = this.superJson.parse<ChallengeEntity>(cdnPayload.data)
        this.challengeTransformer.transform(
            hydratedChallenge,
            locale,
            hydratedChallenge.defaultLocale,
        )
        return hydratedChallenge
    }
}
