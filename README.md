# 8bitworkshop VR Arcade

Demo: 

* Open the WebXR browser on your VR headset
* Go to [https://sehugg.github.io/vrarcade](https://sehugg.github.io/vrarcade/) (or use [Oculus launch link](https://www.oculus.com/open_url/?url=https://sehugg.github.io/vrarcade/))

To play a game, point at its screen and pull the trigger.

Control the game with the thumbstick and trigger on your motion controller.

The virtual stick and buttons look nice, but are not yet functional,
so you can't play with hand-tracking yet.

![image](https://github.com/sehugg/vrarcade/assets/84127/32037b15-178b-4774-950c-876ed2306fe7)

## Description

This project uses WebXR to create playable arcade cabinets in immersive augmented reality!

* Use your own ROM
* Customize your cabinet shape and artwork
* Place multiple cabinets wherever you want
* Click the screen to start the game!


## Development

- clone or download the repo
- `npm i`
- For development: `npm run dev`
- For production: `npm run build` then to preview what was built `npm run preview` (contents are in dist/ folder)


## Customization

To create your own games:

* Edit [config.ts](src/config.ts) to add your own cabinet definitions.
* Modify `CABINET_MAP` to map identifiers to cabinet configs.
* Modify `ARCADE_SCENE_CONFIG` to place cabinets around the room.

## ROMs

Look at `public/games` for ROM and video examples.
Only the NES platform is supported right now.

## Parametric model

This creates cabinets using JSON objects and a couple of JPG/PNG files.
Look at `CABINET_SOLARIAN` and `CABINET_CLIMBER` for examples.
Also look at `public/cabinets` for texture maps.

## Using your own model (in .glb format)

Look at `CABINET_MODEL_BASE` for an example.
(Model-based cabinets are not used in the current demo.)

