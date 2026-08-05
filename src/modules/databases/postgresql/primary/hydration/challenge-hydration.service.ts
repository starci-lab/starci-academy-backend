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
/**
 * Loads a challenge plus SCHEMA V2 langs/steps/outputs/prerequisites for the
 * CDN/API read path so each resolver does not invent its own relation set.
 */
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
        const [
            requirements,
            steps,
            outputs,
            prerequisites,
        ] = await Promise.all([
            // SCHEMA V2 items — per-programming-language langs (+ lang translations)
            this.entityManager.find(
                ChallengeRequirementEntity,
                {
                    where: {
                        challenge: {
                            id: hydratedChallenge.id,
                        },
                    },
                    relations: {
                        langs: {
                            translations: true,
                        },
                    },
                    order: {
                        sortIndex: "ASC",
                    },
                },
            ),
            this.entityManager.find(
                ChallengeStepEntity,
                {
                    where: {
                        challenge: {
                            id: hydratedChallenge.id,
                        },
                    },
                    relations: {
                        langs: {
                            translations: true,
                        },
                    },
                    order: {
                        sortIndex: "ASC",
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
                        langs: {
                            translations: true,
                        },
                    },
                    order: {
                        sortIndex: "ASC",
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
                        langs: {
                            translations: true,
                        },
                    },
                    order: {
                        sortIndex: "ASC",
                    },
                },
            ),
        ])
        hydratedChallenge.requirements = requirements.map(
            (requirement) => requirement.toPlain<ChallengeRequirementEntity>(),
        )
        hydratedChallenge.steps = steps.map(
            (step) => step.toPlain<ChallengeStepEntity>(),
        )
        hydratedChallenge.outputs = outputs.map(
            (output) => output.toPlain<ChallengeOutputEntity>(),
        )
        hydratedChallenge.prerequisites = prerequisites.map(
            (prerequisite) => prerequisite.toPlain<ChallengePrerequisiteEntity>(),
        )
        return hydratedChallenge
    }
}
