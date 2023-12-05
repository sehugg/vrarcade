
import * as BABYLON from 'babylonjs'
import { AudioParams, ControllerKey, VideoParams, WorkerCallback } from './types';
import { SampledAudio } from './audio';
import { GameCabinet, GameMonitor } from './cabinet';

export class GameHandler implements WorkerCallback {

    rgbtex: BABYLON.RawTexture | null = null;
    audio : SampledAudio | null = null;

    constructor(
        protected scene: BABYLON.Scene,
        protected cabinet: GameCabinet,
        protected screen: GameMonitor)
    {
    }
    configure(videoParams: VideoParams, audioParams: AudioParams) {
        this.rgbtex = BABYLON.RawTexture.CreateRGBATexture(null, videoParams.width, videoParams.height, this.scene);
        this.screen.material.emissiveTexture = this.rgbtex;
        this.audio?.stop();
        this.audio = new SampledAudio(audioParams.sampleRate);
    }
    videoUpdate(frameBuffer: Uint8Array): void {
        this.rgbtex?.update(frameBuffer);
    }
    audioUpdate(samples: Float32Array): void {
        this.audio?.feedSamples(samples);
    }
    stateUpdate(running: boolean): void {
        if (running) {
            this.audio?.start();
            this.cabinet.stopVideo();
        } else {
            this.audio?.stop();
            this.cabinet.startVideo();
        }
    }
}
