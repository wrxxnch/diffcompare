import React, { useRef, useEffect, useState } from 'react';
import { 
  ArrowRight, 
  ArrowLeft, 
  Upload, 
  Copy, 
  Check, 
  Edit3, 
  FileText, 
  Code2, 
  GitFork, 
  Repeat, 
  Layers,
  Link2,
  Unlink2
} from 'lucide-react';
import { DiffChunk, DiffLine, DiffSettings, SemanticCategory, RecentFileRecord } from '../types';
import { DiffMinimapTrack } from './DiffMinimapTrack';
import { FilePathViewer } from './FilePathViewer';
import { RecentFilesDropdown } from './RecentFilesDropdown';

interface DiffViewerProps {
  filenameA: string;
  setFilenameA: (name: string) => void;
  filenameB: string;
  setFilenameB: (name: string) => void;
  leftText: string;
  setLeftText: (text: string) => void;
  rightText: string;
  setRightText: (text: string) => void;
  chunks: DiffChunk[];
  settings: DiffSettings;
  setSettings?: React.Dispatch<React.SetStateAction<DiffSettings>>;
  onTransferChunk: (chunk: DiffChunk, direction: 'toRight' | 'toLeft') => void;
  selectedCategory: SemanticCategory;
  activeChunkIndex: number;
  recentFiles?: RecentFileRecord[];
  onSelectRecentFile?: (record: RecentFileRecord, side: 'A' | 'B') => void;
  onSaveCurrentFile?: (filename: string, content: string, side: 'A' | 'B') => void;
  onRemoveRecentFile?: (id: string) => void;
  onClearAllRecentFiles?: () => void;
}

export const DiffViewer: React.FC<DiffViewerProps> = ({
  filenameA,
  setFilenameA,
  filenameB,
  setFilenameB,
  leftText,
  setLeftText,
  rightText,
  setRightText,
  chunks,
  settings,
  setSettings,
  onTransferChunk,
  selectedCategory,
  activeChunkIndex,
  recentFiles = [],
  onSelectRecentFile,
  onSaveCurrentFile,
  onRemoveRecentFile,
  onClearAllRecentFiles
}) => {

  const [isEditingLeft, setIsEditingLeft] = useState(false);
  const [isEditingRight, setIsEditingRight] = useState(false);
  const [copiedLeft, setCopiedLeft] = useState(false);
  const [copiedRight, setCopiedRight] = useState(false);
  const [highlightedChunkId, setHighlightedChunkId] = useState<string | null>(null);

  const leftScrollRef = useRef<HTMLDivElement>(null);
  const rightScrollRef = useRef<HTMLDivElement>(null);
  const gutterScrollRef = useRef<HTMLDivElement>(null);

  const isSyncing = useRef(false);

  // Synchronized scrolling handler
  const handleScroll = (source: 'left' | 'right' | 'gutter') => {
    if (!settings.syncScroll || isSyncing.current) return;
    isSyncing.current = true;

    let targetScrollTop = 0;
    let targetScrollLeft = 0;

    if (source === 'left' && leftScrollRef.current) {
      targetScrollTop = leftScrollRef.current.scrollTop;
      targetScrollLeft = leftScrollRef.current.scrollLeft;
      if (rightScrollRef.current) rightScrollRef.current.scrollTop = targetScrollTop;
      if (gutterScrollRef.current) gutterScrollRef.current.scrollTop = targetScrollTop;
    } else if (source === 'right' && rightScrollRef.current) {
      targetScrollTop = rightScrollRef.current.scrollTop;
      targetScrollLeft = rightScrollRef.current.scrollLeft;
      if (leftScrollRef.current) leftScrollRef.current.scrollTop = targetScrollTop;
      if (gutterScrollRef.current) gutterScrollRef.current.scrollTop = targetScrollTop;
    }

    setTimeout(() => {
      isSyncing.current = false;
    }, 20);
  };

  // Toggle sync scroll and instantly re-align scroll positions
  const handleToggleSync = () => {
    if (!settings.syncScroll) {
      // Re-locking sync -> instantly align right and gutter to left position
      if (leftScrollRef.current && rightScrollRef.current) {
        rightScrollRef.current.scrollTop = leftScrollRef.current.scrollTop;
        if (gutterScrollRef.current) gutterScrollRef.current.scrollTop = leftScrollRef.current.scrollTop;
      }
    }
    if (setSettings) {
      setSettings(prev => ({ ...prev, syncScroll: !prev.syncScroll }));
    }
  };

  // Jump to specific diff chunk from scroll change points or navigation
  const handleJumpToChunk = (chunk: DiffChunk) => {
    setHighlightedChunkId(chunk.id);
    const targetElemLeft = document.getElementById(`chunk-left-${chunk.id}`);
    const targetElemRight = document.getElementById(`chunk-right-${chunk.id}`);

    if (targetElemLeft) {
      targetElemLeft.scrollIntoView({ behavior: 'smooth', block: 'center' });
    } else if (targetElemRight) {
      targetElemRight.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }

    setTimeout(() => {
      setHighlightedChunkId(null);
    }, 2000);
  };

  // Drag and Drop file upload handler with previous file auto-archive
  const handleDrop = (e: React.DragEvent, side: 'left' | 'right') => {
    e.preventDefault();
    const file = e.dataTransfer.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => {
        const content = event.target?.result as string;
        const targetPath = (file as any).webkitRelativePath || file.name;
        if (side === 'left') {
          if (leftText.trim() || filenameA.trim()) {
            onSaveCurrentFile?.(filenameA, leftText, 'A');
          }
          setLeftText(content);
          setFilenameA(targetPath);
        } else {
          if (rightText.trim() || filenameB.trim()) {
            onSaveCurrentFile?.(filenameB, rightText, 'B');
          }
          setRightText(content);
          setFilenameB(targetPath);
        }
      };
      reader.readAsText(file);
    }
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>, side: 'left' | 'right') => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => {
        const content = event.target?.result as string;
        const targetPath = (file as any).webkitRelativePath || file.name;
        if (side === 'left') {
          if (leftText.trim() || filenameA.trim()) {
            onSaveCurrentFile?.(filenameA, leftText, 'A');
          }
          setLeftText(content);
          setFilenameA(targetPath);
        } else {
          if (rightText.trim() || filenameB.trim()) {
            onSaveCurrentFile?.(filenameB, rightText, 'B');
          }
          setRightText(content);
          setFilenameB(targetPath);
        }
      };
      reader.readAsText(file);
      // Reset input value so re-selecting same file works
      e.target.value = '';
    }
  };

  const handleCopy = (text: string, side: 'left' | 'right') => {
    navigator.clipboard.writeText(text);
    if (side === 'left') {
      setCopiedLeft(true);
      setTimeout(() => setCopiedLeft(false), 2000);
    } else {
      setCopiedRight(true);
      setTimeout(() => setCopiedRight(false), 2000);
    }
  };

  // Render sub-line / character diff or full line with crisp contrast
  const renderLineContent = (line: DiffLine, sideType: 'left' | 'right') => {
    if (line.type === 'empty') {
      return <span className="text-transparent select-none">~</span>;
    }

    if (settings.showWordDiff && line.highlightParts && line.highlightParts.length > 0) {
      return (
        <span>
          {line.highlightParts.map((part, pIdx) => {
            if (!part.changed) {
              return <span key={pIdx} className="text-slate-200">{part.text}</span>;
            }
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

  const getSemanticBadge = (chunk: DiffChunk) => {
    if (chunk.semanticTypes.includes('function')) {
      return <span className="text-[10px] px-1 py-0.5 rounded bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 flex items-center gap-1 font-mono">⚡ fn</span>;
    }
    if (chunk.semanticTypes.includes('if')) {
      return <span className="text-[10px] px-1 py-0.5 rounded bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 flex items-center gap-1 font-mono">🔀 if</span>;
    }
    if (chunk.semanticTypes.includes('loop')) {
      return <span className="text-[10px] px-1 py-0.5 rounded bg-amber-500/20 text-amber-300 border border-amber-500/30 flex items-center gap-1 font-mono">🔁 loop</span>;
    }
    return null;
  };

  return (
    <div className="flex-1 flex flex-col bg-slate-950 overflow-hidden select-text">
      {/* Panes Header Bar */}
      <div className="grid grid-cols-[1fr_64px_1fr_16px] bg-slate-900/95 border-b border-slate-800 text-xs shrink-0 z-10">
        {/* Left Header (Arquivo A) */}
        <div className="flex items-center justify-between px-3 py-1.5 border-r border-slate-800/80 gap-2">
          <FilePathViewer
            idPrefix="file-a-path"
            side="left"
            fullPath={filenameA}
            onChangePath={setFilenameA}
            lineCount={leftText.split('\n').length}
          />

          <div className="flex items-center gap-1.5 shrink-0">
            {/* Quick Substitute / Saved Previous Files Dropdown */}
            {onSelectRecentFile && onSaveCurrentFile && onRemoveRecentFile && onClearAllRecentFiles && (
              <RecentFilesDropdown
                side="A"
                currentFilename={filenameA}
                currentContent={leftText}
                recentFiles={recentFiles}
                onSelectFile={onSelectRecentFile}
                onSaveCurrentFile={onSaveCurrentFile}
                onRemoveRecord={onRemoveRecentFile}
                onClearAllRecords={onClearAllRecentFiles}
              />
            )}

            {/* Upload File A */}
            <label 
              title="Carregar arquivo local para o Lado A (o arquivo anterior será gravado)"
              className="p-1 rounded hover:bg-slate-800 text-slate-400 hover:text-slate-200 cursor-pointer"
            >
              <Upload className="w-3.5 h-3.5 text-slate-400" />
              <input 
                type="file" 
                className="hidden" 
                onChange={(e) => handleFileUpload(e, 'left')} 
              />
            </label>

            {/* Copy Left */}
            <button
              onClick={() => handleCopy(leftText, 'left')}
              title="Copiar texto do Arquivo A"
              className="p-1 rounded hover:bg-slate-800 text-slate-400 hover:text-slate-200"
            >
              {copiedLeft ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
            </button>

            {/* Toggle Raw Edit Left */}
            <button
              onClick={() => setIsEditingLeft(!isEditingLeft)}
              title={isEditingLeft ? "Voltar ao visualizador" : "Editar texto livremente"}
              className={`p-1 rounded text-xs transition-colors ${
                isEditingLeft
                  ? 'bg-blue-600/30 text-blue-300 border border-blue-500/40'
                  : 'hover:bg-slate-800 text-slate-400 hover:text-slate-200'
              }`}
            >
              <Edit3 className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        {/* Center Gutter Header with Sync Scroll Lock Toggle */}
        <div className="flex items-center justify-center bg-slate-950 font-mono text-[10px] border-r border-slate-800/80">
          <button
            onClick={handleToggleSync}
            title={
              settings.syncScroll
                ? "Scrolls sincronizados (ambos rolam juntos). Clique para desbloquear e rolar individualmente."
                : "Scroll individual desbloqueado. Clique para sincronizar de volta!"
            }
            className={`p-1 rounded flex items-center justify-center gap-0.5 transition-all ${
              settings.syncScroll
                ? 'text-blue-400 hover:text-blue-300 hover:bg-blue-950/50'
                : 'text-amber-400 hover:text-amber-300 hover:bg-amber-950/50 animate-pulse'
            }`}
          >
            {settings.syncScroll ? (
              <Link2 className="w-3.5 h-3.5" />
            ) : (
              <Unlink2 className="w-3.5 h-3.5" />
            )}
          </button>
        </div>

        {/* Right Header (Arquivo B) */}
        <div className="flex items-center justify-between px-3 py-1.5 border-r border-slate-800/80 gap-2">
          <FilePathViewer
            idPrefix="file-b-path"
            side="right"
            fullPath={filenameB}
            onChangePath={setFilenameB}
            lineCount={rightText.split('\n').length}
          />

          <div className="flex items-center gap-1.5 shrink-0">
            {/* Quick Substitute / Saved Previous Files Dropdown */}
            {onSelectRecentFile && onSaveCurrentFile && onRemoveRecentFile && onClearAllRecentFiles && (
              <RecentFilesDropdown
                side="B"
                currentFilename={filenameB}
                currentContent={rightText}
                recentFiles={recentFiles}
                onSelectFile={onSelectRecentFile}
                onSaveCurrentFile={onSaveCurrentFile}
                onRemoveRecord={onRemoveRecentFile}
                onClearAllRecords={onClearAllRecentFiles}
              />
            )}

            {/* Upload File B */}
            <label 
              title="Carregar arquivo local para o Lado B (o arquivo anterior será gravado)"
              className="p-1 rounded hover:bg-slate-800 text-slate-400 hover:text-slate-200 cursor-pointer"
            >
              <Upload className="w-3.5 h-3.5 text-slate-400" />
              <input 
                type="file" 
                className="hidden" 
                onChange={(e) => handleFileUpload(e, 'right')} 
              />
            </label>

            {/* Copy Right */}
            <button
              onClick={() => handleCopy(rightText, 'right')}
              title="Copiar texto do Arquivo B"
              className="p-1 rounded hover:bg-slate-800 text-slate-400 hover:text-slate-200"
            >
              {copiedRight ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
            </button>

            {/* Toggle Raw Edit Right */}
            <button
              onClick={() => setIsEditingRight(!isEditingRight)}
              title={isEditingRight ? "Voltar ao visualizador" : "Editar texto livremente"}
              className={`p-1 rounded text-xs transition-colors ${
                isEditingRight
                  ? 'bg-blue-600/30 text-blue-300 border border-blue-500/40'
                  : 'hover:bg-slate-800 text-slate-400 hover:text-slate-200'
              }`}
            >
              <Edit3 className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        {/* Minimap Track Header */}
        <div className="bg-slate-950" title="Marcadores de Mudança" />
      </div>

      {/* Main Diff Content Area */}
      <div className="flex-1 grid grid-cols-[1fr_64px_1fr_16px] overflow-hidden">
        {/* LEFT PANE (Original / Arquivo A) */}
        <div 
          ref={leftScrollRef}
          onScroll={() => handleScroll('left')}
          onDragOver={(e) => e.preventDefault()}
          onDrop={(e) => handleDrop(e, 'left')}
          className="overflow-auto font-mono bg-slate-950 border-r border-slate-800/80 relative"
          style={{ fontSize: `${settings.fontSize}px` }}
        >
          {isEditingLeft ? (
            <textarea
              value={leftText}
              onChange={(e) => setLeftText(e.target.value)}
              placeholder="Cole ou digite o código do Arquivo A aqui..."
              className="w-full h-full p-4 bg-slate-950 text-slate-200 font-mono resize-none focus:outline-none leading-relaxed"
              spellCheck={false}
            />
          ) : (
            <div className="min-w-max py-2">
              {chunks.map((chunk, chunkIdx) => {
                const isFilteredOut = selectedCategory !== 'all' && 
                  chunk.type !== 'equal' && 
                  !chunk.semanticTypes.includes(selectedCategory);
                
                const isTargetHighlighted = highlightedChunkId === chunk.id;

                return (
                  <div 
                    key={chunk.id} 
                    id={`chunk-left-${chunk.id}`}
                    className={`transition-all duration-300 ${
                      isFilteredOut ? 'opacity-35' : ''
                    } ${
                      isTargetHighlighted ? 'ring-2 ring-blue-500 bg-blue-950/20' : ''
                    }`}
                  >
                    {chunk.leftLines.map((line, lineIdx) => (
                      <div
                        key={line.id || `l-${chunkIdx}-${lineIdx}`}
                        className={`flex items-stretch leading-relaxed ${
                          line.type === 'deleted'
                            ? 'bg-rose-950/20 text-slate-200 border-l-2 border-rose-500 hover:bg-rose-950/35'
                            : line.type === 'empty'
                              ? 'bg-slate-950/40 text-transparent select-none'
                              : 'bg-transparent text-slate-200 hover:bg-slate-900/40'
                        }`}
                      >
                        {/* Line Number Gutter */}
                        {settings.showLineNumbers && (
                          <div className={`w-12 shrink-0 px-2 text-right select-none text-xs flex items-center justify-end ${
                            line.type === 'deleted'
                              ? 'text-rose-400/80 bg-rose-950/30 border-r border-rose-900/40'
                              : line.type === 'empty'
                                ? 'text-transparent bg-slate-950/30 border-r border-slate-800/30'
                                : 'text-slate-500 bg-slate-950/80 border-r border-slate-800/50'
                          }`}>
                            {line.lineNumber ?? ''}
                          </div>
                        )}
                        {/* Sign Gutter */}
                        <div className="w-5 shrink-0 text-center select-none font-bold text-xs flex items-center justify-center">
                          {line.type === 'deleted' ? (
                            <span className="text-rose-400">-</span>
                          ) : (
                            <span className="text-transparent"> </span>
                          )}
                        </div>
                        {/* Code Line Content */}
                        <div className={`px-2 flex-1 whitespace-pre ${settings.wrapLines ? 'whitespace-pre-wrap break-all' : ''}`}>
                          {renderLineContent(line, 'left')}
                        </div>
                      </div>
                    ))}
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* CENTER GUTTER (Interactive Transfer Controls) */}
        <div 
          ref={gutterScrollRef}
          className="bg-slate-950 border-r border-slate-800/80 overflow-hidden flex flex-col select-none py-2"
        >
          {chunks.map((chunk) => {
            const hasDiff = chunk.type !== 'equal';
            const isFilteredOut = selectedCategory !== 'all' && 
              hasDiff && 
              !chunk.semanticTypes.includes(selectedCategory);

            return (
              <div
                key={chunk.id}
                style={{
                  minHeight: `${Math.max(1, chunk.leftLines.length) * (settings.fontSize * 1.625)}px`
                }}
                className={`flex flex-col items-center justify-center gap-1 border-b border-transparent ${
                  hasDiff ? 'bg-slate-900/40 hover:bg-slate-900/90' : ''
                } ${isFilteredOut ? 'opacity-30' : ''}`}
              >
                {hasDiff && (
                  <>
                    {/* Transfer Left -> Right */}
                    {(chunk.type === 'delete' || chunk.type === 'modify') && (
                      <button
                        onClick={() => onTransferChunk(chunk, 'toRight')}
                        title="Transferir este bloco da Esquerda para a Direita"
                        className="p-1 rounded-md bg-emerald-600/30 hover:bg-emerald-600 text-emerald-300 hover:text-white border border-emerald-500/40 shadow-sm transition-all transform hover:scale-110"
                      >
                        <ArrowRight className="w-3.5 h-3.5" />
                      </button>
                    )}

                    {/* Semantic Tag Badge */}
                    {getSemanticBadge(chunk)}

                    {/* Transfer Right -> Left */}
                    {(chunk.type === 'add' || chunk.type === 'modify') && (
                      <button
                        onClick={() => onTransferChunk(chunk, 'toLeft')}
                        title="Transferir este bloco da Direita para a Esquerda"
                        className="p-1 rounded-md bg-rose-600/30 hover:bg-rose-600 text-rose-300 hover:text-white border border-rose-500/40 shadow-sm transition-all transform hover:scale-110"
                      >
                        <ArrowLeft className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </>
                )}
              </div>
            );
          })}
        </div>

        {/* RIGHT PANE (Modified / Arquivo B) */}
        <div 
          ref={rightScrollRef}
          onScroll={() => handleScroll('right')}
          onDragOver={(e) => e.preventDefault()}
          onDrop={(e) => handleDrop(e, 'right')}
          className="overflow-auto font-mono bg-slate-950 relative border-r border-slate-800/80"
          style={{ fontSize: `${settings.fontSize}px` }}
        >
          {isEditingRight ? (
            <textarea
              value={rightText}
              onChange={(e) => setRightText(e.target.value)}
              placeholder="Cole ou digite o código do Arquivo B aqui..."
              className="w-full h-full p-4 bg-slate-950 text-slate-200 font-mono resize-none focus:outline-none leading-relaxed"
              spellCheck={false}
            />
          ) : (
            <div className="min-w-max py-2">
              {chunks.map((chunk, chunkIdx) => {
                const isFilteredOut = selectedCategory !== 'all' && 
                  chunk.type !== 'equal' && 
                  !chunk.semanticTypes.includes(selectedCategory);
                
                const isTargetHighlighted = highlightedChunkId === chunk.id;

                return (
                  <div 
                    key={chunk.id} 
                    id={`chunk-right-${chunk.id}`}
                    className={`transition-all duration-300 ${
                      isFilteredOut ? 'opacity-35' : ''
                    } ${
                      isTargetHighlighted ? 'ring-2 ring-blue-500 bg-blue-950/20' : ''
                    }`}
                  >
                    {chunk.rightLines.map((line, lineIdx) => (
                      <div
                        key={line.id || `r-${chunkIdx}-${lineIdx}`}
                        className={`flex items-stretch leading-relaxed ${
                          line.type === 'added'
                            ? 'bg-emerald-950/20 text-slate-200 border-l-2 border-emerald-500 hover:bg-emerald-950/35'
                            : line.type === 'empty'
                              ? 'bg-slate-950/40 text-transparent select-none'
                              : 'bg-transparent text-slate-200 hover:bg-slate-900/40'
                        }`}
                      >
                        {/* Line Number Gutter */}
                        {settings.showLineNumbers && (
                          <div className={`w-12 shrink-0 px-2 text-right select-none text-xs flex items-center justify-end ${
                            line.type === 'added'
                              ? 'text-emerald-400/80 bg-emerald-950/30 border-r border-emerald-900/40'
                              : line.type === 'empty'
                                ? 'text-transparent bg-slate-950/30 border-r border-slate-800/30'
                                : 'text-slate-500 bg-slate-950/80 border-r border-slate-800/50'
                          }`}>
                            {line.lineNumber ?? ''}
                          </div>
                        )}
                        {/* Sign Gutter */}
                        <div className="w-5 shrink-0 text-center select-none font-bold text-xs flex items-center justify-center">
                          {line.type === 'added' ? (
                            <span className="text-emerald-400">+</span>
                          ) : (
                            <span className="text-transparent"> </span>
                          )}
                        </div>
                        {/* Code Line Content */}
                        <div className={`px-2 flex-1 whitespace-pre ${settings.wrapLines ? 'whitespace-pre-wrap break-all' : ''}`}>
                          {renderLineContent(line, 'right')}
                        </div>
                      </div>
                    ))}
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Change Points Minimap / Scroll Marker Track */}
        <DiffMinimapTrack
          chunks={chunks}
          scrollContainerRef={leftScrollRef}
          onJumpToChunk={handleJumpToChunk}
          activeChunkId={highlightedChunkId || undefined}
        />
      </div>
    </div>
  );
};

