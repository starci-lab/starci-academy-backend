import {
    Args,
    ID,
    Query,
    Resolver,
} from "@nestjs/graphql"
import {
    UseGuards,
    UseInterceptors,
} from "@nestjs/common"
import type {
    EntityManager,
} from "typeorm"
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
    InjectPrimaryPostgreSQLEntityManager,
    Locale,
} from "@modules/databases"
import {
    GraphQLProfileVisibilityGuard,
} from "@modules/bussiness"
import {
    UserCodingSkillsData,
    UserCodingSkillsResponse,
} from "./graphql-types"
import {
    UserCodingSkillDifficultyRow,
    UserCodingSkillLanguageRow,
} from "./types"

/**
 * Public profile query: a user's solved-coding breakdown — distinct problems
 * solved (Accepted) grouped by submission language and by problem difficulty.
 * Powers a skills view. Optional auth — anonymous viewers may call it; a locked
 * profile is withheld from non-owners by {@link GraphQLProfileVisibilityGuard}.
 * Two grouped raw counts (distinct-per-bucket is accurate; summing one grouping
 * to derive the other would double-count multi-language solves).
 */
@Resolver()
export class UserCodingSkillsResolver {
    constructor(
        @InjectPrimaryPostgreSQLEntityManager()
        private readonly entityManager: EntityManager,
    ) {}

    @UseThrottler(ThrottlerConfig.Soft)
    @UseGuards(KeycloakOptionalAuthGraphQLGuard,
        GraphQLProfileVisibilityGuard)
    @GraphQLSuccessMessage({
        [Locale.En]: "Coding skills fetched successfully",
        [Locale.Vi]: "Lấy kỹ năng lập trình thành công",
    })
    @UseInterceptors(GraphQLTransformInterceptor)
    @Query(
        () => UserCodingSkillsResponse,
        {
            name: "userCodingSkills",
            description: "A user's solved-coding breakdown by language + difficulty, by user id.",
        },
    )
    async execute(
        @Args(
            "userId",
            {
                type: () => ID,
                description: "Id of the user whose coding skills to fetch.",
            },
        )
            userId: string,
    ): Promise<UserCodingSkillsData> {
        // two independent groupings so each distinct-problem count is exact
        const [languageRows,
            difficultyRows] = await Promise.all([
            this.entityManager.query<Array<UserCodingSkillLanguageRow>>(
                `
                SELECT cs.language AS "language",
                       COUNT(DISTINCT cs.coding_problem_id)::int AS "solved"
                FROM coding_submissions cs
                WHERE cs.user_id = $1 AND cs.verdict = 'accepted'
                GROUP BY cs.language
                ORDER BY "solved" DESC
                `,
                [
                    userId,
                ],
            ),
            this.entityManager.query<Array<UserCodingSkillDifficultyRow>>(
                `
                SELECT cp.difficulty AS "difficulty",
                       COUNT(DISTINCT cs.coding_problem_id)::int AS "solved"
                FROM coding_submissions cs
                JOIN coding_problems cp ON cp.id = cs.coding_problem_id
                WHERE cs.user_id = $1 AND cs.verdict = 'accepted'
                GROUP BY cp.difficulty
                `,
                [
                    userId,
                ],
            ),
        ])

        // normalise both groupings to the shared { key, solved } bucket shape
        return {
            byLanguage: languageRows.map((row) => ({
                key: row.language,
                solved: row.solved,
            })),
            byDifficulty: difficultyRows.map((row) => ({
                key: row.difficulty,
                solved: row.solved,
            })),
        }
    }
}
