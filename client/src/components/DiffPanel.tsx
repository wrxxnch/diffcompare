/**
 * DiffPanel Component
 * Design Philosophy: Modern SaaS - Emerald & Rose Color Scheme
 * Exibe um lado da comparação com scroll sincronizado e minimap visual
 */

import { useEffect, useRef, useState } from 'react';
import { DiffLine } from '@/hooks/useDiffCalculator';
import { DiffLineDisplay } from './DiffLineDisplay';
import { ScrollMinimap } from './ScrollMinimap';

interface DiffPanelProps {
  title: string;
  lines: DiffLine[];
  onScroll?: (scrollTop: number) => void;
  syncScrollTop?: number;
  onTransferLine?: (lineIndex: number) => void;
  transferDirection?: 'left-to-right' | 'right-to-left';
  showMinimap?: boolean;
}

export function DiffPanel({
  title,
  lines,
  onScroll,
  syncScrollTop = 0,
  onTransferLine,
  transferDirection,
  showMinimap = true,
}: DiffPanelProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [containerHeight, setContainerHeight] = useState(0);

  // Sincronizar scroll entre os painéis
  useEffect(() => {
    if (containerRef.current) {
      containerRef.current.scrollTop = syncScrollTop;
    }
  }, [syncScrollTop]);

  // Atualizar altura do container
  useEffect(() => {
    const updateHeight = () => {
      if (containerRef.current) {
        setContainerHeight(containerRef.current.clientHeight);
      }
    };

    updateHeight();
    window.addEventListener('resize', updateHeight);
    return () => window.removeEventListener('resize', updateHeight);
  }, []);

  const handleScroll = (e: React.UIEvent<HTMLDivElement>) => {
    const target = e.currentTarget;
    onScroll?.(target.scrollTop);
    setContainerHeight(target.clientHeight);
  };

  const handleLineClick = (lineIndex: number) => {
    if (containerRef.current && lines.length > 0) {
      // Calcular scroll position baseado no índice da linha
      // Cada linha tem aproximadamente 48px (py-2 = 8px + content)
      const lineHeight = 48;
      const scrollTop = lineIndex * lineHeight;
      containerRef.current.scrollTop = scrollTop;
      onScroll?.(scrollTop);
    }
  };

  const addedCount = lines.filter((l) => l.type === 'add').length;
  const removedCount = lines.filter((l) => l.type === 'remove').length;

  return (
    <div className="flex gap-2 h-full">
      {/* Minimap */}
      {showMinimap && lines.length > 0 && (
        <div className="flex-shrink-0 flex justify-center py-4 bg-gray-50 border border-gray-200 rounded-lg">
          <ScrollMinimap
            lines={lines}
            containerScrollTop={syncScrollTop}
            containerHeight={containerHeight}
            onLineClick={handleLineClick}
          />
        </div>
      )}

      {/* Main Panel */}
      <div className="flex flex-col flex-1 h-full bg-white rounded-lg border border-gray-200 shadow-sm overflow-hidden">
        {/* Header */}
        <div className="flex-shrink-0 bg-gradient-to-r from-gray-50 to-gray-100 border-b border-gray-200 px-4 py-3">
          <h2 className="text-sm font-semibold text-gray-900 mb-1">{title}</h2>
          <div className="flex gap-4 text-xs text-gray-600">
            <span>
              Total: <span className="font-semibold">{lines.length}</span> linhas
            </span>
            {addedCount > 0 && (
              <span className="text-emerald-700">
                + <span className="font-semibold">{addedCount}</span>
              </span>
            )}
            {removedCount > 0 && (
              <span className="text-rose-700">
                − <span className="font-semibold">{removedCount}</span>
              </span>
            )}
          </div>
        </div>

        {/* Content */}
        <div
          ref={containerRef}
          onScroll={handleScroll}
          className="flex-1 overflow-y-auto overflow-x-hidden"
        >
          {lines.length === 0 ? (
            <div className="flex items-center justify-center h-full text-gray-500">
              <p className="text-sm">Nenhuma linha para exibir</p>
            </div>
          ) : (
            <div className="divide-y divide-gray-100">
              {lines.map((line, index) => (
                <DiffLineDisplay
                  key={`${line.lineNumber}-${line.type}`}
                  line={line}
                  onTransfer={() => onTransferLine?.(index)}
                  transferDirection={transferDirection}
                />
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
