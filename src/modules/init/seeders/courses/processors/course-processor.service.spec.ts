import {
    CourseProcessorService 
} from "./course-processor.service"
jest.mock("@modules/filesystem/utils/mount-secrets",
    () => ({
        getAppConfig: jest.fn().mockReturnValue({
        }) 
    }))
describe("CourseProcessorService",
    () => { it("skips nested processors when a course is deleted by reconciliation",
        async () => { const course = {
            id: "c1", displayId: "course" 
        }; const service = new CourseProcessorService({
            findOne: jest.fn().mockResolvedValue(null) 
        } as never,
{
    partitionUuidSync: jest.fn().mockResolvedValue({
        createEntities: [], updateEntities: [], deleteEntities: [{
            id: "c1" 
        }] 
    }) 
} as never,
{
    process: jest.fn() 
} as never,
{
    process: jest.fn() 
} as never,
{
    process: jest.fn() 
} as never,
{
    process: jest.fn() 
} as never,
{
    process: jest.fn() 
} as never,
{
    process: jest.fn() 
} as never); await service.process({
            courseResults: [{
                data: course, index: 0, relativePath: "0-course" 
            }], moduleIndexFilterByDisplayId: null, milestoneIndexFilterByDisplayId: null, flashcardEnabled: false 
        }) }) })
