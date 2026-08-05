import {
    Injectable,
} from "@nestjs/common"
import {
    EntityManager,
} from "typeorm"
import {
    MilestoneTaskEntity,
} from "@modules/databases/postgresql/primary/entities/milestone-task.entity"
import {
    ChallengeDifficulty,
} from "@modules/databases/postgresql/primary/enums/challenge-difficulty"
import {
    InjectPrimaryPostgreSQLEntityManager,
} from "@modules/databases/postgresql/primary/primary.decorators"
import {
    MOCK_INTERVIEW_CLASSIC_PROMPTS,
} from "./constants/classic-prompts"
import type {
    ListMockInterviewPromptsParams,
    ListMockInterviewPromptsResult,
} from "./types/mock-interview-prompts"

@Injectable()
/**
 * Builds the mock interview prompt bank for a course.
 *
 * The bank is course-scoped capstone `milestone_tasks` (each task = one prompt
 * the learner can be asked to work through) FOLLOWED BY a fixed set of curated
 * "classic" system-design prompts shared across every course (Pha 3) --
 * capstone systems come first since they're grounded in what this specific
 * course teaches, classics are supplementary practice. The grading rubric is
 * NOT exposed here -- it is resolved server-side at grade time (from the
 * task's approach/outcome criteria for capstones, from the rubric prompt
 * alone for classics).
 */
export class MockInterviewPromptsService {
    constructor(
        @InjectPrimaryPostgreSQLEntityManager()
        private readonly entityManager: EntityManager,
    ) {}

    /**
     * List the prompts a learner can pick to work through for one course.
     *
     * @param params - {@link ListMockInterviewPromptsParams}
     * @returns the course's capstone systems as interview prompts.
     *
     * @example
     * await service.list({ courseId })
     */
    async list(
        {
            courseId,
            locale,
        }: ListMockInterviewPromptsParams,
    ): Promise<ListMockInterviewPromptsResult> {
        // load every capstone task of the course (each milestone task = one prompt
        // to work through); filter through the milestone -> course relation
        const tasks = await this.entityManager.find(
            MilestoneTaskEntity,
            {
                where: {
                    milestone: {
                        course: {
                            id: courseId,
                        },
                    },
                },
                // curriculum order -- sortIndex is the stable per-task ordering
                order: {
                    sortIndex: "ASC",
                },
            },
        )

        // project each task into a prompt summary; difficulty is nullable on the
        // entity (sourced from a markdown heading) -> fall back to medium so the
        // client always has a tier to show
        const capstonePrompts = tasks.map((task) => ({
            id: task.id,
            title: task.title,
            difficulty: task.difficulty ?? ChallengeDifficulty.Medium,
            source: "capstone",
        }))

        // curated classics are the same fixed list for every course -- only the
        // rendered title changes with locale; the RAG grounding at ask/grade time
        // is what makes the SAME classic prompt read differently per course
        const classicPrompts = MOCK_INTERVIEW_CLASSIC_PROMPTS.map((prompt) => ({
            id: prompt.id,
            title: prompt.title[locale],
            difficulty: prompt.difficulty,
            source: "classic",
        }))

        return {
            // capstone systems first (course-grounded curriculum), classics after
            // (supplementary, course-agnostic practice)
            prompts: [
                ...capstonePrompts,
                ...classicPrompts,
            ],
        }
    }
}
