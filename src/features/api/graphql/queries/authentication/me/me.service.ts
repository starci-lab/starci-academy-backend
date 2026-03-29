import {
    Injectable,
} from "@nestjs/common"
import {
    UserEntity,
} from "@modules/databases"
import type {
    MeExecuteParams,
} from "./types"

/**
 * Returns the authenticated user attached by {@link KeycloakAuthGraphqlGuard}.
 */
@Injectable()
export class MeService {
    /**
     * Entry: returns the user from the request context.
     *
     * @param param - Loaded {@link UserEntity} (possibly just created when auto-provision is on).
     * @returns Same user wrapped for the standard GraphQL response shape.
     */
    async execute({
        user,
    }: MeExecuteParams): Promise<UserEntity> {
        return user
    }
}
