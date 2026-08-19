import {
    extractMessageText,
} from "./extract-message-text"

describe("extractMessageText",
    () => {
        it("returns a plain string as-is",
            () => {
                expect(extractMessageText("hello")).toBe("hello")
            })

        it("joins text blocks from a content-part array",
            () => {
                expect(extractMessageText([
                    {
                        type: "text",
                        text: "hello ",
                    },
                    {
                        type: "text",
                        text: "world",
                    },
                ])).toBe("hello world")
            })

        it("skips non-text blocks instead of stringifying them",
            () => {
                expect(extractMessageText([
                    {
                        type: "image_url",
                        image_url: "https://example.com/x.png",
                    },
                    {
                        type: "text",
                        text: "caption",
                    },
                ])).toBe("caption")
            })

        it("returns an empty string when no text block is present",
            () => {
                expect(extractMessageText([
                    {
                        type: "image_url",
                        image_url: "https://example.com/x.png",
                    },
                ])).toBe("")
            })
    })
