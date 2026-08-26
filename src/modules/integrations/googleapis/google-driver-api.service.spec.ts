import {
    GoogleDriverAPIService
} from "./google-driver-api.service"

describe("GoogleDriverAPIService",
    () => {
        it("extracts document IDs and returns exported text",
            async () => {
                const service = new GoogleDriverAPIService({
                    credentials: {
                        client_email: "test@example.com", private_key: "key"
                    },
                    timeoutMs: 5000,
                })
                const exportFile = jest.fn().mockResolvedValue({
                    data: "document text"
                })
                Object.defineProperty(service,
                    "drive",
                    {
                        value: {
                            files: {
                                export: exportFile
                            }
                        },
                        configurable: true,
                    })

                await expect(service.fetchGoogleDocsText({
                    urlOrId: "https://docs.google.com/document/d/doc-123/edit?usp=sharing",
                })).resolves.toEqual({
                    docId: "doc-123", text: "document text"
                })
                expect(exportFile).toHaveBeenCalledWith({
                    fileId: "doc-123", mimeType: "text/plain"
                },
                {
                    responseType: "text",
                    timeout: 5000,
                })
                await expect(service.fetchGoogleDocsText({
                    urlOrId: "plain-id"
                })).resolves.toEqual({
                    docId: "plain-id",
                    text: "document text",
                })
                await expect(service.fetchGoogleDocsText({
                    urlOrId: "https://example.test/no-doc"
                })).resolves.toEqual({
                    docId: "",
                    text: "document text",
                })
            })
    })
