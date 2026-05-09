import {
    ICQRSHandler,
} from "@modules/cqrs"
import {
    InjectPrimaryPostgreSQLEntityManager,
    PersonalProjectAttemptEntity,
} from "@modules/databases"
import {
    Injectable,
} from "@nestjs/common"
import {
    IQueryHandler,
    QueryHandler,
} from "@nestjs/cqrs"
import type {
    EntityManager,
} from "typeorm"
import {
    PersonalFeedbacksQuery,
} from "./personal-feedbacks.query"

@QueryHandler(PersonalFeedbacksQuery)
@Injectable()
export class PersonalFeedbacksHandler
    extends ICQRSHandler<PersonalFeedbacksQuery, Array<PersonalProjectAttemptEntity>>
    implements IQueryHandler<PersonalFeedbacksQuery, Array<PersonalProjectAttemptEntity>> {
    constructor(
        @InjectPrimaryPostgreSQLEntityManager()
        private readonly entityManager: EntityManager,
    ) {
        super()
    }

    protected override async process(
        query: PersonalFeedbacksQuery,
    ): Promise<Array<PersonalProjectAttemptEntity>> {
        return this.entityManager.find(
            PersonalProjectAttemptEntity,
            {
                where: {
                    enrollmentId: query.params.enrollmentId,
                },
                relations: {
                    feedbacks: true,
                },
                order: {
                    attemptNumber: "DESC",
                    feedbacks: {
                        orderIndex: "ASC",
                    },
                },
            },
        )
    }
}
