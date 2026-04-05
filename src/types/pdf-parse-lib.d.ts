declare module "pdf-parse/lib/pdf-parse.js" {
  export interface PdfTextContentItem {
    str?: string;
  }

  export interface PdfTextContent {
    items: PdfTextContentItem[];
  }

  export interface PdfPageData {
    getTextContent(): Promise<PdfTextContent>;
  }

  export interface PdfParseOptions {
    pagerender?: (pageData: PdfPageData) => Promise<string> | string;
  }

  export interface PdfParseResult {
    text?: string;
  }

  export default function pdfParse(
    dataBuffer: Buffer,
    options?: PdfParseOptions
  ): Promise<PdfParseResult>;
}
