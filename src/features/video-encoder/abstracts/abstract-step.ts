import { JobExtendedContext } from "../types"

export abstract class AbstractStepService<T, E> {
    abstract stepIndex: number
    abstract stepName: string
    abstract process(context: JobExtendedContext<T, E>): Promise<void>
}
