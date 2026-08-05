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
    ClearCartCommand,
} from "./clear-cart.command"
import type {
    ClearCartResponseData,
} from "./graphql-types"

@CommandHandler(ClearCartCommand)
@Injectable()
/**
 * Handler for the clearCart mutation.
 *
 * Deletes every cart row owned by the caller and reports the count removed;
 * clearing an already-empty cart is not an error (reports `removedCount: 0`).
 */
export class ClearCartHandler
    extends ICQRSHandler<ClearCartCommand, ClearCartResponseData>
    implements ICommandHandler<ClearCartCommand, ClearCartResponseData> {
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
     * Processes the clearCart command.
     * @param command - The command carrying the authenticated user.
     * @returns Number of cart rows removed.
     */
    protected override async process(
        command: ClearCartCommand,
    ): Promise<ClearCartResponseData> {
        const {
            user,
        } = command.params

        // reject unauthenticated callers -- a cart only exists in the context of a user
        if (!user) {
            throw new UserNotFoundException({
            })
        }

        // wipe every (user, *) row via the user relation (resolved to the user_id FK)
        const result = await this.entityManager.delete(
            CartItemEntity,
            {
                user: {
                    id: user.id,
                },
            },
        )

        // `affected` is the number of rows deleted -- default to 0 when the driver
        // reports null (empty cart), so the count is always a concrete number
        const removedCount = result.affected ?? 0

        return {
            removedCount,
        }
    }
}
