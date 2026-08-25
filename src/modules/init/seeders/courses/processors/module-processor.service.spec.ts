import {
    ModuleProcessorService 
} from "./module-processor.service"
describe("ModuleProcessorService",
    () => { it("persists an empty module partition when no paths exist",
        async () => { const persist = jest.fn().mockResolvedValue(undefined); const service = new ModuleProcessorService({
            parse: jest.fn() 
        } as never,
{
    paths: jest.fn().mockResolvedValue([]) 
} as never,
{
    log: jest.fn() 
} as never,
{
    partitionUuidSync: jest.fn().mockResolvedValue({
        createEntities: [], updateEntities: [], deleteEntities: [] 
    }) 
} as never,
{
    process: persist 
} as never,
{
    process: jest.fn() 
} as never); await service.process({
            courseResult: {
                data: {
                    id: "c1", displayId: "course" 
                }, index: 0, relativePath: "0-course" 
            }, moduleIndexFilterByDisplayId: null 
        }); expect(persist).toHaveBeenCalled() }) })
