/*!
 * @pixiv/three-vrm-materials-mtoon v3.1.4
 * MToon (toon material) module for @pixiv/three-vrm
 *
 * Copyright (c) 2019-2024 pixiv Inc.
 * @pixiv/three-vrm-materials-mtoon is distributed under MIT License
 * https://github.com/pixiv/three-vrm/blob/release/LICENSE
 */
"use strict";
var __create = Object.create;
var __defProp = Object.defineProperty;
var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __getProtoOf = Object.getPrototypeOf;
var __hasOwnProp = Object.prototype.hasOwnProperty;
var __export = (target, all) => {
  for (var name in all)
    __defProp(target, name, { get: all[name], enumerable: true });
};
var __copyProps = (to, from, except, desc) => {
  if (from && typeof from === "object" || typeof from === "function") {
    for (let key of __getOwnPropNames(from))
      if (!__hasOwnProp.call(to, key) && key !== except)
        __defProp(to, key, { get: () => from[key], enumerable: !(desc = __getOwnPropDesc(from, key)) || desc.enumerable });
  }
  return to;
};
var __toESM = (mod, isNodeMode, target) => (target = mod != null ? __create(__getProtoOf(mod)) : {}, __copyProps(
  // If the importer is in node compatibility mode or this is not an ESM
  // file that has been converted to a CommonJS file using a Babel-
  // compatible transform (i.e. "__esModule" has not been set), then set
  // "default" to the CommonJS "module.exports" for node compatibility.
  isNodeMode || !mod || !mod.__esModule ? __defProp(target, "default", { value: mod, enumerable: true }) : target,
  mod
));
var __toCommonJS = (mod) => __copyProps(__defProp({}, "__esModule", { value: true }), mod);

// src/nodes/index.ts
var nodes_exports = {};
__export(nodes_exports, {
  MToonAnimatedUVNode: () => MToonAnimatedUVNode,
  MToonLightingModel: () => MToonLightingModel,
  MToonNodeMaterial: () => MToonNodeMaterial
});
module.exports = __toCommonJS(nodes_exports);

// src/nodes/warningIfPre161.ts
var THREE = __toESM(require("three"), 1);
var threeRevision = parseInt(THREE.REVISION, 10);
if (threeRevision < 167) {
  console.warn(
    `MToonNodeMaterial requires Three.js r167 or higher (You are using r${threeRevision}). This would not work correctly.`
  );
}

// src/nodes/MToonAnimatedUVNode.ts
var THREE3 = __toESM(require("three/webgpu"), 1);

// src/nodes/materialReferences.ts
var THREE2 = __toESM(require("three/webgpu"), 1);
var refColor = THREE2.materialReference("color", "color");
var refMap = THREE2.materialReference("map", "texture");
var refNormalMap = THREE2.materialReference("normalMap", "texture");
var refNormalScale = THREE2.materialReference("normalScale", "vec2");
var refEmissive = THREE2.materialReference("emissive", "color");
var refEmissiveIntensity = THREE2.materialReference("emissiveIntensity", "float");
var refEmissiveMap = THREE2.materialReference("emissiveMap", "texture");
var refShadeColorFactor = THREE2.materialReference("shadeColorFactor", "color");
var refShadingShiftFactor = THREE2.materialReference("shadingShiftFactor", "float");
var refShadeMultiplyTexture = THREE2.materialReference("shadeMultiplyTexture", "texture");
var refShadeMultiplyTextureScale = THREE2.materialReference("shadeMultiplyTextureScale", "float");
var refShadingToonyFactor = THREE2.materialReference("shadingToonyFactor", "float");
var refRimLightingMixFactor = THREE2.materialReference("rimLightingMixFactor", "float");
var refRimMultiplyTexture = THREE2.materialReference("rimMultiplyTexture", "texture");
var refMatcapFactor = THREE2.materialReference("matcapFactor", "color");
var refMatcapTexture = THREE2.materialReference("matcapTexture", "texture");
var refParametricRimColorFactor = THREE2.materialReference("parametricRimColorFactor", "color");
var refParametricRimLiftFactor = THREE2.materialReference("parametricRimLiftFactor", "float");
var refParametricRimFresnelPowerFactor = THREE2.materialReference("parametricRimFresnelPowerFactor", "float");
var refOutlineWidthMultiplyTexture = THREE2.materialReference("outlineWidthMultiplyTexture", "texture");
var refOutlineWidthFactor = THREE2.materialReference("outlineWidthFactor", "float");
var refOutlineColorFactor = THREE2.materialReference("outlineColorFactor", "color");
var refOutlineLightingMixFactor = THREE2.materialReference("outlineLightingMixFactor", "float");
var refUVAnimationMaskTexture = THREE2.materialReference("uvAnimationMaskTexture", "texture");
var refUVAnimationScrollXOffset = THREE2.materialReference("uvAnimationScrollXOffset", "float");
var refUVAnimationScrollYOffset = THREE2.materialReference("uvAnimationScrollYOffset", "float");
var refUVAnimationRotationPhase = THREE2.materialReference("uvAnimationRotationPhase", "float");

// src/nodes/MToonAnimatedUVNode.ts
var MToonAnimatedUVNode = class extends THREE3.TempNode {
  constructor(hasMaskTexture) {
    super("vec2");
    this.hasMaskTexture = hasMaskTexture;
  }
  setup() {
    let uvAnimationMask = 1;
    if (this.hasMaskTexture) {
      uvAnimationMask = THREE3.vec4(refUVAnimationMaskTexture).context({ getUV: () => THREE3.uv() }).r;
    }
    let uv2 = THREE3.uv();
    const phase = refUVAnimationRotationPhase.mul(uvAnimationMask);
    const c = THREE3.cos(phase);
    const s = THREE3.sin(phase);
    uv2 = uv2.sub(THREE3.vec2(0.5, 0.5));
    uv2 = uv2.mul(THREE3.mat2(c, s, s.negate(), c));
    uv2 = uv2.add(THREE3.vec2(0.5, 0.5));
    const scroll = THREE3.vec2(refUVAnimationScrollXOffset, refUVAnimationScrollYOffset).mul(uvAnimationMask);
    uv2 = uv2.add(scroll);
    return uv2.temp("AnimatedUV");
  }
};

// src/nodes/MToonLightingModel.ts
var THREE6 = __toESM(require("three/webgpu"), 1);

// src/nodes/immutableNodes.ts
var THREE4 = __toESM(require("three/webgpu"), 1);
var shadeColor = THREE4.nodeImmutable(THREE4.PropertyNode, "vec3").temp("ShadeColor");
var shadingShift = THREE4.nodeImmutable(THREE4.PropertyNode, "float").temp("ShadingShift");
var shadingToony = THREE4.nodeImmutable(THREE4.PropertyNode, "float").temp("ShadingToony");
var rimLightingMix = THREE4.nodeImmutable(THREE4.PropertyNode, "float").temp("RimLightingMix");
var rimMultiply = THREE4.nodeImmutable(THREE4.PropertyNode, "vec3").temp("RimMultiply");
var matcap = THREE4.nodeImmutable(THREE4.PropertyNode, "vec3").temp("matcap");
var parametricRim = THREE4.nodeImmutable(THREE4.PropertyNode, "vec3").temp("ParametricRim");

// src/nodes/utils/FnCompat.ts
var THREE5 = __toESM(require("three/webgpu"), 1);
var FnCompat = (jsFunc) => {
  const threeRevision2 = parseInt(THREE5.REVISION, 10);
  if (threeRevision2 >= 168) {
    return THREE5.Fn(jsFunc);
  } else {
    return THREE5.tslFn(jsFunc);
  }
};

// src/nodes/MToonLightingModel.ts
var linearstep = FnCompat(
  ({
    a,
    b,
    t
  }) => {
    const top = t.sub(a);
    const bottom = b.sub(a);
    return top.div(bottom).clamp();
  }
);
var getShading = FnCompat(({ dotNL }) => {
  const shadow = 1;
  const feather = THREE6.float(1).sub(shadingToony);
  let shading = dotNL.add(shadingShift);
  shading = linearstep({
    a: feather.negate(),
    b: feather,
    t: shading
  });
  shading = shading.mul(shadow);
  return shading;
});
var getDiffuse = FnCompat(
  ({
    shading,
    lightColor
  }) => {
    const diffuseColor3 = THREE6.mix(shadeColor, THREE6.diffuseColor, shading);
    const col = lightColor.mul(THREE6.BRDF_Lambert({ diffuseColor: diffuseColor3 }));
    return col;
  }
);
var MToonLightingModel = class extends THREE6.LightingModel {
  constructor() {
    super();
  }
  direct({ lightDirection, lightColor, reflectedLight }) {
    const dotNL = THREE6.transformedNormalView.dot(lightDirection).clamp(-1, 1);
    const shading = getShading({
      dotNL
    });
    reflectedLight.directDiffuse.assign(
      reflectedLight.directDiffuse.add(
        getDiffuse({
          shading,
          lightColor
        })
      )
    );
    reflectedLight.directSpecular.assign(
      reflectedLight.directSpecular.add(
        parametricRim.add(matcap).mul(rimMultiply).mul(THREE6.mix(THREE6.vec3(0), THREE6.BRDF_Lambert({ diffuseColor: lightColor }), rimLightingMix))
      )
    );
  }
  indirect(context) {
    this.indirectDiffuse(context);
    this.indirectSpecular(context);
  }
  indirectDiffuse({ irradiance, reflectedLight }) {
    reflectedLight.indirectDiffuse.assign(
      reflectedLight.indirectDiffuse.add(
        irradiance.mul(
          THREE6.BRDF_Lambert({
            diffuseColor: THREE6.diffuseColor
          })
        )
      )
    );
  }
  indirectSpecular({ reflectedLight }) {
    reflectedLight.indirectSpecular.assign(
      reflectedLight.indirectSpecular.add(
        parametricRim.add(matcap).mul(rimMultiply).mul(THREE6.mix(THREE6.vec3(1), THREE6.vec3(0), rimLightingMix))
      )
    );
  }
};

// src/nodes/MToonNodeMaterial.ts
var THREE8 = __toESM(require("three/webgpu"), 1);

// src/MToonMaterialOutlineWidthMode.ts
var MToonMaterialOutlineWidthMode = {
  None: "none",
  WorldCoordinates: "worldCoordinates",
  ScreenCoordinates: "screenCoordinates"
};

// src/nodes/mtoonParametricRim.ts
var THREE7 = __toESM(require("three/webgpu"), 1);
var mtoonParametricRim = FnCompat(
  ({
    parametricRimLift,
    parametricRimFresnelPower,
    parametricRimColor
  }) => {
    const viewDir = THREE7.modelViewPosition.normalize();
    const dotNV = THREE7.transformedNormalView.dot(viewDir.negate());
    const rim = THREE7.float(1).sub(dotNV).add(parametricRimLift).clamp().pow(parametricRimFresnelPower);
    return rim.mul(parametricRimColor);
  }
);

// src/nodes/MToonNodeMaterial.ts
var MToonNodeMaterial = class extends THREE8.NodeMaterial {
  customProgramCacheKey() {
    let cacheKey = super.customProgramCacheKey();
    cacheKey += `isOutline:${this.isOutline},`;
    return cacheKey;
  }
  /**
   * Readonly boolean that indicates this is a {@link MToonNodeMaterial}.
   */
  get isMToonNodeMaterial() {
    return true;
  }
  constructor(parameters = {}) {
    super();
    if (parameters.transparentWithZWrite) {
      parameters.depthWrite = true;
    }
    delete parameters.transparentWithZWrite;
    delete parameters.giEqualizationFactor;
    delete parameters.v0CompatShade;
    delete parameters.debugMode;
    this.emissiveNode = null;
    this.lights = true;
    this.color = new THREE8.Color(1, 1, 1);
    this.map = null;
    this.emissive = new THREE8.Color(0, 0, 0);
    this.emissiveIntensity = 1;
    this.emissiveMap = null;
    this.normalMap = null;
    this.normalScale = new THREE8.Vector2(1, 1);
    this.shadeColorFactor = new THREE8.Color(0, 0, 0);
    this.shadeMultiplyTexture = null;
    this.shadingShiftFactor = 0;
    this.shadingShiftTexture = null;
    this.shadingShiftTextureScale = 1;
    this.shadingToonyFactor = 0.9;
    this.rimLightingMixFactor = 1;
    this.rimMultiplyTexture = null;
    this.matcapFactor = new THREE8.Color(1, 1, 1);
    this.matcapTexture = null;
    this.parametricRimColorFactor = new THREE8.Color(0, 0, 0);
    this.parametricRimLiftFactor = 0;
    this.parametricRimFresnelPowerFactor = 5;
    this.outlineWidthMode = MToonMaterialOutlineWidthMode.None;
    this.outlineWidthMultiplyTexture = null;
    this.outlineWidthFactor = 0;
    this.outlineColorFactor = new THREE8.Color(0, 0, 0);
    this.outlineLightingMixFactor = 1;
    this.uvAnimationScrollXSpeedFactor = 0;
    this.uvAnimationScrollYSpeedFactor = 0;
    this.uvAnimationRotationSpeedFactor = 0;
    this.uvAnimationMaskTexture = null;
    this.shadeColorNode = null;
    this.shadingShiftNode = null;
    this.shadingToonyNode = null;
    this.rimLightingMixNode = null;
    this.rimMultiplyNode = null;
    this.matcapNode = null;
    this.parametricRimColorNode = null;
    this.parametricRimLiftNode = null;
    this.parametricRimFresnelPowerNode = null;
    this.uvAnimationScrollXOffset = 0;
    this.uvAnimationScrollYOffset = 0;
    this.uvAnimationRotationPhase = 0;
    this.isOutline = false;
    this._animatedUVNode = null;
    this.setValues(parameters);
  }
  setupLightingModel() {
    return new MToonLightingModel();
  }
  setup(builder) {
    var _a;
    this._animatedUVNode = new MToonAnimatedUVNode(
      (_a = this.uvAnimationMaskTexture && this.uvAnimationMaskTexture.isTexture === true) != null ? _a : false
    );
    super.setup(builder);
  }
  setupDiffuseColor(builder) {
    let tempColorNode = null;
    if (this.colorNode == null) {
      tempColorNode = refColor;
      if (this.map && this.map.isTexture === true) {
        const map = refMap.context({ getUV: () => this._animatedUVNode });
        tempColorNode = tempColorNode.mul(map);
      }
      this.colorNode = tempColorNode;
    }
    if (this.vertexColors === true && builder.geometry.hasAttribute("color")) {
      console.warn(
        "MToonNodeMaterial: MToon ignores vertex colors. Consider using a model without vertex colors instead."
      );
      this.vertexColors = false;
    }
    super.setupDiffuseColor(builder);
    if (parseInt(THREE8.REVISION, 10) < 166) {
      if (this.transparent === false && this.blending === THREE8.NormalBlending && this.alphaToCoverage === false) {
        THREE8.diffuseColor.a.assign(1);
      }
    }
    if (this.colorNode === tempColorNode) {
      this.colorNode = null;
    }
  }
  setupVariants() {
    shadeColor.assign(this._setupShadeColorNode());
    shadingShift.assign(this._setupShadingShiftNode());
    shadingToony.assign(this._setupShadingToonyNode());
    rimLightingMix.assign(this._setupRimLightingMixNode());
    rimMultiply.assign(this._setupRimMultiplyNode());
    matcap.assign(this._setupMatcapNode());
    parametricRim.assign(this._setupParametricRimNode());
  }
  setupNormal(builder) {
    const tempNormalNode = this.normalNode;
    if (this.normalNode == null) {
      this.normalNode = THREE8.materialNormal;
      if (this.normalMap && this.normalMap.isTexture === true) {
        const map = refNormalMap.context({ getUV: () => this._animatedUVNode });
        this.normalNode = THREE8.normalMap(map, refNormalScale);
      }
      if (this.isOutline) {
        this.normalNode = this.normalNode.negate();
      }
    }
    const threeRevision2 = parseInt(THREE8.REVISION, 10);
    if (threeRevision2 >= 168) {
      const ret = this.normalNode;
      this.normalNode = tempNormalNode;
      return ret;
    } else {
      super.setupNormal(builder);
      this.normalNode = tempNormalNode;
      return void 0;
    }
  }
  setupLighting(builder) {
    let tempEmissiveNode = null;
    if (this.emissiveNode == null) {
      tempEmissiveNode = refEmissive.mul(refEmissiveIntensity);
      if (this.emissiveMap && this.emissiveMap.isTexture === true) {
        const map = refEmissiveMap.context({ getUV: () => this._animatedUVNode });
        tempEmissiveNode = tempEmissiveNode.mul(map);
      }
      this.emissiveNode = tempEmissiveNode;
    }
    const ret = super.setupLighting(builder);
    if (this.emissiveNode === tempEmissiveNode) {
      this.emissiveNode = null;
    }
    return ret;
  }
  setupOutput(builder, outputNode) {
    if (this.isOutline && this.outlineWidthMode !== MToonMaterialOutlineWidthMode.None) {
      outputNode = THREE8.vec4(
        THREE8.mix(refOutlineColorFactor, outputNode.xyz.mul(refOutlineColorFactor), refOutlineLightingMixFactor),
        outputNode.w
      );
    }
    return super.setupOutput(builder, outputNode);
  }
  setupPosition(builder) {
    var _a, _b;
    const tempPositionNode = this.positionNode;
    if (this.isOutline && this.outlineWidthMode !== MToonMaterialOutlineWidthMode.None) {
      (_a = this.positionNode) != null ? _a : this.positionNode = THREE8.positionLocal;
      const normalLocal2 = THREE8.normalLocal.normalize();
      let width = refOutlineWidthFactor;
      if (this.outlineWidthMultiplyTexture && this.outlineWidthMultiplyTexture.isTexture === true) {
        const map = refOutlineWidthMultiplyTexture.context({ getUV: () => this._animatedUVNode });
        width = width.mul(map);
      }
      const worldNormalLength = THREE8.length(THREE8.modelNormalMatrix.mul(normalLocal2));
      const outlineOffset = width.mul(worldNormalLength).mul(normalLocal2);
      if (this.outlineWidthMode === MToonMaterialOutlineWidthMode.WorldCoordinates) {
        this.positionNode = this.positionNode.add(outlineOffset);
      } else if (this.outlineWidthMode === MToonMaterialOutlineWidthMode.ScreenCoordinates) {
        const clipScale = THREE8.cameraProjectionMatrix.element(1).element(1);
        this.positionNode = this.positionNode.add(
          outlineOffset.div(clipScale).mul(THREE8.positionView.z.negate())
        );
      }
      (_b = this.positionNode) != null ? _b : this.positionNode = THREE8.positionLocal;
    }
    const ret = super.setupPosition(builder);
    ret.z.add(ret.w.mul(1e-6));
    this.positionNode = tempPositionNode;
    return ret;
  }
  copy(source) {
    var _a, _b, _c, _d, _e, _f, _g, _h, _i, _j, _k, _l, _m, _n, _o, _p, _q, _r, _s;
    this.color.copy(source.color);
    this.map = (_a = source.map) != null ? _a : null;
    this.emissive.copy(source.emissive);
    this.emissiveIntensity = source.emissiveIntensity;
    this.emissiveMap = (_b = source.emissiveMap) != null ? _b : null;
    this.normalMap = (_c = source.normalMap) != null ? _c : null;
    this.normalScale.copy(source.normalScale);
    this.shadeColorFactor.copy(source.shadeColorFactor);
    this.shadeMultiplyTexture = (_d = source.shadeMultiplyTexture) != null ? _d : null;
    this.shadingShiftFactor = source.shadingShiftFactor;
    this.shadingShiftTexture = (_e = source.shadingShiftTexture) != null ? _e : null;
    this.shadingShiftTextureScale = source.shadingShiftTextureScale;
    this.shadingToonyFactor = source.shadingToonyFactor;
    this.rimLightingMixFactor = source.rimLightingMixFactor;
    this.rimMultiplyTexture = (_f = source.rimMultiplyTexture) != null ? _f : null;
    this.matcapFactor.copy(source.matcapFactor);
    this.matcapTexture = (_g = source.matcapTexture) != null ? _g : null;
    this.parametricRimColorFactor.copy(source.parametricRimColorFactor);
    this.parametricRimLiftFactor = source.parametricRimLiftFactor;
    this.parametricRimFresnelPowerFactor = source.parametricRimFresnelPowerFactor;
    this.outlineWidthMode = source.outlineWidthMode;
    this.outlineWidthMultiplyTexture = (_h = source.outlineWidthMultiplyTexture) != null ? _h : null;
    this.outlineWidthFactor = source.outlineWidthFactor;
    this.outlineColorFactor.copy(source.outlineColorFactor);
    this.outlineLightingMixFactor = source.outlineLightingMixFactor;
    this.uvAnimationScrollXSpeedFactor = source.uvAnimationScrollXSpeedFactor;
    this.uvAnimationScrollYSpeedFactor = source.uvAnimationScrollYSpeedFactor;
    this.uvAnimationRotationSpeedFactor = source.uvAnimationRotationSpeedFactor;
    this.uvAnimationMaskTexture = (_i = source.uvAnimationMaskTexture) != null ? _i : null;
    this.shadeColorNode = (_j = source.shadeColorNode) != null ? _j : null;
    this.shadingShiftNode = (_k = source.shadingShiftNode) != null ? _k : null;
    this.shadingToonyNode = (_l = source.shadingToonyNode) != null ? _l : null;
    this.rimLightingMixNode = (_m = source.rimLightingMixNode) != null ? _m : null;
    this.rimMultiplyNode = (_n = source.rimMultiplyNode) != null ? _n : null;
    this.matcapNode = (_o = source.matcapNode) != null ? _o : null;
    this.parametricRimColorNode = (_p = source.parametricRimColorNode) != null ? _p : null;
    this.parametricRimLiftNode = (_q = source.parametricRimLiftNode) != null ? _q : null;
    this.parametricRimFresnelPowerNode = (_r = source.parametricRimFresnelPowerNode) != null ? _r : null;
    this.isOutline = (_s = source.isOutline) != null ? _s : null;
    return super.copy(source);
  }
  update(delta) {
    this.uvAnimationScrollXOffset += delta * this.uvAnimationScrollXSpeedFactor;
    this.uvAnimationScrollYOffset += delta * this.uvAnimationScrollYSpeedFactor;
    this.uvAnimationRotationPhase += delta * this.uvAnimationRotationSpeedFactor;
  }
  _setupShadeColorNode() {
    if (this.shadeColorNode != null) {
      return THREE8.vec3(this.shadeColorNode);
    }
    let shadeColorNode = refShadeColorFactor;
    if (this.shadeMultiplyTexture && this.shadeMultiplyTexture.isTexture === true) {
      const map = refShadeMultiplyTexture.context({ getUV: () => this._animatedUVNode });
      shadeColorNode = shadeColorNode.mul(map);
    }
    return shadeColorNode;
  }
  _setupShadingShiftNode() {
    if (this.shadingShiftNode != null) {
      return THREE8.float(this.shadingShiftNode);
    }
    let shadingShiftNode = refShadingShiftFactor;
    if (this.shadingShiftTexture && this.shadingShiftTexture.isTexture === true) {
      const map = refShadeMultiplyTexture.context({ getUV: () => this._animatedUVNode });
      shadingShiftNode = shadingShiftNode.add(map.mul(refShadeMultiplyTextureScale));
    }
    return shadingShiftNode;
  }
  _setupShadingToonyNode() {
    if (this.shadingToonyNode != null) {
      return THREE8.float(this.shadingToonyNode);
    }
    return refShadingToonyFactor;
  }
  _setupRimLightingMixNode() {
    if (this.rimLightingMixNode != null) {
      return THREE8.float(this.rimLightingMixNode);
    }
    return refRimLightingMixFactor;
  }
  _setupRimMultiplyNode() {
    if (this.rimMultiplyNode != null) {
      return THREE8.vec3(this.rimMultiplyNode);
    }
    if (this.rimMultiplyTexture && this.rimMultiplyTexture.isTexture === true) {
      const map = refRimMultiplyTexture.context({ getUV: () => this._animatedUVNode });
      return map;
    }
    return THREE8.vec3(1);
  }
  _setupMatcapNode() {
    if (this.matcapNode != null) {
      return THREE8.vec3(this.matcapNode);
    }
    if (this.matcapTexture && this.matcapTexture.isTexture === true) {
      const map = refMatcapTexture.context({ getUV: () => THREE8.matcapUV.mul(1, -1).add(0, 1) });
      return map.mul(refMatcapFactor);
    }
    return THREE8.vec3(0);
  }
  _setupParametricRimNode() {
    const parametricRimColor = this.parametricRimColorNode != null ? THREE8.vec3(this.parametricRimColorNode) : refParametricRimColorFactor;
    const parametricRimLift = this.parametricRimLiftNode != null ? THREE8.float(this.parametricRimLiftNode) : refParametricRimLiftFactor;
    const parametricRimFresnelPower = this.parametricRimFresnelPowerNode != null ? THREE8.float(this.parametricRimFresnelPowerNode) : refParametricRimFresnelPowerFactor;
    return mtoonParametricRim({
      parametricRimLift,
      parametricRimFresnelPower,
      parametricRimColor
    });
  }
};
//# sourceMappingURL=data:application/json;base64,ewogICJ2ZXJzaW9uIjogMywKICAic291cmNlcyI6IFsiLi4vLi4vc3JjL25vZGVzL2luZGV4LnRzIiwgIi4uLy4uL3NyYy9ub2Rlcy93YXJuaW5nSWZQcmUxNjEudHMiLCAiLi4vLi4vc3JjL25vZGVzL01Ub29uQW5pbWF0ZWRVVk5vZGUudHMiLCAiLi4vLi4vc3JjL25vZGVzL21hdGVyaWFsUmVmZXJlbmNlcy50cyIsICIuLi8uLi9zcmMvbm9kZXMvTVRvb25MaWdodGluZ01vZGVsLnRzIiwgIi4uLy4uL3NyYy9ub2Rlcy9pbW11dGFibGVOb2Rlcy50cyIsICIuLi8uLi9zcmMvbm9kZXMvdXRpbHMvRm5Db21wYXQudHMiLCAiLi4vLi4vc3JjL25vZGVzL01Ub29uTm9kZU1hdGVyaWFsLnRzIiwgIi4uLy4uL3NyYy9NVG9vbk1hdGVyaWFsT3V0bGluZVdpZHRoTW9kZS50cyIsICIuLi8uLi9zcmMvbm9kZXMvbXRvb25QYXJhbWV0cmljUmltLnRzIl0sCiAgInNvdXJjZXNDb250ZW50IjogWyJpbXBvcnQgJy4vd2FybmluZ0lmUHJlMTYxLmpzJztcblxuZXhwb3J0IHsgTVRvb25BbmltYXRlZFVWTm9kZSB9IGZyb20gJy4vTVRvb25BbmltYXRlZFVWTm9kZSc7XG5leHBvcnQgeyBNVG9vbkxpZ2h0aW5nTW9kZWwgfSBmcm9tICcuL01Ub29uTGlnaHRpbmdNb2RlbCc7XG5leHBvcnQgeyBNVG9vbk5vZGVNYXRlcmlhbCB9IGZyb20gJy4vTVRvb25Ob2RlTWF0ZXJpYWwnO1xuZXhwb3J0IHR5cGUgeyBNVG9vbk5vZGVNYXRlcmlhbFBhcmFtZXRlcnMgfSBmcm9tICcuL01Ub29uTm9kZU1hdGVyaWFsUGFyYW1ldGVycyc7XG4iLCAiLy8gVGhpcyBtb2R1bGUgd2lsbCBiZSBpbXBvcnRlZCBhdCB0aGUgYmVnaW5uaW5nIG9mIGB0aHJlZS12cm0tbWF0ZXJpYWxzLW10b29uL25vZGVzYFxuLy8gSWYgdGhlIHZlcnNpb24gb2YgVGhyZWUuanMgaXMgbGVzcyB0aGFuIHIxNjcsIGl0IHdpbGwgd2FybiB0aGF0IGl0IGlzIG5vdCBzdXBwb3J0ZWRcblxuaW1wb3J0ICogYXMgVEhSRUUgZnJvbSAndGhyZWUnO1xuXG5jb25zdCB0aHJlZVJldmlzaW9uID0gcGFyc2VJbnQoVEhSRUUuUkVWSVNJT04sIDEwKTtcbmlmICh0aHJlZVJldmlzaW9uIDwgMTY3KSB7XG4gIGNvbnNvbGUud2FybihcbiAgICBgTVRvb25Ob2RlTWF0ZXJpYWwgcmVxdWlyZXMgVGhyZWUuanMgcjE2NyBvciBoaWdoZXIgKFlvdSBhcmUgdXNpbmcgciR7dGhyZWVSZXZpc2lvbn0pLiBUaGlzIHdvdWxkIG5vdCB3b3JrIGNvcnJlY3RseS5gLFxuICApO1xufVxuIiwgImltcG9ydCAqIGFzIFRIUkVFIGZyb20gJ3RocmVlL3dlYmdwdSc7XG5pbXBvcnQge1xuICByZWZVVkFuaW1hdGlvbk1hc2tUZXh0dXJlLFxuICByZWZVVkFuaW1hdGlvblJvdGF0aW9uUGhhc2UsXG4gIHJlZlVWQW5pbWF0aW9uU2Nyb2xsWE9mZnNldCxcbiAgcmVmVVZBbmltYXRpb25TY3JvbGxZT2Zmc2V0LFxufSBmcm9tICcuL21hdGVyaWFsUmVmZXJlbmNlcyc7XG5cbmV4cG9ydCBjbGFzcyBNVG9vbkFuaW1hdGVkVVZOb2RlIGV4dGVuZHMgVEhSRUUuVGVtcE5vZGUge1xuICBwdWJsaWMgcmVhZG9ubHkgaGFzTWFza1RleHR1cmU6IGJvb2xlYW47XG5cbiAgcHVibGljIGNvbnN0cnVjdG9yKGhhc01hc2tUZXh0dXJlOiBib29sZWFuKSB7XG4gICAgc3VwZXIoJ3ZlYzInKTtcblxuICAgIHRoaXMuaGFzTWFza1RleHR1cmUgPSBoYXNNYXNrVGV4dHVyZTtcbiAgfVxuXG4gIHB1YmxpYyBzZXR1cCgpOiBUSFJFRS5TaGFkZXJOb2RlT2JqZWN0PFRIUkVFLlZhck5vZGU+IHtcbiAgICBsZXQgdXZBbmltYXRpb25NYXNrOiBUSFJFRS5Ob2RlUmVwcmVzZW50YXRpb24gPSAxLjA7XG5cbiAgICBpZiAodGhpcy5oYXNNYXNrVGV4dHVyZSkge1xuICAgICAgdXZBbmltYXRpb25NYXNrID0gVEhSRUUudmVjNChyZWZVVkFuaW1hdGlvbk1hc2tUZXh0dXJlKS5jb250ZXh0KHsgZ2V0VVY6ICgpID0+IFRIUkVFLnV2KCkgfSkucjtcbiAgICB9XG5cbiAgICBsZXQgdXY6IFRIUkVFLlNoYWRlck5vZGVPYmplY3Q8VEhSRUUuU3dpenphYmxlPiA9IFRIUkVFLnV2KCk7XG5cbiAgICAvLyByb3RhdGVcbiAgICBjb25zdCBwaGFzZSA9IHJlZlVWQW5pbWF0aW9uUm90YXRpb25QaGFzZS5tdWwodXZBbmltYXRpb25NYXNrKTtcblxuICAgIC8vIFdPUktBUk9VTkQ6IFRIUkVFLnJvdGF0ZVVWIGNhdXNlcyBhbiBpc3N1ZSB3aXRoIHRoZSBtYXNrIHRleHR1cmVcbiAgICAvLyBXZSBhcmUgZ29pbmcgdG8gc3BpbiB1c2luZyBhIDEwMCUgb3JnYW5pYyBoYW5kbWFkZSByb3RhdGlvbiBtYXRyaXhcbiAgICAvLyB1diA9IFRIUkVFLnJvdGF0ZVVWKHV2LCBwaGFzZSwgVEhSRUUudmVjMigwLjUsIDAuNSkpO1xuXG4gICAgY29uc3QgYyA9IFRIUkVFLmNvcyhwaGFzZSk7XG4gICAgY29uc3QgcyA9IFRIUkVFLnNpbihwaGFzZSk7XG4gICAgdXYgPSB1di5zdWIoVEhSRUUudmVjMigwLjUsIDAuNSkpO1xuICAgIHV2ID0gdXYubXVsKFRIUkVFLm1hdDIoYywgcywgcy5uZWdhdGUoKSwgYykpO1xuICAgIHV2ID0gdXYuYWRkKFRIUkVFLnZlYzIoMC41LCAwLjUpKTtcblxuICAgIC8vIHNjcm9sbFxuICAgIGNvbnN0IHNjcm9sbCA9IFRIUkVFLnZlYzIocmVmVVZBbmltYXRpb25TY3JvbGxYT2Zmc2V0LCByZWZVVkFuaW1hdGlvblNjcm9sbFlPZmZzZXQpLm11bCh1dkFuaW1hdGlvbk1hc2spO1xuICAgIHV2ID0gdXYuYWRkKHNjcm9sbCk7XG5cbiAgICByZXR1cm4gdXYudGVtcCgnQW5pbWF0ZWRVVicpO1xuICB9XG59XG4iLCAiaW1wb3J0ICogYXMgVEhSRUUgZnJvbSAndGhyZWUvd2ViZ3B1JztcblxuZXhwb3J0IGNvbnN0IHJlZkNvbG9yID0gVEhSRUUubWF0ZXJpYWxSZWZlcmVuY2UoJ2NvbG9yJywgJ2NvbG9yJyk7XG5leHBvcnQgY29uc3QgcmVmTWFwID0gVEhSRUUubWF0ZXJpYWxSZWZlcmVuY2UoJ21hcCcsICd0ZXh0dXJlJyk7XG5leHBvcnQgY29uc3QgcmVmTm9ybWFsTWFwID0gVEhSRUUubWF0ZXJpYWxSZWZlcmVuY2UoJ25vcm1hbE1hcCcsICd0ZXh0dXJlJyk7XG5leHBvcnQgY29uc3QgcmVmTm9ybWFsU2NhbGUgPSBUSFJFRS5tYXRlcmlhbFJlZmVyZW5jZSgnbm9ybWFsU2NhbGUnLCAndmVjMicpO1xuZXhwb3J0IGNvbnN0IHJlZkVtaXNzaXZlID0gVEhSRUUubWF0ZXJpYWxSZWZlcmVuY2UoJ2VtaXNzaXZlJywgJ2NvbG9yJyk7XG5leHBvcnQgY29uc3QgcmVmRW1pc3NpdmVJbnRlbnNpdHkgPSBUSFJFRS5tYXRlcmlhbFJlZmVyZW5jZSgnZW1pc3NpdmVJbnRlbnNpdHknLCAnZmxvYXQnKTtcbmV4cG9ydCBjb25zdCByZWZFbWlzc2l2ZU1hcCA9IFRIUkVFLm1hdGVyaWFsUmVmZXJlbmNlKCdlbWlzc2l2ZU1hcCcsICd0ZXh0dXJlJyk7XG5cbmV4cG9ydCBjb25zdCByZWZTaGFkZUNvbG9yRmFjdG9yID0gVEhSRUUubWF0ZXJpYWxSZWZlcmVuY2UoJ3NoYWRlQ29sb3JGYWN0b3InLCAnY29sb3InKTtcbmV4cG9ydCBjb25zdCByZWZTaGFkaW5nU2hpZnRGYWN0b3IgPSBUSFJFRS5tYXRlcmlhbFJlZmVyZW5jZSgnc2hhZGluZ1NoaWZ0RmFjdG9yJywgJ2Zsb2F0Jyk7XG5leHBvcnQgY29uc3QgcmVmU2hhZGVNdWx0aXBseVRleHR1cmUgPSBUSFJFRS5tYXRlcmlhbFJlZmVyZW5jZSgnc2hhZGVNdWx0aXBseVRleHR1cmUnLCAndGV4dHVyZScpO1xuZXhwb3J0IGNvbnN0IHJlZlNoYWRlTXVsdGlwbHlUZXh0dXJlU2NhbGUgPSBUSFJFRS5tYXRlcmlhbFJlZmVyZW5jZSgnc2hhZGVNdWx0aXBseVRleHR1cmVTY2FsZScsICdmbG9hdCcpO1xuZXhwb3J0IGNvbnN0IHJlZlNoYWRpbmdUb29ueUZhY3RvciA9IFRIUkVFLm1hdGVyaWFsUmVmZXJlbmNlKCdzaGFkaW5nVG9vbnlGYWN0b3InLCAnZmxvYXQnKTtcbmV4cG9ydCBjb25zdCByZWZSaW1MaWdodGluZ01peEZhY3RvciA9IFRIUkVFLm1hdGVyaWFsUmVmZXJlbmNlKCdyaW1MaWdodGluZ01peEZhY3RvcicsICdmbG9hdCcpO1xuZXhwb3J0IGNvbnN0IHJlZlJpbU11bHRpcGx5VGV4dHVyZSA9IFRIUkVFLm1hdGVyaWFsUmVmZXJlbmNlKCdyaW1NdWx0aXBseVRleHR1cmUnLCAndGV4dHVyZScpO1xuZXhwb3J0IGNvbnN0IHJlZk1hdGNhcEZhY3RvciA9IFRIUkVFLm1hdGVyaWFsUmVmZXJlbmNlKCdtYXRjYXBGYWN0b3InLCAnY29sb3InKTtcbmV4cG9ydCBjb25zdCByZWZNYXRjYXBUZXh0dXJlID0gVEhSRUUubWF0ZXJpYWxSZWZlcmVuY2UoJ21hdGNhcFRleHR1cmUnLCAndGV4dHVyZScpO1xuZXhwb3J0IGNvbnN0IHJlZlBhcmFtZXRyaWNSaW1Db2xvckZhY3RvciA9IFRIUkVFLm1hdGVyaWFsUmVmZXJlbmNlKCdwYXJhbWV0cmljUmltQ29sb3JGYWN0b3InLCAnY29sb3InKTtcbmV4cG9ydCBjb25zdCByZWZQYXJhbWV0cmljUmltTGlmdEZhY3RvciA9IFRIUkVFLm1hdGVyaWFsUmVmZXJlbmNlKCdwYXJhbWV0cmljUmltTGlmdEZhY3RvcicsICdmbG9hdCcpO1xuZXhwb3J0IGNvbnN0IHJlZlBhcmFtZXRyaWNSaW1GcmVzbmVsUG93ZXJGYWN0b3IgPSBUSFJFRS5tYXRlcmlhbFJlZmVyZW5jZSgncGFyYW1ldHJpY1JpbUZyZXNuZWxQb3dlckZhY3RvcicsICdmbG9hdCcpO1xuZXhwb3J0IGNvbnN0IHJlZk91dGxpbmVXaWR0aE11bHRpcGx5VGV4dHVyZSA9IFRIUkVFLm1hdGVyaWFsUmVmZXJlbmNlKCdvdXRsaW5lV2lkdGhNdWx0aXBseVRleHR1cmUnLCAndGV4dHVyZScpO1xuZXhwb3J0IGNvbnN0IHJlZk91dGxpbmVXaWR0aEZhY3RvciA9IFRIUkVFLm1hdGVyaWFsUmVmZXJlbmNlKCdvdXRsaW5lV2lkdGhGYWN0b3InLCAnZmxvYXQnKTtcbmV4cG9ydCBjb25zdCByZWZPdXRsaW5lQ29sb3JGYWN0b3IgPSBUSFJFRS5tYXRlcmlhbFJlZmVyZW5jZSgnb3V0bGluZUNvbG9yRmFjdG9yJywgJ2NvbG9yJyk7XG5leHBvcnQgY29uc3QgcmVmT3V0bGluZUxpZ2h0aW5nTWl4RmFjdG9yID0gVEhSRUUubWF0ZXJpYWxSZWZlcmVuY2UoJ291dGxpbmVMaWdodGluZ01peEZhY3RvcicsICdmbG9hdCcpO1xuZXhwb3J0IGNvbnN0IHJlZlVWQW5pbWF0aW9uTWFza1RleHR1cmUgPSBUSFJFRS5tYXRlcmlhbFJlZmVyZW5jZSgndXZBbmltYXRpb25NYXNrVGV4dHVyZScsICd0ZXh0dXJlJyk7XG5cbmV4cG9ydCBjb25zdCByZWZVVkFuaW1hdGlvblNjcm9sbFhPZmZzZXQgPSBUSFJFRS5tYXRlcmlhbFJlZmVyZW5jZSgndXZBbmltYXRpb25TY3JvbGxYT2Zmc2V0JywgJ2Zsb2F0Jyk7XG5leHBvcnQgY29uc3QgcmVmVVZBbmltYXRpb25TY3JvbGxZT2Zmc2V0ID0gVEhSRUUubWF0ZXJpYWxSZWZlcmVuY2UoJ3V2QW5pbWF0aW9uU2Nyb2xsWU9mZnNldCcsICdmbG9hdCcpO1xuZXhwb3J0IGNvbnN0IHJlZlVWQW5pbWF0aW9uUm90YXRpb25QaGFzZSA9IFRIUkVFLm1hdGVyaWFsUmVmZXJlbmNlKCd1dkFuaW1hdGlvblJvdGF0aW9uUGhhc2UnLCAnZmxvYXQnKTtcbiIsICJpbXBvcnQgKiBhcyBUSFJFRSBmcm9tICd0aHJlZS93ZWJncHUnO1xuaW1wb3J0IHtcbiAgbWF0Y2FwLFxuICBwYXJhbWV0cmljUmltLFxuICByaW1MaWdodGluZ01peCxcbiAgcmltTXVsdGlwbHksXG4gIHNoYWRlQ29sb3IsXG4gIHNoYWRpbmdTaGlmdCxcbiAgc2hhZGluZ1Rvb255LFxufSBmcm9tICcuL2ltbXV0YWJsZU5vZGVzJztcbmltcG9ydCB7IEZuQ29tcGF0IH0gZnJvbSAnLi91dGlscy9GbkNvbXBhdCc7XG5cbi8vIFRPRE86IDAlIGNvbmZpZGVuY2UgYWJvdXQgZnVuY3Rpb24gdHlwZXMuXG5cbmNvbnN0IGxpbmVhcnN0ZXAgPSBGbkNvbXBhdChcbiAgKHtcbiAgICBhLFxuICAgIGIsXG4gICAgdCxcbiAgfToge1xuICAgIGE6IFRIUkVFLlNoYWRlck5vZGVPYmplY3Q8VEhSRUUuTm9kZT47XG4gICAgYjogVEhSRUUuU2hhZGVyTm9kZU9iamVjdDxUSFJFRS5Ob2RlPjtcbiAgICB0OiBUSFJFRS5TaGFkZXJOb2RlT2JqZWN0PFRIUkVFLk5vZGU+O1xuICB9KSA9PiB7XG4gICAgY29uc3QgdG9wID0gdC5zdWIoYSk7XG4gICAgY29uc3QgYm90dG9tID0gYi5zdWIoYSk7XG4gICAgcmV0dXJuIHRvcC5kaXYoYm90dG9tKS5jbGFtcCgpO1xuICB9LFxuKTtcblxuLyoqXG4gKiBDb252ZXJ0IE5kb3RMIGludG8gdG9vbiBzaGFkaW5nIGZhY3RvciB1c2luZyBzaGFkaW5nU2hpZnQgYW5kIHNoYWRpbmdUb29ueVxuICovXG5jb25zdCBnZXRTaGFkaW5nID0gRm5Db21wYXQoKHsgZG90TkwgfTogeyBkb3ROTDogVEhSRUUuU2hhZGVyTm9kZU9iamVjdDxUSFJFRS5Ob2RlPiB9KSA9PiB7XG4gIGNvbnN0IHNoYWRvdyA9IDEuMDsgLy8gVE9ET1xuXG4gIGNvbnN0IGZlYXRoZXIgPSBUSFJFRS5mbG9hdCgxLjApLnN1YihzaGFkaW5nVG9vbnkpO1xuXG4gIGxldCBzaGFkaW5nOiBUSFJFRS5TaGFkZXJOb2RlT2JqZWN0PFRIUkVFLk5vZGU+ID0gZG90TkwuYWRkKHNoYWRpbmdTaGlmdCk7XG4gIHNoYWRpbmcgPSBsaW5lYXJzdGVwKHtcbiAgICBhOiBmZWF0aGVyLm5lZ2F0ZSgpLFxuICAgIGI6IGZlYXRoZXIsXG4gICAgdDogc2hhZGluZyxcbiAgfSk7XG4gIHNoYWRpbmcgPSBzaGFkaW5nLm11bChzaGFkb3cpO1xuICByZXR1cm4gc2hhZGluZztcbn0pO1xuXG4vKipcbiAqIE1peCBkaWZmdXNlQ29sb3IgYW5kIHNoYWRlQ29sb3IgdXNpbmcgc2hhZGluZyBmYWN0b3IgYW5kIGxpZ2h0IGNvbG9yXG4gKi9cbmNvbnN0IGdldERpZmZ1c2UgPSBGbkNvbXBhdChcbiAgKHtcbiAgICBzaGFkaW5nLFxuICAgIGxpZ2h0Q29sb3IsXG4gIH06IHtcbiAgICBzaGFkaW5nOiBUSFJFRS5TaGFkZXJOb2RlT2JqZWN0PFRIUkVFLk5vZGU+O1xuICAgIGxpZ2h0Q29sb3I6IFRIUkVFLlNoYWRlck5vZGVPYmplY3Q8VEhSRUUuTm9kZT47XG4gIH0pID0+IHtcbiAgICBjb25zdCBkaWZmdXNlQ29sb3IgPSBUSFJFRS5taXgoc2hhZGVDb2xvciwgVEhSRUUuZGlmZnVzZUNvbG9yLCBzaGFkaW5nKTtcbiAgICBjb25zdCBjb2wgPSBsaWdodENvbG9yLm11bChUSFJFRS5CUkRGX0xhbWJlcnQoeyBkaWZmdXNlQ29sb3IgfSkpO1xuXG4gICAgcmV0dXJuIGNvbDtcbiAgfSxcbik7XG5cbmV4cG9ydCBjbGFzcyBNVG9vbkxpZ2h0aW5nTW9kZWwgZXh0ZW5kcyBUSFJFRS5MaWdodGluZ01vZGVsIHtcbiAgY29uc3RydWN0b3IoKSB7XG4gICAgc3VwZXIoKTtcbiAgfVxuXG4gIGRpcmVjdCh7IGxpZ2h0RGlyZWN0aW9uLCBsaWdodENvbG9yLCByZWZsZWN0ZWRMaWdodCB9OiBUSFJFRS5MaWdodGluZ01vZGVsRGlyZWN0SW5wdXQpIHtcbiAgICBjb25zdCBkb3ROTCA9IFRIUkVFLnRyYW5zZm9ybWVkTm9ybWFsVmlldy5kb3QobGlnaHREaXJlY3Rpb24pLmNsYW1wKC0xLjAsIDEuMCk7XG5cbiAgICAvLyB0b29uIGRpZmZ1c2VcbiAgICBjb25zdCBzaGFkaW5nID0gZ2V0U2hhZGluZyh7XG4gICAgICBkb3ROTCxcbiAgICB9KTtcblxuICAgIC8vIFVuYWJsZSB0byB1c2UgYGFkZEFzc2lnbmAgaW4gdGhlIGN1cnJlbnQgQHR5cGVzL3RocmVlLCB3ZSB1c2UgYGFzc2lnbmAgYW5kIGBhZGRgIGluc3RlYWRcbiAgICAvLyBUT0RPOiBGaXggdGhlIGBhZGRBc3NpZ25gIGlzc3VlIGZyb20gdGhlIGBAdHlwZXMvdGhyZWVgIHNpZGVcblxuICAgIChyZWZsZWN0ZWRMaWdodC5kaXJlY3REaWZmdXNlIGFzIFRIUkVFLlNoYWRlck5vZGVPYmplY3Q8VEhSRUUuTm9kZT4pLmFzc2lnbihcbiAgICAgIChyZWZsZWN0ZWRMaWdodC5kaXJlY3REaWZmdXNlIGFzIFRIUkVFLlNoYWRlck5vZGVPYmplY3Q8VEhSRUUuTm9kZT4pLmFkZChcbiAgICAgICAgZ2V0RGlmZnVzZSh7XG4gICAgICAgICAgc2hhZGluZyxcbiAgICAgICAgICBsaWdodENvbG9yOiBsaWdodENvbG9yIGFzIFRIUkVFLlNoYWRlck5vZGVPYmplY3Q8VEhSRUUuTm9kZT4sXG4gICAgICAgIH0pLFxuICAgICAgKSxcbiAgICApO1xuXG4gICAgLy8gcmltXG4gICAgKHJlZmxlY3RlZExpZ2h0LmRpcmVjdFNwZWN1bGFyIGFzIFRIUkVFLlNoYWRlck5vZGVPYmplY3Q8VEhSRUUuTm9kZT4pLmFzc2lnbihcbiAgICAgIChyZWZsZWN0ZWRMaWdodC5kaXJlY3RTcGVjdWxhciBhcyBUSFJFRS5TaGFkZXJOb2RlT2JqZWN0PFRIUkVFLk5vZGU+KS5hZGQoXG4gICAgICAgIHBhcmFtZXRyaWNSaW1cbiAgICAgICAgICAuYWRkKG1hdGNhcClcbiAgICAgICAgICAubXVsKHJpbU11bHRpcGx5KVxuICAgICAgICAgIC5tdWwoVEhSRUUubWl4KFRIUkVFLnZlYzMoMC4wKSwgVEhSRUUuQlJERl9MYW1iZXJ0KHsgZGlmZnVzZUNvbG9yOiBsaWdodENvbG9yIH0pLCByaW1MaWdodGluZ01peCkpLFxuICAgICAgKSxcbiAgICApO1xuICB9XG5cbiAgaW5kaXJlY3QoY29udGV4dDogVEhSRUUuTGlnaHRpbmdNb2RlbEluZGlyZWN0SW5wdXQpIHtcbiAgICB0aGlzLmluZGlyZWN0RGlmZnVzZShjb250ZXh0KTtcbiAgICB0aGlzLmluZGlyZWN0U3BlY3VsYXIoY29udGV4dCk7XG4gIH1cblxuICBpbmRpcmVjdERpZmZ1c2UoeyBpcnJhZGlhbmNlLCByZWZsZWN0ZWRMaWdodCB9OiBUSFJFRS5MaWdodGluZ01vZGVsSW5kaXJlY3RJbnB1dCkge1xuICAgIC8vIGluZGlyZWN0IGlycmFkaWFuY2VcbiAgICAocmVmbGVjdGVkTGlnaHQuaW5kaXJlY3REaWZmdXNlIGFzIFRIUkVFLlNoYWRlck5vZGVPYmplY3Q8VEhSRUUuTm9kZT4pLmFzc2lnbihcbiAgICAgIChyZWZsZWN0ZWRMaWdodC5pbmRpcmVjdERpZmZ1c2UgYXMgVEhSRUUuU2hhZGVyTm9kZU9iamVjdDxUSFJFRS5Ob2RlPikuYWRkKFxuICAgICAgICAoaXJyYWRpYW5jZSBhcyBUSFJFRS5TaGFkZXJOb2RlT2JqZWN0PFRIUkVFLk5vZGU+KS5tdWwoXG4gICAgICAgICAgVEhSRUUuQlJERl9MYW1iZXJ0KHtcbiAgICAgICAgICAgIGRpZmZ1c2VDb2xvcjogVEhSRUUuZGlmZnVzZUNvbG9yLFxuICAgICAgICAgIH0pLFxuICAgICAgICApLFxuICAgICAgKSxcbiAgICApO1xuICB9XG5cbiAgaW5kaXJlY3RTcGVjdWxhcih7IHJlZmxlY3RlZExpZ2h0IH06IFRIUkVFLkxpZ2h0aW5nTW9kZWxJbmRpcmVjdElucHV0KSB7XG4gICAgLy8gcmltXG4gICAgKHJlZmxlY3RlZExpZ2h0LmluZGlyZWN0U3BlY3VsYXIgYXMgVEhSRUUuU2hhZGVyTm9kZU9iamVjdDxUSFJFRS5Ob2RlPikuYXNzaWduKFxuICAgICAgKHJlZmxlY3RlZExpZ2h0LmluZGlyZWN0U3BlY3VsYXIgYXMgVEhSRUUuU2hhZGVyTm9kZU9iamVjdDxUSFJFRS5Ob2RlPikuYWRkKFxuICAgICAgICBwYXJhbWV0cmljUmltXG4gICAgICAgICAgLmFkZChtYXRjYXApXG4gICAgICAgICAgLm11bChyaW1NdWx0aXBseSlcbiAgICAgICAgICAubXVsKFRIUkVFLm1peChUSFJFRS52ZWMzKDEuMCksIFRIUkVFLnZlYzMoMC4wKSwgcmltTGlnaHRpbmdNaXgpKSxcbiAgICAgICksXG4gICAgKTtcbiAgfVxufVxuIiwgImltcG9ydCAqIGFzIFRIUkVFIGZyb20gJ3RocmVlL3dlYmdwdSc7XG5cbmV4cG9ydCBjb25zdCBzaGFkZUNvbG9yID0gVEhSRUUubm9kZUltbXV0YWJsZShUSFJFRS5Qcm9wZXJ0eU5vZGUsICd2ZWMzJykudGVtcCgnU2hhZGVDb2xvcicpO1xuZXhwb3J0IGNvbnN0IHNoYWRpbmdTaGlmdCA9IFRIUkVFLm5vZGVJbW11dGFibGUoVEhSRUUuUHJvcGVydHlOb2RlLCAnZmxvYXQnKS50ZW1wKCdTaGFkaW5nU2hpZnQnKTtcbmV4cG9ydCBjb25zdCBzaGFkaW5nVG9vbnkgPSBUSFJFRS5ub2RlSW1tdXRhYmxlKFRIUkVFLlByb3BlcnR5Tm9kZSwgJ2Zsb2F0JykudGVtcCgnU2hhZGluZ1Rvb255Jyk7XG5leHBvcnQgY29uc3QgcmltTGlnaHRpbmdNaXggPSBUSFJFRS5ub2RlSW1tdXRhYmxlKFRIUkVFLlByb3BlcnR5Tm9kZSwgJ2Zsb2F0JykudGVtcCgnUmltTGlnaHRpbmdNaXgnKTtcbmV4cG9ydCBjb25zdCByaW1NdWx0aXBseSA9IFRIUkVFLm5vZGVJbW11dGFibGUoVEhSRUUuUHJvcGVydHlOb2RlLCAndmVjMycpLnRlbXAoJ1JpbU11bHRpcGx5Jyk7XG5leHBvcnQgY29uc3QgbWF0Y2FwID0gVEhSRUUubm9kZUltbXV0YWJsZShUSFJFRS5Qcm9wZXJ0eU5vZGUsICd2ZWMzJykudGVtcCgnbWF0Y2FwJyk7XG5leHBvcnQgY29uc3QgcGFyYW1ldHJpY1JpbSA9IFRIUkVFLm5vZGVJbW11dGFibGUoVEhSRUUuUHJvcGVydHlOb2RlLCAndmVjMycpLnRlbXAoJ1BhcmFtZXRyaWNSaW0nKTtcbiIsICJpbXBvcnQgKiBhcyBUSFJFRSBmcm9tICd0aHJlZS93ZWJncHUnO1xuXG4vKipcbiAqIEEgY29tcGF0IGZ1bmN0aW9uIGZvciBgRm4oKWAgLyBgdHNsRm4oKWAuXG4gKiBgdHNsRm4oKWAgaGFzIGJlZW4gcmVuYW1lZCB0byBgRm4oKWAgaW4gcjE2OC5cbiAqIFdlIGFyZSBnb2luZyB0byB1c2UgdGhpcyBjb21wYXQgZm9yIGEgd2hpbGUuXG4gKlxuICogU2VlOiBodHRwczovL2dpdGh1Yi5jb20vbXJkb29iL3RocmVlLmpzL3B1bGwvMjkwNjRcbiAqL1xuLy8gZXNsaW50LWRpc2FibGUtbmV4dC1saW5lIEB0eXBlc2NyaXB0LWVzbGludC9uYW1pbmctY29udmVudGlvblxuZXhwb3J0IGNvbnN0IEZuQ29tcGF0OiB0eXBlb2YgVEhSRUUuRm4gPSAoanNGdW5jOiBhbnkpID0+IHtcbiAgLy8gQ09NUEFUIHIxNjg6IGB0c2xGbigpYCBoYXMgYmVlbiByZW5hbWVkIHRvIGBGbigpYFxuICAvLyBTZWU6IGh0dHBzOi8vZ2l0aHViLmNvbS9tcmRvb2IvdGhyZWUuanMvcHVsbC8yOTA2NFxuICBjb25zdCB0aHJlZVJldmlzaW9uID0gcGFyc2VJbnQoVEhSRUUuUkVWSVNJT04sIDEwKTtcbiAgaWYgKHRocmVlUmV2aXNpb24gPj0gMTY4KSB7XG4gICAgcmV0dXJuIFRIUkVFLkZuKGpzRnVuYyk7XG4gIH0gZWxzZSB7XG4gICAgcmV0dXJuIChUSFJFRSBhcyBhbnkpLnRzbEZuKGpzRnVuYyk7XG4gIH1cbn07XG4iLCAiaW1wb3J0ICogYXMgVEhSRUUgZnJvbSAndGhyZWUvd2ViZ3B1JztcblxuaW1wb3J0IHR5cGUgeyBNVG9vbk1hdGVyaWFsIH0gZnJvbSAnLi4vTVRvb25NYXRlcmlhbCc7XG5pbXBvcnQgeyBNVG9vbkxpZ2h0aW5nTW9kZWwgfSBmcm9tICcuL01Ub29uTGlnaHRpbmdNb2RlbCc7XG5pbXBvcnQge1xuICByaW1MaWdodGluZ01peCxcbiAgbWF0Y2FwLFxuICBzaGFkZUNvbG9yLFxuICBzaGFkaW5nU2hpZnQsXG4gIHNoYWRpbmdUb29ueSxcbiAgcmltTXVsdGlwbHksXG4gIHBhcmFtZXRyaWNSaW0sXG59IGZyb20gJy4vaW1tdXRhYmxlTm9kZXMnO1xuaW1wb3J0IHtcbiAgcmVmQ29sb3IsXG4gIHJlZkVtaXNzaXZlLFxuICByZWZFbWlzc2l2ZUludGVuc2l0eSxcbiAgcmVmRW1pc3NpdmVNYXAsXG4gIHJlZk1hcCxcbiAgcmVmTWF0Y2FwRmFjdG9yLFxuICByZWZNYXRjYXBUZXh0dXJlLFxuICByZWZOb3JtYWxNYXAsXG4gIHJlZk5vcm1hbFNjYWxlLFxuICByZWZPdXRsaW5lQ29sb3JGYWN0b3IsXG4gIHJlZk91dGxpbmVMaWdodGluZ01peEZhY3RvcixcbiAgcmVmT3V0bGluZVdpZHRoRmFjdG9yLFxuICByZWZPdXRsaW5lV2lkdGhNdWx0aXBseVRleHR1cmUsXG4gIHJlZlBhcmFtZXRyaWNSaW1Db2xvckZhY3RvcixcbiAgcmVmUGFyYW1ldHJpY1JpbUZyZXNuZWxQb3dlckZhY3RvcixcbiAgcmVmUGFyYW1ldHJpY1JpbUxpZnRGYWN0b3IsXG4gIHJlZlJpbUxpZ2h0aW5nTWl4RmFjdG9yLFxuICByZWZSaW1NdWx0aXBseVRleHR1cmUsXG4gIHJlZlNoYWRlQ29sb3JGYWN0b3IsXG4gIHJlZlNoYWRlTXVsdGlwbHlUZXh0dXJlLFxuICByZWZTaGFkZU11bHRpcGx5VGV4dHVyZVNjYWxlLFxuICByZWZTaGFkaW5nU2hpZnRGYWN0b3IsXG4gIHJlZlNoYWRpbmdUb29ueUZhY3Rvcixcbn0gZnJvbSAnLi9tYXRlcmlhbFJlZmVyZW5jZXMnO1xuaW1wb3J0IHsgTVRvb25BbmltYXRlZFVWTm9kZSB9IGZyb20gJy4vTVRvb25BbmltYXRlZFVWTm9kZSc7XG5pbXBvcnQgeyBNVG9vbk1hdGVyaWFsT3V0bGluZVdpZHRoTW9kZSB9IGZyb20gJy4uL01Ub29uTWF0ZXJpYWxPdXRsaW5lV2lkdGhNb2RlJztcbmltcG9ydCB7IE1Ub29uTm9kZU1hdGVyaWFsUGFyYW1ldGVycyB9IGZyb20gJy4vTVRvb25Ob2RlTWF0ZXJpYWxQYXJhbWV0ZXJzJztcbmltcG9ydCB7IG10b29uUGFyYW1ldHJpY1JpbSB9IGZyb20gJy4vbXRvb25QYXJhbWV0cmljUmltJztcblxuLyoqXG4gKiBNVG9vbiBpcyBhIG1hdGVyaWFsIHNwZWNpZmljYXRpb24gdGhhdCBoYXMgdmFyaW91cyBmZWF0dXJlcy5cbiAqIFRoZSBzcGVjIGFuZCBpbXBsZW1lbnRhdGlvbiBhcmUgb3JpZ2luYWxseSBmb3VuZGVkIGZvciBVbml0eSBlbmdpbmUgYW5kIHRoaXMgaXMgYSBwb3J0IG9mIHRoZSBtYXRlcmlhbC5cbiAqXG4gKiBUaGlzIG1hdGVyaWFsIGlzIGEgTm9kZU1hdGVyaWFsIHZhcmlhbnQgb2Yge0BsaW5rIE1Ub29uTWF0ZXJpYWx9LlxuICpcbiAqIFNlZTogaHR0cHM6Ly9naXRodWIuY29tL1NhbnRhcmgvTVRvb25cbiAqL1xuZXhwb3J0IGNsYXNzIE1Ub29uTm9kZU1hdGVyaWFsIGV4dGVuZHMgVEhSRUUuTm9kZU1hdGVyaWFsIHtcbiAgcHVibGljIGVtaXNzaXZlTm9kZTogVEhSRUUuU2hhZGVyTm9kZU9iamVjdDxUSFJFRS5Ob2RlPiB8IG51bGw7XG5cbiAgcHVibGljIGNvbG9yOiBUSFJFRS5Db2xvcjtcbiAgcHVibGljIG1hcDogVEhSRUUuVGV4dHVyZSB8IG51bGw7XG4gIHB1YmxpYyBlbWlzc2l2ZTogVEhSRUUuQ29sb3I7XG4gIHB1YmxpYyBlbWlzc2l2ZUludGVuc2l0eTogbnVtYmVyO1xuICBwdWJsaWMgZW1pc3NpdmVNYXA6IFRIUkVFLlRleHR1cmUgfCBudWxsO1xuICBwdWJsaWMgbm9ybWFsTWFwOiBUSFJFRS5UZXh0dXJlIHwgbnVsbDtcbiAgcHVibGljIG5vcm1hbFNjYWxlOiBUSFJFRS5WZWN0b3IyO1xuXG4gIHB1YmxpYyBzaGFkZUNvbG9yRmFjdG9yOiBUSFJFRS5Db2xvcjtcbiAgcHVibGljIHNoYWRlTXVsdGlwbHlUZXh0dXJlOiBUSFJFRS5UZXh0dXJlIHwgbnVsbDtcbiAgcHVibGljIHNoYWRpbmdTaGlmdEZhY3RvcjogbnVtYmVyO1xuICBwdWJsaWMgc2hhZGluZ1NoaWZ0VGV4dHVyZTogVEhSRUUuVGV4dHVyZSB8IG51bGw7XG4gIHB1YmxpYyBzaGFkaW5nU2hpZnRUZXh0dXJlU2NhbGU6IG51bWJlcjtcbiAgcHVibGljIHNoYWRpbmdUb29ueUZhY3RvcjogbnVtYmVyO1xuICBwdWJsaWMgcmltTGlnaHRpbmdNaXhGYWN0b3I6IG51bWJlcjtcbiAgcHVibGljIHJpbU11bHRpcGx5VGV4dHVyZTogVEhSRUUuVGV4dHVyZSB8IG51bGw7XG4gIHB1YmxpYyBtYXRjYXBGYWN0b3I6IFRIUkVFLkNvbG9yO1xuICBwdWJsaWMgbWF0Y2FwVGV4dHVyZTogVEhSRUUuVGV4dHVyZSB8IG51bGw7XG4gIHB1YmxpYyBwYXJhbWV0cmljUmltQ29sb3JGYWN0b3I6IFRIUkVFLkNvbG9yO1xuICBwdWJsaWMgcGFyYW1ldHJpY1JpbUxpZnRGYWN0b3I6IG51bWJlcjtcbiAgcHVibGljIHBhcmFtZXRyaWNSaW1GcmVzbmVsUG93ZXJGYWN0b3I6IG51bWJlcjtcbiAgcHVibGljIG91dGxpbmVXaWR0aE1vZGU6IE1Ub29uTWF0ZXJpYWxPdXRsaW5lV2lkdGhNb2RlO1xuICBwdWJsaWMgb3V0bGluZVdpZHRoTXVsdGlwbHlUZXh0dXJlOiBUSFJFRS5UZXh0dXJlIHwgbnVsbDtcbiAgcHVibGljIG91dGxpbmVXaWR0aEZhY3RvcjogbnVtYmVyO1xuICBwdWJsaWMgb3V0bGluZUNvbG9yRmFjdG9yOiBUSFJFRS5Db2xvcjtcbiAgcHVibGljIG91dGxpbmVMaWdodGluZ01peEZhY3RvcjogbnVtYmVyO1xuICBwdWJsaWMgdXZBbmltYXRpb25TY3JvbGxYU3BlZWRGYWN0b3I6IG51bWJlcjtcbiAgcHVibGljIHV2QW5pbWF0aW9uU2Nyb2xsWVNwZWVkRmFjdG9yOiBudW1iZXI7XG4gIHB1YmxpYyB1dkFuaW1hdGlvblJvdGF0aW9uU3BlZWRGYWN0b3I6IG51bWJlcjtcbiAgcHVibGljIHV2QW5pbWF0aW9uTWFza1RleHR1cmU6IFRIUkVFLlRleHR1cmUgfCBudWxsO1xuXG4gIHB1YmxpYyBzaGFkZUNvbG9yTm9kZTogVEhSRUUuU3dpenphYmxlIHwgbnVsbDtcbiAgcHVibGljIHNoYWRpbmdTaGlmdE5vZGU6IFRIUkVFLk5vZGUgfCBudWxsO1xuICBwdWJsaWMgc2hhZGluZ1Rvb255Tm9kZTogVEhSRUUuTm9kZSB8IG51bGw7XG4gIHB1YmxpYyByaW1MaWdodGluZ01peE5vZGU6IFRIUkVFLk5vZGUgfCBudWxsO1xuICBwdWJsaWMgcmltTXVsdGlwbHlOb2RlOiBUSFJFRS5Ob2RlIHwgbnVsbDtcbiAgcHVibGljIG1hdGNhcE5vZGU6IFRIUkVFLk5vZGUgfCBudWxsO1xuICBwdWJsaWMgcGFyYW1ldHJpY1JpbUNvbG9yTm9kZTogVEhSRUUuU3dpenphYmxlIHwgbnVsbDtcbiAgcHVibGljIHBhcmFtZXRyaWNSaW1MaWZ0Tm9kZTogVEhSRUUuTm9kZSB8IG51bGw7XG4gIHB1YmxpYyBwYXJhbWV0cmljUmltRnJlc25lbFBvd2VyTm9kZTogVEhSRUUuTm9kZSB8IG51bGw7XG5cbiAgcHVibGljIHV2QW5pbWF0aW9uU2Nyb2xsWE9mZnNldDogbnVtYmVyO1xuICBwdWJsaWMgdXZBbmltYXRpb25TY3JvbGxZT2Zmc2V0OiBudW1iZXI7XG4gIHB1YmxpYyB1dkFuaW1hdGlvblJvdGF0aW9uUGhhc2U6IG51bWJlcjtcblxuICBwdWJsaWMgaXNPdXRsaW5lOiBib29sZWFuO1xuXG4gIHByaXZhdGUgX2FuaW1hdGVkVVZOb2RlOiBNVG9vbkFuaW1hdGVkVVZOb2RlIHwgbnVsbDtcblxuICBwdWJsaWMgY3VzdG9tUHJvZ3JhbUNhY2hlS2V5KCk6IHN0cmluZyB7XG4gICAgbGV0IGNhY2hlS2V5ID0gc3VwZXIuY3VzdG9tUHJvZ3JhbUNhY2hlS2V5KCk7XG5cbiAgICBjYWNoZUtleSArPSBgaXNPdXRsaW5lOiR7dGhpcy5pc091dGxpbmV9LGA7XG5cbiAgICByZXR1cm4gY2FjaGVLZXk7XG4gIH1cblxuICAvKipcbiAgICogUmVhZG9ubHkgYm9vbGVhbiB0aGF0IGluZGljYXRlcyB0aGlzIGlzIGEge0BsaW5rIE1Ub29uTm9kZU1hdGVyaWFsfS5cbiAgICovXG4gIHB1YmxpYyBnZXQgaXNNVG9vbk5vZGVNYXRlcmlhbCgpOiB0cnVlIHtcbiAgICByZXR1cm4gdHJ1ZTtcbiAgfVxuXG4gIHB1YmxpYyBjb25zdHJ1Y3RvcihwYXJhbWV0ZXJzOiBNVG9vbk5vZGVNYXRlcmlhbFBhcmFtZXRlcnMgPSB7fSkge1xuICAgIHN1cGVyKCk7XG5cbiAgICBpZiAocGFyYW1ldGVycy50cmFuc3BhcmVudFdpdGhaV3JpdGUpIHtcbiAgICAgIHBhcmFtZXRlcnMuZGVwdGhXcml0ZSA9IHRydWU7XG4gICAgfVxuICAgIGRlbGV0ZSBwYXJhbWV0ZXJzLnRyYW5zcGFyZW50V2l0aFpXcml0ZTtcblxuICAgIC8vIGBNVG9vbk1hdGVyaWFsTG9hZGVyUGx1Z2luYCBhc3NpZ25zIHRoZXNlIHBhcmFtZXRlcnMgdG8gdGhlIG1hdGVyaWFsXG4gICAgLy8gSG93ZXZlciwgYE1Ub29uTm9kZU1hdGVyaWFsYCBkb2VzIG5vdCBzdXBwb3J0IHRoZXNlIHBhcmFtZXRlcnNcbiAgICAvLyBzbyB3ZSBkZWxldGUgdGhlbSBoZXJlIHRvIHN1cHByZXNzIHdhcm5pbmdzXG4gICAgZGVsZXRlIChwYXJhbWV0ZXJzIGFzIGFueSkuZ2lFcXVhbGl6YXRpb25GYWN0b3I7XG4gICAgZGVsZXRlIChwYXJhbWV0ZXJzIGFzIGFueSkudjBDb21wYXRTaGFkZTtcbiAgICBkZWxldGUgKHBhcmFtZXRlcnMgYXMgYW55KS5kZWJ1Z01vZGU7XG5cbiAgICB0aGlzLmVtaXNzaXZlTm9kZSA9IG51bGw7XG5cbiAgICB0aGlzLmxpZ2h0cyA9IHRydWU7XG5cbiAgICB0aGlzLmNvbG9yID0gbmV3IFRIUkVFLkNvbG9yKDEuMCwgMS4wLCAxLjApO1xuICAgIHRoaXMubWFwID0gbnVsbDtcbiAgICB0aGlzLmVtaXNzaXZlID0gbmV3IFRIUkVFLkNvbG9yKDAuMCwgMC4wLCAwLjApO1xuICAgIHRoaXMuZW1pc3NpdmVJbnRlbnNpdHkgPSAxLjA7XG4gICAgdGhpcy5lbWlzc2l2ZU1hcCA9IG51bGw7XG4gICAgdGhpcy5ub3JtYWxNYXAgPSBudWxsO1xuICAgIHRoaXMubm9ybWFsU2NhbGUgPSBuZXcgVEhSRUUuVmVjdG9yMigxLjAsIDEuMCk7XG4gICAgdGhpcy5zaGFkZUNvbG9yRmFjdG9yID0gbmV3IFRIUkVFLkNvbG9yKDAuMCwgMC4wLCAwLjApO1xuICAgIHRoaXMuc2hhZGVNdWx0aXBseVRleHR1cmUgPSBudWxsO1xuICAgIHRoaXMuc2hhZGluZ1NoaWZ0RmFjdG9yID0gMC4wO1xuICAgIHRoaXMuc2hhZGluZ1NoaWZ0VGV4dHVyZSA9IG51bGw7XG4gICAgdGhpcy5zaGFkaW5nU2hpZnRUZXh0dXJlU2NhbGUgPSAxLjA7XG4gICAgdGhpcy5zaGFkaW5nVG9vbnlGYWN0b3IgPSAwLjk7XG4gICAgdGhpcy5yaW1MaWdodGluZ01peEZhY3RvciA9IDEuMDtcbiAgICB0aGlzLnJpbU11bHRpcGx5VGV4dHVyZSA9IG51bGw7XG4gICAgdGhpcy5tYXRjYXBGYWN0b3IgPSBuZXcgVEhSRUUuQ29sb3IoMS4wLCAxLjAsIDEuMCk7XG4gICAgdGhpcy5tYXRjYXBUZXh0dXJlID0gbnVsbDtcbiAgICB0aGlzLnBhcmFtZXRyaWNSaW1Db2xvckZhY3RvciA9IG5ldyBUSFJFRS5Db2xvcigwLjAsIDAuMCwgMC4wKTtcbiAgICB0aGlzLnBhcmFtZXRyaWNSaW1MaWZ0RmFjdG9yID0gMC4wO1xuICAgIHRoaXMucGFyYW1ldHJpY1JpbUZyZXNuZWxQb3dlckZhY3RvciA9IDUuMDtcbiAgICB0aGlzLm91dGxpbmVXaWR0aE1vZGUgPSBNVG9vbk1hdGVyaWFsT3V0bGluZVdpZHRoTW9kZS5Ob25lO1xuICAgIHRoaXMub3V0bGluZVdpZHRoTXVsdGlwbHlUZXh0dXJlID0gbnVsbDtcbiAgICB0aGlzLm91dGxpbmVXaWR0aEZhY3RvciA9IDAuMDtcbiAgICB0aGlzLm91dGxpbmVDb2xvckZhY3RvciA9IG5ldyBUSFJFRS5Db2xvcigwLjAsIDAuMCwgMC4wKTtcbiAgICB0aGlzLm91dGxpbmVMaWdodGluZ01peEZhY3RvciA9IDEuMDtcbiAgICB0aGlzLnV2QW5pbWF0aW9uU2Nyb2xsWFNwZWVkRmFjdG9yID0gMC4wO1xuICAgIHRoaXMudXZBbmltYXRpb25TY3JvbGxZU3BlZWRGYWN0b3IgPSAwLjA7XG4gICAgdGhpcy51dkFuaW1hdGlvblJvdGF0aW9uU3BlZWRGYWN0b3IgPSAwLjA7XG4gICAgdGhpcy51dkFuaW1hdGlvbk1hc2tUZXh0dXJlID0gbnVsbDtcblxuICAgIHRoaXMuc2hhZGVDb2xvck5vZGUgPSBudWxsO1xuICAgIHRoaXMuc2hhZGluZ1NoaWZ0Tm9kZSA9IG51bGw7XG4gICAgdGhpcy5zaGFkaW5nVG9vbnlOb2RlID0gbnVsbDtcbiAgICB0aGlzLnJpbUxpZ2h0aW5nTWl4Tm9kZSA9IG51bGw7XG4gICAgdGhpcy5yaW1NdWx0aXBseU5vZGUgPSBudWxsO1xuICAgIHRoaXMubWF0Y2FwTm9kZSA9IG51bGw7XG4gICAgdGhpcy5wYXJhbWV0cmljUmltQ29sb3JOb2RlID0gbnVsbDtcbiAgICB0aGlzLnBhcmFtZXRyaWNSaW1MaWZ0Tm9kZSA9IG51bGw7XG4gICAgdGhpcy5wYXJhbWV0cmljUmltRnJlc25lbFBvd2VyTm9kZSA9IG51bGw7XG5cbiAgICB0aGlzLnV2QW5pbWF0aW9uU2Nyb2xsWE9mZnNldCA9IDAuMDtcbiAgICB0aGlzLnV2QW5pbWF0aW9uU2Nyb2xsWU9mZnNldCA9IDAuMDtcbiAgICB0aGlzLnV2QW5pbWF0aW9uUm90YXRpb25QaGFzZSA9IDAuMDtcblxuICAgIHRoaXMuaXNPdXRsaW5lID0gZmFsc2U7XG5cbiAgICB0aGlzLl9hbmltYXRlZFVWTm9kZSA9IG51bGw7XG5cbiAgICB0aGlzLnNldFZhbHVlcyhwYXJhbWV0ZXJzKTtcbiAgfVxuXG4gIHB1YmxpYyBzZXR1cExpZ2h0aW5nTW9kZWwoLypidWlsZGVyKi8pOiBNVG9vbkxpZ2h0aW5nTW9kZWwge1xuICAgIHJldHVybiBuZXcgTVRvb25MaWdodGluZ01vZGVsKCk7XG4gIH1cblxuICBwdWJsaWMgc2V0dXAoYnVpbGRlcjogVEhSRUUuTm9kZUJ1aWxkZXIpOiB2b2lkIHtcbiAgICB0aGlzLl9hbmltYXRlZFVWTm9kZSA9IG5ldyBNVG9vbkFuaW1hdGVkVVZOb2RlKFxuICAgICAgKHRoaXMudXZBbmltYXRpb25NYXNrVGV4dHVyZSAmJiB0aGlzLnV2QW5pbWF0aW9uTWFza1RleHR1cmUuaXNUZXh0dXJlID09PSB0cnVlKSA/PyBmYWxzZSxcbiAgICApO1xuXG4gICAgc3VwZXIuc2V0dXAoYnVpbGRlcik7XG4gIH1cblxuICBwdWJsaWMgc2V0dXBEaWZmdXNlQ29sb3IoYnVpbGRlcjogVEhSRUUuTm9kZUJ1aWxkZXIpOiB2b2lkIHtcbiAgICAvLyB3ZSBtdXN0IGFwcGx5IHV2IHNjcm9sbCB0byB0aGUgbWFwXG4gICAgLy8gdGhpcy5jb2xvck5vZGUgd2lsbCBiZSB1c2VkIGluIHN1cGVyLnNldHVwRGlmZnVzZUNvbG9yKCkgc28gd2UgdGVtcG9yYXJpbHkgcmVwbGFjZSBpdFxuICAgIGxldCB0ZW1wQ29sb3JOb2RlOiBUSFJFRS5TaGFkZXJOb2RlT2JqZWN0PFRIUkVFLk5vZGU+IHwgbnVsbCA9IG51bGw7XG5cbiAgICBpZiAodGhpcy5jb2xvck5vZGUgPT0gbnVsbCkge1xuICAgICAgdGVtcENvbG9yTm9kZSA9IHJlZkNvbG9yO1xuXG4gICAgICBpZiAodGhpcy5tYXAgJiYgdGhpcy5tYXAuaXNUZXh0dXJlID09PSB0cnVlKSB7XG4gICAgICAgIGNvbnN0IG1hcCA9IHJlZk1hcC5jb250ZXh0KHsgZ2V0VVY6ICgpID0+IHRoaXMuX2FuaW1hdGVkVVZOb2RlIH0pO1xuICAgICAgICB0ZW1wQ29sb3JOb2RlID0gdGVtcENvbG9yTm9kZS5tdWwobWFwKTtcbiAgICAgIH1cblxuICAgICAgdGhpcy5jb2xvck5vZGUgPSB0ZW1wQ29sb3JOb2RlO1xuICAgIH1cblxuICAgIC8vIE1Ub29uIG11c3QgaWdub3JlIHZlcnRleCBjb2xvciBieSBzcGVjXG4gICAgLy8gU2VlOiBodHRwczovL2dpdGh1Yi5jb20vdnJtLWMvdnJtLXNwZWNpZmljYXRpb24vYmxvYi80MmMwYTkwZTZiNGI3MTAzNTI1Njk5NzhmMTQ5ODBlOWZjOTRiMjVkL3NwZWNpZmljYXRpb24vVlJNQ19tYXRlcmlhbHNfbXRvb24tMS4wL1JFQURNRS5tZCN2ZXJ0ZXgtY29sb3JzXG4gICAgaWYgKHRoaXMudmVydGV4Q29sb3JzID09PSB0cnVlICYmIGJ1aWxkZXIuZ2VvbWV0cnkuaGFzQXR0cmlidXRlKCdjb2xvcicpKSB7XG4gICAgICBjb25zb2xlLndhcm4oXG4gICAgICAgICdNVG9vbk5vZGVNYXRlcmlhbDogTVRvb24gaWdub3JlcyB2ZXJ0ZXggY29sb3JzLiBDb25zaWRlciB1c2luZyBhIG1vZGVsIHdpdGhvdXQgdmVydGV4IGNvbG9ycyBpbnN0ZWFkLicsXG4gICAgICApO1xuICAgICAgdGhpcy52ZXJ0ZXhDb2xvcnMgPSBmYWxzZTtcbiAgICB9XG5cbiAgICAvLyB0aGUgb3JkaW5hcnkgZGlmZnVzZUNvbG9yIHNldHVwXG4gICAgc3VwZXIuc2V0dXBEaWZmdXNlQ29sb3IoYnVpbGRlcik7XG5cbiAgICAvLyBDT01QQVQ6IHByZS1yMTY2XG4gICAgLy8gU2V0IGFscGhhIHRvIDEgaWYgaXQgaXMgb3BhcXVlXG4gICAgLy8gQWRkcmVzc2VkIGluIFRocmVlLmpzIHIxNjYgYnV0IHdlIGxlYXZlIGl0IGhlcmUgZm9yIGNvbXBhdGliaWxpdHlcbiAgICAvLyBTZWU6IGh0dHBzOi8vZ2l0aHViLmNvbS9tcmRvb2IvdGhyZWUuanMvcHVsbC8yODY0NlxuICAgIGlmIChwYXJzZUludChUSFJFRS5SRVZJU0lPTiwgMTApIDwgMTY2KSB7XG4gICAgICBpZiAodGhpcy50cmFuc3BhcmVudCA9PT0gZmFsc2UgJiYgdGhpcy5ibGVuZGluZyA9PT0gVEhSRUUuTm9ybWFsQmxlbmRpbmcgJiYgdGhpcy5hbHBoYVRvQ292ZXJhZ2UgPT09IGZhbHNlKSB7XG4gICAgICAgIFRIUkVFLmRpZmZ1c2VDb2xvci5hLmFzc2lnbigxLjApO1xuICAgICAgfVxuICAgIH1cblxuICAgIC8vIHJldmVydCB0aGUgY29sb3JOb2RlXG4gICAgaWYgKHRoaXMuY29sb3JOb2RlID09PSB0ZW1wQ29sb3JOb2RlKSB7XG4gICAgICB0aGlzLmNvbG9yTm9kZSA9IG51bGw7XG4gICAgfVxuICB9XG5cbiAgcHVibGljIHNldHVwVmFyaWFudHMoKTogdm9pZCB7XG4gICAgc2hhZGVDb2xvci5hc3NpZ24odGhpcy5fc2V0dXBTaGFkZUNvbG9yTm9kZSgpKTtcbiAgICBzaGFkaW5nU2hpZnQuYXNzaWduKHRoaXMuX3NldHVwU2hhZGluZ1NoaWZ0Tm9kZSgpKTtcbiAgICBzaGFkaW5nVG9vbnkuYXNzaWduKHRoaXMuX3NldHVwU2hhZGluZ1Rvb255Tm9kZSgpKTtcbiAgICByaW1MaWdodGluZ01peC5hc3NpZ24odGhpcy5fc2V0dXBSaW1MaWdodGluZ01peE5vZGUoKSk7XG4gICAgcmltTXVsdGlwbHkuYXNzaWduKHRoaXMuX3NldHVwUmltTXVsdGlwbHlOb2RlKCkpO1xuICAgIG1hdGNhcC5hc3NpZ24odGhpcy5fc2V0dXBNYXRjYXBOb2RlKCkpO1xuICAgIHBhcmFtZXRyaWNSaW0uYXNzaWduKHRoaXMuX3NldHVwUGFyYW1ldHJpY1JpbU5vZGUoKSk7XG4gIH1cblxuICBwdWJsaWMgc2V0dXBOb3JtYWwoYnVpbGRlcjogVEhSRUUuTm9kZUJ1aWxkZXIpOiBUSFJFRS5TaGFkZXJOb2RlT2JqZWN0PFRIUkVFLk5vZGU+IHtcbiAgICAvLyB3ZSBtdXN0IGFwcGx5IHV2IHNjcm9sbCB0byB0aGUgbm9ybWFsTWFwXG4gICAgLy8gdGhpcy5ub3JtYWxOb2RlIHdpbGwgYmUgdXNlZCBpbiBzdXBlci5zZXR1cE5vcm1hbCgpIHNvIHdlIHRlbXBvcmFyaWx5IHJlcGxhY2UgaXRcbiAgICBjb25zdCB0ZW1wTm9ybWFsTm9kZSA9IHRoaXMubm9ybWFsTm9kZTtcblxuICAgIGlmICh0aGlzLm5vcm1hbE5vZGUgPT0gbnVsbCkge1xuICAgICAgdGhpcy5ub3JtYWxOb2RlID0gVEhSRUUubWF0ZXJpYWxOb3JtYWw7XG5cbiAgICAgIGlmICh0aGlzLm5vcm1hbE1hcCAmJiB0aGlzLm5vcm1hbE1hcC5pc1RleHR1cmUgPT09IHRydWUpIHtcbiAgICAgICAgY29uc3QgbWFwID0gcmVmTm9ybWFsTWFwLmNvbnRleHQoeyBnZXRVVjogKCkgPT4gdGhpcy5fYW5pbWF0ZWRVVk5vZGUgfSk7XG4gICAgICAgIHRoaXMubm9ybWFsTm9kZSA9IFRIUkVFLm5vcm1hbE1hcChtYXAsIHJlZk5vcm1hbFNjYWxlKTtcbiAgICAgIH1cblxuICAgICAgaWYgKHRoaXMuaXNPdXRsaW5lKSB7XG4gICAgICAgIC8vIFNlZSBhYm91dCB0aGUgdHlwZSBhc3NlcnRpb246IGh0dHBzOi8vZ2l0aHViLmNvbS90aHJlZS10eXBlcy90aHJlZS10cy10eXBlcy9wdWxsLzExMjNcbiAgICAgICAgdGhpcy5ub3JtYWxOb2RlID0gKHRoaXMubm9ybWFsTm9kZSBhcyBUSFJFRS5TaGFkZXJOb2RlT2JqZWN0PFRIUkVFLk5vZGU+KS5uZWdhdGUoKTtcbiAgICAgIH1cbiAgICB9XG5cbiAgICAvLyBDT01QQVQgcjE2ODogYHNldHVwTm9ybWFsYCBub3cgcmV0dXJucyB0aGUgbm9ybWFsIG5vZGVcbiAgICAvLyBpbnN0ZWFkIG9mIGFzc2lnbmluZyBpbnNpZGUgdGhlIGBzdXBlci5zZXR1cE5vcm1hbGBcbiAgICAvLyBTZWU6IGh0dHBzOi8vZ2l0aHViLmNvbS9tcmRvb2IvdGhyZWUuanMvcHVsbC8yOTEzN1xuICAgIGNvbnN0IHRocmVlUmV2aXNpb24gPSBwYXJzZUludChUSFJFRS5SRVZJU0lPTiwgMTApO1xuICAgIGlmICh0aHJlZVJldmlzaW9uID49IDE2OCkge1xuICAgICAgY29uc3QgcmV0ID0gdGhpcy5ub3JtYWxOb2RlIGFzIFRIUkVFLlNoYWRlck5vZGVPYmplY3Q8VEhSRUUuTm9kZT47XG5cbiAgICAgIC8vIHJldmVydCB0aGUgbm9ybWFsTm9kZVxuICAgICAgdGhpcy5ub3JtYWxOb2RlID0gdGVtcE5vcm1hbE5vZGU7XG5cbiAgICAgIHJldHVybiByZXQ7XG4gICAgfSBlbHNlIHtcbiAgICAgIC8vIHByZS1yMTY4XG4gICAgICAvLyB0aGUgb3JkaW5hcnkgbm9ybWFsIHNldHVwXG4gICAgICBzdXBlci5zZXR1cE5vcm1hbChidWlsZGVyKTtcblxuICAgICAgLy8gcmV2ZXJ0IHRoZSBub3JtYWxOb2RlXG4gICAgICB0aGlzLm5vcm1hbE5vZGUgPSB0ZW1wTm9ybWFsTm9kZTtcblxuICAgICAgLy8gdHlwZSB3b3JrYXJvdW5kOiBwcmV0ZW5kIHRvIHJldHVybiBhIHZhbGlkIHZhbHVlXG4gICAgICAvLyByMTY3IGRvZXNuJ3QgdXNlIHRoZSByZXR1cm4gdmFsdWUgYW55d2F5XG4gICAgICByZXR1cm4gdW5kZWZpbmVkIGFzIGFueTtcbiAgICB9XG4gIH1cblxuICBwdWJsaWMgc2V0dXBMaWdodGluZyhidWlsZGVyOiBUSFJFRS5Ob2RlQnVpbGRlcik6IFRIUkVFLk5vZGUge1xuICAgIC8vIHdlIG11c3QgYXBwbHkgdXYgc2Nyb2xsIHRvIHRoZSBlbWlzc2l2ZU1hcFxuICAgIC8vIHRoaXMuZW1pc3NpdmVOb2RlIHdpbGwgYmUgdXNlZCBpbiBzdXBlci5zZXR1cExpZ2h0aW5nKCkgc28gd2UgdGVtcG9yYXJpbHkgcmVwbGFjZSBpdFxuICAgIGxldCB0ZW1wRW1pc3NpdmVOb2RlOiBUSFJFRS5TaGFkZXJOb2RlT2JqZWN0PFRIUkVFLk5vZGU+IHwgbnVsbCA9IG51bGw7XG5cbiAgICBpZiAodGhpcy5lbWlzc2l2ZU5vZGUgPT0gbnVsbCkge1xuICAgICAgdGVtcEVtaXNzaXZlTm9kZSA9IHJlZkVtaXNzaXZlLm11bChyZWZFbWlzc2l2ZUludGVuc2l0eSk7XG5cbiAgICAgIGlmICh0aGlzLmVtaXNzaXZlTWFwICYmIHRoaXMuZW1pc3NpdmVNYXAuaXNUZXh0dXJlID09PSB0cnVlKSB7XG4gICAgICAgIGNvbnN0IG1hcCA9IHJlZkVtaXNzaXZlTWFwLmNvbnRleHQoeyBnZXRVVjogKCkgPT4gdGhpcy5fYW5pbWF0ZWRVVk5vZGUgfSk7XG4gICAgICAgIHRlbXBFbWlzc2l2ZU5vZGUgPSB0ZW1wRW1pc3NpdmVOb2RlLm11bChtYXApO1xuICAgICAgfVxuXG4gICAgICB0aGlzLmVtaXNzaXZlTm9kZSA9IHRlbXBFbWlzc2l2ZU5vZGU7XG4gICAgfVxuXG4gICAgLy8gdGhlIG9yZGluYXJ5IGxpZ2h0aW5nIHNldHVwXG4gICAgY29uc3QgcmV0ID0gc3VwZXIuc2V0dXBMaWdodGluZyhidWlsZGVyKTtcblxuICAgIC8vIHJldmVydCB0aGUgZW1pc3NpdmVOb2RlXG4gICAgaWYgKHRoaXMuZW1pc3NpdmVOb2RlID09PSB0ZW1wRW1pc3NpdmVOb2RlKSB7XG4gICAgICB0aGlzLmVtaXNzaXZlTm9kZSA9IG51bGw7XG4gICAgfVxuXG4gICAgcmV0dXJuIHJldDtcbiAgfVxuXG4gIHB1YmxpYyBzZXR1cE91dHB1dChcbiAgICBidWlsZGVyOiBUSFJFRS5Ob2RlQnVpbGRlcixcbiAgICBvdXRwdXROb2RlOiBUSFJFRS5TaGFkZXJOb2RlT2JqZWN0PFRIUkVFLk5vZGU+LFxuICApOiBUSFJFRS5TaGFkZXJOb2RlT2JqZWN0PFRIUkVFLk5vZGU+IHtcbiAgICAvLyBtaXggb3Igc2V0IG91dGxpbmUgY29sb3JcbiAgICBpZiAodGhpcy5pc091dGxpbmUgJiYgdGhpcy5vdXRsaW5lV2lkdGhNb2RlICE9PSBNVG9vbk1hdGVyaWFsT3V0bGluZVdpZHRoTW9kZS5Ob25lKSB7XG4gICAgICBvdXRwdXROb2RlID0gVEhSRUUudmVjNChcbiAgICAgICAgVEhSRUUubWl4KHJlZk91dGxpbmVDb2xvckZhY3Rvciwgb3V0cHV0Tm9kZS54eXoubXVsKHJlZk91dGxpbmVDb2xvckZhY3RvciksIHJlZk91dGxpbmVMaWdodGluZ01peEZhY3RvciksXG4gICAgICAgIG91dHB1dE5vZGUudyxcbiAgICAgICk7XG4gICAgfVxuXG4gICAgLy8gdGhlIG9yZGluYXJ5IG91dHB1dCBzZXR1cFxuICAgIHJldHVybiBzdXBlci5zZXR1cE91dHB1dChidWlsZGVyLCBvdXRwdXROb2RlKSBhcyBUSFJFRS5TaGFkZXJOb2RlT2JqZWN0PFRIUkVFLk5vZGU+O1xuICB9XG5cbiAgcHVibGljIHNldHVwUG9zaXRpb24oYnVpbGRlcjogVEhSRUUuTm9kZUJ1aWxkZXIpOiBUSFJFRS5TaGFkZXJOb2RlT2JqZWN0PFRIUkVFLk5vZGU+IHtcbiAgICAvLyB3ZSBtdXN0IGFwcGx5IG91dGxpbmUgcG9zaXRpb24gb2Zmc2V0XG4gICAgLy8gdGhpcy5wb3NpdGlvbk5vZGUgd2lsbCBiZSB1c2VkIGluIHN1cGVyLnNldHVwUG9zaXRpb24oKSBzbyB3ZSB0ZW1wb3JhcmlseSByZXBsYWNlIGl0XG4gICAgY29uc3QgdGVtcFBvc2l0aW9uTm9kZSA9IHRoaXMucG9zaXRpb25Ob2RlO1xuXG4gICAgaWYgKHRoaXMuaXNPdXRsaW5lICYmIHRoaXMub3V0bGluZVdpZHRoTW9kZSAhPT0gTVRvb25NYXRlcmlhbE91dGxpbmVXaWR0aE1vZGUuTm9uZSkge1xuICAgICAgdGhpcy5wb3NpdGlvbk5vZGUgPz89IFRIUkVFLnBvc2l0aW9uTG9jYWw7XG5cbiAgICAgIGNvbnN0IG5vcm1hbExvY2FsID0gVEhSRUUubm9ybWFsTG9jYWwubm9ybWFsaXplKCk7XG5cbiAgICAgIGxldCB3aWR0aDogVEhSRUUuU2hhZGVyTm9kZU9iamVjdDxUSFJFRS5Ob2RlPiA9IHJlZk91dGxpbmVXaWR0aEZhY3RvcjtcblxuICAgICAgaWYgKHRoaXMub3V0bGluZVdpZHRoTXVsdGlwbHlUZXh0dXJlICYmIHRoaXMub3V0bGluZVdpZHRoTXVsdGlwbHlUZXh0dXJlLmlzVGV4dHVyZSA9PT0gdHJ1ZSkge1xuICAgICAgICBjb25zdCBtYXAgPSByZWZPdXRsaW5lV2lkdGhNdWx0aXBseVRleHR1cmUuY29udGV4dCh7IGdldFVWOiAoKSA9PiB0aGlzLl9hbmltYXRlZFVWTm9kZSB9KTtcbiAgICAgICAgd2lkdGggPSB3aWR0aC5tdWwobWFwKTtcbiAgICAgIH1cblxuICAgICAgY29uc3Qgd29ybGROb3JtYWxMZW5ndGggPSBUSFJFRS5sZW5ndGgoVEhSRUUubW9kZWxOb3JtYWxNYXRyaXgubXVsKG5vcm1hbExvY2FsKSk7XG4gICAgICBjb25zdCBvdXRsaW5lT2Zmc2V0ID0gd2lkdGgubXVsKHdvcmxkTm9ybWFsTGVuZ3RoKS5tdWwobm9ybWFsTG9jYWwpO1xuXG4gICAgICBpZiAodGhpcy5vdXRsaW5lV2lkdGhNb2RlID09PSBNVG9vbk1hdGVyaWFsT3V0bGluZVdpZHRoTW9kZS5Xb3JsZENvb3JkaW5hdGVzKSB7XG4gICAgICAgIC8vIFNlZSBhYm91dCB0aGUgdHlwZSBhc3NlcnRpb246IGh0dHBzOi8vZ2l0aHViLmNvbS90aHJlZS10eXBlcy90aHJlZS10cy10eXBlcy9wdWxsLzExMjNcbiAgICAgICAgdGhpcy5wb3NpdGlvbk5vZGUgPSAodGhpcy5wb3NpdGlvbk5vZGUgYXMgVEhSRUUuU2hhZGVyTm9kZU9iamVjdDxUSFJFRS5Ob2RlPikuYWRkKG91dGxpbmVPZmZzZXQpO1xuICAgICAgfSBlbHNlIGlmICh0aGlzLm91dGxpbmVXaWR0aE1vZGUgPT09IE1Ub29uTWF0ZXJpYWxPdXRsaW5lV2lkdGhNb2RlLlNjcmVlbkNvb3JkaW5hdGVzKSB7XG4gICAgICAgIGNvbnN0IGNsaXBTY2FsZSA9IFRIUkVFLmNhbWVyYVByb2plY3Rpb25NYXRyaXguZWxlbWVudCgxKS5lbGVtZW50KDEpO1xuXG4gICAgICAgIC8vIFNlZSBhYm91dCB0aGUgdHlwZSBhc3NlcnRpb246IGh0dHBzOi8vZ2l0aHViLmNvbS90aHJlZS10eXBlcy90aHJlZS10cy10eXBlcy9wdWxsLzExMjNcbiAgICAgICAgdGhpcy5wb3NpdGlvbk5vZGUgPSAodGhpcy5wb3NpdGlvbk5vZGUgYXMgVEhSRUUuU2hhZGVyTm9kZU9iamVjdDxUSFJFRS5Ob2RlPikuYWRkKFxuICAgICAgICAgIG91dGxpbmVPZmZzZXQuZGl2KGNsaXBTY2FsZSkubXVsKFRIUkVFLnBvc2l0aW9uVmlldy56Lm5lZ2F0ZSgpKSxcbiAgICAgICAgKTtcbiAgICAgIH1cblxuICAgICAgdGhpcy5wb3NpdGlvbk5vZGUgPz89IFRIUkVFLnBvc2l0aW9uTG9jYWw7XG4gICAgfVxuXG4gICAgLy8gdGhlIG9yZGluYXJ5IHBvc2l0aW9uIHNldHVwXG4gICAgY29uc3QgcmV0ID0gc3VwZXIuc2V0dXBQb3NpdGlvbihidWlsZGVyKSBhcyBUSFJFRS5TaGFkZXJOb2RlT2JqZWN0PFRIUkVFLk5vZGU+O1xuXG4gICAgLy8gYW50aSB6LWZpZ2h0aW5nXG4gICAgLy8gVE9ETzogV2UgbWlnaHQgd2FudCB0byBhZGRyZXNzIHRoaXMgdmlhIGdsUG9seWdvbk9mZnNldCBpbnN0ZWFkP1xuICAgIHJldC56LmFkZChyZXQudy5tdWwoMWUtNikpO1xuXG4gICAgLy8gcmV2ZXJ0IHRoZSBwb3NpdGlvbk5vZGVcbiAgICB0aGlzLnBvc2l0aW9uTm9kZSA9IHRlbXBQb3NpdGlvbk5vZGU7XG5cbiAgICByZXR1cm4gcmV0O1xuICB9XG5cbiAgcHVibGljIGNvcHkoc291cmNlOiBNVG9vbk5vZGVNYXRlcmlhbCk6IHRoaXMge1xuICAgIHRoaXMuY29sb3IuY29weShzb3VyY2UuY29sb3IpO1xuICAgIHRoaXMubWFwID0gc291cmNlLm1hcCA/PyBudWxsO1xuICAgIHRoaXMuZW1pc3NpdmUuY29weShzb3VyY2UuZW1pc3NpdmUpO1xuICAgIHRoaXMuZW1pc3NpdmVJbnRlbnNpdHkgPSBzb3VyY2UuZW1pc3NpdmVJbnRlbnNpdHk7XG4gICAgdGhpcy5lbWlzc2l2ZU1hcCA9IHNvdXJjZS5lbWlzc2l2ZU1hcCA/PyBudWxsO1xuICAgIHRoaXMubm9ybWFsTWFwID0gc291cmNlLm5vcm1hbE1hcCA/PyBudWxsO1xuICAgIHRoaXMubm9ybWFsU2NhbGUuY29weShzb3VyY2Uubm9ybWFsU2NhbGUpO1xuXG4gICAgdGhpcy5zaGFkZUNvbG9yRmFjdG9yLmNvcHkoc291cmNlLnNoYWRlQ29sb3JGYWN0b3IpO1xuICAgIHRoaXMuc2hhZGVNdWx0aXBseVRleHR1cmUgPSBzb3VyY2Uuc2hhZGVNdWx0aXBseVRleHR1cmUgPz8gbnVsbDtcbiAgICB0aGlzLnNoYWRpbmdTaGlmdEZhY3RvciA9IHNvdXJjZS5zaGFkaW5nU2hpZnRGYWN0b3I7XG4gICAgdGhpcy5zaGFkaW5nU2hpZnRUZXh0dXJlID0gc291cmNlLnNoYWRpbmdTaGlmdFRleHR1cmUgPz8gbnVsbDtcbiAgICB0aGlzLnNoYWRpbmdTaGlmdFRleHR1cmVTY2FsZSA9IHNvdXJjZS5zaGFkaW5nU2hpZnRUZXh0dXJlU2NhbGU7XG4gICAgdGhpcy5zaGFkaW5nVG9vbnlGYWN0b3IgPSBzb3VyY2Uuc2hhZGluZ1Rvb255RmFjdG9yO1xuICAgIHRoaXMucmltTGlnaHRpbmdNaXhGYWN0b3IgPSBzb3VyY2UucmltTGlnaHRpbmdNaXhGYWN0b3I7XG4gICAgdGhpcy5yaW1NdWx0aXBseVRleHR1cmUgPSBzb3VyY2UucmltTXVsdGlwbHlUZXh0dXJlID8/IG51bGw7XG4gICAgdGhpcy5tYXRjYXBGYWN0b3IuY29weShzb3VyY2UubWF0Y2FwRmFjdG9yKTtcbiAgICB0aGlzLm1hdGNhcFRleHR1cmUgPSBzb3VyY2UubWF0Y2FwVGV4dHVyZSA/PyBudWxsO1xuICAgIHRoaXMucGFyYW1ldHJpY1JpbUNvbG9yRmFjdG9yLmNvcHkoc291cmNlLnBhcmFtZXRyaWNSaW1Db2xvckZhY3Rvcik7XG4gICAgdGhpcy5wYXJhbWV0cmljUmltTGlmdEZhY3RvciA9IHNvdXJjZS5wYXJhbWV0cmljUmltTGlmdEZhY3RvcjtcbiAgICB0aGlzLnBhcmFtZXRyaWNSaW1GcmVzbmVsUG93ZXJGYWN0b3IgPSBzb3VyY2UucGFyYW1ldHJpY1JpbUZyZXNuZWxQb3dlckZhY3RvcjtcbiAgICB0aGlzLm91dGxpbmVXaWR0aE1vZGUgPSBzb3VyY2Uub3V0bGluZVdpZHRoTW9kZTtcbiAgICB0aGlzLm91dGxpbmVXaWR0aE11bHRpcGx5VGV4dHVyZSA9IHNvdXJjZS5vdXRsaW5lV2lkdGhNdWx0aXBseVRleHR1cmUgPz8gbnVsbDtcbiAgICB0aGlzLm91dGxpbmVXaWR0aEZhY3RvciA9IHNvdXJjZS5vdXRsaW5lV2lkdGhGYWN0b3I7XG4gICAgdGhpcy5vdXRsaW5lQ29sb3JGYWN0b3IuY29weShzb3VyY2Uub3V0bGluZUNvbG9yRmFjdG9yKTtcbiAgICB0aGlzLm91dGxpbmVMaWdodGluZ01peEZhY3RvciA9IHNvdXJjZS5vdXRsaW5lTGlnaHRpbmdNaXhGYWN0b3I7XG4gICAgdGhpcy51dkFuaW1hdGlvblNjcm9sbFhTcGVlZEZhY3RvciA9IHNvdXJjZS51dkFuaW1hdGlvblNjcm9sbFhTcGVlZEZhY3RvcjtcbiAgICB0aGlzLnV2QW5pbWF0aW9uU2Nyb2xsWVNwZWVkRmFjdG9yID0gc291cmNlLnV2QW5pbWF0aW9uU2Nyb2xsWVNwZWVkRmFjdG9yO1xuICAgIHRoaXMudXZBbmltYXRpb25Sb3RhdGlvblNwZWVkRmFjdG9yID0gc291cmNlLnV2QW5pbWF0aW9uUm90YXRpb25TcGVlZEZhY3RvcjtcbiAgICB0aGlzLnV2QW5pbWF0aW9uTWFza1RleHR1cmUgPSBzb3VyY2UudXZBbmltYXRpb25NYXNrVGV4dHVyZSA/PyBudWxsO1xuXG4gICAgdGhpcy5zaGFkZUNvbG9yTm9kZSA9IHNvdXJjZS5zaGFkZUNvbG9yTm9kZSA/PyBudWxsO1xuICAgIHRoaXMuc2hhZGluZ1NoaWZ0Tm9kZSA9IHNvdXJjZS5zaGFkaW5nU2hpZnROb2RlID8/IG51bGw7XG4gICAgdGhpcy5zaGFkaW5nVG9vbnlOb2RlID0gc291cmNlLnNoYWRpbmdUb29ueU5vZGUgPz8gbnVsbDtcbiAgICB0aGlzLnJpbUxpZ2h0aW5nTWl4Tm9kZSA9IHNvdXJjZS5yaW1MaWdodGluZ01peE5vZGUgPz8gbnVsbDtcbiAgICB0aGlzLnJpbU11bHRpcGx5Tm9kZSA9IHNvdXJjZS5yaW1NdWx0aXBseU5vZGUgPz8gbnVsbDtcbiAgICB0aGlzLm1hdGNhcE5vZGUgPSBzb3VyY2UubWF0Y2FwTm9kZSA/PyBudWxsO1xuICAgIHRoaXMucGFyYW1ldHJpY1JpbUNvbG9yTm9kZSA9IHNvdXJjZS5wYXJhbWV0cmljUmltQ29sb3JOb2RlID8/IG51bGw7XG4gICAgdGhpcy5wYXJhbWV0cmljUmltTGlmdE5vZGUgPSBzb3VyY2UucGFyYW1ldHJpY1JpbUxpZnROb2RlID8/IG51bGw7XG4gICAgdGhpcy5wYXJhbWV0cmljUmltRnJlc25lbFBvd2VyTm9kZSA9IHNvdXJjZS5wYXJhbWV0cmljUmltRnJlc25lbFBvd2VyTm9kZSA/PyBudWxsO1xuXG4gICAgdGhpcy5pc091dGxpbmUgPSBzb3VyY2UuaXNPdXRsaW5lID8/IG51bGw7XG5cbiAgICByZXR1cm4gc3VwZXIuY29weShzb3VyY2UpO1xuICB9XG5cbiAgcHVibGljIHVwZGF0ZShkZWx0YTogbnVtYmVyKTogdm9pZCB7XG4gICAgdGhpcy51dkFuaW1hdGlvblNjcm9sbFhPZmZzZXQgKz0gZGVsdGEgKiB0aGlzLnV2QW5pbWF0aW9uU2Nyb2xsWFNwZWVkRmFjdG9yO1xuICAgIHRoaXMudXZBbmltYXRpb25TY3JvbGxZT2Zmc2V0ICs9IGRlbHRhICogdGhpcy51dkFuaW1hdGlvblNjcm9sbFlTcGVlZEZhY3RvcjtcbiAgICB0aGlzLnV2QW5pbWF0aW9uUm90YXRpb25QaGFzZSArPSBkZWx0YSAqIHRoaXMudXZBbmltYXRpb25Sb3RhdGlvblNwZWVkRmFjdG9yO1xuICB9XG5cbiAgcHJpdmF0ZSBfc2V0dXBTaGFkZUNvbG9yTm9kZSgpOiBUSFJFRS5Td2l6emFibGUge1xuICAgIGlmICh0aGlzLnNoYWRlQ29sb3JOb2RlICE9IG51bGwpIHtcbiAgICAgIHJldHVybiBUSFJFRS52ZWMzKHRoaXMuc2hhZGVDb2xvck5vZGUpO1xuICAgIH1cblxuICAgIGxldCBzaGFkZUNvbG9yTm9kZTogVEhSRUUuU2hhZGVyTm9kZU9iamVjdDxUSFJFRS5Ob2RlPiA9IHJlZlNoYWRlQ29sb3JGYWN0b3I7XG5cbiAgICBpZiAodGhpcy5zaGFkZU11bHRpcGx5VGV4dHVyZSAmJiB0aGlzLnNoYWRlTXVsdGlwbHlUZXh0dXJlLmlzVGV4dHVyZSA9PT0gdHJ1ZSkge1xuICAgICAgY29uc3QgbWFwID0gcmVmU2hhZGVNdWx0aXBseVRleHR1cmUuY29udGV4dCh7IGdldFVWOiAoKSA9PiB0aGlzLl9hbmltYXRlZFVWTm9kZSB9KTtcbiAgICAgIHNoYWRlQ29sb3JOb2RlID0gc2hhZGVDb2xvck5vZGUubXVsKG1hcCk7XG4gICAgfVxuXG4gICAgcmV0dXJuIHNoYWRlQ29sb3JOb2RlO1xuICB9XG5cbiAgcHJpdmF0ZSBfc2V0dXBTaGFkaW5nU2hpZnROb2RlKCk6IFRIUkVFLk5vZGUge1xuICAgIGlmICh0aGlzLnNoYWRpbmdTaGlmdE5vZGUgIT0gbnVsbCkge1xuICAgICAgcmV0dXJuIFRIUkVFLmZsb2F0KHRoaXMuc2hhZGluZ1NoaWZ0Tm9kZSk7XG4gICAgfVxuXG4gICAgbGV0IHNoYWRpbmdTaGlmdE5vZGU6IFRIUkVFLlNoYWRlck5vZGVPYmplY3Q8VEhSRUUuTm9kZT4gPSByZWZTaGFkaW5nU2hpZnRGYWN0b3I7XG5cbiAgICBpZiAodGhpcy5zaGFkaW5nU2hpZnRUZXh0dXJlICYmIHRoaXMuc2hhZGluZ1NoaWZ0VGV4dHVyZS5pc1RleHR1cmUgPT09IHRydWUpIHtcbiAgICAgIGNvbnN0IG1hcCA9IHJlZlNoYWRlTXVsdGlwbHlUZXh0dXJlLmNvbnRleHQoeyBnZXRVVjogKCkgPT4gdGhpcy5fYW5pbWF0ZWRVVk5vZGUgfSk7XG4gICAgICBzaGFkaW5nU2hpZnROb2RlID0gc2hhZGluZ1NoaWZ0Tm9kZS5hZGQobWFwLm11bChyZWZTaGFkZU11bHRpcGx5VGV4dHVyZVNjYWxlKSk7XG4gICAgfVxuXG4gICAgcmV0dXJuIHNoYWRpbmdTaGlmdE5vZGU7XG4gIH1cblxuICBwcml2YXRlIF9zZXR1cFNoYWRpbmdUb29ueU5vZGUoKTogVEhSRUUuTm9kZSB7XG4gICAgaWYgKHRoaXMuc2hhZGluZ1Rvb255Tm9kZSAhPSBudWxsKSB7XG4gICAgICByZXR1cm4gVEhSRUUuZmxvYXQodGhpcy5zaGFkaW5nVG9vbnlOb2RlKTtcbiAgICB9XG5cbiAgICByZXR1cm4gcmVmU2hhZGluZ1Rvb255RmFjdG9yO1xuICB9XG5cbiAgcHJpdmF0ZSBfc2V0dXBSaW1MaWdodGluZ01peE5vZGUoKTogVEhSRUUuTm9kZSB7XG4gICAgaWYgKHRoaXMucmltTGlnaHRpbmdNaXhOb2RlICE9IG51bGwpIHtcbiAgICAgIHJldHVybiBUSFJFRS5mbG9hdCh0aGlzLnJpbUxpZ2h0aW5nTWl4Tm9kZSk7XG4gICAgfVxuXG4gICAgcmV0dXJuIHJlZlJpbUxpZ2h0aW5nTWl4RmFjdG9yO1xuICB9XG5cbiAgcHJpdmF0ZSBfc2V0dXBSaW1NdWx0aXBseU5vZGUoKTogVEhSRUUuU3dpenphYmxlIHtcbiAgICBpZiAodGhpcy5yaW1NdWx0aXBseU5vZGUgIT0gbnVsbCkge1xuICAgICAgcmV0dXJuIFRIUkVFLnZlYzModGhpcy5yaW1NdWx0aXBseU5vZGUpO1xuICAgIH1cblxuICAgIGlmICh0aGlzLnJpbU11bHRpcGx5VGV4dHVyZSAmJiB0aGlzLnJpbU11bHRpcGx5VGV4dHVyZS5pc1RleHR1cmUgPT09IHRydWUpIHtcbiAgICAgIGNvbnN0IG1hcCA9IHJlZlJpbU11bHRpcGx5VGV4dHVyZS5jb250ZXh0KHsgZ2V0VVY6ICgpID0+IHRoaXMuX2FuaW1hdGVkVVZOb2RlIH0pO1xuICAgICAgcmV0dXJuIG1hcDtcbiAgICB9XG5cbiAgICByZXR1cm4gVEhSRUUudmVjMygxLjApO1xuICB9XG5cbiAgcHJpdmF0ZSBfc2V0dXBNYXRjYXBOb2RlKCk6IFRIUkVFLlN3aXp6YWJsZSB7XG4gICAgaWYgKHRoaXMubWF0Y2FwTm9kZSAhPSBudWxsKSB7XG4gICAgICByZXR1cm4gVEhSRUUudmVjMyh0aGlzLm1hdGNhcE5vZGUpO1xuICAgIH1cblxuICAgIGlmICh0aGlzLm1hdGNhcFRleHR1cmUgJiYgdGhpcy5tYXRjYXBUZXh0dXJlLmlzVGV4dHVyZSA9PT0gdHJ1ZSkge1xuICAgICAgY29uc3QgbWFwID0gcmVmTWF0Y2FwVGV4dHVyZS5jb250ZXh0KHsgZ2V0VVY6ICgpID0+IFRIUkVFLm1hdGNhcFVWLm11bCgxLjAsIC0xLjApLmFkZCgwLjAsIDEuMCkgfSk7XG4gICAgICByZXR1cm4gbWFwLm11bChyZWZNYXRjYXBGYWN0b3IpO1xuICAgIH1cblxuICAgIHJldHVybiBUSFJFRS52ZWMzKDAuMCk7XG4gIH1cblxuICBwcml2YXRlIF9zZXR1cFBhcmFtZXRyaWNSaW1Ob2RlKCk6IFRIUkVFLlN3aXp6YWJsZSB7XG4gICAgY29uc3QgcGFyYW1ldHJpY1JpbUNvbG9yID1cbiAgICAgIHRoaXMucGFyYW1ldHJpY1JpbUNvbG9yTm9kZSAhPSBudWxsID8gVEhSRUUudmVjMyh0aGlzLnBhcmFtZXRyaWNSaW1Db2xvck5vZGUpIDogcmVmUGFyYW1ldHJpY1JpbUNvbG9yRmFjdG9yO1xuXG4gICAgY29uc3QgcGFyYW1ldHJpY1JpbUxpZnQgPVxuICAgICAgdGhpcy5wYXJhbWV0cmljUmltTGlmdE5vZGUgIT0gbnVsbCA/IFRIUkVFLmZsb2F0KHRoaXMucGFyYW1ldHJpY1JpbUxpZnROb2RlKSA6IHJlZlBhcmFtZXRyaWNSaW1MaWZ0RmFjdG9yO1xuXG4gICAgY29uc3QgcGFyYW1ldHJpY1JpbUZyZXNuZWxQb3dlciA9XG4gICAgICB0aGlzLnBhcmFtZXRyaWNSaW1GcmVzbmVsUG93ZXJOb2RlICE9IG51bGxcbiAgICAgICAgPyBUSFJFRS5mbG9hdCh0aGlzLnBhcmFtZXRyaWNSaW1GcmVzbmVsUG93ZXJOb2RlKVxuICAgICAgICA6IHJlZlBhcmFtZXRyaWNSaW1GcmVzbmVsUG93ZXJGYWN0b3I7XG5cbiAgICByZXR1cm4gbXRvb25QYXJhbWV0cmljUmltKHtcbiAgICAgIHBhcmFtZXRyaWNSaW1MaWZ0LFxuICAgICAgcGFyYW1ldHJpY1JpbUZyZXNuZWxQb3dlcixcbiAgICAgIHBhcmFtZXRyaWNSaW1Db2xvcixcbiAgICB9KTtcbiAgfVxufVxuXG4vLyBUT0RPOiBQYXJ0IG9mIHN0dWZmIHRoYXQgTVRvb25NYXRlcmlhbCBkZXBlbmRzIG9uIGRvZXMgbm90IGV4aXN0IGluIHRocmVlL3dlYmdwdSAoZS5nLiBVbmlmb3Jtc0xpYilcbi8vIFRIUkVFLmFkZE5vZGVNYXRlcmlhbCgnTVRvb25Ob2RlTWF0ZXJpYWwnLCBNVG9vbk5vZGVNYXRlcmlhbCk7XG4iLCAiLyogZXNsaW50LWRpc2FibGUgQHR5cGVzY3JpcHQtZXNsaW50L25hbWluZy1jb252ZW50aW9uICovXG5cbmV4cG9ydCBjb25zdCBNVG9vbk1hdGVyaWFsT3V0bGluZVdpZHRoTW9kZSA9IHtcbiAgTm9uZTogJ25vbmUnLFxuICBXb3JsZENvb3JkaW5hdGVzOiAnd29ybGRDb29yZGluYXRlcycsXG4gIFNjcmVlbkNvb3JkaW5hdGVzOiAnc2NyZWVuQ29vcmRpbmF0ZXMnLFxufSBhcyBjb25zdDtcblxuZXhwb3J0IHR5cGUgTVRvb25NYXRlcmlhbE91dGxpbmVXaWR0aE1vZGUgPVxuICAodHlwZW9mIE1Ub29uTWF0ZXJpYWxPdXRsaW5lV2lkdGhNb2RlKVtrZXlvZiB0eXBlb2YgTVRvb25NYXRlcmlhbE91dGxpbmVXaWR0aE1vZGVdO1xuIiwgImltcG9ydCAqIGFzIFRIUkVFIGZyb20gJ3RocmVlL3dlYmdwdSc7XG5pbXBvcnQgeyBGbkNvbXBhdCB9IGZyb20gJy4vdXRpbHMvRm5Db21wYXQnO1xuXG5leHBvcnQgY29uc3QgbXRvb25QYXJhbWV0cmljUmltID0gRm5Db21wYXQoXG4gICh7XG4gICAgcGFyYW1ldHJpY1JpbUxpZnQsXG4gICAgcGFyYW1ldHJpY1JpbUZyZXNuZWxQb3dlcixcbiAgICBwYXJhbWV0cmljUmltQ29sb3IsXG4gIH06IHtcbiAgICBwYXJhbWV0cmljUmltTGlmdDogVEhSRUUuTm9kZVJlcHJlc2VudGF0aW9uO1xuICAgIHBhcmFtZXRyaWNSaW1GcmVzbmVsUG93ZXI6IFRIUkVFLk5vZGVSZXByZXNlbnRhdGlvbjtcbiAgICBwYXJhbWV0cmljUmltQ29sb3I6IFRIUkVFLk5vZGVSZXByZXNlbnRhdGlvbjtcbiAgfSkgPT4ge1xuICAgIGNvbnN0IHZpZXdEaXIgPSBUSFJFRS5tb2RlbFZpZXdQb3NpdGlvbi5ub3JtYWxpemUoKTtcbiAgICBjb25zdCBkb3ROViA9IFRIUkVFLnRyYW5zZm9ybWVkTm9ybWFsVmlldy5kb3Qodmlld0Rpci5uZWdhdGUoKSk7XG5cbiAgICBjb25zdCByaW0gPSBUSFJFRS5mbG9hdCgxLjApLnN1Yihkb3ROVikuYWRkKHBhcmFtZXRyaWNSaW1MaWZ0KS5jbGFtcCgpLnBvdyhwYXJhbWV0cmljUmltRnJlc25lbFBvd2VyKTtcblxuICAgIHJldHVybiByaW0ubXVsKHBhcmFtZXRyaWNSaW1Db2xvcik7XG4gIH0sXG4pO1xuIl0sCiAgIm1hcHBpbmdzIjogIjs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTs7O0FDR0EsWUFBdUI7QUFFdkIsSUFBTSxnQkFBZ0IsU0FBZSxnQkFBVSxFQUFFO0FBQ2pELElBQUksZ0JBQWdCLEtBQUs7QUFDdkIsVUFBUTtBQUFBLElBQ04sc0VBQXNFLGFBQWE7QUFBQSxFQUNyRjtBQUNGOzs7QUNWQSxJQUFBQSxTQUF1Qjs7O0FDQXZCLElBQUFDLFNBQXVCO0FBRWhCLElBQU0sV0FBaUIseUJBQWtCLFNBQVMsT0FBTztBQUN6RCxJQUFNLFNBQWUseUJBQWtCLE9BQU8sU0FBUztBQUN2RCxJQUFNLGVBQXFCLHlCQUFrQixhQUFhLFNBQVM7QUFDbkUsSUFBTSxpQkFBdUIseUJBQWtCLGVBQWUsTUFBTTtBQUNwRSxJQUFNLGNBQW9CLHlCQUFrQixZQUFZLE9BQU87QUFDL0QsSUFBTSx1QkFBNkIseUJBQWtCLHFCQUFxQixPQUFPO0FBQ2pGLElBQU0saUJBQXVCLHlCQUFrQixlQUFlLFNBQVM7QUFFdkUsSUFBTSxzQkFBNEIseUJBQWtCLG9CQUFvQixPQUFPO0FBQy9FLElBQU0sd0JBQThCLHlCQUFrQixzQkFBc0IsT0FBTztBQUNuRixJQUFNLDBCQUFnQyx5QkFBa0Isd0JBQXdCLFNBQVM7QUFDekYsSUFBTSwrQkFBcUMseUJBQWtCLDZCQUE2QixPQUFPO0FBQ2pHLElBQU0sd0JBQThCLHlCQUFrQixzQkFBc0IsT0FBTztBQUNuRixJQUFNLDBCQUFnQyx5QkFBa0Isd0JBQXdCLE9BQU87QUFDdkYsSUFBTSx3QkFBOEIseUJBQWtCLHNCQUFzQixTQUFTO0FB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O0FBRUEsV0FBTztBQUFBLEVBQ1Q7QUFBQSxFQUVRLHlCQUFxQztBQUMzQyxRQUFJLEtBQUssb0JBQW9CLE1BQU07QUFDakMsYUFBYSxhQUFNLEtBQUssZ0JBQWdCO0FBQUEsSUFDMUM7QUFFQSxXQUFPO0FBQUEsRUFDVDtBQUFBLEVBRVEsMkJBQXVDO0FBQzdDLFFBQUksS0FBSyxzQkFBc0IsTUFBTTtBQUNuQyxhQUFhLGFBQU0sS0FBSyxrQkFBa0I7QUFBQSxJQUM1QztBQUVBLFdBQU87QUFBQSxFQUNUO0FBQUEsRUFFUSx3QkFBeUM7QUFDL0MsUUFBSSxLQUFLLG1CQUFtQixNQUFNO0FBQ2hDLGFBQWEsWUFBSyxLQUFLLGVBQWU7QUFBQSxJQUN4QztBQUVBLFFBQUksS0FBSyxzQkFBc0IsS0FBSyxtQkFBbUIsY0FBYyxNQUFNO0FBQ3pFLFlBQU0sTUFBTSxzQkFBc0IsUUFBUSxFQUFFLE9BQU8sTUFBTSxLQUFLLGdCQUFnQixDQUFDO0FBQy9FLGFBQU87QUFBQSxJQUNUO0FBRUEsV0FBYSxZQUFLLENBQUc7QUFBQSxFQUN2QjtBQUFBLEVBRVEsbUJBQW9DO0FBQzFDLFFBQUksS0FBSyxjQUFjLE1BQU07QUFDM0IsYUFBYSxZQUFLLEtBQUssVUFBVTtBQUFBLElBQ25DO0FBRUEsUUFBSSxLQUFLLGlCQUFpQixLQUFLLGNBQWMsY0FBYyxNQUFNO0FBQy9ELFlBQU0sTUFBTSxpQkFBaUIsUUFBUSxFQUFFLE9BQU8sTUFBWSxnQkFBUyxJQUFJLEdBQUssRUFBSSxFQUFFLElBQUksR0FBSyxDQUFHLEVBQUUsQ0FBQztBQUNqRyxhQUFPLElBQUksSUFBSSxlQUFlO0FBQUEsSUFDaEM7QUFFQSxXQUFhLFlBQUssQ0FBRztBQUFBLEVBQ3ZCO0FBQUEsRUFFUSwwQkFBMkM7QUFDakQsVUFBTSxxQkFDSixLQUFLLDBCQUEwQixPQUFhLFlBQUssS0FBSyxzQkFBc0IsSUFBSTtBQUVsRixVQUFNLG9CQUNKLEtBQUsseUJBQXlCLE9BQWEsYUFBTSxLQUFLLHFCQUFxQixJQUFJO0FBRWpGLFVBQU0sNEJBQ0osS0FBSyxpQ0FBaUMsT0FDNUIsYUFBTSxLQUFLLDZCQUE2QixJQUM5QztBQUVOLFdBQU8sbUJBQW1CO0FBQUEsTUFDeEI7QUFBQSxNQUNBO0FBQUEsTUFDQTtBQUFBLElBQ0YsQ0FBQztBQUFBLEVBQ0g7QUFDRjsiLAogICJuYW1lcyI6IFsiVEhSRUUiLCAiVEhSRUUiLCAidXYiLCAiVEhSRUUiLCAiVEhSRUUiLCAiVEhSRUUiLCAidGhyZWVSZXZpc2lvbiIsICJkaWZmdXNlQ29sb3IiLCAiVEhSRUUiLCAiVEhSRUUiLCAidGhyZWVSZXZpc2lvbiIsICJub3JtYWxMb2NhbCJdCn0K
