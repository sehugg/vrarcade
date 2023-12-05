import { ArcadeSceneConfig, CabinetConfigMap } from "./arcade";
import { CabinetConfig } from "./cabinet";

const CABINET_MODEL_BASE = {
    model: {
        path: "./cabinets/pacman1/",
        filename: "pacman1.glb",
        position: { x: -0.32, y: 0, z: 0 },
        rotation: { x: 0, y: 0, z: 0 },
        scaling: { x: 0.14, y: 0.14, z: 0.14 },
    },
    monitor: {
        position: { x: -2.3, y: 7.8, z: -0.5 },
        scaling: { x: 2.5, y: 2.5, z: 2.5 },
        rotation: { x: 25, y: 180, z: 0 },
        diffuse: { level: 0.05 },
        specular: { power: 20, coeff: 0.10 },
    }
}

const CABINET_MODEL1: CabinetConfig = {
    ...CABINET_MODEL_BASE,
    game: {
        platform: "nes",
        romPath: "games/solarian/shoot2.c.rom",
        videoPath: "games/solarian/solarian-nes-ff.webm",
    }
};

const CABINET_MODEL2: CabinetConfig = {
    ...CABINET_MODEL_BASE,
    game: {
        platform: "nes",
        romPath: "games/climber/climber.nes",
        videoPath: "games/solarian/solarian-nes-ff.webm",
    }
};

const CABINET_SOLARIAN: CabinetConfig = {
    cabconfig: {
        path: "./cabinets/solarian/",
        sideTexture: "side-decal.png",
        frontTexture: "front-decal.png",
        sideShape: [
            [0, 0], [0.8, -0.1], [0.9, 0.1],
            [1.4, 0.1], [1.4, 0], [1.6, 0],
            [1.4, 0.5], [0, 0.5]
        ],
        sideWidth: 1.0/25,
        sideColor: {r:0.8, g:0.3, b:0.2},
        bodyShape: [
            [0, 0], [0.75, -0.1], [0.8, 0.1],
            [1.2, 0.5], [1.45, 0], [1.6, 0],
            [1.4, 0.5], [0, 0.5]
        ],
        bodyVs: [1-1, 1-616/924, 1-536/924, 1-197/924, 1-110/924, 1-0/924],
        bodyWidth: 0.6,
        bodyColor: {r:0.2, g:0.2, b:0.2},
    },
    monitor: {
        position: { x: 0, y: 1.013, z: 0.285 },
        scaling: { x: 0.43, y: 0.43, z: 0.43 },
        rotation: { x: 45, y: 0, z: 0 },
        diffuse: { level: 0.05 },
        specular: { power: 20, coeff: 0.10 },
    },
    game: {
        platform: "nes",
        romPath: "games/solarian/shoot2.c.rom",
        videoPath: "games/solarian/solarian-nes-ff.webm",
    }
};

const CABINET_CLIMBER: CabinetConfig = {
    cabconfig: {
        path: "./cabinets/climber/",
        sideTexture: "side-decal.png",
        frontTexture: "front-panel.png",
        sideShape: [
            [0, 0], [0.8, -0.1], [0.9, 0.1],
            [1.4, 0.1], [1.4, 0], [1.6, 0],
            [1.4, 0.5], [0, 0.5]
        ],
        sideWidth: 1.0/25,
        sideColor: {r:0.8, g:0.3, b:0.2},
        bodyShape: [
            [0, 0], [0.75, -0.1], [0.8, 0.1],
            [1.2, 0.5], [1.4, 0], [1.6, 0],
            [1.4, 0.5], [0, 0.5]
        ],
        bodyVs: [1-1, 1-630/962, 1-541/962, 1-170/962, 1-144/962, 1-0/962],
        bodyWidth: 0.6,
        bodyColor: {r:0.2, g:0.2, b:0.2},
    },
    monitor: {
        position: { x: 0, y: 0.990, z: 0.285 },
        scaling: { x: 0.43, y: 0.43, z: 0.43 },
        rotation: { x: 45, y: 0, z: 0 },
        diffuse: { level: 0.05 },
        specular: { power: 20, coeff: 0.10 },
    },
    game: {
        platform: "nes",
        romPath: "games/climber/climber.nes",
        videoPath: "games/climber/climber.mp4",
    }
};

export const CABINET_MAP: CabinetConfigMap = {
    "solarian": CABINET_SOLARIAN,
    "climber": CABINET_CLIMBER,
    //"old1": CABINET_MODEL1,
    //"old2": CABINET_MODEL2,
}

export const ARCADE_SCENE_CONFIG: ArcadeSceneConfig = {
    games: [
        {
            cabinetID: "solarian",
            position: { x: -0.5, z: 1 },
            rotation: 0,
        },
        {
            cabinetID: "climber",
            position: { x: 0.5, z: 1 },
            rotation: 0,
        }
        /*
        {
            cabinetID: "climber",
            position: { x: 1, z: 1 },
            rotation: 180,
        },
        {
            cabinetID: "solarian",
            position: { x: -1, z: 1 },
            rotation: 0,
        },
        */
    ]
}
