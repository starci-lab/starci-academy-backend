import {
    ICQRSHandler,
} from "@modules/cqrs"
import {
    UserEntity,
} from "@modules/databases"
import {
    UserNotFoundException,
} from "@modules/exceptions"
import {
    Injectable,
} from "@nestjs/common"
import {
    IQueryHandler,
    QueryHandler,
} from "@nestjs/cqrs"
import {
    MeQuery,
} from "./me.query"

/**
 * Handles the `me` query: returns the authenticated user from the
 * request context and (optionally) fires side-effect events.
 *
 * Canonical example of the clean CQRS pattern used across the API:
 *   - `extends ICQRSHandler<Query, Response>` — inherits the
 *     validate/process/emit lifecycle.
 *   - `implements IQueryHandler<Query, Response>` + `@QueryHandler`
 *     decorator — registers the handler with `@nestjs/cqrs`.
 *   - The query/command is passed via `execute(query)` (NOT the
 *     constructor). Only true dependencies are injected.
 */
@QueryHandler(MeQuery)
@Injectable()
export class MeHandler
    extends ICQRSHandler<MeQuery, UserEntity>
    implements IQueryHandler<MeQuery, UserEntity> {
    constructor(
    ) {
        super()
    }

    /**
     * Process the query.
     * @param query - The query.
     * @returns The user.
     */
    protected override async process(
        query: MeQuery
    ): Promise<UserEntity> {
        const {
            user,
        } = query.params
        if (!user) {
            throw new UserNotFoundException({
            })
        }
        return user
    }
}
