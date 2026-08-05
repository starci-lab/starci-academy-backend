import {
    Field,
    ObjectType,
} from "@nestjs/graphql"
import {
    AbstractGraphQLResponse,
    IAbstractGraphQLResponse,
} from "@modules/api"

@ObjectType({
    description: "An upcoming livestream occurrence from one of the viewer's enrolled courses.",
})
/**
 * One upcoming livestream occurrence for the dashboard rail — the soonest next
 * airing of a recurring weekly slot from one of the viewer's enrolled courses.
 * `nextStartAt` / `nextEndAt` are concrete instants computed from the slot's
 * weekday + wall-clock times, so the client can render an absolute countdown.
 */
export class UpcomingLivestreamData {
    @Field(
        () => String,
        {
            description: "Opaque global id of the course — pass to resolveRoute on click.",
        },
    )
        courseGlobalId: string

    @Field(
        () => String,
        {
            description: "Course title (localized to the viewer's locale where available).",
        },
    )
        courseTitle: string

    @Field(
        () => String,
        {
            description: "Human-readable course display id (e.g. the course slug/code).",
        },
    )
        courseDisplayId: string

    @Field(
        () => String,
        {
            nullable: true,
            description: "Session note used as a title; null when the slot has no note.",
        },
    )
        sessionTitle: string | null

    @Field(
        () => Date,
        {
            description: "Concrete instant of the next occurrence's start.",
        },
    )
        nextStartAt: Date

    @Field(
        () => Date,
        {
            nullable: true,
            description: "Concrete instant of the next occurrence's expected end; null when unknown.",
        },
    )
        nextEndAt: Date | null
}

@ObjectType({
    description: "Response wrapper for the myUpcomingLivestreams query.",
})
/**
 * Response wrapper for the myUpcomingLivestreams query.
 */
export class MyUpcomingLivestreamsResponse
    extends AbstractGraphQLResponse
    implements IAbstractGraphQLResponse<Array<UpcomingLivestreamData>> {
    @Field(
        () => [UpcomingLivestreamData],
        {
            description: "Upcoming livestreams across enrolled courses, soonest first.",
        },
    )
        data: Array<UpcomingLivestreamData>
}
