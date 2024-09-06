import React from 'react';

interface ExtractedText {
  id: string;
  pageNumber: number;
  text: string;
  rectangleInfo: {
    left: number;
    top: number;
    width: number;
    height: number;
  };
}

interface ExtractedTextListProps {
  extractedTexts: ExtractedText[];
}

const ExtractedTextList: React.FC<ExtractedTextListProps> = ({ extractedTexts }) => {
  return (
    <div className="flex-1 h-full overflow-y-auto">
      <h2 className="text-xl font-bold mb-4">Extracted Text</h2>
      {extractedTexts.map((item) => (
        <div key={item.id} className="mb-4 p-4 border rounded">
          <p className="font-semibold">Page: {item.pageNumber}</p>
          <p className="text-sm text-gray-600">
            Position: (L: {item.rectangleInfo.left.toFixed(2)}, T: {item.rectangleInfo.top.toFixed(2)})
          </p>
          <p className="text-sm text-gray-600">
            Size: {item.rectangleInfo.width.toFixed(2)} x {item.rectangleInfo.height.toFixed(2)}
          </p>
          <p className="mt-2">{item.text}</p>
        </div>
      ))}
    </div>
  );
};

export default ExtractedTextList;
