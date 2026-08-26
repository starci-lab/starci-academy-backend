import {
    DockerResourceService,
} from "./docker-resource.service"

describe("DockerResourceService",
    () => {
        it("maps containers, images, and networks while omitting dangling images",
            async () => {
                const probe = {
                    run: jest.fn()
                        .mockResolvedValueOnce("web\trUNNING\nworker\tExited (1)")
                        .mockResolvedValueOnce("acme/api:latest\n<none>:<none>\n")
                        .mockResolvedValueOnce("bridge\n"),
                    lines: jest.fn((output: string) => output.split("\n").filter(Boolean)),
                }

                await expect(new DockerResourceService(probe as never).snapshot()).resolves.toEqual([
                    {
                        kind: "Container",
                        name: "web",
                        status: "Running",
                    },
                    {
                        kind: "Container",
                        name: "worker",
                        status: "Exited (1)",
                    },
                    {
                        kind: "Image",
                        name: "acme/api:latest",
                        status: "Present",
                    },
                    {
                        kind: "Network",
                        name: "bridge",
                        status: "Present",
                    },
                ])
                expect(probe.run).toHaveBeenNthCalledWith(1,
                    "docker",
                    ["ps",
                        "-a",
                        "--format",
                        "{{.Names}}\t{{.State}}"])
            })

        it("keeps empty container states and ignores blank network rows",
            async () => {
                const probe = {
                    run: jest.fn()
                        .mockResolvedValueOnce("\tmissing-name\nnameless-state\t\n")
                        .mockResolvedValueOnce("")
                        .mockResolvedValueOnce(""),
                    lines: jest.fn((output: string) => output.split("\n").filter(Boolean)),
                }

                await expect(new DockerResourceService(probe as never).snapshot()).resolves.toEqual([
                    {
                        kind: "Container",
                        name: "nameless-state",
                        status: "",
                    },
                ])
            })
    })
