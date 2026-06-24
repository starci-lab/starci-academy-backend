import {
    Test,
    TestingModule,
} from "@nestjs/testing"
import {
    ModelProvider,
} from "@modules/databases"
import {
    MountStorageService,
} from "@modules/filesystem"
import {
    AISecretService,
} from "./secret.service"

describe("AISecretService",
    () => {
        let module: TestingModule
        let service: AISecretService

        beforeEach(async () => {
            // mount storage exposes the per-provider secret as a getter property
            const mountStorageService = {
                openAiApiKey: "sk-openai",
                geminiApiKey: "sk-gemini",
            }

            module = await Test.createTestingModule({
                providers: [
                    AISecretService,
                    {
                        provide: MountStorageService,
                        useValue: mountStorageService,
                    },
                ],
            }).compile()

            service = module.get<AISecretService>(AISecretService)
        })

        afterEach(async () => {
            await module.close()
        })

        describe("get",
            () => {
                it("returns the OpenAI secret for the OpenAI provider",
                    async () => {
                        expect(await service.get(ModelProvider.OpenAI)).toBe("sk-openai")
                    })

                it("returns the Gemini secret for the Gemini provider",
                    async () => {
                        expect(await service.get(ModelProvider.Gemini)).toBe("sk-gemini")
                    })

                it("throws for a provider with no mounted secret",
                    async () => {
                        // an unknown provider has no mount property in this thin secret reader
                        await expect(
                            service.get("mystery" as ModelProvider),
                        ).rejects.toThrow("Unsupported model")
                    })
            })
    })
