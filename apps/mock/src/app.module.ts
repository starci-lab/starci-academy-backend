import {
    Module
} from "@nestjs/common"
import {
    EnvModule
} from "@modules/env"
import {
    MockModule
} from "@features/mock"

@Module({
    imports: [
        EnvModule.forRoot(),
        MockModule,
    ],
})
/**
 * Root module for the standalone mock-sandbox service.
 *
 * Deliberately minimal: only env loading + the in-memory {@link MockModule}.
 * No database, Redis, Keycloak, or other core infrastructure -- this app exists
 * solely to serve public dummy data to lesson Sandpack iframes with relaxed
 * CORS, kept isolated from the main core app.
 */
export class AppModule {}
