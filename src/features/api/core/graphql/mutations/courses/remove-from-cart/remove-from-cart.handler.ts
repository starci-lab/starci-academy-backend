import {
    ICQRSHandler,
} from "@modules/cqrs"
import {
    InjectPrimaryPostgreSQLEntityManager,
    CartItemEntity,
} from "@modules/databases"
import {
    UserNotFoundException,
} from "@modules/exceptions"
import {
    Injectable,
} from "@nestjs/common"
import {
    CommandHandler,
    ICommandHandler,
} from "@nestjs/cqrs"
import type {
    EntityManager,
} from "typeorm"
import {
    RemoveFromCartCommand,
} from "./remove-from-cart.command"
import type {
    RemoveFromCartResponseData,
} from "./graphql-types"

@CommandHandler(RemoveFromCartCommand)
@Injectable()
/**
 * Handler for the removeFromCart mutation.
 *
 * Idempotently deletes the caller's `(user, course)` cart row: removing a course
 * that was never in the cart is not an error — it simply reports `removed: false`.
 */
export class RemoveFromCartHandler
    extends ICQRSHandler<RemoveFromCartCommand, RemoveFromCartResponseData>
    implements ICommandHandler<RemoveFromCartCommand, RemoveFromCartResponseData> {
    /**
     * Constructor.
     * @param entityManager - The primary PostgreSQL entity manager.
     */
    constructor(
        @InjectPrimaryPostgreSQLEntityManager()
        private readonly entityManager: EntityManager,
    ) {
        super()
    }

    /**
     * Processes the removeFromCart command.
     * @param command - The command carrying request + authenticated user.
     * @returns Whether a matching cart row was removed.
     */
    protected override async process(
        command: RemoveFromCartCommand,
    ): Promise<RemoveFromCartResponseData> {
        const {
            request,
            user,
        } = command.params

        // reject unauthenticated callers — cart rows are scoped per-user
        if (!user) {
            throw new UserNotFoundException({
            })
        }

        const {
            courseId,
        } = request

        // delete the single (user, course) row if present; filter by the relation
        // objects (resolved to the FK columns user_id / course_id) so exactly one
        // cart entry is targeted
        const result = await this.entityManager.delete(
            CartItemEntity,
            {
                user: {
                    id: user.id,
                },
                course: {
                    id: courseId,
                },
            },
        )

        // `affected` is the number of rows deleted (0 or 1 here) — coerce to a boolean
        // outcome; 0 means the course was never in the cart (still a success, idempotent)
        const removed = (result.affected ?? 0) > 0

        return {
            removed,
        }
    }
}
