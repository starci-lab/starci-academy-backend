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
    JobModule,
} from "@modules/bussiness/jobs"
import {
    EnrollFindExistingStepService,
} from "./enroll-find-existing-step.service"
import {
    EnrollCreateRelationStepService,
} from "./execute-step.service"

/**
 * Module for enrolling a user in a course.
 */
@Module({
    imports: [
        JobModule.register({
            isGlobal: true,
        }),
    ],
    providers: [
        EnrollWorker,
        EnrollFindExistingStepService,
        EnrollCreateRelationStepService,
    ],
})
export class EnrollModule extends ConfigurableModuleClass {
}