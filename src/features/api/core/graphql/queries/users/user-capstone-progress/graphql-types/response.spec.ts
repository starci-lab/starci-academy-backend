import {
    CapstoneCourseProgressObject, CapstoneTaskItemObject 
} from "./response"
describe("user capstone progress response DTOs",
    () => { it("reports passed task totals and nullable passedAt",
        () => { const task = Object.assign(new CapstoneTaskItemObject(),
            {
                taskGlobalId: "task1", title: "Ship", passed: false, score: 0, passedAt: null 
            }); const course = Object.assign(new CapstoneCourseProgressObject(),
            {
                courseGlobalId: "course1", courseTitle: "Capstone", totalMilestones: 1, completedMilestones: 0, totalTasks: 1, completedTasks: 0, milestones: [] 
            }); expect({
            task, course 
        }).toMatchObject({
            task: {
                passed: false, passedAt: null 
            }, course: {
                totalTasks: 1, completedTasks: 0 
            } 
        }) }) })
