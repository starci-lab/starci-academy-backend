import {
    Injectable,
} from "@nestjs/common"
import {
    EntityManager,
} from "typeorm"
import {
    CodingProblemEntity,
    CodingVerdict,
    InjectPrimaryPostgreSQLEntityManager,
    Locale,
} from "@modules/databases"
import {
    CodingProblemNotFoundException,
} from "@modules/exceptions"
import {
    ElasticsearchService,
    codingProblemHintIndexName,
} from "@modules/elasticsearch"
import type {
    CodingLeaderboardEntry,
    CodingLeaderboardParams,
    CodingProblemHintResult,
    GetCodingProblemHintParams,
    GetCodingProblemParams,
    ListCodingProblemsParams,
    ListCodingProblemsResult,
} from "./types"

/** Default page size for problem listing. */
const DEFAULT_PAGE_SIZE = 20

/** Default number of ranked users returned by the leaderboard. */
const DEFAULT_LEADERBOARD_LIMIT = 50

/**
 * Read-side business logic for the coding-practice problem bank: listing with
 * filters + solved flags, single-problem detail (samples only, localized), and
 * the solved-count leaderboard. Never exposes hidden testcases.
 */
@Injectable()
export class CodingProblemService {
    constructor(
        @InjectPrimaryPostgreSQLEntityManager()
        private readonly entityManager: EntityManager,
        private readonly elasticsearchService: ElasticsearchService,
    ) {}

    /**
     * List enabled problems with optional difficulty/tag filters + pagination,
     * and the set of problems the user has already solved.
     *
     * @param params - filters, pagination, and optional userId/locale
     * @returns the page of problems, total count, and solved problem ids
     */
    async list({
        difficulty,
        tag,
        page = 1,
        limit = DEFAULT_PAGE_SIZE,
        userId,
        locale = Locale.En,
    }: ListCodingProblemsParams): Promise<ListCodingProblemsResult> {
        // build a query over enabled problems, eager-loading translations for title localization
        const query = this.entityManager
            .createQueryBuilder(CodingProblemEntity,
                "problem")
            .leftJoinAndSelect("problem.translations",
                "translation")
            .where("problem.enabled = :enabled",
                {
                    enabled: true 
                })
        // optional difficulty filter
        if (difficulty) {
            query.andWhere("problem.difficulty = :difficulty",
                {
                    difficulty 
                })
        }
        // optional tag filter — tags is a text[] column, use ANY for membership
        if (tag) {
            query.andWhere(":tag = ANY(problem.tags)",
                {
                    tag 
                })
        }
        // stable display order, then paginate
        query
            .orderBy("problem.orderIndex",
                "ASC")
            .skip((page - 1) * limit)
            .take(limit)
        // run the page query + total count together
        const [problems,
            total] = await query.getManyAndCount()
        // localize each problem's title in place for the requested locale
        problems.forEach((problem) => this.applyTranslation(problem,
            locale))
        // compute which of these the user has solved (Accepted), if authenticated
        const solvedProblemIds = userId
            ? await this.solvedProblemIds(userId)
            : []
        return {
            problems,
            total,
            solvedProblemIds,
        }
    }

    /**
     * Load one enabled problem by slug with starter code and SAMPLE testcases
     * only (hidden testcases are never returned), localized to the locale.
     *
     * @param params - slug + locale
     * @returns the problem with sample testcases + starter codes
     * @throws CodingProblemNotFoundException when missing or disabled
     */
    async getBySlug({
        slug,
        locale = Locale.En,
    }: GetCodingProblemParams): Promise<CodingProblemEntity> {
        // load the problem with the relations the detail view needs
        const problem = await this.entityManager.findOne(CodingProblemEntity,
            {
                where: {
                    slug,
                    enabled: true,
                },
                relations: {
                    translations: true,
                    starterCodes: true,
                    testcases: true,
                },
            })
        // missing/disabled → typed not-found
        if (!problem) {
            throw new CodingProblemNotFoundException({
                identifier: slug,
            })
        }
        // drop hidden testcases so only samples ever leave the server
        problem.testcases = problem.testcases
            .filter((testcase) => testcase.isSample)
            .sort((prev, next) => prev.orderIndex - next.orderIndex)
        // localize title/statement for the requested locale
        this.applyTranslation(problem,
            locale)
        return problem
    }

    /**
     * Load a problem's localized "approach hint" markdown from Elasticsearch.
     * Hints live only in ES (index `coding-problem-hints-<locale>`, keyed by
     * slug) — never in Postgres. Falls back to the English hint when the
     * requested locale has none, and returns null when no hint exists at all.
     *
     * @param params - slug + locale
     * @returns the hint document `{ slug, hint }`, or null when absent
     */
    async getHint({
        slug,
        locale = Locale.En,
    }: GetCodingProblemHintParams): Promise<CodingProblemHintResult | null> {
        // try the requested locale first, then fall back to English
        const candidateLocales = locale === Locale.En
            ? [Locale.En]
            : [locale,
                Locale.En]
        for (const candidate of candidateLocales) {
            const hint = await this.fetchHint(slug,
                candidate)
            if (hint !== null) {
                return hint
            }
        }
        return null
    }

    /**
     * Get one hint document by slug from a locale's index, or null when the
     * document/index is missing (ES throws 404 in both cases).
     */
    private async fetchHint(
        slug: string,
        locale: Locale,
    ): Promise<CodingProblemHintResult | null> {
        try {
            const result = await this.elasticsearchService.client.get({
                index: codingProblemHintIndexName(locale),
                id: slug,
            })
            const source = result._source as { slug?: string; hint?: string } | undefined
            // a document with no hint body is treated as "no hint"
            if (!source?.hint) {
                return null
            }
            return {
                slug,
                hint: source.hint,
            }
        } catch {
            // 404 (missing doc or index) → no hint for this locale
            return null
        }
    }

    /**
     * Top users by number of distinct solved problems.
     *
     * @param params - max entries to return
     * @returns ranked entries (highest solved count first)
     */
    async leaderboard({
        limit = DEFAULT_LEADERBOARD_LIMIT,
    }: CodingLeaderboardParams): Promise<Array<CodingLeaderboardEntry>> {
        // raw SQL over physical columns — count distinct solved problems per user
        const rows = await this.entityManager.query(
            `SELECT cs.user_id AS "userId",
                    u.username AS "username",
                    COUNT(DISTINCT cs.coding_problem_id) AS "solvedCount"
             FROM coding_submissions cs
             JOIN users u ON u.id = cs.user_id
             WHERE cs.verdict = $1
             GROUP BY cs.user_id, u.username
             ORDER BY "solvedCount" DESC
             LIMIT $2`,
            [CodingVerdict.Accepted,
                limit],
        ) as Array<{ userId: string; username: string | null; solvedCount: string }>
        // normalize the raw rows into typed entries
        return rows.map((row) => ({
            userId: row.userId,
            username: row.username ?? "",
            // COUNT comes back as a string from pg — parse to a number
            solvedCount: Number.parseInt(row.solvedCount,
                10),
        }))
    }

    /** Ids of problems the user has at least one Accepted submission for. */
    private async solvedProblemIds(userId: string): Promise<Array<string>> {
        // raw SQL over physical columns — distinct Accepted problem ids for the user
        const rows = await this.entityManager.query(
            `SELECT DISTINCT coding_problem_id AS "codingProblemId"
             FROM coding_submissions
             WHERE user_id = $1 AND verdict = $2`,
            [userId,
                CodingVerdict.Accepted],
        ) as Array<{ codingProblemId: string }>
        // flatten to a plain id array
        return rows.map((row) => row.codingProblemId)
    }

    /**
     * Override an entity's `title`/`statement` from its translations for the
     * given locale, in place. English (the default columns) is left untouched.
     */
    private applyTranslation(problem: CodingProblemEntity, locale: Locale): void {
        // English uses the default columns — nothing to override
        if (locale === Locale.En || !problem.translations) {
            return
        }
        // find the localized title/statement rows for this locale
        const titleRow = problem.translations.find(
            (translation) => translation.locale === locale && translation.field === "title",
        )
        const statementRow = problem.translations.find(
            (translation) => translation.locale === locale && translation.field === "statement",
        )
        // apply overrides when present (fall back to the default otherwise)
        if (titleRow) {
            problem.title = titleRow.value
        }
        if (statementRow) {
            problem.statement = statementRow.value
        }
    }
}
