import {
    RagPlaygroundGateway 
} from "./rag-playground.gateway"

describe("RagPlaygroundGateway",
    () => {
        it("joins and emits terminal expiry for a consumed run that is missing",
            async () => {
                const response = {
                    successToRoom: jest.fn() 
                }
                const gateway = new RagPlaygroundGateway({
                    consume: jest.fn().mockReturnValue(undefined) 
                } as never,
{
    stream: jest.fn() 
} as never,
response as never,
{
    log: jest.fn() 
} as never)
                await gateway.handleSubscribeRagPlaygroundRun({
                    join: jest.fn() 
                } as never,
{
    data: {
        runId: "r1" 
    } 
} as never)
                expect(response.successToRoom).toHaveBeenCalledWith(expect.objectContaining({
                    data: expect.objectContaining({
                        runId: "r1", done: true, error: expect.any(String) 
                    }) 
                }))
            })
    })
