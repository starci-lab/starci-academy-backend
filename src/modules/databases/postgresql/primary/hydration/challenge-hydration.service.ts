import {
    Injectable,
} from "@nestjs/common"
import type {
    EntityManager,
} from "typeorm"
import {
    ChallengeEntity,
    ChallengeOutputEntity,
    ChallengeOutputV2Entity,
    ChallengePrerequisiteEntity,
    ChallengePrerequisiteV2Entity,
    ChallengeReferenceEntity,
    ChallengeRequirementEntity,
    ChallengeRequirementV2Entity,
    ChallengeStepEntity,
    ChallengeStepV2Entity,
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
                    sortIndex: "ASC",
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
            requirementsV2,
            stepsV2,
            outputsV2,
            prerequisitesV2,
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
                        translations: true,
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
                        translations: true,
                    },
                    order: {
                        sortIndex: "ASC",
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
                        sortIndex: "ASC",
                    },
                },
            ),
            // SCHEMA V2 items — per-programming-language langs (+ lang translations)
            this.entityManager.find(
                ChallengeRequirementV2Entity,
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
                ChallengeStepV2Entity,
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
                ChallengeOutputV2Entity,
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
                ChallengePrerequisiteV2Entity,
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
        hydratedChallenge.requirementsV2 = requirementsV2.map(
            (requirementV2) => requirementV2.toPlain<ChallengeRequirementV2Entity>(),
        )
        hydratedChallenge.stepsV2 = stepsV2.map(
            (stepV2) => stepV2.toPlain<ChallengeStepV2Entity>(),
        )
        hydratedChallenge.outputsV2 = outputsV2.map(
            (outputV2) => outputV2.toPlain<ChallengeOutputV2Entity>(),
        )
        hydratedChallenge.prerequisitesV2 = prerequisitesV2.map(
            (prerequisiteV2) => prerequisiteV2.toPlain<ChallengePrerequisiteV2Entity>(),
        )
        return hydratedChallenge
    }
}
