import {
    Injectable,
} from "@nestjs/common"
import type {
    EntityManager,
} from "typeorm"
import {
    ChallengeEntity,
    ChallengeOutputEntity,
    ChallengePrerequisiteEntity,
    ChallengeReferenceEntity,
    ChallengeRequirementEntity,
    ChallengeStepEntity,
} from "../entities"
import {
    InjectPrimaryPostgreSQLEntityManager,
} from "../primary.decorators"
import {
    ChallengeNotFoundException,
} from "@modules/exceptions"

@Injectable()
export class ChallengeHydrationService {
    constructor(
        @InjectPrimaryPostgreSQLEntityManager()
        private readonly entityManager: EntityManager,
    ) { }

    async loadById(
        id: string,
    ): Promise<ChallengeEntity> {
        const challenge = await this.entityManager.findOne(
            ChallengeEntity,
            {
                where: {
                    id,
                },
                relations: {
                    translations: true,
                },
            },
        )
        if (!challenge) {
            throw new ChallengeNotFoundException({
                id,
            })
        }
        const hydratedChallenge = challenge.toPlain<ChallengeEntity>()
        const steps = await this.entityManager.find(
            ChallengeStepEntity,
            {
                where: {
                    challenge: {
                        id: hydratedChallenge.id,
                    },
                },
                relations: {
                    translations: true,
                },
                order: {
                    orderIndex: "ASC",
                },
            },
        )
        hydratedChallenge.steps = steps.map(
            (step) => step.toPlain<ChallengeStepEntity>(),
        )
        const [
            references,
            outputs,
            prerequisites,
            requirements,
        ] = await Promise.all([
            this.entityManager.find(
                ChallengeReferenceEntity,
                {
                    where: {
                        challenge: {
                            id: hydratedChallenge.id,
                        },
                    },
                    relations: {
                        translations: true,
                    },
                    order: {
                        orderIndex: "ASC",
                    },
                },
            ),
            this.entityManager.find(
                ChallengeOutputEntity,
                {
                    where: {
                        challenge: {
                            id: hydratedChallenge.id,
                        },
                    },
                    relations: {
                        translations: true,
                    },
                    order: {
                        orderIndex: "ASC",
                    },
                },
            ),
            this.entityManager.find(
                ChallengePrerequisiteEntity,
                {
                    where: {
                        challenge: {
                            id: hydratedChallenge.id,
                        },
                    },
                    relations: {
                        translations: true,
                    },
                    order: {
                        orderIndex: "ASC",
                    },
                },
            ),
            this.entityManager.find(
                ChallengeRequirementEntity,
                {
                    where: {
                        challenge: {
                            id: hydratedChallenge.id,
                        },
                    },
                    relations: {
                        translations: true,
                    },
                    order: {
                        orderIndex: "ASC",
                    },
                },
            ),
        ])
        hydratedChallenge.references = references.map(
            (reference) => reference.toPlain<ChallengeReferenceEntity>(),
        )
        hydratedChallenge.outputs = outputs.map(
            (output) => output.toPlain<ChallengeOutputEntity>(),
        )
        hydratedChallenge.prerequisites = prerequisites.map(
            (prerequisite) => prerequisite.toPlain<ChallengePrerequisiteEntity>(),
        )
        hydratedChallenge.requirements = requirements.map(
            (requirement) => requirement.toPlain<ChallengeRequirementEntity>(),
        )
        return hydratedChallenge
    }
}
