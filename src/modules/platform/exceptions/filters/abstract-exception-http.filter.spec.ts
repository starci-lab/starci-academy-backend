import {
    ArgumentsHost,
    HttpStatus,
} from "@nestjs/common"
import {
    AbstractException,
} from "../errors/abstract"
import {
    AbstractExceptionHttpFilter,
} from "./abstract-exception-http.filter"

describe("AbstractExceptionHttpFilter",
    () => {
        const exception = new AbstractException(
            "bad request",
            "BAD_REQUEST",
        )

        it("maps an HTTP exception to its explicit status and JSON payload",
            () => {
                const status = jest.fn().mockReturnThis()
                const json = jest.fn()
                const host = {
                    getType: jest.fn().mockReturnValue("http"),
                    switchToHttp: jest.fn().mockReturnValue({
                        getResponse: jest.fn().mockReturnValue({
                            status,
                            json,
                        }),
                    }),
                } as unknown as ArgumentsHost
                const logger = {
                    log: jest.fn(),
                }
                const filter = new AbstractExceptionHttpFilter(logger as never)

                filter.catch(exception,
                    host)

                expect(status).toHaveBeenCalledWith(HttpStatus.INTERNAL_SERVER_ERROR)
                expect(json).toHaveBeenCalledWith({
                    statusCode: HttpStatus.INTERNAL_SERVER_ERROR,
                    code: "BAD_REQUEST",
                    message: "bad request",
                })
                expect(logger.log).toHaveBeenCalled()
            })

        it("preserves a custom HTTP status",
            () => {
                const status = jest.fn().mockReturnThis()
                const json = jest.fn()
                const host = {
                    getType: jest.fn().mockReturnValue("http"),
                    switchToHttp: jest.fn().mockReturnValue({
                        getResponse: jest.fn().mockReturnValue({
                            status,
                            json,
                        }),
                    }),
                } as unknown as ArgumentsHost
                const filter = new AbstractExceptionHttpFilter({
                    log: jest.fn(),
                } as never)
                const forbidden = new AbstractException(
                    "forbidden",
                    "FORBIDDEN",
                    undefined,
                    HttpStatus.FORBIDDEN,
                )

                filter.catch(forbidden,
                    host)

                expect(status).toHaveBeenCalledWith(HttpStatus.FORBIDDEN)
                expect(json).toHaveBeenCalledWith(expect.objectContaining({
                    statusCode: HttpStatus.FORBIDDEN,
                }))
            })

        it("rethrows GraphQL exceptions for Apollo formatting",
            () => {
                const host = {
                    getType: jest.fn().mockReturnValue("graphql"),
                } as unknown as ArgumentsHost
                const filter = new AbstractExceptionHttpFilter({
                    log: jest.fn(),
                } as never)

                expect(() => filter.catch(exception,
                    host)).toThrow(exception)
            })
    })
