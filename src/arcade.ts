import * as BABYLON from 'babylonjs'
import * as Comlink from 'comlink';
import { CabinetConfig, GameCabinet, GameMonitor, deg2rad } from "./cabinet";
import { GameHandler } from './gameui';
import { startNESWorker } from './workers';
import { WorkerInterface } from './types';
import { WebXRGameController } from './webxr';


export type CabinetConfigMap = { [key: string]: CabinetConfig };

export interface ArcadeGameConfig {
    cabinetID: string
    position: { x: number, z: number }
    rotation: number
}

export interface ArcadeSceneConfig {
    games: ArcadeGameConfig[]
}

function startGame(worker: Worker, romPath: string, gh: GameHandler): WorkerInterface {
    let w = Comlink.wrap(worker) as Comlink.Remote<WorkerInterface>;
    w.setCallback(Comlink.proxy(gh));
    fetch(romPath).then(async (response) => {
        let buf = await response.arrayBuffer();
        w.loadROM(new Uint8Array(buf));
    });
    return w;
}

export class ArcadeScene {
    cabinets: { [key: string]: GameCabinet } = {};

    constructor(
        readonly config: ArcadeSceneConfig,
        readonly cabinetMap: CabinetConfigMap,
        readonly gameController: WebXRGameController
    ) {
    }
    async loadCabinets(scene: BABYLON.Scene) {
        let promises: Promise<BABYLON.TransformNode>[] = [];
        for (let game of this.config.games) {
            let cabinetConfig = this.cabinetMap[game.cabinetID];
            if (!cabinetConfig) {
                throw new Error(`no cabinet config for ${game.cabinetID}`);
            }
            if (!this.cabinets[game.cabinetID]) {
                console.log(`loading cabinet "${game.cabinetID}"`);
                let cabinet = this.cabinets[game.cabinetID] = new GameCabinet(cabinetConfig);
                promises.push(cabinet.createModel(scene));
            }
        }
        return Promise.all(promises);
    }
    async load(scene: BABYLON.Scene) {
        // load cabinet models
        await this.loadCabinets(scene);
        // create cabinets
        for (let game of this.config.games) {
            this.createGame(scene, game);
        }
        // dispose all original cabinets
        // TODO: should not be necc.
        for (let game of this.config.games) {
            let origCabinet = this.cabinets[game.cabinetID];
            origCabinet?.rootMesh?.dispose();
        }
    }
    createGame(scene: BABYLON.Scene, game: ArcadeGameConfig) {
        let origCabinet = this.cabinets[game.cabinetID];
        if (!origCabinet) throw new Error(`no cabinet for "${game.cabinetID}"`);
        if (origCabinet.rootMesh?.parent) throw new Error("original root mesh has parent");
        // clone cabinet model
        let cabinet = origCabinet.clone();
        let rootMesh = cabinet.rootMesh;
        if (!rootMesh) throw new Error("no root mesh");
        rootMesh.name = game.cabinetID;
        rootMesh.position.x += game.position.x;
        rootMesh.position.z += game.position.z;
        rootMesh.rotation.y += deg2rad(game.rotation);
        let screen = cabinet.createScreen(scene);
        rootMesh.freezeWorldMatrix();
        screen.mesh.freezeWorldMatrix();
        // create game handler to receive callbacks from worker
        let gh = new GameHandler(scene, cabinet, screen);
        // TODO: defer worker start until screen is clicked
        const gameConfig = origCabinet.config.game;
        if (!gameConfig) throw new Error("no game config");
        const rompath = gameConfig.romPath;
        let wi = startGame(startNESWorker(), rompath, gh);
        this.gameController.makeCabinetInteractive(cabinet, screen, wi);
        // add joysticks and buttons
        cabinet.createControlPanel(scene, wi);
    }
}
