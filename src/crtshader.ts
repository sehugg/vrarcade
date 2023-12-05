import * as BABYLON from 'babylonjs'

// https://doc.babylonjs.com/features/featuresDeepDive/materials/using/materialPlugins
// https://filthypants.blogspot.com/2020/02/crt-shader-masks.html

const SHADER_FUNCS = `
#define PI 3.1415926538

varying vec2 vUV;
varying vec4 vPosition;

const float kd = 0.1;

vec2 curveRemapUV(vec2 uv)
{
    // as we near the edge of our screen apply greater distortion using a sinusoid.
    uv = uv * 2.0 - 1.0;
    vec2 offset = abs(uv.yx) / vec2(kd, kd); // curvature
    uv = uv + uv * offset * offset;
    uv = uv * 0.5 + 0.5;
    return uv;
}

vec3 scanLineIntensity(float uv, float resolution, float opacity)
{
    float intensity = sin(uv * resolution * PI * 2.0);
    intensity = ((0.5 * intensity) + 0.5) * 0.9 + 0.1;
    return vec3(pow(intensity, opacity));
}

const vec3 green = vec3(0.0, 2.0, 0.0);
const vec3 magenta = vec3(2.0, 0.0, 2.0);

vec3 dotmaskIntensity(float uv, float resolution, float opacity)
{
    float intensity = sin(uv * resolution * PI * 2.0);
    vec3 mask = intensity > 0.0 ? green : magenta;
    vec3 color = vec3(pow(abs(intensity), opacity));
    return mix(mask, color, 1.0 - opacity);
}

vec3 dotmaskColor(vec2 vUV)
{
    vec2 uv = vUV; //curveRemapUV(vec2(vUV.x, vUV.y));
    // opacity is proportional to distance from vertex position
    vec3 eyepos = vEyePosition.xyz - vPositionW;
    float eyedist = length(eyepos);
    float mindist = 0.7;
    if (eyedist < mindist) {
        float opacity = pow(1.0 - eyedist / mindist, 4.0);
        vec3 ivert = scanLineIntensity(uv.y, 256.0, opacity);
        vec3 ihoriz = dotmaskIntensity(uv.x, 256.0, opacity);
        return ivert * ihoriz;
    } else {
        return vec3(1.0, 1.0, 1.0);
    }
}
`;

/**
 * Extend from MaterialPluginBase to create your plugin.
 */
export class CRTShaderPluginMaterial extends BABYLON.MaterialPluginBase {
    constructor(material: BABYLON.Material) {
        // the second parameter is the name of this plugin.
        // the third one is a priority, which lets you define the order multiple plugins are run. Lower numbers run first.
        // the fourth one is a list of defines used in the shader code.
        super(material, "CRTShader", 200, { CRTSHADER: false });

        // enable by default
        this._enable(true);
    }

    // Also, you should always associate a define with your plugin because the list of defines (and their values)
    // is what triggers a recompilation of the shader: a shader is recompiled only if a value of a define changes.
    prepareDefines(defines: BABYLON.MaterialDefines, scene: BABYLON.Scene, mesh: BABYLON.AbstractMesh) {
        defines["CRTSHADER"] = true;
    }

    getClassName() {
        return "BlackAndWhitePluginMaterial";
    }

    getCustomCode(shaderType: "vertex" | "fragment"): any {
        if (shaderType === "fragment") {
            // we're adding this specific code at the end of the main() function
            return {
                CUSTOM_FRAGMENT_DEFINITIONS: SHADER_FUNCS,
                "!\\*vEmissiveInfos.y;": "* vEmissiveInfos.y * dotmaskColor(vEmissiveUV);",
            };
        }
        // for other shader types we're not doing anything, return null
        return null;
    }

    static register() {
        BABYLON.RegisterMaterialPlugin("CRTShader", (material: any) => {
            material.CRTShader = new CRTShaderPluginMaterial(material);
            return material.CRTShader;
        });
    }
}
