
export interface VideoParams {
    width: number;
    height: number;
    rotate?: number;
}

export interface AudioParams {
    sampleRate: number;
    bufferSize: number;
}

export interface WorkerInterface {
    setCallback(callback: WorkerCallback): void;
    loadROM(romData: Uint8Array): void;
    resume(): void;
    pause(): void;
    advance(): void;
    controllerUpdate(controller: number, key: ControllerKey, value: number): void;
}

export interface WorkerCallback {
    configure(videoParams: VideoParams, audioParams: AudioParams): void;
    stateUpdate(running: boolean): void;
    videoUpdate(frameBuffer: Uint8Array): void;
    audioUpdate(samples: Float32Array): void;
}

export enum ControllerKey {
    UP = 0,
    DOWN,
    LEFT,
    RIGHT,
    BTN_A,
    BTN_B,
    BTN_C,
    BTN_D,
    COIN,
    START_1P,
    START_2P,
    SELECT,
};

