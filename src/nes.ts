
import jsnes from 'jsnes';
import * as Comlink from 'comlink';
import { AnimationTimer } from './timer';
import { ControllerKey, WorkerCallback, WorkerInterface } from './types';

export function byteArrayToString(data: number[] | Uint8Array): string {
    var str = "";
    if (data != null) {
        var charLUT = new Array();
        for (var i = 0; i < 256; ++i)
            charLUT[i] = String.fromCharCode(i);
        var len = data.length;
        for (var i = 0; i < len; i++)
            str += charLUT[data[i]];
    }
    return str;
}

export class NESWorker implements WorkerInterface {

    callback: WorkerCallback | null = null;
    nes: any;
    timer: AnimationTimer;
    rgba_u32 = new Uint32Array(256 * 240);
    rgba_u8 = new Uint8Array(this.rgba_u32.buffer);
    videoParams = { width: 256, height: 240 };
    audioParams = { sampleRate: 44100, bufferSize: 2048 };
    audioBuffer = new Float32Array(this.audioParams.bufferSize);
    bufferIndex = 0;

    constructor() {
        this.timer = new AnimationTimer(60, () => {
            this.advance();
        });
        this.nes = new jsnes.NES({
            onFrame: (frameBuffer: number[]) => {
                let desti = 0;
                for (let y = 0; y < 240; y++) {
                    let srci = (239 - y) * 256;
                    for (let x = 0; x < 256; x++) {
                        let pixel = frameBuffer[srci++];
                        this.rgba_u32[desti++] = pixel; // | 0xFF000000
                    }
                }
                this.callback?.videoUpdate(this.rgba_u8);
            },
            onAudioSample: (left: number, right: number) => {
                let mag = (left + right) / 2;
                this.audioBuffer[this.bufferIndex++] = mag;
                if (this.bufferIndex >= this.audioBuffer.length) {
                    this.callback?.audioUpdate(this.audioBuffer);
                    this.bufferIndex = 0;
                }
            }
        });
    }
    setCallback(callback: WorkerCallback) {
        this.callback = callback;
    }
    loadROM(romData: Uint8Array) {
        var romstr = byteArrayToString(romData);
        this.nes.loadROM(romstr);
    }
    resume() {
        this.timer.start();
        this.callback?.configure(this.videoParams, this.audioParams);
        this.callback?.stateUpdate(true);
    }
    pause() {
        this.timer.stop();
        this.callback?.stateUpdate(false);
    }
    advance() {
        this.nes.frame();
    }
    controllerUpdate(controller: number, key: ControllerKey, value: number): void {
        controller++;
        if (controller != 1 && controller != 2) return;
        let jsnes_button = -1;
        switch (key) {
            case ControllerKey.UP: jsnes_button = jsnes.Controller.BUTTON_UP; break;
            case ControllerKey.DOWN: jsnes_button = jsnes.Controller.BUTTON_DOWN; break;
            case ControllerKey.LEFT: jsnes_button = jsnes.Controller.BUTTON_LEFT; break;
            case ControllerKey.RIGHT: jsnes_button = jsnes.Controller.BUTTON_RIGHT; break;
            case ControllerKey.BTN_A: jsnes_button = jsnes.Controller.BUTTON_A; break;
            case ControllerKey.BTN_B: jsnes_button = jsnes.Controller.BUTTON_B; break;
            case ControllerKey.BTN_C: jsnes_button = jsnes.Controller.BUTTON_SELECT; break;
            case ControllerKey.BTN_D: jsnes_button = jsnes.Controller.BUTTON_START; break;
            case ControllerKey.COIN: jsnes_button = jsnes.Controller.BUTTON_SELECT; break;
            case ControllerKey.START_1P: jsnes_button = jsnes.Controller.BUTTON_START; break;
            case ControllerKey.START_2P: jsnes_button = jsnes.Controller.BUTTON_START; break;
            case ControllerKey.SELECT: jsnes_button = jsnes.Controller.BUTTON_SELECT; break;
        }
        if (jsnes_button >= 0) {
            if (value) {
                this.nes.buttonDown(controller, jsnes_button);
            } else {
                this.nes.buttonUp(controller, jsnes_button);
            }
        }
    }
}

Comlink.expose(new NESWorker());
