declare module 'fastscan' {
  export default class FastScanner {
    constructor(words: string[]);
    search(content: string, options?: { quick?: boolean; longest?: boolean }): Array<[number, string]>;
    hits(content: string, options?: { quick?: boolean; longest?: boolean }): Record<string, number>;
    add(word: string): void;
  }
}
