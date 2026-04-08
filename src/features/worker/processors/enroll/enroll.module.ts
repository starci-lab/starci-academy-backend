import {
    Module 
} from "@nestjs/common"
import {
    EnrollWorker 
} from "./enroll.worker"
import {
    ConfigurableModuleClass 
} from "./enroll.module-definition"
import {
    StepMappingService 
} from "./step-mapping.service"
import {
    EnrollStepService 
} from "./steps"
import {
    EnrollRequeueService,
} from "./requeue.service"
/**
 * Module for enrolling a user in a course.
 */
@Module({
    providers: [
        EnrollWorker,
        StepMappingService,
        EnrollStepService,
        EnrollRequeueService,
    ],
})
export class EnrollModule extends ConfigurableModuleClass {
}