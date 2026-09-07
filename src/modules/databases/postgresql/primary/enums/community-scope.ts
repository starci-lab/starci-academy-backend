import {
    registerEnumType
} from "@nestjs/graphql"

/**
 * Which community a post/comment belongs to. Stored in the `scope` column of
 * `community_posts` and mirrored into outbox payloads so a socket/GraphQL
 * consumer can route the row to the right feed without a join.
 */
export enum CommunityScope {
    /** Routes the row into the site-wide community feed, visible to every learner. */
    Global = "GLOBAL",
    /** Routes the row into one course's community feed, visible only to that course's participants. */
    Course = "COURSE",
}

registerEnumType(CommunityScope,
    {
        name: "CommunityScope",
    })
