import {
    ValidationPipe,
} from "@nestjs/common"
import type {
    ArgumentMetadata,
} from "@nestjs/common"
import {
    ConceptRequest,
    ConceptsRequest,
} from "./request"

describe("Concept request validation",
    () => {
        const metadata = (metatype: ArgumentMetadata["metatype"]): ArgumentMetadata => ({
            type: "body",
            metatype,
        })

        it("preserves whitelisted detail and list fields under the production pipe",
            async () => {
                const pipe = new ValidationPipe({
                    transform: true,
                    whitelist: true,
                })
                await expect(pipe.transform({
                    displayId: "cqrs-read-models",
                    ignored: "drop-me",
                },
                metadata(ConceptRequest))).resolves.toEqual(expect.objectContaining({
                    displayId: "cqrs-read-models",
                }))
                await expect(pipe.transform({
                    category: "backend",
                    difficulty: "foundation",
                    ignored: "drop-me",
                },
                metadata(ConceptsRequest))).resolves.toEqual({
                    category: "backend",
                    difficulty: "foundation",
                })
            })

        it("rejects an empty or malformed route identity before TypeORM",
            async () => {
                const pipe = new ValidationPipe({
                    transform: true,
                    whitelist: true,
                })
                await expect(pipe.transform({
                    displayId: "",
                },
                metadata(ConceptRequest))).rejects.toBeDefined()
                await expect(pipe.transform({
                    displayId: "../first",
                },
                metadata(ConceptRequest))).rejects.toBeDefined()
            })
    })
