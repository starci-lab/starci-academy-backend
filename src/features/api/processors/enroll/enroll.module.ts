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
    EnrollStepService,
} from "./steps/enroll-step.service"
@Module({
    providers: [
        EnrollWorker,
        StepMappingService,
        EnrollStepService,
    ],
})
/**
 * Module for enrolling a user in a course.
 */
export class EnrollModule extends ConfigurableModuleClass {
}