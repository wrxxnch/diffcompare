import { SemanticBlock, SemanticCategory } from '../types';

interface DetectedRange {
  category: 'function' | 'if' | 'loop' | 'block';
  name: string;
  startLine: number;
  endLine: number;
}

export function parseSemanticBlocks(code: string, side: 'left' | 'right' | 'both' = 'both'): SemanticBlock[] {
  const lines = code.split('\n');
  const ranges: DetectedRange[] = [];

  // Patterns for functions, conditionals, loops, blocks
  const functionPatterns = [
    /^\s*(?:export\s+)?(?:default\s+)?(?:async\s+)?function(?:\s+([a-zA-Z0-9_$]+))?\s*\(/,
    /^\s*(?:export\s+)?(?:const|let|var)\s+([a-zA-Z0-9_$]+)\s*=\s*(?:async\s*)?\([^)]*\)\s*=>/,
    /^\s*(?:export\s+)?(?:const|let|var)\s+([a-zA-Z0-9_$]+)\s*=\s*(?:async\s*)?[a-zA-Z0-9_$]+\s*=>/,
    /^\s*(?:public|private|protected|static|async|\s)*([a-zA-Z0-9_$]+)\s*\([^)]*\)\s*(?::\s*[^{]+)?\s*\{/,
    /^\s*def\s+([a-zA-Z0-9_]+)\s*\(/,
    /^\s*fn\s+([a-zA-Z0-9_]+)/,
    /^\s*func\s+(?:\([^)]+\)\s+)?([a-zA-Z0-9_]+)\s*\(/
  ];

  const ifPatterns = [
    /^\s*if\s*\((.*)\)/,
    /^\s*if\s+(.+):/,
    /^\s*else\s+if\s*\((.*)\)/,
    /^\s*elif\s+(.+):/,
    /^\s*switch\s*\((.*)\)/
  ];

  const loopPatterns = [
    /^\s*for\s*\((.*)\)/,
    /^\s*for\s+([a-zA-Z0-9_,\s]+)\s+in\s+(.+):/,
    /^\s*while\s*\((.*)\)/,
    /^\s*while\s+(.+):/,
    /^\s*do\s*\{/,
    /\.(?:forEach|map|filter|reduce|flatMap)\s*\(/
  ];

  const classOrBlockPatterns = [
    /^\s*(?:export\s+)?class\s+([a-zA-Z0-9_$]+)/,
    /^\s*(?:export\s+)?interface\s+([a-zA-Z0-9_$]+)/,
    /^\s*(?:export\s+)?type\s+([a-zA-Z0-9_$]+)\s*=/,
    /^\s*struct\s+([a-zA-Z0-9_$]+)/,
    /^\s*try\s*\{/
  ];

  // Helper to find ending line using bracket stack or indentation (python)
  function findBlockEnd(startIndex: number): number {
    let openBraces = 0;
    let foundFirstBrace = false;
    const isPython = lines.some(l => /^\s*def\s+|^\s*if\s+.*:\s*$/.test(l));

    if (isPython) {
      const startIndent = lines[startIndex].search(/\S|$/);
      for (let i = startIndex + 1; i < lines.length; i++) {
        const line = lines[i];
        if (!line.trim()) continue; // skip blank lines
        const currentIndent = line.search(/\S|$/);
        if (currentIndent <= startIndent) {
          return i; // ends before this line
        }
      }
      return lines.length;
    }

    // Bracket-based languages (JS, TS, C, Java, PHP, Go, Rust, etc.)
    for (let i = startIndex; i < lines.length; i++) {
      const line = lines[i];
      for (let c = 0; c < line.length; c++) {
        const char = line[c];
        if (char === '{') {
          openBraces++;
          foundFirstBrace = true;
        } else if (char === '}') {
          openBraces--;
          if (foundFirstBrace && openBraces <= 0) {
            return i + 1; // 1-indexed end line
          }
        }
      }
    }

    // Fallback: estimate 3-8 lines or next empty line
    return Math.min(lines.length, startIndex + 5);
  }

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    const lineNumber = i + 1;

    // Check Functions
    let matched = false;
    for (const pattern of functionPatterns) {
      const match = line.match(pattern);
      if (match) {
        const name = match[1] ? `fn ${match[1]}()` : 'função anônima()';
        const endLine = findBlockEnd(i);
        ranges.push({
          category: 'function',
          name,
          startLine: lineNumber,
          endLine
        });
        matched = true;
        break;
      }
    }
    if (matched) continue;

    // Check Conditionals
    for (const pattern of ifPatterns) {
      const match = line.match(pattern);
      if (match) {
        const cond = match[1] ? match[1].slice(0, 30).trim() : 'condição';
        const name = line.includes('else if') || line.includes('elif') 
          ? `else if (${cond})`
          : line.includes('switch') 
            ? `switch (${cond})` 
            : `if (${cond})`;
        const endLine = findBlockEnd(i);
        ranges.push({
          category: 'if',
          name,
          startLine: lineNumber,
          endLine
        });
        matched = true;
        break;
      }
    }
    if (matched) continue;

    // Check Loops
    for (const pattern of loopPatterns) {
      const match = line.match(pattern);
      if (match) {
        const cond = match[1] ? match[1].slice(0, 25).trim() : 'loop';
        const name = line.includes('while') 
          ? `while (${cond})`
          : line.includes('.forEach') 
            ? '.forEach(..)'
            : line.includes('.map') 
              ? '.map(..)'
              : `for (${cond})`;
        const endLine = findBlockEnd(i);
        ranges.push({
          category: 'loop',
          name,
          startLine: lineNumber,
          endLine
        });
        matched = true;
        break;
      }
    }
    if (matched) continue;

    // Check Classes / Structs / Blocks
    for (const pattern of classOrBlockPatterns) {
      const match = line.match(pattern);
      if (match) {
        const name = match[1] ? `bloco ${match[1]}` : line.trim().slice(0, 30);
        const endLine = findBlockEnd(i);
        ranges.push({
          category: 'block',
          name,
          startLine: lineNumber,
          endLine
        });
        break;
      }
    }
  }

  return ranges.map((r, idx) => ({
    id: `block-${side}-${r.category}-${idx}-${r.startLine}`,
    category: r.category,
    name: r.name,
    side,
    startLine: r.startLine,
    endLine: r.endLine,
    hasDiff: false,
    chunkIds: []
  }));
}

export function classifyLineSemantic(lineContent: string): SemanticCategory[] {
  const categories: SemanticCategory[] = [];
  const trimmed = lineContent.trim();
  if (!trimmed) return categories;

  if (
    /function\b|=>|\bdef\b|\bfn\b|\bfunc\b|\bmethod\b/.test(trimmed) ||
    /^(public|private|protected|async|static|\s)*[a-zA-Z0-9_$]+\s*\([^)]*\)\s*\{/.test(trimmed)
  ) {
    categories.push('function');
  }

  if (/\bif\b|\belif\b|\belse\b|\bswitch\b|\bcase\b/.test(trimmed)) {
    categories.push('if');
  }

  if (/\bfor\b|\bwhile\b|\bdo\b|\bforeach\b|\bmap\b|\breduce\b/.test(trimmed)) {
    categories.push('loop');
  }

  if (/\bclass\b|\binterface\b|\bstruct\b|\btry\b|\bcatch\b|\{/.test(trimmed)) {
    categories.push('block');
  }

  return categories;
}
