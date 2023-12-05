import * as BABYLON from 'babylonjs'
import { GameCabinet, GameMonitor } from "./cabinet";
import { WorkerInterface, ControllerKey } from "./types";

export class WebXRGameController {
    wi: WorkerInterface | null = null;
    xr: BABYLON.WebXRDefaultExperience | null = null;

    constructor(
        readonly env: BABYLON.EnvironmentHelper,
        readonly scene: BABYLON.Scene
    ) {
    }
    makeCabinetInteractive(cabinet: GameCabinet, screen: GameMonitor, wi: WorkerInterface) {
        // start the worker when the cabinet is clicked
        screen.mesh.actionManager = new BABYLON.ActionManager(this.scene);
        screen.mesh.actionManager.registerAction(new BABYLON.ExecuteCodeAction(
            BABYLON.ActionManager.OnPickTrigger, (evt) => {
                try {
                    console.log('clicked', cabinet.config.game);
                    this.activate(wi);
                } catch (e) {
                    console.log(e);
                }
            }
        ));
    }
    activate(wi: WorkerInterface) {
        this.deactivate();
        wi.resume();
        this.wi = wi;
        this.xr?.teleportation?.detach();
        // press start button
        /*
        this.wi?.controllerUpdate(0, ControllerKey.START_1P, 1);
        setTimeout(() => {
            this.wi?.controllerUpdate(0, ControllerKey.START_1P, 0);
        }, 500);
        */
    }
    deactivate() {
        this.wi?.pause();
        this.wi = null;
        this.xr?.teleportation?.attach();
    }
    async addXR() {
        let ground = this.env?.ground;
        if (!ground) return;
        // here we add XR support
        const xr = await this.scene.createDefaultXRExperienceAsync({
            uiOptions: {
                sessionMode: "immersive-ar",
            },
            //optionalFeatures: true,
            floorMeshes: [ground],
        });
        this.xr = xr;
        const featuresManager = xr.baseExperience.featuresManager;
        const xrBackgroundRemover = featuresManager.enableFeature(BABYLON.WebXRBackgroundRemover);

        // handle webxr controllers
        xr.input.onControllerAddedObservable.add((xrController) => {
            xrController.onMotionControllerInitObservable.add((motionController) => {
                // TODO: make controller mapping configurable
                const hat = motionController.getComponentOfType("thumbstick");
                if (hat) {
                    hat.onAxisValueChangedObservable.add((axes) => {
                        this.wi?.controllerUpdate(0, ControllerKey.LEFT, axes.x < -0.5 ? 1 : 0);
                        this.wi?.controllerUpdate(0, ControllerKey.RIGHT, axes.x > 0.5 ? 1 : 0);
                        this.wi?.controllerUpdate(0, ControllerKey.UP, axes.y < -0.5 ? 1 : 0);
                        this.wi?.controllerUpdate(0, ControllerKey.DOWN, axes.y > 0.5 ? 1 : 0);
                    });
                    hat.onButtonStateChangedObservable.add((component) => {
                        this.wi?.controllerUpdate(0, ControllerKey.BTN_B, component.pressed ? 1 : 0);
                    });
                }
                const trigger = motionController.getComponentOfType("trigger");
                if (trigger) {
                    trigger.onButtonStateChangedObservable.add((component) => {
                        this.wi?.controllerUpdate(0, ControllerKey.BTN_A, component.pressed ? 1 : 0);
                    });
                }
                const button = motionController.getComponentOfType("button");
                if (button) {
                    button.onButtonStateChangedObservable.add((component) => {
                        if (component.pressed) {
                            this.deactivate();
                        }
                    });
                }
            });
        });
    }
}
