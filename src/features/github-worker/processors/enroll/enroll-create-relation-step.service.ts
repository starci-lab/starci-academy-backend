import {
    EnrollmentEntity,
} from "@modules/databases"
import {
    Injectable,
} from "@nestjs/common"
import type {
    EntityManager,
} from "typeorm"

export interface EnrollCreateRelationStepParams {
    userId: string
    courseId: string
    entityManager: EntityManager
}

export type EnrollCreateRelationStepResult = EnrollmentEntity

/**
 * Step service: create enrollment relation between user and course.
 */
@Injectable()
export class EnrollCreateRelationStepService {
    async execute({
        userId,
        courseId,
        entityManager,
    }: EnrollCreateRelationStepParams): Promise<EnrollCreateRelationStepResult> {
        const relation = entityManager.create(
            EnrollmentEntity,
            {
                user: {
                    id: userId,
                },
                course: {
                    id: courseId,
                },
            },
        )
        return entityManager.save(
            relation,
        )
    }
}
