import * as BABYLON from 'babylonjs'
import { ControllerKey, WorkerInterface } from './types';

export class CabinetControlPanel {

    root: BABYLON.TransformNode;
    joystickRed: BABYLON.StandardMaterial;

    constructor(
        readonly scene: BABYLON.Scene,
        readonly wi: WorkerInterface
    ) {
        this.root = new BABYLON.TransformNode("controlpanel", scene);
        this.joystickRed = new BABYLON.StandardMaterial("joystickmat");
        this.joystickRed.diffuseColor = new BABYLON.Color3(1, 0.2, 0.2);
    }
    addJoystick(controller: number, loc: BABYLON.Vector2) {
        const height = 0.05;
        const ball = BABYLON.MeshBuilder.CreateSphere("joystick", { diameter: 0.05 });
        ball.position.x = loc.x;
        ball.position.y = height;
        ball.position.z = loc.y;
        ball.parent = this.root;
        ball.material = this.joystickRed;
        // create cylinder for stick
        const stick = BABYLON.MeshBuilder.CreateCylinder("stick", { height, diameter: 0.01 });
        stick.position.x = loc.x;
        stick.position.y = height / 2;
        stick.position.z = loc.y;
        stick.parent = this.root;
        // create a little washer at the bottom
        const washer = BABYLON.MeshBuilder.CreateCylinder("washer", { height: 0.01, diameter: 0.05 });
        washer.position.x = loc.x;
        washer.position.y = 0;
        washer.position.z = loc.y;
        washer.parent = this.root;
        // make joystick interactive
        let actionManager = new BABYLON.ActionManager(this.scene);
        ball.actionManager = actionManager;
        // when hand gets near, figure out what direction
        // and how far it is from the center
        // TODO
        /*
        let lastX = 0;
        let lastY = 0;
        actionManager.registerAction(new BABYLON.ExecuteCodeAction(
            BABYLON.ActionManager.OnPointerOverTrigger,
            (evt) => {
                lastX = evt.pointerX;
                lastY = evt.pointerY;
            }
        ));
        actionManager.registerAction(new BABYLON.ExecuteCodeAction(
            BABYLON.ActionManager.OnPointerOutTrigger,
            (evt) => {
                let dx = evt.pointerX - lastX;
                let dy = evt.pointerY - lastY;
                this.wi.controllerUpdate(controller, ControllerKey.LEFT, dx < 0 ? 1 : 0);
                this.wi.controllerUpdate(controller, ControllerKey.RIGHT, dx > 0 ? 1 : 0);
                this.wi.controllerUpdate(controller, ControllerKey.UP, dy < 0 ? 1 : 0);
                this.wi.controllerUpdate(controller, ControllerKey.DOWN, dy > 0 ? 1 : 0);
            }));
        */
        return ball;
    }
    addButton(controller: number, key: number, loc: BABYLON.Vector2) {
        // a button is an inverted code surrounded by a cylinder
        const h = 0.01;
        const r = 0.05;
        const k = 0.7;

        const button = BABYLON.MeshBuilder.CreateCylinder("button", {
            height: h,
            diameterBottom: r,
            diameterTop: r * k
        });
        button.position.x = loc.x;
        button.position.y = h;
        button.position.z = loc.y;
        button.parent = this.root;
        button.material = this.joystickRed;

        // make it interactive
        let actionManager = new BABYLON.ActionManager(this.scene);
        button.actionManager = actionManager;
        actionManager.registerAction(new BABYLON.ExecuteCodeAction(
            BABYLON.ActionManager.OnPickTrigger, (evt) => {
                this.wi.controllerUpdate(0, key, 1);
                setTimeout(() => {
                    this.wi.controllerUpdate(0, key, 0);
                }, 100);
            }));
        // trigger when hand moves close to button
        actionManager.registerAction(new BABYLON.ExecuteCodeAction(
            BABYLON.ActionManager.OnPointerOverTrigger, (evt) => {
                this.wi.controllerUpdate(controller, key, 1);
            }));
        actionManager.registerAction(new BABYLON.ExecuteCodeAction(
            BABYLON.ActionManager.OnPointerOutTrigger, (evt) => {
                this.wi.controllerUpdate(controller, key, 0);
            }));

        return button;
    }
}
