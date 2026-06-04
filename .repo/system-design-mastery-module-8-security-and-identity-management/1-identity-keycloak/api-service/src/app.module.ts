/**
 * Root module — registers global ConfigModule, Keycloak guard stack, and controllers.
 *
 * Keycloak uses **public client** (`nestjs-app`) for token validation.
 * API also demos both **public** and **confidential** (private) client via KeycloakService.
 */
import {
    Module,
} from "@nestjs/common"
import {
    APP_GUARD,
} from "@nestjs/core"
import {
    ConfigModule,
    ConfigService,
} from "@nestjs/config"
import {
    AuthGuard,
    KeycloakConnectModule,
    PolicyEnforcementMode,
    ResourceGuard,
    RoleGuard,
    TokenValidation,
} from "nest-keycloak-connect"
import {
    AppController,
} from "./app.controller"
import {
    AuthController,
} from "./auth.controller"
import {
    KeycloakService,
} from "./keycloak.service"
import {
    OrdersController,
} from "./orders.controller"

@Module({
    imports: [
        /**
         * Global env binding (`.env` or Docker `environment:`).
         */
    ConfigModule.forRoot({
            isGlobal: true,
        }),

        /**
         * Keycloak connection — uses **public client** for token validation (offline JWT).
         */
    KeycloakConnectModule.registerAsync({
            inject: [ConfigService],
            useFactory: (config: ConfigService) => ({
                authServerUrl: config.get<string>("KEYCLOAK_BASE_URL", "http://keycloak:8080"),
                realm: config.get<string>("KEYCLOAK_REALM", "starci-realm"),
                clientId: config.get<string>("KEYCLOAK_PUBLIC_CLIENT_ID", "nestjs-app"),
                secret: "",
                policyEnforcement: PolicyEnforcementMode.PERMISSIVE,
                tokenValidation: TokenValidation.OFFLINE,
            }),
        }),
    ],
    controllers: [
        AppController,
        AuthController,
        OrdersController,
    ],
    providers: [
        KeycloakService,
        /**
         * Keycloak guard stack — AuthGuard → ResourceGuard → RoleGuard (registered globally).
         */
        {
            provide: APP_GUARD,
            useClass: AuthGuard,
        },
        {
            provide: APP_GUARD,
            useClass: ResourceGuard,
        },
        {
            provide: APP_GUARD,
            useClass: RoleGuard,
        },
    ],
})
/**
 * Class `AppModule` — lesson lab component.
 */
export class AppModule {}
