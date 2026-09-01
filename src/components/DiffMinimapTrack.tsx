import React, { useState, useEffect, useRef } from 'react';
import { DiffChunk } from '../types';

interface DiffMinimapTrackProps {
  chunks: DiffChunk[];
  scrollContainerRef: React.RefObject<HTMLDivElement>;
  onJumpToChunk: (chunk: DiffChunk) => void;
  activeChunkId?: string;
  sideLabel?: string;
}

export const DiffMinimapTrack: React.FC<DiffMinimapTrackProps> = ({
  chunks,
  scrollContainerRef,
  onJumpToChunk,
  activeChunkId,
  sideLabel
}) => {
  const trackRef = useRef<HTMLDivElement>(null);
  const [viewportTop, setViewportTop] = useState(0);
  const [viewportHeight, setViewportHeight] = useState(20);
  const [hoveredChunk, setHoveredChunk] = useState<{ chunk: DiffChunk; top: number } | null>(null);

  // Calculate total diff lines rendered
  let accumulatedLines = 0;
  const chunkPositions = chunks.map(chunk => {
    const startLine = accumulatedLines;
    const lineCount = Math.max(1, Math.max(chunk.leftLines.length, chunk.rightLines.length));
    accumulatedLines += lineCount;
    return {
      chunk,
      startLine,
      lineCount,
      hasDiff: chunk.type !== 'equal'
    };
  });

  const totalLines = Math.max(1, accumulatedLines);

  // Sync viewport indicator with scroll position
  useEffect(() => {
    const container = scrollContainerRef.current;
    if (!container) return;

    const updateViewport = () => {
      const { scrollTop, scrollHeight, clientHeight } = container;
      if (scrollHeight <= clientHeight) {
        setViewportTop(0);
        setViewportHeight(100);
        return;
      }
      const topPct = (scrollTop / scrollHeight) * 100;
      const heightPct = Math.max(8, (clientHeight / scrollHeight) * 100);
      setViewportTop(topPct);
      setViewportHeight(heightPct);
    };

    updateViewport();
    container.addEventListener('scroll', updateViewport, { passive: true });
    window.addEventListener('resize', updateViewport);

    return () => {
      container.removeEventListener('scroll', updateViewport);
      window.removeEventListener('resize', updateViewport);
    };
  }, [scrollContainerRef, chunks]);

  // Click on track to jump
  const handleTrackClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!trackRef.current || !scrollContainerRef.current) return;
    const rect = trackRef.current.getBoundingClientRect();
    const clickY = e.clientY - rect.top;
    const ratio = Math.max(0, Math.min(1, clickY / rect.height));

    const container = scrollContainerRef.current;
    container.scrollTo({
      top: ratio * container.scrollHeight - container.clientHeight / 2,
      behavior: 'smooth'
    });
  };

  const diffMarkers = chunkPositions.filter(cp => cp.hasDiff);

  return (
    <div 
      ref={trackRef}
      onClick={handleTrackClick}
      title="Marcadores de Mudança no Scroll - Clique para ir direto ao bloco alterado"
      className="w-4 bg-slate-950/90 hover:bg-slate-900 border-l border-slate-800/80 relative select-none cursor-pointer shrink-0 py-1 transition-colors group"
    >
      {/* Viewport Indicator */}
      <div
        className="absolute left-0 right-0 bg-blue-500/20 border-y border-blue-400/50 pointer-events-none rounded-xs z-10 transition-all duration-75"
        style={{
          top: `${viewportTop}%`,
          height: `${viewportHeight}%`
        }}
      />

      {/* Diff Change Markers / Points */}
      {diffMarkers.map(({ chunk, startLine, lineCount }) => {
        const topPct = (startLine / totalLines) * 100;
        const heightPct = Math.max(1.8, (lineCount / totalLines) * 100);
        const isActive = activeChunkId === chunk.id;

        let markerColor = 'bg-amber-500';
        let markerBorder = 'border-amber-400';
        let markerLabel = 'Modificação';

        if (chunk.type === 'delete') {
          markerColor = 'bg-rose-500';
          markerBorder = 'border-rose-400';
          markerLabel = `Exclusão (${chunk.leftLines.filter(l => l.type === 'deleted').length} linhas)`;
        } else if (chunk.type === 'add') {
          markerColor = 'bg-emerald-500';
          markerBorder = 'border-emerald-400';
          markerLabel = `Adição (${chunk.rightLines.filter(l => l.type === 'added').length} linhas)`;
        } else {
          markerLabel = `Modificação (L${chunk.leftStartLine} → L${chunk.rightStartLine})`;
        }

        return (
          <div
            key={chunk.id}
            onClick={(e) => {
              e.stopPropagation();
              onJumpToChunk(chunk);
            }}
            onMouseEnter={(e) => {
              const rect = trackRef.current?.getBoundingClientRect();
              setHoveredChunk({
                chunk,
                top: e.clientY - (rect?.top || 0)
              });
            }}
            onMouseLeave={() => setHoveredChunk(null)}
            style={{
              top: `${topPct}%`,
              height: `${heightPct}%`,
              minHeight: '5px'
            }}
            className={`absolute left-0.5 right-0.5 rounded-full transition-all cursor-pointer z-20 ${markerColor} ${
              isActive ? 'ring-2 ring-white scale-125 z-30 brightness-125' : 'hover:scale-125 hover:brightness-125'
            } shadow-xs`}
          />
        );
      })}

      {/* Hover Tooltip */}
      {hoveredChunk && (
        <div
          className="absolute right-6 bg-slate-900 border border-slate-700 text-slate-100 text-[10px] font-mono px-2 py-1 rounded shadow-xl whitespace-nowrap z-50 pointer-events-none"
          style={{
            top: `${Math.max(4, Math.min(hoveredChunk.top - 12, (trackRef.current?.clientHeight || 200) - 30))}px`
          }}
        >
          <div className="flex items-center gap-1.5 font-bold">
            <span
              className={`w-2 h-2 rounded-full ${
                hoveredChunk.chunk.type === 'delete'
                  ? 'bg-rose-500'
                  : hoveredChunk.chunk.type === 'add'
                    ? 'bg-emerald-500'
                    : 'bg-amber-500'
              }`}
            />
            <span>
              {hoveredChunk.chunk.type === 'delete'
                ? 'Exclusão'
                : hoveredChunk.chunk.type === 'add'
                  ? 'Adição'
                  : 'Modificação'}
            </span>
          </div>
          <div className="text-slate-400 text-[9px] mt-0.5">
            Lado A: L{hoveredChunk.chunk.leftStartLine} | Lado B: L{hoveredChunk.chunk.rightStartLine}
          </div>
        </div>
      )}
    </div>
  );
};
