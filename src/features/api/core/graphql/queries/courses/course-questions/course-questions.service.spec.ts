import {
    CourseQuestionsService
} from "./course-questions.service"
import {
    CourseQuestionFilter
} from "@modules/bussiness/discussion/types/comment"
describe("CourseQuestionsService",
    () => {
        it("maps questions and defaults the filter",
            async () => {
                const commentService = {
                    listCourseQuestions: jest.fn().mockResolvedValue({
                        questions: [{
                            comment: {
                                id: "q", body: "body", createdAt: new Date(), editedAt: null, user: {
                                    username: "founder"
                                }, content: null
                            }, replyCount: 2, answeredByFounder: true
                        }], total: 1
                    })
                }
                const service = new CourseQuestionsService(commentService as never)
                await expect(service.execute({
                    request: {
                        courseId: "c", page: 1, limit: 10
                    }, user: {
                        id: "u"
                    }
                } as never)).resolves.toMatchObject({
                    total: 1, questions: [{
                        id: "q", replyCount: 2, isFounderAuthor: false, contentId: null
                    }]
                })
                expect(commentService.listCourseQuestions).toHaveBeenCalledWith(expect.objectContaining({
                    filter: CourseQuestionFilter.All, userId: "u"
                }))
            })
    })
