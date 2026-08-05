import {
    ICQRSHandler,
} from "@modules/platform/cqrs/icqrs-handler"
import {
    CartItemEntity,
} from "@modules/databases/postgresql/primary/entities/cart-item.entity"
import {
    CourseEntity,
} from "@modules/databases/postgresql/primary/entities/course.entity"
import {
    EnrollmentEntity,
} from "@modules/databases/postgresql/primary/entities/enrollment.entity"
import {
    InjectPrimaryPostgreSQLEntityManager,
} from "@modules/databases/postgresql/primary/primary.decorators"
import {
    CourseAlreadyEnrolledError,
} from "@modules/platform/exceptions/errors/courses/course-already-enrolled"
import {
    CourseNotFoundException,
} from "@modules/platform/exceptions/errors/courses/course-not-found"
import {
    UserNotFoundException,
} from "@modules/platform/exceptions/errors/users/user"
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
    AddToCartCommand,
} from "./add-to-cart.command"

@CommandHandler(AddToCartCommand)
@Injectable()
/**
 * Handler for the addToCart mutation.
 *
 * Idempotently places a `(user, course)` row into the cart: verifies the course
 * exists and is not already enrolled, then returns the existing cart row when one
 * is already present (so the unique constraint is never tripped), otherwise
 * creates and returns a fresh one.
 */
export class AddToCartHandler
    extends ICQRSHandler<AddToCartCommand, CartItemEntity>
    implements ICommandHandler<AddToCartCommand, CartItemEntity> {
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
     * Processes the addToCart command.
     * @param command - The command carrying request + authenticated user.
     * @returns The cart row holding the course (created or already present).
     */
    protected override async process(
        command: AddToCartCommand,
    ): Promise<CartItemEntity> {
        const {
            request,
            user,
        } = command.params

        // reject unauthenticated callers up front -- cart rows are per-user
        if (!user) {
            throw new UserNotFoundException({
            })
        }

        const {
            courseId,
        } = request

        // the course must exist before it can be carted -- guards against stale/forged ids
        const courseExists = await this.entityManager.exists(
            CourseEntity,
            {
                where: {
                    id: courseId,
                },
            },
        )
        if (!courseExists) {
            throw new CourseNotFoundException({
                id: courseId,
            })
        }

        // a course the user already OWNS must not be carted -- real enrollment (paid)
        // only, so a trial/preview row (is_enrolled = false) still allows adding to cart
        const alreadyEnrolled = await this.entityManager.exists(
            EnrollmentEntity,
            {
                where: {
                    course: {
                        id: courseId,
                    },
                    user: {
                        id: user.id,
                    },
                    isEnrolled: true,
                },
            },
        )
        if (alreadyEnrolled) {
            throw new CourseAlreadyEnrolledError({
                courseId,
                userId: user.id,
            })
        }

        // idempotent add: if the (user, course) row already exists, return it as-is --
        // creating a second one would violate UQ_cart_items_user_course
        const existing = await this.entityManager.findOne(
            CartItemEntity,
            {
                where: {
                    course: {
                        id: courseId,
                    },
                    user: {
                        id: user.id,
                    },
                },
            },
        )
        if (existing) {
            return existing
        }

        // no row yet -> build a fresh cart entry linked to the user and course by relation
        const cartItem = this.entityManager.create(
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

        // persist and return the saved row (now carrying its generated id/timestamps)
        return this.entityManager.save(cartItem)
    }
}
