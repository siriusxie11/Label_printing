import { create } from 'zustand';
import jsPDF from 'jspdf';
import { Document, Packer, Paragraph, TextRun, AlignmentType, Table, TableRow, TableCell, WidthType, BorderStyle } from 'docx';

interface LabelData {
  labelSize: { width: number; height: number };
  content: string;
  lines: number;
  font: string;
  fontSize: number;
  count: number;
  margin: { top: number; right: number; bottom: number; left: number };
  lineHeight: number;
  alignment: 'left' | 'center' | 'right';
  layout: any; // 存储标签布局信息
}

interface LabelLayoutState {
  labelData: LabelData;
  setLabelData: (labelSize: { width: number; height: number }, content: string, lines: number, font: string, fontSize: number, count: number, margin: { top: number; right: number; bottom: number; left: number }, lineHeight: number, alignment: 'left' | 'center' | 'right') => void;
  generateLayout: () => void;
  generatePDF: () => jsPDF;
  generateWord: () => Promise<Blob>;
}

const useLabelLayout = create<LabelLayoutState>((set, get) => ({
  labelData: {
    labelSize: { width: 0, height: 0 },
    content: '',
    lines: 0,
    font: '',
    fontSize: 0,
    count: 0,
    margin: { top: 0, right: 0, bottom: 0, left: 0 },
    lineHeight: 1.0,
    alignment: 'left',
    layout: null,
  },

  setLabelData: (labelSize, content, lines, font, fontSize, count, margin, lineHeight, alignment) => set({
    labelData: { labelSize, content, lines, font, fontSize, count, margin, lineHeight, alignment, layout: null },
  }),

  generateLayout: () => set((state) => {
    const { labelSize, content, lines, font, fontSize, count, margin, lineHeight, alignment } = state.labelData;
    let layout = {};

    const doc = new jsPDF({
      format: 'a4',
      unit: 'mm',
    });

    // 计算在一页A4纸上可以包含多少标签
    const pageWidth = 210;
    const pageHeight = 297;
    const usableWidth = pageWidth - margin.left - margin.right;
    const usableHeight = pageHeight - margin.top - margin.bottom;

    // 计算每个标签实际需要的高度（考虑内容行数和行距）
    const contentLines = content.split('\n');
    const contentHeight = contentLines.length * fontSize * lineHeight;
    const actualLabelHeight = Math.max(labelSize.height, contentHeight);

    // 检查布局合理性
    const errors: string[] = [];

    // 检查标签尺寸是否合理
    if (labelSize.width < 10 || labelSize.height < 10) {
      errors.push('标签尺寸太小，建议宽度和高度至少为10mm');
    }

    // 检查内容是否超出标签宽度
    doc.setFont(font);
    doc.setFontSize(fontSize);
    const maxLineWidth = Math.max(...contentLines.map(line => doc.getTextWidth(line)));
    if (maxLineWidth > labelSize.width) {
      errors.push(`内容超出标签宽度：最长的行需要 ${maxLineWidth.toFixed(1)}mm，但标签宽度只有 ${labelSize.width}mm`);
    }

    // 检查内容高度是否超出标签高度
    if (contentHeight > labelSize.height) {
      errors.push(`内容超出标签高度：内容需要 ${contentHeight.toFixed(1)}mm，但标签高度只有 ${labelSize.height}mm`);
    }

    // 检查字体大小是否合理
    if (fontSize < 6) {
      errors.push('字体大小太小，建议至少为6pt');
    } else if (fontSize > 72) {
      errors.push('字体大小太大，建议不超过72pt');
    }

    // 检查行距是否合理
    if (lineHeight < 1.0) {
      errors.push('行距太小，建议至少为1.0');
    } else if (lineHeight > 3.0) {
      errors.push('行距太大，建议不超过3.0');
    }

    // 检查边距是否合理
    const minMargin = 2;
    if (margin.top < minMargin || margin.right < minMargin || margin.bottom < minMargin || margin.left < minMargin) {
      errors.push(`边距太小，建议至少为${minMargin}mm`);
    }

    // 检查每页可容纳的标签数量
    const maxCols = Math.floor(usableWidth / labelSize.width);
    const maxRows = Math.floor(usableHeight / actualLabelHeight);
    const labelsPerPage = maxCols * maxRows;

    if (labelsPerPage === 0) {
      errors.push('标签尺寸太大，无法在一页中放置任何标签');
    }

    if (errors.length > 0) {
      throw new Error('布局不合理：\n' + errors.join('\n'));
    }

    const totalPages = Math.ceil(count / labelsPerPage);

    layout = {
      maxCols,
      maxRows,
      labelsPerPage,
      totalPages,
      pageWidth,
      pageHeight,
      usableWidth,
      usableHeight,
      actualLabelHeight,
      contentLines,
    };

    return { labelData: { ...state.labelData, layout } };
  }),

  generatePDF: () => {
    const { labelData } = get();
    const { labelSize, content, lines, font, fontSize, count, margin, layout, lineHeight, alignment } = labelData;

    if (!layout) {
      throw new Error('Please generate layout first');
    }

    const doc = new jsPDF({
      format: 'a4',
      unit: 'mm',
    });

    doc.setFont(font);
    doc.setFontSize(fontSize);

    let labelIndex = 0;
    let currentPage = 0;
    let currentRow = 0;
    let currentCol = 0;

    while (labelIndex < count) {
      // 如果当前行已经超出页面范围，或者当前行剩余空间不够放置一个标签，就另起新页
      if (currentRow >= layout.maxRows || 
          (currentRow === layout.maxRows - 1 && currentCol === 0 && layout.actualLabelHeight > layout.usableHeight - currentRow * layout.actualLabelHeight)) {
        doc.addPage();
        currentPage++;
        currentRow = 0;
        currentCol = 0;
      }

      const xOffset = margin.left + currentCol * labelSize.width;
      const yOffset = margin.top + currentRow * layout.actualLabelHeight;

      // 绘制标签内容
      layout.contentLines.forEach((line: string, index: number) => {
        const textWidth = doc.getTextWidth(line);
        let x = xOffset;
        // 根据对齐方式调整x坐标
        if (alignment === 'center') {
          x += (labelSize.width - textWidth) / 2;
        } else if (alignment === 'right') {
          x += labelSize.width - textWidth;
        }
        doc.text(line, x, yOffset + index * fontSize * lineHeight);
      });

      // 更新位置
      currentCol++;
      if (currentCol >= layout.maxCols) {
        currentCol = 0;
        currentRow++;
      }
      labelIndex++;
    }

    return doc;
  },

  generateWord: async () => {
    const { labelData } = get();
    const { content, lines, font, fontSize, count, margin, layout, lineHeight, alignment } = labelData;

    if (!layout) {
      throw new Error('Please generate layout first');
    }

    const { maxCols, maxRows, totalPages, contentLines } = layout;

    // 创建表格来模拟标签布局
    const table = new Table({
      width: {
        size: 100,
        type: WidthType.PERCENTAGE,
      },
      rows: Array.from({ length: maxRows }).map((_, rowIndex) => 
        new TableRow({
          height: {
            value: layout.actualLabelHeight * 28.35, // 转换为磅（1mm = 2.835磅）
            rule: "exact"
          },
          children: Array.from({ length: maxCols }).map((_, colIndex) => 
            new TableCell({
              width: {
                size: 100 / maxCols,
                type: WidthType.PERCENTAGE,
              },
              borders: {
                top: { style: BorderStyle.NONE },
                bottom: { style: BorderStyle.NONE },
                left: { style: BorderStyle.NONE },
                right: { style: BorderStyle.NONE },
              },
              children: [
                new Paragraph({
                  alignment: alignment === 'left' ? AlignmentType.LEFT : 
                           alignment === 'center' ? AlignmentType.CENTER : 
                           AlignmentType.RIGHT,
                  children: contentLines.map((line: string) => 
                    new TextRun({
                      text: line,
                      font: font,
                      size: fontSize * 2, // Word中字体大小单位是磅，需要转换
                    })
                  ),
                  spacing: {
                    line: lineHeight * 240, // Word中行距单位是磅，需要转换
                  },
                }),
              ],
            })
          ),
        })
      ),
    });

    const doc = new Document({
      sections: Array.from({ length: totalPages }).map(() => ({
        properties: {},
        children: [table],
      })),
    });

    return await Packer.toBlob(doc);
  },
}));

export default useLabelLayout; 