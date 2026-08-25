import {
    K8sResourceService
} from "./k8s-resource.service"

describe("K8sResourceService",
    () => {
        it("maps kubectl rows to typed resources and status",
            async () => {
                const probe = {
                    run: jest.fn().mockResolvedValue("pod-a  Ready 1/1 Running\ndeploy-a 1/1 1/1"), lines: jest.fn((value: string) => value.split("\n"))
                }
                const result = await new K8sResourceService(probe as never).snapshot()
                expect(result).toEqual(expect.arrayContaining([expect.objectContaining({
                    kind: "Pod", name: "Ready", status: "Running"
                }),
                expect.objectContaining({
                    kind: "Deployment", name: "1/1", status: "Ready"
                })]))
                expect(probe.run).toHaveBeenCalledWith("kubectl",
                    expect.arrayContaining(["-A",
                        "--no-headers"]))
            })
        it("returns an empty snapshot when kubectl has no rows",
            async () => { const probe = {
                run: jest.fn().mockResolvedValue(""), lines: jest.fn().mockReturnValue([])
            }; await expect(new K8sResourceService(probe as never).snapshot()).resolves.toEqual([]) })
    })
