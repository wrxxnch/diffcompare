export type DiffLineType = 'equal' | 'added' | 'deleted' | 'empty';

export type SemanticCategory = 'all' | 'function' | 'if' | 'loop' | 'block';

export interface InlineChangePart {
  text: string;
  changed: boolean;
}

export interface DiffLine {
  id: string;
  type: DiffLineType;
  content: string;
  lineNumber: number | null;
  highlightParts?: InlineChangePart[];
  semanticCategories?: SemanticCategory[];
  rawIndex?: number;
}

export interface DiffChunk {
  id: string;
  type: 'equal' | 'modify' | 'add' | 'delete';
  leftLines: DiffLine[];
  rightLines: DiffLine[];
  leftStartLine: number;
  leftEndLine: number;
  rightStartLine: number;
  rightEndLine: number;
  semanticTypes: SemanticCategory[];
  semanticLabels: string[];
}

export interface SemanticBlock {
  id: string;
  category: 'function' | 'if' | 'loop' | 'block';
  name: string;
  side: 'left' | 'right' | 'both';
  startLine: number;
  endLine: number;
  hasDiff: boolean;
  chunkIds: string[];
}

export interface FileItem {
  id: string;
  path: string;
  name: string;
  leftContent: string;
  rightContent: string;
  status: 'modified' | 'added' | 'deleted' | 'identical';
  additions: number;
  deletions: number;
  sizeLeft?: number;
  sizeRight?: number;
  extension: string;
}

export interface DiffSettings {
  ignoreWhitespace: boolean;
  ignoreCase: boolean;
  viewMode: 'split' | 'unified';
  fontSize: number;
  wrapLines: boolean;
  theme: 'dark' | 'light' | 'github-dark' | 'monokai';
  syncScroll: boolean;
  showLineNumbers: boolean;
  showWordDiff: boolean;
  showMinimap: boolean;
  compareIterations: boolean;
}

export type ActiveTabMode = 'single' | 'multi';

export interface DiffSummary {
  additions: number;
  deletions: number;
  modifications: number;
  totalChunks: number;
  identical: boolean;
}

export interface RevisionSnapshot {
  id: string;
  timestamp: number;
  title: string;
  description?: string;
  leftText: string;
  rightText: string;
  filenameA: string;
  filenameB: string;
  summary: {
    additions: number;
    deletions: number;
    modifications: number;
  };
  type: 'init' | 'preset' | 'edit' | 'transfer' | 'apply_all' | 'swap' | 'reset' | 'clear' | 'import';
}

export interface RecentFileRecord {
  id: string;
  filename: string;
  fullPath: string;
  content: string;
  lineCount: number;
  timestamp: number;
  lastUsedSide?: 'A' | 'B';
  source?: 'upload' | 'import' | 'paste' | 'preset' | 'edit';
}


