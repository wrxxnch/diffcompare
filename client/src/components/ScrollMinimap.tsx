/**
 * ScrollMinimap Component
 * Design Philosophy: Modern SaaS - Emerald & Rose Color Scheme
 * Exibe uma miniatura visual do conteúdo com indicadores de alterações
 * - Verde (#10b981) para adições
 * - Vermelho (#ef4444) para deleções
 * Clique em qualquer linha para navegar para ela
 */

import { useEffect, useRef } from 'react';
import { DiffLine } from '@/hooks/useDiffCalculator';

interface ScrollMinimapProps {
  lines: DiffLine[];
  containerScrollTop: number;
  containerHeight: number;
  onLineClick?: (lineIndex: number) => void;
}

export function ScrollMinimap({
  lines,
  containerScrollTop,
  containerHeight,
  onLineClick,
}: ScrollMinimapProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || lines.length === 0) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const width = canvas.width;
    const height = canvas.height;

    // Limpar canvas
    ctx.fillStyle = '#f3f4f6';
    ctx.fillRect(0, 0, width, height);

    // Calcular altura de cada linha na miniatura
    const lineHeight = height / lines.length;

    // Desenhar indicadores de alterações
    lines.forEach((line, index) => {
      const y = index * lineHeight;

      if (line.type === 'add') {
        // Verde para adições
        ctx.fillStyle = '#10b981';
        ctx.fillRect(0, y, width, lineHeight);
      } else if (line.type === 'remove') {
        // Vermelho para deleções
        ctx.fillStyle = '#ef4444';
        ctx.fillRect(0, y, width, lineHeight);
      } else {
        // Cinza claro para linhas inalteradas
        ctx.fillStyle = '#e5e7eb';
        ctx.fillRect(0, y, width, lineHeight);
      }
    });

    // Desenhar indicador de viewport (área visível)
    const viewportHeight = (containerHeight / (lines.length * 20)) * height; // Aproximação
    const viewportY = (containerScrollTop / (lines.length * 20)) * height;

    ctx.strokeStyle = '#3b82f6';
    ctx.lineWidth = 2;
    ctx.strokeRect(0, viewportY, width, Math.max(viewportHeight, 10));

    // Preencher viewport com transparência
    ctx.fillStyle = 'rgba(59, 130, 246, 0.1)';
    ctx.fillRect(0, viewportY, width, Math.max(viewportHeight, 10));
  }, [lines, containerScrollTop, containerHeight]);

  const handleMinimapClick = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas || !onLineClick) return;

    const rect = canvas.getBoundingClientRect();
    const y = e.clientY - rect.top;
    const percentage = y / rect.height;

    // Encontrar a linha mais próxima ao clique
    const clickedLineIndex = Math.floor(percentage * lines.length);
    const lineIndex = Math.max(0, Math.min(clickedLineIndex, lines.length - 1));

    onLineClick(lineIndex);
  };

  if (lines.length === 0) {
    return null;
  }

  return (
    <div className="flex flex-col items-center gap-2">
      <canvas
        ref={canvasRef}
        width={40}
        height={300}
        onClick={handleMinimapClick}
        className="border border-gray-300 rounded cursor-pointer hover:border-blue-400 transition-colors"
        title="Clique para navegar para a linha. Verde = adições, Vermelho = deleções"
      />
      <div className="text-xs text-gray-600 text-center max-w-[40px]">
        <div className="flex items-center justify-center gap-1">
          <div className="w-2 h-2 bg-emerald-500 rounded" />
          <div className="w-2 h-2 bg-rose-500 rounded" />
        </div>
      </div>
    </div>
  );
}
