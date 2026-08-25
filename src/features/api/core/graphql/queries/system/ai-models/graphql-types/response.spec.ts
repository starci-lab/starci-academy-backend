import {
    AiModelChoiceData, AiModelsResponseData 
} from "./response"
describe("AI models response DTOs",
    () => { it("keeps active model choice and gradable catalog",
        () => { const choice = Object.assign(new AiModelChoiceData(),
            {
                model: "local-chat", provider: "local" 
            }); const data = Object.assign(new AiModelsResponseData(),
            {
                tier: "low", models: [], gradableModels: [{
                    model: choice.model, provider: choice.provider, category: "low", complimentary: true, available: true, supportedTasks: [] 
                }] 
            }); expect(data).toMatchObject({
            tier: "low", gradableModels: [{
                model: "local-chat", complimentary: true, available: true 
            }] 
        }) }) })
