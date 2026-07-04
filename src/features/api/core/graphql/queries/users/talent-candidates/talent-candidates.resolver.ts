import {
    Args,
    ID,
    Int,
    Query,
    Resolver,
} from "@nestjs/graphql"
import {
    UseGuards,
    UseInterceptors,
} from "@nestjs/common"
import {
    GraphQLSuccessMessage,
    GraphQLTransformInterceptor,
} from "@modules/api"
import {
    KeycloakOptionalAuthGraphQLGuard,
} from "@modules/keycloak"
import {
    UseThrottler,
    ThrottlerConfig,
} from "@modules/throttler"
import {
    Locale,
} from "@modules/databases"
import {
    TalentCandidatesService,
} from "./talent-candidates.service"
import {
    TalentCandidateItem,
    TalentCandidatesResponse,
} from "./graphql-types"

/** Hard cap on page size to bound the ranking query regardless of client input. */
const MAX_LIMIT = 48

/**
 * Recruiter marketplace query: open-to-work candidates FILTERED to ONE track
 * (course) and RANKED by that track's `depthScore` DESC. Optional auth — anyone
 * may browse (the listed users opted into being discoverable). Offset-paginated.
 *
 * Fairness contract (WF-01/WF-02): the `courseId` arg picks exactly ONE track;
 * ranking uses only THAT track's depth. There is deliberately no "sort by total
 * across all tracks" — a recruiter chooses one track to rank on, never a blended
 * composite (which the fair-monetization axiom forbids). Each item carries the
 * track's `band` / `isQualified` so the FE shows qualitative badges, not just a
 * raw number.
 */
@Resolver()
export class TalentCandidatesResolver {
    constructor(
        private readonly talentCandidatesService: TalentCandidatesService,
    ) {}

    @UseThrottler(ThrottlerConfig.Soft)
    @UseGuards(KeycloakOptionalAuthGraphQLGuard)
    @GraphQLSuccessMessage({
        [Locale.En]: "Talent candidates fetched successfully",
        [Locale.Vi]: "Lấy danh sách ứng viên theo lộ trình thành công",
    })
    @UseInterceptors(GraphQLTransformInterceptor)
    @Query(
        () => TalentCandidatesResponse,
        {
            name: "talentCandidates",
            description: "Open-to-work candidates for ONE track (courseId), ranked by that track's depthScore DESC — never a cross-track composite.",
        },
    )
    async execute(
        @Args(
            "courseId",
            {
                type: () => ID,
                description: "The track to filter + rank on — the courseId of a userJobReadiness track. Ranking is scoped to this course's depth only.",
            },
        )
            courseId: string,
        @Args(
            "limit",
            {
                type: () => Int,
                nullable: true,
                defaultValue: 24,
                description: "Max candidates per page.",
            },
        )
            limit: number,
        @Args(
            "offset",
            {
                type: () => Int,
                nullable: true,
                defaultValue: 0,
                description: "Rows to skip (offset pagination).",
            },
        )
            offset: number,
    ): Promise<Array<TalentCandidateItem>> {
        // clamp page size; never trust the client with an unbounded scan
        const take = Math.min(Math.max(limit ?? 24,
            1),
        MAX_LIMIT)
        const skip = Math.max(offset ?? 0,
            0)
        return this.talentCandidatesService.rankByTrack({
            courseId,
            limit: take,
            offset: skip,
        })
    }
}
