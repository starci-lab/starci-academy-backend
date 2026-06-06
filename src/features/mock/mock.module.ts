import {
    Module,
} from "@nestjs/common"
import {
    ServerStateMockModule,
} from "./4-server-state-with-tanstack-query"
import {
    FormMasteryMockModule,
} from "./5-form-mastery-rhf-zod"
import {
    RealtimeMockModule,
} from "./8-websocket-realtime-communication"

/**
 * Feature module for the standalone mock-sandbox service.
 *
 * Pure in-memory — no database, cache, or external dependencies. It aggregates
 * the per-module mock bundles (HTTP controllers + the single realtime Socket.IO
 * gateway); each leaf imports `StoreModule` transitively and applies
 * `MockDelayInterceptor` per-controller.
 */
@Module({
    imports: [ServerStateMockModule,
        FormMasteryMockModule,
        RealtimeMockModule],
})
export class MockModule {}
