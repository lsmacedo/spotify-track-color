declare module 'genius-lyrics-api' {
  export function getLyrics(options: {
    apiKey: string;
    title: string;
    artist: string;
    optimizeQuery: boolean;
  }): Promise<string | undefined>;
}
