declare module '@webav/mp4box.js' {
  export interface MP4File {
    onMoovStart?: () => void;
    onReady?: (info: any) => void;
    onError?: (error: any) => void;
    onSamples?: (trackId: number, user: any, samples: any) => void;
    appendBuffer: (data: ArrayBuffer) => void;
    start: () => void;
    stop: () => void;
    flush: () => void;
    releaseUsedSamples: (trackId: number, sampleNumber: number) => void;
    setExtractionOptions: (trackId: number, options: any) => void;
  }

  export interface SampleOpts {
    rapAlignment?: boolean;
    nbSamples?: number;
  }

  const mp4box: {
    createFile: () => MP4File;
  };

  export default mp4box;
}
