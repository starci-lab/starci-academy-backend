import {
    ProcessSendMailStepService 
} from "./process-send-mail-step.service"
const context = (overrides: Record<string, unknown> = {
}) => ({
    job: {
        id: "j1", executionResults: {
        } 
    }, queueName: "mail", payload: {
        to: [{
            address: "to@example.com" 
        }], subject: "Hi", html: "body", attachments: [{
            filename: "a.txt", contentBase64: Buffer.from("x").toString("base64") 
        }] 
    }, ...overrides 
})
describe("ProcessSendMailStepService",
    () => {
        const make = (claimed = false) => { const persisted = {
            executionResults: {
            } 
        }; const entityManager = {
            transaction: jest.fn(async (callback: (manager: unknown) => Promise<unknown>) => callback({
                findOneOrFail: jest.fn().mockResolvedValue(persisted) 
            })) 
        }; const actions = {
            loadExecutionResult: jest.fn().mockResolvedValue(claimed), saveExecutionResult: jest.fn().mockResolvedValue(undefined), increaseJob: jest.fn().mockResolvedValue(undefined) 
        }; const mailer = {
            sendMail: jest.fn().mockResolvedValue(undefined) 
        }; const service = new ProcessSendMailStepService(entityManager as never,
actions as never,
{
    log: jest.fn() 
} as never,
mailer as never); return {
            service, entityManager, actions, mailer 
        } }
        it("claims, sends mapped mail, and finalizes",
            async () => { const h = make(); await h.service.process(context() as never); expect(h.mailer.sendMail).toHaveBeenCalledWith(expect.objectContaining({
                messageId: "j1", to: ["to@example.com"], attachments: [expect.objectContaining({
                    content: Buffer.from("x") 
                })] 
            })); expect(h.actions.increaseJob).toHaveBeenCalled(); expect(h.actions.saveExecutionResult).toHaveBeenCalledTimes(2) })
        it("skips SMTP and still finalizes when dispatch was already claimed",
            async () => { const h = make(true); await h.service.process(context() as never); expect(h.mailer.sendMail).not.toHaveBeenCalled(); expect(h.actions.increaseJob).toHaveBeenCalled() })
        it("releases the claim when SMTP rejects",
            async () => { const h = make(); const failure = new Error("offline"); h.mailer.sendMail.mockRejectedValue(failure); await expect(h.service.process(context() as never)).rejects.toBe(failure); expect(h.actions.saveExecutionResult).toHaveBeenCalledWith(expect.objectContaining({
                executionResult: false 
            })) })
    })
