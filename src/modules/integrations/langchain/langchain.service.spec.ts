import {
    LangchainService,
} from "./langchain.service"
import {
    StringOutputParser,
} from "@langchain/core/output_parsers"

describe("LangchainService",
    () => {
        it("returns the configured prompt and formats values",
            async () => {
                const service = new LangchainService({
                    defaultSystemPrompt: "You are a helpful tutor.",
                })

                expect(service.getDefaultSystemPrompt()).toBe("You are a helpful tutor.")
                await expect(service.formatPrompt({
                    template: "Hello, {name}!",
                    values: {
                        name: "Ada",
                    },
                })).resolves.toBe("Hello, Ada!")
                expect(service.getStringOutputParser()).toBeInstanceOf(StringOutputParser)
            })

        it("uses an empty default and rejects missing template variables",
            async () => {
                const service = new LangchainService()

                expect(service.getDefaultSystemPrompt()).toBe("")
                await expect(service.formatPrompt({
                    template: "Hello, {name}!",
                    values: {
                    },
                })).rejects.toThrow()
                await expect(service.createPromptTemplate("{value}").format({
                    value: "present",
                })).resolves.toBe("present")
            })
    })
