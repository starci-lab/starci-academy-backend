import {
    Injectable,
} from "@nestjs/common"
import type {
    EntityManager,
} from "typeorm"
import {
    In,
} from "typeorm"
import {
    ChallengeOutputEntity,
} from "../entities/challenge-output.entity"
import {
    ChallengePrerequisiteEntity,
} from "../entities/challenge-prerequisite.entity"
import {
    ChallengeRequirementEntity,
} from "../entities/challenge-requirement.entity"
import {
    ChallengeStepEntity,
} from "../entities/challenge-step.entity"
import {
    ChallengeSubmissionEntity,
} from "../entities/challenge-submission.entity"
import {
    ChallengeEntity,
} from "../entities/challenge.entity"
import {
    InjectPrimaryPostgreSQLEntityManager,
} from "../primary.decorators"
import {
    ChallengeNotFoundException,
} from "@modules/platform/exceptions/errors/courses/challenge-not-found"

@Injectable()
/**
 * Loads complete challenge graphs for the CDN/API read path so each caller
 * receives the same ordered nested collections and submission definitions.
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
        const [hydratedChallenge] = await this.hydrateChallenges([challenge])
        return hydratedChallenge
    }

    async loadByContentId(
        contentId: string,
    ): Promise<Array<ChallengeEntity>> {
        const challenges = await this.entityManager.find(
            ChallengeEntity,
            {
                where: {
                    content: {
                        id: contentId,
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
        return this.hydrateChallenges(challenges)
    }

    private async hydrateChallenges(
        challenges: Array<ChallengeEntity>,
    ): Promise<Array<ChallengeEntity>> {
        if (!challenges.length) {
            return []
        }
        const challengeIds = challenges.map((challenge) => challenge.id)
        const [
            requirements,
            steps,
            outputs,
            prerequisites,
            submissions,
        ] = await Promise.all([
            this.entityManager.find(
                ChallengeRequirementEntity,
                {
                    where: {
                        challenge: {
                            id: In(challengeIds),
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
                            id: In(challengeIds),
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
                            id: In(challengeIds),
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
                            id: In(challengeIds),
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
                ChallengeSubmissionEntity,
                {
                    where: {
                        challenge: {
                            id: In(challengeIds),
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
        ])
        return challenges.map((challenge) => {
            const hydratedChallenge = challenge.toPlain<ChallengeEntity>()
            hydratedChallenge.requirements = requirements
                .filter((requirement) => requirement.challengeId === challenge.id)
                .map((requirement) => requirement.toPlain<ChallengeRequirementEntity>())
            hydratedChallenge.steps = steps
                .filter((step) => step.challengeId === challenge.id)
                .map((step) => step.toPlain<ChallengeStepEntity>())
            hydratedChallenge.outputs = outputs
                .filter((output) => output.challengeId === challenge.id)
                .map((output) => output.toPlain<ChallengeOutputEntity>())
            hydratedChallenge.prerequisites = prerequisites
                .filter((prerequisite) => prerequisite.challengeId === challenge.id)
                .map((prerequisite) => prerequisite.toPlain<ChallengePrerequisiteEntity>())
            hydratedChallenge.submissions = submissions
                .filter((submission) => submission.challengeId === challenge.id)
                .map((submission) => submission.toPlain<ChallengeSubmissionEntity>())
            return hydratedChallenge
        })
    }
}
