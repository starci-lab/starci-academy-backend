import {
    Module,
} from "@nestjs/common"
import {
    CqrsModule,
} from "@nestjs/cqrs"
import {
    SyncMockInterviewSessionTurnsResolver,
} from "./sync-mock-interview-session-turns.resolver"
import {
    SyncMockInterviewSessionTurnsService,
} from "./sync-mock-interview-session-turns.service"
import {
    SyncMockInterviewSessionTurnsHandler,
} from "./sync-mock-interview-session-turns.handler"
import {
    ConfigurableModuleClass,
} from "./sync-mock-interview-session-turns.module-definition"

@Module({
    imports: [
        CqrsModule,
    ],
    providers: [
        SyncMockInterviewSessionTurnsResolver,
        SyncMockInterviewSessionTurnsService,
        SyncMockInterviewSessionTurnsHandler,
    ],
    exports: [
        SyncMockInterviewSessionTurnsService,
    ],
})
export class SyncMockInterviewSessionTurnsSingleMutationModule extends ConfigurableModuleClass {}
