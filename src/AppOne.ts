import * as BABYLON from 'babylonjs'
//import "@babylonjs/loaders/glTF";
import 'babylonjs-loaders';
import { ArcadeScene } from './arcade';
import { ARCADE_SCENE_CONFIG, CABINET_MAP } from './config';
import { WebXRGameController } from './webxr';

export class AppOne {

    engine: BABYLON.Engine;
    scene: BABYLON.Scene;

    constructor(readonly canvas: HTMLCanvasElement) {
        this.engine = new BABYLON.Engine(canvas)
        window.addEventListener('resize', () => {
            this.engine.resize();
        });
        this.scene = createScene(this.engine, this.canvas);
        BABYLON.Logger.LogLevels = BABYLON.Logger.AllLogLevel;
    }

    debug(debugOn: boolean = true) {
        if (debugOn) {
            this.scene.debugLayer.show({ overlay: true });
        } else {
            this.scene.debugLayer.hide();
        }
    }

    run() {
        const isDebug = import.meta.env.DEV;
        this.debug(isDebug);
        this.engine.runRenderLoop(() => {
            this.scene.render();
        });
    }
}



var createScene = function (engine: BABYLON.Engine, canvas: HTMLCanvasElement) {

    var scene = new BABYLON.Scene(engine);

    //CRTShaderPluginMaterial.register();

    const env = scene.createDefaultEnvironment({
        createGround: true
    });
    if (!env) throw new Error("no env");

    var camera = new BABYLON.FreeCamera("camera1", new BABYLON.Vector3(0, 1.6, -1), scene);
    camera.setTarget(new BABYLON.Vector3(0, 1.2, 0));
    camera.attachControl(canvas, true);
    // set free movement to slow
    camera.speed = 0.1;
    // set near distance plane
    camera.minZ = 0.025;

    new BABYLON.HemisphericLight("light1", new BABYLON.Vector3(0, 1, -1), scene);

    let gameController = new WebXRGameController(env, scene);
    let arcadeScene = new ArcadeScene(ARCADE_SCENE_CONFIG, CABINET_MAP, gameController);
    arcadeScene.load(scene);
    
    gameController.addXR();

    // callback every frame
    scene.onAfterActiveMeshesEvaluationObservable.add(() => {
        // TODO
    });

    /*
    const gl = new BABYLON.GlowLayer("glow", scene);
    gl.intensity = 20.5;
    gl.isEnabled = true;
    */

    return scene;
};
