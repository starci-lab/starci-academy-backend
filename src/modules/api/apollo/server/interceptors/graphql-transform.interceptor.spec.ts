import {
    GraphQLTransformInterceptor
} from "./graphql-transform.interceptor"
import {
    Locale
} from "@modules/databases/postgresql/primary/enums/locale"
import {
    of, throwError, firstValueFrom
} from "rxjs"
describe("GraphQLTransformInterceptor",
    () => {
        const context = {
            getHandler: () => "handler", getClass: () => "class", getType: () => "graphql", getArgs: () => []
        } as never
        it("wraps successful results with the localized message",
            async () => {
                const reflector = {
                    get: jest.fn().mockReturnValue({
                        [Locale.En]: "Done"
                    })
                }
                const interceptor = new GraphQLTransformInterceptor(reflector as never)
                await expect(firstValueFrom(interceptor.intercept(context,
{
    handle: () => of({
        id: 1
    })
} as never))).resolves.toEqual({
                    data: {
                        id: 1
                    }, message: "Done", success: true
                })
            })
        it("maps errors into an unsuccessful response",
            async () => {
                const interceptor = new GraphQLTransformInterceptor({
                    get: jest.fn()
                } as never)
                await expect(firstValueFrom(interceptor.intercept(context,
{
    handle: () => throwError(() => new Error("bad"))
} as never))).resolves.toEqual({
                    success: false, message: "bad", error: "Error"
                })
            })
    })
