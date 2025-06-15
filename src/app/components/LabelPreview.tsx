import useLabelLayout from '../hooks/useLabelLayout';

export default function LabelPreview() {
  const { labelData } = useLabelLayout();
  const { layout, labelSize, content, lines, fontSize } = labelData;

  if (!layout) {
    return (
      <div className="p-4 text-center text-gray-500">
        请先生成标签布局
      </div>
    );
  }

  const { maxCols, maxRows, labelsPerPage, totalPages } = layout;

  return (
    <div className="p-4 space-y-4">
      <div className="text-sm text-gray-600">
        <p>每页可容纳标签数：{labelsPerPage}</p>
        <p>总页数：{totalPages}</p>
        <p>每行标签数：{maxCols}</p>
        <p>每列标签数：{maxRows}</p>
      </div>
      <div className="border rounded-lg p-4">
        <div
          className="relative bg-white"
          style={{
            width: '210mm',
            height: '297mm',
            transform: 'scale(0.3)',
            transformOrigin: 'top left',
          }}
        >
          {Array.from({ length: maxRows }).map((_, rowIndex) => (
            <div key={rowIndex} className="flex">
              {Array.from({ length: maxCols }).map((_, colIndex) => (
                <div
                  key={colIndex}
                  className="border border-gray-200"
                  style={{
                    width: `${labelSize.width}mm`,
                    height: `${labelSize.height}mm`,
                  }}
                >
                  <div
                    className="p-1 text-xs"
                    style={{ fontSize: `${fontSize * 0.3}px` }}
                  >
                    {content.split('\n').slice(0, lines).map((line, i) => (
                      <div key={i}>{line}</div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
} 