import { pdfjs } from 'react-pdf';

export async function getPageText(pdf: pdfjs.PDFDocumentProxy, pageNumber: number): Promise<string> {
  const page = await pdf.getPage(pageNumber);
  const textContent = await page.getTextContent();
  return textContent.items.map((item) => 'str' in item ? item.str : '').join(' ');
}
