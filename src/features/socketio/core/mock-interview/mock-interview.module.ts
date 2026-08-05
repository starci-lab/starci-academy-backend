import {
    Module,
} from "@nestjs/common"
import {
    ConfigurableModuleClass,
} from "./mock-interview.module-definition"
import {
    MockInterviewGateway,
} from "./mock-interview.gateway"
import {
    MockInterviewTurnService,
} from "./mock-interview-turn.service"

@Module({
    providers: [
        MockInterviewGateway,
        MockInterviewTurnService,
    ],
    exports: [
        MockInterviewGateway,
    ],
})
/**
 * Module providing the Socket.IO mock-interview gateway (on-rails,
 * RAG-grounded interviewer turn token streaming in the `/mock_interview`
 * namespace).
 *
 * `UserService` comes from the globally-registered bussiness `UserModule`,
 * `CourseRagRetrievalService` from the global `RagModule`, and
 * `AiInvokeService` / `AiEntitlementService` from the global `AiModule` -- none
 * of those are imported here. `MockInterviewTurnService` is scoped locally to
 * this module since it is only ever consumed by `MockInterviewGateway`.
 */
export class MockInterviewModule extends ConfigurableModuleClass {}
