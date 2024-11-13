/*!
 * @pixiv/three-vrm v3.1.4
 * VRM file loader for three.js.
 *
 * Copyright (c) 2019-2024 pixiv Inc.
 * @pixiv/three-vrm is distributed under MIT License
 * https://github.com/pixiv/three-vrm/blob/release/LICENSE
 */

// ../three-vrm-materials-mtoon/lib/nodes/index.module.js
import * as THREE from "three";
import * as THREE3 from "three/webgpu";
import * as THREE2 from "three/webgpu";
import * as THREE6 from "three/webgpu";
import * as THREE4 from "three/webgpu";
import * as THREE5 from "three/webgpu";
import * as THREE8 from "three/webgpu";
import * as THREE7 from "three/webgpu";
var threeRevision = parseInt(THREE.REVISION, 10);
if (threeRevision < 167) {
  console.warn(
    `MToonNodeMaterial requires Three.js r167 or higher (You are using r${threeRevision}). This would not work correctly.`
  );
}
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
var shadeColor = THREE4.nodeImmutable(THREE4.PropertyNode, "vec3").temp("ShadeColor");
var shadingShift = THREE4.nodeImmutable(THREE4.PropertyNode, "float").temp("ShadingShift");
var shadingToony = THREE4.nodeImmutable(THREE4.PropertyNode, "float").temp("ShadingToony");
var rimLightingMix = THREE4.nodeImmutable(THREE4.PropertyNode, "float").temp("RimLightingMix");
var rimMultiply = THREE4.nodeImmutable(THREE4.PropertyNode, "vec3").temp("RimMultiply");
var matcap = THREE4.nodeImmutable(THREE4.PropertyNode, "vec3").temp("matcap");
var parametricRim = THREE4.nodeImmutable(THREE4.PropertyNode, "vec3").temp("ParametricRim");
var FnCompat = (jsFunc) => {
  const threeRevision2 = parseInt(THREE5.REVISION, 10);
  if (threeRevision2 >= 168) {
    return THREE5.Fn(jsFunc);
  } else {
    return THREE5.tslFn(jsFunc);
  }
};
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
var MToonMaterialOutlineWidthMode = {
  None: "none",
  WorldCoordinates: "worldCoordinates",
  ScreenCoordinates: "screenCoordinates"
};
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
export {
  MToonAnimatedUVNode,
  MToonLightingModel,
  MToonNodeMaterial
};
/*!
 * @pixiv/three-vrm-materials-mtoon v3.1.4
 * MToon (toon material) module for @pixiv/three-vrm
 *
 * Copyright (c) 2019-2024 pixiv Inc.
 * @pixiv/three-vrm-materials-mtoon is distributed under MIT License
 * https://github.com/pixiv/three-vrm/blob/release/LICENSE
 */
//# sourceMappingURL=data:application/json;base64,ewogICJ2ZXJzaW9uIjogMywKICAic291cmNlcyI6IFsiLi4vLi4vLi4vdGhyZWUtdnJtLW1hdGVyaWFscy1tdG9vbi9zcmMvbm9kZXMvd2FybmluZ0lmUHJlMTYxLnRzIiwgIi4uLy4uLy4uL3RocmVlLXZybS1tYXRlcmlhbHMtbXRvb24vc3JjL25vZGVzL01Ub29uQW5pbWF0ZWRVVk5vZGUudHMiLCAiLi4vLi4vLi4vdGhyZWUtdnJtLW1hdGVyaWFscy1tdG9vbi9zcmMvbm9kZXMvbWF0ZXJpYWxSZWZlcmVuY2VzLnRzIiwgIi4uLy4uLy4uL3RocmVlLXZybS1tYXRlcmlhbHMtbXRvb24vc3JjL25vZGVzL01Ub29uTGlnaHRpbmdNb2RlbC50cyIsICIuLi8uLi8uLi90aHJlZS12cm0tbWF0ZXJpYWxzLW10b29uL3NyYy9ub2Rlcy9pbW11dGFibGVOb2Rlcy50cyIsICIuLi8uLi8uLi90aHJlZS12cm0tbWF0ZXJpYWxzLW10b29uL3NyYy9ub2Rlcy91dGlscy9GbkNvbXBhdC50cyIsICIuLi8uLi8uLi90aHJlZS12cm0tbWF0ZXJpYWxzLW10b29uL3NyYy9ub2Rlcy9NVG9vbk5vZGVNYXRlcmlhbC50cyIsICIuLi8uLi8uLi90aHJlZS12cm0tbWF0ZXJpYWxzLW10b29uL3NyYy9NVG9vbk1hdGVyaWFsT3V0bGluZVdpZHRoTW9kZS50cyIsICIuLi8uLi8uLi90aHJlZS12cm0tbWF0ZXJpYWxzLW10b29uL3NyYy9ub2Rlcy9tdG9vblBhcmFtZXRyaWNSaW0udHMiXSwKICAic291cmNlc0NvbnRlbnQiOiBbIi8vIFRoaXMgbW9kdWxlIHdpbGwgYmUgaW1wb3J0ZWQgYXQgdGhlIGJlZ2lubmluZyBvZiBgdGhyZWUtdnJtLW1hdGVyaWFscy1tdG9vbi9ub2Rlc2Bcbi8vIElmIHRoZSB2ZXJzaW9uIG9mIFRocmVlLmpzIGlzIGxlc3MgdGhhbiByMTY3LCBpdCB3aWxsIHdhcm4gdGhhdCBpdCBpcyBub3Qgc3VwcG9ydGVkXG5cbmltcG9ydCAqIGFzIFRIUkVFIGZyb20gJ3RocmVlJztcblxuY29uc3QgdGhyZWVSZXZpc2lvbiA9IHBhcnNlSW50KFRIUkVFLlJFVklTSU9OLCAxMCk7XG5pZiAodGhyZWVSZXZpc2lvbiA8IDE2Nykge1xuICBjb25zb2xlLndhcm4oXG4gICAgYE1Ub29uTm9kZU1hdGVyaWFsIHJlcXVpcmVzIFRocmVlLmpzIHIxNjcgb3IgaGlnaGVyIChZb3UgYXJlIHVzaW5nIHIke3RocmVlUmV2aXNpb259KS4gVGhpcyB3b3VsZCBub3Qgd29yayBjb3JyZWN0bHkuYCxcbiAgKTtcbn1cbiIsICJpbXBvcnQgKiBhcyBUSFJFRSBmcm9tICd0aHJlZS93ZWJncHUnO1xuaW1wb3J0IHtcbiAgcmVmVVZBbmltYXRpb25NYXNrVGV4dHVyZSxcbiAgcmVmVVZBbmltYXRpb25Sb3RhdGlvblBoYXNlLFxuICByZWZVVkFuaW1hdGlvblNjcm9sbFhPZmZzZXQsXG4gIHJlZlVWQW5pbWF0aW9uU2Nyb2xsWU9mZnNldCxcbn0gZnJvbSAnLi9tYXRlcmlhbFJlZmVyZW5jZXMnO1xuXG5leHBvcnQgY2xhc3MgTVRvb25BbmltYXRlZFVWTm9kZSBleHRlbmRzIFRIUkVFLlRlbXBOb2RlIHtcbiAgcHVibGljIHJlYWRvbmx5IGhhc01hc2tUZXh0dXJlOiBib29sZWFuO1xuXG4gIHB1YmxpYyBjb25zdHJ1Y3RvcihoYXNNYXNrVGV4dHVyZTogYm9vbGVhbikge1xuICAgIHN1cGVyKCd2ZWMyJyk7XG5cbiAgICB0aGlzLmhhc01hc2tUZXh0dXJlID0gaGFzTWFza1RleHR1cmU7XG4gIH1cblxuICBwdWJsaWMgc2V0dXAoKTogVEhSRUUuU2hhZGVyTm9kZU9iamVjdDxUSFJFRS5WYXJOb2RlPiB7XG4gICAgbGV0IHV2QW5pbWF0aW9uTWFzazogVEhSRUUuTm9kZVJlcHJlc2VudGF0aW9uID0gMS4wO1xuXG4gICAgaWYgKHRoaXMuaGFzTWFza1RleHR1cmUpIHtcbiAgICAgIHV2QW5pbWF0aW9uTWFzayA9IFRIUkVFLnZlYzQocmVmVVZBbmltYXRpb25NYXNrVGV4dHVyZSkuY29udGV4dCh7IGdldFVWOiAoKSA9PiBUSFJFRS51digpIH0pLnI7XG4gICAgfVxuXG4gICAgbGV0IHV2OiBUSFJFRS5TaGFkZXJOb2RlT2JqZWN0PFRIUkVFLlN3aXp6YWJsZT4gPSBUSFJFRS51digpO1xuXG4gICAgLy8gcm90YXRlXG4gICAgY29uc3QgcGhhc2UgPSByZWZVVkFuaW1hdGlvblJvdGF0aW9uUGhhc2UubXVsKHV2QW5pbWF0aW9uTWFzayk7XG5cbiAgICAvLyBXT1JLQVJPVU5EOiBUSFJFRS5yb3RhdGVVViBjYXVzZXMgYW4gaXNzdWUgd2l0aCB0aGUgbWFzayB0ZXh0dXJlXG4gICAgLy8gV2UgYXJlIGdvaW5nIHRvIHNwaW4gdXNpbmcgYSAxMDAlIG9yZ2FuaWMgaGFuZG1hZGUgcm90YXRpb24gbWF0cml4XG4gICAgLy8gdXYgPSBUSFJFRS5yb3RhdGVVVih1diwgcGhhc2UsIFRIUkVFLnZlYzIoMC41LCAwLjUpKTtcblxuICAgIGNvbnN0IGMgPSBUSFJFRS5jb3MocGhhc2UpO1xuICAgIGNvbnN0IHMgPSBUSFJFRS5zaW4ocGhhc2UpO1xuICAgIHV2ID0gdXYuc3ViKFRIUkVFLnZlYzIoMC41LCAwLjUpKTtcbiAgICB1diA9IHV2Lm11bChUSFJFRS5tYXQyKGMsIHMsIHMubmVnYXRlKCksIGMpKTtcbiAgICB1diA9IHV2LmFkZChUSFJFRS52ZWMyKDAuNSwgMC41KSk7XG5cbiAgICAvLyBzY3JvbGxcbiAgICBjb25zdCBzY3JvbGwgPSBUSFJFRS52ZWMyKHJlZlVWQW5pbWF0aW9uU2Nyb2xsWE9mZnNldCwgcmVmVVZBbmltYXRpb25TY3JvbGxZT2Zmc2V0KS5tdWwodXZBbmltYXRpb25NYXNrKTtcbiAgICB1diA9IHV2LmFkZChzY3JvbGwpO1xuXG4gICAgcmV0dXJuIHV2LnRlbXAoJ0FuaW1hdGVkVVYnKTtcbiAgfVxufVxuIiwgImltcG9ydCAqIGFzIFRIUkVFIGZyb20gJ3RocmVlL3dlYmdwdSc7XG5cbmV4cG9ydCBjb25zdCByZWZDb2xvciA9IFRIUkVFLm1hdGVyaWFsUmVmZXJlbmNlKCdjb2xvcicsICdjb2xvcicpO1xuZXhwb3J0IGNvbnN0IHJlZk1hcCA9IFRIUkVFLm1hdGVyaWFsUmVmZXJlbmNlKCdtYXAnLCAndGV4dHVyZScpO1xuZXhwb3J0IGNvbnN0IHJlZk5vcm1hbE1hcCA9IFRIUkVFLm1hdGVyaWFsUmVmZXJlbmNlKCdub3JtYWxNYXAnLCAndGV4dHVyZScpO1xuZXhwb3J0IGNvbnN0IHJlZk5vcm1hbFNjYWxlID0gVEhSRUUubWF0ZXJpYWxSZWZlcmVuY2UoJ25vcm1hbFNjYWxlJywgJ3ZlYzInKTtcbmV4cG9ydCBjb25zdCByZWZFbWlzc2l2ZSA9IFRIUkVFLm1hdGVyaWFsUmVmZXJlbmNlKCdlbWlzc2l2ZScsICdjb2xvcicpO1xuZXhwb3J0IGNvbnN0IHJlZkVtaXNzaXZlSW50ZW5zaXR5ID0gVEhSRUUubWF0ZXJpYWxSZWZlcmVuY2UoJ2VtaXNzaXZlSW50ZW5zaXR5JywgJ2Zsb2F0Jyk7XG5leHBvcnQgY29uc3QgcmVmRW1pc3NpdmVNYXAgPSBUSFJFRS5tYXRlcmlhbFJlZmVyZW5jZSgnZW1pc3NpdmVNYXAnLCAndGV4dHVyZScpO1xuXG5leHBvcnQgY29uc3QgcmVmU2hhZGVDb2xvckZhY3RvciA9IFRIUkVFLm1hdGVyaWFsUmVmZXJlbmNlKCdzaGFkZUNvbG9yRmFjdG9yJywgJ2NvbG9yJyk7XG5leHBvcnQgY29uc3QgcmVmU2hhZGluZ1NoaWZ0RmFjdG9yID0gVEhSRUUubWF0ZXJpYWxSZWZlcmVuY2UoJ3NoYWRpbmdTaGlmdEZhY3RvcicsICdmbG9hdCcpO1xuZXhwb3J0IGNvbnN0IHJlZlNoYWRlTXVsdGlwbHlUZXh0dXJlID0gVEhSRUUubWF0ZXJpYWxSZWZlcmVuY2UoJ3NoYWRlTXVsdGlwbHlUZXh0dXJlJywgJ3RleHR1cmUnKTtcbmV4cG9ydCBjb25zdCByZWZTaGFkZU11bHRpcGx5VGV4dHVyZVNjYWxlID0gVEhSRUUubWF0ZXJpYWxSZWZlcmVuY2UoJ3NoYWRlTXVsdGlwbHlUZXh0dXJlU2NhbGUnLCAnZmxvYXQnKTtcbmV4cG9ydCBjb25zdCByZWZTaGFkaW5nVG9vbnlGYWN0b3IgPSBUSFJFRS5tYXRlcmlhbFJlZmVyZW5jZSgnc2hhZGluZ1Rvb255RmFjdG9yJywgJ2Zsb2F0Jyk7XG5leHBvcnQgY29uc3QgcmVmUmltTGlnaHRpbmdNaXhGYWN0b3IgPSBUSFJFRS5tYXRlcmlhbFJlZmVyZW5jZSgncmltTGlnaHRpbmdNaXhGYWN0b3InLCAnZmxvYXQnKTtcbmV4cG9ydCBjb25zdCByZWZSaW1NdWx0aXBseVRleHR1cmUgPSBUSFJFRS5tYXRlcmlhbFJlZmVyZW5jZSgncmltTXVsdGlwbHlUZXh0dXJlJywgJ3RleHR1cmUnKTtcbmV4cG9ydCBjb25zdCByZWZNYXRjYXBGYWN0b3IgPSBUSFJFRS5tYXRlcmlhbFJlZmVyZW5jZSgnbWF0Y2FwRmFjdG9yJywgJ2NvbG9yJyk7XG5leHBvcnQgY29uc3QgcmVmTWF0Y2FwVGV4dHVyZSA9IFRIUkVFLm1hdGVyaWFsUmVmZXJlbmNlKCdtYXRjYXBUZXh0dXJlJywgJ3RleHR1cmUnKTtcbmV4cG9ydCBjb25zdCByZWZQYXJhbWV0cmljUmltQ29sb3JGYWN0b3IgPSBUSFJFRS5tYXRlcmlhbFJlZmVyZW5jZSgncGFyYW1ldHJpY1JpbUNvbG9yRmFjdG9yJywgJ2NvbG9yJyk7XG5leHBvcnQgY29uc3QgcmVmUGFyYW1ldHJpY1JpbUxpZnRGYWN0b3IgPSBUSFJFRS5tYXRlcmlhbFJlZmVyZW5jZSgncGFyYW1ldHJpY1JpbUxpZnRGYWN0b3InLCAnZmxvYXQnKTtcbmV4cG9ydCBjb25zdCByZWZQYXJhbWV0cmljUmltRnJlc25lbFBvd2VyRmFjdG9yID0gVEhSRUUubWF0ZXJpYWxSZWZlcmVuY2UoJ3BhcmFtZXRyaWNSaW1GcmVzbmVsUG93ZXJGYWN0b3InLCAnZmxvYXQnKTtcbmV4cG9ydCBjb25zdCByZWZPdXRsaW5lV2lkdGhNdWx0aXBseVRleHR1cmUgPSBUSFJFRS5tYXRlcmlhbFJlZmVyZW5jZSgnb3V0bGluZVdpZHRoTXVsdGlwbHlUZXh0dXJlJywgJ3RleHR1cmUnKTtcbmV4cG9ydCBjb25zdCByZWZPdXRsaW5lV2lkdGhGYWN0b3IgPSBUSFJFRS5tYXRlcmlhbFJlZmVyZW5jZSgnb3V0bGluZVdpZHRoRmFjdG9yJywgJ2Zsb2F0Jyk7XG5leHBvcnQgY29uc3QgcmVmT3V0bGluZUNvbG9yRmFjdG9yID0gVEhSRUUubWF0ZXJpYWxSZWZlcmVuY2UoJ291dGxpbmVDb2xvckZhY3RvcicsICdjb2xvcicpO1xuZXhwb3J0IGNvbnN0IHJlZk91dGxpbmVMaWdodGluZ01peEZhY3RvciA9IFRIUkVFLm1hdGVyaWFsUmVmZXJlbmNlKCdvdXRsaW5lTGlnaHRpbmdNaXhGYWN0b3InLCAnZmxvYXQnKTtcbmV4cG9ydCBjb25zdCByZWZVVkFuaW1hdGlvbk1hc2tUZXh0dXJlID0gVEhSRUUubWF0ZXJpYWxSZWZlcmVuY2UoJ3V2QW5pbWF0aW9uTWFza1RleHR1cmUnLCAndGV4dHVyZScpO1xuXG5leHBvcnQgY29uc3QgcmVmVVZBbmltYXRpb25TY3JvbGxYT2Zmc2V0ID0gVEhSRUUubWF0ZXJpYWxSZWZlcmVuY2UoJ3V2QW5pbWF0aW9uU2Nyb2xsWE9mZnNldCcsICdmbG9hdCcpO1xuZXhwb3J0IGNvbnN0IHJlZlVWQW5pbWF0aW9uU2Nyb2xsWU9mZnNldCA9IFRIUkVFLm1hdGVyaWFsUmVmZXJlbmNlKCd1dkFuaW1hdGlvblNjcm9sbFlPZmZzZXQnLCAnZmxvYXQnKTtcbmV4cG9ydCBjb25zdCByZWZVVkFuaW1hdGlvblJvdGF0aW9uUGhhc2UgPSBUSFJFRS5tYXRlcmlhbFJlZmVyZW5jZSgndXZBbmltYXRpb25Sb3RhdGlvblBoYXNlJywgJ2Zsb2F0Jyk7XG4iLCAiaW1wb3J0ICogYXMgVEhSRUUgZnJvbSAndGhyZWUvd2ViZ3B1JztcbmltcG9ydCB7XG4gIG1hdGNhcCxcbiAgcGFyYW1ldHJpY1JpbSxcbiAgcmltTGlnaHRpbmdNaXgsXG4gIHJpbU11bHRpcGx5LFxuICBzaGFkZUNvbG9yLFxuICBzaGFkaW5nU2hpZnQsXG4gIHNoYWRpbmdUb29ueSxcbn0gZnJvbSAnLi9pbW11dGFibGVOb2Rlcyc7XG5pbXBvcnQgeyBGbkNvbXBhdCB9IGZyb20gJy4vdXRpbHMvRm5Db21wYXQnO1xuXG4vLyBUT0RPOiAwJSBjb25maWRlbmNlIGFib3V0IGZ1bmN0aW9uIHR5cGVzLlxuXG5jb25zdCBsaW5lYXJzdGVwID0gRm5Db21wYXQoXG4gICh7XG4gICAgYSxcbiAgICBiLFxuICAgIHQsXG4gIH06IHtcbiAgICBhOiBUSFJFRS5TaGFkZXJOb2RlT2JqZWN0PFRIUkVFLk5vZGU+O1xuICAgIGI6IFRIUkVFLlNoYWRlck5vZGVPYmplY3Q8VEhSRUUuTm9kZT47XG4gICAgdDogVEhSRUUuU2hhZGVyTm9kZU9iamVjdDxUSFJFRS5Ob2RlPjtcbiAgfSkgPT4ge1xuICAgIGNvbnN0IHRvcCA9IHQuc3ViKGEpO1xuICAgIGNvbnN0IGJvdHRvbSA9IGIuc3ViKGEpO1xuICAgIHJldHVybiB0b3AuZGl2KGJvdHRvbSkuY2xhbXAoKTtcbiAgfSxcbik7XG5cbi8qKlxuICogQ29udmVydCBOZG90TCBpbnRvIHRvb24gc2hhZGluZyBmYWN0b3IgdXNpbmcgc2hhZGluZ1NoaWZ0IGFuZCBzaGFkaW5nVG9vbnlcbiAqL1xuY29uc3QgZ2V0U2hhZGluZyA9IEZuQ29tcGF0KCh7IGRvdE5MIH06IHsgZG90Tkw6IFRIUkVFLlNoYWRlck5vZGVPYmplY3Q8VEhSRUUuTm9kZT4gfSkgPT4ge1xuICBjb25zdCBzaGFkb3cgPSAxLjA7IC8vIFRPRE9cblxuICBjb25zdCBmZWF0aGVyID0gVEhSRUUuZmxvYXQoMS4wKS5zdWIoc2hhZGluZ1Rvb255KTtcblxuICBsZXQgc2hhZGluZzogVEhSRUUuU2hhZGVyTm9kZU9iamVjdDxUSFJFRS5Ob2RlPiA9IGRvdE5MLmFkZChzaGFkaW5nU2hpZnQpO1xuICBzaGFkaW5nID0gbGluZWFyc3RlcCh7XG4gICAgYTogZmVhdGhlci5uZWdhdGUoKSxcbiAgICBiOiBmZWF0aGVyLFxuICAgIHQ6IHNoYWRpbmcsXG4gIH0pO1xuICBzaGFkaW5nID0gc2hhZGluZy5tdWwoc2hhZG93KTtcbiAgcmV0dXJuIHNoYWRpbmc7XG59KTtcblxuLyoqXG4gKiBNaXggZGlmZnVzZUNvbG9yIGFuZCBzaGFkZUNvbG9yIHVzaW5nIHNoYWRpbmcgZmFjdG9yIGFuZCBsaWdodCBjb2xvclxuICovXG5jb25zdCBnZXREaWZmdXNlID0gRm5Db21wYXQoXG4gICh7XG4gICAgc2hhZGluZyxcbiAgICBsaWdodENvbG9yLFxuICB9OiB7XG4gICAgc2hhZGluZzogVEhSRUUuU2hhZGVyTm9kZU9iamVjdDxUSFJFRS5Ob2RlPjtcbiAgICBsaWdodENvbG9yOiBUSFJFRS5TaGFkZXJOb2RlT2JqZWN0PFRIUkVFLk5vZGU+O1xuICB9KSA9PiB7XG4gICAgY29uc3QgZGlmZnVzZUNvbG9yID0gVEhSRUUubWl4KHNoYWRlQ29sb3IsIFRIUkVFLmRpZmZ1c2VDb2xvciwgc2hhZGluZyk7XG4gICAgY29uc3QgY29sID0gbGlnaHRDb2xvci5tdWwoVEhSRUUuQlJERl9MYW1iZXJ0KHsgZGlmZnVzZUNvbG9yIH0pKTtcblxuICAgIHJldHVybiBjb2w7XG4gIH0sXG4pO1xuXG5leHBvcnQgY2xhc3MgTVRvb25MaWdodGluZ01vZGVsIGV4dGVuZHMgVEhSRUUuTGlnaHRpbmdNb2RlbCB7XG4gIGNvbnN0cnVjdG9yKCkge1xuICAgIHN1cGVyKCk7XG4gIH1cblxuICBkaXJlY3QoeyBsaWdodERpcmVjdGlvbiwgbGlnaHRDb2xvciwgcmVmbGVjdGVkTGlnaHQgfTogVEhSRUUuTGlnaHRpbmdNb2RlbERpcmVjdElucHV0KSB7XG4gICAgY29uc3QgZG90TkwgPSBUSFJFRS50cmFuc2Zvcm1lZE5vcm1hbFZpZXcuZG90KGxpZ2h0RGlyZWN0aW9uKS5jbGFtcCgtMS4wLCAxLjApO1xuXG4gICAgLy8gdG9vbiBkaWZmdXNlXG4gICAgY29uc3Qgc2hhZGluZyA9IGdldFNoYWRpbmcoe1xuICAgICAgZG90TkwsXG4gICAgfSk7XG5cbiAgICAvLyBVbmFibGUgdG8gdXNlIGBhZGRBc3NpZ25gIGluIHRoZSBjdXJyZW50IEB0eXBlcy90aHJlZSwgd2UgdXNlIGBhc3NpZ25gIGFuZCBgYWRkYCBpbnN0ZWFkXG4gICAgLy8gVE9ETzogRml4IHRoZSBgYWRkQXNzaWduYCBpc3N1ZSBmcm9tIHRoZSBgQHR5cGVzL3RocmVlYCBzaWRlXG5cbiAgICAocmVmbGVjdGVkTGlnaHQuZGlyZWN0RGlmZnVzZSBhcyBUSFJFRS5TaGFkZXJOb2RlT2JqZWN0PFRIUkVFLk5vZGU+KS5hc3NpZ24oXG4gICAgICAocmVmbGVjdGVkTGlnaHQuZGlyZWN0RGlmZnVzZSBhcyBUSFJFRS5TaGFkZXJOb2RlT2JqZWN0PFRIUkVFLk5vZGU+KS5hZGQoXG4gICAgICAgIGdldERpZmZ1c2Uoe1xuICAgICAgICAgIHNoYWRpbmcsXG4gICAgICAgICAgbGlnaHRDb2xvcjogbGlnaHRDb2xvciBhcyBUSFJFRS5TaGFkZXJOb2RlT2JqZWN0PFRIUkVFLk5vZGU+LFxuICAgICAgICB9KSxcbiAgICAgICksXG4gICAgKTtcblxuICAgIC8vIHJpbVxuICAgIChyZWZsZWN0ZWRMaWdodC5kaXJlY3RTcGVjdWxhciBhcyBUSFJFRS5TaGFkZXJOb2RlT2JqZWN0PFRIUkVFLk5vZGU+KS5hc3NpZ24oXG4gICAgICAocmVmbGVjdGVkTGlnaHQuZGlyZWN0U3BlY3VsYXIgYXMgVEhSRUUuU2hhZGVyTm9kZU9iamVjdDxUSFJFRS5Ob2RlPikuYWRkKFxuICAgICAgICBwYXJhbWV0cmljUmltXG4gICAgICAgICAgLmFkZChtYXRjYXApXG4gICAgICAgICAgLm11bChyaW1NdWx0aXBseSlcbiAgICAgICAgICAubXVsKFRIUkVFLm1peChUSFJFRS52ZWMzKDAuMCksIFRIUkVFLkJSREZfTGFtYmVydCh7IGRpZmZ1c2VDb2xvcjogbGlnaHRDb2xvciB9KSwgcmltTGlnaHRpbmdNaXgpKSxcbiAgICAgICksXG4gICAgKTtcbiAgfVxuXG4gIGluZGlyZWN0KGNvbnRleHQ6IFRIUkVFLkxpZ2h0aW5nTW9kZWxJbmRpcmVjdElucHV0KSB7XG4gICAgdGhpcy5pbmRpcmVjdERpZmZ1c2UoY29udGV4dCk7XG4gICAgdGhpcy5pbmRpcmVjdFNwZWN1bGFyKGNvbnRleHQpO1xuICB9XG5cbiAgaW5kaXJlY3REaWZmdXNlKHsgaXJyYWRpYW5jZSwgcmVmbGVjdGVkTGlnaHQgfTogVEhSRUUuTGlnaHRpbmdNb2RlbEluZGlyZWN0SW5wdXQpIHtcbiAgICAvLyBpbmRpcmVjdCBpcnJhZGlhbmNlXG4gICAgKHJlZmxlY3RlZExpZ2h0LmluZGlyZWN0RGlmZnVzZSBhcyBUSFJFRS5TaGFkZXJOb2RlT2JqZWN0PFRIUkVFLk5vZGU+KS5hc3NpZ24oXG4gICAgICAocmVmbGVjdGVkTGlnaHQuaW5kaXJlY3REaWZmdXNlIGFzIFRIUkVFLlNoYWRlck5vZGVPYmplY3Q8VEhSRUUuTm9kZT4pLmFkZChcbiAgICAgICAgKGlycmFkaWFuY2UgYXMgVEhSRUUuU2hhZGVyTm9kZU9iamVjdDxUSFJFRS5Ob2RlPikubXVsKFxuICAgICAgICAgIFRIUkVFLkJSREZfTGFtYmVydCh7XG4gICAgICAgICAgICBkaWZmdXNlQ29sb3I6IFRIUkVFLmRpZmZ1c2VDb2xvcixcbiAgICAgICAgICB9KSxcbiAgICAgICAgKSxcbiAgICAgICksXG4gICAgKTtcbiAgfVxuXG4gIGluZGlyZWN0U3BlY3VsYXIoeyByZWZsZWN0ZWRMaWdodCB9OiBUSFJFRS5MaWdodGluZ01vZGVsSW5kaXJlY3RJbnB1dCkge1xuICAgIC8vIHJpbVxuICAgIChyZWZsZWN0ZWRMaWdodC5pbmRpcmVjdFNwZWN1bGFyIGFzIFRIUkVFLlNoYWRlck5vZGVPYmplY3Q8VEhSRUUuTm9kZT4pLmFzc2lnbihcbiAgICAgIChyZWZsZWN0ZWRMaWdodC5pbmRpcmVjdFNwZWN1bGFyIGFzIFRIUkVFLlNoYWRlck5vZGVPYmplY3Q8VEhSRUUuTm9kZT4pLmFkZChcbiAgICAgICAgcGFyYW1ldHJpY1JpbVxuICAgICAgICAgIC5hZGQobWF0Y2FwKVxuICAgICAgICAgIC5tdWwocmltTXVsdGlwbHkpXG4gICAgICAgICAgLm11bChUSFJFRS5taXgoVEhSRUUudmVjMygxLjApLCBUSFJFRS52ZWMzKDAuMCksIHJpbUxpZ2h0aW5nTWl4KSksXG4gICAgICApLFxuICAgICk7XG4gIH1cbn1cbiIsICJpbXBvcnQgKiBhcyBUSFJFRSBmcm9tICd0aHJlZS93ZWJncHUnO1xuXG5leHBvcnQgY29uc3Qgc2hhZGVDb2xvciA9IFRIUkVFLm5vZGVJbW11dGFibGUoVEhSRUUuUHJvcGVydHlOb2RlLCAndmVjMycpLnRlbXAoJ1NoYWRlQ29sb3InKTtcbmV4cG9ydCBjb25zdCBzaGFkaW5nU2hpZnQgPSBUSFJFRS5ub2RlSW1tdXRhYmxlKFRIUkVFLlByb3BlcnR5Tm9kZSwgJ2Zsb2F0JykudGVtcCgnU2hhZGluZ1NoaWZ0Jyk7XG5leHBvcnQgY29uc3Qgc2hhZGluZ1Rvb255ID0gVEhSRUUubm9kZUltbXV0YWJsZShUSFJFRS5Qcm9wZXJ0eU5vZGUsICdmbG9hdCcpLnRlbXAoJ1NoYWRpbmdUb29ueScpO1xuZXhwb3J0IGNvbnN0IHJpbUxpZ2h0aW5nTWl4ID0gVEhSRUUubm9kZUltbXV0YWJsZShUSFJFRS5Qcm9wZXJ0eU5vZGUsICdmbG9hdCcpLnRlbXAoJ1JpbUxpZ2h0aW5nTWl4Jyk7XG5leHBvcnQgY29uc3QgcmltTXVsdGlwbHkgPSBUSFJFRS5ub2RlSW1tdXRhYmxlKFRIUkVFLlByb3BlcnR5Tm9kZSwgJ3ZlYzMnKS50ZW1wKCdSaW1NdWx0aXBseScpO1xuZXhwb3J0IGNvbnN0IG1hdGNhcCA9IFRIUkVFLm5vZGVJbW11dGFibGUoVEhSRUUuUHJvcGVydHlOb2RlLCAndmVjMycpLnRlbXAoJ21hdGNhcCcpO1xuZXhwb3J0IGNvbnN0IHBhcmFtZXRyaWNSaW0gPSBUSFJFRS5ub2RlSW1tdXRhYmxlKFRIUkVFLlByb3BlcnR5Tm9kZSwgJ3ZlYzMnKS50ZW1wKCdQYXJhbWV0cmljUmltJyk7XG4iLCAiaW1wb3J0ICogYXMgVEhSRUUgZnJvbSAndGhyZWUvd2ViZ3B1JztcblxuLyoqXG4gKiBBIGNvbXBhdCBmdW5jdGlvbiBmb3IgYEZuKClgIC8gYHRzbEZuKClgLlxuICogYHRzbEZuKClgIGhhcyBiZWVuIHJlbmFtZWQgdG8gYEZuKClgIGluIHIxNjguXG4gKiBXZSBhcmUgZ29pbmcgdG8gdXNlIHRoaXMgY29tcGF0IGZvciBhIHdoaWxlLlxuICpcbiAqIFNlZTogaHR0cHM6Ly9naXRodWIuY29tL21yZG9vYi90aHJlZS5qcy9wdWxsLzI5MDY0XG4gKi9cbi8vIGVzbGludC1kaXNhYmxlLW5leHQtbGluZSBAdHlwZXNjcmlwdC1lc2xpbnQvbmFtaW5nLWNvbnZlbnRpb25cbmV4cG9ydCBjb25zdCBGbkNvbXBhdDogdHlwZW9mIFRIUkVFLkZuID0gKGpzRnVuYzogYW55KSA9PiB7XG4gIC8vIENPTVBBVCByMTY4OiBgdHNsRm4oKWAgaGFzIGJlZW4gcmVuYW1lZCB0byBgRm4oKWBcbiAgLy8gU2VlOiBodHRwczovL2dpdGh1Yi5jb20vbXJkb29iL3RocmVlLmpzL3B1bGwvMjkwNjRcbiAgY29uc3QgdGhyZWVSZXZpc2lvbiA9IHBhcnNlSW50KFRIUkVFLlJFVklTSU9OLCAxMCk7XG4gIGlmICh0aHJlZVJldmlzaW9uID49IDE2OCkge1xuICAgIHJldHVybiBUSFJFRS5Gbihqc0Z1bmMpO1xuICB9IGVsc2Uge1xuICAgIHJldHVybiAoVEhSRUUgYXMgYW55KS50c2xGbihqc0Z1bmMpO1xuICB9XG59O1xuIiwgImltcG9ydCAqIGFzIFRIUkVFIGZyb20gJ3RocmVlL3dlYmdwdSc7XG5cbmltcG9ydCB0eXBlIHsgTVRvb25NYXRlcmlhbCB9IGZyb20gJy4uL01Ub29uTWF0ZXJpYWwnO1xuaW1wb3J0IHsgTVRvb25MaWdodGluZ01vZGVsIH0gZnJvbSAnLi9NVG9vbkxpZ2h0aW5nTW9kZWwnO1xuaW1wb3J0IHtcbiAgcmltTGlnaHRpbmdNaXgsXG4gIG1hdGNhcCxcbiAgc2hhZGVDb2xvcixcbiAgc2hhZGluZ1NoaWZ0LFxuICBzaGFkaW5nVG9vbnksXG4gIHJpbU11bHRpcGx5LFxuICBwYXJhbWV0cmljUmltLFxufSBmcm9tICcuL2ltbXV0YWJsZU5vZGVzJztcbmltcG9ydCB7XG4gIHJlZkNvbG9yLFxuICByZWZFbWlzc2l2ZSxcbiAgcmVmRW1pc3NpdmVJbnRlbnNpdHksXG4gIHJlZkVtaXNzaXZlTWFwLFxuICByZWZNYXAsXG4gIHJlZk1hdGNhcEZhY3RvcixcbiAgcmVmTWF0Y2FwVGV4dHVyZSxcbiAgcmVmTm9ybWFsTWFwLFxuICByZWZOb3JtYWxTY2FsZSxcbiAgcmVmT3V0bGluZUNvbG9yRmFjdG9yLFxuICByZWZPdXRsaW5lTGlnaHRpbmdNaXhGYWN0b3IsXG4gIHJlZk91dGxpbmVXaWR0aEZhY3RvcixcbiAgcmVmT3V0bGluZVdpZHRoTXVsdGlwbHlUZXh0dXJlLFxuICByZWZQYXJhbWV0cmljUmltQ29sb3JGYWN0b3IsXG4gIHJlZlBhcmFtZXRyaWNSaW1GcmVzbmVsUG93ZXJGYWN0b3IsXG4gIHJlZlBhcmFtZXRyaWNSaW1MaWZ0RmFjdG9yLFxuICByZWZSaW1MaWdodGluZ01peEZhY3RvcixcbiAgcmVmUmltTXVsdGlwbHlUZXh0dXJlLFxuICByZWZTaGFkZUNvbG9yRmFjdG9yLFxuICByZWZTaGFkZU11bHRpcGx5VGV4dHVyZSxcbiAgcmVmU2hhZGVNdWx0aXBseVRleHR1cmVTY2FsZSxcbiAgcmVmU2hhZGluZ1NoaWZ0RmFjdG9yLFxuICByZWZTaGFkaW5nVG9vbnlGYWN0b3IsXG59IGZyb20gJy4vbWF0ZXJpYWxSZWZlcmVuY2VzJztcbmltcG9ydCB7IE1Ub29uQW5pbWF0ZWRVVk5vZGUgfSBmcm9tICcuL01Ub29uQW5pbWF0ZWRVVk5vZGUnO1xuaW1wb3J0IHsgTVRvb25NYXRlcmlhbE91dGxpbmVXaWR0aE1vZGUgfSBmcm9tICcuLi9NVG9vbk1hdGVyaWFsT3V0bGluZVdpZHRoTW9kZSc7XG5pbXBvcnQgeyBNVG9vbk5vZGVNYXRlcmlhbFBhcmFtZXRlcnMgfSBmcm9tICcuL01Ub29uTm9kZU1hdGVyaWFsUGFyYW1ldGVycyc7XG5pbXBvcnQgeyBtdG9vblBhcmFtZXRyaWNSaW0gfSBmcm9tICcuL210b29uUGFyYW1ldHJpY1JpbSc7XG5cbi8qKlxuICogTVRvb24gaXMgYSBtYXRlcmlhbCBzcGVjaWZpY2F0aW9uIHRoYXQgaGFzIHZhcmlvdXMgZmVhdHVyZXMuXG4gKiBUaGUgc3BlYyBhbmQgaW1wbGVtZW50YXRpb24gYXJlIG9yaWdpbmFsbHkgZm91bmRlZCBmb3IgVW5pdHkgZW5naW5lIGFuZCB0aGlzIGlzIGEgcG9ydCBvZiB0aGUgbWF0ZXJpYWwuXG4gKlxuICogVGhpcyBtYXRlcmlhbCBpcyBhIE5vZGVNYXRlcmlhbCB2YXJpYW50IG9mIHtAbGluayBNVG9vbk1hdGVyaWFsfS5cbiAqXG4gKiBTZWU6IGh0dHBzOi8vZ2l0aHViLmNvbS9TYW50YXJoL01Ub29uXG4gKi9cbmV4cG9ydCBjbGFzcyBNVG9vbk5vZGVNYXRlcmlhbCBleHRlbmRzIFRIUkVFLk5vZGVNYXRlcmlhbCB7XG4gIHB1YmxpYyBlbWlzc2l2ZU5vZGU6IFRIUkVFLlNoYWRlck5vZGVPYmplY3Q8VEhSRUUuTm9kZT4gfCBudWxsO1xuXG4gIHB1YmxpYyBjb2xvcjogVEhSRUUuQ29sb3I7XG4gIHB1YmxpYyBtYXA6IFRIUkVFLlRleHR1cmUgfCBudWxsO1xuICBwdWJsaWMgZW1pc3NpdmU6IFRIUkVFLkNvbG9yO1xuICBwdWJsaWMgZW1pc3NpdmVJbnRlbnNpdHk6IG51bWJlcjtcbiAgcHVibGljIGVtaXNzaXZlTWFwOiBUSFJFRS5UZXh0dXJlIHwgbnVsbDtcbiAgcHVibGljIG5vcm1hbE1hcDogVEhSRUUuVGV4dHVyZSB8IG51bGw7XG4gIHB1YmxpYyBub3JtYWxTY2FsZTogVEhSRUUuVmVjdG9yMjtcblxuICBwdWJsaWMgc2hhZGVDb2xvckZhY3RvcjogVEhSRUUuQ29sb3I7XG4gIHB1YmxpYyBzaGFkZU11bHRpcGx5VGV4dHVyZTogVEhSRUUuVGV4dHVyZSB8IG51bGw7XG4gIHB1YmxpYyBzaGFkaW5nU2hpZnRGYWN0b3I6IG51bWJlcjtcbiAgcHVibGljIHNoYWRpbmdTaGlmdFRleHR1cmU6IFRIUkVFLlRleHR1cmUgfCBudWxsO1xuICBwdWJsaWMgc2hhZGluZ1NoaWZ0VGV4dHVyZVNjYWxlOiBudW1iZXI7XG4gIHB1YmxpYyBzaGFkaW5nVG9vbnlGYWN0b3I6IG51bWJlcjtcbiAgcHVibGljIHJpbUxpZ2h0aW5nTWl4RmFjdG9yOiBudW1iZXI7XG4gIHB1YmxpYyByaW1NdWx0aXBseVRleHR1cmU6IFRIUkVFLlRleHR1cmUgfCBudWxsO1xuICBwdWJsaWMgbWF0Y2FwRmFjdG9yOiBUSFJFRS5Db2xvcjtcbiAgcHVibGljIG1hdGNhcFRleHR1cmU6IFRIUkVFLlRleHR1cmUgfCBudWxsO1xuICBwdWJsaWMgcGFyYW1ldHJpY1JpbUNvbG9yRmFjdG9yOiBUSFJFRS5Db2xvcjtcbiAgcHVibGljIHBhcmFtZXRyaWNSaW1MaWZ0RmFjdG9yOiBudW1iZXI7XG4gIHB1YmxpYyBwYXJhbWV0cmljUmltRnJlc25lbFBvd2VyRmFjdG9yOiBudW1iZXI7XG4gIHB1YmxpYyBvdXRsaW5lV2lkdGhNb2RlOiBNVG9vbk1hdGVyaWFsT3V0bGluZVdpZHRoTW9kZTtcbiAgcHVibGljIG91dGxpbmVXaWR0aE11bHRpcGx5VGV4dHVyZTogVEhSRUUuVGV4dHVyZSB8IG51bGw7XG4gIHB1YmxpYyBvdXRsaW5lV2lkdGhGYWN0b3I6IG51bWJlcjtcbiAgcHVibGljIG91dGxpbmVDb2xvckZhY3RvcjogVEhSRUUuQ29sb3I7XG4gIHB1YmxpYyBvdXRsaW5lTGlnaHRpbmdNaXhGYWN0b3I6IG51bWJlcjtcbiAgcHVibGljIHV2QW5pbWF0aW9uU2Nyb2xsWFNwZWVkRmFjdG9yOiBudW1iZXI7XG4gIHB1YmxpYyB1dkFuaW1hdGlvblNjcm9sbFlTcGVlZEZhY3RvcjogbnVtYmVyO1xuICBwdWJsaWMgdXZBbmltYXRpb25Sb3RhdGlvblNwZWVkRmFjdG9yOiBudW1iZXI7XG4gIHB1YmxpYyB1dkFuaW1hdGlvbk1hc2tUZXh0dXJlOiBUSFJFRS5UZXh0dXJlIHwgbnVsbDtcblxuICBwdWJsaWMgc2hhZGVDb2xvck5vZGU6IFRIUkVFLlN3aXp6YWJsZSB8IG51bGw7XG4gIHB1YmxpYyBzaGFkaW5nU2hpZnROb2RlOiBUSFJFRS5Ob2RlIHwgbnVsbDtcbiAgcHVibGljIHNoYWRpbmdUb29ueU5vZGU6IFRIUkVFLk5vZGUgfCBudWxsO1xuICBwdWJsaWMgcmltTGlnaHRpbmdNaXhOb2RlOiBUSFJFRS5Ob2RlIHwgbnVsbDtcbiAgcHVibGljIHJpbU11bHRpcGx5Tm9kZTogVEhSRUUuTm9kZSB8IG51bGw7XG4gIHB1YmxpYyBtYXRjYXBOb2RlOiBUSFJFRS5Ob2RlIHwgbnVsbDtcbiAgcHVibGljIHBhcmFtZXRyaWNSaW1Db2xvck5vZGU6IFRIUkVFLlN3aXp6YWJsZSB8IG51bGw7XG4gIHB1YmxpYyBwYXJhbWV0cmljUmltTGlmdE5vZGU6IFRIUkVFLk5vZGUgfCBudWxsO1xuICBwdWJsaWMgcGFyYW1ldHJpY1JpbUZyZXNuZWxQb3dlck5vZGU6IFRIUkVFLk5vZGUgfCBudWxsO1xuXG4gIHB1YmxpYyB1dkFuaW1hdGlvblNjcm9sbFhPZmZzZXQ6IG51bWJlcjtcbiAgcHVibGljIHV2QW5pbWF0aW9uU2Nyb2xsWU9mZnNldDogbnVtYmVyO1xuICBwdWJsaWMgdXZBbmltYXRpb25Sb3RhdGlvblBoYXNlOiBudW1iZXI7XG5cbiAgcHVibGljIGlzT3V0bGluZTogYm9vbGVhbjtcblxuICBwcml2YXRlIF9hbmltYXRlZFVWTm9kZTogTVRvb25BbmltYXRlZFVWTm9kZSB8IG51bGw7XG5cbiAgcHVibGljIGN1c3RvbVByb2dyYW1DYWNoZUtleSgpOiBzdHJpbmcge1xuICAgIGxldCBjYWNoZUtleSA9IHN1cGVyLmN1c3RvbVByb2dyYW1DYWNoZUtleSgpO1xuXG4gICAgY2FjaGVLZXkgKz0gYGlzT3V0bGluZToke3RoaXMuaXNPdXRsaW5lfSxgO1xuXG4gICAgcmV0dXJuIGNhY2hlS2V5O1xuICB9XG5cbiAgLyoqXG4gICAqIFJlYWRvbmx5IGJvb2xlYW4gdGhhdCBpbmRpY2F0ZXMgdGhpcyBpcyBhIHtAbGluayBNVG9vbk5vZGVNYXRlcmlhbH0uXG4gICAqL1xuICBwdWJsaWMgZ2V0IGlzTVRvb25Ob2RlTWF0ZXJpYWwoKTogdHJ1ZSB7XG4gICAgcmV0dXJuIHRydWU7XG4gIH1cblxuICBwdWJsaWMgY29uc3RydWN0b3IocGFyYW1ldGVyczogTVRvb25Ob2RlTWF0ZXJpYWxQYXJhbWV0ZXJzID0ge30pIHtcbiAgICBzdXBlcigpO1xuXG4gICAgaWYgKHBhcmFtZXRlcnMudHJhbnNwYXJlbnRXaXRoWldyaXRlKSB7XG4gICAgICBwYXJhbWV0ZXJzLmRlcHRoV3JpdGUgPSB0cnVlO1xuICAgIH1cbiAgICBkZWxldGUgcGFyYW1ldGVycy50cmFuc3BhcmVudFdpdGhaV3JpdGU7XG5cbiAgICAvLyBgTVRvb25NYXRlcmlhbExvYWRlclBsdWdpbmAgYXNzaWducyB0aGVzZSBwYXJhbWV0ZXJzIHRvIHRoZSBtYXRlcmlhbFxuICAgIC8vIEhvd2V2ZXIsIGBNVG9vbk5vZGVNYXRlcmlhbGAgZG9lcyBub3Qgc3VwcG9ydCB0aGVzZSBwYXJhbWV0ZXJzXG4gICAgLy8gc28gd2UgZGVsZXRlIHRoZW0gaGVyZSB0byBzdXBwcmVzcyB3YXJuaW5nc1xuICAgIGRlbGV0ZSAocGFyYW1ldGVycyBhcyBhbnkpLmdpRXF1YWxpemF0aW9uRmFjdG9yO1xuICAgIGRlbGV0ZSAocGFyYW1ldGVycyBhcyBhbnkpLnYwQ29tcGF0U2hhZGU7XG4gICAgZGVsZXRlIChwYXJhbWV0ZXJzIGFzIGFueSkuZGVidWdNb2RlO1xuXG4gICAgdGhpcy5lbWlzc2l2ZU5vZGUgPSBudWxsO1xuXG4gICAgdGhpcy5saWdodHMgPSB0cnVlO1xuXG4gICAgdGhpcy5jb2xvciA9IG5ldyBUSFJFRS5Db2xvcigxLjAsIDEuMCwgMS4wKTtcbiAgICB0aGlzLm1hcCA9IG51bGw7XG4gICAgdGhpcy5lbWlzc2l2ZSA9IG5ldyBUSFJFRS5Db2xvcigwLjAsIDAuMCwgMC4wKTtcbiAgICB0aGlzLmVtaXNzaXZlSW50ZW5zaXR5ID0gMS4wO1xuICAgIHRoaXMuZW1pc3NpdmVNYXAgPSBudWxsO1xuICAgIHRoaXMubm9ybWFsTWFwID0gbnVsbDtcbiAgICB0aGlzLm5vcm1hbFNjYWxlID0gbmV3IFRIUkVFLlZlY3RvcjIoMS4wLCAxLjApO1xuICAgIHRoaXMuc2hhZGVDb2xvckZhY3RvciA9IG5ldyBUSFJFRS5Db2xvcigwLjAsIDAuMCwgMC4wKTtcbiAgICB0aGlzLnNoYWRlTXVsdGlwbHlUZXh0dXJlID0gbnVsbDtcbiAgICB0aGlzLnNoYWRpbmdTaGlmdEZhY3RvciA9IDAuMDtcbiAgICB0aGlzLnNoYWRpbmdTaGlmdFRleHR1cmUgPSBudWxsO1xuICAgIHRoaXMuc2hhZGluZ1NoaWZ0VGV4dHVyZVNjYWxlID0gMS4wO1xuICAgIHRoaXMuc2hhZGluZ1Rvb255RmFjdG9yID0gMC45O1xuICAgIHRoaXMucmltTGlnaHRpbmdNaXhGYWN0b3IgPSAxLjA7XG4gICAgdGhpcy5yaW1NdWx0aXBseVRleHR1cmUgPSBudWxsO1xuICAgIHRoaXMubWF0Y2FwRmFjdG9yID0gbmV3IFRIUkVFLkNvbG9yKDEuMCwgMS4wLCAxLjApO1xuICAgIHRoaXMubWF0Y2FwVGV4dHVyZSA9IG51bGw7XG4gICAgdGhpcy5wYXJhbWV0cmljUmltQ29sb3JGYWN0b3IgPSBuZXcgVEhSRUUuQ29sb3IoMC4wLCAwLjAsIDAuMCk7XG4gICAgdGhpcy5wYXJhbWV0cmljUmltTGlmdEZhY3RvciA9IDAuMDtcbiAgICB0aGlzLnBhcmFtZXRyaWNSaW1GcmVzbmVsUG93ZXJGYWN0b3IgPSA1LjA7XG4gICAgdGhpcy5vdXRsaW5lV2lkdGhNb2RlID0gTVRvb25NYXRlcmlhbE91dGxpbmVXaWR0aE1vZGUuTm9uZTtcbiAgICB0aGlzLm91dGxpbmVXaWR0aE11bHRpcGx5VGV4dHVyZSA9IG51bGw7XG4gICAgdGhpcy5vdXRsaW5lV2lkdGhGYWN0b3IgPSAwLjA7XG4gICAgdGhpcy5vdXRsaW5lQ29sb3JGYWN0b3IgPSBuZXcgVEhSRUUuQ29sb3IoMC4wLCAwLjAsIDAuMCk7XG4gICAgdGhpcy5vdXRsaW5lTGlnaHRpbmdNaXhGYWN0b3IgPSAxLjA7XG4gICAgdGhpcy51dkFuaW1hdGlvblNjcm9sbFhTcGVlZEZhY3RvciA9IDAuMDtcbiAgICB0aGlzLnV2QW5pbWF0aW9uU2Nyb2xsWVNwZWVkRmFjdG9yID0gMC4wO1xuICAgIHRoaXMudXZBbmltYXRpb25Sb3RhdGlvblNwZWVkRmFjdG9yID0gMC4wO1xuICAgIHRoaXMudXZBbmltYXRpb25NYXNrVGV4dHVyZSA9IG51bGw7XG5cbiAgICB0aGlzLnNoYWRlQ29sb3JOb2RlID0gbnVsbDtcbiAgICB0aGlzLnNoYWRpbmdTaGlmdE5vZGUgPSBudWxsO1xuICAgIHRoaXMuc2hhZGluZ1Rvb255Tm9kZSA9IG51bGw7XG4gICAgdGhpcy5yaW1MaWdodGluZ01peE5vZGUgPSBudWxsO1xuICAgIHRoaXMucmltTXVsdGlwbHlOb2RlID0gbnVsbDtcbiAgICB0aGlzLm1hdGNhcE5vZGUgPSBudWxsO1xuICAgIHRoaXMucGFyYW1ldHJpY1JpbUNvbG9yTm9kZSA9IG51bGw7XG4gICAgdGhpcy5wYXJhbWV0cmljUmltTGlmdE5vZGUgPSBudWxsO1xuICAgIHRoaXMucGFyYW1ldHJpY1JpbUZyZXNuZWxQb3dlck5vZGUgPSBudWxsO1xuXG4gICAgdGhpcy51dkFuaW1hdGlvblNjcm9sbFhPZmZzZXQgPSAwLjA7XG4gICAgdGhpcy51dkFuaW1hdGlvblNjcm9sbFlPZmZzZXQgPSAwLjA7XG4gICAgdGhpcy51dkFuaW1hdGlvblJvdGF0aW9uUGhhc2UgPSAwLjA7XG5cbiAgICB0aGlzLmlzT3V0bGluZSA9IGZhbHNlO1xuXG4gICAgdGhpcy5fYW5pbWF0ZWRVVk5vZGUgPSBudWxsO1xuXG4gICAgdGhpcy5zZXRWYWx1ZXMocGFyYW1ldGVycyk7XG4gIH1cblxuICBwdWJsaWMgc2V0dXBMaWdodGluZ01vZGVsKC8qYnVpbGRlciovKTogTVRvb25MaWdodGluZ01vZGVsIHtcbiAgICByZXR1cm4gbmV3IE1Ub29uTGlnaHRpbmdNb2RlbCgpO1xuICB9XG5cbiAgcHVibGljIHNldHVwKGJ1aWxkZXI6IFRIUkVFLk5vZGVCdWlsZGVyKTogdm9pZCB7XG4gICAgdGhpcy5fYW5pbWF0ZWRVVk5vZGUgPSBuZXcgTVRvb25BbmltYXRlZFVWTm9kZShcbiAgICAgICh0aGlzLnV2QW5pbWF0aW9uTWFza1RleHR1cmUgJiYgdGhpcy51dkFuaW1hdGlvbk1hc2tUZXh0dXJlLmlzVGV4dHVyZSA9PT0gdHJ1ZSkgPz8gZmFsc2UsXG4gICAgKTtcblxuICAgIHN1cGVyLnNldHVwKGJ1aWxkZXIpO1xuICB9XG5cbiAgcHVibGljIHNldHVwRGlmZnVzZUNvbG9yKGJ1aWxkZXI6IFRIUkVFLk5vZGVCdWlsZGVyKTogdm9pZCB7XG4gICAgLy8gd2UgbXVzdCBhcHBseSB1diBzY3JvbGwgdG8gdGhlIG1hcFxuICAgIC8vIHRoaXMuY29sb3JOb2RlIHdpbGwgYmUgdXNlZCBpbiBzdXBlci5zZXR1cERpZmZ1c2VDb2xvcigpIHNvIHdlIHRlbXBvcmFyaWx5IHJlcGxhY2UgaXRcbiAgICBsZXQgdGVtcENvbG9yTm9kZTogVEhSRUUuU2hhZGVyTm9kZU9iamVjdDxUSFJFRS5Ob2RlPiB8IG51bGwgPSBudWxsO1xuXG4gICAgaWYgKHRoaXMuY29sb3JOb2RlID09IG51bGwpIHtcbiAgICAgIHRlbXBDb2xvck5vZGUgPSByZWZDb2xvcjtcblxuICAgICAgaWYgKHRoaXMubWFwICYmIHRoaXMubWFwLmlzVGV4dHVyZSA9PT0gdHJ1ZSkge1xuICAgICAgICBjb25zdCBtYXAgPSByZWZNYXAuY29udGV4dCh7IGdldFVWOiAoKSA9PiB0aGlzLl9hbmltYXRlZFVWTm9kZSB9KTtcbiAgICAgICAgdGVtcENvbG9yTm9kZSA9IHRlbXBDb2xvck5vZGUubXVsKG1hcCk7XG4gICAgICB9XG5cbiAgICAgIHRoaXMuY29sb3JOb2RlID0gdGVtcENvbG9yTm9kZTtcbiAgICB9XG5cbiAgICAvLyBNVG9vbiBtdXN0IGlnbm9yZSB2ZXJ0ZXggY29sb3IgYnkgc3BlY1xuICAgIC8vIFNlZTogaHR0cHM6Ly9naXRodWIuY29tL3ZybS1jL3ZybS1zcGVjaWZpY2F0aW9uL2Jsb2IvNDJjMGE5MGU2YjRiNzEwMzUyNTY5OTc4ZjE0OTgwZTlmYzk0YjI1ZC9zcGVjaWZpY2F0aW9uL1ZSTUNfbWF0ZXJpYWxzX210b29uLTEuMC9SRUFETUUubWQjdmVydGV4LWNvbG9yc1xuICAgIGlmICh0aGlzLnZlcnRleENvbG9ycyA9PT0gdHJ1ZSAmJiBidWlsZGVyLmdlb21ldHJ5Lmhhc0F0dHJpYnV0ZSgnY29sb3InKSkge1xuICAgICAgY29uc29sZS53YXJuKFxuICAgICAgICAnTVRvb25Ob2RlTWF0ZXJpYWw6IE1Ub29uIGlnbm9yZXMgdmVydGV4IGNvbG9ycy4gQ29uc2lkZXIgdXNpbmcgYSBtb2RlbCB3aXRob3V0IHZlcnRleCBjb2xvcnMgaW5zdGVhZC4nLFxuICAgICAgKTtcbiAgICAgIHRoaXMudmVydGV4Q29sb3JzID0gZmFsc2U7XG4gICAgfVxuXG4gICAgLy8gdGhlIG9yZGluYXJ5IGRpZmZ1c2VDb2xvciBzZXR1cFxuICAgIHN1cGVyLnNldHVwRGlmZnVzZUNvbG9yKGJ1aWxkZXIpO1xuXG4gICAgLy8gQ09NUEFUOiBwcmUtcjE2NlxuICAgIC8vIFNldCBhbHBoYSB0byAxIGlmIGl0IGlzIG9wYXF1ZVxuICAgIC8vIEFkZHJlc3NlZCBpbiBUaHJlZS5qcyByMTY2IGJ1dCB3ZSBsZWF2ZSBpdCBoZXJlIGZvciBjb21wYXRpYmlsaXR5XG4gICAgLy8gU2VlOiBodHRwczovL2dpdGh1Yi5jb20vbXJkb29iL3RocmVlLmpzL3B1bGwvMjg2NDZcbiAgICBpZiAocGFyc2VJbnQoVEhSRUUuUkVWSVNJT04sIDEwKSA8IDE2Nikge1xuICAgICAgaWYgKHRoaXMudHJhbnNwYXJlbnQgPT09IGZhbHNlICYmIHRoaXMuYmxlbmRpbmcgPT09IFRIUkVFLk5vcm1hbEJsZW5kaW5nICYmIHRoaXMuYWxwaGFUb0NvdmVyYWdlID09PSBmYWxzZSkge1xuICAgICAgICBUSFJFRS5kaWZmdXNlQ29sb3IuYS5hc3NpZ24oMS4wKTtcbiAgICAgIH1cbiAgICB9XG5cbiAgICAvLyByZXZlcnQgdGhlIGNvbG9yTm9kZVxuICAgIGlmICh0aGlzLmNvbG9yTm9kZSA9PT0gdGVtcENvbG9yTm9kZSkge1xuICAgICAgdGhpcy5jb2xvck5vZGUgPSBudWxsO1xuICAgIH1cbiAgfVxuXG4gIHB1YmxpYyBzZXR1cFZhcmlhbnRzKCk6IHZvaWQge1xuICAgIHNoYWRlQ29sb3IuYXNzaWduKHRoaXMuX3NldHVwU2hhZGVDb2xvck5vZGUoKSk7XG4gICAgc2hhZGluZ1NoaWZ0LmFzc2lnbih0aGlzLl9zZXR1cFNoYWRpbmdTaGlmdE5vZGUoKSk7XG4gICAgc2hhZGluZ1Rvb255LmFzc2lnbih0aGlzLl9zZXR1cFNoYWRpbmdUb29ueU5vZGUoKSk7XG4gICAgcmltTGlnaHRpbmdNaXguYXNzaWduKHRoaXMuX3NldHVwUmltTGlnaHRpbmdNaXhOb2RlKCkpO1xuICAgIHJpbU11bHRpcGx5LmFzc2lnbih0aGlzLl9zZXR1cFJpbU11bHRpcGx5Tm9kZSgpKTtcbiAgICBtYXRjYXAuYXNzaWduKHRoaXMuX3NldHVwTWF0Y2FwTm9kZSgpKTtcbiAgICBwYXJhbWV0cmljUmltLmFzc2lnbih0aGlzLl9zZXR1cFBhcmFtZXRyaWNSaW1Ob2RlKCkpO1xuICB9XG5cbiAgcHVibGljIHNldHVwTm9ybWFsKGJ1aWxkZXI6IFRIUkVFLk5vZGVCdWlsZGVyKTogVEhSRUUuU2hhZGVyTm9kZU9iamVjdDxUSFJFRS5Ob2RlPiB7XG4gICAgLy8gd2UgbXVzdCBhcHBseSB1diBzY3JvbGwgdG8gdGhlIG5vcm1hbE1hcFxuICAgIC8vIHRoaXMubm9ybWFsTm9kZSB3aWxsIGJlIHVzZWQgaW4gc3VwZXIuc2V0dXBOb3JtYWwoKSBzbyB3ZSB0ZW1wb3JhcmlseSByZXBsYWNlIGl0XG4gICAgY29uc3QgdGVtcE5vcm1hbE5vZGUgPSB0aGlzLm5vcm1hbE5vZGU7XG5cbiAgICBpZiAodGhpcy5ub3JtYWxOb2RlID09IG51bGwpIHtcbiAgICAgIHRoaXMubm9ybWFsTm9kZSA9IFRIUkVFLm1hdGVyaWFsTm9ybWFsO1xuXG4gICAgICBpZiAodGhpcy5ub3JtYWxNYXAgJiYgdGhpcy5ub3JtYWxNYXAuaXNUZXh0dXJlID09PSB0cnVlKSB7XG4gICAgICAgIGNvbnN0IG1hcCA9IHJlZk5vcm1hbE1hcC5jb250ZXh0KHsgZ2V0VVY6ICgpID0+IHRoaXMuX2FuaW1hdGVkVVZOb2RlIH0pO1xuICAgICAgICB0aGlzLm5vcm1hbE5vZGUgPSBUSFJFRS5ub3JtYWxNYXAobWFwLCByZWZOb3JtYWxTY2FsZSk7XG4gICAgICB9XG5cbiAgICAgIGlmICh0aGlzLmlzT3V0bGluZSkge1xuICAgICAgICAvLyBTZWUgYWJvdXQgdGhlIHR5cGUgYXNzZXJ0aW9uOiBodHRwczovL2dpdGh1Yi5jb20vdGhyZWUtdHlwZXMvdGhyZWUtdHMtdHlwZXMvcHVsbC8xMTIzXG4gICAgICAgIHRoaXMubm9ybWFsTm9kZSA9ICh0aGlzLm5vcm1hbE5vZGUgYXMgVEhSRUUuU2hhZGVyTm9kZU9iamVjdDxUSFJFRS5Ob2RlPikubmVnYXRlKCk7XG4gICAgICB9XG4gICAgfVxuXG4gICAgLy8gQ09NUEFUIHIxNjg6IGBzZXR1cE5vcm1hbGAgbm93IHJldHVybnMgdGhlIG5vcm1hbCBub2RlXG4gICAgLy8gaW5zdGVhZCBvZiBhc3NpZ25pbmcgaW5zaWRlIHRoZSBgc3VwZXIuc2V0dXBOb3JtYWxgXG4gICAgLy8gU2VlOiBodHRwczovL2dpdGh1Yi5jb20vbXJkb29iL3RocmVlLmpzL3B1bGwvMjkxMzdcbiAgICBjb25zdCB0aHJlZVJldmlzaW9uID0gcGFyc2VJbnQoVEhSRUUuUkVWSVNJT04sIDEwKTtcbiAgICBpZiAodGhyZWVSZXZpc2lvbiA+PSAxNjgpIHtcbiAgICAgIGNvbnN0IHJldCA9IHRoaXMubm9ybWFsTm9kZSBhcyBUSFJFRS5TaGFkZXJOb2RlT2JqZWN0PFRIUkVFLk5vZGU+O1xuXG4gICAgICAvLyByZXZlcnQgdGhlIG5vcm1hbE5vZGVcbiAgICAgIHRoaXMubm9ybWFsTm9kZSA9IHRlbXBOb3JtYWxOb2RlO1xuXG4gICAgICByZXR1cm4gcmV0O1xuICAgIH0gZWxzZSB7XG4gICAgICAvLyBwcmUtcjE2OFxuICAgICAgLy8gdGhlIG9yZGluYXJ5IG5vcm1hbCBzZXR1cFxuICAgICAgc3VwZXIuc2V0dXBOb3JtYWwoYnVpbGRlcik7XG5cbiAgICAgIC8vIHJldmVydCB0aGUgbm9ybWFsTm9kZVxuICAgICAgdGhpcy5ub3JtYWxOb2RlID0gdGVtcE5vcm1hbE5vZGU7XG5cbiAgICAgIC8vIHR5cGUgd29ya2Fyb3VuZDogcHJldGVuZCB0byByZXR1cm4gYSB2YWxpZCB2YWx1ZVxuICAgICAgLy8gcjE2NyBkb2Vzbid0IHVzZSB0aGUgcmV0dXJuIHZhbHVlIGFueXdheVxuICAgICAgcmV0dXJuIHVuZGVmaW5lZCBhcyBhbnk7XG4gICAgfVxuICB9XG5cbiAgcHVibGljIHNldHVwTGlnaHRpbmcoYnVpbGRlcjogVEhSRUUuTm9kZUJ1aWxkZXIpOiBUSFJFRS5Ob2RlIHtcbiAgICAvLyB3ZSBtdXN0IGFwcGx5IHV2IHNjcm9sbCB0byB0aGUgZW1pc3NpdmVNYXBcbiAgICAvLyB0aGlzLmVtaXNzaXZlTm9kZSB3aWxsIGJlIHVzZWQgaW4gc3VwZXIuc2V0dXBMaWdodGluZygpIHNvIHdlIHRlbXBvcmFyaWx5IHJlcGxhY2UgaXRcbiAgICBsZXQgdGVtcEVtaXNzaXZlTm9kZTogVEhSRUUuU2hhZGVyTm9kZU9iamVjdDxUSFJFRS5Ob2RlPiB8IG51bGwgPSBudWxsO1xuXG4gICAgaWYgKHRoaXMuZW1pc3NpdmVOb2RlID09IG51bGwpIHtcbiAgICAgIHRlbXBFbWlzc2l2ZU5vZGUgPSByZWZFbWlzc2l2ZS5tdWwocmVmRW1pc3NpdmVJbnRlbnNpdHkpO1xuXG4gICAgICBpZiAodGhpcy5lbWlzc2l2ZU1hcCAmJiB0aGlzLmVtaXNzaXZlTWFwLmlzVGV4dHVyZSA9PT0gdHJ1ZSkge1xuICAgICAgICBjb25zdCBtYXAgPSByZWZFbWlzc2l2ZU1hcC5jb250ZXh0KHsgZ2V0VVY6ICgpID0+IHRoaXMuX2FuaW1hdGVkVVZOb2RlIH0pO1xuICAgICAgICB0ZW1wRW1pc3NpdmVOb2RlID0gdGVtcEVtaXNzaXZlTm9kZS5tdWwobWFwKTtcbiAgICAgIH1cblxuICAgICAgdGhpcy5lbWlzc2l2ZU5vZGUgPSB0ZW1wRW1pc3NpdmVOb2RlO1xuICAgIH1cblxuICAgIC8vIHRoZSBvcmRpbmFyeSBsaWdodGluZyBzZXR1cFxuICAgIGNvbnN0IHJldCA9IHN1cGVyLnNldHVwTGlnaHRpbmcoYnVpbGRlcik7XG5cbiAgICAvLyByZXZlcnQgdGhlIGVtaXNzaXZlTm9kZVxuICAgIGlmICh0aGlzLmVtaXNzaXZlTm9kZSA9PT0gdGVtcEVtaXNzaXZlTm9kZSkge1xuICAgICAgdGhpcy5lbWlzc2l2ZU5vZGUgPSBudWxsO1xuICAgIH1cblxuICAgIHJldHVybiByZXQ7XG4gIH1cblxuICBwdWJsaWMgc2V0dXBPdXRwdXQoXG4gICAgYnVpbGRlcjogVEhSRUUuTm9kZUJ1aWxkZXIsXG4gICAgb3V0cHV0Tm9kZTogVEhSRUUuU2hhZGVyTm9kZU9iamVjdDxUSFJFRS5Ob2RlPixcbiAgKTogVEhSRUUuU2hhZGVyTm9kZU9iamVjdDxUSFJFRS5Ob2RlPiB7XG4gICAgLy8gbWl4IG9yIHNldCBvdXRsaW5lIGNvbG9yXG4gICAgaWYgKHRoaXMuaXNPdXRsaW5lICYmIHRoaXMub3V0bGluZVdpZHRoTW9kZSAhPT0gTVRvb25NYXRlcmlhbE91dGxpbmVXaWR0aE1vZGUuTm9uZSkge1xuICAgICAgb3V0cHV0Tm9kZSA9IFRIUkVFLnZlYzQoXG4gICAgICAgIFRIUkVFLm1peChyZWZPdXRsaW5lQ29sb3JGYWN0b3IsIG91dHB1dE5vZGUueHl6Lm11bChyZWZPdXRsaW5lQ29sb3JGYWN0b3IpLCByZWZPdXRsaW5lTGlnaHRpbmdNaXhGYWN0b3IpLFxuICAgICAgICBvdXRwdXROb2RlLncsXG4gICAgICApO1xuICAgIH1cblxuICAgIC8vIHRoZSBvcmRpbmFyeSBvdXRwdXQgc2V0dXBcbiAgICByZXR1cm4gc3VwZXIuc2V0dXBPdXRwdXQoYnVpbGRlciwgb3V0cHV0Tm9kZSkgYXMgVEhSRUUuU2hhZGVyTm9kZU9iamVjdDxUSFJFRS5Ob2RlPjtcbiAgfVxuXG4gIHB1YmxpYyBzZXR1cFBvc2l0aW9uKGJ1aWxkZXI6IFRIUkVFLk5vZGVCdWlsZGVyKTogVEhSRUUuU2hhZGVyTm9kZU9iamVjdDxUSFJFRS5Ob2RlPiB7XG4gICAgLy8gd2UgbXVzdCBhcHBseSBvdXRsaW5lIHBvc2l0aW9uIG9mZnNldFxuICAgIC8vIHRoaXMucG9zaXRpb25Ob2RlIHdpbGwgYmUgdXNlZCBpbiBzdXBlci5zZXR1cFBvc2l0aW9uKCkgc28gd2UgdGVtcG9yYXJpbHkgcmVwbGFjZSBpdFxuICAgIGNvbnN0IHRlbXBQb3NpdGlvbk5vZGUgPSB0aGlzLnBvc2l0aW9uTm9kZTtcblxuICAgIGlmICh0aGlzLmlzT3V0bGluZSAmJiB0aGlzLm91dGxpbmVXaWR0aE1vZGUgIT09IE1Ub29uTWF0ZXJpYWxPdXRsaW5lV2lkdGhNb2RlLk5vbmUpIHtcbiAgICAgIHRoaXMucG9zaXRpb25Ob2RlID8/PSBUSFJFRS5wb3NpdGlvbkxvY2FsO1xuXG4gICAgICBjb25zdCBub3JtYWxMb2NhbCA9IFRIUkVFLm5vcm1hbExvY2FsLm5vcm1hbGl6ZSgpO1xuXG4gICAgICBsZXQgd2lkdGg6IFRIUkVFLlNoYWRlck5vZGVPYmplY3Q8VEhSRUUuTm9kZT4gPSByZWZPdXRsaW5lV2lkdGhGYWN0b3I7XG5cbiAgICAgIGlmICh0aGlzLm91dGxpbmVXaWR0aE11bHRpcGx5VGV4dHVyZSAmJiB0aGlzLm91dGxpbmVXaWR0aE11bHRpcGx5VGV4dHVyZS5pc1RleHR1cmUgPT09IHRydWUpIHtcbiAgICAgICAgY29uc3QgbWFwID0gcmVmT3V0bGluZVdpZHRoTXVsdGlwbHlUZXh0dXJlLmNvbnRleHQoeyBnZXRVVjogKCkgPT4gdGhpcy5fYW5pbWF0ZWRVVk5vZGUgfSk7XG4gICAgICAgIHdpZHRoID0gd2lkdGgubXVsKG1hcCk7XG4gICAgICB9XG5cbiAgICAgIGNvbnN0IHdvcmxkTm9ybWFsTGVuZ3RoID0gVEhSRUUubGVuZ3RoKFRIUkVFLm1vZGVsTm9ybWFsTWF0cml4Lm11bChub3JtYWxMb2NhbCkpO1xuICAgICAgY29uc3Qgb3V0bGluZU9mZnNldCA9IHdpZHRoLm11bCh3b3JsZE5vcm1hbExlbmd0aCkubXVsKG5vcm1hbExvY2FsKTtcblxuICAgICAgaWYgKHRoaXMub3V0bGluZVdpZHRoTW9kZSA9PT0gTVRvb25NYXRlcmlhbE91dGxpbmVXaWR0aE1vZGUuV29ybGRDb29yZGluYXRlcykge1xuICAgICAgICAvLyBTZWUgYWJvdXQgdGhlIHR5cGUgYXNzZXJ0aW9uOiBodHRwczovL2dpdGh1Yi5jb20vdGhyZWUtdHlwZXMvdGhyZWUtdHMtdHlwZXMvcHVsbC8xMTIzXG4gICAgICAgIHRoaXMucG9zaXRpb25Ob2RlID0gKHRoaXMucG9zaXRpb25Ob2RlIGFzIFRIUkVFLlNoYWRlck5vZGVPYmplY3Q8VEhSRUUuTm9kZT4pLmFkZChvdXRsaW5lT2Zmc2V0KTtcbiAgICAgIH0gZWxzZSBpZiAodGhpcy5vdXRsaW5lV2lkdGhNb2RlID09PSBNVG9vbk1hdGVyaWFsT3V0bGluZVdpZHRoTW9kZS5TY3JlZW5Db29yZGluYXRlcykge1xuICAgICAgICBjb25zdCBjbGlwU2NhbGUgPSBUSFJFRS5jYW1lcmFQcm9qZWN0aW9uTWF0cml4LmVsZW1lbnQoMSkuZWxlbWVudCgxKTtcblxuICAgICAgICAvLyBTZWUgYWJvdXQgdGhlIHR5cGUgYXNzZXJ0aW9uOiBodHRwczovL2dpdGh1Yi5jb20vdGhyZWUtdHlwZXMvdGhyZWUtdHMtdHlwZXMvcHVsbC8xMTIzXG4gICAgICAgIHRoaXMucG9zaXRpb25Ob2RlID0gKHRoaXMucG9zaXRpb25Ob2RlIGFzIFRIUkVFLlNoYWRlck5vZGVPYmplY3Q8VEhSRUUuTm9kZT4pLmFkZChcbiAgICAgICAgICBvdXRsaW5lT2Zmc2V0LmRpdihjbGlwU2NhbGUpLm11bChUSFJFRS5wb3NpdGlvblZpZXcuei5uZWdhdGUoKSksXG4gICAgICAgICk7XG4gICAgICB9XG5cbiAgICAgIHRoaXMucG9zaXRpb25Ob2RlID8/PSBUSFJFRS5wb3NpdGlvbkxvY2FsO1xuICAgIH1cblxuICAgIC8vIHRoZSBvcmRpbmFyeSBwb3NpdGlvbiBzZXR1cFxuICAgIGNvbnN0IHJldCA9IHN1cGVyLnNldHVwUG9zaXRpb24oYnVpbGRlcikgYXMgVEhSRUUuU2hhZGVyTm9kZU9iamVjdDxUSFJFRS5Ob2RlPjtcblxuICAgIC8vIGFudGkgei1maWdodGluZ1xuICAgIC8vIFRPRE86IFdlIG1pZ2h0IHdhbnQgdG8gYWRkcmVzcyB0aGlzIHZpYSBnbFBvbHlnb25PZmZzZXQgaW5zdGVhZD9cbiAgICByZXQuei5hZGQocmV0LncubXVsKDFlLTYpKTtcblxuICAgIC8vIHJldmVydCB0aGUgcG9zaXRpb25Ob2RlXG4gICAgdGhpcy5wb3NpdGlvbk5vZGUgPSB0ZW1wUG9zaXRpb25Ob2RlO1xuXG4gICAgcmV0dXJuIHJldDtcbiAgfVxuXG4gIHB1YmxpYyBjb3B5KHNvdXJjZTogTVRvb25Ob2RlTWF0ZXJpYWwpOiB0aGlzIHtcbiAgICB0aGlzLmNvbG9yLmNvcHkoc291cmNlLmNvbG9yKTtcbiAgICB0aGlzLm1hcCA9IHNvdXJjZS5tYXAgPz8gbnVsbDtcbiAgICB0aGlzLmVtaXNzaXZlLmNvcHkoc291cmNlLmVtaXNzaXZlKTtcbiAgICB0aGlzLmVtaXNzaXZlSW50ZW5zaXR5ID0gc291cmNlLmVtaXNzaXZlSW50ZW5zaXR5O1xuICAgIHRoaXMuZW1pc3NpdmVNYXAgPSBzb3VyY2UuZW1pc3NpdmVNYXAgPz8gbnVsbDtcbiAgICB0aGlzLm5vcm1hbE1hcCA9IHNvdXJjZS5ub3JtYWxNYXAgPz8gbnVsbDtcbiAgICB0aGlzLm5vcm1hbFNjYWxlLmNvcHkoc291cmNlLm5vcm1hbFNjYWxlKTtcblxuICAgIHRoaXMuc2hhZGVDb2xvckZhY3Rvci5jb3B5KHNvdXJjZS5zaGFkZUNvbG9yRmFjdG9yKTtcbiAgICB0aGlzLnNoYWRlTXVsdGlwbHlUZXh0dXJlID0gc291cmNlLnNoYWRlTXVsdGlwbHlUZXh0dXJlID8/IG51bGw7XG4gICAgdGhpcy5zaGFkaW5nU2hpZnRGYWN0b3IgPSBzb3VyY2Uuc2hhZGluZ1NoaWZ0RmFjdG9yO1xuICAgIHRoaXMuc2hhZGluZ1NoaWZ0VGV4dHVyZSA9IHNvdXJjZS5zaGFkaW5nU2hpZnRUZXh0dXJlID8/IG51bGw7XG4gICAgdGhpcy5zaGFkaW5nU2hpZnRUZXh0dXJlU2NhbGUgPSBzb3VyY2Uuc2hhZGluZ1NoaWZ0VGV4dHVyZVNjYWxlO1xuICAgIHRoaXMuc2hhZGluZ1Rvb255RmFjdG9yID0gc291cmNlLnNoYWRpbmdUb29ueUZhY3RvcjtcbiAgICB0aGlzLnJpbUxpZ2h0aW5nTWl4RmFjdG9yID0gc291cmNlLnJpbUxpZ2h0aW5nTWl4RmFjdG9yO1xuICAgIHRoaXMucmltTXVsdGlwbHlUZXh0dXJlID0gc291cmNlLnJpbU11bHRpcGx5VGV4dHVyZSA/PyBudWxsO1xuICAgIHRoaXMubWF0Y2FwRmFjdG9yLmNvcHkoc291cmNlLm1hdGNhcEZhY3Rvcik7XG4gICAgdGhpcy5tYXRjYXBUZXh0dXJlID0gc291cmNlLm1hdGNhcFRleHR1cmUgPz8gbnVsbDtcbiAgICB0aGlzLnBhcmFtZXRyaWNSaW1Db2xvckZhY3Rvci5jb3B5KHNvdXJjZS5wYXJhbWV0cmljUmltQ29sb3JGYWN0b3IpO1xuICAgIHRoaXMucGFyYW1ldHJpY1JpbUxpZnRGYWN0b3IgPSBzb3VyY2UucGFyYW1ldHJpY1JpbUxpZnRGYWN0b3I7XG4gICAgdGhpcy5wYXJhbWV0cmljUmltRnJlc25lbFBvd2VyRmFjdG9yID0gc291cmNlLnBhcmFtZXRyaWNSaW1GcmVzbmVsUG93ZXJGYWN0b3I7XG4gICAgdGhpcy5vdXRsaW5lV2lkdGhNb2RlID0gc291cmNlLm91dGxpbmVXaWR0aE1vZGU7XG4gICAgdGhpcy5vdXRsaW5lV2lkdGhNdWx0aXBseVRleHR1cmUgPSBzb3VyY2Uub3V0bGluZVdpZHRoTXVsdGlwbHlUZXh0dXJlID8/IG51bGw7XG4gICAgdGhpcy5vdXRsaW5lV2lkdGhGYWN0b3IgPSBzb3VyY2Uub3V0bGluZVdpZHRoRmFjdG9yO1xuICAgIHRoaXMub3V0bGluZUNvbG9yRmFjdG9yLmNvcHkoc291cmNlLm91dGxpbmVDb2xvckZhY3Rvcik7XG4gICAgdGhpcy5vdXRsaW5lTGlnaHRpbmdNaXhGYWN0b3IgPSBzb3VyY2Uub3V0bGluZUxpZ2h0aW5nTWl4RmFjdG9yO1xuICAgIHRoaXMudXZBbmltYXRpb25TY3JvbGxYU3BlZWRGYWN0b3IgPSBzb3VyY2UudXZBbmltYXRpb25TY3JvbGxYU3BlZWRGYWN0b3I7XG4gICAgdGhpcy51dkFuaW1hdGlvblNjcm9sbFlTcGVlZEZhY3RvciA9IHNvdXJjZS51dkFuaW1hdGlvblNjcm9sbFlTcGVlZEZhY3RvcjtcbiAgICB0aGlzLnV2QW5pbWF0aW9uUm90YXRpb25TcGVlZEZhY3RvciA9IHNvdXJjZS51dkFuaW1hdGlvblJvdGF0aW9uU3BlZWRGYWN0b3I7XG4gICAgdGhpcy51dkFuaW1hdGlvbk1hc2tUZXh0dXJlID0gc291cmNlLnV2QW5pbWF0aW9uTWFza1RleHR1cmUgPz8gbnVsbDtcblxuICAgIHRoaXMuc2hhZGVDb2xvck5vZGUgPSBzb3VyY2Uuc2hhZGVDb2xvck5vZGUgPz8gbnVsbDtcbiAgICB0aGlzLnNoYWRpbmdTaGlmdE5vZGUgPSBzb3VyY2Uuc2hhZGluZ1NoaWZ0Tm9kZSA/PyBudWxsO1xuICAgIHRoaXMuc2hhZGluZ1Rvb255Tm9kZSA9IHNvdXJjZS5zaGFkaW5nVG9vbnlOb2RlID8/IG51bGw7XG4gICAgdGhpcy5yaW1MaWdodGluZ01peE5vZGUgPSBzb3VyY2UucmltTGlnaHRpbmdNaXhOb2RlID8/IG51bGw7XG4gICAgdGhpcy5yaW1NdWx0aXBseU5vZGUgPSBzb3VyY2UucmltTXVsdGlwbHlOb2RlID8/IG51bGw7XG4gICAgdGhpcy5tYXRjYXBOb2RlID0gc291cmNlLm1hdGNhcE5vZGUgPz8gbnVsbDtcbiAgICB0aGlzLnBhcmFtZXRyaWNSaW1Db2xvck5vZGUgPSBzb3VyY2UucGFyYW1ldHJpY1JpbUNvbG9yTm9kZSA/PyBudWxsO1xuICAgIHRoaXMucGFyYW1ldHJpY1JpbUxpZnROb2RlID0gc291cmNlLnBhcmFtZXRyaWNSaW1MaWZ0Tm9kZSA/PyBudWxsO1xuICAgIHRoaXMucGFyYW1ldHJpY1JpbUZyZXNuZWxQb3dlck5vZGUgPSBzb3VyY2UucGFyYW1ldHJpY1JpbUZyZXNuZWxQb3dlck5vZGUgPz8gbnVsbDtcblxuICAgIHRoaXMuaXNPdXRsaW5lID0gc291cmNlLmlzT3V0bGluZSA/PyBudWxsO1xuXG4gICAgcmV0dXJuIHN1cGVyLmNvcHkoc291cmNlKTtcbiAgfVxuXG4gIHB1YmxpYyB1cGRhdGUoZGVsdGE6IG51bWJlcik6IHZvaWQge1xuICAgIHRoaXMudXZBbmltYXRpb25TY3JvbGxYT2Zmc2V0ICs9IGRlbHRhICogdGhpcy51dkFuaW1hdGlvblNjcm9sbFhTcGVlZEZhY3RvcjtcbiAgICB0aGlzLnV2QW5pbWF0aW9uU2Nyb2xsWU9mZnNldCArPSBkZWx0YSAqIHRoaXMudXZBbmltYXRpb25TY3JvbGxZU3BlZWRGYWN0b3I7XG4gICAgdGhpcy51dkFuaW1hdGlvblJvdGF0aW9uUGhhc2UgKz0gZGVsdGEgKiB0aGlzLnV2QW5pbWF0aW9uUm90YXRpb25TcGVlZEZhY3RvcjtcbiAgfVxuXG4gIHByaXZhdGUgX3NldHVwU2hhZGVDb2xvck5vZGUoKTogVEhSRUUuU3dpenphYmxlIHtcbiAgICBpZiAodGhpcy5zaGFkZUNvbG9yTm9kZSAhPSBudWxsKSB7XG4gICAgICByZXR1cm4gVEhSRUUudmVjMyh0aGlzLnNoYWRlQ29sb3JOb2RlKTtcbiAgICB9XG5cbiAgICBsZXQgc2hhZGVDb2xvck5vZGU6IFRIUkVFLlNoYWRlck5vZGVPYmplY3Q8VEhSRUUuTm9kZT4gPSByZWZTaGFkZUNvbG9yRmFjdG9yO1xuXG4gICAgaWYgKHRoaXMuc2hhZGVNdWx0aXBseVRleHR1cmUgJiYgdGhpcy5zaGFkZU11bHRpcGx5VGV4dHVyZS5pc1RleHR1cmUgPT09IHRydWUpIHtcbiAgICAgIGNvbnN0IG1hcCA9IHJlZlNoYWRlTXVsdGlwbHlUZXh0dXJlLmNvbnRleHQoeyBnZXRVVjogKCkgPT4gdGhpcy5fYW5pbWF0ZWRVVk5vZGUgfSk7XG4gICAgICBzaGFkZUNvbG9yTm9kZSA9IHNoYWRlQ29sb3JOb2RlLm11bChtYXApO1xuICAgIH1cblxuICAgIHJldHVybiBzaGFkZUNvbG9yTm9kZTtcbiAgfVxuXG4gIHByaXZhdGUgX3NldHVwU2hhZGluZ1NoaWZ0Tm9kZSgpOiBUSFJFRS5Ob2RlIHtcbiAgICBpZiAodGhpcy5zaGFkaW5nU2hpZnROb2RlICE9IG51bGwpIHtcbiAgICAgIHJldHVybiBUSFJFRS5mbG9hdCh0aGlzLnNoYWRpbmdTaGlmdE5vZGUpO1xuICAgIH1cblxuICAgIGxldCBzaGFkaW5nU2hpZnROb2RlOiBUSFJFRS5TaGFkZXJOb2RlT2JqZWN0PFRIUkVFLk5vZGU+ID0gcmVmU2hhZGluZ1NoaWZ0RmFjdG9yO1xuXG4gICAgaWYgKHRoaXMuc2hhZGluZ1NoaWZ0VGV4dHVyZSAmJiB0aGlzLnNoYWRpbmdTaGlmdFRleHR1cmUuaXNUZXh0dXJlID09PSB0cnVlKSB7XG4gICAgICBjb25zdCBtYXAgPSByZWZTaGFkZU11bHRpcGx5VGV4dHVyZS5jb250ZXh0KHsgZ2V0VVY6ICgpID0+IHRoaXMuX2FuaW1hdGVkVVZOb2RlIH0pO1xuICAgICAgc2hhZGluZ1NoaWZ0Tm9kZSA9IHNoYWRpbmdTaGlmdE5vZGUuYWRkKG1hcC5tdWwocmVmU2hhZGVNdWx0aXBseVRleHR1cmVTY2FsZSkpO1xuICAgIH1cblxuICAgIHJldHVybiBzaGFkaW5nU2hpZnROb2RlO1xuICB9XG5cbiAgcHJpdmF0ZSBfc2V0dXBTaGFkaW5nVG9vbnlOb2RlKCk6IFRIUkVFLk5vZGUge1xuICAgIGlmICh0aGlzLnNoYWRpbmdUb29ueU5vZGUgIT0gbnVsbCkge1xuICAgICAgcmV0dXJuIFRIUkVFLmZsb2F0KHRoaXMuc2hhZGluZ1Rvb255Tm9kZSk7XG4gICAgfVxuXG4gICAgcmV0dXJuIHJlZlNoYWRpbmdUb29ueUZhY3RvcjtcbiAgfVxuXG4gIHByaXZhdGUgX3NldHVwUmltTGlnaHRpbmdNaXhOb2RlKCk6IFRIUkVFLk5vZGUge1xuICAgIGlmICh0aGlzLnJpbUxpZ2h0aW5nTWl4Tm9kZSAhPSBudWxsKSB7XG4gICAgICByZXR1cm4gVEhSRUUuZmxvYXQodGhpcy5yaW1MaWdodGluZ01peE5vZGUpO1xuICAgIH1cblxuICAgIHJldHVybiByZWZSaW1MaWdodGluZ01peEZhY3RvcjtcbiAgfVxuXG4gIHByaXZhdGUgX3NldHVwUmltTXVsdGlwbHlOb2RlKCk6IFRIUkVFLlN3aXp6YWJsZSB7XG4gICAgaWYgKHRoaXMucmltTXVsdGlwbHlOb2RlICE9IG51bGwpIHtcbiAgICAgIHJldHVybiBUSFJFRS52ZWMzKHRoaXMucmltTXVsdGlwbHlOb2RlKTtcbiAgICB9XG5cbiAgICBpZiAodGhpcy5yaW1NdWx0aXBseVRleHR1cmUgJiYgdGhpcy5yaW1NdWx0aXBseVRleHR1cmUuaXNUZXh0dXJlID09PSB0cnVlKSB7XG4gICAgICBjb25zdCBtYXAgPSByZWZSaW1NdWx0aXBseVRleHR1cmUuY29udGV4dCh7IGdldFVWOiAoKSA9PiB0aGlzLl9hbmltYXRlZFVWTm9kZSB9KTtcbiAgICAgIHJldHVybiBtYXA7XG4gICAgfVxuXG4gICAgcmV0dXJuIFRIUkVFLnZlYzMoMS4wKTtcbiAgfVxuXG4gIHByaXZhdGUgX3NldHVwTWF0Y2FwTm9kZSgpOiBUSFJFRS5Td2l6emFibGUge1xuICAgIGlmICh0aGlzLm1hdGNhcE5vZGUgIT0gbnVsbCkge1xuICAgICAgcmV0dXJuIFRIUkVFLnZlYzModGhpcy5tYXRjYXBOb2RlKTtcbiAgICB9XG5cbiAgICBpZiAodGhpcy5tYXRjYXBUZXh0dXJlICYmIHRoaXMubWF0Y2FwVGV4dHVyZS5pc1RleHR1cmUgPT09IHRydWUpIHtcbiAgICAgIGNvbnN0IG1hcCA9IHJlZk1hdGNhcFRleHR1cmUuY29udGV4dCh7IGdldFVWOiAoKSA9PiBUSFJFRS5tYXRjYXBVVi5tdWwoMS4wLCAtMS4wKS5hZGQoMC4wLCAxLjApIH0pO1xuICAgICAgcmV0dXJuIG1hcC5tdWwocmVmTWF0Y2FwRmFjdG9yKTtcbiAgICB9XG5cbiAgICByZXR1cm4gVEhSRUUudmVjMygwLjApO1xuICB9XG5cbiAgcHJpdmF0ZSBfc2V0dXBQYXJhbWV0cmljUmltTm9kZSgpOiBUSFJFRS5Td2l6emFibGUge1xuICAgIGNvbnN0IHBhcmFtZXRyaWNSaW1Db2xvciA9XG4gICAgICB0aGlzLnBhcmFtZXRyaWNSaW1Db2xvck5vZGUgIT0gbnVsbCA/IFRIUkVFLnZlYzModGhpcy5wYXJhbWV0cmljUmltQ29sb3JOb2RlKSA6IHJlZlBhcmFtZXRyaWNSaW1Db2xvckZhY3RvcjtcblxuICAgIGNvbnN0IHBhcmFtZXRyaWNSaW1MaWZ0ID1cbiAgICAgIHRoaXMucGFyYW1ldHJpY1JpbUxpZnROb2RlICE9IG51bGwgPyBUSFJFRS5mbG9hdCh0aGlzLnBhcmFtZXRyaWNSaW1MaWZ0Tm9kZSkgOiByZWZQYXJhbWV0cmljUmltTGlmdEZhY3RvcjtcblxuICAgIGNvbnN0IHBhcmFtZXRyaWNSaW1GcmVzbmVsUG93ZXIgPVxuICAgICAgdGhpcy5wYXJhbWV0cmljUmltRnJlc25lbFBvd2VyTm9kZSAhPSBudWxsXG4gICAgICAgID8gVEhSRUUuZmxvYXQodGhpcy5wYXJhbWV0cmljUmltRnJlc25lbFBvd2VyTm9kZSlcbiAgICAgICAgOiByZWZQYXJhbWV0cmljUmltRnJlc25lbFBvd2VyRmFjdG9yO1xuXG4gICAgcmV0dXJuIG10b29uUGFyYW1ldHJpY1JpbSh7XG4gICAgICBwYXJhbWV0cmljUmltTGlmdCxcbiAgICAgIHBhcmFtZXRyaWNSaW1GcmVzbmVsUG93ZXIsXG4gICAgICBwYXJhbWV0cmljUmltQ29sb3IsXG4gICAgfSk7XG4gIH1cbn1cblxuLy8gVE9ETzogUGFydCBvZiBzdHVmZiB0aGF0IE1Ub29uTWF0ZXJpYWwgZGVwZW5kcyBvbiBkb2VzIG5vdCBleGlzdCBpbiB0aHJlZS93ZWJncHUgKGUuZy4gVW5pZm9ybXNMaWIpXG4vLyBUSFJFRS5hZGROb2RlTWF0ZXJpYWwoJ01Ub29uTm9kZU1hdGVyaWFsJywgTVRvb25Ob2RlTWF0ZXJpYWwpO1xuIiwgIi8qIGVzbGludC1kaXNhYmxlIEB0eXBlc2NyaXB0LWVzbGludC9uYW1pbmctY29udmVudGlvbiAqL1xuXG5leHBvcnQgY29uc3QgTVRvb25NYXRlcmlhbE91dGxpbmVXaWR0aE1vZGUgPSB7XG4gIE5vbmU6ICdub25lJyxcbiAgV29ybGRDb29yZGluYXRlczogJ3dvcmxkQ29vcmRpbmF0ZXMnLFxuICBTY3JlZW5Db29yZGluYXRlczogJ3NjcmVlbkNvb3JkaW5hdGVzJyxcbn0gYXMgY29uc3Q7XG5cbmV4cG9ydCB0eXBlIE1Ub29uTWF0ZXJpYWxPdXRsaW5lV2lkdGhNb2RlID1cbiAgKHR5cGVvZiBNVG9vbk1hdGVyaWFsT3V0bGluZVdpZHRoTW9kZSlba2V5b2YgdHlwZW9mIE1Ub29uTWF0ZXJpYWxPdXRsaW5lV2lkdGhNb2RlXTtcbiIsICJpbXBvcnQgKiBhcyBUSFJFRSBmcm9tICd0aHJlZS93ZWJncHUnO1xuaW1wb3J0IHsgRm5Db21wYXQgfSBmcm9tICcuL3V0aWxzL0ZuQ29tcGF0JztcblxuZXhwb3J0IGNvbnN0IG10b29uUGFyYW1ldHJpY1JpbSA9IEZuQ29tcGF0KFxuICAoe1xuICAgIHBhcmFtZXRyaWNSaW1MaWZ0LFxuICAgIHBhcmFtZXRyaWNSaW1GcmVzbmVsUG93ZXIsXG4gICAgcGFyYW1ldHJpY1JpbUNvbG9yLFxuICB9OiB7XG4gICAgcGFyYW1ldHJpY1JpbUxpZnQ6IFRIUkVFLk5vZGVSZXByZXNlbnRhdGlvbjtcbiAgICBwYXJhbWV0cmljUmltRnJlc25lbFBvd2VyOiBUSFJFRS5Ob2RlUmVwcmVzZW50YXRpb247XG4gICAgcGFyYW1ldHJpY1JpbUNvbG9yOiBUSFJFRS5Ob2RlUmVwcmVzZW50YXRpb247XG4gIH0pID0+IHtcbiAgICBjb25zdCB2aWV3RGlyID0gVEhSRUUubW9kZWxWaWV3UG9zaXRpb24ubm9ybWFsaXplKCk7XG4gICAgY29uc3QgZG90TlYgPSBUSFJFRS50cmFuc2Zvcm1lZE5vcm1hbFZpZXcuZG90KHZpZXdEaXIubmVnYXRlKCkpO1xuXG4gICAgY29uc3QgcmltID0gVEhSRUUuZmxvYXQoMS4wKS5zdWIoZG90TlYpLmFkZChwYXJhbWV0cmljUmltTGlmdCkuY2xhbXAoKS5wb3cocGFyYW1ldHJpY1JpbUZyZXNuZWxQb3dlcik7XG5cbiAgICByZXR1cm4gcmltLm11bChwYXJhbWV0cmljUmltQ29sb3IpO1xuICB9LFxuKTtcbiJdLAogICJtYXBwaW5ncyI6ICI7Ozs7Ozs7Ozs7QUFHQSxZQUFZLFdBQVc7QUNIdkIsWUFBWUEsWUFBVztBQ0F2QixZQUFZQSxZQUFXO0FDQXZCLFlBQVlBLFlBQVc7QUNBdkIsWUFBWUEsWUFBVztBQ0F2QixZQUFZQSxZQUFXO0FDQXZCLFlBQVlBLFlBQVc7QUVBdkIsWUFBWUEsWUFBVztBUkt2QixJQUFNLGdCQUFnQixTQUFlLGdCQUFVLEVBQUU7QUFDakQsSUFBSSxnQkFBZ0IsS0FBSztBQUN2QixVQUFRO0lBQ04sc0VBQXNFLGFBQWE7RUFDckY7QUFDRjtBRVJPLElBQU0sV0FBaUIseUJBQWtCLFNBQVMsT0FBTztBQUN6RCxJQUFNLFNBQWUseUJBQWtCLE9BQU8sU0FBUztBQUN2RCxJQUFNLGVBQXFCLHlCQUFrQixhQUFhLFNBQVM7QUFDbkUsSUFBTSxpQkFBdUIseUJBQWtCLGVBQWUsTUFBTTtBQUNwRSxJQUFNLGNBQW9CLHlCQUFrQixZQUFZLE9BQU87QUFDL0QsSUFBTSx1QkFBNkIseUJBQWtCLHFCQUFxQixPQUFPO0FBQ2pGLElBQU0saUJBQXVCLHlCQUFrQixlQUFlLFNBQVM7QUFFdkUsSUFBTSxzQkFBNEIseUJBQWtCLG9CQUFvQixPQUFPO0FBQy9FLElBQU0sd0JBQThCLHlCQUFrQixzQkFBc0IsT0FBTztBQUNuRixJQUFNLDBCQUFnQyx5QkFBa0Isd0JBQXdCLFNBQVM7QUFDekYsSUFBTSwrQkFBcUMseUJBQWtCLDZCQUE2QixPQUFPO0FBQ2pHLElBQU0sd0JBQThCLHlCQUFrQixzQkFBc0IsT0FBTztBQUNuRixJQUFNLDBCQUFnQyx5QkFBa0Isd0JBQXdCLE9BQU87QUFDdkYsSUFBTSx3QkFBOEIseUJBQWtCLHNCQUFzQixTQUFTO0FBQ3JGLElBQU0sa0JBQXdCLHlCQUFrQixnQkFBZ0IsT0FBTztBQUN2RSxJQUFNLG1CQUF5Qix5QkFBa0Is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QUFjLGNBQWMsTUFBTTtBQUMvRCxZQUFNLE1BQU0saUJBQWlCLFFBQVEsRUFBRSxPQUFPLE1BQVksZ0JBQVMsSUFBSSxHQUFLLEVBQUksRUFBRSxJQUFJLEdBQUssQ0FBRyxFQUFFLENBQUM7QUFDakcsYUFBTyxJQUFJLElBQUksZUFBZTtJQUNoQztBQUVBLFdBQWEsWUFBSyxDQUFHO0VBQ3ZCO0VBRVEsMEJBQTJDO0FBQ2pELFVBQU0scUJBQ0osS0FBSywwQkFBMEIsT0FBYSxZQUFLLEtBQUssc0JBQXNCLElBQUk7QUFFbEYsVUFBTSxvQkFDSixLQUFLLHlCQUF5QixPQUFhLGFBQU0sS0FBSyxxQkFBcUIsSUFBSTtBQUVqRixVQUFNLDRCQUNKLEtBQUssaUNBQWlDLE9BQzVCLGFBQU0sS0FBSyw2QkFBNkIsSUFDOUM7QUFFTixXQUFPLG1CQUFtQjtNQUN4QjtNQUNBO01BQ0E7SUFDRixDQUFDO0VBQ0g7QUFDRjsiLAogICJuYW1lcyI6IFsiVEhSRUUiLCAidXYiLCAidGhyZWVSZXZpc2lvbiIsICJkaWZmdXNlQ29sb3IiLCAibm9ybWFsTG9jYWwiXQp9Cg==
