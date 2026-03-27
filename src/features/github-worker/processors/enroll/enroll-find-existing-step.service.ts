import {
    EnrollmentEntity,
} from "@modules/databases"
import {
    Injectable,
} from "@nestjs/common"
import type {
    EntityManager,
} from "typeorm"

export interface EnrollFindExistingStepParams {
    userId: string
    courseId: string
    entityManager: EntityManager
}

export type EnrollFindExistingStepResult = EnrollmentEntity | null

/**
 * Step service: check whether enrollment already exists.
 */
@Injectable()
export class EnrollFindExistingStepService {
    async execute({
        userId,
        courseId,
        entityManager,
    }: EnrollFindExistingStepParams): Promise<EnrollFindExistingStepResult> {
        return entityManager.findOne(
            EnrollmentEntity,
            {
                where: {
                    user: {
                        id: userId,
                    },
                    course: {
                        id: courseId,
                    },
                },
            },
        )
    }
}
