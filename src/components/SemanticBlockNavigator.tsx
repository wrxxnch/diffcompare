import React from 'react';
import { 
  Code2, 
  GitFork, 
  Repeat, 
  Layers, 
  X, 
  AlertCircle, 
  CheckCircle2,
  ChevronRight
} from 'lucide-react';
import { SemanticBlock, SemanticCategory } from '../types';

interface SemanticBlockNavigatorProps {
  blocks: SemanticBlock[];
  selectedCategory: SemanticCategory;
  onSelectCategory: (cat: SemanticCategory) => void;
  onJumpToBlock: (block: SemanticBlock) => void;
  onClose: () => void;
}

export const SemanticBlockNavigator: React.FC<SemanticBlockNavigatorProps> = ({
  blocks,
  selectedCategory,
  onSelectCategory,
  onJumpToBlock,
  onClose
}) => {
  const filteredBlocks = selectedCategory === 'all'
    ? blocks
    : blocks.filter(b => b.category === selectedCategory);

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case 'function':
        return <Code2 className="w-3.5 h-3.5 text-indigo-400" />;
      case 'if':
        return <GitFork className="w-3.5 h-3.5 text-emerald-400" />;
      case 'loop':
        return <Repeat className="w-3.5 h-3.5 text-amber-400" />;
      default:
        return <Layers className="w-3.5 h-3.5 text-blue-400" />;
    }
  };

  const getCategoryLabel = (category: string) => {
    switch (category) {
      case 'function': return 'Função';
      case 'if': return 'Condicional';
      case 'loop': return 'Iteração';
      default: return 'Bloco';
    }
  };

  return (
    <div className="w-72 bg-slate-900 border-r border-slate-800 flex flex-col h-full shrink-0 animate-in slide-in-from-left duration-200">
      {/* Header */}
      <div className="p-3 border-b border-slate-800 flex items-center justify-between bg-slate-950/60">
        <div className="flex items-center gap-2">
          <Layers className="w-4 h-4 text-blue-400" />
          <h3 className="text-xs font-semibold text-slate-200">
            Estrutura Semântica
          </h3>
        </div>
        <button
          onClick={onClose}
          className="p-1 text-slate-400 hover:text-white rounded hover:bg-slate-800"
        >
          <X className="w-3.5 h-3.5" />
        </button>
      </div>

      {/* Stats Summary */}
      <div className="px-3 py-2 border-b border-slate-800/80 bg-slate-950/30 text-[11px] text-slate-400 flex items-center justify-between">
        <span>{blocks.length} blocos detectados</span>
        <span className="text-amber-400 font-medium">
          {blocks.filter(b => b.hasDiff).length} com alterações
        </span>
      </div>

      {/* Block List */}
      <div className="flex-1 overflow-y-auto p-2 space-y-1">
        {filteredBlocks.length === 0 ? (
          <div className="text-center py-8 text-xs text-slate-500">
            Nenhum bloco encontrado nesta categoria.
          </div>
        ) : (
          filteredBlocks.map((block) => (
            <button
              key={block.id}
              onClick={() => onJumpToBlock(block)}
              className={`w-full text-left p-2 rounded-lg border transition-all flex items-start justify-between gap-2 group ${
                block.hasDiff
                  ? 'bg-slate-800/60 hover:bg-slate-800 border-amber-500/30 hover:border-amber-500/50'
                  : 'bg-slate-950/40 hover:bg-slate-800/40 border-slate-800/60 text-slate-400'
              }`}
            >
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-1.5 mb-1">
                  {getCategoryIcon(block.category)}
                  <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider">
                    {getCategoryLabel(block.category)}
                  </span>
                  <span className="text-[10px] text-slate-500 font-mono">
                    L{block.startLine}-{block.endLine}
                  </span>
                </div>
                <div className="font-mono text-xs text-slate-200 truncate group-hover:text-white font-medium">
                  {block.name}
                </div>
              </div>

              <div className="shrink-0 flex items-center gap-1 mt-1">
                {block.hasDiff ? (
                  <span className="px-1.5 py-0.5 rounded text-[10px] font-semibold bg-amber-500/20 text-amber-300 border border-amber-500/30">
                    Diff
                  </span>
                ) : (
                  <CheckCircle2 className="w-3.5 h-3.5 text-slate-600" />
                )}
                <ChevronRight className="w-3 h-3 text-slate-500 group-hover:translate-x-0.5 transition-transform" />
              </div>
            </button>
          ))
        )}
      </div>
    </div>
  );
};
