import {
    Test, TestingModule 
} from "@nestjs/testing"
import {
    MlSucvatController 
} from "./ml-sucvat.controller"
import {
    MlSucvatService 
} from "./ml-sucvat.service"

describe("MlSucvatController",
    () => {
        let mlSucvatController: MlSucvatController

        beforeEach(async () => {
            const app: TestingModule = await Test.createTestingModule({
                controllers: [MlSucvatController],
                providers: [MlSucvatService],
            }).compile()

            mlSucvatController = app.get<MlSucvatController>(MlSucvatController)
        })

        describe("root",
            () => {
                it("should return \"Hello World!\"",
                    () => {
                        expect(mlSucvatController.getHello()).toBe("Hello World!")
                    })
            })
    })
