import * as pdfjs from "pdfjs-dist";
import { ProcessingRules } from "../types";

export async function getPageText(pdf: pdfjs.PDFDocumentProxy, pageNumber: number): Promise<string> {
  const page = await pdf.getPage(pageNumber);
  const textContent = await page.getTextContent();
  return textContent.items.map((item) => "str" in item ? item.str : "").join(" ");
}

export function getPagesToInclude(processingRules: ProcessingRules, totalPages: number): number[] {
  const { strategy, rules } = processingRules.pageSelection;
  const allPages = Array.from({ length: totalPages }, (_, i) => i + 1);

  if (rules.length === 1 && rules[0].type === "all") {
    return strategy === "include" ? allPages : [];
  }

  const specificRule = rules.find(rule => rule.type === "specific") as { type: "specific"; pages: number[] } | undefined;
  if (specificRule) {
    return strategy === "include"
      ? specificRule.pages
      : allPages.filter(page => !specificRule.pages.includes(page));
  }

  return strategy === "include" ? allPages : [];
}