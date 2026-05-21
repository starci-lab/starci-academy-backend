/**
 * Module gốc — đăng ký ConfigModule toàn cục, Keycloak guard stack, và controllers.
 * (EN: Root module — registers global ConfigModule, Keycloak guard stack, and controllers.)
 *
 * Keycloak sử dụng **public client** (`nestjs-app`) cho token validation.
 * API riêng demo cả **public** lẫn **confidential** (private) client qua KeycloakService.
 * (EN: Keycloak uses **public client** (`nestjs-app`) for token validation.
 * API also demos both **public** and **confidential** (private) client via KeycloakService.)
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
         * Biến môi trường toàn cục (`.env` / Docker `environment:`).
         * (EN: Global env binding (`.env` or Docker `environment:`).)
         */
    ConfigModule.forRoot({
            isGlobal: true,
        }),

        /**
         * Kết nối Keycloak — dùng **public client** để validate token (offline JWT).
         * (EN: Keycloak connection — uses **public client** for token validation (offline JWT).)
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
         * Guard stack Keycloak — AuthGuard → ResourceGuard → RoleGuard (đăng ký toàn cục).
         * (EN: Keycloak guard stack — AuthGuard → ResourceGuard → RoleGuard (registered globally).)
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
 * Class `AppModule` — thành phần lab (controller/service/module).
 * (EN: Class `AppModule` — lesson lab component.)
 */
export class AppModule {}
