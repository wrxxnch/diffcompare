import * as Diff from 'diff';
import { DiffChunk, DiffLine, DiffSettings, DiffSummary, SemanticCategory, InlineChangePart, SemanticBlock } from '../types';
import { parseSemanticBlocks, classifyLineSemantic } from './codeParser';

export function computeDiff(
  leftText: string,
  rightText: string,
  settings: DiffSettings
): {
  chunks: DiffChunk[];
  summary: DiffSummary;
  semanticBlocks: SemanticBlock[];
  leftLineCount: number;
  rightLineCount: number;
} {
  // Normalize CRLF to LF so line endings don't mark every line as changed
  const cleanLeft = (leftText || '').replace(/\r\n/g, '\n').replace(/\r/g, '\n');
  const cleanRight = (rightText || '').replace(/\r\n/g, '\n').replace(/\r/g, '\n');

  const leftBlocks = parseSemanticBlocks(cleanLeft, 'left');
  const rightBlocks = parseSemanticBlocks(cleanRight, 'right');

  // Normalize text if settings require
  let processedLeft = cleanLeft;
  let processedRight = cleanRight;

  if (settings.ignoreCase) {
    processedLeft = processedLeft.toLowerCase();
    processedRight = processedRight.toLowerCase();
  }

  // Generate line diff
  const diffOptions: { ignoreWhitespace?: boolean; newlineIsToken?: boolean; ignoreCase?: boolean } = {
    ignoreWhitespace: settings.ignoreWhitespace,
    newlineIsToken: false
  };

  const lineDiff = Diff.diffLines(processedLeft, processedRight, diffOptions) || [];

  const rawLeftLines = cleanLeft.split('\n');
  const rawRightLines = cleanRight.split('\n');

  const chunks: DiffChunk[] = [];
  let currentLeftLineNum = 1;
  let currentRightLineNum = 1;

  let leftIndex = 0;
  let rightIndex = 0;

  let totalAdditions = 0;
  let totalDeletions = 0;
  let totalModifications = 0;

  let chunkIdCounter = 0;

  for (let i = 0; i < lineDiff.length; i++) {
    const part = lineDiff[i];
    if (!part) continue;
    const partLines = part.value.split('\n');
    if (partLines[partLines.length - 1] === '') {
      partLines.pop(); // Remove trailing empty string from split
    }

    // Check for paired modification: (removed + added) OR (added + removed)
    const nextPart = lineDiff[i + 1];
    const isRemoveThenAdd = part.removed && nextPart && nextPart.added;
    const isAddThenRemove = part.added && nextPart && nextPart.removed;

    if (isRemoveThenAdd || isAddThenRemove) {
      i++; // Consume next part
      const removedPart = isRemoveThenAdd ? part : nextPart;
      const addedPart = isRemoveThenAdd ? nextPart : part;

      const removedLines = removedPart.value.split('\n');
      if (removedLines[removedLines.length - 1] === '') removedLines.pop();

      const addedLines = addedPart.value.split('\n');
      if (addedLines[addedLines.length - 1] === '') addedLines.pop();

      const leftChunkLines: DiffLine[] = [];
      const rightChunkLines: DiffLine[] = [];
      const startLeft = currentLeftLineNum;
      const startRight = currentRightLineNum;

      // Process removed (left)
      for (let j = 0; j < removedLines.length; j++) {
        const rawContent = rawLeftLines[leftIndex] ?? removedLines[j];
        leftChunkLines.push({
          id: `l-${currentLeftLineNum}-${j}`,
          type: 'deleted',
          content: rawContent,
          lineNumber: currentLeftLineNum,
          semanticCategories: classifyLineSemantic(rawContent),
          rawIndex: leftIndex
        });
        currentLeftLineNum++;
        leftIndex++;
        totalDeletions++;
      }

      // Process added (right)
      for (let j = 0; j < addedLines.length; j++) {
        const rawContent = rawRightLines[rightIndex] ?? addedLines[j];
        rightChunkLines.push({
          id: `r-${currentRightLineNum}-${j}`,
          type: 'added',
          content: rawContent,
          lineNumber: currentRightLineNum,
          semanticCategories: classifyLineSemantic(rawContent),
          rawIndex: rightIndex
        });
        currentRightLineNum++;
        rightIndex++;
        totalAdditions++;
      }

      totalModifications++;

      // Compute intra-line word/character highlights for paired lines
      if (settings.showWordDiff) {
        computeIntraLineHighlights(leftChunkLines, rightChunkLines);
      }

      // Align count of lines in chunk
      alignChunkLines(leftChunkLines, rightChunkLines);

      const chunkSemantic = determineChunkSemantic(leftChunkLines, rightChunkLines, leftBlocks, rightBlocks, startLeft, startRight);

      chunks.push({
        id: `chunk-${chunkIdCounter++}`,
        type: 'modify',
        leftLines: leftChunkLines,
        rightLines: rightChunkLines,
        leftStartLine: startLeft,
        leftEndLine: currentLeftLineNum - 1,
        rightStartLine: startRight,
        rightEndLine: currentRightLineNum - 1,
        semanticTypes: chunkSemantic.types,
        semanticLabels: chunkSemantic.labels
      });

    } else if (part.added) {
      // Pure ADDED (present only on Right)
      const rightChunkLines: DiffLine[] = [];
      const startRight = currentRightLineNum;

      for (let j = 0; j < partLines.length; j++) {
        const rawContent = rawRightLines[rightIndex] ?? partLines[j];
        const lineCategories = classifyLineSemantic(rawContent);
        rightChunkLines.push({
          id: `r-${currentRightLineNum}-${j}`,
          type: 'added',
          content: rawContent,
          lineNumber: currentRightLineNum,
          semanticCategories: lineCategories,
          rawIndex: rightIndex
        });
        currentRightLineNum++;
        rightIndex++;
        totalAdditions++;
      }

      // Create empty left lines for alignment
      const leftChunkLines: DiffLine[] = rightChunkLines.map((_, idx) => ({
        id: `l-empty-${startRight}-${idx}`,
        type: 'empty',
        content: '',
        lineNumber: null
      }));

      const chunkSemantic = determineChunkSemantic(leftChunkLines, rightChunkLines, leftBlocks, rightBlocks, currentLeftLineNum, startRight);

      chunks.push({
        id: `chunk-${chunkIdCounter++}`,
        type: 'add',
        leftLines: leftChunkLines,
        rightLines: rightChunkLines,
        leftStartLine: currentLeftLineNum,
        leftEndLine: currentLeftLineNum,
        rightStartLine: startRight,
        rightEndLine: currentRightLineNum - 1,
        semanticTypes: chunkSemantic.types,
        semanticLabels: chunkSemantic.labels
      });

    } else if (part.removed) {
      // Pure DELETED (present only on Left)
      const leftChunkLines: DiffLine[] = [];
      const startLeft = currentLeftLineNum;

      for (let j = 0; j < partLines.length; j++) {
        const rawContent = rawLeftLines[leftIndex] ?? partLines[j];
        leftChunkLines.push({
          id: `l-${currentLeftLineNum}-${j}`,
          type: 'deleted',
          content: rawContent,
          lineNumber: currentLeftLineNum,
          semanticCategories: classifyLineSemantic(rawContent),
          rawIndex: leftIndex
        });
        currentLeftLineNum++;
        leftIndex++;
        totalDeletions++;
      }

      // Empty right lines for alignment
      const rightChunkLines: DiffLine[] = leftChunkLines.map((_, idx) => ({
        id: `r-empty-${startLeft}-${idx}`,
        type: 'empty',
        content: '',
        lineNumber: null
      }));

      const chunkSemantic = determineChunkSemantic(leftChunkLines, rightChunkLines, leftBlocks, rightBlocks, startLeft, currentRightLineNum);

      chunks.push({
        id: `chunk-${chunkIdCounter++}`,
        type: 'delete',
        leftLines: leftChunkLines,
        rightLines: rightChunkLines,
        leftStartLine: startLeft,
        leftEndLine: currentLeftLineNum - 1,
        rightStartLine: currentRightLineNum,
        rightEndLine: currentRightLineNum,
        semanticTypes: chunkSemantic.types,
        semanticLabels: chunkSemantic.labels
      });
    } else {
      // EQUAL lines
      const leftChunkLines: DiffLine[] = [];
      const rightChunkLines: DiffLine[] = [];
      const startLeft = currentLeftLineNum;
      const startRight = currentRightLineNum;

      for (let j = 0; j < partLines.length; j++) {
        const leftRaw = rawLeftLines[leftIndex] ?? partLines[j];
        const rightRaw = rawRightLines[rightIndex] ?? partLines[j];

        const cats = classifyLineSemantic(leftRaw);

        leftChunkLines.push({
          id: `l-eq-${currentLeftLineNum}-${j}`,
          type: 'equal',
          content: leftRaw,
          lineNumber: currentLeftLineNum,
          semanticCategories: cats,
          rawIndex: leftIndex
        });

        rightChunkLines.push({
          id: `r-eq-${currentRightLineNum}-${j}`,
          type: 'equal',
          content: rightRaw,
          lineNumber: currentRightLineNum,
          semanticCategories: cats,
          rawIndex: rightIndex
        });

        currentLeftLineNum++;
        currentRightLineNum++;
        leftIndex++;
        rightIndex++;
      }

      chunks.push({
        id: `chunk-${chunkIdCounter++}`,
        type: 'equal',
        leftLines: leftChunkLines,
        rightLines: rightChunkLines,
        leftStartLine: startLeft,
        leftEndLine: currentLeftLineNum - 1,
        rightStartLine: startRight,
        rightEndLine: currentRightLineNum - 1,
        semanticTypes: [],
        semanticLabels: []
      });
    }
  }

  // Link chunks to semantic blocks
  const allBlocks = [...leftBlocks, ...rightBlocks];
  const uniqueBlocksMap = new Map<string, SemanticBlock>();

  allBlocks.forEach(b => {
    const key = `${b.category}-${b.name}`;
    if (!uniqueBlocksMap.has(key)) {
      uniqueBlocksMap.set(key, { ...b });
    }
  });

  const mergedBlocks = Array.from(uniqueBlocksMap.values());

  // Mark diff presence on semantic blocks
  chunks.forEach(chunk => {
    if (chunk.type !== 'equal') {
      mergedBlocks.forEach(block => {
        const inLeft = chunk.leftStartLine <= block.endLine && chunk.leftEndLine >= block.startLine;
        const inRight = chunk.rightStartLine <= block.endLine && chunk.rightEndLine >= block.startLine;
        if (inLeft || inRight) {
          block.hasDiff = true;
          if (!block.chunkIds.includes(chunk.id)) {
            block.chunkIds.push(chunk.id);
          }
        }
      });
    }
  });

  const summary: DiffSummary = {
    additions: totalAdditions,
    deletions: totalDeletions,
    modifications: totalModifications,
    totalChunks: chunks.filter(c => c.type !== 'equal').length,
    identical: totalAdditions === 0 && totalDeletions === 0
  };

  return {
    chunks,
    summary,
    semanticBlocks: mergedBlocks,
    leftLineCount: rawLeftLines.length,
    rightLineCount: rawRightLines.length
  };
}

function computeIntraLineHighlights(leftLines: DiffLine[], rightLines: DiffLine[]) {
  const minLen = Math.min(leftLines.length, rightLines.length);
  for (let i = 0; i < minLen; i++) {
    const lLine = leftLines[i];
    const rLine = rightLines[i];

    if (!lLine || !rLine) continue;

    const wordDiff = Diff.diffWordsWithSpace(lLine.content, rLine.content);
    
    const leftParts: InlineChangePart[] = [];
    const rightParts: InlineChangePart[] = [];

    wordDiff.forEach(part => {
      if (part.removed) {
        leftParts.push({ text: part.value, changed: true });
      } else if (part.added) {
        rightParts.push({ text: part.value, changed: true });
      } else {
        leftParts.push({ text: part.value, changed: false });
        rightParts.push({ text: part.value, changed: false });
      }
    });

    lLine.highlightParts = leftParts;
    rLine.highlightParts = rightParts;
  }
}

function alignChunkLines(leftLines: DiffLine[], rightLines: DiffLine[]) {
  const diff = leftLines.length - rightLines.length;
  if (diff > 0) {
    // Add empty lines to right
    for (let i = 0; i < diff; i++) {
      rightLines.push({
        id: `r-pad-${i}`,
        type: 'empty',
        content: '',
        lineNumber: null
      });
    }
  } else if (diff < 0) {
    // Add empty lines to left
    for (let i = 0; i < Math.abs(diff); i++) {
      leftLines.push({
        id: `l-pad-${i}`,
        type: 'empty',
        content: '',
        lineNumber: null
      });
    }
  }
}

function determineChunkSemantic(
  leftLines: DiffLine[],
  rightLines: DiffLine[],
  leftBlocks: SemanticBlock[],
  rightBlocks: SemanticBlock[],
  leftLine: number,
  rightLine: number
): { types: SemanticCategory[]; labels: string[] } {
  const typesSet = new Set<SemanticCategory>();
  const labelsSet = new Set<string>();

  // Check lines content
  [...leftLines, ...rightLines].forEach(line => {
    if (line.content) {
      const cats = classifyLineSemantic(line.content);
      cats.forEach(c => typesSet.add(c));
    }
  });

  // Check overlap with parsed semantic blocks
  [...leftBlocks, ...rightBlocks].forEach(block => {
    const isOverlapping = 
      (leftLine >= block.startLine && leftLine <= block.endLine) ||
      (rightLine >= block.startLine && rightLine <= block.endLine);

    if (isOverlapping) {
      typesSet.add(block.category);
      labelsSet.add(block.name);
    }
  });

  return {
    types: Array.from(typesSet),
    labels: Array.from(labelsSet).slice(0, 2)
  };
}

// Transfer single chunk from Left to Right
export function transferChunkToRight(
  leftText: string,
  rightText: string,
  chunk: DiffChunk
): string {
  const leftLines = leftText.split('\n');
  const rightLines = rightText.split('\n');

  // Extract non-empty lines from left chunk
  const activeLeft = chunk.leftLines
    .filter(l => l.type !== 'empty')
    .map(l => l.content);

  const startRight = Math.max(0, chunk.rightStartLine - 1);
  const endRight = chunk.type === 'delete' ? startRight : chunk.rightEndLine;
  const deleteCount = Math.max(0, endRight - startRight);

  rightLines.splice(startRight, deleteCount, ...activeLeft);
  return rightLines.join('\n');
}

// Transfer single chunk from Right to Left
export function transferChunkToLeft(
  leftText: string,
  rightText: string,
  chunk: DiffChunk
): string {
  const leftLines = leftText.split('\n');

  const activeRight = chunk.rightLines
    .filter(l => l.type !== 'empty')
    .map(l => l.content);

  const startLeft = Math.max(0, chunk.leftStartLine - 1);
  const endLeft = chunk.type === 'add' ? startLeft : chunk.leftEndLine;
  const deleteCount = Math.max(0, endLeft - startLeft);

  leftLines.splice(startLeft, deleteCount, ...activeRight);
  return leftLines.join('\n');
}

// Generate unified patch text
export function generateUnifiedPatch(
  filenameA: string,
  filenameB: string,
  leftText: string,
  rightText: string
): string {
  return Diff.createPatch(
    filenameA || 'original.txt',
    leftText,
    rightText,
    filenameA || 'Arquivo A',
    filenameB || 'Arquivo B'
  );
}
