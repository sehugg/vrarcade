import * as BABYLON from 'babylonjs'

export class CRTBuilder {

    n = 5; // # of verts each side 
    r = 1.7; // radius
    border = 0.5; // 50% of radius

    createCurvedSurface(scene: BABYLON.Scene) {

        const n = this.n;
        const r = this.r;
        const o = new BABYLON.Vector3(0,0,r);

        const paths = [];
        for (let yy=-n; yy<=n; yy++) {
            const path = [];
            for (let xx=-n; xx<=n; xx++) {
                let x = xx / (n*2);
                let y = yy / (n*2);
                // (x, y, √(r^2 - x^2 - y^2))
                let z = r - Math.sqrt(r*r - x*x - y*y);
                let p = new BABYLON.Vector3(x, y, z);
                path.push(p);
            }
            paths.push(path);
        }

        const ribbon = BABYLON.MeshBuilder.CreateRibbon("crt", {
            pathArray: paths,
            closePath: false,
            sideOrientation: BABYLON.Mesh.BACKSIDE
        }, scene);
        
        return ribbon;
    }

    createBackingSurface(scene: BABYLON.Scene) {
        const r = this.r;
        const xy = 0.5;
        const b = this.border + 1;
        let z = r - Math.sqrt(r*r - 2*xy*xy);

        const plane = BABYLON.MeshBuilder.CreatePlane("crt-backing", {
            size: b,
            sideOrientation: BABYLON.Mesh.FRONTSIDE
        }, scene);

        // add Z offset to all verts
        let positions = plane.getVerticesData(BABYLON.VertexBuffer.PositionKind);
        if (!positions) throw new Error("no positions");
        for (let i=0; i<positions.length; i+=3) {
            positions[i+2] = z;
        }
        plane.setVerticesData(BABYLON.VertexBuffer.PositionKind, positions);

        return plane;
    }
}
