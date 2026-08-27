import {
    Module
} from "@nestjs/common"
import {
    GradeMockInterviewSessionWorker
} from "./grade-mock-interview-session.worker"
import {
    MockInterviewGradingJobDispatcherService
} from "./mock-interview-grading-job-dispatcher.service"

@Module({
    providers: [GradeMockInterviewSessionWorker,
        MockInterviewGradingJobDispatcherService]
})
/** Wires durable grading dispatch and worker execution into the API processor host. */
export class GradeMockInterviewSessionProcessorModule {}
