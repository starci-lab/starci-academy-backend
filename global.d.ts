import {
    INestApplication 
} from "@nestjs/common"

export {}

declare global {
  var __APP__: INestApplication
}

declare module "html-to-docx" {
  /**
   * Converts an HTML string to a .docx document buffer. (CommonJS default
   * export; no bundled types — this ambient shim covers the call we use.)
   */
  const HTMLtoDOCX: (
    htmlString: string,
    headerHTMLString?: string | null,
    documentOptions?: Record<string, unknown>,
    footerHTMLString?: string | null,
  ) => Promise<Buffer | ArrayBuffer>
  export default HTMLtoDOCX
}