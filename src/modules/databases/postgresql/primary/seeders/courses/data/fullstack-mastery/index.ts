import {
    DeepPartial 
} from "typeorm"
import {
    CourseEntity 
} from "../../../../entities"
import {
    fullstackMasteryModule1 
} from "./modules"

/**
 * Fullstack Mastery course data.
 */
export const fullstackMasteryCourse: DeepPartial<CourseEntity> = {
    id: "fullstack-mastery",
    title: "Fullstack Mastery",
    description: "Khóa học dành cho học sinh và sinh viên muốn tích lũy tư duy, kiến thức và kỹ năng cần thiết để có thể đi thực tập hoặc làm việc ở vị trí Fresher/Junior Developer. Chương trình bao quát đầy đủ kiến thức Fullstack với tất cả các khái niệm cơ bản từ frontend đến backend, giúp bạn hiểu nền tảng và có thể bắt đầu làm việc thực tế.",
    prerequisites: [
        {
            id: "fullstack-mastery-prerequisite-1",
            content: "Nắm được JavaScript cơ bản: hiểu về biến, function, async/await, promise và cách xử lý logic đơn giản. Không cần quá nâng cao, nhưng cần đủ để đọc hiểu và viết code.",
            orderIndex: 0,
        },
        {
            id: "fullstack-mastery-prerequisite-2",
            content: "Có tư duy lập trình backend ở mức cơ bản: hiểu API là gì, request/response hoạt động ra sao, và từng làm qua các bài toán CRUD hoặc project nhỏ. Khóa học sẽ đào sâu hơn, nên bạn cần nền tảng để theo kịp.",
            orderIndex: 1,
        },
    ],
    qnas: [
        {
            id: "fullstack-mastery-qna-1",
            question: "Em theo Java, .NET, Python, có thể học khóa học này không?",
            answer: "Hoàn toàn phù hợp. Khóa học sử dụng NestJS để giảng dạy vì đây là một framework hiện đại, giúp truyền tải rõ ràng các khái niệm backend. Tuy nhiên, bản chất backend không nằm ở ngôn ngữ hay framework, mà nằm ở tư duy xây dựng hệ thống. Mentor có nền tảng backend vững (đa stack), nên có thể hỗ trợ bạn mapping kiến thức sang Java, .NET, Python khi cần.",
            orderIndex: 0,
        },
        {
            id: "fullstack-mastery-qna-2",
            question: "Có rất nhiều khóa học về lập trình backend, em có nên học khóa học này không?",
            answer: "Nếu bạn đang tìm một khóa học chỉ dừng lại ở CRUD và kiến thức bề nổi, thì khóa này không dành cho bạn. Khóa học đi thẳng vào bản chất của backend — từ tư duy thiết kế hệ thống, cách xử lý bài toán thực tế đến những vấn đề mà developer thường gặp khi làm production. Giáo án được xây dựng theo hướng nhanh, trực diện, không lòng vòng, giúp bạn hiểu sâu và áp dụng được ngay, thay vì chỉ học để biết.",
            orderIndex: 1,
        },
    ],
    modules: [
        fullstackMasteryModule1,
    ],
}