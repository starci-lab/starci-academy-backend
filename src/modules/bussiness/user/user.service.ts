import {
    Injectable 
} from "@nestjs/common"
import {
    EntityManager 
} from "typeorm"
import {
    InjectPrimaryPostgreSQLEntityManager, 
    UserEntity
} from "@modules/databases"
import {
    CacheKey,
    CacheService 
} from "@modules/cache"
import {
    UserNotFoundException 
} from "@modules/exceptions"

/**
 * Service for managing users.
 */
@Injectable()
export class UserService {
    constructor(
        private readonly cacheService: CacheService,
        @InjectPrimaryPostgreSQLEntityManager()
        private readonly entityManager: EntityManager,
    ) {}

    /**
     * Get user by user ID from Keycloak
     */
    async getUserByKeycloakId(
        keycloakId: string
    ): Promise<UserEntity> {
        /**
         * Get user from cache
         */
        let user = await this.cacheService.get(
            {
                key: CacheKey.KeycloakUser,
                args: [keycloakId],
            }
        )
        if (!user) {
            /**
             * Get user from database
             */
            user = await this.entityManager.findOne(
                UserEntity,
                {
                    select: {
                        id: true,
                    },
                    where: {
                        keycloakId 
                    },
                }
            ) ?? undefined
            if (!user) {
                throw new UserNotFoundException({
                    keycloakId 
                })
            }
            /**
             * Set user in cache
             */
            await this.cacheService.set(
                {
                    key: CacheKey.KeycloakUser,
                    args: [keycloakId],
                    cacheResult: user,
                }
            )
        }
        /**
         * Return user
         */
        return user as UserEntity
    }
}