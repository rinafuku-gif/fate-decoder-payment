declare module "dom-to-image-more" {
  interface Options {
    quality?: number;
    bgcolor?: string;
    width?: number;
    height?: number;
    style?: Record<string, string>;
    filter?: (node: HTMLElement) => boolean;
    cacheBust?: boolean;
  }
  const domToImage: {
    toBlob(node: HTMLElement, options?: Options): Promise<Blob | null>;
    toPng(node: HTMLElement, options?: Options): Promise<string>;
    toJpeg(node: HTMLElement, options?: Options): Promise<string>;
    toSvg(node: HTMLElement, options?: Options): Promise<string>;
  };
  export default domToImage;
}
