import React, { useRef, useState } from 'react';
import { ArrowRight, ArrowLeft } from 'lucide-react';
import { DiffChunk, DiffLine, DiffSettings, SemanticCategory } from '../types';
import { DiffMinimapTrack } from './DiffMinimapTrack';

interface UnifiedDiffViewerProps {
  chunks: DiffChunk[];
  settings: DiffSettings;
  onTransferChunk: (chunk: DiffChunk, direction: 'toRight' | 'toLeft') => void;
  selectedCategory: SemanticCategory;
}

export const UnifiedDiffViewer: React.FC<UnifiedDiffViewerProps> = ({
  chunks,
  settings,
  onTransferChunk,
  selectedCategory
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [highlightedChunkId, setHighlightedChunkId] = useState<string | null>(null);

  const handleJumpToChunk = (chunk: DiffChunk) => {
    setHighlightedChunkId(chunk.id);
    const target = document.getElementById(`unified-chunk-${chunk.id}`);
    if (target) {
      target.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }
    setTimeout(() => {
      setHighlightedChunkId(null);
    }, 2000);
  };

  const renderLineContent = (line: DiffLine, sideType: 'left' | 'right') => {
    if (settings.showWordDiff && line.highlightParts && line.highlightParts.length > 0) {
      return (
        <span>
          {line.highlightParts.map((part, pIdx) => {
            if (!part.changed) return <span key={pIdx} className="text-slate-200">{part.text}</span>;
            return (
              <mark
                key={pIdx}
                className={`font-semibold rounded-xs px-1 py-0.5 ${
                  sideType === 'left'
                    ? 'bg-rose-500/35 text-rose-100 border border-rose-400/40 shadow-xs'
                    : 'bg-emerald-500/35 text-emerald-100 border border-emerald-400/40 shadow-xs'
                }`}
              >
                {part.text}
              </mark>
            );
          })}
        </span>
      );
    }
    return <span className="text-slate-200">{line.content || ' '}</span>;
  };

  return (
    <div className="flex-1 flex overflow-hidden bg-slate-950">
      <div 
        ref={containerRef}
        className="flex-1 overflow-auto font-mono bg-slate-950 p-4"
        style={{ fontSize: `${settings.fontSize}px` }}
      >
        <div className="max-w-5xl mx-auto border border-slate-800 rounded-xl overflow-hidden shadow-2xl bg-slate-950">
          {chunks.map((chunk) => {
            const isFilteredOut = selectedCategory !== 'all' && 
              chunk.type !== 'equal' && 
              !chunk.semanticTypes.includes(selectedCategory);

            const isTargetHighlighted = highlightedChunkId === chunk.id;

            if (chunk.type === 'equal') {
              return (
                <div key={chunk.id} id={`unified-chunk-${chunk.id}`} className="divide-y divide-slate-900/60">
                  {chunk.leftLines.map((line, idx) => (
                    <div key={idx} className="flex items-stretch text-slate-200 hover:bg-slate-900/50 leading-relaxed bg-transparent">
                      <div className="w-12 px-2 text-right text-slate-500 bg-slate-950/80 border-r border-slate-800/60 select-none text-xs flex items-center justify-end">
                        {line.lineNumber}
                      </div>
                      <div className="w-12 px-2 text-right text-slate-500 bg-slate-950/80 border-r border-slate-800/60 select-none text-xs flex items-center justify-end">
                        {chunk.rightLines[idx]?.lineNumber}
                      </div>
                      <div className="w-6 text-center text-transparent select-none text-xs flex items-center justify-center">
                        {' '}
                      </div>
                      <div className="px-3 flex-1 whitespace-pre">{line.content}</div>
                    </div>
                  ))}
                </div>
              );
            }

            // Chunk with diff
            return (
              <div 
                key={chunk.id} 
                id={`unified-chunk-${chunk.id}`}
                className={`border-y border-slate-800/80 my-1 transition-all duration-300 ${
                  isFilteredOut ? 'opacity-30' : ''
                } ${
                  isTargetHighlighted ? 'ring-2 ring-blue-500 bg-blue-950/20' : ''
                }`}
              >
                {/* Chunk Header with Transfer Tools */}
                <div className="bg-slate-900/90 px-4 py-1.5 flex items-center justify-between text-xs font-mono text-slate-400 border-b border-slate-800">
                  <div className="flex items-center gap-2">
                    <span className="text-blue-400 font-semibold">
                      @@ -{chunk.leftStartLine},{chunk.leftLines.filter(l => l.type !== 'empty').length} +{chunk.rightStartLine},{chunk.rightLines.filter(l => l.type !== 'empty').length} @@
                    </span>
                    {chunk.semanticLabels.length > 0 && (
                      <span className="px-2 py-0.5 rounded bg-slate-800 text-slate-300 text-[10px]">
                        {chunk.semanticLabels[0]}
                      </span>
                    )}
                  </div>

                  <div className="flex items-center gap-2">
                    {(chunk.type === 'delete' || chunk.type === 'modify') && (
                      <button
                        onClick={() => onTransferChunk(chunk, 'toRight')}
                        className="flex items-center gap-1 px-2 py-0.5 rounded bg-emerald-600/30 hover:bg-emerald-600 text-emerald-200 text-[11px] border border-emerald-500/40 transition-colors"
                      >
                        <span>Mandar p/ B</span>
                        <ArrowRight className="w-3 h-3" />
                      </button>
                    )}
                    {(chunk.type === 'add' || chunk.type === 'modify') && (
                      <button
                        onClick={() => onTransferChunk(chunk, 'toLeft')}
                        className="flex items-center gap-1 px-2 py-0.5 rounded bg-rose-600/30 hover:bg-rose-600 text-rose-200 text-[11px] border border-rose-500/40 transition-colors"
                      >
                        <ArrowLeft className="w-3 h-3" />
                        <span>Mandar p/ A</span>
                      </button>
                    )}
                  </div>
                </div>

                {/* Deleted Lines */}
                {chunk.leftLines.filter(l => l.type === 'deleted').map((line, idx) => (
                  <div key={`del-${idx}`} className="flex items-stretch bg-rose-950/20 text-slate-200 hover:bg-rose-950/35 leading-relaxed border-l-2 border-rose-500">
                    <div className="w-12 px-2 text-right text-rose-400/80 bg-rose-950/30 border-r border-rose-900/40 select-none text-xs flex items-center justify-end">
                      {line.lineNumber}
                    </div>
                    <div className="w-12 px-2 text-right text-transparent bg-rose-950/30 border-r border-rose-900/40 select-none text-xs flex items-center justify-end">
                      -
                    </div>
                    <div className="w-6 text-center text-rose-400 font-bold select-none text-xs flex items-center justify-center">
                      -
                    </div>
                    <div className="px-3 flex-1 whitespace-pre">
                      {renderLineContent(line, 'left')}
                    </div>
                  </div>
                ))}

                {/* Added Lines */}
                {chunk.rightLines.filter(l => l.type === 'added').map((line, idx) => (
                  <div key={`add-${idx}`} className="flex items-stretch bg-emerald-950/20 text-slate-200 hover:bg-emerald-950/35 leading-relaxed border-l-2 border-emerald-500">
                    <div className="w-12 px-2 text-right text-transparent bg-emerald-950/30 border-r border-emerald-900/40 select-none text-xs flex items-center justify-end">
                      +
                    </div>
                    <div className="w-12 px-2 text-right text-emerald-400/80 bg-emerald-950/30 border-r border-emerald-900/40 select-none text-xs flex items-center justify-end">
                      {line.lineNumber}
                    </div>
                    <div className="w-6 text-center text-emerald-400 font-bold select-none text-xs flex items-center justify-center">
                      +
                    </div>
                    <div className="px-3 flex-1 whitespace-pre">
                      {renderLineContent(line, 'right')}
                    </div>
                  </div>
                ))}
              </div>
            );
          })}
        </div>
      </div>

      {/* Change points minimap track */}
      <DiffMinimapTrack
        chunks={chunks}
        scrollContainerRef={containerRef}
        onJumpToChunk={handleJumpToChunk}
        activeChunkId={highlightedChunkId || undefined}
      />
    </div>
  );
};

