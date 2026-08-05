import {
    Injectable,
} from "@nestjs/common"
import {
    judge,
} from "./judge"
import type {
    Verdict,
} from "./judge"

@Injectable()
/**
 * Nest facade over {@link judge}.
 *
 * No injectable dependencies -- this wrapper exists so a spec that already
 * boots `Test.createTestingModule` can resolve grading the same way it
 * resolves everything else, not because judge needs a container.
 */
export class JudgeService {
    /**
     * Grade one harness output against a rubric.
     *
     * @param rubric - the grading criteria the output must satisfy
     * @param output - the text under evaluation
     * @returns the structured {@link Verdict}
     */
    public judge(
        rubric: string,
        output: string,
    ): Promise<Verdict> {
        return judge(rubric,
            output)
    }
}
