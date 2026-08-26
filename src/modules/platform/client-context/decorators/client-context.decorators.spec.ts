jest.mock("@nestjs/common",
    () => ({
        ...jest.requireActual("@nestjs/common"),
        createParamDecorator: (factory: unknown) => factory,
    }))

import {
    ClientContextParam,
} from "./client-context.decorators"
import {
    DEVICE_FINGERPRINT_HEADER,
} from "../constants"

jest.mock("@nestjs/graphql",
    () => ({
        GqlExecutionContext: {
            create: jest.fn()
        },
    }))

describe("ClientContextParam",
    () => {
        it("normalizes forwarded REST headers and takes the first proxy hop",
            () => {
                const request = {
                    ip: "10.0.0.9",
                    headers: {
                        "x-forwarded-for": "203.0.113.4, 10.0.0.1",
                        "user-agent": ["browser",
                            "proxy"],
                        [DEVICE_FINGERPRINT_HEADER]: ["device-1"],
                    },
                }
                const context = {
                    getType: () => "http",
                    switchToHttp: () => ({
                        getRequest: () => request
                    }),
                }

                expect((ClientContextParam as unknown as (data: unknown, ctx: unknown) => unknown)(undefined,
                    context)).toEqual({
                    ipAddress: "203.0.113.4",
                    userAgent: "browser",
                    fingerprint: "device-1",
                })
            })

        it("resolves a GraphQL request and preserves nulls for missing headers",
            () => {
                const { GqlExecutionContext } = jest.requireMock("@nestjs/graphql") as {
            GqlExecutionContext: { create: jest.Mock }
        }
                GqlExecutionContext.create.mockReturnValue({
                    getContext: () => ({
                        req: {
                            headers: {
                            }, ip: "192.0.2.1"
                        }
                    }),
                })
                const context = {
                    getType: () => "graphql"
                }

                expect((ClientContextParam as unknown as (data: unknown, ctx: unknown) => unknown)(undefined,
                    context)).toEqual({
                    ipAddress: "192.0.2.1",
                    userAgent: null,
                    fingerprint: null,
                })
            })
    })
