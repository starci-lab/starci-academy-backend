jest.mock("execa",
    () => ({
        execaCommand: jest.fn(),
    }))

import {
    StepMappingService,
} from "./step-mapping.service"
import {
    ProcessVideoEncodeStepService,
} from "./steps/process-video-encode-step.service"
import {
    ProcessVideoFinalizeStepService,
} from "./steps/process-video-finalize-step.service"
import {
    ProcessVideoInitStepService,
} from "./steps/process-video-init-step.service"
import {
    ProcessVideoPackageStepService,
} from "./steps/process-video-package-step.service"
import {
    ProcessVideoUploadStepService,
} from "./steps/process-video-upload-step.service"

describe("StepMappingService",
    () => {
        it("maps every persisted video step index to its matching service",
            () => {
                const init = {
                    stepIndex: 0 
                } as ProcessVideoInitStepService
                const encode = {
                    stepIndex: 1 
                } as ProcessVideoEncodeStepService
                const pack = {
                    stepIndex: 2 
                } as ProcessVideoPackageStepService
                const upload = {
                    stepIndex: 3 
                } as ProcessVideoUploadStepService
                const finalize = {
                    stepIndex: 4 
                } as ProcessVideoFinalizeStepService

                const map = new StepMappingService(init,
                    encode,
                    pack,
                    upload,
                    finalize)

                expect([...map.getStepMap().entries()]).toEqual([
                    [0,
                        init],
                    [1,
                        encode],
                    [2,
                        pack],
                    [3,
                        upload],
                    [4,
                        finalize],
                ])
            })

        it("keeps duplicate indices deterministic for malformed dependency wiring",
            () => {
                const first = {
                    stepIndex: 2 
                } as ProcessVideoInitStepService
                const second = {
                    stepIndex: 2 
                } as ProcessVideoEncodeStepService
                const empty = {
                    stepIndex: 4 
                } as ProcessVideoPackageStepService
                const upload = {
                    stepIndex: 5 
                } as ProcessVideoUploadStepService
                const finalize = {
                    stepIndex: 6 
                } as ProcessVideoFinalizeStepService

                expect(new StepMappingService(first,
                    second,
                    empty,
                    upload,
                    finalize)
                    .getStepMap().get(2)).toBe(second)
            })
    })
