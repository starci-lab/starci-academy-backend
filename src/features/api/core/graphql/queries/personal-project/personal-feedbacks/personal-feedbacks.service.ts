import {
    Injectable,
} from "@nestjs/common"
import {
    QueryBus,
} from "@nestjs/cqrs"
import {
    PersonalProjectAttemptEntity,
} from "@modules/databases"
import {
    PersonalFeedbacksQuery,
} from "./personal-feedbacks.query"

@Injectable()
export class PersonalFeedbacksService {
    constructor(
        private readonly queryBus: QueryBus,
    ) {}

    async execute(
        params: PersonalFeedbacksQuery["params"],
    ): Promise<Array<PersonalProjectAttemptEntity>> {
        return this.queryBus.execute(
            new PersonalFeedbacksQuery(params),
        )
    }
}
