import React from 'react';
import { 
  ArrowRightLeft, 
  ArrowRight, 
  ArrowLeft, 
  Trash2, 
  Download, 
  Sparkles, 
  Eye, 
  EyeOff, 
  CaseUpper, 
  Check, 
  RotateCcw,
  Copy,
  Link2,
  Unlink2,
  Undo2,
  Redo2,
  History,
  GitCompare
} from 'lucide-react';
import { DiffSettings, DiffSummary } from '../types';

interface ToolbarProps {
  filenameA: string;
  filenameB: string;
  settings: DiffSettings;
  setSettings: React.Dispatch<React.SetStateAction<DiffSettings>>;
  summary: DiffSummary;
  onApplyAllLeftToRight: () => void;
  onApplyAllRightToLeft: () => void;
  onSwapSides: () => void;
  onResetToOriginal: () => void;
  onClear: () => void;
  onDownloadA: () => void;
  onDownloadB: () => void;
  onCopyMerged: () => void;
  onOpenImportModal?: () => void;
  onToggleSyncScroll?: () => void;
  onUndo?: () => void;
  onRedo?: () => void;
  canUndo?: boolean;
  canRedo?: boolean;
  onOpenHistory?: () => void;
  historyCount?: number;
}

export const Toolbar: React.FC<ToolbarProps> = ({
  filenameA,
  filenameB,
  settings,
  setSettings,
  summary,
  onApplyAllLeftToRight,
  onApplyAllRightToLeft,
  onSwapSides,
  onResetToOriginal,
  onClear,
  onDownloadA,
  onDownloadB,
  onCopyMerged,
  onOpenImportModal,
  onToggleSyncScroll,
  onUndo,
  onRedo,
  canUndo = false,
  canRedo = false,
  onOpenHistory,
  historyCount = 1
}) => {
  const handleToggleSync = () => {
    if (onToggleSyncScroll) {
      onToggleSyncScroll();
    } else {
      setSettings(prev => ({ ...prev, syncScroll: !prev.syncScroll }));
    }
  };
  return (
    <div className="bg-slate-900 border-b border-slate-800 px-4 py-2 flex flex-wrap items-center justify-between gap-2.5 text-xs">
      {/* Left Group: Transfer Actions & Undo/Redo */}
      <div className="flex flex-wrap items-center gap-1.5">
        {/* Undo Button */}
        {onUndo && (
          <button
            id="btn-undo"
            onClick={onUndo}
            disabled={!canUndo}
            title="Desfazer alteração (Ctrl+Z)"
            className="flex items-center gap-1 px-2 py-1 rounded bg-slate-800 hover:bg-slate-700 disabled:opacity-40 disabled:cursor-not-allowed text-slate-200 border border-slate-700 transition-colors"
          >
            <Undo2 className="w-3.5 h-3.5 text-blue-400" />
            <span className="hidden sm:inline">Desfazer</span>
          </button>
        )}

        {/* Redo Button */}
        {onRedo && (
          <button
            id="btn-redo"
            onClick={onRedo}
            disabled={!canRedo}
            title="Refazer alteração (Ctrl+Y / Ctrl+Shift+Z)"
            className="flex items-center gap-1 px-2 py-1 rounded bg-slate-800 hover:bg-slate-700 disabled:opacity-40 disabled:cursor-not-allowed text-slate-200 border border-slate-700 transition-colors"
          >
            <Redo2 className="w-3.5 h-3.5 text-emerald-400" />
            <span className="hidden sm:inline">Refazer</span>
          </button>
        )}

        {/* History Timeline Button */}
        {onOpenHistory && (
          <button
            id="btn-history-timeline"
            onClick={onOpenHistory}
            title="Abrir histórico de alterações e revisões"
            className="flex items-center gap-1 px-2 py-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 transition-colors mr-1"
          >
            <History className="w-3.5 h-3.5 text-purple-400" />
            <span className="hidden md:inline">Histórico</span>
            {historyCount > 1 && (
              <span className="px-1.5 py-0.2 rounded-full bg-purple-500/20 text-purple-300 text-[10px] font-bold border border-purple-400/30">
                {historyCount}
              </span>
            )}
          </button>
        )}

        <div className="h-4 w-px bg-slate-800 mx-0.5 hidden sm:block" />

        <span className="text-slate-500 font-semibold uppercase text-[10px] tracking-wider mr-1 hidden sm:inline">
          Mesclar:
        </span>
        
        {/* All Left -> Right */}
        <button
          id="btn-apply-all-l-to-r"
          onClick={onApplyAllLeftToRight}
          disabled={summary.identical}
          title="Copiar todas as diferenças do Arquivo A para o Arquivo B"
          className="flex items-center gap-1.5 px-2.5 py-1 rounded bg-blue-600/20 hover:bg-blue-600/30 text-blue-300 border border-blue-500/30 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
        >
          <span>Todos A</span>
          <ArrowRight className="w-3.5 h-3.5 text-blue-400" />
          <span>B</span>
        </button>

        {/* All Right -> Left */}
        <button
          id="btn-apply-all-r-to-l"
          onClick={onApplyAllRightToLeft}
          disabled={summary.identical}
          title="Copiar todas as diferenças do Arquivo B para o Arquivo A"
          className="flex items-center gap-1.5 px-2.5 py-1 rounded bg-purple-600/20 hover:bg-purple-600/30 text-purple-300 border border-purple-500/30 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
        >
          <span>A</span>
          <ArrowLeft className="w-3.5 h-3.5 text-purple-400" />
          <span>Todos B</span>
        </button>

        <div className="h-4 w-px bg-slate-800 mx-1 hidden sm:block" />

        {/* Swap Sides */}
        <button
          id="btn-swap-sides"
          onClick={onSwapSides}
          title="Inverter lados (Arquivo A vira B e B vira A)"
          className="flex items-center gap-1 px-2 py-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 transition-colors"
        >
          <ArrowRightLeft className="w-3.5 h-3.5 text-slate-400" />
          <span className="hidden md:inline">Inverter Lados</span>
        </button>

        {/* Reset */}
        <button
          id="btn-reset"
          onClick={onResetToOriginal}
          title="Reverter alterações para o original carregado"
          className="flex items-center gap-1 px-2 py-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 transition-colors"
        >
          <RotateCcw className="w-3.5 h-3.5 text-slate-400" />
          <span className="hidden md:inline">Restaurar</span>
        </button>

        {/* Open Import Modal */}
        {onOpenImportModal && (
          <button
            id="btn-toolbar-import"
            onClick={onOpenImportModal}
            title="Importar arquivos locais, URLs ou Git (GitHub / Codeberg)"
            className="flex items-center gap-1 px-2 py-1 rounded bg-blue-950/40 hover:bg-blue-900/60 text-blue-300 border border-blue-800/50 transition-colors"
          >
            <Sparkles className="w-3.5 h-3.5 text-blue-400" />
            <span className="hidden lg:inline">Importar Fonte</span>
          </button>
        )}

        {/* Clear */}
        <button
          id="btn-clear-all"
          onClick={onClear}
          title="Limpar o conteúdo de ambos os arquivos"
          className="flex items-center gap-1 px-2 py-1 rounded bg-rose-950/30 hover:bg-rose-900/50 text-rose-300 border border-rose-800/40 transition-colors"
        >
          <Trash2 className="w-3.5 h-3.5 text-rose-400" />
          <span className="hidden md:inline">Limpar</span>
        </button>
      </div>

      {/* Right Group: Filters, Settings toggles & Downloads */}
      <div className="flex flex-wrap items-center gap-1.5">
        {/* Toggle Sync Scroll */}
        <button
          id="toggle-sync-scroll"
          onClick={handleToggleSync}
          title={
            settings.syncScroll
              ? "Scrolls sincronizados (ambos rolam juntos). Clique para desbloquear e rolar individualmente."
              : "Scroll individual desbloqueado. Clique para bloquear e sincronizar de volta!"
          }
          className={`flex items-center gap-1.5 px-2.5 py-1 rounded border font-medium transition-all ${
            settings.syncScroll
              ? 'bg-blue-600/20 text-blue-300 border-blue-500/40 shadow-xs'
              : 'bg-amber-950/40 text-amber-300 border-amber-800/60 hover:bg-amber-900/50'
          }`}
        >
          {settings.syncScroll ? (
            <>
              <Link2 className="w-3.5 h-3.5 text-blue-400" />
              <span>Scroll Sincronizado</span>
            </>
          ) : (
            <>
              <Unlink2 className="w-3.5 h-3.5 text-amber-400" />
              <span>Scroll Livre</span>
            </>
          )}
        </button>

        {/* Toggle Compare Iterations */}
        <button
          id="toggle-compare-iterations"
          onClick={() => setSettings(prev => ({ ...prev, compareIterations: !prev.compareIterations }))}
          title={
            settings.compareIterations
              ? "Modo Comparar Iteração ATIVADO. Clique para desativar e voltar aos arquivos normais."
              : "Comparar Iterações do Histórico (Passo a Passo / Versões salvas). Padrão desativado."
          }
          className={`flex items-center gap-1.5 px-2.5 py-1 rounded border font-medium transition-all ${
            settings.compareIterations
              ? 'bg-indigo-600/30 text-indigo-300 border-indigo-500/50 shadow-xs'
              : 'bg-slate-800 text-slate-400 border-slate-700 hover:text-slate-200'
          }`}
        >
          <GitCompare className={`w-3.5 h-3.5 ${settings.compareIterations ? 'text-indigo-400' : 'text-slate-400'}`} />
          <span>Iterações</span>
          {settings.compareIterations && (
            <span className="px-1 py-0.2 rounded bg-indigo-500/30 text-indigo-200 text-[10px] font-bold">
              ON
            </span>
          )}
        </button>

        {/* Toggle Ignore Whitespace */}
        <button
          id="toggle-whitespace"
          onClick={() => setSettings(prev => ({ ...prev, ignoreWhitespace: !prev.ignoreWhitespace }))}
          title={settings.ignoreWhitespace ? "Ignorando espaços em branco" : "Considerando espaços em branco"}
          className={`flex items-center gap-1 px-2 py-1 rounded border transition-colors ${
            settings.ignoreWhitespace
              ? 'bg-amber-500/20 text-amber-300 border-amber-500/40'
              : 'bg-slate-800 text-slate-400 border-slate-700 hover:text-slate-200'
          }`}
        >
          {settings.ignoreWhitespace ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
          <span>Espaços</span>
        </button>

        {/* Toggle Ignore Case */}
        <button
          id="toggle-case"
          onClick={() => setSettings(prev => ({ ...prev, ignoreCase: !prev.ignoreCase }))}
          title={settings.ignoreCase ? "Ignorando maiúsculas/minúsculas" : "Diferenciando maiúsculas/minúsculas"}
          className={`flex items-center gap-1 px-2 py-1 rounded border transition-colors ${
            settings.ignoreCase
              ? 'bg-amber-500/20 text-amber-300 border-amber-500/40'
              : 'bg-slate-800 text-slate-400 border-slate-700 hover:text-slate-200'
          }`}
        >
          <CaseUpper className="w-3.5 h-3.5" />
          <span>Case</span>
        </button>

        <div className="h-4 w-px bg-slate-800 mx-1" />

        {/* Download A */}
        <button
          id="btn-download-a"
          onClick={onDownloadA}
          title={`Baixar ${filenameA}`}
          className="flex items-center gap-1 px-2 py-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 transition-colors"
        >
          <Download className="w-3.5 h-3.5 text-blue-400" />
          <span>Baixar A</span>
        </button>

        {/* Download B */}
        <button
          id="btn-download-b"
          onClick={onDownloadB}
          title={`Baixar ${filenameB}`}
          className="flex items-center gap-1 px-2 py-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 transition-colors"
        >
          <Download className="w-3.5 h-3.5 text-emerald-400" />
          <span>Baixar B</span>
        </button>
      </div>
    </div>
  );
};
