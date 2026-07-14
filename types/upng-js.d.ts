declare module "upng-js" {
  interface UPNG {
    decode(buffer: ArrayBuffer): {
      width: number;
      height: number;
      depth: number;
      ctype: number;
      frames: ArrayBuffer[];
      tabs: {
        PLTE?: number[];
        tRNS?: number[];
        bKGD?: Record<string, number>;
      };
      data: Uint8Array;
    };
    encode(
      imgs: ArrayBuffer[],
      width: number,
      height: number,
      cnum: number,
      dels?: number[]
    ): ArrayBuffer;
    encodeLL(
      imgs: ArrayBuffer[],
      width: number,
      height: number,
      cc: number,
      ac: number,
      depth: number,
      dels?: number[]
    ): ArrayBuffer;
    quantize(data: Uint8Array, psize: number): {
      abuf: ArrayBuffer;
      inds: Uint8Array;
      plte: number[];
    };
    toRGBA8(out: Record<string, unknown>): Uint8Array[];
  }

  const UPNG: UPNG;
  export default UPNG;
}
