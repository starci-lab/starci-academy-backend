import {
    getMetadataArgsStorage,
} from "typeorm"
import {
    AiExecutionEntity,
} from "./ai-execution.entity"
import {
    AiRuntimeControlEntity,
} from "./ai-runtime-control.entity"
import {
    AiRuntimeIncarnationEntity,
} from "./ai-runtime-incarnation.entity"

describe("AI execution foundation entity defaults",
    () => {
        it.each([
            [AiExecutionEntity,
                "createdAt"],
            [AiExecutionEntity,
                "updatedAt"],
            [AiRuntimeControlEntity,
                "createdAt"],
            [AiRuntimeControlEntity,
                "updatedAt"],
            [AiRuntimeIncarnationEntity,
                "createdAt"],
        ])("uses the database clock for %p.%s",
            (target, propertyName) => {
                const column = getMetadataArgsStorage().columns.find((candidate) => candidate.target === target
                    && candidate.propertyName === propertyName)

                expect(column).toBeDefined()
                expect(column?.options.default).toEqual(expect.any(Function))
                const defaultValue = column?.options.default as () => string
                expect(defaultValue()).toBe("clock_timestamp()")
            })
    })
