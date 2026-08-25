import {
    AutocompleteGlobalSearchData, AutocompleteGlobalSearchItem 
} from "./response"
describe("autocomplete global search response DTOs",
    () => { it("supports sparse parent paths and kind-specific nullable flags",
        () => { const item = Object.assign(new AutocompleteGlobalSearchItem(),
            {
                id: "c1", displayId: "course", title: "Course", texts: ["<em>Course</em>"], parentPath: undefined, path: null, isEnrolled: true, isFree: false, isPremium: null 
            }); const data = Object.assign(new AutocompleteGlobalSearchData(),
            {
                courses: [item], modules: [], challenges: [], contents: [], flashcardDecks: [], milestones: [], milestoneTasks: [], foundations: [] 
            }); expect(data).toMatchObject({
            courses: [{
                path: null, isEnrolled: true 
            }], modules: [], foundations: [] 
        }) }) })
