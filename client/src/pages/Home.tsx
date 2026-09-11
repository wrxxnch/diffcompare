/**
 * Home Page - File Diff Comparator
 * Design Philosophy: Modern SaaS - Emerald & Rose Color Scheme
 * - Green (#10b981) para adições
 * - Red (#ef4444) para deleções
 * - Clean, professional interface com whitespace generoso
 */

import { useState, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { DiffPanel } from '@/components/DiffPanel';
import { useDiffCalculator, DiffLine } from '@/hooks/useDiffCalculator';
import { Upload, Download, Copy, RotateCcw } from 'lucide-react';
import { toast } from 'sonner';

export default function Home() {
  const { calculateLineDiff } = useDiffCalculator();

  const [leftText, setLeftText] = useState('');
  const [rightText, setRightText] = useState('');
  const [syncScrollTop, setSyncScrollTop] = useState(0);
  const [leftDiff, setLeftDiff] = useState<DiffLine[]>([]);
  const [rightDiff, setRightDiff] = useState<DiffLine[]>([]);

  const leftFileInputRef = useRef<HTMLInputElement>(null);
  const rightFileInputRef = useRef<HTMLInputElement>(null);

  // Calcular diff quando o texto muda
  const updateDiff = (left: string, right: string) => {
    if (left.trim() || right.trim()) {
      const result = calculateLineDiff(left, right);
      setLeftDiff(result.leftLines);
      setRightDiff(result.rightLines);
    } else {
      setLeftDiff([]);
      setRightDiff([]);
    }
  };

  const handleLeftTextChange = (text: string) => {
    setLeftText(text);
    updateDiff(text, rightText);
  };

  const handleRightTextChange = (text: string) => {
    setRightText(text);
    updateDiff(leftText, text);
  };

  // Carregar arquivo
  const handleFileUpload = (
    file: File,
    isLeft: boolean
  ) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const content = e.target?.result as string;
      if (isLeft) {
        handleLeftTextChange(content);
      } else {
        handleRightTextChange(content);
      }
      toast.success(`Arquivo "${file.name}" carregado com sucesso`);
    };
    reader.onerror = () => {
      toast.error('Erro ao carregar arquivo');
    };
    reader.readAsText(file);
  };

  // Transferir linha
  const handleTransferLine = (
    fromDiff: DiffLine[],
    toDiff: DiffLine[],
    fromIndex: number,
    isLeftToRight: boolean
  ) => {
    const line = fromDiff[fromIndex];
    if (!line || line.type === 'unchanged') return;

    const newFromText = fromDiff
      .map((l) => l.content)
      .filter((_, i) => i !== fromIndex)
      .join('\n');

    const newToText = toDiff.map((l) => l.content).join('\n');

    if (line.type === 'add' && !isLeftToRight) {
      // Transferir adição da direita para esquerda
      const updatedLeft = leftText
        ? leftText + '\n' + line.content
        : line.content;
      handleLeftTextChange(updatedLeft);
      handleRightTextChange(newFromText);
    } else if (line.type === 'remove' && isLeftToRight) {
      // Transferir remoção da esquerda para direita
      const updatedRight = rightText
        ? rightText + '\n' + line.content
        : line.content;
      handleRightTextChange(updatedRight);
      handleLeftTextChange(newFromText);
    }

    toast.success('Linha transferida com sucesso');
  };

  // Copiar para clipboard
  const copyToClipboard = (text: string, side: string) => {
    navigator.clipboard.writeText(text);
    toast.success(`Conteúdo do lado ${side} copiado`);
  };

  // Download
  const downloadFile = (text: string, filename: string) => {
    const element = document.createElement('a');
    element.setAttribute(
      'href',
      'data:text/plain;charset=utf-8,' + encodeURIComponent(text)
    );
    element.setAttribute('download', filename);
    element.style.display = 'none';
    document.body.appendChild(element);
    element.click();
    document.body.removeChild(element);
    toast.success(`Arquivo "${filename}" baixado`);
  };

  // Reset
  const handleReset = () => {
    setLeftText('');
    setRightText('');
    setLeftDiff([]);
    setRightDiff([]);
    toast.success('Comparador reiniciado');
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
      {/* Header */}
      <header className="bg-white border-b border-gray-200 shadow-sm sticky top-0 z-10">
        <div className="container max-w-7xl mx-auto px-4 py-6">
          <div className="flex items-center justify-between gap-4">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">
                File Diff Comparator
              </h1>
              <p className="text-sm text-gray-600 mt-1">
                Compare dois arquivos e transfira diferenças facilmente
              </p>
            </div>
            <Button
              onClick={handleReset}
              variant="outline"
              size="sm"
              className="gap-2"
            >
              <RotateCcw className="w-4 h-4" />
              Reiniciar
            </Button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container max-w-7xl mx-auto px-4 py-8">
        {/* Upload Section */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
          {/* Left Upload */}
          <Card className="p-6 border-2 border-dashed border-gray-300 hover:border-emerald-400 transition-colors cursor-pointer">
            <input
              ref={leftFileInputRef}
              type="file"
              onChange={(e) => {
                const file = e.target.files?.[0];
                if (file) handleFileUpload(file, true);
              }}
              className="hidden"
              accept=".txt,.js,.ts,.py,.java,.cpp,.c,.go,.rs,.rb,.php,.html,.css,.json,.xml,.yaml,.yml,.md"
            />
            <button
              onClick={() => leftFileInputRef.current?.click()}
              className="w-full flex flex-col items-center justify-center gap-3 py-8"
            >
              <Upload className="w-8 h-8 text-emerald-600" />
              <div>
                <p className="font-semibold text-gray-900">
                  Arquivo Original
                </p>
                <p className="text-sm text-gray-600">
                  Clique para carregar ou arraste um arquivo
                </p>
              </div>
            </button>
          </Card>

          {/* Right Upload */}
          <Card className="p-6 border-2 border-dashed border-gray-300 hover:border-rose-400 transition-colors cursor-pointer">
            <input
              ref={rightFileInputRef}
              type="file"
              onChange={(e) => {
                const file = e.target.files?.[0];
                if (file) handleFileUpload(file, false);
              }}
              className="hidden"
              accept=".txt,.js,.ts,.py,.java,.cpp,.c,.go,.rs,.rb,.php,.html,.css,.json,.xml,.yaml,.yml,.md"
            />
            <button
              onClick={() => rightFileInputRef.current?.click()}
              className="w-full flex flex-col items-center justify-center gap-3 py-8"
            >
              <Upload className="w-8 h-8 text-rose-600" />
              <div>
                <p className="font-semibold text-gray-900">
                  Arquivo Modificado
                </p>
                <p className="text-sm text-gray-600">
                  Clique para carregar ou arraste um arquivo
                </p>
              </div>
            </button>
          </Card>
        </div>

        {/* Comparison Section */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
          {/* Left Panel */}
          <div className="flex flex-col gap-4">
            <DiffPanel
              title="Arquivo Original"
              lines={leftDiff}
              onScroll={setSyncScrollTop}
              syncScrollTop={syncScrollTop}
              onTransferLine={(index) =>
                handleTransferLine(leftDiff, rightDiff, index, true)
              }
              transferDirection="left-to-right"
            />
            <div className="flex gap-2">
              <Button
                onClick={() => copyToClipboard(leftText, 'esquerda')}
                variant="outline"
                size="sm"
                className="flex-1 gap-2"
                disabled={!leftText}
              >
                <Copy className="w-4 h-4" />
                Copiar
              </Button>
              <Button
                onClick={() => downloadFile(leftText, 'original.txt')}
                variant="outline"
                size="sm"
                className="flex-1 gap-2"
                disabled={!leftText}
              >
                <Download className="w-4 h-4" />
                Baixar
              </Button>
            </div>
          </div>

          {/* Right Panel */}
          <div className="flex flex-col gap-4">
            <DiffPanel
              title="Arquivo Modificado"
              lines={rightDiff}
              onScroll={setSyncScrollTop}
              syncScrollTop={syncScrollTop}
              onTransferLine={(index) =>
                handleTransferLine(rightDiff, leftDiff, index, false)
              }
              transferDirection="right-to-left"
            />
            <div className="flex gap-2">
              <Button
                onClick={() => copyToClipboard(rightText, 'direita')}
                variant="outline"
                size="sm"
                className="flex-1 gap-2"
                disabled={!rightText}
              >
                <Copy className="w-4 h-4" />
                Copiar
              </Button>
              <Button
                onClick={() => downloadFile(rightText, 'modified.txt')}
                variant="outline"
                size="sm"
                className="flex-1 gap-2"
                disabled={!rightText}
              >
                <Download className="w-4 h-4" />
                Baixar
              </Button>
            </div>
          </div>
        </div>

        {/* Text Input Section */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Left Text Area */}
          <Card className="p-6">
            <label className="block text-sm font-semibold text-gray-900 mb-3">
              Ou cole o texto original aqui
            </label>
            <textarea
              value={leftText}
              onChange={(e) => handleLeftTextChange(e.target.value)}
              placeholder="Cole o conteúdo do arquivo original..."
              className="w-full h-64 p-4 font-mono text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent resize-none"
            />
          </Card>

          {/* Right Text Area */}
          <Card className="p-6">
            <label className="block text-sm font-semibold text-gray-900 mb-3">
              Ou cole o texto modificado aqui
            </label>
            <textarea
              value={rightText}
              onChange={(e) => handleRightTextChange(e.target.value)}
              placeholder="Cole o conteúdo do arquivo modificado..."
              className="w-full h-64 p-4 font-mono text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-rose-500 focus:border-transparent resize-none"
            />
          </Card>
        </div>

        {/* Legend */}
        {(leftDiff.length > 0 || rightDiff.length > 0) && (
          <Card className="mt-8 p-6 bg-gradient-to-r from-gray-50 to-gray-100 border border-gray-200">
            <h3 className="font-semibold text-gray-900 mb-4">Legenda</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="flex items-start gap-3">
                <div className="flex-shrink-0 w-4 h-4 rounded bg-emerald-500 mt-1" />
                <div>
                  <p className="font-medium text-gray-900">Adições</p>
                  <p className="text-sm text-gray-600">
                    Linhas adicionadas no arquivo modificado
                  </p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <div className="flex-shrink-0 w-4 h-4 rounded bg-rose-500 mt-1" />
                <div>
                  <p className="font-medium text-gray-900">Deleções</p>
                  <p className="text-sm text-gray-600">
                    Linhas removidas do arquivo original
                  </p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <div className="flex-shrink-0 w-4 h-4 rounded bg-gray-300 mt-1" />
                <div>
                  <p className="font-medium text-gray-900">Inalteradas</p>
                  <p className="text-sm text-gray-600">
                    Linhas que não sofreram mudanças
                  </p>
                </div>
              </div>
            </div>
          </Card>
        )}
      </main>

      {/* Footer */}
      <footer className="border-t border-gray-200 bg-white mt-16">
        <div className="container max-w-7xl mx-auto px-4 py-8">
          <p className="text-sm text-gray-600 text-center">
            File Diff Comparator • Compare arquivos facilmente e transfira
            diferenças com um clique
          </p>
        </div>
      </footer>
    </div>
  );
}
