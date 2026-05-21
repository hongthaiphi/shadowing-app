export interface WordResult {
  word: string;
  status: 'correct' | 'wrong' | 'missing' | 'extra';
}

export interface DictationCheckResult {
  results: WordResult[];
  accuracy: number;
}

function normalize(str: string): string {
  return str
    .toLowerCase()
    .replace(/[^a-z0-9'\s]/g, '')
    .trim();
}

function tokenize(str: string): string[] {
  return normalize(str)
    .split(/\s+/)
    .filter((w) => w.length > 0);
}

export function checkDictation(input: string, answer: string): DictationCheckResult {
  const inputWords = tokenize(input);
  const answerWords = tokenize(answer);

  // Use dynamic programming to align words (LCS-based diff)
  const n = answerWords.length;
  const m = inputWords.length;

  // Build LCS table
  const dp: number[][] = Array.from({ length: n + 1 }, () => new Array(m + 1).fill(0));
  for (let i = 1; i <= n; i++) {
    for (let j = 1; j <= m; j++) {
      if (answerWords[i - 1] === inputWords[j - 1]) {
        dp[i][j] = dp[i - 1][j - 1] + 1;
      } else {
        dp[i][j] = Math.max(dp[i - 1][j], dp[i][j - 1]);
      }
    }
  }

  // Backtrack to find alignment
  const results: WordResult[] = [];
  let i = n;
  let j = m;
  const ops: Array<{ type: 'match' | 'missing' | 'extra'; word: string }> = [];

  while (i > 0 || j > 0) {
    if (i > 0 && j > 0 && answerWords[i - 1] === inputWords[j - 1]) {
      ops.unshift({ type: 'match', word: answerWords[i - 1] });
      i--;
      j--;
    } else if (j > 0 && (i === 0 || dp[i][j - 1] >= dp[i - 1][j])) {
      ops.unshift({ type: 'extra', word: inputWords[j - 1] });
      j--;
    } else {
      ops.unshift({ type: 'missing', word: answerWords[i - 1] });
      i--;
    }
  }

  let correctCount = 0;
  for (const op of ops) {
    if (op.type === 'match') {
      results.push({ word: op.word, status: 'correct' });
      correctCount++;
    } else if (op.type === 'missing') {
      results.push({ word: op.word, status: 'missing' });
    } else {
      results.push({ word: op.word, status: 'extra' });
    }
  }

  // Accuracy = correct words / total answer words
  const accuracy = n === 0 ? 100 : Math.round((correctCount / n) * 100);

  return { results, accuracy };
}
