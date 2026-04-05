declare module "@jspawn/ghostscript-wasm" {
  export interface GhostscriptFs {
    writeFile(path: string, data: Buffer): void;
    readFile(path: string): Uint8Array;
    unlink(path: string): void;
  }

  export interface GhostscriptInstance {
    FS: GhostscriptFs;
    callMain(args: string[]): void;
  }

  export interface GhostscriptOptions {
    locateFile?: (filename: string) => string;
  }

  export default function GhostscriptFactory(
    options?: GhostscriptOptions
  ): Promise<GhostscriptInstance>;
}
