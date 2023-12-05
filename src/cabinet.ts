import * as BABYLON from 'babylonjs'
import { CRTBuilder } from './monitor';
import { CRTShaderPluginMaterial } from './crtshader';
import { AnimationTimer } from './timer';
import { CabinetModel, CabinetModelConfig } from './cabmodel';
import { CabinetControlPanel } from './controlpanel';
import { ControllerKey, WorkerInterface } from './types';

export interface CabinetConfig {
    model?: {
        path: string
        filename: string
        position: { x: number, y: number, z: number }
        rotation: { x: number, y: number, z: number }
        scaling: { x: number, y: number, z: number }
    }
    monitor?: {
        position: { x: number, y: number, z: number }
        scaling: { x: number, y: number, z: number }
        rotation: { x: number, y: number, z: number }
        diffuse: { level: number },
        specular: { power: number, coeff: number }
    }
    game?: {
        platform: string
        romPath: string
        videoPath: string
    }
    cabconfig?: CabinetModelConfig
}

export interface GameMonitor {
    material: BABYLON.StandardMaterial
    mesh: BABYLON.Mesh
}

export function deg2rad(deg: number) {
    return deg * Math.PI / 180;
}

export class GameCabinet {

    videoTexture: BABYLON.VideoTexture | null = null;
    rootMesh: BABYLON.TransformNode | null = null;
    monitor: GameMonitor | null = null;
    videoShouldPlay: boolean = false;
    videoIsPlaying: boolean = false;
    videoTimeout = 0;
    videoIdleTimer: AnimationTimer;

    constructor(
        readonly config: CabinetConfig
    ) {
        this.videoIdleTimer = new AnimationTimer(2 + Math.random(), () => {
            this.stopVideoIfNotInFrustum();
        });
    }
    async createModel(scene: BABYLON.Scene): Promise<BABYLON.TransformNode> {
        if (this.config.cabconfig) {
            let model = new CabinetModel(this.config.cabconfig).createModel(scene);
            this.rootMesh = model;
            return model;
        }
        const mc = this.config.model;
        if (!mc) throw new Error("no model config");
        return new Promise<BABYLON.TransformNode>((resolve, reject) => {
            BABYLON.SceneLoader.LoadAssetContainer(mc.path, mc.filename, scene, (container) => {
                // create group with all meshes
                let group = new BABYLON.TransformNode("cabinet", scene);
                container.rootNodes.forEach((m) => {
                    m.parent = group;
                });
                group.position = new BABYLON.Vector3(mc.position.x, mc.position.y, mc.position.z);
                group.scaling = new BABYLON.Vector3(mc.scaling.x, mc.scaling.y, mc.scaling.z);
                group.rotation = new BABYLON.Vector3(deg2rad(mc.rotation.x), deg2rad(mc.rotation.y), deg2rad(mc.rotation.z));
                // optimize meshes
                container.meshes.forEach((m) => {
                    if (m instanceof BABYLON.Mesh) {
                        m.forceSharedVertices();
                        //m.convertToUnIndexedMesh();
                        m.optimizeIndices();
                    }
                });
                container.materials.forEach((m) => {
                    m.freeze();
                });
                //container.addAllToScene();
                this.rootMesh = group;
                resolve(group);
            });
        });
    }
    createScreen(scene: BABYLON.Scene): GameMonitor {
        const mc = this.config.model;
        const sc = this.config.monitor;
        if (!sc) throw new Error("no monitor config");

        const crtbuilder = new CRTBuilder();

        const screen = crtbuilder.createCurvedSurface(scene);
        screen.parent = this.rootMesh;
        screen.scaling = new BABYLON.Vector3(sc.scaling.x, sc.scaling.y, sc.scaling.z);
        screen.position = new BABYLON.Vector3(sc.position.x, sc.position.y, sc.position.z);
        screen.rotation = new BABYLON.Vector3(deg2rad(sc.rotation.x), deg2rad(sc.rotation.y), deg2rad(sc.rotation.z));
        const screenMaterial = new BABYLON.StandardMaterial("mat", scene);
        screenMaterial.specularPower = sc.specular.power;
        screenMaterial.specularColor = new BABYLON.Color3(sc.specular.coeff, sc.specular.coeff, sc.specular.coeff);
        screenMaterial.diffuseColor = new BABYLON.Color3(sc.diffuse.level, sc.diffuse.level, sc.diffuse.level);
        const k = 0.05;
        screenMaterial.emissiveColor = new BABYLON.Color3(k,k,k);
        const myPlugin = new CRTShaderPluginMaterial(screenMaterial);
        screen.material = screenMaterial;

        // create backing surface
        const backing = crtbuilder.createBackingSurface(scene);
        backing.parent = this.rootMesh;
        backing.scaling = screen.scaling;
        backing.position = screen.position;
        backing.rotation = screen.rotation;
        // set to neutral color
        const backingMaterial = new BABYLON.StandardMaterial("mat", scene);
        backingMaterial.diffuseColor = new BABYLON.Color3(0,0,0);
        backingMaterial.specularColor = new BABYLON.Color3(0.1,0.1,0.1);
        backing.material = backingMaterial;

        // ffmpeg -i solarian-nes.mp4 -vcodec libvpx -acodec libvorbis solarian-nes-ff.webm
        // ffmpeg -i climber.gif -pix_fmt yuv420p climber.mp4
        const videoPath = this.config.game?.videoPath;
        if (!videoPath) throw new Error("no video path");
        const videoTexture = new BABYLON.VideoTexture("video", videoPath, scene, false, false);
        this.videoTexture = videoTexture;
        this.monitor = { material: screenMaterial, mesh: screen };
        // play video when visible
        this.monitor.mesh.onBeforeDrawObservable.add(() => {
            this.videoTimeout = 0;
            if (!this.videoIsPlaying && this.videoTexture && this.videoShouldPlay) {
                this.videoTexture.video.play();
                this.videoIsPlaying = true;
            }
        });
        this.monitor.mesh.onDisposeObservable.add(() => {
            this.stopVideo();
        });
        this.startVideo();
        return this.monitor;
    }
    startVideo() {
        if (this.monitor) {
            this.monitor.material.emissiveTexture = this.videoTexture;
        }
        this.videoShouldPlay = true;
        this.videoIdleTimer.start();
    }
    stopVideo() {
        this.videoTexture?.video.pause();
        this.videoShouldPlay = false;
        this.videoIsPlaying = false;
        this.videoIdleTimer.stop();
    }
    stopVideoIfNotInFrustum() {
        if (this.videoIsPlaying && this.videoTimeout++ > 0) {
            this.videoTexture?.video.pause();
            this.videoIsPlaying = false;
        }
    }
    createControlPanel(scene: BABYLON.Scene, wi: WorkerInterface) {
        // TODO: make config for this
        let cp = new CabinetControlPanel(scene, wi);
        cp.addJoystick(0, new BABYLON.Vector2(-0.15, 0));
        cp.addButton(0, ControllerKey.BTN_A, new BABYLON.Vector2(0.15, 0));
        cp.root.position = new BABYLON.Vector3(0, 0.775, 0);
        cp.root.parent = this.rootMesh;
    }
    clone() {
        if (!this.rootMesh) throw new Error("no root mesh");
        let clone = new GameCabinet(this.config);
        clone.rootMesh = this.rootMesh.clone("cabinet", null);
        // TODO?
        return clone;
    }
}
