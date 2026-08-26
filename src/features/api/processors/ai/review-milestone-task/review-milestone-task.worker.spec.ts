import type {
    Job
} from "bullmq"
import {
    ReviewMilestoneTaskWorker
} from "./review-milestone-task.worker"
import {
    StepNotFoundException
} from "@modules/platform/exceptions/errors/job/not-found"
const bull = (): Job<string> => ({
    id: "b1", data: "x", queueName: "review"
} as unknown as Job<string>)
describe("ReviewMilestoneTaskWorker",
    () => { it("executes mapped review steps and completes",
        async () => { const job = {
            id: "j1", currentStep: 0, maxSteps: 1
        }; const step = {
            process: jest.fn().mockImplementation(async (c: { job: { currentStep: number } }) => { c.job.currentStep = 1 })
        }; const actions = {
            getJob: jest.fn().mockResolvedValue(job), processingJob: jest.fn(), completeJob: jest.fn()
        }; const worker = new ReviewMilestoneTaskWorker(actions as never,
{
    parse: jest.fn().mockReturnValue({
    })
} as never,
{
    getStepMap: jest.fn().mockReturnValue(new Map([[0,
        step]]))
} as never,
{
    log: jest.fn()
} as never,
{
    now: jest.fn().mockReturnValue({
        diff: jest.fn()
    }), from: jest.fn()
} as never); await expect(worker.process(bull())).resolves.toBeUndefined(); expect(actions.completeJob).toHaveBeenCalled() }); it("rejects an unmapped step",
        async () => { const actions = {
            getJob: jest.fn().mockResolvedValue({
                id: "j1", currentStep: 0, maxSteps: 1
            }), processingJob: jest.fn(), completeJob: jest.fn()
        }; const worker = new ReviewMilestoneTaskWorker(actions as never,
{
    parse: jest.fn().mockReturnValue({
    })
} as never,
{
    getStepMap: jest.fn().mockReturnValue(new Map())
} as never,
{
    log: jest.fn()
} as never,
{
    now: jest.fn().mockReturnValue({
        diff: jest.fn()
    }), from: jest.fn()
} as never); await expect(worker.process(bull())).rejects.toThrow(StepNotFoundException) })
    it("rethrows malformed queue data without completing the job",
        async () => {
            const actions = {
                getJob: jest.fn().mockResolvedValue({
                    id: "j1", currentStep: 0, maxSteps: 1,
                }),
                processingJob: jest.fn(),
                completeJob: jest.fn(),
            }
            const worker = new ReviewMilestoneTaskWorker(actions as never,
{
    parse: jest.fn().mockImplementation(() => {
        throw new Error("invalid review payload")
    }),
} as never,
{
    getStepMap: jest.fn().mockReturnValue(new Map()),
} as never,
{
    log: jest.fn(),
} as never,
{
    now: jest.fn().mockReturnValue({
        diff: jest.fn(),
    }),
    from: jest.fn(),
} as never)

            await expect(worker.process(bull())).rejects.toThrow("invalid review payload")
            expect(actions.completeJob).not.toHaveBeenCalled()
        }) })
