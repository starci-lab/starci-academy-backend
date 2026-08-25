import type {
    Job
} from "bullmq"
import {
    EnrollWorker
} from "./enroll.worker"
import {
    StepNotFoundException
} from "@modules/platform/exceptions/errors/job/not-found"
const bull = (): Job<string> => ({
    id: "b1", data: "x", queueName: "enroll"
} as unknown as Job<string>)
describe("EnrollWorker",
    () => { it("runs mapped steps and completes",
        async () => { const job = {
            id: "j1", currentStep: 0, maxSteps: 1
        }; const step = {
            process: jest.fn().mockImplementation(async (c: { job: { currentStep: number } }) => { c.job.currentStep = 1 })
        }; const actions = {
            getJob: jest.fn().mockResolvedValue(job), processingJob: jest.fn(), completeJob: jest.fn()
        }; const worker = new EnrollWorker(actions as never,
{
    parse: jest.fn().mockReturnValue({
        userId: "u1"
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
} as never); await expect(worker.process(bull())).resolves.toBeUndefined(); expect(step.process).toHaveBeenCalled(); expect(actions.completeJob).toHaveBeenCalled() }); it("logs and rethrows missing step",
        async () => { const actions = {
            getJob: jest.fn().mockResolvedValue({
                id: "j1", currentStep: 0, maxSteps: 1
            }), processingJob: jest.fn(), completeJob: jest.fn()
        }; const worker = new EnrollWorker(actions as never,
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
} as never); await expect(worker.process(bull())).rejects.toThrow(StepNotFoundException) }) })
