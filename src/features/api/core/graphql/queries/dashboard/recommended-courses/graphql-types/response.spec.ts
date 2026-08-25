import {
    RecommendedCourseObject, RecommendedCoursesData 
} from "./response"
describe("recommended courses response",
    () => { it("keeps recommendation reason and course identity",
        () => { const course = Object.assign(new RecommendedCourseObject(),
            {
                id: "c1", displayId: "intro", title: "Intro", reason: "popular" 
            }); const data = Object.assign(new RecommendedCoursesData(),
            {
                courses: [course] 
            }); expect(data).toMatchObject({
            courses: [{
                displayId: "intro", reason: "popular" 
            }] 
        }) }) })
