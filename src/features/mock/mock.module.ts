import {
    Module,
} from "@nestjs/common"
import {
    ServerStateMockModule,
} from "./4-server-state-with-tanstack-query/server-state.module"
import {
    FormMasteryMockModule,
} from "./5-form-mastery-rhf-zod/form-mastery.module"
import {
    RealtimeMockModule,
} from "./8-websocket-realtime-communication/realtime.module"
import {
    FileUploadMockModule,
} from "./11-file-upload-and-storage/file-upload.module"
import {
    ResponsiveMockModule,
} from "./14-responsive-and-adaptive-rendering/responsive.module"

@Module({
    imports: [ServerStateMockModule,
        FormMasteryMockModule,
        RealtimeMockModule,
        FileUploadMockModule,
        ResponsiveMockModule],
})
/**
 * Feature module for the standalone mock-sandbox service.
 *
 * Pure in-memory -- no database, cache, or external dependencies. It aggregates
 * the per-module mock bundles (HTTP controllers + the single realtime Socket.IO
 * gateway); each leaf imports `StoreModule`/`FileStoreModule` transitively and
 * applies `MockDelayInterceptor` per-controller (binary upload endpoints opt
 * out so transfer progress stays smooth).
 */
export class MockModule {}
