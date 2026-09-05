import {
    SeedersModule
} from "./seeders.module"
import {
    ChallengeParserService
} from "./courses/parsers/challenge.service"
import {
    ContentParserService
} from "./courses/parsers/content.service"
import {
    CourseParserService
} from "./courses/parsers/course.service"
import {
    ConceptInsertService,
} from "./concepts/insert.service"
import {
    ConceptParserService,
} from "./concepts/parser.service"
import {
    ConceptSeederService,
} from "./concepts/seeder.service"

describe("SeedersModule",
    () => {
        it("registers and exports parser providers through dynamic module metadata",
            () => {
                const dynamicModule = SeedersModule.register({
                    isGlobal: true
                })
                expect(dynamicModule.providers).toEqual(expect.arrayContaining([
                    ChallengeParserService,
                    ContentParserService,
                    CourseParserService,
                    ConceptParserService,
                    ConceptInsertService,
                    ConceptSeederService,
                ]))
                expect(dynamicModule.exports).toEqual(expect.arrayContaining([
                    ChallengeParserService,
                    ContentParserService,
                    CourseParserService,
                    ConceptParserService,
                    ConceptInsertService,
                    ConceptSeederService,
                ]))
            })
    })
