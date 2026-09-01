import React from 'react';
import { 
  Code2, 
  GitFork, 
  Repeat, 
  Layers, 
  ChevronUp, 
  ChevronDown, 
  ArrowRight, 
  ArrowLeft,
  ListTree,
  Filter
} from 'lucide-react';
import { SemanticCategory, DiffChunk } from '../types';

interface SemanticFilterBarProps {
  selectedCategory: SemanticCategory;
  onSelectCategory: (category: SemanticCategory) => void;
  chunks: DiffChunk[];
  activeChunkIndex: number;
  onNavigateChunk: (direction: 'prev' | 'next') => void;
  onTransferActiveChunk: (direction: 'toRight' | 'toLeft') => void;
  showOutline: boolean;
  onToggleOutline: () => void;
  counts: {
    all: number;
    function: number;
    if: number;
    loop: number;
    block: number;
  };
}

export const SemanticFilterBar: React.FC<SemanticFilterBarProps> = ({
  selectedCategory,
  onSelectCategory,
  chunks,
  activeChunkIndex,
  onNavigateChunk,
  onTransferActiveChunk,
  showOutline,
  onToggleOutline,
  counts
}) => {
  const diffChunks = chunks.filter(c => c.type !== 'equal');
  const filteredDiffChunks = selectedCategory === 'all'
    ? diffChunks
    : diffChunks.filter(c => c.semanticTypes.includes(selectedCategory));

  const totalFiltered = filteredDiffChunks.length;
  const currentChunk = filteredDiffChunks[activeChunkIndex];

  return (
    <div className="bg-slate-950/80 border-b border-slate-800/80 px-4 py-2 flex flex-wrap items-center justify-between gap-3 text-xs">
      {/* Category Pills */}
      <div className="flex flex-wrap items-center gap-1.5">
        <span className="flex items-center gap-1 text-slate-400 font-semibold text-[11px] mr-1">
          <Filter className="w-3.5 h-3.5 text-blue-400" />
          <span>Filtrar Comparação:</span>
        </span>

        {/* All */}
        <button
          id="filter-all"
          onClick={() => onSelectCategory('all')}
          className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full font-medium transition-all ${
            selectedCategory === 'all'
              ? 'bg-blue-600 text-white shadow-sm'
              : 'bg-slate-900 text-slate-400 hover:text-slate-200 border border-slate-800'
          }`}
        >
          <Layers className="w-3 h-3" />
          <span>Todos os Blocos</span>
          <span className="ml-0.5 text-[10px] px-1.5 py-0.2 rounded-full bg-slate-950/50 text-slate-300 font-mono">
            {counts.all}
          </span>
        </button>

        {/* Functions */}
        <button
          id="filter-function"
          onClick={() => onSelectCategory('function')}
          className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full font-medium transition-all ${
            selectedCategory === 'function'
              ? 'bg-indigo-600 text-white shadow-sm'
              : 'bg-slate-900 text-slate-400 hover:text-slate-200 border border-slate-800'
          }`}
        >
          <Code2 className="w-3 h-3 text-indigo-400" />
          <span>Funções (functions / def)</span>
          <span className="ml-0.5 text-[10px] px-1.5 py-0.2 rounded-full bg-slate-950/50 text-slate-300 font-mono">
            {counts.function}
          </span>
        </button>

        {/* If Conditionals */}
        <button
          id="filter-if"
          onClick={() => onSelectCategory('if')}
          className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full font-medium transition-all ${
            selectedCategory === 'if'
              ? 'bg-emerald-600 text-white shadow-sm'
              : 'bg-slate-900 text-slate-400 hover:text-slate-200 border border-slate-800'
          }`}
        >
          <GitFork className="w-3 h-3 text-emerald-400" />
          <span>Condicionais (if / else)</span>
          <span className="ml-0.5 text-[10px] px-1.5 py-0.2 rounded-full bg-slate-950/50 text-slate-300 font-mono">
            {counts.if}
          </span>
        </button>

        {/* Loops & Iterations */}
        <button
          id="filter-loop"
          onClick={() => onSelectCategory('loop')}
          className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full font-medium transition-all ${
            selectedCategory === 'loop'
              ? 'bg-amber-600 text-white shadow-sm'
              : 'bg-slate-900 text-slate-400 hover:text-slate-200 border border-slate-800'
          }`}
        >
          <Repeat className="w-3 h-3 text-amber-400" />
          <span>Iterações (for / while / map)</span>
          <span className="ml-0.5 text-[10px] px-1.5 py-0.2 rounded-full bg-slate-950/50 text-slate-300 font-mono">
            {counts.loop}
          </span>
        </button>
      </div>

      {/* Stepper / Bloco a Bloco Navigator */}
      <div className="flex items-center gap-2">
        {/* Toggle Structure Outline Drawer */}
        <button
          id="btn-toggle-outline"
          onClick={onToggleOutline}
          title="Ver mapa de blocos, funções e condicionais no código"
          className={`flex items-center gap-1.5 px-2 py-1 rounded border transition-colors ${
            showOutline
              ? 'bg-blue-600/30 text-blue-300 border-blue-500/40'
              : 'bg-slate-900 text-slate-400 border-slate-800 hover:text-slate-200'
          }`}
        >
          <ListTree className="w-3.5 h-3.5 text-blue-400" />
          <span className="hidden sm:inline">Mapa de Blocos</span>
        </button>

        <div className="h-4 w-px bg-slate-800" />

        {/* Stepper */}
        <div className="flex items-center bg-slate-900 border border-slate-800 rounded-lg p-0.5">
          <button
            id="btn-prev-chunk"
            onClick={() => onNavigateChunk('prev')}
            disabled={totalFiltered === 0 || activeChunkIndex <= 0}
            title="Diferença Anterior (Alt + ↑)"
            className="p-1 text-slate-400 hover:text-white disabled:opacity-30 disabled:cursor-not-allowed rounded"
          >
            <ChevronUp className="w-4 h-4" />
          </button>

          <span className="px-2 font-mono text-[11px] text-slate-300">
            {totalFiltered > 0 ? (
              <>
                <span className="text-white font-semibold">{activeChunkIndex + 1}</span>
                <span className="text-slate-500"> / {totalFiltered}</span>
              </>
            ) : (
              <span className="text-slate-500">0 / 0</span>
            )}
          </span>

          <button
            id="btn-next-chunk"
            onClick={() => onNavigateChunk('next')}
            disabled={totalFiltered === 0 || activeChunkIndex >= totalFiltered - 1}
            title="Próxima Diferença (Alt + ↓)"
            className="p-1 text-slate-400 hover:text-white disabled:opacity-30 disabled:cursor-not-allowed rounded"
          >
            <ChevronDown className="w-4 h-4" />
          </button>
        </div>

        {/* Transfer active chunk buttons */}
        {totalFiltered > 0 && currentChunk && (
          <div className="flex items-center gap-1">
            <button
              id="btn-transfer-active-to-r"
              onClick={() => onTransferActiveChunk('toRight')}
              title="Mandar bloco selecionado para o Arquivo B (Direita)"
              className="flex items-center gap-1 px-2 py-1 bg-emerald-600/20 hover:bg-emerald-600/30 text-emerald-300 border border-emerald-500/30 rounded text-[11px] font-medium transition-colors"
            >
              <span>Mandar bloco</span>
              <ArrowRight className="w-3 h-3 text-emerald-400" />
            </button>
            <button
              id="btn-transfer-active-to-l"
              onClick={() => onTransferActiveChunk('toLeft')}
              title="Mandar bloco selecionado para o Arquivo A (Esquerda)"
              className="flex items-center gap-1 px-2 py-1 bg-indigo-600/20 hover:bg-indigo-600/30 text-indigo-300 border border-indigo-500/30 rounded text-[11px] font-medium transition-colors"
            >
              <ArrowLeft className="w-3 h-3 text-indigo-400" />
              <span className="hidden sm:inline">Mandar</span>
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
