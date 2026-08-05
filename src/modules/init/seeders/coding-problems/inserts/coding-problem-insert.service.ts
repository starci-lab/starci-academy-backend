import {
    Injectable,
} from "@nestjs/common"
import {
    EntityManager,
} from "typeorm"
import {
    v5 as uuidv5,
} from "uuid"
import {
    envConfig,
} from "@modules/env"
import {
    CodingProblemEntity,
    CodingProblemStarterCodeEntity,
    CodingProblemSolutionEntity,
    CodingProblemTestcaseEntity,
    CodingProblemTranslationEntity,
    InjectPrimaryPostgreSQLEntityManager,
} from "@modules/databases"
import type {
    ParsedCodingProblem,
} from "../types"

@Injectable()
/**
 * Upserts parsed coding problems into the database. Problem ids are derived
 * deterministically from the slug (uuid v5) so re-seeding is idempotent; child
 * rows (testcases, starter codes, translations) are replaced wholesale to
 * reflect mount edits/removals.
 */
export class CodingProblemInsertService {
    constructor(
        @InjectPrimaryPostgreSQLEntityManager()
        private readonly entityManager: EntityManager,
    ) {}

    /**
     * Upsert many parsed problems.
     * @param problems - parsed problems from the mount data
     * @returns number of problems upserted
     */
    async upsertMany(problems: Array<ParsedCodingProblem>): Promise<number> {
        // process each problem in its own transaction so one bad row can't abort all
        for (const problem of problems) {
            await this.upsertOne(problem)
        }
        return problems.length
    }

    /**
     * Upsert a single problem and replace its child rows.
     * @param problem - the parsed problem
     */
    private async upsertOne(problem: ParsedCodingProblem): Promise<void> {
        // deterministic id from the slug -> stable across re-seeds
        const id = uuidv5(problem.slug,
            envConfig().uuidNamespace.codingProblem)
        // do the parent upsert + child replacement atomically
        await this.entityManager.transaction(async (entityManager) => {
            // upsert the parent problem row by its deterministic id
            await entityManager.save(CodingProblemEntity,
                {
                    id,
                    slug: problem.slug,
                    difficulty: problem.difficulty,
                    domain: problem.domain,
                    title: problem.title,
                    statement: problem.statement,
                    tags: problem.tags,
                    timeLimitMs: problem.timeLimitMs,
                    memoryLimitKb: problem.memoryLimitKb,
                    points: problem.points,
                    orderIndex: problem.orderIndex,
                    sortIndex: problem.sortIndex,
                    enabled: problem.enabled,
                })
            // wipe existing children so removed mount rows disappear.
            // testcase + starter expose the FK only via the `problem` relation
            // (`codingProblemId` is a read-only @RelationId), so filter by it;
            // translation keeps `codingProblemId` (a real composite-PK column).
            await entityManager.delete(CodingProblemTestcaseEntity,
                {
                    problem: {
                        id,
                    },
                })
            await entityManager.delete(CodingProblemStarterCodeEntity,
                {
                    problem: {
                        id,
                    },
                })
            await entityManager.delete(CodingProblemSolutionEntity,
                {
                    problem: {
                        id,
                    },
                })
            await entityManager.delete(CodingProblemTranslationEntity,
                {
                    codingProblemId: id,
                })
            // insert testcases (deterministic ids keyed by problem id + order index)
            if (problem.testcases.length > 0) {
                await entityManager.save(
                    CodingProblemTestcaseEntity,
                    problem.testcases.map((testcase) => ({
                        id: uuidv5(`${problem.slug}:tc:${testcase.orderIndex}`,
                            envConfig().uuidNamespace.codingProblem),
                        problem: {
                            id,
                        },
                        input: testcase.input,
                        expectedOutput: testcase.expectedOutput,
                        isSample: testcase.isSample,
                        orderIndex: testcase.orderIndex,
                        sortIndex: testcase.sortIndex,
                    })),
                )
            }
            // insert starter codes (one per language)
            if (problem.starterCodes.length > 0) {
                await entityManager.save(
                    CodingProblemStarterCodeEntity,
                    problem.starterCodes.map((starterCode) => ({
                        id: uuidv5(`${problem.slug}:starter:${starterCode.language}`,
                            envConfig().uuidNamespace.codingProblem),
                        problem: {
                            id,
                        },
                        language: starterCode.language,
                        code: starterCode.code,
                    })),
                )
            }
            // insert solutions (one per language) -- deterministic id keyed by
            // problem id + language, replaced wholesale like starter codes
            if (problem.solutions.length > 0) {
                await entityManager.save(
                    CodingProblemSolutionEntity,
                    problem.solutions.map((solution) => ({
                        id: uuidv5(`${problem.slug}:solution:${solution.language}`,
                            envConfig().uuidNamespace.codingProblem),
                        problem: {
                            id,
                        },
                        language: solution.language,
                        code: solution.code,
                    })),
                )
            }
            // insert translations -- one row per (locale, field) for title + statement
            const translationRows = problem.translations.flatMap((translation) => [
                {
                    codingProblemId: id,
                    locale: translation.locale,
                    field: "title",
                    value: translation.title,
                },
                {
                    codingProblemId: id,
                    locale: translation.locale,
                    field: "statement",
                    value: translation.statement,
                },
            ])
            if (translationRows.length > 0) {
                await entityManager.save(CodingProblemTranslationEntity,
                    translationRows)
            }
        })
    }
}
