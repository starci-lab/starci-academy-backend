import {
    Field, 
    ObjectType 
} from "@nestjs/graphql"
import {
    Column, Entity 
} from "typeorm"
import {
    UuidAbstractEntity 
} from "./abstract"

/**
 * Represents an application-level user.
 *
 * This entity stores business-related user data and acts as a bridge
 * between the application domain and the external identity provider (Keycloak).
 *
 * Notes:
 * - Authentication & credentials are managed by Keycloak.
 * - This table should only contain data required by the application domain.
 * - The `keycloakId` maps to the `sub` claim in the Keycloak JWT.
 */
@ObjectType({
    description: "Application user entity mapped from Keycloak identity."
})
@Entity("users")
export class UserEntity extends UuidAbstractEntity {

    /**
     * Username of the user.
     *
     * This is a cached snapshot from Keycloak (preferred_username),
     * used for display and querying within the application.
     */
    @Field(() => String,
        {
            description: "Username of the user."
        })
    @Column({
        name: "username",
        type: "varchar",
        length: 50
    })
        username: string
    
    /**
     * Email address of the user.
     *
     * This value is synchronized from Keycloak and should not be treated
     * as the source of truth for authentication.
     */
    @Field(() => String,
        {
            description: "Email of the user."
        })
    @Column({
        name: "email",
        type: "varchar",
        length: 255
    })
        email: string
    
    /**
     * Unique identifier of the user in Keycloak.
     *
     * Maps to the `sub` claim in the JWT token.
     * Used to associate external identity with internal user record.
     */
    @Field(() => String,
        {
            description: "Keycloak ID of the user (JWT sub)."
        })
    @Column({
        name: "keycloak_id",
        type: "varchar",
        length: 64,
        unique: true
    })
        keycloakId: string

    /**
     * Soft delete flag.
     *
     * Indicates whether the user is logically deleted in the application.
     * Does NOT affect the user in Keycloak.
     */
    @Field(() => Boolean,
        {
            description: "Indicates whether the user is soft-deleted."
        })
    @Column({
        name: "is_deleted",
        type: "boolean",
        default: false
    })
        isDeleted: boolean
}