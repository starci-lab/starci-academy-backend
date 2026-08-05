import {
    Field,
    ID,
    ObjectType,
} from "@nestjs/graphql"
import {
    Entity,
    Index,
    JoinColumn,
    ManyToOne,
    RelationId,
    Unique,
} from "typeorm"
import {
    UuidAbstractEntity,
} from "./abstract"
import {
    CourseEntity,
} from "./course.entity"
import {
    UserEntity,
} from "./user.entity"

@ObjectType({
    description: "A course a user has placed in their shopping cart.",
})
@Entity("cart_items")
@Unique(
    "UQ_cart_items_user_course",
    [
        "user",
        "course",
    ],
)
@Index(["user"])
/**
 * A single course a user has placed in their shopping cart.
 *
 * The cart is modelled as a set of `(user, course)` rows rather than a parent
 * cart aggregate: there is exactly one row per user x course (enforced by
 * {@link UQ_cart_items_user_course}), and "the user's cart" is simply every row
 * with that `user_id`. Rows are removed when the user drops the course from the
 * cart, clears the cart, or the course is enrolled (paid) -- the enroll step
 * deletes the matching row so a bought course never lingers in the cart.
 */
export class CartItemEntity extends UuidAbstractEntity {
    /**
     * Owner of this cart row.
     */
    @Field(
        () => UserEntity,
        {
            description: "Owner of this cart row.",
        },
    )
    @ManyToOne(
        () => UserEntity,
        {
            onDelete: "CASCADE",
        },
    )
    @JoinColumn({
        name: "user_id",
        foreignKeyConstraintName: "fk_user_id_cart_items_users",
    })
        user: UserEntity

    /**
     * Course sitting in the cart.
     */
    @Field(
        () => CourseEntity,
        {
            description: "Course sitting in the cart.",
        },
    )
    @ManyToOne(
        () => CourseEntity,
        {
            onDelete: "CASCADE",
        },
    )
    @JoinColumn({
        name: "course_id",
        foreignKeyConstraintName: "fk_course_id_cart_items_courses",
    })
        course: CourseEntity

    /**
     * Owner user id (denormalized via relation for cheap per-user filtering).
     */
    @Field(
        () => ID,
        {
            description: "Owner user id.",
        },
    )
    @RelationId(
        (cartItem: CartItemEntity) => cartItem.user,
    )
        userId: string

    /**
     * Id of the course sitting in the cart.
     */
    @Field(
        () => ID,
        {
            description: "Id of the course sitting in the cart.",
        },
    )
    @RelationId(
        (cartItem: CartItemEntity) => cartItem.course,
    )
        courseId: string
}
