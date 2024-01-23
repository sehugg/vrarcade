import * as BABYLON from 'babylonjs'
import earcut from 'earcut/dist/earcut.min.js';
(window as any).earcut = earcut;

export interface CabinetModelConfig {
    path?: string
    sideTexture?: string
    frontTexture?: string
    sideShape: [number, number][]
    sideWidth: number
    sideColor: { r: number, g: number, b: number }
    bodyShape: [number, number][]
    bodyVs: number[]
    bodyWidth: number
    bodyColor: { r: number, g: number, b: number }
}

export class CabinetModel {
    constructor(readonly config: CabinetModelConfig) {
    }
    createModel(scene: BABYLON.Scene): BABYLON.TransformNode {
        // create an extruded side panel
        let sideShape = this.config.sideShape.map((p) => {
            return new BABYLON.Vector3(p[0], 0, p[1]);
        });
        const leftUVs: BABYLON.Vector4[] = [
            new BABYLON.Vector4(0, 0, 1, 1),
            new BABYLON.Vector4(0, 0, 0, 0),
            new BABYLON.Vector4(0, 0, 0, 0),
        ];
        const leftMesh = BABYLON.MeshBuilder.ExtrudePolygon("left", {
            shape: sideShape,
            depth: this.config.sideWidth,
            faceUV: leftUVs,
            sideOrientation: BABYLON.Mesh.FRONTSIDE,
        }, scene);
        leftMesh.rotation.z = Math.PI / 2;
        leftMesh.position.x += - this.config.bodyWidth / 2 - this.config.sideWidth;

        // set a material on the side
        let sideMat = new BABYLON.StandardMaterial("sides", scene);
        sideMat.backFaceCulling = true;

        // load the side texture
        if (this.config.path && this.config.sideTexture) {
            let sideTexture = new BABYLON.Texture(this.config.path + this.config.sideTexture, scene);
            sideTexture.hasAlpha = false;
            sideMat.diffuseTexture = sideTexture;
        } else {
            let color = this.config.sideColor;
            sideMat.diffuseColor = new BABYLON.Color3(color.r, color.g, color.b);
        }
        leftMesh.material = sideMat;

        // create the right side
        //let rightMesh = leftMesh.clone("right");
        //rightMesh.position.x += this.config.bodyWidth + this.config.sideWidth;
        const rightUVs: BABYLON.Vector4[] = [
            new BABYLON.Vector4(0, 0, 0, 0),
            new BABYLON.Vector4(0, 0, 0, 0),
            new BABYLON.Vector4(1, 1, 0, 0),
        ];
        const rightMesh = BABYLON.MeshBuilder.ExtrudePolygon("right", {
            shape: sideShape,
            depth: this.config.sideWidth,
            faceUV: rightUVs,
            sideOrientation: BABYLON.Mesh.FRONTSIDE,
        }, scene);
        rightMesh.rotation.z = Math.PI / 2;
        rightMesh.position.x += this.config.bodyWidth / 2;
        rightMesh.material = sideMat;

        // Create the ribbon path for the body
        const paths : BABYLON.Vector3[][] = [];
        for (let p of this.config.bodyShape) {
            paths.push([
                new BABYLON.Vector3(p[0], 0, p[1]),
                new BABYLON.Vector3(p[0], this.config.bodyWidth, p[1]),
            ]);
        }

        // Create the ribbon mesh
        const bodyMesh = BABYLON.MeshBuilder.CreateRibbon("ribbon", {
            pathArray: paths, // Use an array of path arrays for multiple paths
            sideOrientation: BABYLON.Mesh.FRONTSIDE,
            closePath: false, // this is the bottom, which is left open
            updatable: false,
        }, scene);
        bodyMesh.rotation.z = Math.PI / 2;
        bodyMesh.position.x += this.config.bodyWidth / 2;

        // recalculate UVs
        let uvs = bodyMesh.getVerticesData(BABYLON.VertexBuffer.UVKind);
        if (uvs) {
            //console.log(uvs);
            let v = this.config.bodyVs;
            for (let i=0; i<uvs.length>>2; i++) {
                uvs[i*4] = 1;
                uvs[i*4+2] = 0;
                if (i < v.length) {
                    uvs[i*4+1] = v[i];
                    uvs[i*4+3] = v[i];
                } else {
                    uvs[i*4+1] = 1;
                    uvs[i*4+3] = 1;
                }
            }
            bodyMesh.setVerticesData(BABYLON.VertexBuffer.UVKind, uvs, true);
        }

        // set a material on the body
        let bodyMat = new BABYLON.StandardMaterial("body", scene);
        bodyMat.specularColor = new BABYLON.Color3(0.5, 0.5, 0.5);
        bodyMat.backFaceCulling = true;

        // load the texture
        if (this.config.path && this.config.frontTexture) {
            let frontTex = new BABYLON.Texture(this.config.path + this.config.frontTexture, scene);
            frontTex.hasAlpha = true;
            bodyMat.diffuseTexture = frontTex;
        } else {
            let color = this.config.bodyColor;
            bodyMat.diffuseColor = new BABYLON.Color3(color.r, color.g, color.b);
        }
        bodyMesh.material = bodyMat;

        // create the cabinet group
        let cabinet = new BABYLON.TransformNode("cabinet");
        leftMesh.parent = cabinet;
        rightMesh.parent = cabinet;
        bodyMesh.parent = cabinet;
        leftMesh.isPickable = false;
        rightMesh.isPickable = false;
        bodyMesh.isPickable = false;
        return cabinet;
    }
}
