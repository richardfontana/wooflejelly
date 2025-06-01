declare const Elm: {
  Main: {
    init: (options: { node: HTMLElement | null }) => any;
  };
};

declare class diff_match_patch {
  diff_main(text1: string, text2: string): [number, string][];
  diff_cleanupSemantic(diffs: [number, string][]): void; 
  diff_prettyHtml(diffs: [number,  string][]): string; 
}

interface Window {
  selectedText?: string;
}
