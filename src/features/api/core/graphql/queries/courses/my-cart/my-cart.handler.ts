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
    IQueryHandler,
    QueryHandler,
} from "@nestjs/cqrs"
import type {
    EntityManager,
} from "typeorm"
import {
    MyCartQuery,
} from "./my-cart.query"

/**
 * Handler for the myCart query.
 *
 * Loads every cart row owned by the caller with its course relation (plus the
 * course sub-relations the client needs to render a card and price preview:
 * `metadata`, `pricingPhases`, `translations`, `valuePropositions`), ordered
 * oldest-first. Returns an empty array when the cart is empty.
 */
@QueryHandler(MyCartQuery)
@Injectable()
export class MyCartHandler
    extends ICQRSHandler<MyCartQuery, Array<CartItemEntity>>
    implements IQueryHandler<MyCartQuery, Array<CartItemEntity>> {
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
     * Processes the myCart query.
     * @param query - The query carrying the authenticated user.
     * @returns The user's cart rows with course relations loaded, oldest first.
     */
    protected override async process(
        query: MyCartQuery,
    ): Promise<Array<CartItemEntity>> {
        const {
            user,
        } = query.params

        // reject unauthenticated callers — a cart only exists per-user
        if (!user) {
            throw new UserNotFoundException({
            })
        }

        // load all rows for this user, eager-loading the course and the sub-relations
        // the FE needs to render each cart card + run a price preview (metadata =
        // current phase, pricingPhases = tiered prices, translations = localized title)
        return this.entityManager.find(
            CartItemEntity,
            {
                where: {
                    user: {
                        id: user.id,
                    },
                },
                relations: {
                    course: {
                        metadata: true,
                        pricingPhases: true,
                        translations: true,
                        valuePropositions: true,
                    },
                },
                order: {
                    createdAt: "ASC",
                },
            },
        )
    }
}
