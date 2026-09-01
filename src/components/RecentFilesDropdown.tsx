import React, { useState, useRef, useEffect, useMemo } from 'react';
import { 
  History, 
  FileText, 
  ArrowRightLeft, 
  Check, 
  Trash2, 
  Bookmark, 
  Clock, 
  FolderTree, 
  Copy, 
  ChevronDown, 
  Sparkles,
  RefreshCw,
  Folder,
  Search,
  X
} from 'lucide-react';
import { RecentFileRecord } from '../types';

interface RecentFilesDropdownProps {
  side: 'A' | 'B';
  currentFilename: string;
  currentContent: string;
  recentFiles: RecentFileRecord[];
  onSelectFile: (record: RecentFileRecord, side: 'A' | 'B') => void;
  onSaveCurrentFile: (filename: string, content: string, side: 'A' | 'B') => void;
  onRemoveRecord: (id: string) => void;
  onClearAllRecords: () => void;
}

export const RecentFilesDropdown: React.FC<RecentFilesDropdownProps> = ({
  side,
  currentFilename,
  currentContent,
  recentFiles,
  onSelectFile,
  onSaveCurrentFile,
  onRemoveRecord,
  onClearAllRecords
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [justSaved, setJustSaved] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);

  // Focus search input on open
  useEffect(() => {
    if (isOpen) {
      setTimeout(() => {
        searchInputRef.current?.focus();
      }, 50);
    } else {
      setSearchQuery('');
    }
  }, [isOpen]);

  // Filtered files by search query (matching filename, fullPath, or content)
  const filteredFiles = useMemo(() => {
    if (!searchQuery.trim()) return recentFiles;
    const q = searchQuery.toLowerCase().trim();
    return recentFiles.filter(file => {
      const matchName = file.filename.toLowerCase().includes(q);
      const matchPath = file.fullPath ? file.fullPath.toLowerCase().includes(q) : false;
      const matchContent = file.content.toLowerCase().includes(q);
      return matchName || matchPath || matchContent;
    });
  }, [recentFiles, searchQuery]);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isOpen]);

  const handleCopyPath = (e: React.MouseEvent, path: string, id: string) => {
    e.stopPropagation();
    navigator.clipboard.writeText(path);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const handleSaveCurrent = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!currentContent.trim() && !currentFilename.trim()) return;
    onSaveCurrentFile(currentFilename, currentContent, side);
    setJustSaved(true);
    setTimeout(() => setJustSaved(false), 2000);
  };

  const formatTimestamp = (ts: number) => {
    const date = new Date(ts);
    const now = Date.now();
    const diffSec = Math.floor((now - ts) / 1000);
    if (diffSec < 60) return 'agora há pouco';
    if (diffSec < 3600) return `há ${Math.floor(diffSec / 60)} min`;
    return new Intl.DateTimeFormat('pt-BR', {
      hour: '2-digit',
      minute: '2-digit',
      day: '2-digit',
      month: '2-digit'
    }).format(date);
  };

  const sideColor = side === 'A' ? 'rose' : 'emerald';
  const sideLabel = side === 'A' ? 'Lado A' : 'Lado B';

  // Extract previous file (most recent one different from current filename or content)
  const previousFile = recentFiles.find(
    f => f.filename !== currentFilename || f.content !== currentContent
  ) || recentFiles[0];

  return (
    <div className="relative inline-block" ref={dropdownRef}>
      {/* Trigger Button */}
      <button
        id={`btn-recent-files-${side.toLowerCase()}`}
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        title={`Arquivos gravados e substituição rápida para o ${sideLabel}`}
        className={`flex items-center gap-1 px-2 py-1 rounded text-xs transition-all border ${
          isOpen
            ? side === 'A'
              ? 'bg-rose-900/40 text-rose-300 border-rose-700/60'
              : 'bg-emerald-900/40 text-emerald-300 border-emerald-700/60'
            : 'bg-slate-850 hover:bg-slate-800 text-slate-300 border-slate-700 hover:text-slate-100'
        }`}
      >
        <History className={`w-3.5 h-3.5 ${side === 'A' ? 'text-rose-400' : 'text-emerald-400'}`} />
        <span className="hidden sm:inline font-medium">Substituir</span>
        {recentFiles.length > 0 && (
          <span className={`px-1.5 py-0.2 rounded-full text-[10px] font-bold ${
            side === 'A' ? 'bg-rose-500/30 text-rose-200' : 'bg-emerald-500/30 text-emerald-200'
          }`}>
            {recentFiles.length}
          </span>
        )}
        <ChevronDown className={`w-3 h-3 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
      </button>

      {/* Dropdown Menu */}
      {isOpen && (
        <div 
          id={`dropdown-recent-files-${side.toLowerCase()}`}
          className="absolute right-0 top-full mt-1.5 w-80 sm:w-96 md:w-[420px] bg-slate-900 border border-slate-700/80 rounded-xl shadow-2xl z-50 overflow-hidden backdrop-blur-md animate-fadeIn"
        >
          {/* Header */}
          <div className="p-3 bg-slate-950/80 border-b border-slate-800 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className={`p-1.5 rounded-lg ${side === 'A' ? 'bg-rose-500/20 text-rose-300' : 'bg-emerald-500/20 text-emerald-300'}`}>
                <FolderTree className="w-4 h-4" />
              </div>
              <div>
                <h4 className="font-semibold text-slate-200 text-xs">
                  Memória de Arquivos Anteriores
                </h4>
                <p className="text-[11px] text-slate-400">
                  Substitua ou restaure arquivos gravados no {sideLabel}
                </p>
              </div>
            </div>

            {/* Save Current Button */}
            <button
              onClick={handleSaveCurrent}
              title="Gravar versão e caminho do arquivo atual na memória rápida"
              className={`flex items-center gap-1 px-2 py-1 rounded text-[11px] font-medium border transition-colors ${
                justSaved
                  ? 'bg-emerald-600/30 text-emerald-300 border-emerald-500/50'
                  : 'bg-slate-800 hover:bg-slate-700 text-slate-200 border-slate-700'
              }`}
            >
              {justSaved ? (
                <>
                  <Check className="w-3 h-3 text-emerald-400" />
                  <span>Gravado!</span>
                </>
              ) : (
                <>
                  <Bookmark className="w-3 h-3 text-indigo-400" />
                  <span>Gravar Atual</span>
                </>
              )}
            </button>
          </div>

          {/* Search Box */}
          <div className="p-2.5 bg-slate-950/90 border-b border-slate-800 space-y-1.5">
            <div className="relative flex items-center">
              <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 pointer-events-none" />
              <input
                ref={searchInputRef}
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Pesquisar por caminho (ex: C:/Users/...) ou arquivo..."
                className="w-full bg-slate-900/90 border border-slate-750 hover:border-slate-600 focus:border-indigo-500 rounded-lg pl-8 pr-7 py-1.5 text-xs text-slate-200 placeholder:text-slate-500 focus:outline-hidden focus:ring-1 focus:ring-indigo-500 font-mono transition-all"
              />
              {searchQuery && (
                <button
                  type="button"
                  onClick={() => setSearchQuery('')}
                  className="absolute right-2 text-slate-400 hover:text-slate-200 p-0.5"
                  title="Limpar pesquisa"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>

            {searchQuery && (
              <div className="flex items-center justify-between text-[11px] px-1 text-slate-400">
                <span>
                  Resultados: <strong className="text-slate-200">{filteredFiles.length}</strong> de {recentFiles.length} arquivo(s)
                </span>
                <button
                  type="button"
                  onClick={() => setSearchQuery('')}
                  className="text-indigo-400 hover:text-indigo-300 font-medium"
                >
                  Limpar filtro
                </button>
              </div>
            )}
          </div>

          {/* Quick Substitute: Restore Immediate Previous File (only when no search active) */}
          {!searchQuery && previousFile && previousFile.filename !== currentFilename && (
            <div className="p-2.5 bg-indigo-950/30 border-b border-indigo-900/40 flex items-center justify-between gap-2">
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-1.5 text-[11px] font-semibold text-indigo-300">
                  <Sparkles className="w-3 h-3 text-indigo-400 shrink-0" />
                  <span>Arquivo Anterior:</span>
                </div>
                <div className="text-xs text-slate-200 font-mono truncate" title={previousFile.fullPath || previousFile.filename}>
                  {previousFile.fullPath || previousFile.filename}
                </div>
              </div>
              <button
                onClick={() => {
                  onSelectFile(previousFile, side);
                  setIsOpen(false);
                }}
                className={`px-2.5 py-1 rounded text-xs font-semibold shrink-0 shadow-xs border transition-colors ${
                  side === 'A'
                    ? 'bg-rose-600 hover:bg-rose-500 text-white border-rose-500'
                    : 'bg-emerald-600 hover:bg-emerald-500 text-white border-emerald-500'
                }`}
              >
                Substituir Agora
              </button>
            </div>
          )}

          {/* List of Recorded Files */}
          <div className="max-h-72 overflow-y-auto divide-y divide-slate-800/60 p-1">
            {filteredFiles.length === 0 ? (
              <div className="py-6 px-4 text-center text-slate-500 text-xs">
                {searchQuery ? (
                  <>
                    <Search className="w-6 h-6 mx-auto mb-2 text-slate-600 opacity-60" />
                    <p>Nenhum arquivo encontrado para &quot;{searchQuery}&quot;.</p>
                    <button
                      onClick={() => setSearchQuery('')}
                      className="text-[11px] text-indigo-400 hover:underline mt-1 block mx-auto"
                    >
                      Limpar filtro de pesquisa
                    </button>
                  </>
                ) : (
                  <>
                    <Clock className="w-6 h-6 mx-auto mb-2 text-slate-600 opacity-60" />
                    <p>Nenhum arquivo gravado ainda.</p>
                    <p className="text-[11px] text-slate-600 mt-1">
                      Ao importar ou carregar novos arquivos, os anteriores ficam gravados aqui automaticamente.
                    </p>
                  </>
                )}
              </div>
            ) : (
              filteredFiles.map((file) => {
                const isCurrent = (file.fullPath === currentFilename || file.filename === currentFilename) && file.content === currentContent;
                return (
                  <div
                    key={file.id}
                    className={`p-2.5 rounded-lg transition-colors group flex flex-col gap-1.5 ${
                      isCurrent
                        ? 'bg-slate-800/50 border border-slate-700/60'
                        : 'hover:bg-slate-800/60'
                    }`}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-1.5 flex-wrap">
                          <FileText className="w-3.5 h-3.5 text-blue-400 shrink-0" />
                          <span className="font-semibold text-slate-200 text-xs font-mono truncate">
                            {file.filename}
                          </span>
                          {isCurrent && (
                            <span className="px-1.5 py-0.2 rounded bg-blue-500/20 text-blue-300 text-[10px] border border-blue-500/30 font-medium">
                              Em uso
                            </span>
                          )}
                        </div>

                        {/* Full Path with Origin prefix and Folder icon */}
                        <div 
                          className="flex items-center gap-1.5 text-[11px] text-slate-300 font-mono mt-1 bg-slate-950/80 px-2 py-1 rounded border border-slate-800 truncate select-all"
                          title={`Caminho de origem: ${file.fullPath || file.filename}`}
                        >
                          <Folder className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                          <span className="text-slate-400 text-[10px] uppercase font-sans font-bold tracking-wider shrink-0">Origem:</span>
                          <span className="truncate text-slate-200">{file.fullPath || file.filename}</span>
                        </div>
                      </div>

                      {/* Delete item from history */}
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          onRemoveRecord(file.id);
                        }}
                        title="Remover este arquivo da memória"
                        className="opacity-0 group-hover:opacity-100 p-1 hover:bg-slate-700 rounded text-slate-400 hover:text-rose-400 transition-all"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>

                    {/* Meta info & Action buttons */}
                    <div className="flex items-center justify-between pt-1 border-t border-slate-800/40 text-[11px] text-slate-500">
                      <div className="flex items-center gap-2">
                        <span>{file.lineCount} linhas</span>
                        <span>•</span>
                        <span>{formatTimestamp(file.timestamp)}</span>
                      </div>

                      <div className="flex items-center gap-1.5">
                        {/* Copy Path */}
                        <button
                          type="button"
                          onClick={(e) => handleCopyPath(e, file.fullPath || file.filename, file.id)}
                          title="Copiar caminho completo deste arquivo"
                          className="p-1 rounded hover:bg-slate-700 text-slate-400 hover:text-slate-200"
                        >
                          {copiedId === file.id ? (
                            <Check className="w-3 h-3 text-emerald-400" />
                          ) : (
                            <Copy className="w-3 h-3" />
                          )}
                        </button>

                        {/* Apply to Side A */}
                        <button
                          type="button"
                          onClick={() => {
                            onSelectFile(file, 'A');
                            setIsOpen(false);
                          }}
                          className={`px-2 py-0.5 rounded text-[10px] font-semibold border transition-colors ${
                            side === 'A'
                              ? 'bg-rose-600/30 hover:bg-rose-600 text-rose-200 border-rose-500/40'
                              : 'bg-slate-800 hover:bg-slate-700 text-slate-300 border-slate-700'
                          }`}
                        >
                          P/ Lado A
                        </button>

                        {/* Apply to Side B */}
                        <button
                          type="button"
                          onClick={() => {
                            onSelectFile(file, 'B');
                            setIsOpen(false);
                          }}
                          className={`px-2 py-0.5 rounded text-[10px] font-semibold border transition-colors ${
                            side === 'B'
                              ? 'bg-emerald-600/30 hover:bg-emerald-600 text-emerald-200 border-emerald-500/40'
                              : 'bg-slate-800 hover:bg-slate-700 text-slate-300 border-slate-700'
                          }`}
                        >
                          P/ Lado B
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>

          {/* Footer Actions */}
          {recentFiles.length > 0 && (
            <div className="p-2 bg-slate-950 border-t border-slate-800 flex items-center justify-between text-[11px]">
              <span className="text-slate-500">
                Total: {recentFiles.length} arquivo(s) gravado(s)
              </span>
              <button
                type="button"
                onClick={onClearAllRecords}
                className="text-slate-500 hover:text-rose-400 transition-colors"
              >
                Limpar memória
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
