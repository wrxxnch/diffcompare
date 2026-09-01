/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useMemo, useEffect, useCallback, useRef } from 'react';
import confetti from 'canvas-confetti';
import { 
  ActiveTabMode, 
  DiffSettings, 
  SemanticCategory, 
  FileItem, 
  DiffChunk,
  SemanticBlock,
  RevisionSnapshot,
  RecentFileRecord
} from './types';
import { SAMPLE_PRESETS, SAMPLE_FOLDER_FILES } from './utils/sampleData';
import { 
  computeDiff, 
  transferChunkToRight, 
  transferChunkToLeft,
  generateUnifiedPatch 
} from './utils/diffEngine';
import { Header } from './components/Header';
import { Toolbar } from './components/Toolbar';
import { SemanticFilterBar } from './components/SemanticFilterBar';
import { SemanticBlockNavigator } from './components/SemanticBlockNavigator';
import { DiffViewer } from './components/DiffViewer';
import { UnifiedDiffViewer } from './components/UnifiedDiffViewer';
import { FolderComparator } from './components/FolderComparator';
import { SettingsModal } from './components/SettingsModal';
import { ImportSourceModal } from './components/ImportSourceModal';
import { HistoryDrawer } from './components/HistoryDrawer';
import { IterationComparatorBar } from './components/IterationComparatorBar';

export default function App() {
  // Mode selection
  const [activeTab, setActiveTab] = useState<ActiveTabMode>('single');

  // Single file states
  const [filenameA, setFilenameA] = useState('C:/Users/JeanPierre/Projetos/sistema-pedidos/src/services/orders/processOrder.v1.ts');
  const [filenameB, setFilenameB] = useState('C:/Users/JeanPierre/Projetos/sistema-pedidos/src/services/orders/processOrder.v2.ts');
  const [leftText, setLeftText] = useState(SAMPLE_PRESETS[0].left);
  const [rightText, setRightText] = useState(SAMPLE_PRESETS[0].right);
  const [initialLeft, setInitialLeft] = useState(SAMPLE_PRESETS[0].left);
  const [initialRight, setInitialRight] = useState(SAMPLE_PRESETS[0].right);

  // Revision History & Undo/Redo states
  const [history, setHistory] = useState<RevisionSnapshot[]>([
    {
      id: 'init-0',
      timestamp: Date.now(),
      title: 'Carga Inicial',
      description: 'Arquivos padrão carregados para comparação',
      leftText: SAMPLE_PRESETS[0].left,
      rightText: SAMPLE_PRESETS[0].right,
      filenameA: 'C:/Users/JeanPierre/Projetos/sistema-pedidos/src/services/orders/processOrder.v1.ts',
      filenameB: 'C:/Users/JeanPierre/Projetos/sistema-pedidos/src/services/orders/processOrder.v2.ts',
      summary: { additions: 3, deletions: 2, modifications: 4 },
      type: 'init'
    }
  ]);
  const [historyIndex, setHistoryIndex] = useState(0);
  const [isHistoryDrawerOpen, setIsHistoryDrawerOpen] = useState(false);

  // Recent / Saved files history for quick re-use and substitution
  const [recentFiles, setRecentFiles] = useState<RecentFileRecord[]>(() => {
    try {
      const saved = localStorage.getItem('diffstudio_recent_files');
      if (saved) return JSON.parse(saved);
    } catch (e) {
      // fallback
    }
    return [
      {
        id: 'recent-default-1',
        filename: 'processOrder.v1.ts',
        fullPath: 'C:/Users/JeanPierre/Projetos/sistema-pedidos/src/services/orders/processOrder.v1.ts',
        content: SAMPLE_PRESETS[0].left,
        timestamp: Date.now() - 3600000,
        lineCount: SAMPLE_PRESETS[0].left.split('\n').length,
        lastUsedSide: 'A'
      },
      {
        id: 'recent-default-2',
        filename: 'processOrder.v2.ts',
        fullPath: 'C:/Users/JeanPierre/Projetos/sistema-pedidos/src/services/orders/processOrder.v2.ts',
        content: SAMPLE_PRESETS[0].right,
        timestamp: Date.now() - 1800000,
        lineCount: SAMPLE_PRESETS[0].right.split('\n').length,
        lastUsedSide: 'B'
      },
      {
        id: 'recent-default-3',
        filename: 'data_pipeline_old.py',
        fullPath: 'C:/Users/JeanPierre/Projetos/analytics-pipeline/scripts/data_pipeline_old.py',
        content: SAMPLE_PRESETS[1].left,
        timestamp: Date.now() - 7200000,
        lineCount: SAMPLE_PRESETS[1].left.split('\n').length,
        lastUsedSide: 'A'
      },
      {
        id: 'recent-default-4',
        filename: 'data_pipeline_new.py',
        fullPath: 'C:/Users/JeanPierre/Projetos/analytics-pipeline/scripts/data_pipeline_new.py',
        content: SAMPLE_PRESETS[1].right,
        timestamp: Date.now() - 7100000,
        lineCount: SAMPLE_PRESETS[1].right.split('\n').length,
        lastUsedSide: 'B'
      }
    ];
  });

  // Sync recentFiles to localStorage
  useEffect(() => {
    try {
      localStorage.setItem('diffstudio_recent_files', JSON.stringify(recentFiles));
    } catch (e) {
      // quota fallback
    }
  }, [recentFiles]);

  const handleSaveFileRecord = useCallback((file: { filename: string; fullPath?: string; content: string; lastUsedSide?: 'A' | 'B' }) => {
    setRecentFiles(prev => {
      const pathToCheck = file.fullPath || file.filename;
      const existingIdx = prev.findIndex(
        f => (f.fullPath === pathToCheck || f.filename === file.filename) && f.content === file.content
      );
      if (existingIdx >= 0) {
        const updated = [...prev];
        updated[existingIdx] = {
          ...updated[existingIdx],
          timestamp: Date.now(),
          lastUsedSide: file.lastUsedSide || updated[existingIdx].lastUsedSide
        };
        return updated;
      }
      const newRecord: RecentFileRecord = {
        id: `file-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`,
        filename: file.filename,
        fullPath: file.fullPath || file.filename,
        content: file.content,
        timestamp: Date.now(),
        lineCount: file.content.split('\n').length,
        lastUsedSide: file.lastUsedSide
      };
      return [newRecord, ...prev].slice(0, 40);
    });
  }, []);

  const handleClearRecentFiles = useCallback(() => {
    setRecentFiles([]);
  }, []);

  const handleRemoveRecentFile = useCallback((id: string) => {
    setRecentFiles(prev => prev.filter(f => f.id !== id));
  }, []);

  // Iteration comparison indices (for comparing step-by-step history revisions)
  const [iterationAIndex, setIterationAIndex] = useState(0);
  const [iterationBIndex, setIterationBIndex] = useState(0);

  // Folder & Multi-file states
  const [folderFiles, setFolderFiles] = useState<FileItem[]>(SAMPLE_FOLDER_FILES);
  const [selectedFileId, setSelectedFileId] = useState<string | null>(null);

  // Semantic & Diff Filter states
  const [selectedCategory, setSelectedCategory] = useState<SemanticCategory>('all');
  const [activeChunkIndex, setActiveChunkIndex] = useState(0);
  const [showOutline, setShowOutline] = useState(false);

  // Settings state (compareIterations defaults to false)
  const [settings, setSettings] = useState<DiffSettings>({
    ignoreWhitespace: false,
    ignoreCase: false,
    viewMode: 'split',
    fontSize: 13,
    wrapLines: false,
    theme: 'dark',
    syncScroll: true,
    showLineNumbers: true,
    showWordDiff: true,
    showMinimap: true,
    compareIterations: false
  });
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isImportModalOpen, setIsImportModalOpen] = useState(false);

  // Effective texts and filenames (switches when compareIterations is active)
  const effectiveLeftText = useMemo(() => {
    if (settings.compareIterations && history[iterationAIndex]) {
      return history[iterationAIndex].leftText;
    }
    return leftText;
  }, [settings.compareIterations, history, iterationAIndex, leftText]);

  const effectiveRightText = useMemo(() => {
    if (settings.compareIterations && history[iterationBIndex]) {
      return history[iterationBIndex].rightText;
    }
    return rightText;
  }, [settings.compareIterations, history, iterationBIndex, rightText]);

  const effectiveFilenameA = useMemo(() => {
    if (settings.compareIterations && history[iterationAIndex]) {
      return `Iteração #${iterationAIndex + 1}: ${history[iterationAIndex].title}`;
    }
    return filenameA;
  }, [settings.compareIterations, history, iterationAIndex, filenameA]);

  const effectiveFilenameB = useMemo(() => {
    if (settings.compareIterations && history[iterationBIndex]) {
      return `Iteração #${iterationBIndex + 1}: ${history[iterationBIndex].title}`;
    }
    return filenameB;
  }, [settings.compareIterations, history, iterationBIndex, filenameB]);

  // Calculate live diff
  const { chunks, summary, semanticBlocks } = useMemo(() => {
    return computeDiff(effectiveLeftText, effectiveRightText, settings);
  }, [effectiveLeftText, effectiveRightText, settings]);

  // Calculate counts per category
  const counts = useMemo(() => {
    const diffChunks = chunks.filter(c => c.type !== 'equal');
    return {
      all: diffChunks.length,
      function: diffChunks.filter(c => c.semanticTypes.includes('function')).length,
      if: diffChunks.filter(c => c.semanticTypes.includes('if')).length,
      loop: diffChunks.filter(c => c.semanticTypes.includes('loop')).length,
      block: diffChunks.filter(c => c.semanticTypes.includes('block')).length
    };
  }, [chunks]);

  // Filtered diff chunks
  const filteredDiffChunks = useMemo(() => {
    const diffChunks = chunks.filter(c => c.type !== 'equal');
    if (selectedCategory === 'all') return diffChunks;
    return diffChunks.filter(c => c.semanticTypes.includes(selectedCategory));
  }, [chunks, selectedCategory]);

  // Adjust activeChunkIndex when filtered list changes
  useEffect(() => {
    if (activeChunkIndex >= filteredDiffChunks.length && filteredDiffChunks.length > 0) {
      setActiveChunkIndex(filteredDiffChunks.length - 1);
    }
  }, [filteredDiffChunks.length, activeChunkIndex]);

  // Push a new revision snapshot into history stack
  const pushRevisionSnapshot = useCallback((
    newLeft: string,
    newRight: string,
    title: string,
    type: RevisionSnapshot['type'],
    description?: string,
    customFilenameA?: string,
    customFilenameB?: string
  ) => {
    const fA = customFilenameA ?? filenameA;
    const fB = customFilenameB ?? filenameB;
    const computed = computeDiff(newLeft, newRight, settings);
    const snapshot: RevisionSnapshot = {
      id: `${Date.now()}-${Math.random().toString(36).substr(2, 6)}`,
      timestamp: Date.now(),
      title,
      description,
      leftText: newLeft,
      rightText: newRight,
      filenameA: fA,
      filenameB: fB,
      summary: {
        additions: computed.summary.additions,
        deletions: computed.summary.deletions,
        modifications: computed.summary.modifications,
      },
      type
    };

    setHistory(prev => {
      const valid = prev.slice(0, historyIndex + 1);
      const updated = [...valid, snapshot];
      if (updated.length > 50) {
        return updated.slice(updated.length - 50);
      }
      return updated;
    });
    setHistoryIndex(prev => prev + 1);
  }, [filenameA, filenameB, settings, historyIndex]);

  const handleSelectRecentFile = useCallback((record: RecentFileRecord, side: 'A' | 'B') => {
    if (side === 'A') {
      // Save current file A before replacing
      if (filenameA.trim() || leftText.trim()) {
        handleSaveFileRecord({
          filename: filenameA.split('/').pop() || filenameA,
          fullPath: filenameA,
          content: leftText,
          lastUsedSide: 'A'
        });
      }
      setFilenameA(record.fullPath || record.filename);
      setLeftText(record.content);
      pushRevisionSnapshot(
        record.content,
        rightText,
        `Substituído Arquivo A: ${record.filename}`,
        'replace_file',
        `Arquivo A substituído por ${record.fullPath || record.filename}`,
        record.fullPath || record.filename,
        filenameB
      );
    } else {
      // Save current file B before replacing
      if (filenameB.trim() || rightText.trim()) {
        handleSaveFileRecord({
          filename: filenameB.split('/').pop() || filenameB,
          fullPath: filenameB,
          content: rightText,
          lastUsedSide: 'B'
        });
      }
      setFilenameB(record.fullPath || record.filename);
      setRightText(record.content);
      pushRevisionSnapshot(
        leftText,
        record.content,
        `Substituído Arquivo B: ${record.filename}`,
        'replace_file',
        `Arquivo B substituído por ${record.fullPath || record.filename}`,
        filenameA,
        record.fullPath || record.filename
      );
    }
  }, [filenameA, filenameB, leftText, rightText, handleSaveFileRecord, pushRevisionSnapshot]);

  // Debounced text edits when typing directly in editor panels
  const typingDebounceTimer = useRef<NodeJS.Timeout | null>(null);

  const handleUserEditLeft = (val: string) => {
    setLeftText(val);
    if (typingDebounceTimer.current) clearTimeout(typingDebounceTimer.current);
    typingDebounceTimer.current = setTimeout(() => {
      pushRevisionSnapshot(val, rightText, 'Edição no Arquivo A', 'edit', 'Modificação direta de texto no painel A');
    }, 850);
  };

  const handleUserEditRight = (val: string) => {
    setRightText(val);
    if (typingDebounceTimer.current) clearTimeout(typingDebounceTimer.current);
    typingDebounceTimer.current = setTimeout(() => {
      pushRevisionSnapshot(leftText, val, 'Edição no Arquivo B', 'edit', 'Modificação direta de texto no painel B');
    }, 850);
  };

  // Undo / Redo operations
  const canUndo = historyIndex > 0;
  const canRedo = historyIndex < history.length - 1;

  const handleUndo = useCallback(() => {
    if (historyIndex > 0) {
      const targetIdx = historyIndex - 1;
      const snap = history[targetIdx];
      if (snap) {
        setLeftText(snap.leftText);
        setRightText(snap.rightText);
        setFilenameA(snap.filenameA);
        setFilenameB(snap.filenameB);
        setHistoryIndex(targetIdx);
      }
    }
  }, [historyIndex, history]);

  const handleRedo = useCallback(() => {
    if (historyIndex < history.length - 1) {
      const targetIdx = historyIndex + 1;
      const snap = history[targetIdx];
      if (snap) {
        setLeftText(snap.leftText);
        setRightText(snap.rightText);
        setFilenameA(snap.filenameA);
        setFilenameB(snap.filenameB);
        setHistoryIndex(targetIdx);
      }
    }
  }, [historyIndex, history]);

  const handleRevertToSnapshot = useCallback((targetIdx: number) => {
    const snap = history[targetIdx];
    if (snap) {
      setLeftText(snap.leftText);
      setRightText(snap.rightText);
      setFilenameA(snap.filenameA);
      setFilenameB(snap.filenameB);
      setHistoryIndex(targetIdx);
    }
  }, [history]);

  const handleClearHistory = useCallback(() => {
    const currentSnap = history[historyIndex] || {
      id: 'current',
      timestamp: Date.now(),
      title: 'Estado Atual',
      leftText,
      rightText,
      filenameA,
      filenameB,
      summary: {
        additions: summary.additions,
        deletions: summary.deletions,
        modifications: summary.modifications
      },
      type: 'init' as const
    };
    setHistory([currentSnap]);
    setHistoryIndex(0);
  }, [history, historyIndex, leftText, rightText, filenameA, filenameB, summary]);

  // Load Preset
  const handleLoadPreset = (presetId: string) => {
    const preset = SAMPLE_PRESETS.find(p => p.id === presetId);
    if (preset) {
      setFilenameA(preset.fileA);
      setFilenameB(preset.fileB);
      setLeftText(preset.left);
      setRightText(preset.right);
      setInitialLeft(preset.left);
      setInitialRight(preset.right);
      setActiveChunkIndex(0);
      pushRevisionSnapshot(
        preset.left, 
        preset.right, 
        `Exemplo: ${preset.name}`, 
        'preset', 
        'Carregamento de preset de demonstração',
        preset.fileA,
        preset.fileB
      );
    }
  };

  // Transfer Single Chunk
  const handleTransferChunk = (chunk: DiffChunk, direction: 'toRight' | 'toLeft') => {
    if (direction === 'toRight') {
      const newRight = transferChunkToRight(leftText, rightText, chunk);
      setRightText(newRight);
      pushRevisionSnapshot(
        leftText, 
        newRight, 
        `Transferência A → B (L${chunk.leftStartLine})`, 
        'transfer', 
        `Transferido bloco do Arquivo A para B (linhas ${chunk.leftStartLine}-${chunk.leftEndLine})`
      );
    } else {
      const newLeft = transferChunkToLeft(leftText, rightText, chunk);
      setLeftText(newLeft);
      pushRevisionSnapshot(
        newLeft, 
        rightText, 
        `Transferência B → A (L${chunk.rightStartLine})`, 
        'transfer', 
        `Transferido bloco do Arquivo B para A (linhas ${chunk.rightStartLine}-${chunk.rightEndLine})`
      );
    }
  };

  // Transfer Active Chunk
  const handleTransferActiveChunk = (direction: 'toRight' | 'toLeft') => {
    const chunk = filteredDiffChunks[activeChunkIndex];
    if (chunk) {
      handleTransferChunk(chunk, direction);
    }
  };

  // Navigate Chunks
  const handleNavigateChunk = (direction: 'prev' | 'next') => {
    if (direction === 'prev') {
      setActiveChunkIndex(prev => Math.max(0, prev - 1));
    } else {
      setActiveChunkIndex(prev => Math.min(filteredDiffChunks.length - 1, prev + 1));
    }
  };

  // Global Keyboard shortcuts: Undo (Ctrl+Z), Redo (Ctrl+Y, Ctrl+Shift+Z), History (Ctrl+H), Navigation (Alt+Up/Down)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const isModifier = e.ctrlKey || e.metaKey;

      if (isModifier && (e.key === 'z' || e.key === 'Z')) {
        e.preventDefault();
        if (e.shiftKey) {
          handleRedo();
        } else {
          handleUndo();
        }
        return;
      }

      if (isModifier && (e.key === 'y' || e.key === 'Y')) {
        e.preventDefault();
        handleRedo();
        return;
      }

      if (isModifier && (e.key === 'h' || e.key === 'H')) {
        e.preventDefault();
        setIsHistoryDrawerOpen(prev => !prev);
        return;
      }

      if (e.altKey && e.key === 'ArrowDown') {
        e.preventDefault();
        handleNavigateChunk('next');
      } else if (e.altKey && e.key === 'ArrowUp') {
        e.preventDefault();
        handleNavigateChunk('prev');
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleUndo, handleRedo, filteredDiffChunks.length]);

  // Apply all Left -> Right
  const handleApplyAllLeftToRight = () => {
    setRightText(leftText);
    pushRevisionSnapshot(leftText, leftText, 'Aplicar Tudo: A → B', 'apply_all', 'Todas as alterações do Arquivo A copiadas para o Arquivo B');
    confetti({ particleCount: 60, spread: 70, origin: { y: 0.6 } });
  };

  // Apply all Right -> Left
  const handleApplyAllRightToLeft = () => {
    setLeftText(rightText);
    pushRevisionSnapshot(rightText, rightText, 'Aplicar Tudo: B → A', 'apply_all', 'Todas as alterações do Arquivo B copiadas para o Arquivo A');
    confetti({ particleCount: 60, spread: 70, origin: { y: 0.6 } });
  };

  // Swap Sides
  const handleSwapSides = () => {
    const tempText = leftText;
    const tempName = filenameA;
    setLeftText(rightText);
    setFilenameA(filenameB);
    setRightText(tempText);
    setFilenameB(tempName);
    pushRevisionSnapshot(rightText, tempText, 'Inverter Lados (Swap)', 'swap', 'Arquivo A invertido com Arquivo B', filenameB, tempName);
  };

  // Reset to original loaded text
  const handleResetToOriginal = () => {
    setLeftText(initialLeft);
    setRightText(initialRight);
    pushRevisionSnapshot(initialLeft, initialRight, 'Restaurar Original', 'reset', 'Revertido para o estado inicial');
  };

  // Clear all
  const handleClear = () => {
    setLeftText('');
    setRightText('');
    pushRevisionSnapshot('', '', 'Limpar Tudo', 'clear', 'Ambos os arquivos foram esvaziados');
  };

  // Download files
  const downloadFile = (filename: string, content: string) => {
    const blob = new Blob([content], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename || 'arquivo.txt';
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleDownloadA = () => downloadFile(filenameA, leftText);
  const handleDownloadB = () => downloadFile(filenameB, rightText);

  // Export Unified Patch
  const handleExportPatch = () => {
    const patch = generateUnifiedPatch(filenameA, filenameB, leftText, rightText);
    downloadFile(`diff-${filenameA}-${filenameB}.patch`, patch);
  };

  // Open file from folder comparator into single diff editor
  const handleOpenDiffForFile = (file: FileItem) => {
    setSelectedFileId(file.id);
    const nameA = `A/${file.path}`;
    const nameB = `B/${file.path}`;
    setFilenameA(nameA);
    setFilenameB(nameB);
    setLeftText(file.leftContent);
    setRightText(file.rightContent);
    setInitialLeft(file.leftContent);
    setInitialRight(file.rightContent);
    setActiveTab('single');
    pushRevisionSnapshot(file.leftContent, file.rightContent, `Pasta: ${file.name}`, 'import', `Arquivo aberto: ${file.path}`, nameA, nameB);
  };

  // Apply single file diff from Import Modal (Local files, URLs, GitHub, Codeberg)
  const handleApplySingleDiffFromImport = (
    nameA: string,
    contentA: string,
    nameB: string,
    contentB: string
  ) => {
    setFilenameA(nameA);
    setFilenameB(nameB);
    setLeftText(contentA);
    setRightText(contentB);
    setInitialLeft(contentA);
    setInitialRight(contentB);
    setActiveChunkIndex(0);
    setActiveTab('single');
    pushRevisionSnapshot(contentA, contentB, `Importado: ${nameA} / ${nameB}`, 'import', 'Arquivos importados com sucesso', nameA, nameB);

    // Save both imported files into recent history library
    handleSaveFileRecord({
      filename: nameA.split('/').pop() || nameA,
      fullPath: nameA,
      content: contentA,
      lastUsedSide: 'A'
    });
    handleSaveFileRecord({
      filename: nameB.split('/').pop() || nameB,
      fullPath: nameB,
      content: contentB,
      lastUsedSide: 'B'
    });
  };

  // Apply folder / multi-file tree from Import Modal (ZIP, GitHub repo, Codeberg repo)
  const handleApplyFolderDiffFromImport = (files: FileItem[]) => {
    setFolderFiles(files);
    if (files.length > 0) {
      setSelectedFileId(files[0].id);
    }
    setActiveTab('multi');
  };

  // Jump to semantic block in editor
  const handleJumpToBlock = (block: SemanticBlock) => {
    const chunkId = block.chunkIds[0];
    if (chunkId) {
      const el = document.getElementById(`chunk-left-${chunkId}`) || document.getElementById(`chunk-right-${chunkId}`);
      if (el) {
        el.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }
    }
  };

  // Stepper handlers for Iteration Comparator
  const handleStepPrevIteration = () => {
    if (iterationBIndex > 0) {
      const newB = iterationBIndex - 1;
      setIterationBIndex(newB);
      setIterationAIndex(Math.max(0, newB - 1));
    }
  };

  const handleStepNextIteration = () => {
    if (iterationBIndex < history.length - 1) {
      const newB = iterationBIndex + 1;
      setIterationBIndex(newB);
      setIterationAIndex(newB - 1);
    }
  };

  const handleStepCompareLatest = () => {
    setIterationAIndex(Math.max(0, history.length - 2));
    setIterationBIndex(history.length - 1);
  };

  const handleSwapIterations = () => {
    const temp = iterationAIndex;
    setIterationAIndex(iterationBIndex);
    setIterationBIndex(temp);
  };

  return (
    <div className="flex flex-col h-screen w-screen bg-slate-950 text-slate-100 overflow-hidden font-sans">
      {/* Top Header */}
      <Header
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        settings={settings}
        setSettings={setSettings}
        summary={summary}
        onLoadPreset={handleLoadPreset}
        onOpenSettings={() => setIsSettingsOpen(true)}
        onOpenImportModal={() => setIsImportModalOpen(true)}
        onExportPatch={handleExportPatch}
        onOpenHistory={() => setIsHistoryDrawerOpen(true)}
        historyCount={history.length}
      />

      {activeTab === 'single' ? (
        <>
          {/* Action Toolbar */}
          <Toolbar
            filenameA={effectiveFilenameA}
            filenameB={effectiveFilenameB}
            settings={settings}
            setSettings={setSettings}
            summary={summary}
            onApplyAllLeftToRight={handleApplyAllLeftToRight}
            onApplyAllRightToLeft={handleApplyAllRightToLeft}
            onSwapSides={handleSwapSides}
            onResetToOriginal={handleResetToOriginal}
            onClear={handleClear}
            onDownloadA={handleDownloadA}
            onDownloadB={handleDownloadB}
            onCopyMerged={() => navigator.clipboard.writeText(effectiveRightText)}
            onOpenImportModal={() => setIsImportModalOpen(true)}
            onUndo={handleUndo}
            onRedo={handleRedo}
            canUndo={canUndo}
            canRedo={canRedo}
            onOpenHistory={() => setIsHistoryDrawerOpen(true)}
            historyCount={history.length}
          />

          {/* Iteration Comparator Banner (when compareIterations setting is active) */}
          {settings.compareIterations && (
            <IterationComparatorBar
              history={history}
              iterationAIndex={iterationAIndex}
              iterationBIndex={iterationBIndex >= history.length ? history.length - 1 : iterationBIndex}
              onChangeIterationA={setIterationAIndex}
              onChangeIterationB={setIterationBIndex}
              onClose={() => setSettings(prev => ({ ...prev, compareIterations: false }))}
              onStepPrevious={handleStepPrevIteration}
              onStepNext={handleStepNextIteration}
              onStepCompareLatest={handleStepCompareLatest}
              onSwapIterations={handleSwapIterations}
            />
          )}

          {/* Semantic & Block Navigator Bar */}
          <SemanticFilterBar
            selectedCategory={selectedCategory}
            onSelectCategory={setSelectedCategory}
            chunks={chunks}
            activeChunkIndex={activeChunkIndex}
            onNavigateChunk={handleNavigateChunk}
            onTransferActiveChunk={handleTransferActiveChunk}
            showOutline={showOutline}
            onToggleOutline={() => setShowOutline(!showOutline)}
            counts={counts}
          />

          {/* Diff Main Workspace */}
          <div className="flex-1 flex overflow-hidden">
            {/* Semantic Outline Drawer */}
            {showOutline && (
              <SemanticBlockNavigator
                blocks={semanticBlocks}
                selectedCategory={selectedCategory}
                onSelectCategory={setSelectedCategory}
                onJumpToBlock={handleJumpToBlock}
                onClose={() => setShowOutline(false)}
              />
            )}

            {/* Split or Unified Diff View */}
            {settings.viewMode === 'split' ? (
              <DiffViewer
                filenameA={effectiveFilenameA}
                setFilenameA={setFilenameA}
                filenameB={effectiveFilenameB}
                setFilenameB={setFilenameB}
                leftText={effectiveLeftText}
                setLeftText={handleUserEditLeft}
                rightText={effectiveRightText}
                setRightText={handleUserEditRight}
                chunks={chunks}
                settings={settings}
                setSettings={setSettings}
                onTransferChunk={handleTransferChunk}
                selectedCategory={selectedCategory}
                activeChunkIndex={activeChunkIndex}
                recentFiles={recentFiles}
                onSelectRecentFile={handleSelectRecentFile}
                onSaveCurrentFile={(name, content, side) => handleSaveFileRecord({
                  filename: name.split('/').pop() || name,
                  fullPath: name,
                  content,
                  lastUsedSide: side
                })}
                onRemoveRecentFile={handleRemoveRecentFile}
                onClearAllRecentFiles={handleClearRecentFiles}
              />
            ) : (
              <UnifiedDiffViewer
                chunks={chunks}
                settings={settings}
                onTransferChunk={handleTransferChunk}
                selectedCategory={selectedCategory}
              />
            )}
          </div>
        </>
      ) : (
        /* Multi-File & Folder Comparator Workspace */
        <FolderComparator
          files={folderFiles}
          setFiles={setFolderFiles}
          selectedFileId={selectedFileId}
          onSelectFile={(file) => setSelectedFileId(file.id)}
          onOpenDiffForFile={handleOpenDiffForFile}
          onOpenImportModal={() => setIsImportModalOpen(true)}
        />
      )}

      {/* Settings Modal */}
      <SettingsModal
        isOpen={isSettingsOpen}
        onClose={() => setIsSettingsOpen(false)}
        settings={settings}
        setSettings={setSettings}
      />

      {/* Import Source Modal (Computador, URLs, GitHub, Codeberg) */}
      <ImportSourceModal
        isOpen={isImportModalOpen}
        onClose={() => setIsImportModalOpen(false)}
        onApplySingleDiff={handleApplySingleDiffFromImport}
        onApplyFolderDiff={handleApplyFolderDiffFromImport}
        recentFiles={recentFiles}
        onSelectRecentFile={handleSelectRecentFile}
      />

      {/* Revision History & Change Timeline Drawer */}
      <HistoryDrawer
        isOpen={isHistoryDrawerOpen}
        onClose={() => setIsHistoryDrawerOpen(false)}
        history={history}
        currentIndex={historyIndex}
        onRevertToSnapshot={handleRevertToSnapshot}
        onUndo={handleUndo}
        onRedo={handleRedo}
        canUndo={canUndo}
        canRedo={canRedo}
        onClearHistory={handleClearHistory}
      />
    </div>
  );
}
