import {
    IQuery,
} from "@nestjs/cqrs"

export class PersonalFeedbacksQuery implements IQuery {
    constructor(
        public readonly params: {
            readonly enrollmentId: string
        },
    ) {}
}
