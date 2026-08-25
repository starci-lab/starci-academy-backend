import {
    StreamAsyncIteratorService 
} from "./stream-async-iterator.service"

type Handlers = { data?: (value: string) => void; error?: (error: Error) => Promise<void>; close?: () => Promise<void> }
describe("StreamAsyncIteratorService",
    () => {
        const connection = () => { const handlers: Handlers = {
        }; return {
            handlers, onData: jest.fn((cb: (v: string) => void) => { handlers.data = cb }), onError: jest.fn((cb: (e: Error) => Promise<void>) => { handlers.error = cb }), onClose: jest.fn((cb: () => Promise<void>) => { handlers.close = cb }), onOpen: jest.fn(), close: jest.fn() 
        } }
        it("yields data and closes the underlying connection",
            async () => {
                const c = connection(); const iterable = await new StreamAsyncIteratorService().createStream({
                    connection: c as never 
                }); const iterator = iterable[Symbol.asyncIterator](); const pending = iterator.next(); c.handlers.data?.("chunk"); await expect(pending).resolves.toEqual({
                    value: "chunk", done: false 
                }); const closing = iterator.next(); await c.handlers.close?.(); await expect(closing).rejects.toThrow(); expect(c.close).toHaveBeenCalled()
            })
        it("propagates errors and abort signals",
            async () => {
                const c = connection(); const controller = new AbortController(); const iterable = await new StreamAsyncIteratorService().createStream({
                    connection: c as never, signal: controller.signal 
                }); const iterator = iterable[Symbol.asyncIterator](); const pending = iterator.next(); controller.abort(); await expect(pending).rejects.toThrow(); expect(c.close).toHaveBeenCalled()
            })
    })
