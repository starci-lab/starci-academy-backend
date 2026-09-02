import {
    GraphQLTransformInterceptor,
} from "@modules/api/apollo/server/interceptors/graphql-transform.interceptor"
import {
    EffectiveLearnerAccessService,
} from "@modules/bussiness/pro-subscription/effective-learner-access.service"
import {
    ProSubscriptionService,
} from "@modules/bussiness/pro-subscription/pro-subscription.service"
import {
    UserEntity,
} from "@modules/databases/postgresql/primary/entities/user.entity"
import {
    MountFilesystemService,
} from "@modules/filesystem/mount.service"
import {
    KeycloakGraphQLUser,
} from "@modules/integrations/keycloak/keycloak.decorators"
import {
    KeycloakAuthGraphQLGuard,
} from "@modules/integrations/keycloak/guards/keycloak-auth-graphql.guard"
import {
    ProSubscriptionNotAvailableException,
} from "@modules/platform/exceptions/errors/pro-subscription/pro-subscription-not-available"
import {
    UseGuards,
    UseInterceptors,
} from "@nestjs/common"
import {
    Args,
    Query,
    Resolver,
} from "@nestjs/graphql"
import {
    LearnerAccessResponse,
    MyProSubscriptionResponse,
    ProOfferResponse,
} from "../../shared/pro-subscription/graphql-types"

@Resolver()
/** Exposes the Pro offer, current subscription and effective learner access. */
export class ProSubscriptionQueriesResolver {
    constructor(
        private readonly mountFilesystemService: MountFilesystemService,
        private readonly proSubscriptionService: ProSubscriptionService,
        private readonly effectiveLearnerAccessService: EffectiveLearnerAccessService,
    ) {}

    @UseInterceptors(GraphQLTransformInterceptor)
    @Query(() => ProOfferResponse,
        {
            name: "proOffer",
        })
    proOffer() {
        const offer = this.mountFilesystemService.appConfig().proSubscription
        if (!offer) {
            throw new ProSubscriptionNotAvailableException({
            })
        }
        return offer
    }

    @UseGuards(KeycloakAuthGraphQLGuard)
    @UseInterceptors(GraphQLTransformInterceptor)
    @Query(() => MyProSubscriptionResponse,
        {
            name: "myProSubscription",
        })
    async myProSubscription(@KeycloakGraphQLUser() user: UserEntity) {
        const subscription = await this.proSubscriptionService.findForUser(user.id)
        return {
            subscription,
            active: await this.proSubscriptionService.isActive(user.id),
        }
    }

    @UseGuards(KeycloakAuthGraphQLGuard)
    @UseInterceptors(GraphQLTransformInterceptor)
    @Query(() => LearnerAccessResponse,
        {
            name: "myLearnerAccess",
        })
    myLearnerAccess(
        @KeycloakGraphQLUser() user: UserEntity,
        @Args("courseId",
            {
                type: () => String,
                nullable: true,
            }) courseId?: string,
    ) {
        return this.effectiveLearnerAccessService.resolve(user.id,
            courseId)
    }
}
