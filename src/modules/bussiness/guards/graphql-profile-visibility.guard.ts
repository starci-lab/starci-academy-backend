import {
    CanActivate,
    ExecutionContext,
    Injectable,
} from "@nestjs/common"
import {
    GqlExecutionContext,
} from "@nestjs/graphql"
import {
    UserEntity,
} from "@modules/databases"
import {
    ProfileNotVisibleException,
} from "@modules/exceptions"
import {
    UserService,
} from "../user"

@Injectable()
/**
 * Guard for the public profile sub-queries (achievements / courses / activity
 * feed / contribution calendar / weekly stats / coding progress).
 *
 * When the target profile is locked (Facebook-style "lock profile") and the
 * viewer is NOT the owner, access is forbidden — so a locked profile's tab
 * content can never be read by anyone else, even via a direct API call. The
 * owner (and any unlocked profile) passes through. The public `userProfile`
 * header query is intentionally NOT guarded (name / avatar stay discoverable).
 *
 * The lock flag is read through {@link UserService.isProfileLocked} (Redis-cached,
 * one boolean per user, dropped on profile update) — the same caching shape as the
 * enrollment authorization check, so this guard never hits Postgres on the hot path.
 *
 * The target user id is read from the GraphQL args: `userId` for the scalar-arg
 * queries, or `request.userId` for the cursor-paginated feed. With no id present
 * the guard is a no-op (the resolver handles the missing arg). Must run AFTER
 * `KeycloakOptionalAuthGraphQLGuard`, which populates `req.user` for the owner check.
 */
export class GraphQLProfileVisibilityGuard implements CanActivate {
    constructor(
        private readonly userService: UserService,
    ) {}

    /**
     * Allow when the profile is unlocked or the viewer is the owner; otherwise
     * throw `ForbiddenException`.
     *
     * @param context - the execution context (resolved as a GraphQL context).
     * @returns true when access is permitted.
     */
    async canActivate(context: ExecutionContext): Promise<boolean> {
        const gql = GqlExecutionContext.create(context)
        // userId is a top-level arg on most queries, nested under `request` on the feed
        const args = gql.getArgs<Record<string, unknown>>()
        const request = args.request as { userId?: string } | undefined
        const userId = (args.userId as string | undefined) ?? request?.userId
        // nothing to guard without a target id → let the resolver handle it
        if (!userId) {
            return true
        }
        // the optional-auth guard (run before this) populates req.user when signed in
        const viewer = gql.getContext().req?.user as UserEntity | undefined
        // the owner always sees their own profile, locked or not
        if (viewer?.id === userId) {
            return true
        }
        // cached lock flag (Redis); locked + not the owner → withhold the content
        if (await this.userService.isProfileLocked(userId)) {
            throw new ProfileNotVisibleException({
                profileUserId: userId,
            })
        }
        return true
    }
}
