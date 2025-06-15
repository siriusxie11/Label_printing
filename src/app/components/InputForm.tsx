import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { toast } from 'sonner';
import useLabelLayout from '../hooks/useLabelLayout';
import type jsPDF from 'jspdf';

const FONT_OPTIONS = [
  { value: 'Arial', label: 'Arial' },
  { value: 'Times New Roman', label: 'Times New Roman' },
  { value: 'Calibri', label: 'Calibri' },
  { value: 'SimSun', label: '宋体' },
  { value: 'Microsoft YaHei', label: '微软雅黑' },
];

const ALIGNMENT_OPTIONS = [
  { value: 'left', label: '左对齐' },
  { value: 'center', label: '居中' },
  { value: 'right', label: '右对齐' },
];

export default function InputForm() {
  const [labelSize, setLabelSize] = useState({ width: 50, height: 30 });
  const [content, setContent] = useState('');
  const [lines, setLines] = useState(1);
  const [font, setFont] = useState('Arial');
  const [fontSize, setFontSize] = useState(12);
  const [count, setCount] = useState(1);
  const [margin, setMargin] = useState({ top: 10, right: 10, bottom: 10, left: 10 });
  const [downloadFormat, setDownloadFormat] = useState<'pdf' | 'docx'>('pdf');
  const [lineHeight, setLineHeight] = useState(1.0);
  const [alignment, setAlignment] = useState<'left' | 'center' | 'right'>('left');

  const { setLabelData, generateLayout, generatePDF, generateWord } = useLabelLayout();

  const handlePreview = () => {
    try {
      setLabelData(labelSize, content, lines, font, fontSize, count, margin, lineHeight, alignment);
      generateLayout();
      toast.success('预览已更新');
    } catch (error) {
      toast.error('生成预览时出错：' + (error as Error).message);
    }
  };

  const handleDownload = async () => {
    try {
      if (downloadFormat === 'pdf') {
        const doc = generatePDF();
        doc.save('labels.pdf');
        toast.success('PDF文件已生成');
      } else {
        const blob = await generateWord();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = 'labels.docx';
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
        document.body.removeChild(a);
        toast.success('Word文件已生成');
      }
    } catch (error) {
      toast.error('生成文件时出错：' + (error as Error).message);
    }
  };

  return (
    <form onSubmit={(e) => { e.preventDefault(); handlePreview(); }} className="space-y-4 p-4">
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="width">标签宽度 (mm)</Label>
          <Input
            id="width"
            type="number"
            value={labelSize.width}
            onChange={(e) => setLabelSize({ ...labelSize, width: Number(e.target.value) })}
            min="1"
            required
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="height">标签高度 (mm)</Label>
          <Input
            id="height"
            type="number"
            value={labelSize.height}
            onChange={(e) => setLabelSize({ ...labelSize, height: Number(e.target.value) })}
            min="1"
            required
          />
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="content">标签内容</Label>
        <Textarea
          id="content"
          value={content}
          onChange={(e) => setContent(e.target.value)}
          placeholder="输入标签内容，按Enter键换行"
          className="min-h-[100px]"
          required
        />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="font">字体</Label>
          <Select value={font} onValueChange={setFont}>
            <SelectTrigger>
              <SelectValue placeholder="选择字体" />
            </SelectTrigger>
            <SelectContent>
              {FONT_OPTIONS.map((option) => (
                <SelectItem key={option.value} value={option.value}>
                  {option.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-2">
          <Label htmlFor="fontSize">字体大小</Label>
          <Input
            id="fontSize"
            type="number"
            value={fontSize}
            onChange={(e) => setFontSize(Number(e.target.value))}
            min="1"
            required
          />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="lineHeight">行距</Label>
          <Input
            id="lineHeight"
            type="number"
            value={lineHeight}
            onChange={(e) => setLineHeight(Number(e.target.value))}
            min="1.0"
            step="0.1"
            required
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="alignment">对齐方式</Label>
          <Select value={alignment} onValueChange={(value: 'left' | 'center' | 'right') => setAlignment(value)}>
            <SelectTrigger>
              <SelectValue placeholder="选择对齐方式" />
            </SelectTrigger>
            <SelectContent>
              {ALIGNMENT_OPTIONS.map((option) => (
                <SelectItem key={option.value} value={option.value}>
                  {option.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="count">标签数量</Label>
        <Input
          id="count"
          type="number"
          value={count}
          onChange={(e) => setCount(Number(e.target.value))}
          min="1"
          required
        />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="marginTop">上边距 (mm)</Label>
          <Input
            id="marginTop"
            type="number"
            value={margin.top}
            onChange={(e) => setMargin({ ...margin, top: Number(e.target.value) })}
            min="0"
            required
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="marginBottom">下边距 (mm)</Label>
          <Input
            id="marginBottom"
            type="number"
            value={margin.bottom}
            onChange={(e) => setMargin({ ...margin, bottom: Number(e.target.value) })}
            min="0"
            required
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="marginLeft">左边距 (mm)</Label>
          <Input
            id="marginLeft"
            type="number"
            value={margin.left}
            onChange={(e) => setMargin({ ...margin, left: Number(e.target.value) })}
            min="0"
            required
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="marginRight">右边距 (mm)</Label>
          <Input
            id="marginRight"
            type="number"
            value={margin.right}
            onChange={(e) => setMargin({ ...margin, right: Number(e.target.value) })}
            min="0"
            required
          />
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="downloadFormat">下载格式</Label>
        <Select value={downloadFormat} onValueChange={(value: 'pdf' | 'docx') => setDownloadFormat(value)}>
          <SelectTrigger>
            <SelectValue placeholder="选择下载格式" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="pdf">PDF</SelectItem>
            <SelectItem value="docx">Word</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="flex gap-4">
        <Button type="submit" className="flex-1">
          预览
        </Button>
        <Button type="button" onClick={handleDownload} className="flex-1">
          下载
        </Button>
      </div>
    </form>
  );
} 