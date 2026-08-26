jest.mock("@nestjs/swagger",
    () => ({
        DocumentBuilder: jest.fn().mockImplementation(() => ({
            setTitle: jest.fn().mockReturnThis(), setDescription: jest.fn().mockReturnThis(), setVersion: jest.fn().mockReturnThis(), addBearerAuth: jest.fn().mockReturnThis(), addApiKey: jest.fn().mockReturnThis(), build: jest.fn().mockReturnValue({
            })
        })), SwaggerModule: {
            createDocument: jest.fn().mockReturnValue({
                openapi: true
            }), setup: jest.fn()
        }
    }))
jest.mock("@scalar/nestjs-api-reference",
    () => ({
        apiReference: jest.fn().mockReturnValue("scalar-handler")
    }))
import {
    setupSwagger
} from "./setup-swagger"

describe("setupSwagger",
    () => {
        it("configures versioning, swagger, and scalar routes",
            () => {
                const app = {
                    enableVersioning: jest.fn(), setGlobalPrefix: jest.fn(), use: jest.fn()
                }
                setupSwagger({
                    app: app as never, title: "Title", description: "Desc", version: "1", basePath: "api", enableAuthentication: true, authenticationName: "auth", useScalarDocs: true, swaggerEndpoint: "docs", scalarDocsEndpoint: "scalar"
                } as never)
                expect(app.enableVersioning).toHaveBeenCalled()
                expect(app.setGlobalPrefix).toHaveBeenCalledWith("api")
                expect(app.use).toHaveBeenCalledWith("scalar",
                    "scalar-handler")
            })
        it("can disable versioning and docs",
            () => {
                const app = {
                    enableVersioning: jest.fn(), setGlobalPrefix: jest.fn(), use: jest.fn()
                }
                setupSwagger({
                    app: app as never, title: "Title", description: "Desc", version: "1", basePath: "api", enableVersioning: false, useScalarDocs: false, swaggerEndpoint: ""
                } as never)
                expect(app.enableVersioning).not.toHaveBeenCalled()
                expect(app.use).not.toHaveBeenCalled()
            })
    })
