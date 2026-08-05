import {
    ICQRSHandler,
} from "@modules/cqrs"
import {
    InjectPrimaryPostgreSQLEntityManager,
    CartItemEntity,
    EnrollmentEntity,
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
    In,
    type EntityManager,
} from "typeorm"
import {
    MyCartQuery,
} from "./my-cart.query"

@QueryHandler(MyCartQuery)
@Injectable()
/**
 * Handler for the myCart query.
 *
 * Loads every cart row owned by the caller with its course relation (plus the
 * course sub-relations the client needs to render a card and price preview:
 * `metadata`, `pricingPhases`, `translations`, `valuePropositions`), ordered
 * oldest-first. Returns an empty array when the cart is empty.
 *
 * A row can go stale (course now `isEnrolled: true`) via a path that skips the
 * normal checkout cart-delete step — e.g. an installment plan re-unlocking a
 * previously-locked enrollment. Rather than trust every future enroll-writer to
 * remember cart cleanup, this handler self-heals: any stale row found is deleted
 * here and excluded from the response, so an enrolled course never shows in the
 * cart regardless of which path caused the staleness.
 */
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
     * @returns The user's cart rows with course relations loaded, oldest first,
     * excluding any row whose course the user is already enrolled in.
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
        const items = await this.entityManager.find(
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
        if (items.length === 0) {
            return items
        }

        // batch-check enrollment across every course in the cart in ONE query
        // (never N+1 per row)
        const enrollments = await this.entityManager.find(
            EnrollmentEntity,
            {
                where: {
                    user: {
                        id: user.id,
                    },
                    course: {
                        id: In(items.map((item) => item.courseId)),
                    },
                    isEnrolled: true,
                },
            },
        )
        if (enrollments.length === 0) {
            return items
        }
        const enrolledCourseIds = new Set(enrollments.map((enrollment) => enrollment.courseId))
        const staleItemIds = items
            .filter((item) => enrolledCourseIds.has(item.courseId))
            .map((item) => item.id)
        if (staleItemIds.length > 0) {
            // self-heal: delete the stale row(s) now, don't wait for whichever
            // enroll-writer should have cleaned them up
            await this.entityManager.delete(CartItemEntity,
                staleItemIds)
        }
        return items.filter((item) => !enrolledCourseIds.has(item.courseId))
    }
}
