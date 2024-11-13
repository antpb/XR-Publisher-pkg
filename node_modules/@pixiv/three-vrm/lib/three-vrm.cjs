/*!
 * @pixiv/three-vrm v3.1.4
 * VRM file loader for three.js.
 *
 * Copyright (c) 2019-2024 pixiv Inc.
 * @pixiv/three-vrm is distributed under MIT License
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
var __async = (__this, __arguments, generator) => {
  return new Promise((resolve, reject) => {
    var fulfilled = (value) => {
      try {
        step(generator.next(value));
      } catch (e) {
        reject(e);
      }
    };
    var rejected = (value) => {
      try {
        step(generator.throw(value));
      } catch (e) {
        reject(e);
      }
    };
    var step = (x) => x.done ? resolve(x.value) : Promise.resolve(x.value).then(fulfilled, rejected);
    step((generator = generator.apply(__this, __arguments)).next());
  });
};

// src/index.ts
var src_exports = {};
__export(src_exports, {
  MToonMaterial: () => MToonMaterial,
  MToonMaterialDebugMode: () => MToonMaterialDebugMode,
  MToonMaterialLoaderPlugin: () => MToonMaterialLoaderPlugin,
  MToonMaterialOutlineWidthMode: () => MToonMaterialOutlineWidthMode,
  VRM: () => VRM,
  VRMAimConstraint: () => VRMAimConstraint,
  VRMCore: () => VRMCore,
  VRMCoreLoaderPlugin: () => VRMCoreLoaderPlugin,
  VRMExpression: () => VRMExpression,
  VRMExpressionLoaderPlugin: () => VRMExpressionLoaderPlugin,
  VRMExpressionManager: () => VRMExpressionManager,
  VRMExpressionMaterialColorBind: () => VRMExpressionMaterialColorBind,
  VRMExpressionMaterialColorType: () => VRMExpressionMaterialColorType,
  VRMExpressionMorphTargetBind: () => VRMExpressionMorphTargetBind,
  VRMExpressionOverrideType: () => VRMExpressionOverrideType,
  VRMExpressionPresetName: () => VRMExpressionPresetName,
  VRMExpressionTextureTransformBind: () => VRMExpressionTextureTransformBind,
  VRMFirstPerson: () => VRMFirstPerson,
  VRMFirstPersonLoaderPlugin: () => VRMFirstPersonLoaderPlugin,
  VRMFirstPersonMeshAnnotationType: () => VRMFirstPersonMeshAnnotationType,
  VRMHumanBoneList: () => VRMHumanBoneList,
  VRMHumanBoneName: () => VRMHumanBoneName,
  VRMHumanBoneParentMap: () => VRMHumanBoneParentMap,
  VRMHumanoid: () => VRMHumanoid,
  VRMHumanoidHelper: () => VRMHumanoidHelper,
  VRMHumanoidLoaderPlugin: () => VRMHumanoidLoaderPlugin,
  VRMLoaderPlugin: () => VRMLoaderPlugin,
  VRMLookAt: () => VRMLookAt,
  VRMLookAtBoneApplier: () => VRMLookAtBoneApplier,
  VRMLookAtExpressionApplier: () => VRMLookAtExpressionApplier,
  VRMLookAtHelper: () => VRMLookAtHelper,
  VRMLookAtLoaderPlugin: () => VRMLookAtLoaderPlugin,
  VRMLookAtRangeMap: () => VRMLookAtRangeMap,
  VRMLookAtTypeName: () => VRMLookAtTypeName,
  VRMMetaLoaderPlugin: () => VRMMetaLoaderPlugin,
  VRMNodeConstraint: () => VRMNodeConstraint,
  VRMNodeConstraintHelper: () => VRMNodeConstraintHelper,
  VRMNodeConstraintLoaderPlugin: () => VRMNodeConstraintLoaderPlugin,
  VRMNodeConstraintManager: () => VRMNodeConstraintManager,
  VRMRequiredHumanBoneName: () => VRMRequiredHumanBoneName,
  VRMRollConstraint: () => VRMRollConstraint,
  VRMRotationConstraint: () => VRMRotationConstraint,
  VRMSpringBoneCollider: () => VRMSpringBoneCollider,
  VRMSpringBoneColliderHelper: () => VRMSpringBoneColliderHelper,
  VRMSpringBoneColliderShape: () => VRMSpringBoneColliderShape,
  VRMSpringBoneColliderShapeCapsule: () => VRMSpringBoneColliderShapeCapsule,
  VRMSpringBoneColliderShapePlane: () => VRMSpringBoneColliderShapePlane,
  VRMSpringBoneColliderShapeSphere: () => VRMSpringBoneColliderShapeSphere,
  VRMSpringBoneJoint: () => VRMSpringBoneJoint,
  VRMSpringBoneJointHelper: () => VRMSpringBoneJointHelper,
  VRMSpringBoneLoaderPlugin: () => VRMSpringBoneLoaderPlugin,
  VRMSpringBoneManager: () => VRMSpringBoneManager,
  VRMUtils: () => VRMUtils
});
module.exports = __toCommonJS(src_exports);

// ../three-vrm-core/lib/three-vrm-core.module.js
var THREE = __toESM(require("three"), 1);
var THREE4 = __toESM(require("three"), 1);
var THREE2 = __toESM(require("three"), 1);
var THREE3 = __toESM(require("three"), 1);
var THREE5 = __toESM(require("three"), 1);
var THREE6 = __toESM(require("three"), 1);
var THREE7 = __toESM(require("three"), 1);
var THREE8 = __toESM(require("three"), 1);
var THREE11 = __toESM(require("three"), 1);
var THREE9 = __toESM(require("three"), 1);
var THREE10 = __toESM(require("three"), 1);
var THREE13 = __toESM(require("three"), 1);
var THREE12 = __toESM(require("three"), 1);
var THREE14 = __toESM(require("three"), 1);
var THREE15 = __toESM(require("three"), 1);
var THREE16 = __toESM(require("three"), 1);
var __async2 = (__this, __arguments, generator) => {
  return new Promise((resolve, reject) => {
    var fulfilled = (value) => {
      try {
        step(generator.next(value));
      } catch (e) {
        reject(e);
      }
    };
    var rejected = (value) => {
      try {
        step(generator.throw(value));
      } catch (e) {
        reject(e);
      }
    };
    var step = (x) => x.done ? resolve(x.value) : Promise.resolve(x.value).then(fulfilled, rejected);
    step((generator = generator.apply(__this, __arguments)).next());
  });
};
var VRMExpression = class extends THREE.Object3D {
  constructor(expressionName) {
    super();
    this.weight = 0;
    this.isBinary = false;
    this.overrideBlink = "none";
    this.overrideLookAt = "none";
    this.overrideMouth = "none";
    this._binds = [];
    this.name = `VRMExpression_${expressionName}`;
    this.expressionName = expressionName;
    this.type = "VRMExpression";
    this.visible = false;
  }
  /**
   * A value represents how much it should override blink expressions.
   * `0.0` == no override at all, `1.0` == completely block the expressions.
   */
  get overrideBlinkAmount() {
    if (this.overrideBlink === "block") {
      return 0 < this.outputWeight ? 1 : 0;
    } else if (this.overrideBlink === "blend") {
      return this.outputWeight;
    } else {
      return 0;
    }
  }
  /**
   * A value represents how much it should override lookAt expressions.
   * `0.0` == no override at all, `1.0` == completely block the expressions.
   */
  get overrideLookAtAmount() {
    if (this.overrideLookAt === "block") {
      return 0 < this.outputWeight ? 1 : 0;
    } else if (this.overrideLookAt === "blend") {
      return this.outputWeight;
    } else {
      return 0;
    }
  }
  /**
   * A value represents how much it should override mouth expressions.
   * `0.0` == no override at all, `1.0` == completely block the expressions.
   */
  get overrideMouthAmount() {
    if (this.overrideMouth === "block") {
      return 0 < this.outputWeight ? 1 : 0;
    } else if (this.overrideMouth === "blend") {
      return this.outputWeight;
    } else {
      return 0;
    }
  }
  /**
   * An output weight of this expression, considering the {@link isBinary}.
   */
  get outputWeight() {
    if (this.isBinary) {
      return this.weight > 0.5 ? 1 : 0;
    }
    return this.weight;
  }
  addBind(bind) {
    this._binds.push(bind);
  }
  /**
   * Apply weight to every assigned blend shapes.
   * Should be called every frame.
   */
  applyWeight(options) {
    var _a;
    let actualWeight = this.outputWeight;
    actualWeight *= (_a = options == null ? void 0 : options.multiplier) != null ? _a : 1;
    if (this.isBinary && actualWeight < 1) {
      actualWeight = 0;
    }
    this._binds.forEach((bind) => bind.applyWeight(actualWeight));
  }
  /**
   * Clear previously assigned blend shapes.
   */
  clearAppliedWeight() {
    this._binds.forEach((bind) => bind.clearAppliedWeight());
  }
};
function extractPrimitivesInternal(gltf, nodeIndex, node) {
  var _a, _b;
  const json = gltf.parser.json;
  const schemaNode = (_a = json.nodes) == null ? void 0 : _a[nodeIndex];
  if (schemaNode == null) {
    console.warn(`extractPrimitivesInternal: Attempt to use nodes[${nodeIndex}] of glTF but the node doesn't exist`);
    return null;
  }
  const meshIndex = schemaNode.mesh;
  if (meshIndex == null) {
    return null;
  }
  const schemaMesh = (_b = json.meshes) == null ? void 0 : _b[meshIndex];
  if (schemaMesh == null) {
    console.warn(`extractPrimitivesInternal: Attempt to use meshes[${meshIndex}] of glTF but the mesh doesn't exist`);
    return null;
  }
  const primitiveCount = schemaMesh.primitives.length;
  const primitives = [];
  node.traverse((object) => {
    if (primitives.length < primitiveCount) {
      if (object.isMesh) {
        primitives.push(object);
      }
    }
  });
  return primitives;
}
function gltfExtractPrimitivesFromNode(gltf, nodeIndex) {
  return __async2(this, null, function* () {
    const node = yield gltf.parser.getDependency("node", nodeIndex);
    return extractPrimitivesInternal(gltf, nodeIndex, node);
  });
}
function gltfExtractPrimitivesFromNodes(gltf) {
  return __async2(this, null, function* () {
    const nodes = yield gltf.parser.getDependencies("node");
    const map = /* @__PURE__ */ new Map();
    nodes.forEach((node, index) => {
      const result = extractPrimitivesInternal(gltf, index, node);
      if (result != null) {
        map.set(index, result);
      }
    });
    return map;
  });
}
var VRMExpressionPresetName = {
  Aa: "aa",
  Ih: "ih",
  Ou: "ou",
  Ee: "ee",
  Oh: "oh",
  Blink: "blink",
  Happy: "happy",
  Angry: "angry",
  Sad: "sad",
  Relaxed: "relaxed",
  LookUp: "lookUp",
  Surprised: "surprised",
  LookDown: "lookDown",
  LookLeft: "lookLeft",
  LookRight: "lookRight",
  BlinkLeft: "blinkLeft",
  BlinkRight: "blinkRight",
  Neutral: "neutral"
};
function saturate(value) {
  return Math.max(Math.min(value, 1), 0);
}
var VRMExpressionManager = class _VRMExpressionManager {
  /**
   * Create a new {@link VRMExpressionManager}.
   */
  constructor() {
    this.blinkExpressionNames = ["blink", "blinkLeft", "blinkRight"];
    this.lookAtExpressionNames = ["lookLeft", "lookRight", "lookUp", "lookDown"];
    this.mouthExpressionNames = ["aa", "ee", "ih", "oh", "ou"];
    this._expressions = [];
    this._expressionMap = {};
  }
  get expressions() {
    return this._expressions.concat();
  }
  get expressionMap() {
    return Object.assign({}, this._expressionMap);
  }
  /**
   * A map from name to expression, but excluding custom expressions.
   */
  get presetExpressionMap() {
    const result = {};
    const presetNameSet = new Set(Object.values(VRMExpressionPresetName));
    Object.entries(this._expressionMap).forEach(([name, expression]) => {
      if (presetNameSet.has(name)) {
        result[name] = expression;
      }
    });
    return result;
  }
  /**
   * A map from name to expression, but excluding preset expressions.
   */
  get customExpressionMap() {
    const result = {};
    const presetNameSet = new Set(Object.values(VRMExpressionPresetName));
    Object.entries(this._expressionMap).forEach(([name, expression]) => {
      if (!presetNameSet.has(name)) {
        result[name] = expression;
      }
    });
    return result;
  }
  /**
   * Copy the given {@link VRMExpressionManager} into this one.
   * @param source The {@link VRMExpressionManager} you want to copy
   * @returns this
   */
  copy(source) {
    const expressions = this._expressions.concat();
    expressions.forEach((expression) => {
      this.unregisterExpression(expression);
    });
    source._expressions.forEach((expression) => {
      this.registerExpression(expression);
    });
    this.blinkExpressionNames = source.blinkExpressionNames.concat();
    this.lookAtExpressionNames = source.lookAtExpressionNames.concat();
    this.mouthExpressionNames = source.mouthExpressionNames.concat();
    return this;
  }
  /**
   * Returns a clone of this {@link VRMExpressionManager}.
   * @returns Copied {@link VRMExpressionManager}
   */
  clone() {
    return new _VRMExpressionManager().copy(this);
  }
  /**
   * Return a registered expression.
   * If it cannot find an expression, it will return `null` instead.
   *
   * @param name Name or preset name of the expression
   */
  getExpression(name) {
    var _a;
    return (_a = this._expressionMap[name]) != null ? _a : null;
  }
  /**
   * Register an expression.
   *
   * @param expression {@link VRMExpression} that describes the expression
   */
  registerExpression(expression) {
    this._expressions.push(expression);
    this._expressionMap[expression.expressionName] = expression;
  }
  /**
   * Unregister an expression.
   *
   * @param expression The expression you want to unregister
   */
  unregisterExpression(expression) {
    const index = this._expressions.indexOf(expression);
    if (index === -1) {
      console.warn("VRMExpressionManager: The specified expressions is not registered");
    }
    this._expressions.splice(index, 1);
    delete this._expressionMap[expression.expressionName];
  }
  /**
   * Get the current weight of the specified expression.
   * If it doesn't have an expression of given name, it will return `null` instead.
   *
   * @param name Name of the expression
   */
  getValue(name) {
    var _a;
    const expression = this.getExpression(name);
    return (_a = expression == null ? void 0 : expression.weight) != null ? _a : null;
  }
  /**
   * Set a weight to the specified expression.
   *
   * @param name Name of the expression
   * @param weight Weight
   */
  setValue(name, weight) {
    const expression = this.getExpression(name);
    if (expression) {
      expression.weight = saturate(weight);
    }
  }
  /**
   * Reset weights of all expressions to `0.0`.
   */
  resetValues() {
    this._expressions.forEach((expression) => {
      expression.weight = 0;
    });
  }
  /**
   * Get a track name of specified expression.
   * This track name is needed to manipulate its expression via keyframe animations.
   *
   * @example Manipulate an expression using keyframe animation
   * ```js
   * const trackName = vrm.expressionManager.getExpressionTrackName( 'blink' );
   * const track = new THREE.NumberKeyframeTrack(
   *   name,
   *   [ 0.0, 0.5, 1.0 ], // times
   *   [ 0.0, 1.0, 0.0 ] // values
   * );
   *
   * const clip = new THREE.AnimationClip(
   *   'blink', // name
   *   1.0, // duration
   *   [ track ] // tracks
   * );
   *
   * const mixer = new THREE.AnimationMixer( vrm.scene );
   * const action = mixer.clipAction( clip );
   * action.play();
   * ```
   *
   * @param name Name of the expression
   */
  getExpressionTrackName(name) {
    const expression = this.getExpression(name);
    return expression ? `${expression.name}.weight` : null;
  }
  /**
   * Update every expressions.
   */
  update() {
    const weightMultipliers = this._calculateWeightMultipliers();
    this._expressions.forEach((expression) => {
      expression.clearAppliedWeight();
    });
    this._expressions.forEach((expression) => {
      let multiplier = 1;
      const name = expression.expressionName;
      if (this.blinkExpressionNames.indexOf(name) !== -1) {
        multiplier *= weightMultipliers.blink;
      }
      if (this.lookAtExpressionNames.indexOf(name) !== -1) {
        multiplier *= weightMultipliers.lookAt;
      }
      if (this.mouthExpressionNames.indexOf(name) !== -1) {
        multiplier *= weightMultipliers.mouth;
      }
      expression.applyWeight({ multiplier });
    });
  }
  /**
   * Calculate sum of override amounts to see how much we should multiply weights of certain expressions.
   */
  _calculateWeightMultipliers() {
    let blink = 1;
    let lookAt = 1;
    let mouth = 1;
    this._expressions.forEach((expression) => {
      blink -= expression.overrideBlinkAmount;
      lookAt -= expression.overrideLookAtAmount;
      mouth -= expression.overrideMouthAmount;
    });
    blink = Math.max(0, blink);
    lookAt = Math.max(0, lookAt);
    mouth = Math.max(0, mouth);
    return { blink, lookAt, mouth };
  }
};
var VRMExpressionMaterialColorType = {
  Color: "color",
  EmissionColor: "emissionColor",
  ShadeColor: "shadeColor",
  MatcapColor: "matcapColor",
  RimColor: "rimColor",
  OutlineColor: "outlineColor"
};
var v0ExpressionMaterialColorMap = {
  _Color: VRMExpressionMaterialColorType.Color,
  _EmissionColor: VRMExpressionMaterialColorType.EmissionColor,
  _ShadeColor: VRMExpressionMaterialColorType.ShadeColor,
  _RimColor: VRMExpressionMaterialColorType.RimColor,
  _OutlineColor: VRMExpressionMaterialColorType.OutlineColor
};
var _color = new THREE2.Color();
var _VRMExpressionMaterialColorBind = class _VRMExpressionMaterialColorBind2 {
  constructor({
    material,
    type,
    targetValue,
    targetAlpha
  }) {
    this.material = material;
    this.type = type;
    this.targetValue = targetValue;
    this.targetAlpha = targetAlpha != null ? targetAlpha : 1;
    const color = this._initColorBindState();
    const alpha = this._initAlphaBindState();
    this._state = { color, alpha };
  }
  applyWeight(weight) {
    const { color, alpha } = this._state;
    if (color != null) {
      const { propertyName, deltaValue } = color;
      const target = this.material[propertyName];
      if (target != void 0) {
        target.add(_color.copy(deltaValue).multiplyScalar(weight));
      }
    }
    if (alpha != null) {
      const { propertyName, deltaValue } = alpha;
      const target = this.material[propertyName];
      if (target != void 0) {
        this.material[propertyName] += deltaValue * weight;
      }
    }
  }
  clearAppliedWeight() {
    const { color, alpha } = this._state;
    if (color != null) {
      const { propertyName, initialValue } = color;
      const target = this.material[propertyName];
      if (target != void 0) {
        target.copy(initialValue);
      }
    }
    if (alpha != null) {
      const { propertyName, initialValue } = alpha;
      const target = this.material[propertyName];
      if (target != void 0) {
        this.material[propertyName] = initialValue;
      }
    }
  }
  _initColorBindState() {
    var _a, _b, _c;
    const { material, type, targetValue } = this;
    const propertyNameMap = this._getPropertyNameMap();
    const propertyName = (_b = (_a = propertyNameMap == null ? void 0 : propertyNameMap[type]) == null ? void 0 : _a[0]) != null ? _b : null;
    if (propertyName == null) {
      console.warn(
        `Tried to add a material color bind to the material ${(_c = material.name) != null ? _c : "(no name)"}, the type ${type} but the material or the type is not supported.`
      );
      return null;
    }
    const target = material[propertyName];
    const initialValue = target.clone();
    const deltaValue = new THREE2.Color(
      targetValue.r - initialValue.r,
      targetValue.g - initialValue.g,
      targetValue.b - initialValue.b
    );
    return { propertyName, initialValue, deltaValue };
  }
  _initAlphaBindState() {
    var _a, _b, _c;
    const { material, type, targetAlpha } = this;
    const propertyNameMap = this._getPropertyNameMap();
    const propertyName = (_b = (_a = propertyNameMap == null ? void 0 : propertyNameMap[type]) == null ? void 0 : _a[1]) != null ? _b : null;
    if (propertyName == null && targetAlpha !== 1) {
      console.warn(
        `Tried to add a material alpha bind to the material ${(_c = material.name) != null ? _c : "(no name)"}, the type ${type} but the material or the type does not support alpha.`
      );
      return null;
    }
    if (propertyName == null) {
      return null;
    }
    const initialValue = material[propertyName];
    const deltaValue = targetAlpha - initialValue;
    return { propertyName, initialValue, deltaValue };
  }
  _getPropertyNameMap() {
    var _a, _b;
    return (_b = (_a = Object.entries(_VRMExpressionMaterialColorBind2._propertyNameMapMap).find(([distinguisher]) => {
      return this.material[distinguisher] === true;
    })) == null ? void 0 : _a[1]) != null ? _b : null;
  }
};
_VRMExpressionMaterialColorBind._propertyNameMapMap = {
  isMeshStandardMaterial: {
    color: ["color", "opacity"],
    emissionColor: ["emissive", null]
  },
  isMeshBasicMaterial: {
    color: ["color", "opacity"]
  },
  isMToonMaterial: {
    color: ["color", "opacity"],
    emissionColor: ["emissive", null],
    outlineColor: ["outlineColorFactor", null],
    matcapColor: ["matcapFactor", null],
    rimColor: ["parametricRimColorFactor", null],
    shadeColor: ["shadeColorFactor", null]
  }
};
var VRMExpressionMaterialColorBind = _VRMExpressionMaterialColorBind;
var VRMExpressionMorphTargetBind = class {
  constructor({
    primitives,
    index,
    weight
  }) {
    this.primitives = primitives;
    this.index = index;
    this.weight = weight;
  }
  applyWeight(weight) {
    this.primitives.forEach((mesh) => {
      var _a;
      if (((_a = mesh.morphTargetInfluences) == null ? void 0 : _a[this.index]) != null) {
        mesh.morphTargetInfluences[this.index] += this.weight * weight;
      }
    });
  }
  clearAppliedWeight() {
    this.primitives.forEach((mesh) => {
      var _a;
      if (((_a = mesh.morphTargetInfluences) == null ? void 0 : _a[this.index]) != null) {
        mesh.morphTargetInfluences[this.index] = 0;
      }
    });
  }
};
var _v2 = new THREE3.Vector2();
var _VRMExpressionTextureTransformBind = class _VRMExpressionTextureTransformBind2 {
  constructor({
    material,
    scale,
    offset
  }) {
    var _a, _b;
    this.material = material;
    this.scale = scale;
    this.offset = offset;
    const propertyNames = (_a = Object.entries(_VRMExpressionTextureTransformBind2._propertyNamesMap).find(
      ([distinguisher]) => {
        return material[distinguisher] === true;
      }
    )) == null ? void 0 : _a[1];
    if (propertyNames == null) {
      console.warn(
        `Tried to add a texture transform bind to the material ${(_b = material.name) != null ? _b : "(no name)"} but the material is not supported.`
      );
      this._properties = [];
    } else {
      this._properties = [];
      propertyNames.forEach((propertyName) => {
        var _a2;
        const texture = (_a2 = material[propertyName]) == null ? void 0 : _a2.clone();
        if (!texture) {
          return null;
        }
        material[propertyName] = texture;
        const initialOffset = texture.offset.clone();
        const initialScale = texture.repeat.clone();
        const deltaOffset = offset.clone().sub(initialOffset);
        const deltaScale = scale.clone().sub(initialScale);
        this._properties.push({
          name: propertyName,
          initialOffset,
          deltaOffset,
          initialScale,
          deltaScale
        });
      });
    }
  }
  applyWeight(weight) {
    this._properties.forEach((property) => {
      const target = this.material[property.name];
      if (target === void 0) {
        return;
      }
      target.offset.add(_v2.copy(property.deltaOffset).multiplyScalar(weight));
      target.repeat.add(_v2.copy(property.deltaScale).multiplyScalar(weight));
    });
  }
  clearAppliedWeight() {
    this._properties.forEach((property) => {
      const target = this.material[property.name];
      if (target === void 0) {
        return;
      }
      target.offset.copy(property.initialOffset);
      target.repeat.copy(property.initialScale);
    });
  }
};
_VRMExpressionTextureTransformBind._propertyNamesMap = {
  isMeshStandardMaterial: [
    "map",
    "emissiveMap",
    "bumpMap",
    "normalMap",
    "displacementMap",
    "roughnessMap",
    "metalnessMap",
    "alphaMap"
  ],
  isMeshBasicMaterial: ["map", "specularMap", "alphaMap"],
  isMToonMaterial: [
    "map",
    "normalMap",
    "emissiveMap",
    "shadeMultiplyTexture",
    "rimMultiplyTexture",
    "outlineWidthMultiplyTexture",
    "uvAnimationMaskTexture"
  ]
};
var VRMExpressionTextureTransformBind = _VRMExpressionTextureTransformBind;
var POSSIBLE_SPEC_VERSIONS = /* @__PURE__ */ new Set(["1.0", "1.0-beta"]);
var _VRMExpressionLoaderPlugin = class _VRMExpressionLoaderPlugin2 {
  get name() {
    return "VRMExpressionLoaderPlugin";
  }
  constructor(parser) {
    this.parser = parser;
  }
  afterRoot(gltf) {
    return __async2(this, null, function* () {
      gltf.userData.vrmExpressionManager = yield this._import(gltf);
    });
  }
  /**
   * Import a {@link VRMExpressionManager} from a VRM.
   *
   * @param gltf A parsed result of GLTF taken from GLTFLoader
   */
  _import(gltf) {
    return __async2(this, null, function* () {
      const v1Result = yield this._v1Import(gltf);
      if (v1Result) {
        return v1Result;
      }
      const v0Result = yield this._v0Import(gltf);
      if (v0Result) {
        return v0Result;
      }
      return null;
    });
  }
  _v1Import(gltf) {
    return __async2(this, null, function* () {
      var _a, _b;
      const json = this.parser.json;
      const isVRMUsed = ((_a = json.extensionsUsed) == null ? void 0 : _a.indexOf("VRMC_vrm")) !== -1;
      if (!isVRMUsed) {
        return null;
      }
      const extension = (_b = json.extensions) == null ? void 0 : _b["VRMC_vrm"];
      if (!extension) {
        return null;
      }
      const specVersion = extension.specVersion;
      if (!POSSIBLE_SPEC_VERSIONS.has(specVersion)) {
        console.warn(`VRMExpressionLoaderPlugin: Unknown VRMC_vrm specVersion "${specVersion}"`);
        return null;
      }
      const schemaExpressions = extension.expressions;
      if (!schemaExpressions) {
        return null;
      }
      const presetNameSet = new Set(Object.values(VRMExpressionPresetName));
      const nameSchemaExpressionMap = /* @__PURE__ */ new Map();
      if (schemaExpressions.preset != null) {
        Object.entries(schemaExpressions.preset).forEach(([name, schemaExpression]) => {
          if (schemaExpression == null) {
            return;
          }
          if (!presetNameSet.has(name)) {
            console.warn(`VRMExpressionLoaderPlugin: Unknown preset name "${name}" detected. Ignoring the expression`);
            return;
          }
          nameSchemaExpressionMap.set(name, schemaExpression);
        });
      }
      if (schemaExpressions.custom != null) {
        Object.entries(schemaExpressions.custom).forEach(([name, schemaExpression]) => {
          if (presetNameSet.has(name)) {
            console.warn(
              `VRMExpressionLoaderPlugin: Custom expression cannot have preset name "${name}". Ignoring the expression`
            );
            return;
          }
          nameSchemaExpressionMap.set(name, schemaExpression);
        });
      }
      const manager = new VRMExpressionManager();
      yield Promise.all(
        Array.from(nameSchemaExpressionMap.entries()).map((_0) => __async2(this, [_0], function* ([name, schemaExpression]) {
          var _a2, _b2, _c, _d, _e, _f, _g;
          const expression = new VRMExpression(name);
          gltf.scene.add(expression);
          expression.isBinary = (_a2 = schemaExpression.isBinary) != null ? _a2 : false;
          expression.overrideBlink = (_b2 = schemaExpression.overrideBlink) != null ? _b2 : "none";
          expression.overrideLookAt = (_c = schemaExpression.overrideLookAt) != null ? _c : "none";
          expression.overrideMouth = (_d = schemaExpression.overrideMouth) != null ? _d : "none";
          (_e = schemaExpression.morphTargetBinds) == null ? void 0 : _e.forEach((bind) => __async2(this, null, function* () {
            var _a3;
            if (bind.node === void 0 || bind.index === void 0) {
              return;
            }
            const primitives = yield gltfExtractPrimitivesFromNode(gltf, bind.node);
            const morphTargetIndex = bind.index;
            if (!primitives.every(
              (primitive) => Array.isArray(primitive.morphTargetInfluences) && morphTargetIndex < primitive.morphTargetInfluences.length
            )) {
              console.warn(
                `VRMExpressionLoaderPlugin: ${schemaExpression.name} attempts to index morph #${morphTargetIndex} but not found.`
              );
              return;
            }
            expression.addBind(
              new VRMExpressionMorphTargetBind({
                primitives,
                index: morphTargetIndex,
                weight: (_a3 = bind.weight) != null ? _a3 : 1
              })
            );
          }));
          if (schemaExpression.materialColorBinds || schemaExpression.textureTransformBinds) {
            const gltfMaterials = [];
            gltf.scene.traverse((object) => {
              const material = object.material;
              if (material) {
                gltfMaterials.push(material);
              }
            });
            (_f = schemaExpression.materialColorBinds) == null ? void 0 : _f.forEach((bind) => __async2(this, null, function* () {
              const materials = gltfMaterials.filter((material) => {
                var _a3;
                const materialIndex = (_a3 = this.parser.associations.get(material)) == null ? void 0 : _a3.materials;
                return bind.material === materialIndex;
              });
              materials.forEach((material) => {
                expression.addBind(
                  new VRMExpressionMaterialColorBind({
                    material,
                    type: bind.type,
                    targetValue: new THREE4.Color().fromArray(bind.targetValue),
                    targetAlpha: bind.targetValue[3]
                  })
                );
              });
            }));
            (_g = schemaExpression.textureTransformBinds) == null ? void 0 : _g.forEach((bind) => __async2(this, null, function* () {
              const materials = gltfMaterials.filter((material) => {
                var _a3;
                const materialIndex = (_a3 = this.parser.associations.get(material)) == null ? void 0 : _a3.materials;
                return bind.material === materialIndex;
              });
              materials.forEach((material) => {
                var _a3, _b3;
                expression.addBind(
                  new VRMExpressionTextureTransformBind({
                    material,
                    offset: new THREE4.Vector2().fromArray((_a3 = bind.offset) != null ? _a3 : [0, 0]),
                    scale: new THREE4.Vector2().fromArray((_b3 = bind.scale) != null ? _b3 : [1, 1])
                  })
                );
              });
            }));
          }
          manager.registerExpression(expression);
        }))
      );
      return manager;
    });
  }
  _v0Import(gltf) {
    return __async2(this, null, function* () {
      var _a;
      const json = this.parser.json;
      const vrmExt = (_a = json.extensions) == null ? void 0 : _a.VRM;
      if (!vrmExt) {
        return null;
      }
      const schemaBlendShape = vrmExt.blendShapeMaster;
      if (!schemaBlendShape) {
        return null;
      }
      const manager = new VRMExpressionManager();
      const schemaBlendShapeGroups = schemaBlendShape.blendShapeGroups;
      if (!schemaBlendShapeGroups) {
        return manager;
      }
      const blendShapeNameSet = /* @__PURE__ */ new Set();
      yield Promise.all(
        schemaBlendShapeGroups.map((schemaGroup) => __async2(this, null, function* () {
          var _a2;
          const v0PresetName = schemaGroup.presetName;
          const v1PresetName = v0PresetName != null && _VRMExpressionLoaderPlugin2.v0v1PresetNameMap[v0PresetName] || null;
          const name = v1PresetName != null ? v1PresetName : schemaGroup.name;
          if (name == null) {
            console.warn("VRMExpressionLoaderPlugin: One of custom expressions has no name. Ignoring the expression");
            return;
          }
          if (blendShapeNameSet.has(name)) {
            console.warn(
              `VRMExpressionLoaderPlugin: An expression preset ${v0PresetName} has duplicated entries. Ignoring the expression`
            );
            return;
          }
          blendShapeNameSet.add(name);
          const expression = new VRMExpression(name);
          gltf.scene.add(expression);
          expression.isBinary = (_a2 = schemaGroup.isBinary) != null ? _a2 : false;
          if (schemaGroup.binds) {
            schemaGroup.binds.forEach((bind) => __async2(this, null, function* () {
              var _a3;
              if (bind.mesh === void 0 || bind.index === void 0) {
                return;
              }
              const nodesUsingMesh = [];
              (_a3 = json.nodes) == null ? void 0 : _a3.forEach((node, i) => {
                if (node.mesh === bind.mesh) {
                  nodesUsingMesh.push(i);
                }
              });
              const morphTargetIndex = bind.index;
              yield Promise.all(
                nodesUsingMesh.map((nodeIndex) => __async2(this, null, function* () {
                  var _a4;
                  const primitives = yield gltfExtractPrimitivesFromNode(gltf, nodeIndex);
                  if (!primitives.every(
                    (primitive) => Array.isArray(primitive.morphTargetInfluences) && morphTargetIndex < primitive.morphTargetInfluences.length
                  )) {
                    console.warn(
                      `VRMExpressionLoaderPlugin: ${schemaGroup.name} attempts to index ${morphTargetIndex}th morph but not found.`
                    );
                    return;
                  }
                  expression.addBind(
                    new VRMExpressionMorphTargetBind({
                      primitives,
                      index: morphTargetIndex,
                      weight: 0.01 * ((_a4 = bind.weight) != null ? _a4 : 100)
                      // narrowing the range from [ 0.0 - 100.0 ] to [ 0.0 - 1.0 ]
                    })
                  );
                }))
              );
            }));
          }
          const materialValues = schemaGroup.materialValues;
          if (materialValues && materialValues.length !== 0) {
            materialValues.forEach((materialValue) => {
              if (materialValue.materialName === void 0 || materialValue.propertyName === void 0 || materialValue.targetValue === void 0) {
                return;
              }
              const materials = [];
              gltf.scene.traverse((object) => {
                if (object.material) {
                  const material = object.material;
                  if (Array.isArray(material)) {
                    materials.push(
                      ...material.filter(
                        (mtl) => (mtl.name === materialValue.materialName || mtl.name === materialValue.materialName + " (Outline)") && materials.indexOf(mtl) === -1
                      )
                    );
                  } else if (material.name === materialValue.materialName && materials.indexOf(material) === -1) {
                    materials.push(material);
                  }
                }
              });
              const materialPropertyName = materialValue.propertyName;
              materials.forEach((material) => {
                if (materialPropertyName === "_MainTex_ST") {
                  const scale = new THREE4.Vector2(materialValue.targetValue[0], materialValue.targetValue[1]);
                  const offset = new THREE4.Vector2(materialValue.targetValue[2], materialValue.targetValue[3]);
                  offset.y = 1 - offset.y - scale.y;
                  expression.addBind(
                    new VRMExpressionTextureTransformBind({
                      material,
                      scale,
                      offset
                    })
                  );
                  return;
                }
                const materialColorType = v0ExpressionMaterialColorMap[materialPropertyName];
                if (materialColorType) {
                  expression.addBind(
                    new VRMExpressionMaterialColorBind({
                      material,
                      type: materialColorType,
                      targetValue: new THREE4.Color().fromArray(materialValue.targetValue),
                      targetAlpha: materialValue.targetValue[3]
                    })
                  );
                  return;
                }
                console.warn(materialPropertyName + " is not supported");
              });
            });
          }
          manager.registerExpression(expression);
        }))
      );
      return manager;
    });
  }
};
_VRMExpressionLoaderPlugin.v0v1PresetNameMap = {
  a: "aa",
  e: "ee",
  i: "ih",
  o: "oh",
  u: "ou",
  blink: "blink",
  joy: "happy",
  angry: "angry",
  sorrow: "sad",
  fun: "relaxed",
  lookup: "lookUp",
  lookdown: "lookDown",
  lookleft: "lookLeft",
  lookright: "lookRight",
  // eslint-disable-next-line @typescript-eslint/naming-convention
  blink_l: "blinkLeft",
  // eslint-disable-next-line @typescript-eslint/naming-convention
  blink_r: "blinkRight",
  neutral: "neutral"
};
var VRMExpressionLoaderPlugin = _VRMExpressionLoaderPlugin;
var VRMExpressionOverrideType = {
  None: "none",
  Block: "block",
  Blend: "blend"
};
var _VRMFirstPerson = class _VRMFirstPerson2 {
  /**
   * Create a new VRMFirstPerson object.
   *
   * @param humanoid A {@link VRMHumanoid}
   * @param meshAnnotations A renderer settings. See the description of [[RendererFirstPersonFlags]] for more info
   */
  constructor(humanoid, meshAnnotations) {
    this._firstPersonOnlyLayer = _VRMFirstPerson2.DEFAULT_FIRSTPERSON_ONLY_LAYER;
    this._thirdPersonOnlyLayer = _VRMFirstPerson2.DEFAULT_THIRDPERSON_ONLY_LAYER;
    this._initializedLayers = false;
    this.humanoid = humanoid;
    this.meshAnnotations = meshAnnotations;
  }
  /**
   * Copy the given {@link VRMFirstPerson} into this one.
   * {@link humanoid} must be same as the source one.
   * @param source The {@link VRMFirstPerson} you want to copy
   * @returns this
   */
  copy(source) {
    if (this.humanoid !== source.humanoid) {
      throw new Error("VRMFirstPerson: humanoid must be same in order to copy");
    }
    this.meshAnnotations = source.meshAnnotations.map((annotation) => ({
      meshes: annotation.meshes.concat(),
      type: annotation.type
    }));
    return this;
  }
  /**
   * Returns a clone of this {@link VRMFirstPerson}.
   * @returns Copied {@link VRMFirstPerson}
   */
  clone() {
    return new _VRMFirstPerson2(this.humanoid, this.meshAnnotations).copy(this);
  }
  /**
   * A camera layer represents `FirstPersonOnly` layer.
   * Note that **you must call {@link setup} first before you use the layer feature** or it does not work properly.
   *
   * The value is {@link DEFAULT_FIRSTPERSON_ONLY_LAYER} by default but you can change the layer by specifying via {@link setup} if you prefer.
   *
   * @see https://vrm.dev/en/univrm/api/univrm_use_firstperson/
   * @see https://threejs.org/docs/#api/en/core/Layers
   */
  get firstPersonOnlyLayer() {
    return this._firstPersonOnlyLayer;
  }
  /**
   * A camera layer represents `ThirdPersonOnly` layer.
   * Note that **you must call {@link setup} first before you use the layer feature** or it does not work properly.
   *
   * The value is {@link DEFAULT_THIRDPERSON_ONLY_LAYER} by default but you can change the layer by specifying via {@link setup} if you prefer.
   *
   * @see https://vrm.dev/en/univrm/api/univrm_use_firstperson/
   * @see https://threejs.org/docs/#api/en/core/Layers
   */
  get thirdPersonOnlyLayer() {
    return this._thirdPersonOnlyLayer;
  }
  /**
   * In this method, it assigns layers for every meshes based on mesh annotations.
   * You must call this method first before you use the layer feature.
   *
   * This is an equivalent of [VRMFirstPerson.Setup](https://github.com/vrm-c/UniVRM/blob/73a5bd8fcddaa2a7a8735099a97e63c9db3e5ea0/Assets/VRM/Runtime/FirstPerson/VRMFirstPerson.cs#L295-L299) of the UniVRM.
   *
   * The `cameraLayer` parameter specifies which layer will be assigned for `FirstPersonOnly` / `ThirdPersonOnly`.
   * In UniVRM, we specified those by naming each desired layer as `FIRSTPERSON_ONLY_LAYER` / `THIRDPERSON_ONLY_LAYER`
   * but we are going to specify these layers at here since we are unable to name layers in Three.js.
   *
   * @param cameraLayer Specify which layer will be for `FirstPersonOnly` / `ThirdPersonOnly`.
   */
  setup({
    firstPersonOnlyLayer = _VRMFirstPerson2.DEFAULT_FIRSTPERSON_ONLY_LAYER,
    thirdPersonOnlyLayer = _VRMFirstPerson2.DEFAULT_THIRDPERSON_ONLY_LAYER
  } = {}) {
    if (this._initializedLayers) {
      return;
    }
    this._firstPersonOnlyLayer = firstPersonOnlyLayer;
    this._thirdPersonOnlyLayer = thirdPersonOnlyLayer;
    this.meshAnnotations.forEach((item) => {
      item.meshes.forEach((mesh) => {
        if (item.type === "firstPersonOnly") {
          mesh.layers.set(this._firstPersonOnlyLayer);
          mesh.traverse((child) => child.layers.set(this._firstPersonOnlyLayer));
        } else if (item.type === "thirdPersonOnly") {
          mesh.layers.set(this._thirdPersonOnlyLayer);
          mesh.traverse((child) => child.layers.set(this._thirdPersonOnlyLayer));
        } else if (item.type === "auto") {
          this._createHeadlessModel(mesh);
        }
      });
    });
    this._initializedLayers = true;
  }
  _excludeTriangles(triangles, bws, skinIndex, exclude) {
    let count = 0;
    if (bws != null && bws.length > 0) {
      for (let i = 0; i < triangles.length; i += 3) {
        const a = triangles[i];
        const b = triangles[i + 1];
        const c = triangles[i + 2];
        const bw0 = bws[a];
        const skin0 = skinIndex[a];
        if (bw0[0] > 0 && exclude.includes(skin0[0])) continue;
        if (bw0[1] > 0 && exclude.includes(skin0[1])) continue;
        if (bw0[2] > 0 && exclude.includes(skin0[2])) continue;
        if (bw0[3] > 0 && exclude.includes(skin0[3])) continue;
        const bw1 = bws[b];
        const skin1 = skinIndex[b];
        if (bw1[0] > 0 && exclude.includes(skin1[0])) continue;
        if (bw1[1] > 0 && exclude.includes(skin1[1])) continue;
        if (bw1[2] > 0 && exclude.includes(skin1[2])) continue;
        if (bw1[3] > 0 && exclude.includes(skin1[3])) continue;
        const bw2 = bws[c];
        const skin2 = skinIndex[c];
        if (bw2[0] > 0 && exclude.includes(skin2[0])) continue;
        if (bw2[1] > 0 && exclude.includes(skin2[1])) continue;
        if (bw2[2] > 0 && exclude.includes(skin2[2])) continue;
        if (bw2[3] > 0 && exclude.includes(skin2[3])) continue;
        triangles[count++] = a;
        triangles[count++] = b;
        triangles[count++] = c;
      }
    }
    return count;
  }
  _createErasedMesh(src, erasingBonesIndex) {
    const dst = new THREE5.SkinnedMesh(src.geometry.clone(), src.material);
    dst.name = `${src.name}(erase)`;
    dst.frustumCulled = src.frustumCulled;
    dst.layers.set(this._firstPersonOnlyLayer);
    const geometry = dst.geometry;
    const skinIndexAttr = geometry.getAttribute("skinIndex");
    const skinIndexAttrArray = skinIndexAttr instanceof THREE5.GLBufferAttribute ? [] : skinIndexAttr.array;
    const skinIndex = [];
    for (let i = 0; i < skinIndexAttrArray.length; i += 4) {
      skinIndex.push([
        skinIndexAttrArray[i],
        skinIndexAttrArray[i + 1],
        skinIndexAttrArray[i + 2],
        skinIndexAttrArray[i + 3]
      ]);
    }
    const skinWeightAttr = geometry.getAttribute("skinWeight");
    const skinWeightAttrArray = skinWeightAttr instanceof THREE5.GLBufferAttribute ? [] : skinWeightAttr.array;
    const skinWeight = [];
    for (let i = 0; i < skinWeightAttrArray.length; i += 4) {
      skinWeight.push([
        skinWeightAttrArray[i],
        skinWeightAttrArray[i + 1],
        skinWeightAttrArray[i + 2],
        skinWeightAttrArray[i + 3]
      ]);
    }
    const index = geometry.getIndex();
    if (!index) {
      throw new Error("The geometry doesn't have an index buffer");
    }
    const oldTriangles = Array.from(index.array);
    const count = this._excludeTriangles(oldTriangles, skinWeight, skinIndex, erasingBonesIndex);
    const newTriangle = [];
    for (let i = 0; i < count; i++) {
      newTriangle[i] = oldTriangles[i];
    }
    geometry.setIndex(newTriangle);
    if (src.onBeforeRender) {
      dst.onBeforeRender = src.onBeforeRender;
    }
    dst.bind(new THREE5.Skeleton(src.skeleton.bones, src.skeleton.boneInverses), new THREE5.Matrix4());
    return dst;
  }
  _createHeadlessModelForSkinnedMesh(parent, mesh) {
    const eraseBoneIndexes = [];
    mesh.skeleton.bones.forEach((bone, index) => {
      if (this._isEraseTarget(bone)) eraseBoneIndexes.push(index);
    });
    if (!eraseBoneIndexes.length) {
      mesh.layers.enable(this._thirdPersonOnlyLayer);
      mesh.layers.enable(this._firstPersonOnlyLayer);
      return;
    }
    mesh.layers.set(this._thirdPersonOnlyLayer);
    const newMesh = this._createErasedMesh(mesh, eraseBoneIndexes);
    parent.add(newMesh);
  }
  _createHeadlessModel(node) {
    if (node.type === "Group") {
      node.layers.set(this._thirdPersonOnlyLayer);
      if (this._isEraseTarget(node)) {
        node.traverse((child) => child.layers.set(this._thirdPersonOnlyLayer));
      } else {
        const parent = new THREE5.Group();
        parent.name = `_headless_${node.name}`;
        parent.layers.set(this._firstPersonOnlyLayer);
        node.parent.add(parent);
        node.children.filter((child) => child.type === "SkinnedMesh").forEach((child) => {
          const skinnedMesh = child;
          this._createHeadlessModelForSkinnedMesh(parent, skinnedMesh);
        });
      }
    } else if (node.type === "SkinnedMesh") {
      const skinnedMesh = node;
      this._createHeadlessModelForSkinnedMesh(node.parent, skinnedMesh);
    } else {
      if (this._isEraseTarget(node)) {
        node.layers.set(this._thirdPersonOnlyLayer);
        node.traverse((child) => child.layers.set(this._thirdPersonOnlyLayer));
      }
    }
  }
  _isEraseTarget(bone) {
    if (bone === this.humanoid.getRawBoneNode("head")) {
      return true;
    } else if (!bone.parent) {
      return false;
    } else {
      return this._isEraseTarget(bone.parent);
    }
  }
};
_VRMFirstPerson.DEFAULT_FIRSTPERSON_ONLY_LAYER = 9;
_VRMFirstPerson.DEFAULT_THIRDPERSON_ONLY_LAYER = 10;
var VRMFirstPerson = _VRMFirstPerson;
var POSSIBLE_SPEC_VERSIONS2 = /* @__PURE__ */ new Set(["1.0", "1.0-beta"]);
var VRMFirstPersonLoaderPlugin = class {
  get name() {
    return "VRMFirstPersonLoaderPlugin";
  }
  constructor(parser) {
    this.parser = parser;
  }
  afterRoot(gltf) {
    return __async2(this, null, function* () {
      const vrmHumanoid = gltf.userData.vrmHumanoid;
      if (vrmHumanoid === null) {
        return;
      } else if (vrmHumanoid === void 0) {
        throw new Error(
          "VRMFirstPersonLoaderPlugin: vrmHumanoid is undefined. VRMHumanoidLoaderPlugin have to be used first"
        );
      }
      gltf.userData.vrmFirstPerson = yield this._import(gltf, vrmHumanoid);
    });
  }
  /**
   * Import a {@link VRMFirstPerson} from a VRM.
   *
   * @param gltf A parsed result of GLTF taken from GLTFLoader
   * @param humanoid A {@link VRMHumanoid} instance that represents the VRM
   */
  _import(gltf, humanoid) {
    return __async2(this, null, function* () {
      if (humanoid == null) {
        return null;
      }
      const v1Result = yield this._v1Import(gltf, humanoid);
      if (v1Result) {
        return v1Result;
      }
      const v0Result = yield this._v0Import(gltf, humanoid);
      if (v0Result) {
        return v0Result;
      }
      return null;
    });
  }
  _v1Import(gltf, humanoid) {
    return __async2(this, null, function* () {
      var _a, _b;
      const json = this.parser.json;
      const isVRMUsed = ((_a = json.extensionsUsed) == null ? void 0 : _a.indexOf("VRMC_vrm")) !== -1;
      if (!isVRMUsed) {
        return null;
      }
      const extension = (_b = json.extensions) == null ? void 0 : _b["VRMC_vrm"];
      if (!extension) {
        return null;
      }
      const specVersion = extension.specVersion;
      if (!POSSIBLE_SPEC_VERSIONS2.has(specVersion)) {
        console.warn(`VRMFirstPersonLoaderPlugin: Unknown VRMC_vrm specVersion "${specVersion}"`);
        return null;
      }
      const schemaFirstPerson = extension.firstPerson;
      if (!schemaFirstPerson) {
        return null;
      }
      const meshAnnotations = [];
      const nodePrimitivesMap = yield gltfExtractPrimitivesFromNodes(gltf);
      Array.from(nodePrimitivesMap.entries()).forEach(([nodeIndex, primitives]) => {
        var _a2;
        const annotation = schemaFirstPerson.meshAnnotations ? schemaFirstPerson.meshAnnotations.find((a) => a.node === nodeIndex) : void 0;
        meshAnnotations.push({
          meshes: primitives,
          type: (_a2 = annotation == null ? void 0 : annotation.type) != null ? _a2 : "both"
        });
      });
      return new VRMFirstPerson(humanoid, meshAnnotations);
    });
  }
  _v0Import(gltf, humanoid) {
    return __async2(this, null, function* () {
      var _a;
      const json = this.parser.json;
      const vrmExt = (_a = json.extensions) == null ? void 0 : _a.VRM;
      if (!vrmExt) {
        return null;
      }
      const schemaFirstPerson = vrmExt.firstPerson;
      if (!schemaFirstPerson) {
        return null;
      }
      const meshAnnotations = [];
      const nodePrimitivesMap = yield gltfExtractPrimitivesFromNodes(gltf);
      Array.from(nodePrimitivesMap.entries()).forEach(([nodeIndex, primitives]) => {
        const schemaNode = json.nodes[nodeIndex];
        const flag = schemaFirstPerson.meshAnnotations ? schemaFirstPerson.meshAnnotations.find((a) => a.mesh === schemaNode.mesh) : void 0;
        meshAnnotations.push({
          meshes: primitives,
          type: this._convertV0FlagToV1Type(flag == null ? void 0 : flag.firstPersonFlag)
        });
      });
      return new VRMFirstPerson(humanoid, meshAnnotations);
    });
  }
  _convertV0FlagToV1Type(flag) {
    if (flag === "FirstPersonOnly") {
      return "firstPersonOnly";
    } else if (flag === "ThirdPersonOnly") {
      return "thirdPersonOnly";
    } else if (flag === "Auto") {
      return "auto";
    } else {
      return "both";
    }
  }
};
var VRMFirstPersonMeshAnnotationType = {
  Auto: "auto",
  Both: "both",
  ThirdPersonOnly: "thirdPersonOnly",
  FirstPersonOnly: "firstPersonOnly"
};
var _v3A = new THREE6.Vector3();
var _v3B = new THREE6.Vector3();
var _quatA = new THREE6.Quaternion();
var VRMHumanoidHelper = class extends THREE6.Group {
  constructor(humanoid) {
    super();
    this.vrmHumanoid = humanoid;
    this._boneAxesMap = /* @__PURE__ */ new Map();
    Object.values(humanoid.humanBones).forEach((bone) => {
      const helper = new THREE6.AxesHelper(1);
      helper.matrixAutoUpdate = false;
      helper.material.depthTest = false;
      helper.material.depthWrite = false;
      this.add(helper);
      this._boneAxesMap.set(bone, helper);
    });
  }
  dispose() {
    Array.from(this._boneAxesMap.values()).forEach((axes) => {
      axes.geometry.dispose();
      axes.material.dispose();
    });
  }
  updateMatrixWorld(force) {
    Array.from(this._boneAxesMap.entries()).forEach(([bone, axes]) => {
      bone.node.updateWorldMatrix(true, false);
      bone.node.matrixWorld.decompose(_v3A, _quatA, _v3B);
      const scale = _v3A.set(0.1, 0.1, 0.1).divide(_v3B);
      axes.matrix.copy(bone.node.matrixWorld).scale(scale);
    });
    super.updateMatrixWorld(force);
  }
};
var VRMHumanBoneList = [
  "hips",
  "spine",
  "chest",
  "upperChest",
  "neck",
  "head",
  "leftEye",
  "rightEye",
  "jaw",
  "leftUpperLeg",
  "leftLowerLeg",
  "leftFoot",
  "leftToes",
  "rightUpperLeg",
  "rightLowerLeg",
  "rightFoot",
  "rightToes",
  "leftShoulder",
  "leftUpperArm",
  "leftLowerArm",
  "leftHand",
  "rightShoulder",
  "rightUpperArm",
  "rightLowerArm",
  "rightHand",
  "leftThumbMetacarpal",
  "leftThumbProximal",
  "leftThumbDistal",
  "leftIndexProximal",
  "leftIndexIntermediate",
  "leftIndexDistal",
  "leftMiddleProximal",
  "leftMiddleIntermediate",
  "leftMiddleDistal",
  "leftRingProximal",
  "leftRingIntermediate",
  "leftRingDistal",
  "leftLittleProximal",
  "leftLittleIntermediate",
  "leftLittleDistal",
  "rightThumbMetacarpal",
  "rightThumbProximal",
  "rightThumbDistal",
  "rightIndexProximal",
  "rightIndexIntermediate",
  "rightIndexDistal",
  "rightMiddleProximal",
  "rightMiddleIntermediate",
  "rightMiddleDistal",
  "rightRingProximal",
  "rightRingIntermediate",
  "rightRingDistal",
  "rightLittleProximal",
  "rightLittleIntermediate",
  "rightLittleDistal"
];
var VRMHumanBoneName = {
  Hips: "hips",
  Spine: "spine",
  Chest: "chest",
  UpperChest: "upperChest",
  Neck: "neck",
  Head: "head",
  LeftEye: "leftEye",
  RightEye: "rightEye",
  Jaw: "jaw",
  LeftUpperLeg: "leftUpperLeg",
  LeftLowerLeg: "leftLowerLeg",
  LeftFoot: "leftFoot",
  LeftToes: "leftToes",
  RightUpperLeg: "rightUpperLeg",
  RightLowerLeg: "rightLowerLeg",
  RightFoot: "rightFoot",
  RightToes: "rightToes",
  LeftShoulder: "leftShoulder",
  LeftUpperArm: "leftUpperArm",
  LeftLowerArm: "leftLowerArm",
  LeftHand: "leftHand",
  RightShoulder: "rightShoulder",
  RightUpperArm: "rightUpperArm",
  RightLowerArm: "rightLowerArm",
  RightHand: "rightHand",
  LeftThumbMetacarpal: "leftThumbMetacarpal",
  LeftThumbProximal: "leftThumbProximal",
  LeftThumbDistal: "leftThumbDistal",
  LeftIndexProximal: "leftIndexProximal",
  LeftIndexIntermediate: "leftIndexIntermediate",
  LeftIndexDistal: "leftIndexDistal",
  LeftMiddleProximal: "leftMiddleProximal",
  LeftMiddleIntermediate: "leftMiddleIntermediate",
  LeftMiddleDistal: "leftMiddleDistal",
  LeftRingProximal: "leftRingProximal",
  LeftRingIntermediate: "leftRingIntermediate",
  LeftRingDistal: "leftRingDistal",
  LeftLittleProximal: "leftLittleProximal",
  LeftLittleIntermediate: "leftLittleIntermediate",
  LeftLittleDistal: "leftLittleDistal",
  RightThumbMetacarpal: "rightThumbMetacarpal",
  RightThumbProximal: "rightThumbProximal",
  RightThumbDistal: "rightThumbDistal",
  RightIndexProximal: "rightIndexProximal",
  RightIndexIntermediate: "rightIndexIntermediate",
  RightIndexDistal: "rightIndexDistal",
  RightMiddleProximal: "rightMiddleProximal",
  RightMiddleIntermediate: "rightMiddleIntermediate",
  RightMiddleDistal: "rightMiddleDistal",
  RightRingProximal: "rightRingProximal",
  RightRingIntermediate: "rightRingIntermediate",
  RightRingDistal: "rightRingDistal",
  RightLittleProximal: "rightLittleProximal",
  RightLittleIntermediate: "rightLittleIntermediate",
  RightLittleDistal: "rightLittleDistal"
};
var VRMHumanBoneParentMap = {
  hips: null,
  spine: "hips",
  chest: "spine",
  upperChest: "chest",
  neck: "upperChest",
  head: "neck",
  leftEye: "head",
  rightEye: "head",
  jaw: "head",
  leftUpperLeg: "hips",
  leftLowerLeg: "leftUpperLeg",
  leftFoot: "leftLowerLeg",
  leftToes: "leftFoot",
  rightUpperLeg: "hips",
  rightLowerLeg: "rightUpperLeg",
  rightFoot: "rightLowerLeg",
  rightToes: "rightFoot",
  leftShoulder: "upperChest",
  leftUpperArm: "leftShoulder",
  leftLowerArm: "leftUpperArm",
  leftHand: "leftLowerArm",
  rightShoulder: "upperChest",
  rightUpperArm: "rightShoulder",
  rightLowerArm: "rightUpperArm",
  rightHand: "rightLowerArm",
  leftThumbMetacarpal: "leftHand",
  leftThumbProximal: "leftThumbMetacarpal",
  leftThumbDistal: "leftThumbProximal",
  leftIndexProximal: "leftHand",
  leftIndexIntermediate: "leftIndexProximal",
  leftIndexDistal: "leftIndexIntermediate",
  leftMiddleProximal: "leftHand",
  leftMiddleIntermediate: "leftMiddleProximal",
  leftMiddleDistal: "leftMiddleIntermediate",
  leftRingProximal: "leftHand",
  leftRingIntermediate: "leftRingProximal",
  leftRingDistal: "leftRingIntermediate",
  leftLittleProximal: "leftHand",
  leftLittleIntermediate: "leftLittleProximal",
  leftLittleDistal: "leftLittleIntermediate",
  rightThumbMetacarpal: "rightHand",
  rightThumbProximal: "rightThumbMetacarpal",
  rightThumbDistal: "rightThumbProximal",
  rightIndexProximal: "rightHand",
  rightIndexIntermediate: "rightIndexProximal",
  rightIndexDistal: "rightIndexIntermediate",
  rightMiddleProximal: "rightHand",
  rightMiddleIntermediate: "rightMiddleProximal",
  rightMiddleDistal: "rightMiddleIntermediate",
  rightRingProximal: "rightHand",
  rightRingIntermediate: "rightRingProximal",
  rightRingDistal: "rightRingIntermediate",
  rightLittleProximal: "rightHand",
  rightLittleIntermediate: "rightLittleProximal",
  rightLittleDistal: "rightLittleIntermediate"
};
function quatInvertCompat(target) {
  if (target.invert) {
    target.invert();
  } else {
    target.inverse();
  }
  return target;
}
var _v3A2 = new THREE7.Vector3();
var _quatA2 = new THREE7.Quaternion();
var VRMRig = class {
  /**
   * Create a new {@link VRMHumanoid}.
   * @param humanBones A {@link VRMHumanBones} contains all the bones of the new humanoid
   */
  constructor(humanBones) {
    this.humanBones = humanBones;
    this.restPose = this.getAbsolutePose();
  }
  /**
   * Return the current absolute pose of this humanoid as a {@link VRMPose}.
   * Note that the output result will contain initial state of the VRM and not compatible between different models.
   * You might want to use {@link getPose} instead.
   */
  getAbsolutePose() {
    const pose = {};
    Object.keys(this.humanBones).forEach((vrmBoneNameString) => {
      const vrmBoneName = vrmBoneNameString;
      const node = this.getBoneNode(vrmBoneName);
      if (!node) {
        return;
      }
      _v3A2.copy(node.position);
      _quatA2.copy(node.quaternion);
      pose[vrmBoneName] = {
        position: _v3A2.toArray(),
        rotation: _quatA2.toArray()
      };
    });
    return pose;
  }
  /**
   * Return the current pose of this humanoid as a {@link VRMPose}.
   *
   * Each transform is a local transform relative from rest pose (T-pose).
   */
  getPose() {
    const pose = {};
    Object.keys(this.humanBones).forEach((boneNameString) => {
      const boneName = boneNameString;
      const node = this.getBoneNode(boneName);
      if (!node) {
        return;
      }
      _v3A2.set(0, 0, 0);
      _quatA2.identity();
      const restState = this.restPose[boneName];
      if (restState == null ? void 0 : restState.position) {
        _v3A2.fromArray(restState.position).negate();
      }
      if (restState == null ? void 0 : restState.rotation) {
        quatInvertCompat(_quatA2.fromArray(restState.rotation));
      }
      _v3A2.add(node.position);
      _quatA2.premultiply(node.quaternion);
      pose[boneName] = {
        position: _v3A2.toArray(),
        rotation: _quatA2.toArray()
      };
    });
    return pose;
  }
  /**
   * Let the humanoid do a specified pose.
   *
   * Each transform have to be a local transform relative from rest pose (T-pose).
   * You can pass what you got from {@link getPose}.
   *
   * @param poseObject A [[VRMPose]] that represents a single pose
   */
  setPose(poseObject) {
    Object.entries(poseObject).forEach(([boneNameString, state]) => {
      const boneName = boneNameString;
      const node = this.getBoneNode(boneName);
      if (!node) {
        return;
      }
      const restState = this.restPose[boneName];
      if (!restState) {
        return;
      }
      if (state == null ? void 0 : state.position) {
        node.position.fromArray(state.position);
        if (restState.position) {
          node.position.add(_v3A2.fromArray(restState.position));
        }
      }
      if (state == null ? void 0 : state.rotation) {
        node.quaternion.fromArray(state.rotation);
        if (restState.rotation) {
          node.quaternion.multiply(_quatA2.fromArray(restState.rotation));
        }
      }
    });
  }
  /**
   * Reset the humanoid to its rest pose.
   */
  resetPose() {
    Object.entries(this.restPose).forEach(([boneName, rest]) => {
      const node = this.getBoneNode(boneName);
      if (!node) {
        return;
      }
      if (rest == null ? void 0 : rest.position) {
        node.position.fromArray(rest.position);
      }
      if (rest == null ? void 0 : rest.rotation) {
        node.quaternion.fromArray(rest.rotation);
      }
    });
  }
  /**
   * Return a bone bound to a specified {@link VRMHumanBoneName}, as a {@link VRMHumanBone}.
   *
   * @param name Name of the bone you want
   */
  getBone(name) {
    var _a;
    return (_a = this.humanBones[name]) != null ? _a : void 0;
  }
  /**
   * Return a bone bound to a specified {@link VRMHumanBoneName}, as a `THREE.Object3D`.
   *
   * @param name Name of the bone you want
   */
  getBoneNode(name) {
    var _a, _b;
    return (_b = (_a = this.humanBones[name]) == null ? void 0 : _a.node) != null ? _b : null;
  }
};
var _v3A3 = new THREE8.Vector3();
var _quatA3 = new THREE8.Quaternion();
var _boneWorldPos = new THREE8.Vector3();
var VRMHumanoidRig = class _VRMHumanoidRig extends VRMRig {
  static _setupTransforms(modelRig) {
    const root = new THREE8.Object3D();
    root.name = "VRMHumanoidRig";
    const boneWorldPositions = {};
    const boneWorldRotations = {};
    const boneRotations = {};
    const parentWorldRotations = {};
    VRMHumanBoneList.forEach((boneName) => {
      var _a;
      const boneNode = modelRig.getBoneNode(boneName);
      if (boneNode) {
        const boneWorldPosition = new THREE8.Vector3();
        const boneWorldRotation = new THREE8.Quaternion();
        boneNode.updateWorldMatrix(true, false);
        boneNode.matrixWorld.decompose(boneWorldPosition, boneWorldRotation, _v3A3);
        boneWorldPositions[boneName] = boneWorldPosition;
        boneWorldRotations[boneName] = boneWorldRotation;
        boneRotations[boneName] = boneNode.quaternion.clone();
        const parentWorldRotation = new THREE8.Quaternion();
        (_a = boneNode.parent) == null ? void 0 : _a.matrixWorld.decompose(_v3A3, parentWorldRotation, _v3A3);
        parentWorldRotations[boneName] = parentWorldRotation;
      }
    });
    const rigBones = {};
    VRMHumanBoneList.forEach((boneName) => {
      var _a;
      const boneNode = modelRig.getBoneNode(boneName);
      if (boneNode) {
        const boneWorldPosition = boneWorldPositions[boneName];
        let currentBoneName = boneName;
        let parentBoneWorldPosition;
        while (parentBoneWorldPosition == null) {
          currentBoneName = VRMHumanBoneParentMap[currentBoneName];
          if (currentBoneName == null) {
            break;
          }
          parentBoneWorldPosition = boneWorldPositions[currentBoneName];
        }
        const rigBoneNode = new THREE8.Object3D();
        rigBoneNode.name = "Normalized_" + boneNode.name;
        const parentRigBoneNode = currentBoneName ? (_a = rigBones[currentBoneName]) == null ? void 0 : _a.node : root;
        parentRigBoneNode.add(rigBoneNode);
        rigBoneNode.position.copy(boneWorldPosition);
        if (parentBoneWorldPosition) {
          rigBoneNode.position.sub(parentBoneWorldPosition);
        }
        rigBones[boneName] = { node: rigBoneNode };
      }
    });
    return {
      rigBones,
      root,
      parentWorldRotations,
      boneRotations
    };
  }
  constructor(humanoid) {
    const { rigBones, root, parentWorldRotations, boneRotations } = _VRMHumanoidRig._setupTransforms(humanoid);
    super(rigBones);
    this.original = humanoid;
    this.root = root;
    this._parentWorldRotations = parentWorldRotations;
    this._boneRotations = boneRotations;
  }
  /**
   * Update this humanoid rig.
   */
  update() {
    VRMHumanBoneList.forEach((boneName) => {
      const boneNode = this.original.getBoneNode(boneName);
      if (boneNode != null) {
        const rigBoneNode = this.getBoneNode(boneName);
        const parentWorldRotation = this._parentWorldRotations[boneName];
        const invParentWorldRotation = _quatA3.copy(parentWorldRotation).invert();
        const boneRotation = this._boneRotations[boneName];
        boneNode.quaternion.copy(rigBoneNode.quaternion).multiply(parentWorldRotation).premultiply(invParentWorldRotation).multiply(boneRotation);
        if (boneName === "hips") {
          const boneWorldPosition = rigBoneNode.getWorldPosition(_boneWorldPos);
          boneNode.parent.updateWorldMatrix(true, false);
          const parentWorldMatrix = boneNode.parent.matrixWorld;
          const localPosition = boneWorldPosition.applyMatrix4(parentWorldMatrix.invert());
          boneNode.position.copy(localPosition);
        }
      }
    });
  }
};
var VRMHumanoid = class _VRMHumanoid {
  // TODO: Rename
  /**
   * @deprecated Deprecated. Use either {@link rawRestPose} or {@link normalizedRestPose} instead.
   */
  get restPose() {
    console.warn("VRMHumanoid: restPose is deprecated. Use either rawRestPose or normalizedRestPose instead.");
    return this.rawRestPose;
  }
  /**
   * A {@link VRMPose} of its raw human bones that is its default state.
   * Note that it's not compatible with {@link setRawPose} and {@link getRawPose}, since it contains non-relative values of each local transforms.
   */
  get rawRestPose() {
    return this._rawHumanBones.restPose;
  }
  /**
   * A {@link VRMPose} of its normalized human bones that is its default state.
   * Note that it's not compatible with {@link setNormalizedPose} and {@link getNormalizedPose}, since it contains non-relative values of each local transforms.
   */
  get normalizedRestPose() {
    return this._normalizedHumanBones.restPose;
  }
  /**
   * A map from {@link VRMHumanBoneName} to raw {@link VRMHumanBone}s.
   */
  get humanBones() {
    return this._rawHumanBones.humanBones;
  }
  /**
   * A map from {@link VRMHumanBoneName} to raw {@link VRMHumanBone}s.
   */
  get rawHumanBones() {
    return this._rawHumanBones.humanBones;
  }
  /**
   * A map from {@link VRMHumanBoneName} to normalized {@link VRMHumanBone}s.
   */
  get normalizedHumanBones() {
    return this._normalizedHumanBones.humanBones;
  }
  /**
   * The root of normalized {@link VRMHumanBone}s.
   */
  get normalizedHumanBonesRoot() {
    return this._normalizedHumanBones.root;
  }
  /**
   * Create a new {@link VRMHumanoid}.
   * @param humanBones A {@link VRMHumanBones} contains all the bones of the new humanoid
   * @param autoUpdateHumanBones Whether it copies pose from normalizedHumanBones to rawHumanBones on {@link update}. `true` by default.
   */
  constructor(humanBones, options) {
    var _a;
    this.autoUpdateHumanBones = (_a = options == null ? void 0 : options.autoUpdateHumanBones) != null ? _a : true;
    this._rawHumanBones = new VRMRig(humanBones);
    this._normalizedHumanBones = new VRMHumanoidRig(this._rawHumanBones);
  }
  /**
   * Copy the given {@link VRMHumanoid} into this one.
   * @param source The {@link VRMHumanoid} you want to copy
   * @returns this
   */
  copy(source) {
    this.autoUpdateHumanBones = source.autoUpdateHumanBones;
    this._rawHumanBones = new VRMRig(source.humanBones);
    this._normalizedHumanBones = new VRMHumanoidRig(this._rawHumanBones);
    return this;
  }
  /**
   * Returns a clone of this {@link VRMHumanoid}.
   * @returns Copied {@link VRMHumanoid}
   */
  clone() {
    return new _VRMHumanoid(this.humanBones, { autoUpdateHumanBones: this.autoUpdateHumanBones }).copy(this);
  }
  /**
   * @deprecated Deprecated. Use either {@link getRawAbsolutePose} or {@link getNormalizedAbsolutePose} instead.
   */
  getAbsolutePose() {
    console.warn(
      "VRMHumanoid: getAbsolutePose() is deprecated. Use either getRawAbsolutePose() or getNormalizedAbsolutePose() instead."
    );
    return this.getRawAbsolutePose();
  }
  /**
   * Return the current absolute pose of this raw human bones as a {@link VRMPose}.
   * Note that the output result will contain initial state of the VRM and not compatible between different models.
   * You might want to use {@link getRawPose} instead.
   */
  getRawAbsolutePose() {
    return this._rawHumanBones.getAbsolutePose();
  }
  /**
   * Return the current absolute pose of this normalized human bones as a {@link VRMPose}.
   * Note that the output result will contain initial state of the VRM and not compatible between different models.
   * You might want to use {@link getNormalizedPose} instead.
   */
  getNormalizedAbsolutePose() {
    return this._normalizedHumanBones.getAbsolutePose();
  }
  /**
   * @deprecated Deprecated. Use either {@link getRawPose} or {@link getNormalizedPose} instead.
   */
  getPose() {
    console.warn("VRMHumanoid: getPose() is deprecated. Use either getRawPose() or getNormalizedPose() instead.");
    return this.getRawPose();
  }
  /**
   * Return the current pose of raw human bones as a {@link VRMPose}.
   *
   * Each transform is a local transform relative from rest pose (T-pose).
   */
  getRawPose() {
    return this._rawHumanBones.getPose();
  }
  /**
   * Return the current pose of normalized human bones as a {@link VRMPose}.
   *
   * Each transform is a local transform relative from rest pose (T-pose).
   */
  getNormalizedPose() {
    return this._normalizedHumanBones.getPose();
  }
  /**
   * @deprecated Deprecated. Use either {@link setRawPose} or {@link setNormalizedPose} instead.
   */
  setPose(poseObject) {
    console.warn("VRMHumanoid: setPose() is deprecated. Use either setRawPose() or setNormalizedPose() instead.");
    return this.setRawPose(poseObject);
  }
  /**
   * Let the raw human bones do a specified pose.
   *
   * Each transform have to be a local transform relative from rest pose (T-pose).
   * You can pass what you got from {@link getRawPose}.
   *
   * If you are using {@link autoUpdateHumanBones}, you might want to use {@link setNormalizedPose} instead.
   *
   * @param poseObject A {@link VRMPose} that represents a single pose
   */
  setRawPose(poseObject) {
    return this._rawHumanBones.setPose(poseObject);
  }
  /**
   * Let the normalized human bones do a specified pose.
   *
   * Each transform have to be a local transform relative from rest pose (T-pose).
   * You can pass what you got from {@link getNormalizedPose}.
   *
   * @param poseObject A {@link VRMPose} that represents a single pose
   */
  setNormalizedPose(poseObject) {
    return this._normalizedHumanBones.setPose(poseObject);
  }
  /**
   * @deprecated Deprecated. Use either {@link resetRawPose} or {@link resetNormalizedPose} instead.
   */
  resetPose() {
    console.warn("VRMHumanoid: resetPose() is deprecated. Use either resetRawPose() or resetNormalizedPose() instead.");
    return this.resetRawPose();
  }
  /**
   * Reset the raw humanoid to its rest pose.
   *
   * If you are using {@link autoUpdateHumanBones}, you might want to use {@link resetNormalizedPose} instead.
   */
  resetRawPose() {
    return this._rawHumanBones.resetPose();
  }
  /**
   * Reset the normalized humanoid to its rest pose.
   */
  resetNormalizedPose() {
    return this._normalizedHumanBones.resetPose();
  }
  /**
   * @deprecated Deprecated. Use either {@link getRawBone} or {@link getNormalizedBone} instead.
   */
  getBone(name) {
    console.warn("VRMHumanoid: getBone() is deprecated. Use either getRawBone() or getNormalizedBone() instead.");
    return this.getRawBone(name);
  }
  /**
   * Return a raw {@link VRMHumanBone} bound to a specified {@link VRMHumanBoneName}.
   *
   * @param name Name of the bone you want
   */
  getRawBone(name) {
    return this._rawHumanBones.getBone(name);
  }
  /**
   * Return a normalized {@link VRMHumanBone} bound to a specified {@link VRMHumanBoneName}.
   *
   * @param name Name of the bone you want
   */
  getNormalizedBone(name) {
    return this._normalizedHumanBones.getBone(name);
  }
  /**
   * @deprecated Deprecated. Use either {@link getRawBoneNode} or {@link getNormalizedBoneNode} instead.
   */
  getBoneNode(name) {
    console.warn(
      "VRMHumanoid: getBoneNode() is deprecated. Use either getRawBoneNode() or getNormalizedBoneNode() instead."
    );
    return this.getRawBoneNode(name);
  }
  /**
   * Return a raw bone as a `THREE.Object3D` bound to a specified {@link VRMHumanBoneName}.
   *
   * @param name Name of the bone you want
   */
  getRawBoneNode(name) {
    return this._rawHumanBones.getBoneNode(name);
  }
  /**
   * Return a normalized bone as a `THREE.Object3D` bound to a specified {@link VRMHumanBoneName}.
   *
   * @param name Name of the bone you want
   */
  getNormalizedBoneNode(name) {
    return this._normalizedHumanBones.getBoneNode(name);
  }
  /**
   * Update the humanoid component.
   *
   * If {@link autoUpdateHumanBones} is `true`, it transfers the pose of normalized human bones to raw human bones.
   */
  update() {
    if (this.autoUpdateHumanBones) {
      this._normalizedHumanBones.update();
    }
  }
};
var VRMRequiredHumanBoneName = {
  Hips: "hips",
  Spine: "spine",
  Head: "head",
  LeftUpperLeg: "leftUpperLeg",
  LeftLowerLeg: "leftLowerLeg",
  LeftFoot: "leftFoot",
  RightUpperLeg: "rightUpperLeg",
  RightLowerLeg: "rightLowerLeg",
  RightFoot: "rightFoot",
  LeftUpperArm: "leftUpperArm",
  LeftLowerArm: "leftLowerArm",
  LeftHand: "leftHand",
  RightUpperArm: "rightUpperArm",
  RightLowerArm: "rightLowerArm",
  RightHand: "rightHand"
};
var POSSIBLE_SPEC_VERSIONS3 = /* @__PURE__ */ new Set(["1.0", "1.0-beta"]);
var thumbBoneNameMap = {
  leftThumbProximal: "leftThumbMetacarpal",
  leftThumbIntermediate: "leftThumbProximal",
  rightThumbProximal: "rightThumbMetacarpal",
  rightThumbIntermediate: "rightThumbProximal"
};
var VRMHumanoidLoaderPlugin = class {
  get name() {
    return "VRMHumanoidLoaderPlugin";
  }
  constructor(parser, options) {
    this.parser = parser;
    this.helperRoot = options == null ? void 0 : options.helperRoot;
    this.autoUpdateHumanBones = options == null ? void 0 : options.autoUpdateHumanBones;
  }
  afterRoot(gltf) {
    return __async2(this, null, function* () {
      gltf.userData.vrmHumanoid = yield this._import(gltf);
    });
  }
  /**
   * Import a {@link VRMHumanoid} from a VRM.
   *
   * @param gltf A parsed result of GLTF taken from GLTFLoader
   */
  _import(gltf) {
    return __async2(this, null, function* () {
      const v1Result = yield this._v1Import(gltf);
      if (v1Result) {
        return v1Result;
      }
      const v0Result = yield this._v0Import(gltf);
      if (v0Result) {
        return v0Result;
      }
      return null;
    });
  }
  _v1Import(gltf) {
    return __async2(this, null, function* () {
      var _a, _b;
      const json = this.parser.json;
      const isVRMUsed = ((_a = json.extensionsUsed) == null ? void 0 : _a.indexOf("VRMC_vrm")) !== -1;
      if (!isVRMUsed) {
        return null;
      }
      const extension = (_b = json.extensions) == null ? void 0 : _b["VRMC_vrm"];
      if (!extension) {
        return null;
      }
      const specVersion = extension.specVersion;
      if (!POSSIBLE_SPEC_VERSIONS3.has(specVersion)) {
        console.warn(`VRMHumanoidLoaderPlugin: Unknown VRMC_vrm specVersion "${specVersion}"`);
        return null;
      }
      const schemaHumanoid = extension.humanoid;
      if (!schemaHumanoid) {
        return null;
      }
      const existsPreviousThumbName = schemaHumanoid.humanBones.leftThumbIntermediate != null || schemaHumanoid.humanBones.rightThumbIntermediate != null;
      const humanBones = {};
      if (schemaHumanoid.humanBones != null) {
        yield Promise.all(
          Object.entries(schemaHumanoid.humanBones).map((_0) => __async2(this, [_0], function* ([boneNameString, schemaHumanBone]) {
            let boneName = boneNameString;
            const index = schemaHumanBone.node;
            if (existsPreviousThumbName) {
              const thumbBoneName = thumbBoneNameMap[boneName];
              if (thumbBoneName != null) {
                boneName = thumbBoneName;
              }
            }
            const node = yield this.parser.getDependency("node", index);
            if (node == null) {
              console.warn(`A glTF node bound to the humanoid bone ${boneName} (index = ${index}) does not exist`);
              return;
            }
            humanBones[boneName] = { node };
          }))
        );
      }
      const humanoid = new VRMHumanoid(this._ensureRequiredBonesExist(humanBones), {
        autoUpdateHumanBones: this.autoUpdateHumanBones
      });
      gltf.scene.add(humanoid.normalizedHumanBonesRoot);
      if (this.helperRoot) {
        const helper = new VRMHumanoidHelper(humanoid);
        this.helperRoot.add(helper);
        helper.renderOrder = this.helperRoot.renderOrder;
      }
      return humanoid;
    });
  }
  _v0Import(gltf) {
    return __async2(this, null, function* () {
      var _a;
      const json = this.parser.json;
      const vrmExt = (_a = json.extensions) == null ? void 0 : _a.VRM;
      if (!vrmExt) {
        return null;
      }
      const schemaHumanoid = vrmExt.humanoid;
      if (!schemaHumanoid) {
        return null;
      }
      const humanBones = {};
      if (schemaHumanoid.humanBones != null) {
        yield Promise.all(
          schemaHumanoid.humanBones.map((bone) => __async2(this, null, function* () {
            const boneName = bone.bone;
            const index = bone.node;
            if (boneName == null || index == null) {
              return;
            }
            const node = yield this.parser.getDependency("node", index);
            if (node == null) {
              console.warn(`A glTF node bound to the humanoid bone ${boneName} (index = ${index}) does not exist`);
              return;
            }
            const thumbBoneName = thumbBoneNameMap[boneName];
            const newBoneName = thumbBoneName != null ? thumbBoneName : boneName;
            if (humanBones[newBoneName] != null) {
              console.warn(
                `Multiple bone entries for ${newBoneName} detected (index = ${index}), ignoring duplicated entries.`
              );
              return;
            }
            humanBones[newBoneName] = { node };
          }))
        );
      }
      const humanoid = new VRMHumanoid(this._ensureRequiredBonesExist(humanBones), {
        autoUpdateHumanBones: this.autoUpdateHumanBones
      });
      gltf.scene.add(humanoid.normalizedHumanBonesRoot);
      if (this.helperRoot) {
        const helper = new VRMHumanoidHelper(humanoid);
        this.helperRoot.add(helper);
        helper.renderOrder = this.helperRoot.renderOrder;
      }
      return humanoid;
    });
  }
  /**
   * Ensure required bones exist in given human bones.
   * @param humanBones Human bones
   * @returns Human bones, no longer partial!
   */
  _ensureRequiredBonesExist(humanBones) {
    const missingRequiredBones = Object.values(VRMRequiredHumanBoneName).filter(
      (requiredBoneName) => humanBones[requiredBoneName] == null
    );
    if (missingRequiredBones.length > 0) {
      throw new Error(
        `VRMHumanoidLoaderPlugin: These humanoid bones are required but not exist: ${missingRequiredBones.join(", ")}`
      );
    }
    return humanBones;
  }
};
var FanBufferGeometry = class extends THREE9.BufferGeometry {
  constructor() {
    super();
    this._currentTheta = 0;
    this._currentRadius = 0;
    this.theta = 0;
    this.radius = 0;
    this._currentTheta = 0;
    this._currentRadius = 0;
    this._attrPos = new THREE9.BufferAttribute(new Float32Array(65 * 3), 3);
    this.setAttribute("position", this._attrPos);
    this._attrIndex = new THREE9.BufferAttribute(new Uint16Array(3 * 63), 1);
    this.setIndex(this._attrIndex);
    this._buildIndex();
    this.update();
  }
  update() {
    let shouldUpdateGeometry = false;
    if (this._currentTheta !== this.theta) {
      this._currentTheta = this.theta;
      shouldUpdateGeometry = true;
    }
    if (this._currentRadius !== this.radius) {
      this._currentRadius = this.radius;
      shouldUpdateGeometry = true;
    }
    if (shouldUpdateGeometry) {
      this._buildPosition();
    }
  }
  _buildPosition() {
    this._attrPos.setXYZ(0, 0, 0, 0);
    for (let i = 0; i < 64; i++) {
      const t = i / 63 * this._currentTheta;
      this._attrPos.setXYZ(i + 1, this._currentRadius * Math.sin(t), 0, this._currentRadius * Math.cos(t));
    }
    this._attrPos.needsUpdate = true;
  }
  _buildIndex() {
    for (let i = 0; i < 63; i++) {
      this._attrIndex.setXYZ(i * 3, 0, i + 1, i + 2);
    }
    this._attrIndex.needsUpdate = true;
  }
};
var LineAndSphereBufferGeometry = class extends THREE10.BufferGeometry {
  constructor() {
    super();
    this.radius = 0;
    this._currentRadius = 0;
    this.tail = new THREE10.Vector3();
    this._currentTail = new THREE10.Vector3();
    this._attrPos = new THREE10.BufferAttribute(new Float32Array(294), 3);
    this.setAttribute("position", this._attrPos);
    this._attrIndex = new THREE10.BufferAttribute(new Uint16Array(194), 1);
    this.setIndex(this._attrIndex);
    this._buildIndex();
    this.update();
  }
  update() {
    let shouldUpdateGeometry = false;
    if (this._currentRadius !== this.radius) {
      this._currentRadius = this.radius;
      shouldUpdateGeometry = true;
    }
    if (!this._currentTail.equals(this.tail)) {
      this._currentTail.copy(this.tail);
      shouldUpdateGeometry = true;
    }
    if (shouldUpdateGeometry) {
      this._buildPosition();
    }
  }
  _buildPosition() {
    for (let i = 0; i < 32; i++) {
      const t = i / 16 * Math.PI;
      this._attrPos.setXYZ(i, Math.cos(t), Math.sin(t), 0);
      this._attrPos.setXYZ(32 + i, 0, Math.cos(t), Math.sin(t));
      this._attrPos.setXYZ(64 + i, Math.sin(t), 0, Math.cos(t));
    }
    this.scale(this._currentRadius, this._currentRadius, this._currentRadius);
    this.translate(this._currentTail.x, this._currentTail.y, this._currentTail.z);
    this._attrPos.setXYZ(96, 0, 0, 0);
    this._attrPos.setXYZ(97, this._currentTail.x, this._currentTail.y, this._currentTail.z);
    this._attrPos.needsUpdate = true;
  }
  _buildIndex() {
    for (let i = 0; i < 32; i++) {
      const i1 = (i + 1) % 32;
      this._attrIndex.setXY(i * 2, i, i1);
      this._attrIndex.setXY(64 + i * 2, 32 + i, 32 + i1);
      this._attrIndex.setXY(128 + i * 2, 64 + i, 64 + i1);
    }
    this._attrIndex.setXY(192, 96, 97);
    this._attrIndex.needsUpdate = true;
  }
};
var _quatA4 = new THREE11.Quaternion();
var _quatB = new THREE11.Quaternion();
var _v3A4 = new THREE11.Vector3();
var _v3B2 = new THREE11.Vector3();
var SQRT_2_OVER_2 = Math.sqrt(2) / 2;
var QUAT_XY_CW90 = new THREE11.Quaternion(0, 0, -SQRT_2_OVER_2, SQRT_2_OVER_2);
var VEC3_POSITIVE_Y = new THREE11.Vector3(0, 1, 0);
var VRMLookAtHelper = class extends THREE11.Group {
  constructor(lookAt) {
    super();
    this.matrixAutoUpdate = false;
    this.vrmLookAt = lookAt;
    {
      const geometry = new FanBufferGeometry();
      geometry.radius = 0.5;
      const material = new THREE11.MeshBasicMaterial({
        color: 65280,
        transparent: true,
        opacity: 0.5,
        side: THREE11.DoubleSide,
        depthTest: false,
        depthWrite: false
      });
      this._meshPitch = new THREE11.Mesh(geometry, material);
      this.add(this._meshPitch);
    }
    {
      const geometry = new FanBufferGeometry();
      geometry.radius = 0.5;
      const material = new THREE11.MeshBasicMaterial({
        color: 16711680,
        transparent: true,
        opacity: 0.5,
        side: THREE11.DoubleSide,
        depthTest: false,
        depthWrite: false
      });
      this._meshYaw = new THREE11.Mesh(geometry, material);
      this.add(this._meshYaw);
    }
    {
      const geometry = new LineAndSphereBufferGeometry();
      geometry.radius = 0.1;
      const material = new THREE11.LineBasicMaterial({
        color: 16777215,
        depthTest: false,
        depthWrite: false
      });
      this._lineTarget = new THREE11.LineSegments(geometry, material);
      this._lineTarget.frustumCulled = false;
      this.add(this._lineTarget);
    }
  }
  dispose() {
    this._meshYaw.geometry.dispose();
    this._meshYaw.material.dispose();
    this._meshPitch.geometry.dispose();
    this._meshPitch.material.dispose();
    this._lineTarget.geometry.dispose();
    this._lineTarget.material.dispose();
  }
  updateMatrixWorld(force) {
    const yaw = THREE11.MathUtils.DEG2RAD * this.vrmLookAt.yaw;
    this._meshYaw.geometry.theta = yaw;
    this._meshYaw.geometry.update();
    const pitch = THREE11.MathUtils.DEG2RAD * this.vrmLookAt.pitch;
    this._meshPitch.geometry.theta = pitch;
    this._meshPitch.geometry.update();
    this.vrmLookAt.getLookAtWorldPosition(_v3A4);
    this.vrmLookAt.getLookAtWorldQuaternion(_quatA4);
    _quatA4.multiply(this.vrmLookAt.getFaceFrontQuaternion(_quatB));
    this._meshYaw.position.copy(_v3A4);
    this._meshYaw.quaternion.copy(_quatA4);
    this._meshPitch.position.copy(_v3A4);
    this._meshPitch.quaternion.copy(_quatA4);
    this._meshPitch.quaternion.multiply(_quatB.setFromAxisAngle(VEC3_POSITIVE_Y, yaw));
    this._meshPitch.quaternion.multiply(QUAT_XY_CW90);
    const { target, autoUpdate } = this.vrmLookAt;
    if (target != null && autoUpdate) {
      target.getWorldPosition(_v3B2).sub(_v3A4);
      this._lineTarget.geometry.tail.copy(_v3B2);
      this._lineTarget.geometry.update();
      this._lineTarget.position.copy(_v3A4);
    }
    super.updateMatrixWorld(force);
  }
};
var _position = new THREE12.Vector3();
var _scale = new THREE12.Vector3();
function getWorldQuaternionLite(object, out) {
  object.matrixWorld.decompose(_position, out, _scale);
  return out;
}
function calcAzimuthAltitude(vector) {
  return [Math.atan2(-vector.z, vector.x), Math.atan2(vector.y, Math.sqrt(vector.x * vector.x + vector.z * vector.z))];
}
function sanitizeAngle(angle) {
  const roundTurn = Math.round(angle / 2 / Math.PI);
  return angle - 2 * Math.PI * roundTurn;
}
var VEC3_POSITIVE_Z = new THREE13.Vector3(0, 0, 1);
var _v3A5 = new THREE13.Vector3();
var _v3B3 = new THREE13.Vector3();
var _v3C = new THREE13.Vector3();
var _quatA5 = new THREE13.Quaternion();
var _quatB2 = new THREE13.Quaternion();
var _quatC = new THREE13.Quaternion();
var _quatD = new THREE13.Quaternion();
var _eulerA = new THREE13.Euler();
var _VRMLookAt = class _VRMLookAt2 {
  /**
   * Create a new {@link VRMLookAt}.
   *
   * @param humanoid A {@link VRMHumanoid}
   * @param applier A {@link VRMLookAtApplier}
   */
  constructor(humanoid, applier) {
    this.offsetFromHeadBone = new THREE13.Vector3();
    this.autoUpdate = true;
    this.faceFront = new THREE13.Vector3(0, 0, 1);
    this.humanoid = humanoid;
    this.applier = applier;
    this._yaw = 0;
    this._pitch = 0;
    this._needsUpdate = true;
    this._restHeadWorldQuaternion = this.getLookAtWorldQuaternion(new THREE13.Quaternion());
  }
  /**
   * Its current angle around Y axis, in degree.
   */
  get yaw() {
    return this._yaw;
  }
  /**
   * Its current angle around Y axis, in degree.
   */
  set yaw(value) {
    this._yaw = value;
    this._needsUpdate = true;
  }
  /**
   * Its current angle around X axis, in degree.
   */
  get pitch() {
    return this._pitch;
  }
  /**
   * Its current angle around X axis, in degree.
   */
  set pitch(value) {
    this._pitch = value;
    this._needsUpdate = true;
  }
  /**
   * @deprecated Use {@link getEuler} instead.
   */
  get euler() {
    console.warn("VRMLookAt: euler is deprecated. use getEuler() instead.");
    return this.getEuler(new THREE13.Euler());
  }
  /**
   * Get its yaw-pitch angles as an `Euler`.
   * Does NOT consider {@link faceFront}; it returns `Euler(0, 0, 0; "YXZ")` by default regardless of the faceFront value.
   *
   * @param target The target euler
   */
  getEuler(target) {
    return target.set(THREE13.MathUtils.DEG2RAD * this._pitch, THREE13.MathUtils.DEG2RAD * this._yaw, 0, "YXZ");
  }
  /**
   * Copy the given {@link VRMLookAt} into this one.
   * {@link humanoid} must be same as the source one.
   * {@link applier} will reference the same instance as the source one.
   * @param source The {@link VRMLookAt} you want to copy
   * @returns this
   */
  copy(source) {
    if (this.humanoid !== source.humanoid) {
      throw new Error("VRMLookAt: humanoid must be same in order to copy");
    }
    this.offsetFromHeadBone.copy(source.offsetFromHeadBone);
    this.applier = source.applier;
    this.autoUpdate = source.autoUpdate;
    this.target = source.target;
    this.faceFront.copy(source.faceFront);
    return this;
  }
  /**
   * Returns a clone of this {@link VRMLookAt}.
   * Note that {@link humanoid} and {@link applier} will reference the same instance as this one.
   * @returns Copied {@link VRMLookAt}
   */
  clone() {
    return new _VRMLookAt2(this.humanoid, this.applier).copy(this);
  }
  /**
   * Reset the lookAt direction (yaw and pitch) to the initial direction.
   */
  reset() {
    this._yaw = 0;
    this._pitch = 0;
    this._needsUpdate = true;
  }
  /**
   * Get its lookAt position in world coordinate.
   *
   * @param target A target `THREE.Vector3`
   */
  getLookAtWorldPosition(target) {
    const head = this.humanoid.getRawBoneNode("head");
    return target.copy(this.offsetFromHeadBone).applyMatrix4(head.matrixWorld);
  }
  /**
   * Get its lookAt rotation in world coordinate.
   * Does NOT consider {@link faceFront}.
   *
   * @param target A target `THREE.Quaternion`
   */
  getLookAtWorldQuaternion(target) {
    const head = this.humanoid.getRawBoneNode("head");
    return getWorldQuaternionLite(head, target);
  }
  /**
   * Get a quaternion that rotates the +Z unit vector of the humanoid Head to the {@link faceFront} direction.
   *
   * @param target A target `THREE.Quaternion`
   */
  getFaceFrontQuaternion(target) {
    if (this.faceFront.distanceToSquared(VEC3_POSITIVE_Z) < 0.01) {
      return target.copy(this._restHeadWorldQuaternion).invert();
    }
    const [faceFrontAzimuth, faceFrontAltitude] = calcAzimuthAltitude(this.faceFront);
    _eulerA.set(0, 0.5 * Math.PI + faceFrontAzimuth, faceFrontAltitude, "YZX");
    return target.setFromEuler(_eulerA).premultiply(_quatD.copy(this._restHeadWorldQuaternion).invert());
  }
  /**
   * Get its LookAt direction in world coordinate.
   *
   * @param target A target `THREE.Vector3`
   */
  getLookAtWorldDirection(target) {
    this.getLookAtWorldQuaternion(_quatB2);
    this.getFaceFrontQuaternion(_quatC);
    return target.copy(VEC3_POSITIVE_Z).applyQuaternion(_quatB2).applyQuaternion(_quatC).applyEuler(this.getEuler(_eulerA));
  }
  /**
   * Set its lookAt target position.
   *
   * Note that its result will be instantly overwritten if {@link VRMLookAtHead.autoUpdate} is enabled.
   *
   * If you want to track an object continuously, you might want to use {@link target} instead.
   *
   * @param position A target position, in world space
   */
  lookAt(position) {
    const headRotDiffInv = _quatA5.copy(this._restHeadWorldQuaternion).multiply(quatInvertCompat(this.getLookAtWorldQuaternion(_quatB2)));
    const headPos = this.getLookAtWorldPosition(_v3B3);
    const lookAtDir = _v3C.copy(position).sub(headPos).applyQuaternion(headRotDiffInv).normalize();
    const [azimuthFrom, altitudeFrom] = calcAzimuthAltitude(this.faceFront);
    const [azimuthTo, altitudeTo] = calcAzimuthAltitude(lookAtDir);
    const yaw = sanitizeAngle(azimuthTo - azimuthFrom);
    const pitch = sanitizeAngle(altitudeFrom - altitudeTo);
    this._yaw = THREE13.MathUtils.RAD2DEG * yaw;
    this._pitch = THREE13.MathUtils.RAD2DEG * pitch;
    this._needsUpdate = true;
  }
  /**
   * Update the VRMLookAtHead.
   * If {@link autoUpdate} is enabled, this will make it look at the {@link target}.
   *
   * @param delta deltaTime, it isn't used though. You can use the parameter if you want to use this in your own extended {@link VRMLookAt}.
   */
  update(delta) {
    if (this.target != null && this.autoUpdate) {
      this.lookAt(this.target.getWorldPosition(_v3A5));
    }
    if (this._needsUpdate) {
      this._needsUpdate = false;
      this.applier.applyYawPitch(this._yaw, this._pitch);
    }
  }
};
_VRMLookAt.EULER_ORDER = "YXZ";
var VRMLookAt = _VRMLookAt;
var VEC3_POSITIVE_Z2 = new THREE14.Vector3(0, 0, 1);
var _quatA6 = new THREE14.Quaternion();
var _quatB3 = new THREE14.Quaternion();
var _eulerA2 = new THREE14.Euler(0, 0, 0, "YXZ");
var VRMLookAtBoneApplier = class {
  /**
   * Create a new {@link VRMLookAtBoneApplier}.
   *
   * @param humanoid A {@link VRMHumanoid}
   * @param rangeMapHorizontalInner A {@link VRMLookAtRangeMap} used for inner transverse direction
   * @param rangeMapHorizontalOuter A {@link VRMLookAtRangeMap} used for outer transverse direction
   * @param rangeMapVerticalDown A {@link VRMLookAtRangeMap} used for down direction
   * @param rangeMapVerticalUp A {@link VRMLookAtRangeMap} used for up direction
   */
  constructor(humanoid, rangeMapHorizontalInner, rangeMapHorizontalOuter, rangeMapVerticalDown, rangeMapVerticalUp) {
    this.humanoid = humanoid;
    this.rangeMapHorizontalInner = rangeMapHorizontalInner;
    this.rangeMapHorizontalOuter = rangeMapHorizontalOuter;
    this.rangeMapVerticalDown = rangeMapVerticalDown;
    this.rangeMapVerticalUp = rangeMapVerticalUp;
    this.faceFront = new THREE14.Vector3(0, 0, 1);
    this._restQuatLeftEye = new THREE14.Quaternion();
    this._restQuatRightEye = new THREE14.Quaternion();
    this._restLeftEyeParentWorldQuat = new THREE14.Quaternion();
    this._restRightEyeParentWorldQuat = new THREE14.Quaternion();
    const leftEye = this.humanoid.getRawBoneNode("leftEye");
    const rightEye = this.humanoid.getRawBoneNode("rightEye");
    if (leftEye) {
      this._restQuatLeftEye.copy(leftEye.quaternion);
      getWorldQuaternionLite(leftEye.parent, this._restLeftEyeParentWorldQuat);
    }
    if (rightEye) {
      this._restQuatRightEye.copy(rightEye.quaternion);
      getWorldQuaternionLite(rightEye.parent, this._restRightEyeParentWorldQuat);
    }
  }
  /**
   * Apply the input angle to its associated VRM model.
   *
   * @param yaw Rotation around Y axis, in degree
   * @param pitch Rotation around X axis, in degree
   */
  applyYawPitch(yaw, pitch) {
    const leftEye = this.humanoid.getRawBoneNode("leftEye");
    const rightEye = this.humanoid.getRawBoneNode("rightEye");
    const leftEyeNormalized = this.humanoid.getNormalizedBoneNode("leftEye");
    const rightEyeNormalized = this.humanoid.getNormalizedBoneNode("rightEye");
    if (leftEye) {
      if (pitch < 0) {
        _eulerA2.x = -THREE14.MathUtils.DEG2RAD * this.rangeMapVerticalDown.map(-pitch);
      } else {
        _eulerA2.x = THREE14.MathUtils.DEG2RAD * this.rangeMapVerticalUp.map(pitch);
      }
      if (yaw < 0) {
        _eulerA2.y = -THREE14.MathUtils.DEG2RAD * this.rangeMapHorizontalInner.map(-yaw);
      } else {
        _eulerA2.y = THREE14.MathUtils.DEG2RAD * this.rangeMapHorizontalOuter.map(yaw);
      }
      _quatA6.setFromEuler(_eulerA2);
      this._getWorldFaceFrontQuat(_quatB3);
      leftEyeNormalized.quaternion.copy(_quatB3).multiply(_quatA6).multiply(_quatB3.invert());
      _quatA6.copy(this._restLeftEyeParentWorldQuat);
      leftEye.quaternion.copy(leftEyeNormalized.quaternion).multiply(_quatA6).premultiply(_quatA6.invert()).multiply(this._restQuatLeftEye);
    }
    if (rightEye) {
      if (pitch < 0) {
        _eulerA2.x = -THREE14.MathUtils.DEG2RAD * this.rangeMapVerticalDown.map(-pitch);
      } else {
        _eulerA2.x = THREE14.MathUtils.DEG2RAD * this.rangeMapVerticalUp.map(pitch);
      }
      if (yaw < 0) {
        _eulerA2.y = -THREE14.MathUtils.DEG2RAD * this.rangeMapHorizontalOuter.map(-yaw);
      } else {
        _eulerA2.y = THREE14.MathUtils.DEG2RAD * this.rangeMapHorizontalInner.map(yaw);
      }
      _quatA6.setFromEuler(_eulerA2);
      this._getWorldFaceFrontQuat(_quatB3);
      rightEyeNormalized.quaternion.copy(_quatB3).multiply(_quatA6).multiply(_quatB3.invert());
      _quatA6.copy(this._restRightEyeParentWorldQuat);
      rightEye.quaternion.copy(rightEyeNormalized.quaternion).multiply(_quatA6).premultiply(_quatA6.invert()).multiply(this._restQuatRightEye);
    }
  }
  /**
   * @deprecated Use {@link applyYawPitch} instead.
   */
  lookAt(euler) {
    console.warn("VRMLookAtBoneApplier: lookAt() is deprecated. use apply() instead.");
    const yaw = THREE14.MathUtils.RAD2DEG * euler.y;
    const pitch = THREE14.MathUtils.RAD2DEG * euler.x;
    this.applyYawPitch(yaw, pitch);
  }
  /**
   * Get a quaternion that rotates the world-space +Z unit vector to the {@link faceFront} direction.
   *
   * @param target A target `THREE.Quaternion`
   */
  _getWorldFaceFrontQuat(target) {
    if (this.faceFront.distanceToSquared(VEC3_POSITIVE_Z2) < 0.01) {
      return target.identity();
    }
    const [faceFrontAzimuth, faceFrontAltitude] = calcAzimuthAltitude(this.faceFront);
    _eulerA2.set(0, 0.5 * Math.PI + faceFrontAzimuth, faceFrontAltitude, "YZX");
    return target.setFromEuler(_eulerA2);
  }
};
VRMLookAtBoneApplier.type = "bone";
var VRMLookAtExpressionApplier = class {
  /**
   * Create a new {@link VRMLookAtExpressionApplier}.
   *
   * @param expressions A {@link VRMExpressionManager}
   * @param rangeMapHorizontalInner A {@link VRMLookAtRangeMap} used for inner transverse direction
   * @param rangeMapHorizontalOuter A {@link VRMLookAtRangeMap} used for outer transverse direction
   * @param rangeMapVerticalDown A {@link VRMLookAtRangeMap} used for down direction
   * @param rangeMapVerticalUp A {@link VRMLookAtRangeMap} used for up direction
   */
  constructor(expressions, rangeMapHorizontalInner, rangeMapHorizontalOuter, rangeMapVerticalDown, rangeMapVerticalUp) {
    this.expressions = expressions;
    this.rangeMapHorizontalInner = rangeMapHorizontalInner;
    this.rangeMapHorizontalOuter = rangeMapHorizontalOuter;
    this.rangeMapVerticalDown = rangeMapVerticalDown;
    this.rangeMapVerticalUp = rangeMapVerticalUp;
  }
  /**
   * Apply the input angle to its associated VRM model.
   *
   * @param yaw Rotation around Y axis, in degree
   * @param pitch Rotation around X axis, in degree
   */
  applyYawPitch(yaw, pitch) {
    if (pitch < 0) {
      this.expressions.setValue("lookDown", 0);
      this.expressions.setValue("lookUp", this.rangeMapVerticalUp.map(-pitch));
    } else {
      this.expressions.setValue("lookUp", 0);
      this.expressions.setValue("lookDown", this.rangeMapVerticalDown.map(pitch));
    }
    if (yaw < 0) {
      this.expressions.setValue("lookLeft", 0);
      this.expressions.setValue("lookRight", this.rangeMapHorizontalOuter.map(-yaw));
    } else {
      this.expressions.setValue("lookRight", 0);
      this.expressions.setValue("lookLeft", this.rangeMapHorizontalOuter.map(yaw));
    }
  }
  /**
   * @deprecated Use {@link applyYawPitch} instead.
   */
  lookAt(euler) {
    console.warn("VRMLookAtBoneApplier: lookAt() is deprecated. use apply() instead.");
    const yaw = THREE15.MathUtils.RAD2DEG * euler.y;
    const pitch = THREE15.MathUtils.RAD2DEG * euler.x;
    this.applyYawPitch(yaw, pitch);
  }
};
VRMLookAtExpressionApplier.type = "expression";
var VRMLookAtRangeMap = class {
  /**
   * Create a new {@link VRMLookAtRangeMap}.
   *
   * @param inputMaxValue The {@link inputMaxValue} of the map
   * @param outputScale The {@link outputScale} of the map
   */
  constructor(inputMaxValue, outputScale) {
    this.inputMaxValue = inputMaxValue;
    this.outputScale = outputScale;
  }
  /**
   * Evaluate an input value and output a mapped value.
   * @param src The input value
   */
  map(src) {
    return this.outputScale * saturate(src / this.inputMaxValue);
  }
};
var POSSIBLE_SPEC_VERSIONS4 = /* @__PURE__ */ new Set(["1.0", "1.0-beta"]);
var INPUT_MAX_VALUE_MINIMUM = 0.01;
var VRMLookAtLoaderPlugin = class {
  get name() {
    return "VRMLookAtLoaderPlugin";
  }
  constructor(parser, options) {
    this.parser = parser;
    this.helperRoot = options == null ? void 0 : options.helperRoot;
  }
  afterRoot(gltf) {
    return __async2(this, null, function* () {
      const vrmHumanoid = gltf.userData.vrmHumanoid;
      if (vrmHumanoid === null) {
        return;
      } else if (vrmHumanoid === void 0) {
        throw new Error("VRMLookAtLoaderPlugin: vrmHumanoid is undefined. VRMHumanoidLoaderPlugin have to be used first");
      }
      const vrmExpressionManager = gltf.userData.vrmExpressionManager;
      if (vrmExpressionManager === null) {
        return;
      } else if (vrmExpressionManager === void 0) {
        throw new Error(
          "VRMLookAtLoaderPlugin: vrmExpressionManager is undefined. VRMExpressionLoaderPlugin have to be used first"
        );
      }
      gltf.userData.vrmLookAt = yield this._import(gltf, vrmHumanoid, vrmExpressionManager);
    });
  }
  /**
   * Import a {@link VRMLookAt} from a VRM.
   *
   * @param gltf A parsed result of GLTF taken from GLTFLoader
   * @param humanoid A {@link VRMHumanoid} instance that represents the VRM
   * @param expressions A {@link VRMExpressionManager} instance that represents the VRM
   */
  _import(gltf, humanoid, expressions) {
    return __async2(this, null, function* () {
      if (humanoid == null || expressions == null) {
        return null;
      }
      const v1Result = yield this._v1Import(gltf, humanoid, expressions);
      if (v1Result) {
        return v1Result;
      }
      const v0Result = yield this._v0Import(gltf, humanoid, expressions);
      if (v0Result) {
        return v0Result;
      }
      return null;
    });
  }
  _v1Import(gltf, humanoid, expressions) {
    return __async2(this, null, function* () {
      var _a, _b, _c;
      const json = this.parser.json;
      const isVRMUsed = ((_a = json.extensionsUsed) == null ? void 0 : _a.indexOf("VRMC_vrm")) !== -1;
      if (!isVRMUsed) {
        return null;
      }
      const extension = (_b = json.extensions) == null ? void 0 : _b["VRMC_vrm"];
      if (!extension) {
        return null;
      }
      const specVersion = extension.specVersion;
      if (!POSSIBLE_SPEC_VERSIONS4.has(specVersion)) {
        console.warn(`VRMLookAtLoaderPlugin: Unknown VRMC_vrm specVersion "${specVersion}"`);
        return null;
      }
      const schemaLookAt = extension.lookAt;
      if (!schemaLookAt) {
        return null;
      }
      const defaultOutputScale = schemaLookAt.type === "expression" ? 1 : 10;
      const mapHI = this._v1ImportRangeMap(schemaLookAt.rangeMapHorizontalInner, defaultOutputScale);
      const mapHO = this._v1ImportRangeMap(schemaLookAt.rangeMapHorizontalOuter, defaultOutputScale);
      const mapVD = this._v1ImportRangeMap(schemaLookAt.rangeMapVerticalDown, defaultOutputScale);
      const mapVU = this._v1ImportRangeMap(schemaLookAt.rangeMapVerticalUp, defaultOutputScale);
      let applier;
      if (schemaLookAt.type === "expression") {
        applier = new VRMLookAtExpressionApplier(expressions, mapHI, mapHO, mapVD, mapVU);
      } else {
        applier = new VRMLookAtBoneApplier(humanoid, mapHI, mapHO, mapVD, mapVU);
      }
      const lookAt = this._importLookAt(humanoid, applier);
      lookAt.offsetFromHeadBone.fromArray((_c = schemaLookAt.offsetFromHeadBone) != null ? _c : [0, 0.06, 0]);
      return lookAt;
    });
  }
  _v1ImportRangeMap(schemaRangeMap, defaultOutputScale) {
    var _a, _b;
    let inputMaxValue = (_a = schemaRangeMap == null ? void 0 : schemaRangeMap.inputMaxValue) != null ? _a : 90;
    const outputScale = (_b = schemaRangeMap == null ? void 0 : schemaRangeMap.outputScale) != null ? _b : defaultOutputScale;
    if (inputMaxValue < INPUT_MAX_VALUE_MINIMUM) {
      console.warn(
        "VRMLookAtLoaderPlugin: inputMaxValue of a range map is too small. Consider reviewing the range map!"
      );
      inputMaxValue = INPUT_MAX_VALUE_MINIMUM;
    }
    return new VRMLookAtRangeMap(inputMaxValue, outputScale);
  }
  _v0Import(gltf, humanoid, expressions) {
    return __async2(this, null, function* () {
      var _a, _b, _c, _d;
      const json = this.parser.json;
      const vrmExt = (_a = json.extensions) == null ? void 0 : _a.VRM;
      if (!vrmExt) {
        return null;
      }
      const schemaFirstPerson = vrmExt.firstPerson;
      if (!schemaFirstPerson) {
        return null;
      }
      const defaultOutputScale = schemaFirstPerson.lookAtTypeName === "BlendShape" ? 1 : 10;
      const mapHI = this._v0ImportDegreeMap(schemaFirstPerson.lookAtHorizontalInner, defaultOutputScale);
      const mapHO = this._v0ImportDegreeMap(schemaFirstPerson.lookAtHorizontalOuter, defaultOutputScale);
      const mapVD = this._v0ImportDegreeMap(schemaFirstPerson.lookAtVerticalDown, defaultOutputScale);
      const mapVU = this._v0ImportDegreeMap(schemaFirstPerson.lookAtVerticalUp, defaultOutputScale);
      let applier;
      if (schemaFirstPerson.lookAtTypeName === "BlendShape") {
        applier = new VRMLookAtExpressionApplier(expressions, mapHI, mapHO, mapVD, mapVU);
      } else {
        applier = new VRMLookAtBoneApplier(humanoid, mapHI, mapHO, mapVD, mapVU);
      }
      const lookAt = this._importLookAt(humanoid, applier);
      if (schemaFirstPerson.firstPersonBoneOffset) {
        lookAt.offsetFromHeadBone.set(
          (_b = schemaFirstPerson.firstPersonBoneOffset.x) != null ? _b : 0,
          (_c = schemaFirstPerson.firstPersonBoneOffset.y) != null ? _c : 0.06,
          -((_d = schemaFirstPerson.firstPersonBoneOffset.z) != null ? _d : 0)
        );
      } else {
        lookAt.offsetFromHeadBone.set(0, 0.06, 0);
      }
      lookAt.faceFront.set(0, 0, -1);
      if (applier instanceof VRMLookAtBoneApplier) {
        applier.faceFront.set(0, 0, -1);
      }
      return lookAt;
    });
  }
  _v0ImportDegreeMap(schemaDegreeMap, defaultOutputScale) {
    var _a, _b;
    const curve = schemaDegreeMap == null ? void 0 : schemaDegreeMap.curve;
    if (JSON.stringify(curve) !== "[0,0,0,1,1,1,1,0]") {
      console.warn("Curves of LookAtDegreeMap defined in VRM 0.0 are not supported");
    }
    let xRange = (_a = schemaDegreeMap == null ? void 0 : schemaDegreeMap.xRange) != null ? _a : 90;
    const yRange = (_b = schemaDegreeMap == null ? void 0 : schemaDegreeMap.yRange) != null ? _b : defaultOutputScale;
    if (xRange < INPUT_MAX_VALUE_MINIMUM) {
      console.warn("VRMLookAtLoaderPlugin: xRange of a degree map is too small. Consider reviewing the degree map!");
      xRange = INPUT_MAX_VALUE_MINIMUM;
    }
    return new VRMLookAtRangeMap(xRange, yRange);
  }
  _importLookAt(humanoid, applier) {
    const lookAt = new VRMLookAt(humanoid, applier);
    if (this.helperRoot) {
      const helper = new VRMLookAtHelper(lookAt);
      this.helperRoot.add(helper);
      helper.renderOrder = this.helperRoot.renderOrder;
    }
    return lookAt;
  }
};
var VRMLookAtTypeName = {
  Bone: "bone",
  Expression: "expression"
};
function resolveURL(url, path) {
  if (typeof url !== "string" || url === "") return "";
  if (/^https?:\/\//i.test(path) && /^\//.test(url)) {
    path = path.replace(/(^https?:\/\/[^/]+).*/i, "$1");
  }
  if (/^(https?:)?\/\//i.test(url)) return url;
  if (/^data:.*,.*$/i.test(url)) return url;
  if (/^blob:.*$/i.test(url)) return url;
  return path + url;
}
var POSSIBLE_SPEC_VERSIONS5 = /* @__PURE__ */ new Set(["1.0", "1.0-beta"]);
var VRMMetaLoaderPlugin = class {
  get name() {
    return "VRMMetaLoaderPlugin";
  }
  constructor(parser, options) {
    var _a, _b, _c;
    this.parser = parser;
    this.needThumbnailImage = (_a = options == null ? void 0 : options.needThumbnailImage) != null ? _a : false;
    this.acceptLicenseUrls = (_b = options == null ? void 0 : options.acceptLicenseUrls) != null ? _b : ["https://vrm.dev/licenses/1.0/"];
    this.acceptV0Meta = (_c = options == null ? void 0 : options.acceptV0Meta) != null ? _c : true;
  }
  afterRoot(gltf) {
    return __async2(this, null, function* () {
      gltf.userData.vrmMeta = yield this._import(gltf);
    });
  }
  _import(gltf) {
    return __async2(this, null, function* () {
      const v1Result = yield this._v1Import(gltf);
      if (v1Result != null) {
        return v1Result;
      }
      const v0Result = yield this._v0Import(gltf);
      if (v0Result != null) {
        return v0Result;
      }
      return null;
    });
  }
  _v1Import(gltf) {
    return __async2(this, null, function* () {
      var _a, _b, _c;
      const json = this.parser.json;
      const isVRMUsed = ((_a = json.extensionsUsed) == null ? void 0 : _a.indexOf("VRMC_vrm")) !== -1;
      if (!isVRMUsed) {
        return null;
      }
      const extension = (_b = json.extensions) == null ? void 0 : _b["VRMC_vrm"];
      if (extension == null) {
        return null;
      }
      const specVersion = extension.specVersion;
      if (!POSSIBLE_SPEC_VERSIONS5.has(specVersion)) {
        console.warn(`VRMMetaLoaderPlugin: Unknown VRMC_vrm specVersion "${specVersion}"`);
        return null;
      }
      const schemaMeta = extension.meta;
      if (!schemaMeta) {
        return null;
      }
      const licenseUrl = schemaMeta.licenseUrl;
      const acceptLicenseUrlsSet = new Set(this.acceptLicenseUrls);
      if (!acceptLicenseUrlsSet.has(licenseUrl)) {
        throw new Error(`VRMMetaLoaderPlugin: The license url "${licenseUrl}" is not accepted`);
      }
      let thumbnailImage = void 0;
      if (this.needThumbnailImage && schemaMeta.thumbnailImage != null) {
        thumbnailImage = (_c = yield this._extractGLTFImage(schemaMeta.thumbnailImage)) != null ? _c : void 0;
      }
      return {
        metaVersion: "1",
        name: schemaMeta.name,
        version: schemaMeta.version,
        authors: schemaMeta.authors,
        copyrightInformation: schemaMeta.copyrightInformation,
        contactInformation: schemaMeta.contactInformation,
        references: schemaMeta.references,
        thirdPartyLicenses: schemaMeta.thirdPartyLicenses,
        thumbnailImage,
        licenseUrl: schemaMeta.licenseUrl,
        avatarPermission: schemaMeta.avatarPermission,
        allowExcessivelyViolentUsage: schemaMeta.allowExcessivelyViolentUsage,
        allowExcessivelySexualUsage: schemaMeta.allowExcessivelySexualUsage,
        commercialUsage: schemaMeta.commercialUsage,
        allowPoliticalOrReligiousUsage: schemaMeta.allowPoliticalOrReligiousUsage,
        allowAntisocialOrHateUsage: schemaMeta.allowAntisocialOrHateUsage,
        creditNotation: schemaMeta.creditNotation,
        allowRedistribution: schemaMeta.allowRedistribution,
        modification: schemaMeta.modification,
        otherLicenseUrl: schemaMeta.otherLicenseUrl
      };
    });
  }
  _v0Import(gltf) {
    return __async2(this, null, function* () {
      var _a;
      const json = this.parser.json;
      const vrmExt = (_a = json.extensions) == null ? void 0 : _a.VRM;
      if (!vrmExt) {
        return null;
      }
      const schemaMeta = vrmExt.meta;
      if (!schemaMeta) {
        return null;
      }
      if (!this.acceptV0Meta) {
        throw new Error("VRMMetaLoaderPlugin: Attempted to load VRM0.0 meta but acceptV0Meta is false");
      }
      let texture;
      if (this.needThumbnailImage && schemaMeta.texture != null && schemaMeta.texture !== -1) {
        texture = yield this.parser.getDependency("texture", schemaMeta.texture);
      }
      return {
        metaVersion: "0",
        allowedUserName: schemaMeta.allowedUserName,
        author: schemaMeta.author,
        commercialUssageName: schemaMeta.commercialUssageName,
        contactInformation: schemaMeta.contactInformation,
        licenseName: schemaMeta.licenseName,
        otherLicenseUrl: schemaMeta.otherLicenseUrl,
        otherPermissionUrl: schemaMeta.otherPermissionUrl,
        reference: schemaMeta.reference,
        sexualUssageName: schemaMeta.sexualUssageName,
        texture: texture != null ? texture : void 0,
        title: schemaMeta.title,
        version: schemaMeta.version,
        violentUssageName: schemaMeta.violentUssageName
      };
    });
  }
  _extractGLTFImage(index) {
    return __async2(this, null, function* () {
      var _a;
      const json = this.parser.json;
      const source = (_a = json.images) == null ? void 0 : _a[index];
      if (source == null) {
        console.warn(
          `VRMMetaLoaderPlugin: Attempt to use images[${index}] of glTF as a thumbnail but the image doesn't exist`
        );
        return null;
      }
      let sourceURI = source.uri;
      if (source.bufferView != null) {
        const bufferView = yield this.parser.getDependency("bufferView", source.bufferView);
        const blob = new Blob([bufferView], { type: source.mimeType });
        sourceURI = URL.createObjectURL(blob);
      }
      if (sourceURI == null) {
        console.warn(
          `VRMMetaLoaderPlugin: Attempt to use images[${index}] of glTF as a thumbnail but the image couldn't load properly`
        );
        return null;
      }
      const loader = new THREE16.ImageLoader();
      return yield loader.loadAsync(resolveURL(sourceURI, this.parser.options.path)).catch((error) => {
        console.error(error);
        console.warn("VRMMetaLoaderPlugin: Failed to load a thumbnail image");
        return null;
      });
    });
  }
};
var VRMCore = class {
  /**
   * Create a new VRM instance.
   *
   * @param params [[VRMParameters]] that represents components of the VRM
   */
  constructor(params) {
    this.scene = params.scene;
    this.meta = params.meta;
    this.humanoid = params.humanoid;
    this.expressionManager = params.expressionManager;
    this.firstPerson = params.firstPerson;
    this.lookAt = params.lookAt;
  }
  /**
   * **You need to call this on your update loop.**
   *
   * This function updates every VRM components.
   *
   * @param delta deltaTime
   */
  update(delta) {
    this.humanoid.update();
    if (this.lookAt) {
      this.lookAt.update(delta);
    }
    if (this.expressionManager) {
      this.expressionManager.update();
    }
  }
};
var VRMCoreLoaderPlugin = class {
  get name() {
    return "VRMC_vrm";
  }
  constructor(parser, options) {
    var _a, _b, _c, _d, _e;
    this.parser = parser;
    const helperRoot = options == null ? void 0 : options.helperRoot;
    const autoUpdateHumanBones = options == null ? void 0 : options.autoUpdateHumanBones;
    this.expressionPlugin = (_a = options == null ? void 0 : options.expressionPlugin) != null ? _a : new VRMExpressionLoaderPlugin(parser);
    this.firstPersonPlugin = (_b = options == null ? void 0 : options.firstPersonPlugin) != null ? _b : new VRMFirstPersonLoaderPlugin(parser);
    this.humanoidPlugin = (_c = options == null ? void 0 : options.humanoidPlugin) != null ? _c : new VRMHumanoidLoaderPlugin(parser, { helperRoot, autoUpdateHumanBones });
    this.lookAtPlugin = (_d = options == null ? void 0 : options.lookAtPlugin) != null ? _d : new VRMLookAtLoaderPlugin(parser, { helperRoot });
    this.metaPlugin = (_e = options == null ? void 0 : options.metaPlugin) != null ? _e : new VRMMetaLoaderPlugin(parser);
  }
  afterRoot(gltf) {
    return __async2(this, null, function* () {
      yield this.metaPlugin.afterRoot(gltf);
      yield this.humanoidPlugin.afterRoot(gltf);
      yield this.expressionPlugin.afterRoot(gltf);
      yield this.lookAtPlugin.afterRoot(gltf);
      yield this.firstPersonPlugin.afterRoot(gltf);
      const meta = gltf.userData.vrmMeta;
      const humanoid = gltf.userData.vrmHumanoid;
      if (meta && humanoid) {
        const vrmCore = new VRMCore({
          scene: gltf.scene,
          expressionManager: gltf.userData.vrmExpressionManager,
          firstPerson: gltf.userData.vrmFirstPerson,
          humanoid,
          lookAt: gltf.userData.vrmLookAt,
          meta
        });
        gltf.userData.vrmCore = vrmCore;
      }
    });
  }
};

// src/VRM.ts
var VRM = class extends VRMCore {
  /**
   * Create a new VRM instance.
   *
   * @param params [[VRMParameters]] that represents components of the VRM
   */
  constructor(params) {
    super(params);
    this.materials = params.materials;
    this.springBoneManager = params.springBoneManager;
    this.nodeConstraintManager = params.nodeConstraintManager;
  }
  /**
   * **You need to call this on your update loop.**
   *
   * This function updates every VRM components.
   *
   * @param delta deltaTime
   */
  update(delta) {
    super.update(delta);
    if (this.nodeConstraintManager) {
      this.nodeConstraintManager.update();
    }
    if (this.springBoneManager) {
      this.springBoneManager.update(delta);
    }
    if (this.materials) {
      this.materials.forEach((material) => {
        if (material.update) {
          material.update(delta);
        }
      });
    }
  }
};

// ../three-vrm-materials-mtoon/lib/three-vrm-materials-mtoon.module.js
var THREE52 = __toESM(require("three"), 1);
var THREE22 = __toESM(require("three"), 1);
var THREE17 = __toESM(require("three"), 1);
var THREE42 = __toESM(require("three"), 1);
var THREE32 = __toESM(require("three"), 1);
var __defProp2 = Object.defineProperty;
var __getOwnPropSymbols = Object.getOwnPropertySymbols;
var __hasOwnProp2 = Object.prototype.hasOwnProperty;
var __propIsEnum = Object.prototype.propertyIsEnumerable;
var __defNormalProp = (obj, key, value) => key in obj ? __defProp2(obj, key, { enumerable: true, configurable: true, writable: true, value }) : obj[key] = value;
var __spreadValues = (a, b) => {
  for (var prop in b || (b = {}))
    if (__hasOwnProp2.call(b, prop))
      __defNormalProp(a, prop, b[prop]);
  if (__getOwnPropSymbols)
    for (var prop of __getOwnPropSymbols(b)) {
      if (__propIsEnum.call(b, prop))
        __defNormalProp(a, prop, b[prop]);
    }
  return a;
};
var __async3 = (__this, __arguments, generator) => {
  return new Promise((resolve, reject) => {
    var fulfilled = (value) => {
      try {
        step(generator.next(value));
      } catch (e) {
        reject(e);
      }
    };
    var rejected = (value) => {
      try {
        step(generator.throw(value));
      } catch (e) {
        reject(e);
      }
    };
    var step = (x) => x.done ? resolve(x.value) : Promise.resolve(x.value).then(fulfilled, rejected);
    step((generator = generator.apply(__this, __arguments)).next());
  });
};
var colorSpaceEncodingMap = {
  // eslint-disable-next-line @typescript-eslint/naming-convention
  "": 3e3,
  srgb: 3001
};
function setTextureColorSpace(texture, colorSpace) {
  if (parseInt(THREE17.REVISION, 10) >= 152) {
    texture.colorSpace = colorSpace;
  } else {
    texture.encoding = colorSpaceEncodingMap[colorSpace];
  }
}
var GLTFMToonMaterialParamsAssignHelper = class {
  get pending() {
    return Promise.all(this._pendings);
  }
  constructor(parser, materialParams) {
    this._parser = parser;
    this._materialParams = materialParams;
    this._pendings = [];
  }
  assignPrimitive(key, value) {
    if (value != null) {
      this._materialParams[key] = value;
    }
  }
  assignColor(key, value, convertSRGBToLinear) {
    if (value != null) {
      this._materialParams[key] = new THREE22.Color().fromArray(value);
      if (convertSRGBToLinear) {
        this._materialParams[key].convertSRGBToLinear();
      }
    }
  }
  assignTexture(key, texture, isColorTexture) {
    return __async3(this, null, function* () {
      const promise = (() => __async3(this, null, function* () {
        if (texture != null) {
          yield this._parser.assignTexture(this._materialParams, key, texture);
          if (isColorTexture) {
            setTextureColorSpace(this._materialParams[key], "srgb");
          }
        }
      }))();
      this._pendings.push(promise);
      return promise;
    });
  }
  assignTextureByIndex(key, textureIndex, isColorTexture) {
    return __async3(this, null, function* () {
      return this.assignTexture(key, textureIndex != null ? { index: textureIndex } : void 0, isColorTexture);
    });
  }
};
var mtoon_default = "// #define PHONG\n\nvarying vec3 vViewPosition;\n\n#ifndef FLAT_SHADED\n  varying vec3 vNormal;\n#endif\n\n#include <common>\n\n// #include <uv_pars_vertex>\n#ifdef MTOON_USE_UV\n  varying vec2 vUv;\n\n  // COMPAT: pre-r151 uses a common uvTransform\n  #if THREE_VRM_THREE_REVISION < 151\n    uniform mat3 uvTransform;\n  #endif\n#endif\n\n// #include <uv2_pars_vertex>\n// COMAPT: pre-r151 uses uv2 for lightMap and aoMap\n#if THREE_VRM_THREE_REVISION < 151\n  #if defined( USE_LIGHTMAP ) || defined( USE_AOMAP )\n    attribute vec2 uv2;\n    varying vec2 vUv2;\n    uniform mat3 uv2Transform;\n  #endif\n#endif\n\n// #include <displacementmap_pars_vertex>\n// #include <envmap_pars_vertex>\n#include <color_pars_vertex>\n#include <fog_pars_vertex>\n#include <morphtarget_pars_vertex>\n#include <skinning_pars_vertex>\n#include <shadowmap_pars_vertex>\n#include <logdepthbuf_pars_vertex>\n#include <clipping_planes_pars_vertex>\n\n#ifdef USE_OUTLINEWIDTHMULTIPLYTEXTURE\n  uniform sampler2D outlineWidthMultiplyTexture;\n  uniform mat3 outlineWidthMultiplyTextureUvTransform;\n#endif\n\nuniform float outlineWidthFactor;\n\nvoid main() {\n\n  // #include <uv_vertex>\n  #ifdef MTOON_USE_UV\n    // COMPAT: pre-r151 uses a common uvTransform\n    #if THREE_VRM_THREE_REVISION >= 151\n      vUv = uv;\n    #else\n      vUv = ( uvTransform * vec3( uv, 1 ) ).xy;\n    #endif\n  #endif\n\n  // #include <uv2_vertex>\n  // COMAPT: pre-r151 uses uv2 for lightMap and aoMap\n  #if THREE_VRM_THREE_REVISION < 151\n    #if defined( USE_LIGHTMAP ) || defined( USE_AOMAP )\n      vUv2 = ( uv2Transform * vec3( uv2, 1 ) ).xy;\n    #endif\n  #endif\n\n  #include <color_vertex>\n\n  #include <beginnormal_vertex>\n  #include <morphnormal_vertex>\n  #include <skinbase_vertex>\n  #include <skinnormal_vertex>\n\n  // we need this to compute the outline properly\n  objectNormal = normalize( objectNormal );\n\n  #include <defaultnormal_vertex>\n\n  #ifndef FLAT_SHADED // Normal computed with derivatives when FLAT_SHADED\n    vNormal = normalize( transformedNormal );\n  #endif\n\n  #include <begin_vertex>\n\n  #include <morphtarget_vertex>\n  #include <skinning_vertex>\n  // #include <displacementmap_vertex>\n  #include <project_vertex>\n  #include <logdepthbuf_vertex>\n  #include <clipping_planes_vertex>\n\n  vViewPosition = - mvPosition.xyz;\n\n  #ifdef OUTLINE\n    float worldNormalLength = length( transformedNormal );\n    vec3 outlineOffset = outlineWidthFactor * worldNormalLength * objectNormal;\n\n    #ifdef USE_OUTLINEWIDTHMULTIPLYTEXTURE\n      vec2 outlineWidthMultiplyTextureUv = ( outlineWidthMultiplyTextureUvTransform * vec3( vUv, 1 ) ).xy;\n      float outlineTex = texture2D( outlineWidthMultiplyTexture, outlineWidthMultiplyTextureUv ).g;\n      outlineOffset *= outlineTex;\n    #endif\n\n    #ifdef OUTLINE_WIDTH_SCREEN\n      outlineOffset *= vViewPosition.z / projectionMatrix[ 1 ].y;\n    #endif\n\n    gl_Position = projectionMatrix * modelViewMatrix * vec4( outlineOffset + transformed, 1.0 );\n\n    gl_Position.z += 1E-6 * gl_Position.w; // anti-artifact magic\n  #endif\n\n  #include <worldpos_vertex>\n  // #include <envmap_vertex>\n  #include <shadowmap_vertex>\n  #include <fog_vertex>\n\n}";
var mtoon_default2 = "// #define PHONG\n\nuniform vec3 litFactor;\n\nuniform float opacity;\n\nuniform vec3 shadeColorFactor;\n#ifdef USE_SHADEMULTIPLYTEXTURE\n  uniform sampler2D shadeMultiplyTexture;\n  uniform mat3 shadeMultiplyTextureUvTransform;\n#endif\n\nuniform float shadingShiftFactor;\nuniform float shadingToonyFactor;\n\n#ifdef USE_SHADINGSHIFTTEXTURE\n  uniform sampler2D shadingShiftTexture;\n  uniform mat3 shadingShiftTextureUvTransform;\n  uniform float shadingShiftTextureScale;\n#endif\n\nuniform float giEqualizationFactor;\n\nuniform vec3 parametricRimColorFactor;\n#ifdef USE_RIMMULTIPLYTEXTURE\n  uniform sampler2D rimMultiplyTexture;\n  uniform mat3 rimMultiplyTextureUvTransform;\n#endif\nuniform float rimLightingMixFactor;\nuniform float parametricRimFresnelPowerFactor;\nuniform float parametricRimLiftFactor;\n\n#ifdef USE_MATCAPTEXTURE\n  uniform vec3 matcapFactor;\n  uniform sampler2D matcapTexture;\n  uniform mat3 matcapTextureUvTransform;\n#endif\n\nuniform vec3 emissive;\nuniform float emissiveIntensity;\n\nuniform vec3 outlineColorFactor;\nuniform float outlineLightingMixFactor;\n\n#ifdef USE_UVANIMATIONMASKTEXTURE\n  uniform sampler2D uvAnimationMaskTexture;\n  uniform mat3 uvAnimationMaskTextureUvTransform;\n#endif\n\nuniform float uvAnimationScrollXOffset;\nuniform float uvAnimationScrollYOffset;\nuniform float uvAnimationRotationPhase;\n\n#include <common>\n#include <packing>\n#include <dithering_pars_fragment>\n#include <color_pars_fragment>\n\n// #include <uv_pars_fragment>\n#if ( defined( MTOON_USE_UV ) && !defined( MTOON_UVS_VERTEX_ONLY ) )\n  varying vec2 vUv;\n#endif\n\n// #include <uv2_pars_fragment>\n// COMAPT: pre-r151 uses uv2 for lightMap and aoMap\n#if THREE_VRM_THREE_REVISION < 151\n  #if defined( USE_LIGHTMAP ) || defined( USE_AOMAP )\n    varying vec2 vUv2;\n  #endif\n#endif\n\n#include <map_pars_fragment>\n\n#ifdef USE_MAP\n  uniform mat3 mapUvTransform;\n#endif\n\n// #include <alphamap_pars_fragment>\n\n#include <alphatest_pars_fragment>\n\n#include <aomap_pars_fragment>\n// #include <lightmap_pars_fragment>\n#include <emissivemap_pars_fragment>\n\n#ifdef USE_EMISSIVEMAP\n  uniform mat3 emissiveMapUvTransform;\n#endif\n\n// #include <envmap_common_pars_fragment>\n// #include <envmap_pars_fragment>\n// #include <cube_uv_reflection_fragment>\n#include <fog_pars_fragment>\n\n// #include <bsdfs>\n// COMPAT: pre-r151 doesn't have BRDF_Lambert in <common>\n#if THREE_VRM_THREE_REVISION < 151\n  vec3 BRDF_Lambert( const in vec3 diffuseColor ) {\n    return RECIPROCAL_PI * diffuseColor;\n  }\n#endif\n\n#include <lights_pars_begin>\n\n#include <normal_pars_fragment>\n\n// #include <lights_phong_pars_fragment>\nvarying vec3 vViewPosition;\n\nstruct MToonMaterial {\n  vec3 diffuseColor;\n  vec3 shadeColor;\n  float shadingShift;\n};\n\nfloat linearstep( float a, float b, float t ) {\n  return clamp( ( t - a ) / ( b - a ), 0.0, 1.0 );\n}\n\n/**\n * Convert NdotL into toon shading factor using shadingShift and shadingToony\n */\nfloat getShading(\n  const in float dotNL,\n  const in float shadow,\n  const in float shadingShift\n) {\n  float shading = dotNL;\n  shading = shading + shadingShift;\n  shading = linearstep( -1.0 + shadingToonyFactor, 1.0 - shadingToonyFactor, shading );\n  shading *= shadow;\n  return shading;\n}\n\n/**\n * Mix diffuseColor and shadeColor using shading factor and light color\n */\nvec3 getDiffuse(\n  const in MToonMaterial material,\n  const in float shading,\n  in vec3 lightColor\n) {\n  #ifdef DEBUG_LITSHADERATE\n    return vec3( BRDF_Lambert( shading * lightColor ) );\n  #endif\n\n  vec3 col = lightColor * BRDF_Lambert( mix( material.shadeColor, material.diffuseColor, shading ) );\n\n  // The \"comment out if you want to PBR absolutely\" line\n  #ifdef V0_COMPAT_SHADE\n    col = min( col, material.diffuseColor );\n  #endif\n\n  return col;\n}\n\n// COMPAT: pre-r156 uses a struct GeometricContext\n#if THREE_VRM_THREE_REVISION >= 157\n  void RE_Direct_MToon( const in IncidentLight directLight, const in vec3 geometryPosition, const in vec3 geometryNormal, const in vec3 geometryViewDir, const in vec3 geometryClearcoatNormal, const in MToonMaterial material, const in float shadow, inout ReflectedLight reflectedLight ) {\n    float dotNL = clamp( dot( geometryNormal, directLight.direction ), -1.0, 1.0 );\n    vec3 irradiance = directLight.color;\n\n    // directSpecular will be used for rim lighting, not an actual specular\n    reflectedLight.directSpecular += irradiance;\n\n    irradiance *= dotNL;\n\n    float shading = getShading( dotNL, shadow, material.shadingShift );\n\n    // toon shaded diffuse\n    reflectedLight.directDiffuse += getDiffuse( material, shading, directLight.color );\n  }\n\n  void RE_IndirectDiffuse_MToon( const in vec3 irradiance, const in vec3 geometryPosition, const in vec3 geometryNormal, const in vec3 geometryViewDir, const in vec3 geometryClearcoatNormal, const in MToonMaterial material, inout ReflectedLight reflectedLight ) {\n    // indirect diffuse will use diffuseColor, no shadeColor involved\n    reflectedLight.indirectDiffuse += irradiance * BRDF_Lambert( material.diffuseColor );\n\n    // directSpecular will be used for rim lighting, not an actual specular\n    reflectedLight.directSpecular += irradiance;\n  }\n#else\n  void RE_Direct_MToon( const in IncidentLight directLight, const in GeometricContext geometry, const in MToonMaterial material, const in float shadow, inout ReflectedLight reflectedLight ) {\n    float dotNL = clamp( dot( geometry.normal, directLight.direction ), -1.0, 1.0 );\n    vec3 irradiance = directLight.color;\n\n    // directSpecular will be used for rim lighting, not an actual specular\n    reflectedLight.directSpecular += irradiance;\n\n    irradiance *= dotNL;\n\n    float shading = getShading( dotNL, shadow, material.shadingShift );\n\n    // toon shaded diffuse\n    reflectedLight.directDiffuse += getDiffuse( material, shading, directLight.color );\n  }\n\n  void RE_IndirectDiffuse_MToon( const in vec3 irradiance, const in GeometricContext geometry, const in MToonMaterial material, inout ReflectedLight reflectedLight ) {\n    // indirect diffuse will use diffuseColor, no shadeColor involved\n    reflectedLight.indirectDiffuse += irradiance * BRDF_Lambert( material.diffuseColor );\n\n    // directSpecular will be used for rim lighting, not an actual specular\n    reflectedLight.directSpecular += irradiance;\n  }\n#endif\n\n#define RE_Direct RE_Direct_MToon\n#define RE_IndirectDiffuse RE_IndirectDiffuse_MToon\n#define Material_LightProbeLOD( material ) (0)\n\n#include <shadowmap_pars_fragment>\n// #include <bumpmap_pars_fragment>\n\n// #include <normalmap_pars_fragment>\n#ifdef USE_NORMALMAP\n\n  uniform sampler2D normalMap;\n  uniform mat3 normalMapUvTransform;\n  uniform vec2 normalScale;\n\n#endif\n\n// COMPAT: pre-r151\n// USE_NORMALMAP_OBJECTSPACE used to be OBJECTSPACE_NORMALMAP in pre-r151\n#if defined( USE_NORMALMAP_OBJECTSPACE ) || defined( OBJECTSPACE_NORMALMAP )\n\n  uniform mat3 normalMatrix;\n\n#endif\n\n// COMPAT: pre-r151\n// USE_NORMALMAP_TANGENTSPACE used to be TANGENTSPACE_NORMALMAP in pre-r151\n#if ! defined ( USE_TANGENT ) && ( defined ( USE_NORMALMAP_TANGENTSPACE ) || defined ( TANGENTSPACE_NORMALMAP ) )\n\n  // Per-Pixel Tangent Space Normal Mapping\n  // http://hacksoflife.blogspot.ch/2009/11/per-pixel-tangent-space-normal-mapping.html\n\n  // three-vrm specific change: it requires `uv` as an input in order to support uv scrolls\n\n  // Temporary compat against shader change @ Three.js r126, r151\n  #if THREE_VRM_THREE_REVISION >= 151\n\n    mat3 getTangentFrame( vec3 eye_pos, vec3 surf_norm, vec2 uv ) {\n\n      vec3 q0 = dFdx( eye_pos.xyz );\n      vec3 q1 = dFdy( eye_pos.xyz );\n      vec2 st0 = dFdx( uv.st );\n      vec2 st1 = dFdy( uv.st );\n\n      vec3 N = surf_norm;\n\n      vec3 q1perp = cross( q1, N );\n      vec3 q0perp = cross( N, q0 );\n\n      vec3 T = q1perp * st0.x + q0perp * st1.x;\n      vec3 B = q1perp * st0.y + q0perp * st1.y;\n\n      float det = max( dot( T, T ), dot( B, B ) );\n      float scale = ( det == 0.0 ) ? 0.0 : inversesqrt( det );\n\n      return mat3( T * scale, B * scale, N );\n\n    }\n\n  #else\n\n    vec3 perturbNormal2Arb( vec2 uv, vec3 eye_pos, vec3 surf_norm, vec3 mapN, float faceDirection ) {\n\n      vec3 q0 = vec3( dFdx( eye_pos.x ), dFdx( eye_pos.y ), dFdx( eye_pos.z ) );\n      vec3 q1 = vec3( dFdy( eye_pos.x ), dFdy( eye_pos.y ), dFdy( eye_pos.z ) );\n      vec2 st0 = dFdx( uv.st );\n      vec2 st1 = dFdy( uv.st );\n\n      vec3 N = normalize( surf_norm );\n\n      vec3 q1perp = cross( q1, N );\n      vec3 q0perp = cross( N, q0 );\n\n      vec3 T = q1perp * st0.x + q0perp * st1.x;\n      vec3 B = q1perp * st0.y + q0perp * st1.y;\n\n      // three-vrm specific change: Workaround for the issue that happens when delta of uv = 0.0\n      // TODO: Is this still required? Or shall I make a PR about it?\n      if ( length( T ) == 0.0 || length( B ) == 0.0 ) {\n        return surf_norm;\n      }\n\n      float det = max( dot( T, T ), dot( B, B ) );\n      float scale = ( det == 0.0 ) ? 0.0 : faceDirection * inversesqrt( det );\n\n      return normalize( T * ( mapN.x * scale ) + B * ( mapN.y * scale ) + N * mapN.z );\n\n    }\n\n  #endif\n\n#endif\n\n// #include <specularmap_pars_fragment>\n#include <logdepthbuf_pars_fragment>\n#include <clipping_planes_pars_fragment>\n\n// == post correction ==========================================================\nvoid postCorrection() {\n  #include <tonemapping_fragment>\n  #include <colorspace_fragment>\n  #include <fog_fragment>\n  #include <premultiplied_alpha_fragment>\n  #include <dithering_fragment>\n}\n\n// == main procedure ===========================================================\nvoid main() {\n  #include <clipping_planes_fragment>\n\n  vec2 uv = vec2(0.5, 0.5);\n\n  #if ( defined( MTOON_USE_UV ) && !defined( MTOON_UVS_VERTEX_ONLY ) )\n    uv = vUv;\n\n    float uvAnimMask = 1.0;\n    #ifdef USE_UVANIMATIONMASKTEXTURE\n      vec2 uvAnimationMaskTextureUv = ( uvAnimationMaskTextureUvTransform * vec3( uv, 1 ) ).xy;\n      uvAnimMask = texture2D( uvAnimationMaskTexture, uvAnimationMaskTextureUv ).b;\n    #endif\n\n    float uvRotCos = cos( uvAnimationRotationPhase * uvAnimMask );\n    float uvRotSin = sin( uvAnimationRotationPhase * uvAnimMask );\n    uv = mat2( uvRotCos, -uvRotSin, uvRotSin, uvRotCos ) * ( uv - 0.5 ) + 0.5;\n    uv = uv + vec2( uvAnimationScrollXOffset, uvAnimationScrollYOffset ) * uvAnimMask;\n  #endif\n\n  #ifdef DEBUG_UV\n    gl_FragColor = vec4( 0.0, 0.0, 0.0, 1.0 );\n    #if ( defined( MTOON_USE_UV ) && !defined( MTOON_UVS_VERTEX_ONLY ) )\n      gl_FragColor = vec4( uv, 0.0, 1.0 );\n    #endif\n    return;\n  #endif\n\n  vec4 diffuseColor = vec4( litFactor, opacity );\n  ReflectedLight reflectedLight = ReflectedLight( vec3( 0.0 ), vec3( 0.0 ), vec3( 0.0 ), vec3( 0.0 ) );\n  vec3 totalEmissiveRadiance = emissive * emissiveIntensity;\n\n  #include <logdepthbuf_fragment>\n\n  // #include <map_fragment>\n  #ifdef USE_MAP\n    vec2 mapUv = ( mapUvTransform * vec3( uv, 1 ) ).xy;\n    vec4 sampledDiffuseColor = texture2D( map, mapUv );\n    #ifdef DECODE_VIDEO_TEXTURE\n      sampledDiffuseColor = vec4( mix( pow( sampledDiffuseColor.rgb * 0.9478672986 + vec3( 0.0521327014 ), vec3( 2.4 ) ), sampledDiffuseColor.rgb * 0.0773993808, vec3( lessThanEqual( sampledDiffuseColor.rgb, vec3( 0.04045 ) ) ) ), sampledDiffuseColor.w );\n    #endif\n    diffuseColor *= sampledDiffuseColor;\n  #endif\n\n  // #include <color_fragment>\n  #if ( defined( USE_COLOR ) && !defined( IGNORE_VERTEX_COLOR ) )\n    diffuseColor.rgb *= vColor;\n  #endif\n\n  // #include <alphamap_fragment>\n\n  #include <alphatest_fragment>\n\n  // #include <specularmap_fragment>\n\n  // #include <normal_fragment_begin>\n  float faceDirection = gl_FrontFacing ? 1.0 : -1.0;\n\n  #ifdef FLAT_SHADED\n\n    vec3 fdx = dFdx( vViewPosition );\n    vec3 fdy = dFdy( vViewPosition );\n    vec3 normal = normalize( cross( fdx, fdy ) );\n\n  #else\n\n    vec3 normal = normalize( vNormal );\n\n    #ifdef DOUBLE_SIDED\n\n      normal *= faceDirection;\n\n    #endif\n\n  #endif\n\n  #ifdef USE_NORMALMAP\n\n    vec2 normalMapUv = ( normalMapUvTransform * vec3( uv, 1 ) ).xy;\n\n  #endif\n\n  #ifdef USE_NORMALMAP_TANGENTSPACE\n\n    #ifdef USE_TANGENT\n\n      mat3 tbn = mat3( normalize( vTangent ), normalize( vBitangent ), normal );\n\n    #else\n\n      mat3 tbn = getTangentFrame( - vViewPosition, normal, normalMapUv );\n\n    #endif\n\n    #if defined( DOUBLE_SIDED ) && ! defined( FLAT_SHADED )\n\n      tbn[0] *= faceDirection;\n      tbn[1] *= faceDirection;\n\n    #endif\n\n  #endif\n\n  #ifdef USE_CLEARCOAT_NORMALMAP\n\n    #ifdef USE_TANGENT\n\n      mat3 tbn2 = mat3( normalize( vTangent ), normalize( vBitangent ), normal );\n\n    #else\n\n      mat3 tbn2 = getTangentFrame( - vViewPosition, normal, vClearcoatNormalMapUv );\n\n    #endif\n\n    #if defined( DOUBLE_SIDED ) && ! defined( FLAT_SHADED )\n\n      tbn2[0] *= faceDirection;\n      tbn2[1] *= faceDirection;\n\n    #endif\n\n  #endif\n\n  // non perturbed normal for clearcoat among others\n\n  vec3 nonPerturbedNormal = normal;\n\n  #ifdef OUTLINE\n    normal *= -1.0;\n  #endif\n\n  // #include <normal_fragment_maps>\n\n  // COMPAT: pre-r151\n  // USE_NORMALMAP_OBJECTSPACE used to be OBJECTSPACE_NORMALMAP in pre-r151\n  #if defined( USE_NORMALMAP_OBJECTSPACE ) || defined( OBJECTSPACE_NORMALMAP )\n\n    normal = texture2D( normalMap, normalMapUv ).xyz * 2.0 - 1.0; // overrides both flatShading and attribute normals\n\n    #ifdef FLIP_SIDED\n\n      normal = - normal;\n\n    #endif\n\n    #ifdef DOUBLE_SIDED\n\n      normal = normal * faceDirection;\n\n    #endif\n\n    normal = normalize( normalMatrix * normal );\n\n  // COMPAT: pre-r151\n  // USE_NORMALMAP_TANGENTSPACE used to be TANGENTSPACE_NORMALMAP in pre-r151\n  #elif defined( USE_NORMALMAP_TANGENTSPACE ) || defined( TANGENTSPACE_NORMALMAP )\n\n    vec3 mapN = texture2D( normalMap, normalMapUv ).xyz * 2.0 - 1.0;\n    mapN.xy *= normalScale;\n\n    // COMPAT: pre-r151\n    #if THREE_VRM_THREE_REVISION >= 151 || defined( USE_TANGENT )\n\n      normal = normalize( tbn * mapN );\n\n    #else\n\n      normal = perturbNormal2Arb( uv, -vViewPosition, normal, mapN, faceDirection );\n\n    #endif\n\n  #endif\n\n  // #include <emissivemap_fragment>\n  #ifdef USE_EMISSIVEMAP\n    vec2 emissiveMapUv = ( emissiveMapUvTransform * vec3( uv, 1 ) ).xy;\n    totalEmissiveRadiance *= texture2D( emissiveMap, emissiveMapUv ).rgb;\n  #endif\n\n  #ifdef DEBUG_NORMAL\n    gl_FragColor = vec4( 0.5 + 0.5 * normal, 1.0 );\n    return;\n  #endif\n\n  // -- MToon: lighting --------------------------------------------------------\n  // accumulation\n  // #include <lights_phong_fragment>\n  MToonMaterial material;\n\n  material.diffuseColor = diffuseColor.rgb;\n\n  material.shadeColor = shadeColorFactor;\n  #ifdef USE_SHADEMULTIPLYTEXTURE\n    vec2 shadeMultiplyTextureUv = ( shadeMultiplyTextureUvTransform * vec3( uv, 1 ) ).xy;\n    material.shadeColor *= texture2D( shadeMultiplyTexture, shadeMultiplyTextureUv ).rgb;\n  #endif\n\n  #if ( defined( USE_COLOR ) && !defined( IGNORE_VERTEX_COLOR ) )\n    material.shadeColor.rgb *= vColor;\n  #endif\n\n  material.shadingShift = shadingShiftFactor;\n  #ifdef USE_SHADINGSHIFTTEXTURE\n    vec2 shadingShiftTextureUv = ( shadingShiftTextureUvTransform * vec3( uv, 1 ) ).xy;\n    material.shadingShift += texture2D( shadingShiftTexture, shadingShiftTextureUv ).r * shadingShiftTextureScale;\n  #endif\n\n  // #include <lights_fragment_begin>\n\n  // MToon Specific changes:\n  // Since we want to take shadows into account of shading instead of irradiance,\n  // we had to modify the codes that multiplies the results of shadowmap into color of direct lights.\n\n  // COMPAT: pre-r156 uses a struct GeometricContext\n  #if THREE_VRM_THREE_REVISION >= 157\n    vec3 geometryPosition = - vViewPosition;\n    vec3 geometryNormal = normal;\n    vec3 geometryViewDir = ( isOrthographic ) ? vec3( 0, 0, 1 ) : normalize( vViewPosition );\n\n    vec3 geometryClearcoatNormal;\n\n    #ifdef USE_CLEARCOAT\n\n      geometryClearcoatNormal = clearcoatNormal;\n\n    #endif\n  #else\n    GeometricContext geometry;\n\n    geometry.position = - vViewPosition;\n    geometry.normal = normal;\n    geometry.viewDir = ( isOrthographic ) ? vec3( 0, 0, 1 ) : normalize( vViewPosition );\n\n    #ifdef USE_CLEARCOAT\n\n      geometry.clearcoatNormal = clearcoatNormal;\n\n    #endif\n  #endif\n\n  IncidentLight directLight;\n\n  // since these variables will be used in unrolled loop, we have to define in prior\n  float shadow;\n\n  #if ( NUM_POINT_LIGHTS > 0 ) && defined( RE_Direct )\n\n    PointLight pointLight;\n    #if defined( USE_SHADOWMAP ) && NUM_POINT_LIGHT_SHADOWS > 0\n    PointLightShadow pointLightShadow;\n    #endif\n\n    #pragma unroll_loop_start\n    for ( int i = 0; i < NUM_POINT_LIGHTS; i ++ ) {\n\n      pointLight = pointLights[ i ];\n\n      // COMPAT: pre-r156 uses a struct GeometricContext\n      #if THREE_VRM_THREE_REVISION >= 157\n        getPointLightInfo( pointLight, geometryPosition, directLight );\n      #else\n        getPointLightInfo( pointLight, geometry, directLight );\n      #endif\n\n      shadow = 1.0;\n      #if defined( USE_SHADOWMAP ) && ( UNROLLED_LOOP_INDEX < NUM_POINT_LIGHT_SHADOWS )\n      pointLightShadow = pointLightShadows[ i ];\n      // COMPAT: pre-r166\n      // r166 introduced shadowIntensity\n      #if THREE_VRM_THREE_REVISION >= 166\n        shadow = all( bvec2( directLight.visible, receiveShadow ) ) ? getPointShadow( pointShadowMap[ i ], pointLightShadow.shadowMapSize, pointLightShadow.shadowIntensity, pointLightShadow.shadowBias, pointLightShadow.shadowRadius, vPointShadowCoord[ i ], pointLightShadow.shadowCameraNear, pointLightShadow.shadowCameraFar ) : 1.0;\n      #else\n        shadow = all( bvec2( directLight.visible, receiveShadow ) ) ? getPointShadow( pointShadowMap[ i ], pointLightShadow.shadowMapSize, pointLightShadow.shadowBias, pointLightShadow.shadowRadius, vPointShadowCoord[ i ], pointLightShadow.shadowCameraNear, pointLightShadow.shadowCameraFar ) : 1.0;\n      #endif\n      #endif\n\n      // COMPAT: pre-r156 uses a struct GeometricContext\n      #if THREE_VRM_THREE_REVISION >= 157\n        RE_Direct( directLight, geometryPosition, geometryNormal, geometryViewDir, geometryClearcoatNormal, material, shadow, reflectedLight );\n      #else\n        RE_Direct( directLight, geometry, material, shadow, reflectedLight );\n      #endif\n\n    }\n    #pragma unroll_loop_end\n\n  #endif\n\n  #if ( NUM_SPOT_LIGHTS > 0 ) && defined( RE_Direct )\n\n    SpotLight spotLight;\n    #if defined( USE_SHADOWMAP ) && NUM_SPOT_LIGHT_SHADOWS > 0\n    SpotLightShadow spotLightShadow;\n    #endif\n\n    #pragma unroll_loop_start\n    for ( int i = 0; i < NUM_SPOT_LIGHTS; i ++ ) {\n\n      spotLight = spotLights[ i ];\n\n      // COMPAT: pre-r156 uses a struct GeometricContext\n      #if THREE_VRM_THREE_REVISION >= 157\n        getSpotLightInfo( spotLight, geometryPosition, directLight );\n      #else\n        getSpotLightInfo( spotLight, geometry, directLight );\n      #endif\n\n      shadow = 1.0;\n      #if defined( USE_SHADOWMAP ) && ( UNROLLED_LOOP_INDEX < NUM_SPOT_LIGHT_SHADOWS )\n      spotLightShadow = spotLightShadows[ i ];\n      // COMPAT: pre-r166\n      // r166 introduced shadowIntensity\n      #if THREE_VRM_THREE_REVISION >= 166\n        shadow = all( bvec2( directLight.visible, receiveShadow ) ) ? getShadow( spotShadowMap[ i ], spotLightShadow.shadowMapSize, spotLightShadow.shadowIntensity, spotLightShadow.shadowBias, spotLightShadow.shadowRadius, vSpotShadowCoord[ i ] ) : 1.0;\n      #else\n        shadow = all( bvec2( directLight.visible, receiveShadow ) ) ? getShadow( spotShadowMap[ i ], spotLightShadow.shadowMapSize, spotLightShadow.shadowBias, spotLightShadow.shadowRadius, vSpotShadowCoord[ i ] ) : 1.0;\n      #endif\n      #endif\n\n      // COMPAT: pre-r156 uses a struct GeometricContext\n      #if THREE_VRM_THREE_REVISION >= 157\n        RE_Direct( directLight, geometryPosition, geometryNormal, geometryViewDir, geometryClearcoatNormal, material, shadow, reflectedLight );\n      #else\n        RE_Direct( directLight, geometry, material, shadow, reflectedLight );\n      #endif\n\n    }\n    #pragma unroll_loop_end\n\n  #endif\n\n  #if ( NUM_DIR_LIGHTS > 0 ) && defined( RE_Direct )\n\n    DirectionalLight directionalLight;\n    #if defined( USE_SHADOWMAP ) && NUM_DIR_LIGHT_SHADOWS > 0\n    DirectionalLightShadow directionalLightShadow;\n    #endif\n\n    #pragma unroll_loop_start\n    for ( int i = 0; i < NUM_DIR_LIGHTS; i ++ ) {\n\n      directionalLight = directionalLights[ i ];\n\n      // COMPAT: pre-r156 uses a struct GeometricContext\n      #if THREE_VRM_THREE_REVISION >= 157\n        getDirectionalLightInfo( directionalLight, directLight );\n      #else\n        getDirectionalLightInfo( directionalLight, geometry, directLight );\n      #endif\n\n      shadow = 1.0;\n      #if defined( USE_SHADOWMAP ) && ( UNROLLED_LOOP_INDEX < NUM_DIR_LIGHT_SHADOWS )\n      directionalLightShadow = directionalLightShadows[ i ];\n      // COMPAT: pre-r166\n      // r166 introduced shadowIntensity\n      #if THREE_VRM_THREE_REVISION >= 166\n        shadow = all( bvec2( directLight.visible, receiveShadow ) ) ? getShadow( directionalShadowMap[ i ], directionalLightShadow.shadowMapSize, directionalLightShadow.shadowIntensity, directionalLightShadow.shadowBias, directionalLightShadow.shadowRadius, vDirectionalShadowCoord[ i ] ) : 1.0;\n      #else\n        shadow = all( bvec2( directLight.visible, receiveShadow ) ) ? getShadow( directionalShadowMap[ i ], directionalLightShadow.shadowMapSize, directionalLightShadow.shadowBias, directionalLightShadow.shadowRadius, vDirectionalShadowCoord[ i ] ) : 1.0;\n      #endif\n      #endif\n\n      // COMPAT: pre-r156 uses a struct GeometricContext\n      #if THREE_VRM_THREE_REVISION >= 157\n        RE_Direct( directLight, geometryPosition, geometryNormal, geometryViewDir, geometryClearcoatNormal, material, shadow, reflectedLight );\n      #else\n        RE_Direct( directLight, geometry, material, shadow, reflectedLight );\n      #endif\n\n    }\n    #pragma unroll_loop_end\n\n  #endif\n\n  // #if ( NUM_RECT_AREA_LIGHTS > 0 ) && defined( RE_Direct_RectArea )\n\n  //   RectAreaLight rectAreaLight;\n\n  //   #pragma unroll_loop_start\n  //   for ( int i = 0; i < NUM_RECT_AREA_LIGHTS; i ++ ) {\n\n  //     rectAreaLight = rectAreaLights[ i ];\n  //     RE_Direct_RectArea( rectAreaLight, geometry, material, reflectedLight );\n\n  //   }\n  //   #pragma unroll_loop_end\n\n  // #endif\n\n  #if defined( RE_IndirectDiffuse )\n\n    vec3 iblIrradiance = vec3( 0.0 );\n\n    vec3 irradiance = getAmbientLightIrradiance( ambientLightColor );\n\n    // COMPAT: pre-r156 uses a struct GeometricContext\n    // COMPAT: pre-r156 doesn't have a define USE_LIGHT_PROBES\n    #if THREE_VRM_THREE_REVISION >= 157\n      #if defined( USE_LIGHT_PROBES )\n        irradiance += getLightProbeIrradiance( lightProbe, geometryNormal );\n      #endif\n    #else\n      irradiance += getLightProbeIrradiance( lightProbe, geometry.normal );\n    #endif\n\n    #if ( NUM_HEMI_LIGHTS > 0 )\n\n      #pragma unroll_loop_start\n      for ( int i = 0; i < NUM_HEMI_LIGHTS; i ++ ) {\n\n        // COMPAT: pre-r156 uses a struct GeometricContext\n        #if THREE_VRM_THREE_REVISION >= 157\n          irradiance += getHemisphereLightIrradiance( hemisphereLights[ i ], geometryNormal );\n        #else\n          irradiance += getHemisphereLightIrradiance( hemisphereLights[ i ], geometry.normal );\n        #endif\n\n      }\n      #pragma unroll_loop_end\n\n    #endif\n\n  #endif\n\n  // #if defined( RE_IndirectSpecular )\n\n  //   vec3 radiance = vec3( 0.0 );\n  //   vec3 clearcoatRadiance = vec3( 0.0 );\n\n  // #endif\n\n  #include <lights_fragment_maps>\n  #include <lights_fragment_end>\n\n  // modulation\n  #include <aomap_fragment>\n\n  vec3 col = reflectedLight.directDiffuse + reflectedLight.indirectDiffuse;\n\n  #ifdef DEBUG_LITSHADERATE\n    gl_FragColor = vec4( col, diffuseColor.a );\n    postCorrection();\n    return;\n  #endif\n\n  // -- MToon: rim lighting -----------------------------------------\n  vec3 viewDir = normalize( vViewPosition );\n\n  #ifndef PHYSICALLY_CORRECT_LIGHTS\n    reflectedLight.directSpecular /= PI;\n  #endif\n  vec3 rimMix = mix( vec3( 1.0 ), reflectedLight.directSpecular, 1.0 );\n\n  vec3 rim = parametricRimColorFactor * pow( saturate( 1.0 - dot( viewDir, normal ) + parametricRimLiftFactor ), parametricRimFresnelPowerFactor );\n\n  #ifdef USE_MATCAPTEXTURE\n    {\n      vec3 x = normalize( vec3( viewDir.z, 0.0, -viewDir.x ) );\n      vec3 y = cross( viewDir, x ); // guaranteed to be normalized\n      vec2 sphereUv = 0.5 + 0.5 * vec2( dot( x, normal ), -dot( y, normal ) );\n      sphereUv = ( matcapTextureUvTransform * vec3( sphereUv, 1 ) ).xy;\n      vec3 matcap = texture2D( matcapTexture, sphereUv ).rgb;\n      rim += matcapFactor * matcap;\n    }\n  #endif\n\n  #ifdef USE_RIMMULTIPLYTEXTURE\n    vec2 rimMultiplyTextureUv = ( rimMultiplyTextureUvTransform * vec3( uv, 1 ) ).xy;\n    rim *= texture2D( rimMultiplyTexture, rimMultiplyTextureUv ).rgb;\n  #endif\n\n  col += rimMix * rim;\n\n  // -- MToon: Emission --------------------------------------------------------\n  col += totalEmissiveRadiance;\n\n  // #include <envmap_fragment>\n\n  // -- Almost done! -----------------------------------------------------------\n  #if defined( OUTLINE )\n    col = outlineColorFactor.rgb * mix( vec3( 1.0 ), col, outlineLightingMixFactor );\n  #endif\n\n  #ifdef OPAQUE\n    diffuseColor.a = 1.0;\n  #endif\n\n  gl_FragColor = vec4( col, diffuseColor.a );\n  postCorrection();\n}\n";
var MToonMaterialDebugMode = {
  /**
   * Render normally.
   */
  None: "none",
  /**
   * Visualize normals of the surface.
   */
  Normal: "normal",
  /**
   * Visualize lit/shade of the surface.
   */
  LitShadeRate: "litShadeRate",
  /**
   * Visualize UV of the surface.
   */
  UV: "uv"
};
var MToonMaterialOutlineWidthMode = {
  None: "none",
  WorldCoordinates: "worldCoordinates",
  ScreenCoordinates: "screenCoordinates"
};
var encodingColorSpaceMap = {
  // eslint-disable-next-line @typescript-eslint/naming-convention
  3e3: "",
  // eslint-disable-next-line @typescript-eslint/naming-convention
  3001: "srgb"
};
function getTextureColorSpace(texture) {
  if (parseInt(THREE32.REVISION, 10) >= 152) {
    return texture.colorSpace;
  } else {
    return encodingColorSpaceMap[texture.encoding];
  }
}
var MToonMaterial = class extends THREE42.ShaderMaterial {
  constructor(parameters = {}) {
    var _a;
    super({ vertexShader: mtoon_default, fragmentShader: mtoon_default2 });
    this.uvAnimationScrollXSpeedFactor = 0;
    this.uvAnimationScrollYSpeedFactor = 0;
    this.uvAnimationRotationSpeedFactor = 0;
    this.fog = true;
    this.normalMapType = THREE42.TangentSpaceNormalMap;
    this._ignoreVertexColor = true;
    this._v0CompatShade = false;
    this._debugMode = MToonMaterialDebugMode.None;
    this._outlineWidthMode = MToonMaterialOutlineWidthMode.None;
    this._isOutline = false;
    if (parameters.transparentWithZWrite) {
      parameters.depthWrite = true;
    }
    delete parameters.transparentWithZWrite;
    parameters.fog = true;
    parameters.lights = true;
    parameters.clipping = true;
    this.uniforms = THREE42.UniformsUtils.merge([
      THREE42.UniformsLib.common,
      // map
      THREE42.UniformsLib.normalmap,
      // normalMap
      THREE42.UniformsLib.emissivemap,
      // emissiveMap
      THREE42.UniformsLib.fog,
      THREE42.UniformsLib.lights,
      {
        litFactor: { value: new THREE42.Color(1, 1, 1) },
        mapUvTransform: { value: new THREE42.Matrix3() },
        colorAlpha: { value: 1 },
        normalMapUvTransform: { value: new THREE42.Matrix3() },
        shadeColorFactor: { value: new THREE42.Color(0, 0, 0) },
        shadeMultiplyTexture: { value: null },
        shadeMultiplyTextureUvTransform: { value: new THREE42.Matrix3() },
        shadingShiftFactor: { value: 0 },
        shadingShiftTexture: { value: null },
        shadingShiftTextureUvTransform: { value: new THREE42.Matrix3() },
        shadingShiftTextureScale: { value: 1 },
        shadingToonyFactor: { value: 0.9 },
        giEqualizationFactor: { value: 0.9 },
        matcapFactor: { value: new THREE42.Color(1, 1, 1) },
        matcapTexture: { value: null },
        matcapTextureUvTransform: { value: new THREE42.Matrix3() },
        parametricRimColorFactor: { value: new THREE42.Color(0, 0, 0) },
        rimMultiplyTexture: { value: null },
        rimMultiplyTextureUvTransform: { value: new THREE42.Matrix3() },
        rimLightingMixFactor: { value: 1 },
        parametricRimFresnelPowerFactor: { value: 5 },
        parametricRimLiftFactor: { value: 0 },
        emissive: { value: new THREE42.Color(0, 0, 0) },
        emissiveIntensity: { value: 1 },
        emissiveMapUvTransform: { value: new THREE42.Matrix3() },
        outlineWidthMultiplyTexture: { value: null },
        outlineWidthMultiplyTextureUvTransform: { value: new THREE42.Matrix3() },
        outlineWidthFactor: { value: 0 },
        outlineColorFactor: { value: new THREE42.Color(0, 0, 0) },
        outlineLightingMixFactor: { value: 1 },
        uvAnimationMaskTexture: { value: null },
        uvAnimationMaskTextureUvTransform: { value: new THREE42.Matrix3() },
        uvAnimationScrollXOffset: { value: 0 },
        uvAnimationScrollYOffset: { value: 0 },
        uvAnimationRotationPhase: { value: 0 }
      },
      (_a = parameters.uniforms) != null ? _a : {}
    ]);
    this.setValues(parameters);
    this._uploadUniformsWorkaround();
    this.customProgramCacheKey = () => [
      ...Object.entries(this._generateDefines()).map(([token, macro]) => `${token}:${macro}`),
      this.matcapTexture ? `matcapTextureColorSpace:${getTextureColorSpace(this.matcapTexture)}` : "",
      this.shadeMultiplyTexture ? `shadeMultiplyTextureColorSpace:${getTextureColorSpace(this.shadeMultiplyTexture)}` : "",
      this.rimMultiplyTexture ? `rimMultiplyTextureColorSpace:${getTextureColorSpace(this.rimMultiplyTexture)}` : ""
    ].join(",");
    this.onBeforeCompile = (shader) => {
      const threeRevision = parseInt(THREE42.REVISION, 10);
      const defines = Object.entries(__spreadValues(__spreadValues({}, this._generateDefines()), this.defines)).filter(([token, macro]) => !!macro).map(([token, macro]) => `#define ${token} ${macro}`).join("\n") + "\n";
      shader.vertexShader = defines + shader.vertexShader;
      shader.fragmentShader = defines + shader.fragmentShader;
      if (threeRevision < 154) {
        shader.fragmentShader = shader.fragmentShader.replace(
          "#include <colorspace_fragment>",
          "#include <encodings_fragment>"
        );
      }
    };
  }
  get color() {
    return this.uniforms.litFactor.value;
  }
  set color(value) {
    this.uniforms.litFactor.value = value;
  }
  get map() {
    return this.uniforms.map.value;
  }
  set map(value) {
    this.uniforms.map.value = value;
  }
  get normalMap() {
    return this.uniforms.normalMap.value;
  }
  set normalMap(value) {
    this.uniforms.normalMap.value = value;
  }
  get normalScale() {
    return this.uniforms.normalScale.value;
  }
  set normalScale(value) {
    this.uniforms.normalScale.value = value;
  }
  get emissive() {
    return this.uniforms.emissive.value;
  }
  set emissive(value) {
    this.uniforms.emissive.value = value;
  }
  get emissiveIntensity() {
    return this.uniforms.emissiveIntensity.value;
  }
  set emissiveIntensity(value) {
    this.uniforms.emissiveIntensity.value = value;
  }
  get emissiveMap() {
    return this.uniforms.emissiveMap.value;
  }
  set emissiveMap(value) {
    this.uniforms.emissiveMap.value = value;
  }
  get shadeColorFactor() {
    return this.uniforms.shadeColorFactor.value;
  }
  set shadeColorFactor(value) {
    this.uniforms.shadeColorFactor.value = value;
  }
  get shadeMultiplyTexture() {
    return this.uniforms.shadeMultiplyTexture.value;
  }
  set shadeMultiplyTexture(value) {
    this.uniforms.shadeMultiplyTexture.value = value;
  }
  get shadingShiftFactor() {
    return this.uniforms.shadingShiftFactor.value;
  }
  set shadingShiftFactor(value) {
    this.uniforms.shadingShiftFactor.value = value;
  }
  get shadingShiftTexture() {
    return this.uniforms.shadingShiftTexture.value;
  }
  set shadingShiftTexture(value) {
    this.uniforms.shadingShiftTexture.value = value;
  }
  get shadingShiftTextureScale() {
    return this.uniforms.shadingShiftTextureScale.value;
  }
  set shadingShiftTextureScale(value) {
    this.uniforms.shadingShiftTextureScale.value = value;
  }
  get shadingToonyFactor() {
    return this.uniforms.shadingToonyFactor.value;
  }
  set shadingToonyFactor(value) {
    this.uniforms.shadingToonyFactor.value = value;
  }
  get giEqualizationFactor() {
    return this.uniforms.giEqualizationFactor.value;
  }
  set giEqualizationFactor(value) {
    this.uniforms.giEqualizationFactor.value = value;
  }
  get matcapFactor() {
    return this.uniforms.matcapFactor.value;
  }
  set matcapFactor(value) {
    this.uniforms.matcapFactor.value = value;
  }
  get matcapTexture() {
    return this.uniforms.matcapTexture.value;
  }
  set matcapTexture(value) {
    this.uniforms.matcapTexture.value = value;
  }
  get parametricRimColorFactor() {
    return this.uniforms.parametricRimColorFactor.value;
  }
  set parametricRimColorFactor(value) {
    this.uniforms.parametricRimColorFactor.value = value;
  }
  get rimMultiplyTexture() {
    return this.uniforms.rimMultiplyTexture.value;
  }
  set rimMultiplyTexture(value) {
    this.uniforms.rimMultiplyTexture.value = value;
  }
  get rimLightingMixFactor() {
    return this.uniforms.rimLightingMixFactor.value;
  }
  set rimLightingMixFactor(value) {
    this.uniforms.rimLightingMixFactor.value = value;
  }
  get parametricRimFresnelPowerFactor() {
    return this.uniforms.parametricRimFresnelPowerFactor.value;
  }
  set parametricRimFresnelPowerFactor(value) {
    this.uniforms.parametricRimFresnelPowerFactor.value = value;
  }
  get parametricRimLiftFactor() {
    return this.uniforms.parametricRimLiftFactor.value;
  }
  set parametricRimLiftFactor(value) {
    this.uniforms.parametricRimLiftFactor.value = value;
  }
  get outlineWidthMultiplyTexture() {
    return this.uniforms.outlineWidthMultiplyTexture.value;
  }
  set outlineWidthMultiplyTexture(value) {
    this.uniforms.outlineWidthMultiplyTexture.value = value;
  }
  get outlineWidthFactor() {
    return this.uniforms.outlineWidthFactor.value;
  }
  set outlineWidthFactor(value) {
    this.uniforms.outlineWidthFactor.value = value;
  }
  get outlineColorFactor() {
    return this.uniforms.outlineColorFactor.value;
  }
  set outlineColorFactor(value) {
    this.uniforms.outlineColorFactor.value = value;
  }
  get outlineLightingMixFactor() {
    return this.uniforms.outlineLightingMixFactor.value;
  }
  set outlineLightingMixFactor(value) {
    this.uniforms.outlineLightingMixFactor.value = value;
  }
  get uvAnimationMaskTexture() {
    return this.uniforms.uvAnimationMaskTexture.value;
  }
  set uvAnimationMaskTexture(value) {
    this.uniforms.uvAnimationMaskTexture.value = value;
  }
  get uvAnimationScrollXOffset() {
    return this.uniforms.uvAnimationScrollXOffset.value;
  }
  set uvAnimationScrollXOffset(value) {
    this.uniforms.uvAnimationScrollXOffset.value = value;
  }
  get uvAnimationScrollYOffset() {
    return this.uniforms.uvAnimationScrollYOffset.value;
  }
  set uvAnimationScrollYOffset(value) {
    this.uniforms.uvAnimationScrollYOffset.value = value;
  }
  get uvAnimationRotationPhase() {
    return this.uniforms.uvAnimationRotationPhase.value;
  }
  set uvAnimationRotationPhase(value) {
    this.uniforms.uvAnimationRotationPhase.value = value;
  }
  /**
   * When this is `true`, vertex colors will be ignored.
   * `true` by default.
   */
  get ignoreVertexColor() {
    return this._ignoreVertexColor;
  }
  set ignoreVertexColor(value) {
    this._ignoreVertexColor = value;
    this.needsUpdate = true;
  }
  /**
   * There is a line of the shader called "comment out if you want to PBR absolutely" in VRM0.0 MToon.
   * When this is true, the material enables the line to make it compatible with the legacy rendering of VRM.
   * Usually not recommended to turn this on.
   * `false` by default.
   */
  get v0CompatShade() {
    return this._v0CompatShade;
  }
  /**
   * There is a line of the shader called "comment out if you want to PBR absolutely" in VRM0.0 MToon.
   * When this is true, the material enables the line to make it compatible with the legacy rendering of VRM.
   * Usually not recommended to turn this on.
   * `false` by default.
   */
  set v0CompatShade(v) {
    this._v0CompatShade = v;
    this.needsUpdate = true;
  }
  /**
   * Debug mode for the material.
   * You can visualize several components for diagnosis using debug mode.
   *
   * See: {@link MToonMaterialDebugMode}
   */
  get debugMode() {
    return this._debugMode;
  }
  /**
   * Debug mode for the material.
   * You can visualize several components for diagnosis using debug mode.
   *
   * See: {@link MToonMaterialDebugMode}
   */
  set debugMode(m) {
    this._debugMode = m;
    this.needsUpdate = true;
  }
  get outlineWidthMode() {
    return this._outlineWidthMode;
  }
  set outlineWidthMode(m) {
    this._outlineWidthMode = m;
    this.needsUpdate = true;
  }
  get isOutline() {
    return this._isOutline;
  }
  set isOutline(b) {
    this._isOutline = b;
    this.needsUpdate = true;
  }
  /**
   * Readonly boolean that indicates this is a [[MToonMaterial]].
   */
  get isMToonMaterial() {
    return true;
  }
  /**
   * Update this material.
   *
   * @param delta deltaTime since last update
   */
  update(delta) {
    this._uploadUniformsWorkaround();
    this._updateUVAnimation(delta);
  }
  copy(source) {
    super.copy(source);
    this.map = source.map;
    this.normalMap = source.normalMap;
    this.emissiveMap = source.emissiveMap;
    this.shadeMultiplyTexture = source.shadeMultiplyTexture;
    this.shadingShiftTexture = source.shadingShiftTexture;
    this.matcapTexture = source.matcapTexture;
    this.rimMultiplyTexture = source.rimMultiplyTexture;
    this.outlineWidthMultiplyTexture = source.outlineWidthMultiplyTexture;
    this.uvAnimationMaskTexture = source.uvAnimationMaskTexture;
    this.normalMapType = source.normalMapType;
    this.uvAnimationScrollXSpeedFactor = source.uvAnimationScrollXSpeedFactor;
    this.uvAnimationScrollYSpeedFactor = source.uvAnimationScrollYSpeedFactor;
    this.uvAnimationRotationSpeedFactor = source.uvAnimationRotationSpeedFactor;
    this.ignoreVertexColor = source.ignoreVertexColor;
    this.v0CompatShade = source.v0CompatShade;
    this.debugMode = source.debugMode;
    this.outlineWidthMode = source.outlineWidthMode;
    this.isOutline = source.isOutline;
    this.needsUpdate = true;
    return this;
  }
  /**
   * Update UV animation state.
   * Intended to be called via {@link update}.
   * @param delta deltaTime
   */
  _updateUVAnimation(delta) {
    this.uniforms.uvAnimationScrollXOffset.value += delta * this.uvAnimationScrollXSpeedFactor;
    this.uniforms.uvAnimationScrollYOffset.value += delta * this.uvAnimationScrollYSpeedFactor;
    this.uniforms.uvAnimationRotationPhase.value += delta * this.uvAnimationRotationSpeedFactor;
    this.uniforms.alphaTest.value = this.alphaTest;
    this.uniformsNeedUpdate = true;
  }
  /**
   * Upload uniforms that need to upload but doesn't automatically because of reasons.
   * Intended to be called via {@link constructor} and {@link update}.
   */
  _uploadUniformsWorkaround() {
    this.uniforms.opacity.value = this.opacity;
    this._updateTextureMatrix(this.uniforms.map, this.uniforms.mapUvTransform);
    this._updateTextureMatrix(this.uniforms.normalMap, this.uniforms.normalMapUvTransform);
    this._updateTextureMatrix(this.uniforms.emissiveMap, this.uniforms.emissiveMapUvTransform);
    this._updateTextureMatrix(this.uniforms.shadeMultiplyTexture, this.uniforms.shadeMultiplyTextureUvTransform);
    this._updateTextureMatrix(this.uniforms.shadingShiftTexture, this.uniforms.shadingShiftTextureUvTransform);
    this._updateTextureMatrix(this.uniforms.matcapTexture, this.uniforms.matcapTextureUvTransform);
    this._updateTextureMatrix(this.uniforms.rimMultiplyTexture, this.uniforms.rimMultiplyTextureUvTransform);
    this._updateTextureMatrix(
      this.uniforms.outlineWidthMultiplyTexture,
      this.uniforms.outlineWidthMultiplyTextureUvTransform
    );
    this._updateTextureMatrix(this.uniforms.uvAnimationMaskTexture, this.uniforms.uvAnimationMaskTextureUvTransform);
    this.uniformsNeedUpdate = true;
  }
  /**
   * Returns a map object of preprocessor token and macro of the shader program.
   */
  _generateDefines() {
    const threeRevision = parseInt(THREE42.REVISION, 10);
    const useUvInVert = this.outlineWidthMultiplyTexture !== null;
    const useUvInFrag = this.map !== null || this.normalMap !== null || this.emissiveMap !== null || this.shadeMultiplyTexture !== null || this.shadingShiftTexture !== null || this.rimMultiplyTexture !== null || this.uvAnimationMaskTexture !== null;
    return {
      // Temporary compat against shader change @ Three.js r126
      // See: #21205, #21307, #21299
      THREE_VRM_THREE_REVISION: threeRevision,
      OUTLINE: this._isOutline,
      MTOON_USE_UV: useUvInVert || useUvInFrag,
      // we can't use `USE_UV` , it will be redefined in WebGLProgram.js
      MTOON_UVS_VERTEX_ONLY: useUvInVert && !useUvInFrag,
      V0_COMPAT_SHADE: this._v0CompatShade,
      USE_SHADEMULTIPLYTEXTURE: this.shadeMultiplyTexture !== null,
      USE_SHADINGSHIFTTEXTURE: this.shadingShiftTexture !== null,
      USE_MATCAPTEXTURE: this.matcapTexture !== null,
      USE_RIMMULTIPLYTEXTURE: this.rimMultiplyTexture !== null,
      USE_OUTLINEWIDTHMULTIPLYTEXTURE: this._isOutline && this.outlineWidthMultiplyTexture !== null,
      USE_UVANIMATIONMASKTEXTURE: this.uvAnimationMaskTexture !== null,
      IGNORE_VERTEX_COLOR: this._ignoreVertexColor === true,
      DEBUG_NORMAL: this._debugMode === "normal",
      DEBUG_LITSHADERATE: this._debugMode === "litShadeRate",
      DEBUG_UV: this._debugMode === "uv",
      OUTLINE_WIDTH_SCREEN: this._isOutline && this._outlineWidthMode === MToonMaterialOutlineWidthMode.ScreenCoordinates
    };
  }
  _updateTextureMatrix(src, dst) {
    if (src.value) {
      if (src.value.matrixAutoUpdate) {
        src.value.updateMatrix();
      }
      dst.value.copy(src.value.matrix);
    }
  }
};
var POSSIBLE_SPEC_VERSIONS6 = /* @__PURE__ */ new Set(["1.0", "1.0-beta"]);
var _MToonMaterialLoaderPlugin = class _MToonMaterialLoaderPlugin2 {
  get name() {
    return _MToonMaterialLoaderPlugin2.EXTENSION_NAME;
  }
  constructor(parser, options = {}) {
    var _a, _b, _c, _d;
    this.parser = parser;
    this.materialType = (_a = options.materialType) != null ? _a : MToonMaterial;
    this.renderOrderOffset = (_b = options.renderOrderOffset) != null ? _b : 0;
    this.v0CompatShade = (_c = options.v0CompatShade) != null ? _c : false;
    this.debugMode = (_d = options.debugMode) != null ? _d : "none";
    this._mToonMaterialSet = /* @__PURE__ */ new Set();
  }
  beforeRoot() {
    return __async3(this, null, function* () {
      this._removeUnlitExtensionIfMToonExists();
    });
  }
  afterRoot(gltf) {
    return __async3(this, null, function* () {
      gltf.userData.vrmMToonMaterials = Array.from(this._mToonMaterialSet);
    });
  }
  getMaterialType(materialIndex) {
    const v1Extension = this._getMToonExtension(materialIndex);
    if (v1Extension) {
      return this.materialType;
    }
    return null;
  }
  extendMaterialParams(materialIndex, materialParams) {
    const extension = this._getMToonExtension(materialIndex);
    if (extension) {
      return this._extendMaterialParams(extension, materialParams);
    }
    return null;
  }
  loadMesh(meshIndex) {
    return __async3(this, null, function* () {
      var _a;
      const parser = this.parser;
      const json = parser.json;
      const meshDef = (_a = json.meshes) == null ? void 0 : _a[meshIndex];
      if (meshDef == null) {
        throw new Error(
          `MToonMaterialLoaderPlugin: Attempt to use meshes[${meshIndex}] of glTF but the mesh doesn't exist`
        );
      }
      const primitivesDef = meshDef.primitives;
      const meshOrGroup = yield parser.loadMesh(meshIndex);
      if (primitivesDef.length === 1) {
        const mesh = meshOrGroup;
        const materialIndex = primitivesDef[0].material;
        if (materialIndex != null) {
          this._setupPrimitive(mesh, materialIndex);
        }
      } else {
        const group = meshOrGroup;
        for (let i = 0; i < primitivesDef.length; i++) {
          const mesh = group.children[i];
          const materialIndex = primitivesDef[i].material;
          if (materialIndex != null) {
            this._setupPrimitive(mesh, materialIndex);
          }
        }
      }
      return meshOrGroup;
    });
  }
  /**
   * Delete use of `KHR_materials_unlit` from its `materials` if the material is using MToon.
   *
   * Since GLTFLoader have so many hardcoded procedure related to `KHR_materials_unlit`
   * we have to delete the extension before we start to parse the glTF.
   */
  _removeUnlitExtensionIfMToonExists() {
    const parser = this.parser;
    const json = parser.json;
    const materialDefs = json.materials;
    materialDefs == null ? void 0 : materialDefs.map((materialDef, iMaterial) => {
      var _a;
      const extension = this._getMToonExtension(iMaterial);
      if (extension && ((_a = materialDef.extensions) == null ? void 0 : _a["KHR_materials_unlit"])) {
        delete materialDef.extensions["KHR_materials_unlit"];
      }
    });
  }
  _getMToonExtension(materialIndex) {
    var _a, _b;
    const parser = this.parser;
    const json = parser.json;
    const materialDef = (_a = json.materials) == null ? void 0 : _a[materialIndex];
    if (materialDef == null) {
      console.warn(
        `MToonMaterialLoaderPlugin: Attempt to use materials[${materialIndex}] of glTF but the material doesn't exist`
      );
      return void 0;
    }
    const extension = (_b = materialDef.extensions) == null ? void 0 : _b[_MToonMaterialLoaderPlugin2.EXTENSION_NAME];
    if (extension == null) {
      return void 0;
    }
    const specVersion = extension.specVersion;
    if (!POSSIBLE_SPEC_VERSIONS6.has(specVersion)) {
      console.warn(
        `MToonMaterialLoaderPlugin: Unknown ${_MToonMaterialLoaderPlugin2.EXTENSION_NAME} specVersion "${specVersion}"`
      );
      return void 0;
    }
    return extension;
  }
  _extendMaterialParams(extension, materialParams) {
    return __async3(this, null, function* () {
      var _a;
      delete materialParams.metalness;
      delete materialParams.roughness;
      const assignHelper = new GLTFMToonMaterialParamsAssignHelper(this.parser, materialParams);
      assignHelper.assignPrimitive("transparentWithZWrite", extension.transparentWithZWrite);
      assignHelper.assignColor("shadeColorFactor", extension.shadeColorFactor);
      assignHelper.assignTexture("shadeMultiplyTexture", extension.shadeMultiplyTexture, true);
      assignHelper.assignPrimitive("shadingShiftFactor", extension.shadingShiftFactor);
      assignHelper.assignTexture("shadingShiftTexture", extension.shadingShiftTexture, true);
      assignHelper.assignPrimitive("shadingShiftTextureScale", (_a = extension.shadingShiftTexture) == null ? void 0 : _a.scale);
      assignHelper.assignPrimitive("shadingToonyFactor", extension.shadingToonyFactor);
      assignHelper.assignPrimitive("giEqualizationFactor", extension.giEqualizationFactor);
      assignHelper.assignColor("matcapFactor", extension.matcapFactor);
      assignHelper.assignTexture("matcapTexture", extension.matcapTexture, true);
      assignHelper.assignColor("parametricRimColorFactor", extension.parametricRimColorFactor);
      assignHelper.assignTexture("rimMultiplyTexture", extension.rimMultiplyTexture, true);
      assignHelper.assignPrimitive("rimLightingMixFactor", extension.rimLightingMixFactor);
      assignHelper.assignPrimitive("parametricRimFresnelPowerFactor", extension.parametricRimFresnelPowerFactor);
      assignHelper.assignPrimitive("parametricRimLiftFactor", extension.parametricRimLiftFactor);
      assignHelper.assignPrimitive("outlineWidthMode", extension.outlineWidthMode);
      assignHelper.assignPrimitive("outlineWidthFactor", extension.outlineWidthFactor);
      assignHelper.assignTexture("outlineWidthMultiplyTexture", extension.outlineWidthMultiplyTexture, false);
      assignHelper.assignColor("outlineColorFactor", extension.outlineColorFactor);
      assignHelper.assignPrimitive("outlineLightingMixFactor", extension.outlineLightingMixFactor);
      assignHelper.assignTexture("uvAnimationMaskTexture", extension.uvAnimationMaskTexture, false);
      assignHelper.assignPrimitive("uvAnimationScrollXSpeedFactor", extension.uvAnimationScrollXSpeedFactor);
      assignHelper.assignPrimitive("uvAnimationScrollYSpeedFactor", extension.uvAnimationScrollYSpeedFactor);
      assignHelper.assignPrimitive("uvAnimationRotationSpeedFactor", extension.uvAnimationRotationSpeedFactor);
      assignHelper.assignPrimitive("v0CompatShade", this.v0CompatShade);
      assignHelper.assignPrimitive("debugMode", this.debugMode);
      yield assignHelper.pending;
    });
  }
  /**
   * This will do two processes that is required to render MToon properly.
   *
   * - Set render order
   * - Generate outline
   *
   * @param mesh A target GLTF primitive
   * @param materialIndex The material index of the primitive
   */
  _setupPrimitive(mesh, materialIndex) {
    const extension = this._getMToonExtension(materialIndex);
    if (extension) {
      const renderOrder = this._parseRenderOrder(extension);
      mesh.renderOrder = renderOrder + this.renderOrderOffset;
      this._generateOutline(mesh);
      this._addToMaterialSet(mesh);
      return;
    }
  }
  /**
   * Check whether the material should generate outline or not.
   * @param surfaceMaterial The material to check
   * @returns True if the material should generate outline
   */
  _shouldGenerateOutline(surfaceMaterial) {
    return typeof surfaceMaterial.outlineWidthMode === "string" && surfaceMaterial.outlineWidthMode !== "none" && typeof surfaceMaterial.outlineWidthFactor === "number" && surfaceMaterial.outlineWidthFactor > 0;
  }
  /**
   * Generate outline for the given mesh, if it needs.
   *
   * @param mesh The target mesh
   */
  _generateOutline(mesh) {
    const surfaceMaterial = mesh.material;
    if (!(surfaceMaterial instanceof THREE52.Material)) {
      return;
    }
    if (!this._shouldGenerateOutline(surfaceMaterial)) {
      return;
    }
    mesh.material = [surfaceMaterial];
    const outlineMaterial = surfaceMaterial.clone();
    outlineMaterial.name += " (Outline)";
    outlineMaterial.isOutline = true;
    outlineMaterial.side = THREE52.BackSide;
    mesh.material.push(outlineMaterial);
    const geometry = mesh.geometry;
    const primitiveVertices = geometry.index ? geometry.index.count : geometry.attributes.position.count / 3;
    geometry.addGroup(0, primitiveVertices, 0);
    geometry.addGroup(0, primitiveVertices, 1);
  }
  _addToMaterialSet(mesh) {
    const materialOrMaterials = mesh.material;
    const materialSet = /* @__PURE__ */ new Set();
    if (Array.isArray(materialOrMaterials)) {
      materialOrMaterials.forEach((material) => materialSet.add(material));
    } else {
      materialSet.add(materialOrMaterials);
    }
    for (const material of materialSet) {
      this._mToonMaterialSet.add(material);
    }
  }
  _parseRenderOrder(extension) {
    var _a;
    const enabledZWrite = extension.transparentWithZWrite;
    return (enabledZWrite ? 0 : 19) + ((_a = extension.renderQueueOffsetNumber) != null ? _a : 0);
  }
};
_MToonMaterialLoaderPlugin.EXTENSION_NAME = "VRMC_materials_mtoon";
var MToonMaterialLoaderPlugin = _MToonMaterialLoaderPlugin;

// ../three-vrm-materials-hdr-emissive-multiplier/lib/three-vrm-materials-hdr-emissive-multiplier.module.js
var __async4 = (__this, __arguments, generator) => {
  return new Promise((resolve, reject) => {
    var fulfilled = (value) => {
      try {
        step(generator.next(value));
      } catch (e) {
        reject(e);
      }
    };
    var rejected = (value) => {
      try {
        step(generator.throw(value));
      } catch (e) {
        reject(e);
      }
    };
    var step = (x) => x.done ? resolve(x.value) : Promise.resolve(x.value).then(fulfilled, rejected);
    step((generator = generator.apply(__this, __arguments)).next());
  });
};
var _VRMMaterialsHDREmissiveMultiplierLoaderPlugin = class _VRMMaterialsHDREmissiveMultiplierLoaderPlugin2 {
  get name() {
    return _VRMMaterialsHDREmissiveMultiplierLoaderPlugin2.EXTENSION_NAME;
  }
  constructor(parser) {
    this.parser = parser;
  }
  extendMaterialParams(materialIndex, materialParams) {
    return __async4(this, null, function* () {
      const extension = this._getHDREmissiveMultiplierExtension(materialIndex);
      if (extension == null) {
        return;
      }
      console.warn(
        "VRMMaterialsHDREmissiveMultiplierLoaderPlugin: `VRMC_materials_hdr_emissiveMultiplier` is archived. Use `KHR_materials_emissive_strength` instead."
      );
      const emissiveMultiplier = extension.emissiveMultiplier;
      materialParams.emissiveIntensity = emissiveMultiplier;
    });
  }
  _getHDREmissiveMultiplierExtension(materialIndex) {
    var _a, _b;
    const parser = this.parser;
    const json = parser.json;
    const materialDef = (_a = json.materials) == null ? void 0 : _a[materialIndex];
    if (materialDef == null) {
      console.warn(
        `VRMMaterialsHDREmissiveMultiplierLoaderPlugin: Attempt to use materials[${materialIndex}] of glTF but the material doesn't exist`
      );
      return void 0;
    }
    const extension = (_b = materialDef.extensions) == null ? void 0 : _b[_VRMMaterialsHDREmissiveMultiplierLoaderPlugin2.EXTENSION_NAME];
    if (extension == null) {
      return void 0;
    }
    return extension;
  }
};
_VRMMaterialsHDREmissiveMultiplierLoaderPlugin.EXTENSION_NAME = "VRMC_materials_hdr_emissiveMultiplier";
var VRMMaterialsHDREmissiveMultiplierLoaderPlugin = _VRMMaterialsHDREmissiveMultiplierLoaderPlugin;

// ../three-vrm-materials-v0compat/lib/three-vrm-materials-v0compat.module.js
var THREE18 = __toESM(require("three"), 1);
var __defProp3 = Object.defineProperty;
var __defProps = Object.defineProperties;
var __getOwnPropDescs = Object.getOwnPropertyDescriptors;
var __getOwnPropSymbols2 = Object.getOwnPropertySymbols;
var __hasOwnProp3 = Object.prototype.hasOwnProperty;
var __propIsEnum2 = Object.prototype.propertyIsEnumerable;
var __defNormalProp2 = (obj, key, value) => key in obj ? __defProp3(obj, key, { enumerable: true, configurable: true, writable: true, value }) : obj[key] = value;
var __spreadValues2 = (a, b) => {
  for (var prop in b || (b = {}))
    if (__hasOwnProp3.call(b, prop))
      __defNormalProp2(a, prop, b[prop]);
  if (__getOwnPropSymbols2)
    for (var prop of __getOwnPropSymbols2(b)) {
      if (__propIsEnum2.call(b, prop))
        __defNormalProp2(a, prop, b[prop]);
    }
  return a;
};
var __spreadProps = (a, b) => __defProps(a, __getOwnPropDescs(b));
var __async5 = (__this, __arguments, generator) => {
  return new Promise((resolve, reject) => {
    var fulfilled = (value) => {
      try {
        step(generator.next(value));
      } catch (e) {
        reject(e);
      }
    };
    var rejected = (value) => {
      try {
        step(generator.throw(value));
      } catch (e) {
        reject(e);
      }
    };
    var step = (x) => x.done ? resolve(x.value) : Promise.resolve(x.value).then(fulfilled, rejected);
    step((generator = generator.apply(__this, __arguments)).next());
  });
};
function gammaEOTF(e) {
  return Math.pow(e, 2.2);
}
var VRMMaterialsV0CompatPlugin = class {
  get name() {
    return "VRMMaterialsV0CompatPlugin";
  }
  constructor(parser) {
    var _a;
    this.parser = parser;
    this._renderQueueMapTransparent = /* @__PURE__ */ new Map();
    this._renderQueueMapTransparentZWrite = /* @__PURE__ */ new Map();
    const json = this.parser.json;
    json.extensionsUsed = (_a = json.extensionsUsed) != null ? _a : [];
    if (json.extensionsUsed.indexOf("KHR_texture_transform") === -1) {
      json.extensionsUsed.push("KHR_texture_transform");
    }
  }
  beforeRoot() {
    return __async5(this, null, function* () {
      var _a;
      const json = this.parser.json;
      const v0VRMExtension = (_a = json.extensions) == null ? void 0 : _a["VRM"];
      const v0MaterialProperties = v0VRMExtension == null ? void 0 : v0VRMExtension.materialProperties;
      if (!v0MaterialProperties) {
        return;
      }
      this._populateRenderQueueMap(v0MaterialProperties);
      v0MaterialProperties.forEach((materialProperties, materialIndex) => {
        var _a2, _b;
        const materialDef = (_a2 = json.materials) == null ? void 0 : _a2[materialIndex];
        if (materialDef == null) {
          console.warn(
            `VRMMaterialsV0CompatPlugin: Attempt to use materials[${materialIndex}] of glTF but the material doesn't exist`
          );
          return;
        }
        if (materialProperties.shader === "VRM/MToon") {
          const material = this._parseV0MToonProperties(materialProperties, materialDef);
          json.materials[materialIndex] = material;
        } else if ((_b = materialProperties.shader) == null ? void 0 : _b.startsWith("VRM/Unlit")) {
          const material = this._parseV0UnlitProperties(materialProperties, materialDef);
          json.materials[materialIndex] = material;
        } else if (materialProperties.shader === "VRM_USE_GLTFSHADER") {
        } else {
          console.warn(`VRMMaterialsV0CompatPlugin: Unknown shader: ${materialProperties.shader}`);
        }
      });
    });
  }
  _parseV0MToonProperties(materialProperties, schemaMaterial) {
    var _a, _b, _c, _d, _e, _f, _g, _h, _i, _j, _k, _l, _m, _n, _o, _p, _q, _r, _s, _t, _u, _v, _w, _x, _y, _z, _A, _B, _C, _D, _E, _F, _G, _H, _I, _J, _K, _L, _M, _N, _O, _P, _Q, _R, _S, _T, _U, _V, _W, _X, _Y, _Z, __, _$, _aa;
    const isTransparent = (_b = (_a = materialProperties.keywordMap) == null ? void 0 : _a["_ALPHABLEND_ON"]) != null ? _b : false;
    const enabledZWrite = ((_c = materialProperties.floatProperties) == null ? void 0 : _c["_ZWrite"]) === 1;
    const transparentWithZWrite = enabledZWrite && isTransparent;
    const renderQueueOffsetNumber = this._v0ParseRenderQueue(materialProperties);
    const isCutoff = (_e = (_d = materialProperties.keywordMap) == null ? void 0 : _d["_ALPHATEST_ON"]) != null ? _e : false;
    const alphaMode = isTransparent ? "BLEND" : isCutoff ? "MASK" : "OPAQUE";
    const alphaCutoff = isCutoff ? (_g = (_f = materialProperties.floatProperties) == null ? void 0 : _f["_Cutoff"]) != null ? _g : 0.5 : void 0;
    const cullMode = (_i = (_h = materialProperties.floatProperties) == null ? void 0 : _h["_CullMode"]) != null ? _i : 2;
    const doubleSided = cullMode === 0;
    const textureTransformExt = this._portTextureTransform(materialProperties);
    const baseColorFactor = ((_k = (_j = materialProperties.vectorProperties) == null ? void 0 : _j["_Color"]) != null ? _k : [1, 1, 1, 1]).map(
      (v, i) => i === 3 ? v : gammaEOTF(v)
      // alpha channel is stored in linear
    );
    const baseColorTextureIndex = (_l = materialProperties.textureProperties) == null ? void 0 : _l["_MainTex"];
    const baseColorTexture = baseColorTextureIndex != null ? {
      index: baseColorTextureIndex,
      extensions: __spreadValues2({}, textureTransformExt)
    } : void 0;
    const normalTextureScale = (_n = (_m = materialProperties.floatProperties) == null ? void 0 : _m["_BumpScale"]) != null ? _n : 1;
    const normalTextureIndex = (_o = materialProperties.textureProperties) == null ? void 0 : _o["_BumpMap"];
    const normalTexture = normalTextureIndex != null ? {
      index: normalTextureIndex,
      scale: normalTextureScale,
      extensions: __spreadValues2({}, textureTransformExt)
    } : void 0;
    const emissiveFactor = ((_q = (_p = materialProperties.vectorProperties) == null ? void 0 : _p["_EmissionColor"]) != null ? _q : [0, 0, 0, 1]).map(
      gammaEOTF
    );
    const emissiveTextureIndex = (_r = materialProperties.textureProperties) == null ? void 0 : _r["_EmissionMap"];
    const emissiveTexture = emissiveTextureIndex != null ? {
      index: emissiveTextureIndex,
      extensions: __spreadValues2({}, textureTransformExt)
    } : void 0;
    const shadeColorFactor = ((_t = (_s = materialProperties.vectorProperties) == null ? void 0 : _s["_ShadeColor"]) != null ? _t : [0.97, 0.81, 0.86, 1]).map(
      gammaEOTF
    );
    const shadeMultiplyTextureIndex = (_u = materialProperties.textureProperties) == null ? void 0 : _u["_ShadeTexture"];
    const shadeMultiplyTexture = shadeMultiplyTextureIndex != null ? {
      index: shadeMultiplyTextureIndex,
      extensions: __spreadValues2({}, textureTransformExt)
    } : void 0;
    let shadingShiftFactor = (_w = (_v = materialProperties.floatProperties) == null ? void 0 : _v["_ShadeShift"]) != null ? _w : 0;
    let shadingToonyFactor = (_y = (_x = materialProperties.floatProperties) == null ? void 0 : _x["_ShadeToony"]) != null ? _y : 0.9;
    shadingToonyFactor = THREE18.MathUtils.lerp(shadingToonyFactor, 1, 0.5 + 0.5 * shadingShiftFactor);
    shadingShiftFactor = -shadingShiftFactor - (1 - shadingToonyFactor);
    const giIntensityFactor = (_A = (_z = materialProperties.floatProperties) == null ? void 0 : _z["_IndirectLightIntensity"]) != null ? _A : 0.1;
    const giEqualizationFactor = giIntensityFactor ? 1 - giIntensityFactor : void 0;
    const matcapTextureIndex = (_B = materialProperties.textureProperties) == null ? void 0 : _B["_SphereAdd"];
    const matcapFactor = matcapTextureIndex != null ? [1, 1, 1] : void 0;
    const matcapTexture = matcapTextureIndex != null ? {
      index: matcapTextureIndex
    } : void 0;
    const rimLightingMixFactor = (_D = (_C = materialProperties.floatProperties) == null ? void 0 : _C["_RimLightingMix"]) != null ? _D : 0;
    const rimMultiplyTextureIndex = (_E = materialProperties.textureProperties) == null ? void 0 : _E["_RimTexture"];
    const rimMultiplyTexture = rimMultiplyTextureIndex != null ? {
      index: rimMultiplyTextureIndex,
      extensions: __spreadValues2({}, textureTransformExt)
    } : void 0;
    const parametricRimColorFactor = ((_G = (_F = materialProperties.vectorProperties) == null ? void 0 : _F["_RimColor"]) != null ? _G : [0, 0, 0, 1]).map(
      gammaEOTF
    );
    const parametricRimFresnelPowerFactor = (_I = (_H = materialProperties.floatProperties) == null ? void 0 : _H["_RimFresnelPower"]) != null ? _I : 1;
    const parametricRimLiftFactor = (_K = (_J = materialProperties.floatProperties) == null ? void 0 : _J["_RimLift"]) != null ? _K : 0;
    const outlineWidthMode = ["none", "worldCoordinates", "screenCoordinates"][(_M = (_L = materialProperties.floatProperties) == null ? void 0 : _L["_OutlineWidthMode"]) != null ? _M : 0];
    let outlineWidthFactor = (_O = (_N = materialProperties.floatProperties) == null ? void 0 : _N["_OutlineWidth"]) != null ? _O : 0;
    outlineWidthFactor = 0.01 * outlineWidthFactor;
    const outlineWidthMultiplyTextureIndex = (_P = materialProperties.textureProperties) == null ? void 0 : _P["_OutlineWidthTexture"];
    const outlineWidthMultiplyTexture = outlineWidthMultiplyTextureIndex != null ? {
      index: outlineWidthMultiplyTextureIndex,
      extensions: __spreadValues2({}, textureTransformExt)
    } : void 0;
    const outlineColorFactor = ((_R = (_Q = materialProperties.vectorProperties) == null ? void 0 : _Q["_OutlineColor"]) != null ? _R : [0, 0, 0]).map(
      gammaEOTF
    );
    const outlineColorMode = (_T = (_S = materialProperties.floatProperties) == null ? void 0 : _S["_OutlineColorMode"]) != null ? _T : 0;
    const outlineLightingMixFactor = outlineColorMode === 1 ? (_V = (_U = materialProperties.floatProperties) == null ? void 0 : _U["_OutlineLightingMix"]) != null ? _V : 1 : 0;
    const uvAnimationMaskTextureIndex = (_W = materialProperties.textureProperties) == null ? void 0 : _W["_UvAnimMaskTexture"];
    const uvAnimationMaskTexture = uvAnimationMaskTextureIndex != null ? {
      index: uvAnimationMaskTextureIndex,
      extensions: __spreadValues2({}, textureTransformExt)
    } : void 0;
    const uvAnimationScrollXSpeedFactor = (_Y = (_X = materialProperties.floatProperties) == null ? void 0 : _X["_UvAnimScrollX"]) != null ? _Y : 0;
    let uvAnimationScrollYSpeedFactor = (__ = (_Z = materialProperties.floatProperties) == null ? void 0 : _Z["_UvAnimScrollY"]) != null ? __ : 0;
    if (uvAnimationScrollYSpeedFactor != null) {
      uvAnimationScrollYSpeedFactor = -uvAnimationScrollYSpeedFactor;
    }
    const uvAnimationRotationSpeedFactor = (_aa = (_$ = materialProperties.floatProperties) == null ? void 0 : _$["_UvAnimRotation"]) != null ? _aa : 0;
    const mtoonExtension = {
      specVersion: "1.0",
      transparentWithZWrite,
      renderQueueOffsetNumber,
      shadeColorFactor,
      shadeMultiplyTexture,
      shadingShiftFactor,
      shadingToonyFactor,
      giEqualizationFactor,
      matcapFactor,
      matcapTexture,
      rimLightingMixFactor,
      rimMultiplyTexture,
      parametricRimColorFactor,
      parametricRimFresnelPowerFactor,
      parametricRimLiftFactor,
      outlineWidthMode,
      outlineWidthFactor,
      outlineWidthMultiplyTexture,
      outlineColorFactor,
      outlineLightingMixFactor,
      uvAnimationMaskTexture,
      uvAnimationScrollXSpeedFactor,
      uvAnimationScrollYSpeedFactor,
      uvAnimationRotationSpeedFactor
    };
    return __spreadProps(__spreadValues2({}, schemaMaterial), {
      pbrMetallicRoughness: {
        baseColorFactor,
        baseColorTexture
      },
      normalTexture,
      emissiveTexture,
      emissiveFactor,
      alphaMode,
      alphaCutoff,
      doubleSided,
      extensions: {
        // eslint-disable-next-line @typescript-eslint/naming-convention
        VRMC_materials_mtoon: mtoonExtension
      }
    });
  }
  _parseV0UnlitProperties(materialProperties, schemaMaterial) {
    var _a, _b, _c, _d, _e;
    const isTransparentZWrite = materialProperties.shader === "VRM/UnlitTransparentZWrite";
    const isTransparent = materialProperties.shader === "VRM/UnlitTransparent" || isTransparentZWrite;
    const renderQueueOffsetNumber = this._v0ParseRenderQueue(materialProperties);
    const isCutoff = materialProperties.shader === "VRM/UnlitCutout";
    const alphaMode = isTransparent ? "BLEND" : isCutoff ? "MASK" : "OPAQUE";
    const alphaCutoff = isCutoff ? (_b = (_a = materialProperties.floatProperties) == null ? void 0 : _a["_Cutoff"]) != null ? _b : 0.5 : void 0;
    const textureTransformExt = this._portTextureTransform(materialProperties);
    const baseColorFactor = ((_d = (_c = materialProperties.vectorProperties) == null ? void 0 : _c["_Color"]) != null ? _d : [1, 1, 1, 1]).map(gammaEOTF);
    const baseColorTextureIndex = (_e = materialProperties.textureProperties) == null ? void 0 : _e["_MainTex"];
    const baseColorTexture = baseColorTextureIndex != null ? {
      index: baseColorTextureIndex,
      extensions: __spreadValues2({}, textureTransformExt)
    } : void 0;
    const mtoonExtension = {
      specVersion: "1.0",
      transparentWithZWrite: isTransparentZWrite,
      renderQueueOffsetNumber,
      shadeColorFactor: baseColorFactor,
      shadeMultiplyTexture: baseColorTexture
    };
    return __spreadProps(__spreadValues2({}, schemaMaterial), {
      pbrMetallicRoughness: {
        baseColorFactor,
        baseColorTexture
      },
      alphaMode,
      alphaCutoff,
      extensions: {
        // eslint-disable-next-line @typescript-eslint/naming-convention
        VRMC_materials_mtoon: mtoonExtension
      }
    });
  }
  /**
   * Create a glTF `KHR_texture_transform` extension from v0 texture transform info.
   */
  _portTextureTransform(materialProperties) {
    var _a, _b, _c, _d, _e;
    const textureTransform = (_a = materialProperties.vectorProperties) == null ? void 0 : _a["_MainTex"];
    if (textureTransform == null) {
      return {};
    }
    const offset = [(_b = textureTransform == null ? void 0 : textureTransform[0]) != null ? _b : 0, (_c = textureTransform == null ? void 0 : textureTransform[1]) != null ? _c : 0];
    const scale = [(_d = textureTransform == null ? void 0 : textureTransform[2]) != null ? _d : 1, (_e = textureTransform == null ? void 0 : textureTransform[3]) != null ? _e : 1];
    offset[1] = 1 - scale[1] - offset[1];
    return {
      // eslint-disable-next-line @typescript-eslint/naming-convention
      KHR_texture_transform: { offset, scale }
    };
  }
  /**
   * Convert v0 render order into v1 render order.
   * This uses a map from v0 render queue to v1 compliant render queue offset which is generated in {@link _populateRenderQueueMap}.
   */
  _v0ParseRenderQueue(materialProperties) {
    var _a, _b;
    const isTransparentZWrite = materialProperties.shader === "VRM/UnlitTransparentZWrite";
    const isTransparent = ((_a = materialProperties.keywordMap) == null ? void 0 : _a["_ALPHABLEND_ON"]) != void 0 || materialProperties.shader === "VRM/UnlitTransparent" || isTransparentZWrite;
    const enabledZWrite = ((_b = materialProperties.floatProperties) == null ? void 0 : _b["_ZWrite"]) === 1 || isTransparentZWrite;
    let offset = 0;
    if (isTransparent) {
      const v0Queue = materialProperties.renderQueue;
      if (v0Queue != null) {
        if (enabledZWrite) {
          offset = this._renderQueueMapTransparentZWrite.get(v0Queue);
        } else {
          offset = this._renderQueueMapTransparent.get(v0Queue);
        }
      }
    }
    return offset;
  }
  /**
   * Create a map which maps v0 render queue to v1 compliant render queue offset.
   * This lists up all render queues the model use and creates a map to new render queue offsets in the same order.
   */
  _populateRenderQueueMap(materialPropertiesList) {
    const renderQueuesTransparent = /* @__PURE__ */ new Set();
    const renderQueuesTransparentZWrite = /* @__PURE__ */ new Set();
    materialPropertiesList.forEach((materialProperties) => {
      var _a, _b;
      const isTransparentZWrite = materialProperties.shader === "VRM/UnlitTransparentZWrite";
      const isTransparent = ((_a = materialProperties.keywordMap) == null ? void 0 : _a["_ALPHABLEND_ON"]) != void 0 || materialProperties.shader === "VRM/UnlitTransparent" || isTransparentZWrite;
      const enabledZWrite = ((_b = materialProperties.floatProperties) == null ? void 0 : _b["_ZWrite"]) === 1 || isTransparentZWrite;
      if (isTransparent) {
        const v0Queue = materialProperties.renderQueue;
        if (v0Queue != null) {
          if (enabledZWrite) {
            renderQueuesTransparentZWrite.add(v0Queue);
          } else {
            renderQueuesTransparent.add(v0Queue);
          }
        }
      }
    });
    if (renderQueuesTransparent.size > 10) {
      console.warn(
        `VRMMaterialsV0CompatPlugin: This VRM uses ${renderQueuesTransparent.size} render queues for Transparent materials while VRM 1.0 only supports up to 10 render queues. The model might not be rendered correctly.`
      );
    }
    if (renderQueuesTransparentZWrite.size > 10) {
      console.warn(
        `VRMMaterialsV0CompatPlugin: This VRM uses ${renderQueuesTransparentZWrite.size} render queues for TransparentZWrite materials while VRM 1.0 only supports up to 10 render queues. The model might not be rendered correctly.`
      );
    }
    Array.from(renderQueuesTransparent).sort().forEach((queue, i) => {
      const newQueueOffset = Math.min(Math.max(i - renderQueuesTransparent.size + 1, -9), 0);
      this._renderQueueMapTransparent.set(queue, newQueueOffset);
    });
    Array.from(renderQueuesTransparentZWrite).sort().forEach((queue, i) => {
      const newQueueOffset = Math.min(Math.max(i, 0), 9);
      this._renderQueueMapTransparentZWrite.set(queue, newQueueOffset);
    });
  }
};

// ../three-vrm-node-constraint/lib/three-vrm-node-constraint.module.js
var THREE19 = __toESM(require("three"), 1);
var THREE33 = __toESM(require("three"), 1);
var THREE23 = __toESM(require("three"), 1);
var THREE43 = __toESM(require("three"), 1);
var THREE53 = __toESM(require("three"), 1);
var __async6 = (__this, __arguments, generator) => {
  return new Promise((resolve, reject) => {
    var fulfilled = (value) => {
      try {
        step(generator.next(value));
      } catch (e) {
        reject(e);
      }
    };
    var rejected = (value) => {
      try {
        step(generator.throw(value));
      } catch (e) {
        reject(e);
      }
    };
    var step = (x) => x.done ? resolve(x.value) : Promise.resolve(x.value).then(fulfilled, rejected);
    step((generator = generator.apply(__this, __arguments)).next());
  });
};
var _v3A6 = new THREE19.Vector3();
var VRMNodeConstraintHelper = class extends THREE19.Group {
  constructor(constraint) {
    super();
    this._attrPosition = new THREE19.BufferAttribute(new Float32Array([0, 0, 0, 0, 0, 0]), 3);
    this._attrPosition.setUsage(THREE19.DynamicDrawUsage);
    const geometry = new THREE19.BufferGeometry();
    geometry.setAttribute("position", this._attrPosition);
    const material = new THREE19.LineBasicMaterial({
      color: 16711935,
      depthTest: false,
      depthWrite: false
    });
    this._line = new THREE19.Line(geometry, material);
    this.add(this._line);
    this.constraint = constraint;
  }
  updateMatrixWorld(force) {
    _v3A6.setFromMatrixPosition(this.constraint.destination.matrixWorld);
    this._attrPosition.setXYZ(0, _v3A6.x, _v3A6.y, _v3A6.z);
    if (this.constraint.source) {
      _v3A6.setFromMatrixPosition(this.constraint.source.matrixWorld);
    }
    this._attrPosition.setXYZ(1, _v3A6.x, _v3A6.y, _v3A6.z);
    this._attrPosition.needsUpdate = true;
    super.updateMatrixWorld(force);
  }
};
function decomposePosition(matrix, target) {
  return target.set(matrix.elements[12], matrix.elements[13], matrix.elements[14]);
}
var _v3A22 = new THREE23.Vector3();
var _v3B4 = new THREE23.Vector3();
function decomposeRotation(matrix, target) {
  matrix.decompose(_v3A22, target, _v3B4);
  return target;
}
function quatInvertCompat2(target) {
  if (target.invert) {
    target.invert();
  } else {
    target.inverse();
  }
  return target;
}
var VRMNodeConstraint = class {
  /**
   * @param destination The destination object
   * @param source The source object
   */
  constructor(destination, source) {
    this.destination = destination;
    this.source = source;
    this.weight = 1;
  }
};
var _v3A32 = new THREE33.Vector3();
var _v3B22 = new THREE33.Vector3();
var _v3C2 = new THREE33.Vector3();
var _quatA7 = new THREE33.Quaternion();
var _quatB4 = new THREE33.Quaternion();
var _quatC2 = new THREE33.Quaternion();
var VRMAimConstraint = class extends VRMNodeConstraint {
  /**
   * The aim axis of the constraint.
   */
  get aimAxis() {
    return this._aimAxis;
  }
  /**
   * The aim axis of the constraint.
   */
  set aimAxis(aimAxis) {
    this._aimAxis = aimAxis;
    this._v3AimAxis.set(
      aimAxis === "PositiveX" ? 1 : aimAxis === "NegativeX" ? -1 : 0,
      aimAxis === "PositiveY" ? 1 : aimAxis === "NegativeY" ? -1 : 0,
      aimAxis === "PositiveZ" ? 1 : aimAxis === "NegativeZ" ? -1 : 0
    );
  }
  get dependencies() {
    const set = /* @__PURE__ */ new Set([this.source]);
    if (this.destination.parent) {
      set.add(this.destination.parent);
    }
    return set;
  }
  constructor(destination, source) {
    super(destination, source);
    this._aimAxis = "PositiveX";
    this._v3AimAxis = new THREE33.Vector3(1, 0, 0);
    this._dstRestQuat = new THREE33.Quaternion();
  }
  setInitState() {
    this._dstRestQuat.copy(this.destination.quaternion);
  }
  update() {
    this.destination.updateWorldMatrix(true, false);
    this.source.updateWorldMatrix(true, false);
    const dstParentWorldQuat = _quatA7.identity();
    const invDstParentWorldQuat = _quatB4.identity();
    if (this.destination.parent) {
      decomposeRotation(this.destination.parent.matrixWorld, dstParentWorldQuat);
      quatInvertCompat2(invDstParentWorldQuat.copy(dstParentWorldQuat));
    }
    const a0 = _v3A32.copy(this._v3AimAxis).applyQuaternion(this._dstRestQuat).applyQuaternion(dstParentWorldQuat);
    const a1 = decomposePosition(this.source.matrixWorld, _v3B22).sub(decomposePosition(this.destination.matrixWorld, _v3C2)).normalize();
    const targetQuat = _quatC2.setFromUnitVectors(a0, a1).premultiply(invDstParentWorldQuat).multiply(dstParentWorldQuat).multiply(this._dstRestQuat);
    this.destination.quaternion.copy(this._dstRestQuat).slerp(targetQuat, this.weight);
  }
};
function traverseAncestorsFromRoot(object, callback) {
  const ancestors = [object];
  let head = object.parent;
  while (head !== null) {
    ancestors.unshift(head);
    head = head.parent;
  }
  ancestors.forEach((ancestor) => {
    callback(ancestor);
  });
}
var VRMNodeConstraintManager = class {
  constructor() {
    this._constraints = /* @__PURE__ */ new Set();
    this._objectConstraintsMap = /* @__PURE__ */ new Map();
  }
  get constraints() {
    return this._constraints;
  }
  addConstraint(constraint) {
    this._constraints.add(constraint);
    let objectSet = this._objectConstraintsMap.get(constraint.destination);
    if (objectSet == null) {
      objectSet = /* @__PURE__ */ new Set();
      this._objectConstraintsMap.set(constraint.destination, objectSet);
    }
    objectSet.add(constraint);
  }
  deleteConstraint(constraint) {
    this._constraints.delete(constraint);
    const objectSet = this._objectConstraintsMap.get(constraint.destination);
    objectSet.delete(constraint);
  }
  setInitState() {
    const constraintsTried = /* @__PURE__ */ new Set();
    const constraintsDone = /* @__PURE__ */ new Set();
    for (const constraint of this._constraints) {
      this._processConstraint(constraint, constraintsTried, constraintsDone, (constraint2) => constraint2.setInitState());
    }
  }
  update() {
    const constraintsTried = /* @__PURE__ */ new Set();
    const constraintsDone = /* @__PURE__ */ new Set();
    for (const constraint of this._constraints) {
      this._processConstraint(constraint, constraintsTried, constraintsDone, (constraint2) => constraint2.update());
    }
  }
  /**
   * Update a constraint.
   * If there are other constraints that are dependant, it will try to update them recursively.
   * It might throw an error if there are circular dependencies.
   *
   * Intended to be used in {@link update} and {@link _processConstraint} itself recursively.
   *
   * @param constraint A constraint you want to update
   * @param constraintsTried Set of constraints that are already tried to be updated
   * @param constraintsDone Set of constraints that are already up to date
   */
  _processConstraint(constraint, constraintsTried, constraintsDone, callback) {
    if (constraintsDone.has(constraint)) {
      return;
    }
    if (constraintsTried.has(constraint)) {
      throw new Error("VRMNodeConstraintManager: Circular dependency detected while updating constraints");
    }
    constraintsTried.add(constraint);
    const depObjects = constraint.dependencies;
    for (const depObject of depObjects) {
      traverseAncestorsFromRoot(depObject, (depObjectAncestor) => {
        const objectSet = this._objectConstraintsMap.get(depObjectAncestor);
        if (objectSet) {
          for (const depConstraint of objectSet) {
            this._processConstraint(depConstraint, constraintsTried, constraintsDone, callback);
          }
        }
      });
    }
    callback(constraint);
    constraintsDone.add(constraint);
  }
};
var _quatA22 = new THREE43.Quaternion();
var _quatB22 = new THREE43.Quaternion();
var VRMRotationConstraint = class extends VRMNodeConstraint {
  get dependencies() {
    return /* @__PURE__ */ new Set([this.source]);
  }
  constructor(destination, source) {
    super(destination, source);
    this._dstRestQuat = new THREE43.Quaternion();
    this._invSrcRestQuat = new THREE43.Quaternion();
  }
  setInitState() {
    this._dstRestQuat.copy(this.destination.quaternion);
    quatInvertCompat2(this._invSrcRestQuat.copy(this.source.quaternion));
  }
  update() {
    const srcDeltaQuat = _quatA22.copy(this._invSrcRestQuat).multiply(this.source.quaternion);
    const targetQuat = _quatB22.copy(this._dstRestQuat).multiply(srcDeltaQuat);
    this.destination.quaternion.copy(this._dstRestQuat).slerp(targetQuat, this.weight);
  }
};
var _v3A42 = new THREE53.Vector3();
var _quatA32 = new THREE53.Quaternion();
var _quatB32 = new THREE53.Quaternion();
var VRMRollConstraint = class extends VRMNodeConstraint {
  /**
   * The roll axis of the constraint.
   */
  get rollAxis() {
    return this._rollAxis;
  }
  /**
   * The roll axis of the constraint.
   */
  set rollAxis(rollAxis) {
    this._rollAxis = rollAxis;
    this._v3RollAxis.set(rollAxis === "X" ? 1 : 0, rollAxis === "Y" ? 1 : 0, rollAxis === "Z" ? 1 : 0);
  }
  get dependencies() {
    return /* @__PURE__ */ new Set([this.source]);
  }
  constructor(destination, source) {
    super(destination, source);
    this._rollAxis = "X";
    this._v3RollAxis = new THREE53.Vector3(1, 0, 0);
    this._dstRestQuat = new THREE53.Quaternion();
    this._invDstRestQuat = new THREE53.Quaternion();
    this._invSrcRestQuatMulDstRestQuat = new THREE53.Quaternion();
  }
  setInitState() {
    this._dstRestQuat.copy(this.destination.quaternion);
    quatInvertCompat2(this._invDstRestQuat.copy(this._dstRestQuat));
    quatInvertCompat2(this._invSrcRestQuatMulDstRestQuat.copy(this.source.quaternion)).multiply(this._dstRestQuat);
  }
  update() {
    const quatDelta = _quatA32.copy(this._invDstRestQuat).multiply(this.source.quaternion).multiply(this._invSrcRestQuatMulDstRestQuat);
    const n1 = _v3A42.copy(this._v3RollAxis).applyQuaternion(quatDelta);
    const quatFromTo = _quatB32.setFromUnitVectors(n1, this._v3RollAxis);
    const targetQuat = quatFromTo.premultiply(this._dstRestQuat).multiply(quatDelta);
    this.destination.quaternion.copy(this._dstRestQuat).slerp(targetQuat, this.weight);
  }
};
var POSSIBLE_SPEC_VERSIONS7 = /* @__PURE__ */ new Set(["1.0", "1.0-beta"]);
var _VRMNodeConstraintLoaderPlugin = class _VRMNodeConstraintLoaderPlugin2 {
  get name() {
    return _VRMNodeConstraintLoaderPlugin2.EXTENSION_NAME;
  }
  constructor(parser, options) {
    this.parser = parser;
    this.helperRoot = options == null ? void 0 : options.helperRoot;
  }
  afterRoot(gltf) {
    return __async6(this, null, function* () {
      gltf.userData.vrmNodeConstraintManager = yield this._import(gltf);
    });
  }
  /**
   * Import constraints from a GLTF and returns a {@link VRMNodeConstraintManager}.
   * It might return `null` instead when it does not need to be created or something go wrong.
   *
   * @param gltf A parsed result of GLTF taken from GLTFLoader
   */
  _import(gltf) {
    return __async6(this, null, function* () {
      var _a;
      const json = this.parser.json;
      const isConstraintsUsed = ((_a = json.extensionsUsed) == null ? void 0 : _a.indexOf(_VRMNodeConstraintLoaderPlugin2.EXTENSION_NAME)) !== -1;
      if (!isConstraintsUsed) {
        return null;
      }
      const manager = new VRMNodeConstraintManager();
      const threeNodes = yield this.parser.getDependencies("node");
      threeNodes.forEach((node, nodeIndex) => {
        var _a2;
        const schemaNode = json.nodes[nodeIndex];
        const extension = (_a2 = schemaNode == null ? void 0 : schemaNode.extensions) == null ? void 0 : _a2[_VRMNodeConstraintLoaderPlugin2.EXTENSION_NAME];
        if (extension == null) {
          return;
        }
        const specVersion = extension.specVersion;
        if (!POSSIBLE_SPEC_VERSIONS7.has(specVersion)) {
          console.warn(
            `VRMNodeConstraintLoaderPlugin: Unknown ${_VRMNodeConstraintLoaderPlugin2.EXTENSION_NAME} specVersion "${specVersion}"`
          );
          return;
        }
        const constraintDef = extension.constraint;
        if (constraintDef.roll != null) {
          const constraint = this._importRollConstraint(node, threeNodes, constraintDef.roll);
          manager.addConstraint(constraint);
        } else if (constraintDef.aim != null) {
          const constraint = this._importAimConstraint(node, threeNodes, constraintDef.aim);
          manager.addConstraint(constraint);
        } else if (constraintDef.rotation != null) {
          const constraint = this._importRotationConstraint(node, threeNodes, constraintDef.rotation);
          manager.addConstraint(constraint);
        }
      });
      gltf.scene.updateMatrixWorld();
      manager.setInitState();
      return manager;
    });
  }
  _importRollConstraint(destination, nodes, rollConstraintDef) {
    const { source: sourceIndex, rollAxis, weight } = rollConstraintDef;
    const source = nodes[sourceIndex];
    const constraint = new VRMRollConstraint(destination, source);
    if (rollAxis != null) {
      constraint.rollAxis = rollAxis;
    }
    if (weight != null) {
      constraint.weight = weight;
    }
    if (this.helperRoot) {
      const helper = new VRMNodeConstraintHelper(constraint);
      this.helperRoot.add(helper);
    }
    return constraint;
  }
  _importAimConstraint(destination, nodes, aimConstraintDef) {
    const { source: sourceIndex, aimAxis, weight } = aimConstraintDef;
    const source = nodes[sourceIndex];
    const constraint = new VRMAimConstraint(destination, source);
    if (aimAxis != null) {
      constraint.aimAxis = aimAxis;
    }
    if (weight != null) {
      constraint.weight = weight;
    }
    if (this.helperRoot) {
      const helper = new VRMNodeConstraintHelper(constraint);
      this.helperRoot.add(helper);
    }
    return constraint;
  }
  _importRotationConstraint(destination, nodes, rotationConstraintDef) {
    const { source: sourceIndex, weight } = rotationConstraintDef;
    const source = nodes[sourceIndex];
    const constraint = new VRMRotationConstraint(destination, source);
    if (weight != null) {
      constraint.weight = weight;
    }
    if (this.helperRoot) {
      const helper = new VRMNodeConstraintHelper(constraint);
      this.helperRoot.add(helper);
    }
    return constraint;
  }
};
_VRMNodeConstraintLoaderPlugin.EXTENSION_NAME = "VRMC_node_constraint";
var VRMNodeConstraintLoaderPlugin = _VRMNodeConstraintLoaderPlugin;

// ../three-vrm-springbone/lib/three-vrm-springbone.module.js
var THREE72 = __toESM(require("three"), 1);
var THREE20 = __toESM(require("three"), 1);
var THREE24 = __toESM(require("three"), 1);
var THREE34 = __toESM(require("three"), 1);
var THREE44 = __toESM(require("three"), 1);
var THREE54 = __toESM(require("three"), 1);
var THREE62 = __toESM(require("three"), 1);
var THREE92 = __toESM(require("three"), 1);
var THREE82 = __toESM(require("three"), 1);
var THREE102 = __toESM(require("three"), 1);
var THREE132 = __toESM(require("three"), 1);
var THREE112 = __toESM(require("three"), 1);
var THREE122 = __toESM(require("three"), 1);
var THREE142 = __toESM(require("three"), 1);
var __async7 = (__this, __arguments, generator) => {
  return new Promise((resolve, reject) => {
    var fulfilled = (value) => {
      try {
        step(generator.next(value));
      } catch (e) {
        reject(e);
      }
    };
    var rejected = (value) => {
      try {
        step(generator.throw(value));
      } catch (e) {
        reject(e);
      }
    };
    var step = (x) => x.done ? resolve(x.value) : Promise.resolve(x.value).then(fulfilled, rejected);
    step((generator = generator.apply(__this, __arguments)).next());
  });
};
var VRMSpringBoneColliderShape = class {
};
var _v3A7 = new THREE20.Vector3();
var _v3B5 = new THREE20.Vector3();
var VRMSpringBoneColliderShapeCapsule = class extends VRMSpringBoneColliderShape {
  get type() {
    return "capsule";
  }
  constructor(params) {
    var _a, _b, _c, _d;
    super();
    this.offset = (_a = params == null ? void 0 : params.offset) != null ? _a : new THREE20.Vector3(0, 0, 0);
    this.tail = (_b = params == null ? void 0 : params.tail) != null ? _b : new THREE20.Vector3(0, 0, 0);
    this.radius = (_c = params == null ? void 0 : params.radius) != null ? _c : 0;
    this.inside = (_d = params == null ? void 0 : params.inside) != null ? _d : false;
  }
  calculateCollision(colliderMatrix, objectPosition, objectRadius, target) {
    _v3A7.copy(this.offset).applyMatrix4(colliderMatrix);
    _v3B5.copy(this.tail).applyMatrix4(colliderMatrix);
    _v3B5.sub(_v3A7);
    const lengthSqCapsule = _v3B5.lengthSq();
    target.copy(objectPosition).sub(_v3A7);
    const dot = _v3B5.dot(target);
    if (dot <= 0) {
    } else if (lengthSqCapsule <= dot) {
      target.sub(_v3B5);
    } else {
      _v3B5.multiplyScalar(dot / lengthSqCapsule);
      target.sub(_v3B5);
    }
    const distance = this.inside ? this.radius - objectRadius - target.length() : target.length() - objectRadius - this.radius;
    target.normalize();
    if (this.inside) {
      target.negate();
    }
    return distance;
  }
};
var _v3A23 = new THREE24.Vector3();
var _mat3A = new THREE24.Matrix3();
var VRMSpringBoneColliderShapePlane = class extends VRMSpringBoneColliderShape {
  get type() {
    return "plane";
  }
  constructor(params) {
    var _a, _b;
    super();
    this.offset = (_a = params == null ? void 0 : params.offset) != null ? _a : new THREE24.Vector3(0, 0, 0);
    this.normal = (_b = params == null ? void 0 : params.normal) != null ? _b : new THREE24.Vector3(0, 0, 1);
  }
  calculateCollision(colliderMatrix, objectPosition, objectRadius, target) {
    target.copy(this.offset).applyMatrix4(colliderMatrix);
    target.negate().add(objectPosition);
    _mat3A.getNormalMatrix(colliderMatrix);
    _v3A23.copy(this.normal).applyNormalMatrix(_mat3A).normalize();
    const distance = target.dot(_v3A23) - objectRadius;
    target.copy(_v3A23);
    return distance;
  }
};
var VRMSpringBoneColliderShapeSphere = class extends VRMSpringBoneColliderShape {
  get type() {
    return "sphere";
  }
  constructor(params) {
    var _a, _b, _c;
    super();
    this.offset = (_a = params == null ? void 0 : params.offset) != null ? _a : new THREE34.Vector3(0, 0, 0);
    this.radius = (_b = params == null ? void 0 : params.radius) != null ? _b : 0;
    this.inside = (_c = params == null ? void 0 : params.inside) != null ? _c : false;
  }
  calculateCollision(colliderMatrix, objectPosition, objectRadius, target) {
    target.copy(this.offset).applyMatrix4(colliderMatrix);
    target.negate().add(objectPosition);
    const distance = this.inside ? this.radius - objectRadius - target.length() : target.length() - objectRadius - this.radius;
    target.normalize();
    if (this.inside) {
      target.negate();
    }
    return distance;
  }
};
var _v3A33 = new THREE44.Vector3();
var ColliderShapeCapsuleBufferGeometry = class extends THREE44.BufferGeometry {
  constructor(shape) {
    super();
    this.worldScale = 1;
    this._currentRadius = 0;
    this._currentOffset = new THREE44.Vector3();
    this._currentTail = new THREE44.Vector3();
    this._shape = shape;
    this._attrPos = new THREE44.BufferAttribute(new Float32Array(396), 3);
    this.setAttribute("position", this._attrPos);
    this._attrIndex = new THREE44.BufferAttribute(new Uint16Array(264), 1);
    this.setIndex(this._attrIndex);
    this._buildIndex();
    this.update();
  }
  update() {
    let shouldUpdateGeometry = false;
    const radius = this._shape.radius / this.worldScale;
    if (this._currentRadius !== radius) {
      this._currentRadius = radius;
      shouldUpdateGeometry = true;
    }
    if (!this._currentOffset.equals(this._shape.offset)) {
      this._currentOffset.copy(this._shape.offset);
      shouldUpdateGeometry = true;
    }
    const tail = _v3A33.copy(this._shape.tail).divideScalar(this.worldScale);
    if (this._currentTail.distanceToSquared(tail) > 1e-10) {
      this._currentTail.copy(tail);
      shouldUpdateGeometry = true;
    }
    if (shouldUpdateGeometry) {
      this._buildPosition();
    }
  }
  _buildPosition() {
    _v3A33.copy(this._currentTail).sub(this._currentOffset);
    const l = _v3A33.length() / this._currentRadius;
    for (let i = 0; i <= 16; i++) {
      const t = i / 16 * Math.PI;
      this._attrPos.setXYZ(i, -Math.sin(t), -Math.cos(t), 0);
      this._attrPos.setXYZ(17 + i, l + Math.sin(t), Math.cos(t), 0);
      this._attrPos.setXYZ(34 + i, -Math.sin(t), 0, -Math.cos(t));
      this._attrPos.setXYZ(51 + i, l + Math.sin(t), 0, Math.cos(t));
    }
    for (let i = 0; i < 32; i++) {
      const t = i / 16 * Math.PI;
      this._attrPos.setXYZ(68 + i, 0, Math.sin(t), Math.cos(t));
      this._attrPos.setXYZ(100 + i, l, Math.sin(t), Math.cos(t));
    }
    const theta = Math.atan2(_v3A33.y, Math.sqrt(_v3A33.x * _v3A33.x + _v3A33.z * _v3A33.z));
    const phi = -Math.atan2(_v3A33.z, _v3A33.x);
    this.rotateZ(theta);
    this.rotateY(phi);
    this.scale(this._currentRadius, this._currentRadius, this._currentRadius);
    this.translate(this._currentOffset.x, this._currentOffset.y, this._currentOffset.z);
    this._attrPos.needsUpdate = true;
  }
  _buildIndex() {
    for (let i = 0; i < 34; i++) {
      const i1 = (i + 1) % 34;
      this._attrIndex.setXY(i * 2, i, i1);
      this._attrIndex.setXY(68 + i * 2, 34 + i, 34 + i1);
    }
    for (let i = 0; i < 32; i++) {
      const i1 = (i + 1) % 32;
      this._attrIndex.setXY(136 + i * 2, 68 + i, 68 + i1);
      this._attrIndex.setXY(200 + i * 2, 100 + i, 100 + i1);
    }
    this._attrIndex.needsUpdate = true;
  }
};
var ColliderShapePlaneBufferGeometry = class extends THREE54.BufferGeometry {
  constructor(shape) {
    super();
    this.worldScale = 1;
    this._currentOffset = new THREE54.Vector3();
    this._currentNormal = new THREE54.Vector3();
    this._shape = shape;
    this._attrPos = new THREE54.BufferAttribute(new Float32Array(6 * 3), 3);
    this.setAttribute("position", this._attrPos);
    this._attrIndex = new THREE54.BufferAttribute(new Uint16Array(10), 1);
    this.setIndex(this._attrIndex);
    this._buildIndex();
    this.update();
  }
  update() {
    let shouldUpdateGeometry = false;
    if (!this._currentOffset.equals(this._shape.offset)) {
      this._currentOffset.copy(this._shape.offset);
      shouldUpdateGeometry = true;
    }
    if (!this._currentNormal.equals(this._shape.normal)) {
      this._currentNormal.copy(this._shape.normal);
      shouldUpdateGeometry = true;
    }
    if (shouldUpdateGeometry) {
      this._buildPosition();
    }
  }
  _buildPosition() {
    this._attrPos.setXYZ(0, -0.5, -0.5, 0);
    this._attrPos.setXYZ(1, 0.5, -0.5, 0);
    this._attrPos.setXYZ(2, 0.5, 0.5, 0);
    this._attrPos.setXYZ(3, -0.5, 0.5, 0);
    this._attrPos.setXYZ(4, 0, 0, 0);
    this._attrPos.setXYZ(5, 0, 0, 0.25);
    this.translate(this._currentOffset.x, this._currentOffset.y, this._currentOffset.z);
    this.lookAt(this._currentNormal);
    this._attrPos.needsUpdate = true;
  }
  _buildIndex() {
    this._attrIndex.setXY(0, 0, 1);
    this._attrIndex.setXY(2, 1, 2);
    this._attrIndex.setXY(4, 2, 3);
    this._attrIndex.setXY(6, 3, 0);
    this._attrIndex.setXY(8, 4, 5);
    this._attrIndex.needsUpdate = true;
  }
};
var ColliderShapeSphereBufferGeometry = class extends THREE62.BufferGeometry {
  constructor(shape) {
    super();
    this.worldScale = 1;
    this._currentRadius = 0;
    this._currentOffset = new THREE62.Vector3();
    this._shape = shape;
    this._attrPos = new THREE62.BufferAttribute(new Float32Array(32 * 3 * 3), 3);
    this.setAttribute("position", this._attrPos);
    this._attrIndex = new THREE62.BufferAttribute(new Uint16Array(64 * 3), 1);
    this.setIndex(this._attrIndex);
    this._buildIndex();
    this.update();
  }
  update() {
    let shouldUpdateGeometry = false;
    const radius = this._shape.radius / this.worldScale;
    if (this._currentRadius !== radius) {
      this._currentRadius = radius;
      shouldUpdateGeometry = true;
    }
    if (!this._currentOffset.equals(this._shape.offset)) {
      this._currentOffset.copy(this._shape.offset);
      shouldUpdateGeometry = true;
    }
    if (shouldUpdateGeometry) {
      this._buildPosition();
    }
  }
  _buildPosition() {
    for (let i = 0; i < 32; i++) {
      const t = i / 16 * Math.PI;
      this._attrPos.setXYZ(i, Math.cos(t), Math.sin(t), 0);
      this._attrPos.setXYZ(32 + i, 0, Math.cos(t), Math.sin(t));
      this._attrPos.setXYZ(64 + i, Math.sin(t), 0, Math.cos(t));
    }
    this.scale(this._currentRadius, this._currentRadius, this._currentRadius);
    this.translate(this._currentOffset.x, this._currentOffset.y, this._currentOffset.z);
    this._attrPos.needsUpdate = true;
  }
  _buildIndex() {
    for (let i = 0; i < 32; i++) {
      const i1 = (i + 1) % 32;
      this._attrIndex.setXY(i * 2, i, i1);
      this._attrIndex.setXY(64 + i * 2, 32 + i, 32 + i1);
      this._attrIndex.setXY(128 + i * 2, 64 + i, 64 + i1);
    }
    this._attrIndex.needsUpdate = true;
  }
};
var _v3A43 = new THREE72.Vector3();
var VRMSpringBoneColliderHelper = class extends THREE72.Group {
  constructor(collider) {
    super();
    this.matrixAutoUpdate = false;
    this.collider = collider;
    if (this.collider.shape instanceof VRMSpringBoneColliderShapeSphere) {
      this._geometry = new ColliderShapeSphereBufferGeometry(this.collider.shape);
    } else if (this.collider.shape instanceof VRMSpringBoneColliderShapeCapsule) {
      this._geometry = new ColliderShapeCapsuleBufferGeometry(this.collider.shape);
    } else if (this.collider.shape instanceof VRMSpringBoneColliderShapePlane) {
      this._geometry = new ColliderShapePlaneBufferGeometry(this.collider.shape);
    } else {
      throw new Error("VRMSpringBoneColliderHelper: Unknown collider shape type detected");
    }
    const material = new THREE72.LineBasicMaterial({
      color: 16711935,
      depthTest: false,
      depthWrite: false
    });
    this._line = new THREE72.LineSegments(this._geometry, material);
    this.add(this._line);
  }
  dispose() {
    this._geometry.dispose();
  }
  updateMatrixWorld(force) {
    this.collider.updateWorldMatrix(true, false);
    this.matrix.copy(this.collider.matrixWorld);
    const matrixWorldElements = this.matrix.elements;
    this._geometry.worldScale = _v3A43.set(matrixWorldElements[0], matrixWorldElements[1], matrixWorldElements[2]).length();
    this._geometry.update();
    super.updateMatrixWorld(force);
  }
};
var SpringBoneBufferGeometry = class extends THREE82.BufferGeometry {
  constructor(springBone) {
    super();
    this.worldScale = 1;
    this._currentRadius = 0;
    this._currentTail = new THREE82.Vector3();
    this._springBone = springBone;
    this._attrPos = new THREE82.BufferAttribute(new Float32Array(294), 3);
    this.setAttribute("position", this._attrPos);
    this._attrIndex = new THREE82.BufferAttribute(new Uint16Array(194), 1);
    this.setIndex(this._attrIndex);
    this._buildIndex();
    this.update();
  }
  update() {
    let shouldUpdateGeometry = false;
    const radius = this._springBone.settings.hitRadius / this.worldScale;
    if (this._currentRadius !== radius) {
      this._currentRadius = radius;
      shouldUpdateGeometry = true;
    }
    if (!this._currentTail.equals(this._springBone.initialLocalChildPosition)) {
      this._currentTail.copy(this._springBone.initialLocalChildPosition);
      shouldUpdateGeometry = true;
    }
    if (shouldUpdateGeometry) {
      this._buildPosition();
    }
  }
  _buildPosition() {
    for (let i = 0; i < 32; i++) {
      const t = i / 16 * Math.PI;
      this._attrPos.setXYZ(i, Math.cos(t), Math.sin(t), 0);
      this._attrPos.setXYZ(32 + i, 0, Math.cos(t), Math.sin(t));
      this._attrPos.setXYZ(64 + i, Math.sin(t), 0, Math.cos(t));
    }
    this.scale(this._currentRadius, this._currentRadius, this._currentRadius);
    this.translate(this._currentTail.x, this._currentTail.y, this._currentTail.z);
    this._attrPos.setXYZ(96, 0, 0, 0);
    this._attrPos.setXYZ(97, this._currentTail.x, this._currentTail.y, this._currentTail.z);
    this._attrPos.needsUpdate = true;
  }
  _buildIndex() {
    for (let i = 0; i < 32; i++) {
      const i1 = (i + 1) % 32;
      this._attrIndex.setXY(i * 2, i, i1);
      this._attrIndex.setXY(64 + i * 2, 32 + i, 32 + i1);
      this._attrIndex.setXY(128 + i * 2, 64 + i, 64 + i1);
    }
    this._attrIndex.setXY(192, 96, 97);
    this._attrIndex.needsUpdate = true;
  }
};
var _v3A52 = new THREE92.Vector3();
var VRMSpringBoneJointHelper = class extends THREE92.Group {
  constructor(springBone) {
    super();
    this.matrixAutoUpdate = false;
    this.springBone = springBone;
    this._geometry = new SpringBoneBufferGeometry(this.springBone);
    const material = new THREE92.LineBasicMaterial({
      color: 16776960,
      depthTest: false,
      depthWrite: false
    });
    this._line = new THREE92.LineSegments(this._geometry, material);
    this.add(this._line);
  }
  dispose() {
    this._geometry.dispose();
  }
  updateMatrixWorld(force) {
    this.springBone.bone.updateWorldMatrix(true, false);
    this.matrix.copy(this.springBone.bone.matrixWorld);
    const matrixWorldElements = this.matrix.elements;
    this._geometry.worldScale = _v3A52.set(matrixWorldElements[0], matrixWorldElements[1], matrixWorldElements[2]).length();
    this._geometry.update();
    super.updateMatrixWorld(force);
  }
};
var VRMSpringBoneCollider = class extends THREE102.Object3D {
  constructor(shape) {
    super();
    this.shape = shape;
  }
};
var _matA = new THREE112.Matrix4();
function mat4InvertCompat(target) {
  if (target.invert) {
    target.invert();
  } else {
    target.getInverse(_matA.copy(target));
  }
  return target;
}
var Matrix4InverseCache = class {
  constructor(matrix) {
    this._inverseCache = new THREE122.Matrix4();
    this._shouldUpdateInverse = true;
    this.matrix = matrix;
    const handler = {
      set: (obj, prop, newVal) => {
        this._shouldUpdateInverse = true;
        obj[prop] = newVal;
        return true;
      }
    };
    this._originalElements = matrix.elements;
    matrix.elements = new Proxy(matrix.elements, handler);
  }
  /**
   * Inverse of given matrix.
   * Note that it will return its internal private instance.
   * Make sure copying this before mutate this.
   */
  get inverse() {
    if (this._shouldUpdateInverse) {
      mat4InvertCompat(this._inverseCache.copy(this.matrix));
      this._shouldUpdateInverse = false;
    }
    return this._inverseCache;
  }
  revert() {
    this.matrix.elements = this._originalElements;
  }
};
var IDENTITY_MATRIX4 = new THREE132.Matrix4();
var _v3A62 = new THREE132.Vector3();
var _v3B23 = new THREE132.Vector3();
var _v3C3 = new THREE132.Vector3();
var _worldSpacePosition = new THREE132.Vector3();
var _centerSpacePosition = new THREE132.Vector3();
var _nextTail = new THREE132.Vector3();
var _quatA8 = new THREE132.Quaternion();
var _matA2 = new THREE132.Matrix4();
var _matB = new THREE132.Matrix4();
var VRMSpringBoneJoint = class {
  /**
   * Create a new VRMSpringBone.
   *
   * @param bone An Object3D that will be attached to this bone
   * @param child An Object3D that will be used as a tail of this spring bone. It can be null when the spring bone is imported from VRM 0.0
   * @param settings Several parameters related to behavior of the spring bone
   * @param colliderGroups Collider groups that will be collided with this spring bone
   */
  constructor(bone, child, settings = {}, colliderGroups = []) {
    this._currentTail = new THREE132.Vector3();
    this._prevTail = new THREE132.Vector3();
    this._boneAxis = new THREE132.Vector3();
    this._worldSpaceBoneLength = 0;
    this._center = null;
    this._initialLocalMatrix = new THREE132.Matrix4();
    this._initialLocalRotation = new THREE132.Quaternion();
    this._initialLocalChildPosition = new THREE132.Vector3();
    var _a, _b, _c, _d, _e, _f;
    this.bone = bone;
    this.bone.matrixAutoUpdate = false;
    this.child = child;
    this.settings = {
      hitRadius: (_a = settings.hitRadius) != null ? _a : 0,
      stiffness: (_b = settings.stiffness) != null ? _b : 1,
      gravityPower: (_c = settings.gravityPower) != null ? _c : 0,
      gravityDir: (_e = (_d = settings.gravityDir) == null ? void 0 : _d.clone()) != null ? _e : new THREE132.Vector3(0, -1, 0),
      dragForce: (_f = settings.dragForce) != null ? _f : 0.4
    };
    this.colliderGroups = colliderGroups;
  }
  get center() {
    return this._center;
  }
  set center(center) {
    var _a;
    if ((_a = this._center) == null ? void 0 : _a.userData.inverseCacheProxy) {
      this._center.userData.inverseCacheProxy.revert();
      delete this._center.userData.inverseCacheProxy;
    }
    this._center = center;
    if (this._center) {
      if (!this._center.userData.inverseCacheProxy) {
        this._center.userData.inverseCacheProxy = new Matrix4InverseCache(this._center.matrixWorld);
      }
    }
  }
  get initialLocalChildPosition() {
    return this._initialLocalChildPosition;
  }
  /**
   * Returns the world matrix of its parent object.
   * Note that it returns a reference to the matrix. Don't mutate this directly!
   */
  get _parentMatrixWorld() {
    return this.bone.parent ? this.bone.parent.matrixWorld : IDENTITY_MATRIX4;
  }
  /**
   * Set the initial state of this spring bone.
   * You might want to call {@link VRMSpringBoneManager.setInitState} instead.
   */
  setInitState() {
    this._initialLocalMatrix.copy(this.bone.matrix);
    this._initialLocalRotation.copy(this.bone.quaternion);
    if (this.child) {
      this._initialLocalChildPosition.copy(this.child.position);
    } else {
      this._initialLocalChildPosition.copy(this.bone.position).normalize().multiplyScalar(0.07);
    }
    const matrixWorldToCenter = this._getMatrixWorldToCenter(_matA2);
    this.bone.localToWorld(this._currentTail.copy(this._initialLocalChildPosition)).applyMatrix4(matrixWorldToCenter);
    this._prevTail.copy(this._currentTail);
    this._boneAxis.copy(this._initialLocalChildPosition).normalize();
  }
  /**
   * Reset the state of this bone.
   * You might want to call [[VRMSpringBoneManager.reset]] instead.
   */
  reset() {
    this.bone.quaternion.copy(this._initialLocalRotation);
    this.bone.updateMatrix();
    this.bone.matrixWorld.multiplyMatrices(this._parentMatrixWorld, this.bone.matrix);
    const matrixWorldToCenter = this._getMatrixWorldToCenter(_matA2);
    this.bone.localToWorld(this._currentTail.copy(this._initialLocalChildPosition)).applyMatrix4(matrixWorldToCenter);
    this._prevTail.copy(this._currentTail);
  }
  /**
   * Update the state of this bone.
   * You might want to call [[VRMSpringBoneManager.update]] instead.
   *
   * @param delta deltaTime
   */
  update(delta) {
    if (delta <= 0) return;
    this._calcWorldSpaceBoneLength();
    _worldSpacePosition.setFromMatrixPosition(this.bone.matrixWorld);
    let matrixWorldToCenter = this._getMatrixWorldToCenter(_matA2);
    _centerSpacePosition.copy(_worldSpacePosition).applyMatrix4(matrixWorldToCenter);
    const quatWorldToCenter = _quatA8.setFromRotationMatrix(matrixWorldToCenter);
    const centerSpaceParentMatrix = _matB.copy(matrixWorldToCenter).multiply(this._parentMatrixWorld);
    const centerSpaceBoneAxis = _v3B23.copy(this._boneAxis).applyMatrix4(this._initialLocalMatrix).applyMatrix4(centerSpaceParentMatrix).sub(_centerSpacePosition).normalize();
    const centerSpaceGravity = _v3C3.copy(this.settings.gravityDir).applyQuaternion(quatWorldToCenter).normalize();
    const matrixCenterToWorld = this._getMatrixCenterToWorld(_matA2);
    _nextTail.copy(this._currentTail).add(
      _v3A62.copy(this._currentTail).sub(this._prevTail).multiplyScalar(1 - this.settings.dragForce)
    ).add(_v3A62.copy(centerSpaceBoneAxis).multiplyScalar(this.settings.stiffness * delta)).add(_v3A62.copy(centerSpaceGravity).multiplyScalar(this.settings.gravityPower * delta)).applyMatrix4(matrixCenterToWorld);
    _nextTail.sub(_worldSpacePosition).normalize().multiplyScalar(this._worldSpaceBoneLength).add(_worldSpacePosition);
    this._collision(_nextTail);
    matrixWorldToCenter = this._getMatrixWorldToCenter(_matA2);
    this._prevTail.copy(this._currentTail);
    this._currentTail.copy(_v3A62.copy(_nextTail).applyMatrix4(matrixWorldToCenter));
    const worldSpaceInitialMatrixInv = mat4InvertCompat(
      _matA2.copy(this._parentMatrixWorld).multiply(this._initialLocalMatrix)
    );
    const applyRotation = _quatA8.setFromUnitVectors(
      this._boneAxis,
      _v3A62.copy(_nextTail).applyMatrix4(worldSpaceInitialMatrixInv).normalize()
    );
    this.bone.quaternion.copy(this._initialLocalRotation).multiply(applyRotation);
    this.bone.updateMatrix();
    this.bone.matrixWorld.multiplyMatrices(this._parentMatrixWorld, this.bone.matrix);
  }
  /**
   * Do collision math against every colliders attached to this bone.
   *
   * @param tail The tail you want to process
   */
  _collision(tail) {
    this.colliderGroups.forEach((colliderGroup) => {
      colliderGroup.colliders.forEach((collider) => {
        const dist = collider.shape.calculateCollision(collider.matrixWorld, tail, this.settings.hitRadius, _v3A62);
        if (dist < 0) {
          tail.add(_v3A62.multiplyScalar(-dist));
          tail.sub(_worldSpacePosition).normalize().multiplyScalar(this._worldSpaceBoneLength).add(_worldSpacePosition);
        }
      });
    });
  }
  /**
   * Calculate the {@link _worldSpaceBoneLength}.
   * Intended to be used in {@link update}.
   */
  _calcWorldSpaceBoneLength() {
    _v3A62.setFromMatrixPosition(this.bone.matrixWorld);
    if (this.child) {
      _v3B23.setFromMatrixPosition(this.child.matrixWorld);
    } else {
      _v3B23.copy(this._initialLocalChildPosition);
      _v3B23.applyMatrix4(this.bone.matrixWorld);
    }
    this._worldSpaceBoneLength = _v3A62.sub(_v3B23).length();
  }
  /**
   * Create a matrix that converts center space into world space.
   * @param target Target matrix
   */
  _getMatrixCenterToWorld(target) {
    if (this._center) {
      target.copy(this._center.matrixWorld);
    } else {
      target.identity();
    }
    return target;
  }
  /**
   * Create a matrix that converts world space into center space.
   * @param target Target matrix
   */
  _getMatrixWorldToCenter(target) {
    if (this._center) {
      target.copy(this._center.userData.inverseCacheProxy.inverse);
    } else {
      target.identity();
    }
    return target;
  }
};
function traverseAncestorsFromRoot2(object, callback) {
  const ancestors = [];
  let head = object;
  while (head !== null) {
    ancestors.unshift(head);
    head = head.parent;
  }
  ancestors.forEach((ancestor) => {
    callback(ancestor);
  });
}
function traverseChildrenUntilConditionMet(object, callback) {
  object.children.forEach((child) => {
    const result = callback(child);
    if (!result) {
      traverseChildrenUntilConditionMet(child, callback);
    }
  });
}
var VRMSpringBoneManager = class {
  constructor() {
    this._joints = /* @__PURE__ */ new Set();
    this._hasWarnedCircularDependency = false;
    this._objectSpringBonesMap = /* @__PURE__ */ new Map();
  }
  get joints() {
    return this._joints;
  }
  /**
   * @deprecated Use {@link joints} instead.
   */
  get springBones() {
    console.warn("VRMSpringBoneManager: springBones is deprecated. use joints instead.");
    return this._joints;
  }
  get colliderGroups() {
    const set = /* @__PURE__ */ new Set();
    this._joints.forEach((springBone) => {
      springBone.colliderGroups.forEach((colliderGroup) => {
        set.add(colliderGroup);
      });
    });
    return Array.from(set);
  }
  get colliders() {
    const set = /* @__PURE__ */ new Set();
    this.colliderGroups.forEach((colliderGroup) => {
      colliderGroup.colliders.forEach((collider) => {
        set.add(collider);
      });
    });
    return Array.from(set);
  }
  addJoint(joint) {
    this._joints.add(joint);
    let objectSet = this._objectSpringBonesMap.get(joint.bone);
    if (objectSet == null) {
      objectSet = /* @__PURE__ */ new Set();
      this._objectSpringBonesMap.set(joint.bone, objectSet);
    }
    objectSet.add(joint);
  }
  /**
   * @deprecated Use {@link addJoint} instead.
   */
  addSpringBone(joint) {
    console.warn("VRMSpringBoneManager: addSpringBone() is deprecated. use addJoint() instead.");
    this.addJoint(joint);
  }
  deleteJoint(joint) {
    this._joints.delete(joint);
    const objectSet = this._objectSpringBonesMap.get(joint.bone);
    objectSet.delete(joint);
  }
  /**
   * @deprecated Use {@link deleteJoint} instead.
   */
  deleteSpringBone(joint) {
    console.warn("VRMSpringBoneManager: deleteSpringBone() is deprecated. use deleteJoint() instead.");
    this.deleteJoint(joint);
  }
  setInitState() {
    const springBonesTried = /* @__PURE__ */ new Set();
    const springBonesDone = /* @__PURE__ */ new Set();
    const objectUpdated = /* @__PURE__ */ new Set();
    for (const springBone of this._joints) {
      this._processSpringBone(
        springBone,
        springBonesTried,
        springBonesDone,
        objectUpdated,
        (springBone2) => springBone2.setInitState()
      );
    }
  }
  reset() {
    const springBonesTried = /* @__PURE__ */ new Set();
    const springBonesDone = /* @__PURE__ */ new Set();
    const objectUpdated = /* @__PURE__ */ new Set();
    for (const springBone of this._joints) {
      this._processSpringBone(
        springBone,
        springBonesTried,
        springBonesDone,
        objectUpdated,
        (springBone2) => springBone2.reset()
      );
    }
  }
  update(delta) {
    const springBonesTried = /* @__PURE__ */ new Set();
    const springBonesDone = /* @__PURE__ */ new Set();
    const objectUpdated = /* @__PURE__ */ new Set();
    for (const springBone of this._joints) {
      this._processSpringBone(
        springBone,
        springBonesTried,
        springBonesDone,
        objectUpdated,
        (springBone2) => springBone2.update(delta)
      );
      traverseChildrenUntilConditionMet(springBone.bone, (object) => {
        var _a, _b;
        if (((_b = (_a = this._objectSpringBonesMap.get(object)) == null ? void 0 : _a.size) != null ? _b : 0) > 0) {
          return true;
        }
        object.updateWorldMatrix(false, false);
        return false;
      });
    }
  }
  /**
   * Update a spring bone.
   * If there are other spring bone that are dependant, it will try to update them recursively.
   * It updates matrixWorld of all ancestors and myself.
   * It might log an warning message if there are any circular dependencies.
   *
   * Intended to be used in {@link update} and {@link _processSpringBone} itself recursively.
   *
   * @param springBone A springBone you want to update
   * @param springBonesTried Set of springBones that are already tried to be updated
   * @param springBonesDone Set of springBones that are already up to date
   * @param objectUpdated Set of object3D whose matrixWorld is updated
   */
  _processSpringBone(springBone, springBonesTried, springBonesDone, objectUpdated, callback) {
    if (springBonesDone.has(springBone)) {
      return;
    }
    if (springBonesTried.has(springBone)) {
      if (!this._hasWarnedCircularDependency) {
        console.warn("VRMSpringBoneManager: Circular dependency detected while updating springbones");
        this._hasWarnedCircularDependency = true;
      }
      return;
    }
    springBonesTried.add(springBone);
    const depObjects = this._getDependencies(springBone);
    for (const depObject of depObjects) {
      traverseAncestorsFromRoot2(depObject, (depObjectAncestor) => {
        const objectSet = this._objectSpringBonesMap.get(depObjectAncestor);
        if (objectSet) {
          for (const depSpringBone of objectSet) {
            this._processSpringBone(depSpringBone, springBonesTried, springBonesDone, objectUpdated, callback);
          }
        } else if (!objectUpdated.has(depObjectAncestor)) {
          depObjectAncestor.updateWorldMatrix(false, false);
          objectUpdated.add(depObjectAncestor);
        }
      });
    }
    springBone.bone.updateMatrix();
    springBone.bone.updateWorldMatrix(false, false);
    callback(springBone);
    objectUpdated.add(springBone.bone);
    springBonesDone.add(springBone);
  }
  /**
   * Return a set of objects that are dependant of given spring bone.
   * @param springBone A spring bone
   * @return A set of objects that are dependant of given spring bone
   */
  _getDependencies(springBone) {
    const set = /* @__PURE__ */ new Set();
    const parent = springBone.bone.parent;
    if (parent) {
      set.add(parent);
    }
    springBone.colliderGroups.forEach((colliderGroup) => {
      colliderGroup.colliders.forEach((collider) => {
        set.add(collider);
      });
    });
    return set;
  }
};
var EXTENSION_NAME_EXTENDED_COLLIDER = "VRMC_springBone_extended_collider";
var POSSIBLE_SPEC_VERSIONS8 = /* @__PURE__ */ new Set(["1.0", "1.0-beta"]);
var POSSIBLE_SPEC_VERSIONS_EXTENDED_COLLIDERS = /* @__PURE__ */ new Set(["1.0"]);
var _VRMSpringBoneLoaderPlugin = class _VRMSpringBoneLoaderPlugin2 {
  get name() {
    return _VRMSpringBoneLoaderPlugin2.EXTENSION_NAME;
  }
  constructor(parser, options) {
    var _a;
    this.parser = parser;
    this.jointHelperRoot = options == null ? void 0 : options.jointHelperRoot;
    this.colliderHelperRoot = options == null ? void 0 : options.colliderHelperRoot;
    this.useExtendedColliders = (_a = options == null ? void 0 : options.useExtendedColliders) != null ? _a : true;
  }
  afterRoot(gltf) {
    return __async7(this, null, function* () {
      gltf.userData.vrmSpringBoneManager = yield this._import(gltf);
    });
  }
  /**
   * Import spring bones from a GLTF and return a {@link VRMSpringBoneManager}.
   * It might return `null` instead when it does not need to be created or something go wrong.
   *
   * @param gltf A parsed result of GLTF taken from GLTFLoader
   */
  _import(gltf) {
    return __async7(this, null, function* () {
      const v1Result = yield this._v1Import(gltf);
      if (v1Result != null) {
        return v1Result;
      }
      const v0Result = yield this._v0Import(gltf);
      if (v0Result != null) {
        return v0Result;
      }
      return null;
    });
  }
  _v1Import(gltf) {
    return __async7(this, null, function* () {
      var _a, _b, _c, _d, _e;
      const json = gltf.parser.json;
      const isSpringBoneUsed = ((_a = json.extensionsUsed) == null ? void 0 : _a.indexOf(_VRMSpringBoneLoaderPlugin2.EXTENSION_NAME)) !== -1;
      if (!isSpringBoneUsed) {
        return null;
      }
      const manager = new VRMSpringBoneManager();
      const threeNodes = yield gltf.parser.getDependencies("node");
      const extension = (_b = json.extensions) == null ? void 0 : _b[_VRMSpringBoneLoaderPlugin2.EXTENSION_NAME];
      if (!extension) {
        return null;
      }
      const specVersion = extension.specVersion;
      if (!POSSIBLE_SPEC_VERSIONS8.has(specVersion)) {
        console.warn(
          `VRMSpringBoneLoaderPlugin: Unknown ${_VRMSpringBoneLoaderPlugin2.EXTENSION_NAME} specVersion "${specVersion}"`
        );
        return null;
      }
      const colliders = (_c = extension.colliders) == null ? void 0 : _c.map((schemaCollider, iCollider) => {
        var _a2, _b2, _c2, _d2, _e2, _f, _g, _h, _i, _j, _k, _l, _m, _n, _o;
        const node = threeNodes[schemaCollider.node];
        const schemaShape = schemaCollider.shape;
        const schemaExCollider = (_a2 = schemaCollider.extensions) == null ? void 0 : _a2[EXTENSION_NAME_EXTENDED_COLLIDER];
        if (this.useExtendedColliders && schemaExCollider != null) {
          const specVersionExCollider = schemaExCollider.specVersion;
          if (!POSSIBLE_SPEC_VERSIONS_EXTENDED_COLLIDERS.has(specVersionExCollider)) {
            console.warn(
              `VRMSpringBoneLoaderPlugin: Unknown ${EXTENSION_NAME_EXTENDED_COLLIDER} specVersion "${specVersionExCollider}". Fallbacking to the ${_VRMSpringBoneLoaderPlugin2.EXTENSION_NAME} definition`
            );
          } else {
            const schemaExShape = schemaExCollider.shape;
            if (schemaExShape.sphere) {
              return this._importSphereCollider(node, {
                offset: new THREE142.Vector3().fromArray((_b2 = schemaExShape.sphere.offset) != null ? _b2 : [0, 0, 0]),
                radius: (_c2 = schemaExShape.sphere.radius) != null ? _c2 : 0,
                inside: (_d2 = schemaExShape.sphere.inside) != null ? _d2 : false
              });
            } else if (schemaExShape.capsule) {
              return this._importCapsuleCollider(node, {
                offset: new THREE142.Vector3().fromArray((_e2 = schemaExShape.capsule.offset) != null ? _e2 : [0, 0, 0]),
                radius: (_f = schemaExShape.capsule.radius) != null ? _f : 0,
                tail: new THREE142.Vector3().fromArray((_g = schemaExShape.capsule.tail) != null ? _g : [0, 0, 0]),
                inside: (_h = schemaExShape.capsule.inside) != null ? _h : false
              });
            } else if (schemaExShape.plane) {
              return this._importPlaneCollider(node, {
                offset: new THREE142.Vector3().fromArray((_i = schemaExShape.plane.offset) != null ? _i : [0, 0, 0]),
                normal: new THREE142.Vector3().fromArray((_j = schemaExShape.plane.normal) != null ? _j : [0, 0, 1])
              });
            }
          }
        }
        if (schemaShape.sphere) {
          return this._importSphereCollider(node, {
            offset: new THREE142.Vector3().fromArray((_k = schemaShape.sphere.offset) != null ? _k : [0, 0, 0]),
            radius: (_l = schemaShape.sphere.radius) != null ? _l : 0,
            inside: false
          });
        } else if (schemaShape.capsule) {
          return this._importCapsuleCollider(node, {
            offset: new THREE142.Vector3().fromArray((_m = schemaShape.capsule.offset) != null ? _m : [0, 0, 0]),
            radius: (_n = schemaShape.capsule.radius) != null ? _n : 0,
            tail: new THREE142.Vector3().fromArray((_o = schemaShape.capsule.tail) != null ? _o : [0, 0, 0]),
            inside: false
          });
        }
        throw new Error(`VRMSpringBoneLoaderPlugin: The collider #${iCollider} has no valid shape`);
      });
      const colliderGroups = (_d = extension.colliderGroups) == null ? void 0 : _d.map(
        (schemaColliderGroup, iColliderGroup) => {
          var _a2;
          const cols = ((_a2 = schemaColliderGroup.colliders) != null ? _a2 : []).map((iCollider) => {
            const col = colliders == null ? void 0 : colliders[iCollider];
            if (col == null) {
              throw new Error(
                `VRMSpringBoneLoaderPlugin: The colliderGroup #${iColliderGroup} attempted to use a collider #${iCollider} but not found`
              );
            }
            return col;
          });
          return {
            colliders: cols,
            name: schemaColliderGroup.name
          };
        }
      );
      (_e = extension.springs) == null ? void 0 : _e.forEach((schemaSpring, iSpring) => {
        var _a2;
        const schemaJoints = schemaSpring.joints;
        const colliderGroupsForSpring = (_a2 = schemaSpring.colliderGroups) == null ? void 0 : _a2.map((iColliderGroup) => {
          const group = colliderGroups == null ? void 0 : colliderGroups[iColliderGroup];
          if (group == null) {
            throw new Error(
              `VRMSpringBoneLoaderPlugin: The spring #${iSpring} attempted to use a colliderGroup ${iColliderGroup} but not found`
            );
          }
          return group;
        });
        const center = schemaSpring.center != null ? threeNodes[schemaSpring.center] : void 0;
        let prevSchemaJoint;
        schemaJoints.forEach((schemaJoint) => {
          if (prevSchemaJoint) {
            const nodeIndex = prevSchemaJoint.node;
            const node = threeNodes[nodeIndex];
            const childIndex = schemaJoint.node;
            const child = threeNodes[childIndex];
            const setting = {
              hitRadius: prevSchemaJoint.hitRadius,
              dragForce: prevSchemaJoint.dragForce,
              gravityPower: prevSchemaJoint.gravityPower,
              stiffness: prevSchemaJoint.stiffness,
              gravityDir: prevSchemaJoint.gravityDir != null ? new THREE142.Vector3().fromArray(prevSchemaJoint.gravityDir) : void 0
            };
            const joint = this._importJoint(node, child, setting, colliderGroupsForSpring);
            if (center) {
              joint.center = center;
            }
            manager.addJoint(joint);
          }
          prevSchemaJoint = schemaJoint;
        });
      });
      manager.setInitState();
      return manager;
    });
  }
  _v0Import(gltf) {
    return __async7(this, null, function* () {
      var _a, _b, _c;
      const json = gltf.parser.json;
      const isVRMUsed = ((_a = json.extensionsUsed) == null ? void 0 : _a.indexOf("VRM")) !== -1;
      if (!isVRMUsed) {
        return null;
      }
      const extension = (_b = json.extensions) == null ? void 0 : _b["VRM"];
      const schemaSecondaryAnimation = extension == null ? void 0 : extension.secondaryAnimation;
      if (!schemaSecondaryAnimation) {
        return null;
      }
      const schemaBoneGroups = schemaSecondaryAnimation == null ? void 0 : schemaSecondaryAnimation.boneGroups;
      if (!schemaBoneGroups) {
        return null;
      }
      const manager = new VRMSpringBoneManager();
      const threeNodes = yield gltf.parser.getDependencies("node");
      const colliderGroups = (_c = schemaSecondaryAnimation.colliderGroups) == null ? void 0 : _c.map(
        (schemaColliderGroup) => {
          var _a2;
          const node = threeNodes[schemaColliderGroup.node];
          const colliders = ((_a2 = schemaColliderGroup.colliders) != null ? _a2 : []).map((schemaCollider, iCollider) => {
            var _a3, _b2, _c2;
            const offset = new THREE142.Vector3(0, 0, 0);
            if (schemaCollider.offset) {
              offset.set(
                (_a3 = schemaCollider.offset.x) != null ? _a3 : 0,
                (_b2 = schemaCollider.offset.y) != null ? _b2 : 0,
                schemaCollider.offset.z ? -schemaCollider.offset.z : 0
                // z is opposite in VRM0.0
              );
            }
            return this._importSphereCollider(node, {
              offset,
              radius: (_c2 = schemaCollider.radius) != null ? _c2 : 0,
              inside: false
            });
          });
          return { colliders };
        }
      );
      schemaBoneGroups == null ? void 0 : schemaBoneGroups.forEach((schemaBoneGroup, iBoneGroup) => {
        const rootIndices = schemaBoneGroup.bones;
        if (!rootIndices) {
          return;
        }
        rootIndices.forEach((rootIndex) => {
          var _a2, _b2, _c2, _d;
          const root = threeNodes[rootIndex];
          const gravityDir = new THREE142.Vector3();
          if (schemaBoneGroup.gravityDir) {
            gravityDir.set(
              (_a2 = schemaBoneGroup.gravityDir.x) != null ? _a2 : 0,
              (_b2 = schemaBoneGroup.gravityDir.y) != null ? _b2 : 0,
              (_c2 = schemaBoneGroup.gravityDir.z) != null ? _c2 : 0
            );
          } else {
            gravityDir.set(0, -1, 0);
          }
          const center = schemaBoneGroup.center != null ? threeNodes[schemaBoneGroup.center] : void 0;
          const setting = {
            hitRadius: schemaBoneGroup.hitRadius,
            dragForce: schemaBoneGroup.dragForce,
            gravityPower: schemaBoneGroup.gravityPower,
            stiffness: schemaBoneGroup.stiffiness,
            gravityDir
          };
          const colliderGroupsForSpring = (_d = schemaBoneGroup.colliderGroups) == null ? void 0 : _d.map((iColliderGroup) => {
            const group = colliderGroups == null ? void 0 : colliderGroups[iColliderGroup];
            if (group == null) {
              throw new Error(
                `VRMSpringBoneLoaderPlugin: The spring #${iBoneGroup} attempted to use a colliderGroup ${iColliderGroup} but not found`
              );
            }
            return group;
          });
          root.traverse((node) => {
            var _a3;
            const child = (_a3 = node.children[0]) != null ? _a3 : null;
            const joint = this._importJoint(node, child, setting, colliderGroupsForSpring);
            if (center) {
              joint.center = center;
            }
            manager.addJoint(joint);
          });
        });
      });
      gltf.scene.updateMatrixWorld();
      manager.setInitState();
      return manager;
    });
  }
  _importJoint(node, child, setting, colliderGroupsForSpring) {
    const springBone = new VRMSpringBoneJoint(node, child, setting, colliderGroupsForSpring);
    if (this.jointHelperRoot) {
      const helper = new VRMSpringBoneJointHelper(springBone);
      this.jointHelperRoot.add(helper);
      helper.renderOrder = this.jointHelperRoot.renderOrder;
    }
    return springBone;
  }
  _importSphereCollider(destination, params) {
    const shape = new VRMSpringBoneColliderShapeSphere(params);
    const collider = new VRMSpringBoneCollider(shape);
    destination.add(collider);
    if (this.colliderHelperRoot) {
      const helper = new VRMSpringBoneColliderHelper(collider);
      this.colliderHelperRoot.add(helper);
      helper.renderOrder = this.colliderHelperRoot.renderOrder;
    }
    return collider;
  }
  _importCapsuleCollider(destination, params) {
    const shape = new VRMSpringBoneColliderShapeCapsule(params);
    const collider = new VRMSpringBoneCollider(shape);
    destination.add(collider);
    if (this.colliderHelperRoot) {
      const helper = new VRMSpringBoneColliderHelper(collider);
      this.colliderHelperRoot.add(helper);
      helper.renderOrder = this.colliderHelperRoot.renderOrder;
    }
    return collider;
  }
  _importPlaneCollider(destination, params) {
    const shape = new VRMSpringBoneColliderShapePlane(params);
    const collider = new VRMSpringBoneCollider(shape);
    destination.add(collider);
    if (this.colliderHelperRoot) {
      const helper = new VRMSpringBoneColliderHelper(collider);
      this.colliderHelperRoot.add(helper);
      helper.renderOrder = this.colliderHelperRoot.renderOrder;
    }
    return collider;
  }
};
_VRMSpringBoneLoaderPlugin.EXTENSION_NAME = "VRMC_springBone";
var VRMSpringBoneLoaderPlugin = _VRMSpringBoneLoaderPlugin;

// src/VRMLoaderPlugin.ts
var VRMLoaderPlugin = class {
  get name() {
    return "VRMLoaderPlugin";
  }
  constructor(parser, options) {
    var _a, _b, _c, _d, _e, _f, _g, _h, _i, _j;
    this.parser = parser;
    const helperRoot = options == null ? void 0 : options.helperRoot;
    const autoUpdateHumanBones = options == null ? void 0 : options.autoUpdateHumanBones;
    this.expressionPlugin = (_a = options == null ? void 0 : options.expressionPlugin) != null ? _a : new VRMExpressionLoaderPlugin(parser);
    this.firstPersonPlugin = (_b = options == null ? void 0 : options.firstPersonPlugin) != null ? _b : new VRMFirstPersonLoaderPlugin(parser);
    this.humanoidPlugin = (_c = options == null ? void 0 : options.humanoidPlugin) != null ? _c : new VRMHumanoidLoaderPlugin(parser, {
      helperRoot,
      autoUpdateHumanBones
    });
    this.lookAtPlugin = (_d = options == null ? void 0 : options.lookAtPlugin) != null ? _d : new VRMLookAtLoaderPlugin(parser, { helperRoot });
    this.metaPlugin = (_e = options == null ? void 0 : options.metaPlugin) != null ? _e : new VRMMetaLoaderPlugin(parser);
    this.mtoonMaterialPlugin = (_f = options == null ? void 0 : options.mtoonMaterialPlugin) != null ? _f : new MToonMaterialLoaderPlugin(parser);
    this.materialsHDREmissiveMultiplierPlugin = (_g = options == null ? void 0 : options.materialsHDREmissiveMultiplierPlugin) != null ? _g : new VRMMaterialsHDREmissiveMultiplierLoaderPlugin(parser);
    this.materialsV0CompatPlugin = (_h = options == null ? void 0 : options.materialsV0CompatPlugin) != null ? _h : new VRMMaterialsV0CompatPlugin(parser);
    this.springBonePlugin = (_i = options == null ? void 0 : options.springBonePlugin) != null ? _i : new VRMSpringBoneLoaderPlugin(parser, {
      colliderHelperRoot: helperRoot,
      jointHelperRoot: helperRoot
    });
    this.nodeConstraintPlugin = (_j = options == null ? void 0 : options.nodeConstraintPlugin) != null ? _j : new VRMNodeConstraintLoaderPlugin(parser, { helperRoot });
  }
  beforeRoot() {
    return __async(this, null, function* () {
      yield this.materialsV0CompatPlugin.beforeRoot();
      yield this.mtoonMaterialPlugin.beforeRoot();
    });
  }
  loadMesh(meshIndex) {
    return __async(this, null, function* () {
      return yield this.mtoonMaterialPlugin.loadMesh(meshIndex);
    });
  }
  getMaterialType(materialIndex) {
    const mtoonType = this.mtoonMaterialPlugin.getMaterialType(materialIndex);
    if (mtoonType != null) {
      return mtoonType;
    }
    return null;
  }
  extendMaterialParams(materialIndex, materialParams) {
    return __async(this, null, function* () {
      yield this.materialsHDREmissiveMultiplierPlugin.extendMaterialParams(materialIndex, materialParams);
      yield this.mtoonMaterialPlugin.extendMaterialParams(materialIndex, materialParams);
    });
  }
  afterRoot(gltf) {
    return __async(this, null, function* () {
      yield this.metaPlugin.afterRoot(gltf);
      yield this.humanoidPlugin.afterRoot(gltf);
      yield this.expressionPlugin.afterRoot(gltf);
      yield this.lookAtPlugin.afterRoot(gltf);
      yield this.firstPersonPlugin.afterRoot(gltf);
      yield this.springBonePlugin.afterRoot(gltf);
      yield this.nodeConstraintPlugin.afterRoot(gltf);
      yield this.mtoonMaterialPlugin.afterRoot(gltf);
      const meta = gltf.userData.vrmMeta;
      const humanoid = gltf.userData.vrmHumanoid;
      if (meta && humanoid) {
        const vrm = new VRM({
          scene: gltf.scene,
          expressionManager: gltf.userData.vrmExpressionManager,
          firstPerson: gltf.userData.vrmFirstPerson,
          humanoid,
          lookAt: gltf.userData.vrmLookAt,
          meta,
          materials: gltf.userData.vrmMToonMaterials,
          springBoneManager: gltf.userData.vrmSpringBoneManager,
          nodeConstraintManager: gltf.userData.vrmNodeConstraintManager
        });
        gltf.userData.vrm = vrm;
      }
    });
  }
};

// src/VRMUtils/deepDispose.ts
function disposeMaterial(material) {
  Object.values(material).forEach((value) => {
    if (value == null ? void 0 : value.isTexture) {
      const texture = value;
      texture.dispose();
    }
  });
  if (material.isShaderMaterial) {
    const uniforms = material.uniforms;
    if (uniforms) {
      Object.values(uniforms).forEach((uniform) => {
        const value = uniform.value;
        if (value == null ? void 0 : value.isTexture) {
          const texture = value;
          texture.dispose();
        }
      });
    }
  }
  material.dispose();
}
function dispose(object3D) {
  const geometry = object3D.geometry;
  if (geometry) {
    geometry.dispose();
  }
  const skeleton = object3D.skeleton;
  if (skeleton) {
    skeleton.dispose();
  }
  const material = object3D.material;
  if (material) {
    if (Array.isArray(material)) {
      material.forEach((material2) => disposeMaterial(material2));
    } else if (material) {
      disposeMaterial(material);
    }
  }
}
function deepDispose(object3D) {
  object3D.traverse(dispose);
}

// src/VRMUtils/removeUnnecessaryJoints.ts
var THREE21 = __toESM(require("three"), 1);
function removeUnnecessaryJoints(root, options) {
  var _a;
  const experimentalSameBoneCounts = (_a = options == null ? void 0 : options.experimentalSameBoneCounts) != null ? _a : false;
  const skinnedMeshes = [];
  root.traverse((obj) => {
    if (obj.type !== "SkinnedMesh") {
      return;
    }
    skinnedMeshes.push(obj);
  });
  const bonesList = /* @__PURE__ */ new Map();
  let maxBones = 0;
  for (const mesh of skinnedMeshes) {
    const geometry = mesh.geometry;
    const attribute = geometry.getAttribute("skinIndex");
    const bones = [];
    const boneInverses = [];
    const boneIndexMap = {};
    const array = attribute.array;
    for (let i = 0; i < array.length; i++) {
      const index = array[i];
      if (boneIndexMap[index] == null) {
        boneIndexMap[index] = bones.length;
        bones.push(mesh.skeleton.bones[index]);
        boneInverses.push(mesh.skeleton.boneInverses[index]);
      }
      array[i] = boneIndexMap[index];
    }
    attribute.copyArray(array);
    attribute.needsUpdate = true;
    bonesList.set(mesh, { bones, boneInverses });
    maxBones = Math.max(maxBones, bones.length);
  }
  for (const mesh of skinnedMeshes) {
    const { bones, boneInverses } = bonesList.get(mesh);
    if (experimentalSameBoneCounts) {
      for (let i = bones.length; i < maxBones; i++) {
        bones[i] = bones[0];
        boneInverses[i] = boneInverses[0];
      }
    }
    const skeleton = new THREE21.Skeleton(bones, boneInverses);
    mesh.bind(skeleton, new THREE21.Matrix4());
  }
}

// src/VRMUtils/removeUnnecessaryVertices.ts
var THREE25 = __toESM(require("three"), 1);
var import_three = require("three");
function removeUnnecessaryVertices(root) {
  const geometryMap = /* @__PURE__ */ new Map();
  root.traverse((obj) => {
    var _a, _b, _c, _d;
    if (!obj.isMesh) {
      return;
    }
    const mesh = obj;
    const geometry = mesh.geometry;
    const origianlIndex = geometry.index;
    if (origianlIndex == null) {
      return;
    }
    const newGeometryAlreadyExisted = geometryMap.get(geometry);
    if (newGeometryAlreadyExisted != null) {
      mesh.geometry = newGeometryAlreadyExisted;
      return;
    }
    const newGeometry = new THREE25.BufferGeometry();
    newGeometry.name = geometry.name;
    newGeometry.morphTargetsRelative = geometry.morphTargetsRelative;
    geometry.groups.forEach((group) => {
      newGeometry.addGroup(group.start, group.count, group.materialIndex);
    });
    newGeometry.boundingBox = (_b = (_a = geometry.boundingBox) == null ? void 0 : _a.clone()) != null ? _b : null;
    newGeometry.boundingSphere = (_d = (_c = geometry.boundingSphere) == null ? void 0 : _c.clone()) != null ? _d : null;
    newGeometry.setDrawRange(geometry.drawRange.start, geometry.drawRange.count);
    newGeometry.userData = geometry.userData;
    geometryMap.set(geometry, newGeometry);
    const originalIndexNewIndexMap = [];
    const newIndexOriginalIndexMap = [];
    {
      const originalIndexArray = origianlIndex.array;
      const newIndexArray = new originalIndexArray.constructor(originalIndexArray.length);
      let indexHead = 0;
      for (let i = 0; i < originalIndexArray.length; i++) {
        const originalIndex = originalIndexArray[i];
        let newIndex = originalIndexNewIndexMap[originalIndex];
        if (newIndex == null) {
          originalIndexNewIndexMap[originalIndex] = indexHead;
          newIndexOriginalIndexMap[indexHead] = originalIndex;
          newIndex = indexHead;
          indexHead++;
        }
        newIndexArray[i] = newIndex;
      }
      newGeometry.setIndex(new import_three.BufferAttribute(newIndexArray, 1, false));
    }
    Object.keys(geometry.attributes).forEach((attributeName) => {
      const originalAttribute = geometry.attributes[attributeName];
      if (originalAttribute.isInterleavedBufferAttribute) {
        throw new Error("removeUnnecessaryVertices: InterleavedBufferAttribute is not supported");
      }
      const originalAttributeArray = originalAttribute.array;
      const { itemSize, normalized } = originalAttribute;
      const newAttributeArray = new originalAttributeArray.constructor(
        newIndexOriginalIndexMap.length * itemSize
      );
      newIndexOriginalIndexMap.forEach((originalIndex, i) => {
        for (let j = 0; j < itemSize; j++) {
          newAttributeArray[i * itemSize + j] = originalAttributeArray[originalIndex * itemSize + j];
        }
      });
      newGeometry.setAttribute(attributeName, new import_three.BufferAttribute(newAttributeArray, itemSize, normalized));
    });
    let isNullMorph = true;
    Object.keys(geometry.morphAttributes).forEach((attributeName) => {
      newGeometry.morphAttributes[attributeName] = [];
      const morphs = geometry.morphAttributes[attributeName];
      for (let iMorph = 0; iMorph < morphs.length; iMorph++) {
        const originalAttribute = morphs[iMorph];
        if (originalAttribute.isInterleavedBufferAttribute) {
          throw new Error("removeUnnecessaryVertices: InterleavedBufferAttribute is not supported");
        }
        const originalAttributeArray = originalAttribute.array;
        const { itemSize, normalized } = originalAttribute;
        const newAttributeArray = new originalAttributeArray.constructor(
          newIndexOriginalIndexMap.length * itemSize
        );
        newIndexOriginalIndexMap.forEach((originalIndex, i) => {
          for (let j = 0; j < itemSize; j++) {
            newAttributeArray[i * itemSize + j] = originalAttributeArray[originalIndex * itemSize + j];
          }
        });
        isNullMorph = isNullMorph && newAttributeArray.every((v) => v === 0);
        newGeometry.morphAttributes[attributeName][iMorph] = new import_three.BufferAttribute(
          newAttributeArray,
          itemSize,
          normalized
        );
      }
    });
    if (isNullMorph) {
      newGeometry.morphAttributes = {};
    }
    mesh.geometry = newGeometry;
  });
  Array.from(geometryMap.keys()).forEach((originalGeometry) => {
    originalGeometry.dispose();
  });
}

// src/VRMUtils/rotateVRM0.ts
function rotateVRM0(vrm) {
  var _a;
  if (((_a = vrm.meta) == null ? void 0 : _a.metaVersion) === "0") {
    vrm.scene.rotation.y = Math.PI;
  }
}

// src/VRMUtils/index.ts
var VRMUtils = class {
  constructor() {
  }
};
VRMUtils.deepDispose = deepDispose;
VRMUtils.removeUnnecessaryJoints = removeUnnecessaryJoints;
VRMUtils.removeUnnecessaryVertices = removeUnnecessaryVertices;
VRMUtils.rotateVRM0 = rotateVRM0;
/*!
 * @pixiv/three-vrm-core v3.1.4
 * The implementation of core features of VRM, for @pixiv/three-vrm
 *
 * Copyright (c) 2019-2024 pixiv Inc.
 * @pixiv/three-vrm-core is distributed under MIT License
 * https://github.com/pixiv/three-vrm/blob/release/LICENSE
 */
/*!
 * @pixiv/three-vrm-materials-mtoon v3.1.4
 * MToon (toon material) module for @pixiv/three-vrm
 *
 * Copyright (c) 2019-2024 pixiv Inc.
 * @pixiv/three-vrm-materials-mtoon is distributed under MIT License
 * https://github.com/pixiv/three-vrm/blob/release/LICENSE
 */
/*!
 * @pixiv/three-vrm-materials-hdr-emissive-multiplier v3.1.4
 * Support VRMC_hdr_emissiveMultiplier for @pixiv/three-vrm
 *
 * Copyright (c) 2019-2024 pixiv Inc.
 * @pixiv/three-vrm-materials-hdr-emissive-multiplier is distributed under MIT License
 * https://github.com/pixiv/three-vrm/blob/release/LICENSE
 */
/*!
 * @pixiv/three-vrm-materials-v0compat v3.1.4
 * VRM0.0 materials compatibility layer plugin for @pixiv/three-vrm
 *
 * Copyright (c) 2019-2024 pixiv Inc.
 * @pixiv/three-vrm-materials-v0compat is distributed under MIT License
 * https://github.com/pixiv/three-vrm/blob/release/LICENSE
 */
/*!
 * @pixiv/three-vrm-node-constraint v3.1.4
 * Node constraint module for @pixiv/three-vrm
 *
 * Copyright (c) 2019-2024 pixiv Inc.
 * @pixiv/three-vrm-node-constraint is distributed under MIT License
 * https://github.com/pixiv/three-vrm/blob/release/LICENSE
 */
/*!
 * @pixiv/three-vrm-springbone v3.1.4
 * Spring bone module for @pixiv/three-vrm
 *
 * Copyright (c) 2019-2024 pixiv Inc.
 * @pixiv/three-vrm-springbone is distributed under MIT License
 * https://github.com/pixiv/three-vrm/blob/release/LICENSE
 */
//# sourceMappingURL=data:application/json;base64,ewogICJ2ZXJzaW9uIjogMywKICAic291cmNlcyI6IFsiLi4vc3JjL2luZGV4LnRzIiwgIi4uLy4uL3RocmVlLXZybS1jb3JlL3NyYy9leHByZXNzaW9ucy9WUk1FeHByZXNzaW9uLnRzIiwgIi4uLy4uL3RocmVlLXZybS1jb3JlL3NyYy9leHByZXNzaW9ucy9WUk1FeHByZXNzaW9uTG9hZGVyUGx1Z2luLnRzIiwgIi4uLy4uL3RocmVlLXZybS1jb3JlL3NyYy91dGlscy9nbHRmRXh0cmFjdFByaW1pdGl2ZXNGcm9tTm9kZS50cyIsICIuLi8uLi90aHJlZS12cm0tY29yZS9zcmMvZXhwcmVzc2lvbnMvVlJNRXhwcmVzc2lvblByZXNldE5hbWUudHMiLCAiLi4vLi4vdGhyZWUtdnJtLWNvcmUvc3JjL3V0aWxzL3NhdHVyYXRlLnRzIiwgIi4uLy4uL3RocmVlLXZybS1jb3JlL3NyYy9leHByZXNzaW9ucy9WUk1FeHByZXNzaW9uTWFuYWdlci50cyIsICIuLi8uLi90aHJlZS12cm0tY29yZS9zcmMvZXhwcmVzc2lvbnMvVlJNRXhwcmVzc2lvbk1hdGVyaWFsQ29sb3JUeXBlLnRzIiwgIi4uLy4uL3RocmVlLXZybS1jb3JlL3NyYy9leHByZXNzaW9ucy9WUk1FeHByZXNzaW9uTWF0ZXJpYWxDb2xvckJpbmQudHMiLCAiLi4vLi4vdGhyZWUtdnJtLWNvcmUvc3JjL2V4cHJlc3Npb25zL1ZSTUV4cHJlc3Npb25Nb3JwaFRhcmdldEJpbmQudHMiLCAiLi4vLi4vdGhyZWUtdnJtLWNvcmUvc3JjL2V4cHJlc3Npb25zL1ZSTUV4cHJlc3Npb25UZXh0dXJlVHJhbnNmb3JtQmluZC50cyIsICIuLi8uLi90aHJlZS12cm0tY29yZS9zcmMvZXhwcmVzc2lvbnMvVlJNRXhwcmVzc2lvbk92ZXJyaWRlVHlwZS50cyIsICIuLi8uLi90aHJlZS12cm0tY29yZS9zcmMvZmlyc3RQZXJzb24vVlJNRmlyc3RQZXJzb24udHMiLCAiLi4vLi4vdGhyZWUtdnJtLWNvcmUvc3JjL2ZpcnN0UGVyc29uL1ZSTUZpcnN0UGVyc29uTG9hZGVyUGx1Z2luLnRzIiwgIi4uLy4uL3RocmVlLXZybS1jb3JlL3NyYy9maXJzdFBlcnNvbi9WUk1GaXJzdFBlcnNvbk1lc2hBbm5vdGF0aW9uVHlwZS50cyIsICIuLi8uLi90aHJlZS12cm0tY29yZS9zcmMvaHVtYW5vaWQvaGVscGVycy9WUk1IdW1hbm9pZEhlbHBlci50cyIsICIuLi8uLi90aHJlZS12cm0tY29yZS9zcmMvaHVtYW5vaWQvVlJNSHVtYW5Cb25lTGlzdC50cyIsICIuLi8uLi90aHJlZS12cm0tY29yZS9zcmMvaHVtYW5vaWQvVlJNSHVtYW5Cb25lTmFtZS50cyIsICIuLi8uLi90aHJlZS12cm0tY29yZS9zcmMvaHVtYW5vaWQvVlJNSHVtYW5Cb25lUGFyZW50TWFwLnRzIiwgIi4uLy4uL3RocmVlLXZybS1jb3JlL3NyYy9odW1hbm9pZC9WUk1SaWcudHMiLCAiLi4vLi4vdGhyZWUtdnJtLWNvcmUvc3JjL3V0aWxzL3F1YXRJbnZlcnRDb21wYXQudHMiLCAiLi4vLi4vdGhyZWUtdnJtLWNvcmUvc3JjL2h1bWFub2lkL1ZSTUh1bWFub2lkUmlnLnRzIiwgIi4uLy4uL3RocmVlLXZybS1jb3JlL3NyYy9odW1hbm9pZC9WUk1IdW1hbm9pZC50cyIsICIuLi8uLi90aHJlZS12cm0tY29yZS9zcmMvaHVtYW5vaWQvVlJNUmVxdWlyZWRIdW1hbkJvbmVOYW1lLnRzIiwgIi4uLy4uL3RocmVlLXZybS1jb3JlL3NyYy9odW1hbm9pZC9WUk1IdW1hbm9pZExvYWRlclBsdWdpbi50cyIsICIuLi8uLi90aHJlZS12cm0tY29yZS9zcmMvbG9va0F0L2hlbHBlcnMvVlJNTG9va0F0SGVscGVyLnRzIiwgIi4uLy4uL3RocmVlLXZybS1jb3JlL3NyYy9sb29rQXQvaGVscGVycy91dGlscy9GYW5CdWZmZXJHZW9tZXRyeS50cyIsICIuLi8uLi90aHJlZS12cm0tY29yZS9zcmMvbG9va0F0L2hlbHBlcnMvdXRpbHMvTGluZUFuZFNwaGVyZUJ1ZmZlckdlb21ldHJ5LnRzIiwgIi4uLy4uL3RocmVlLXZybS1jb3JlL3NyYy9sb29rQXQvVlJNTG9va0F0LnRzIiwgIi4uLy4uL3RocmVlLXZybS1jb3JlL3NyYy91dGlscy9nZXRXb3JsZFF1YXRlcm5pb25MaXRlLnRzIiwgIi4uLy4uL3RocmVlLXZybS1jb3JlL3NyYy9sb29rQXQvdXRpbHMvY2FsY0F6aW11dGhBbHRpdHVkZS50cyIsICIuLi8uLi90aHJlZS12cm0tY29yZS9zcmMvbG9va0F0L3V0aWxzL3Nhbml0aXplQW5nbGUudHMiLCAiLi4vLi4vdGhyZWUtdnJtLWNvcmUvc3JjL2xvb2tBdC9WUk1Mb29rQXRCb25lQXBwbGllci50cyIsICIuLi8uLi90aHJlZS12cm0tY29yZS9zcmMvbG9va0F0L1ZSTUxvb2tBdEV4cHJlc3Npb25BcHBsaWVyLnRzIiwgIi4uLy4uL3RocmVlLXZybS1jb3JlL3NyYy9sb29rQXQvVlJNTG9va0F0UmFuZ2VNYXAudHMiLCAiLi4vLi4vdGhyZWUtdnJtLWNvcmUvc3JjL2xvb2tBdC9WUk1Mb29rQXRMb2FkZXJQbHVnaW4udHMiLCAiLi4vLi4vdGhyZWUtdnJtLWNvcmUvc3JjL2xvb2tBdC9WUk1Mb29rQXRUeXBlTmFtZS50cyIsICIuLi8uLi90aHJlZS12cm0tY29yZS9zcmMvbWV0YS9WUk1NZXRhTG9hZGVyUGx1Z2luLnRzIiwgIi4uLy4uL3RocmVlLXZybS1jb3JlL3NyYy91dGlscy9yZXNvbHZlVVJMLnRzIiwgIi4uLy4uL3RocmVlLXZybS1jb3JlL3NyYy9WUk1Db3JlLnRzIiwgIi4uLy4uL3RocmVlLXZybS1jb3JlL3NyYy9WUk1Db3JlTG9hZGVyUGx1Z2luLnRzIiwgIi4uL3NyYy9WUk0udHMiLCAiLi4vLi4vdGhyZWUtdnJtLW1hdGVyaWFscy1tdG9vbi9zcmMvTVRvb25NYXRlcmlhbExvYWRlclBsdWdpbi50cyIsICIuLi8uLi90aHJlZS12cm0tbWF0ZXJpYWxzLW10b29uL3NyYy9HTFRGTVRvb25NYXRlcmlhbFBhcmFtc0Fzc2lnbkhlbHBlci50cyIsICIuLi8uLi90aHJlZS12cm0tbWF0ZXJpYWxzLW10b29uL3NyYy91dGlscy9zZXRUZXh0dXJlQ29sb3JTcGFjZS50cyIsICIuLi8uLi90aHJlZS12cm0tbWF0ZXJpYWxzLW10b29uL3NyYy9NVG9vbk1hdGVyaWFsLnRzIiwgIi4uLy4uL3RocmVlLXZybS1tYXRlcmlhbHMtbXRvb24vc3JjL3NoYWRlcnMvbXRvb24udmVydCIsICIuLi8uLi90aHJlZS12cm0tbWF0ZXJpYWxzLW10b29uL3NyYy9zaGFkZXJzL210b29uLmZyYWciLCAiLi4vLi4vdGhyZWUtdnJtLW1hdGVyaWFscy1tdG9vbi9zcmMvTVRvb25NYXRlcmlhbERlYnVnTW9kZS50cyIsICIuLi8uLi90aHJlZS12cm0tbWF0ZXJpYWxzLW10b29uL3NyYy9NVG9vbk1hdGVyaWFsT3V0bGluZVdpZHRoTW9kZS50cyIsICIuLi8uLi90aHJlZS12cm0tbWF0ZXJpYWxzLW10b29uL3NyYy91dGlscy9nZXRUZXh0dXJlQ29sb3JTcGFjZS50cyIsICIuLi8uLi90aHJlZS12cm0tbWF0ZXJpYWxzLWhkci1lbWlzc2l2ZS1tdWx0aXBsaWVyL3NyYy9WUk1NYXRlcmlhbHNIRFJFbWlzc2l2ZU11bHRpcGxpZXJMb2FkZXJQbHVnaW4udHMiLCAiLi4vLi4vdGhyZWUtdnJtLW1hdGVyaWFscy12MGNvbXBhdC9zcmMvVlJNTWF0ZXJpYWxzVjBDb21wYXRQbHVnaW4udHMiLCAiLi4vLi4vdGhyZWUtdnJtLW1hdGVyaWFscy12MGNvbXBhdC9zcmMvdXRpbHMvZ2FtbWFFT1RGLnRzIiwgIi4uLy4uL3RocmVlLXZybS1ub2RlLWNvbnN0cmFpbnQvc3JjL2hlbHBlcnMvVlJNTm9kZUNvbnN0cmFpbnRIZWxwZXIudHMiLCAiLi4vLi4vdGhyZWUtdnJtLW5vZGUtY29uc3RyYWludC9zcmMvVlJNQWltQ29uc3RyYWludC50cyIsICIuLi8uLi90aHJlZS12cm0tbm9kZS1jb25zdHJhaW50L3NyYy91dGlscy9kZWNvbXBvc2VQb3NpdGlvbi50cyIsICIuLi8uLi90aHJlZS12cm0tbm9kZS1jb25zdHJhaW50L3NyYy91dGlscy9kZWNvbXBvc2VSb3RhdGlvbi50cyIsICIuLi8uLi90aHJlZS12cm0tbm9kZS1jb25zdHJhaW50L3NyYy91dGlscy9xdWF0SW52ZXJ0Q29tcGF0LnRzIiwgIi4uLy4uL3RocmVlLXZybS1ub2RlLWNvbnN0cmFpbnQvc3JjL1ZSTU5vZGVDb25zdHJhaW50LnRzIiwgIi4uLy4uL3RocmVlLXZybS1ub2RlLWNvbnN0cmFpbnQvc3JjL3V0aWxzL3RyYXZlcnNlQW5jZXN0b3JzRnJvbVJvb3QudHMiLCAiLi4vLi4vdGhyZWUtdnJtLW5vZGUtY29uc3RyYWludC9zcmMvVlJNTm9kZUNvbnN0cmFpbnRNYW5hZ2VyLnRzIiwgIi4uLy4uL3RocmVlLXZybS1ub2RlLWNvbnN0cmFpbnQvc3JjL1ZSTVJvdGF0aW9uQ29uc3RyYWludC50cyIsICIuLi8uLi90aHJlZS12cm0tbm9kZS1jb25zdHJhaW50L3NyYy9WUk1Sb2xsQ29uc3RyYWludC50cyIsICIuLi8uLi90aHJlZS12cm0tbm9kZS1jb25zdHJhaW50L3NyYy9WUk1Ob2RlQ29uc3RyYWludExvYWRlclBsdWdpbi50cyIsICIuLi8uLi90aHJlZS12cm0tc3ByaW5nYm9uZS9zcmMvaGVscGVycy9WUk1TcHJpbmdCb25lQ29sbGlkZXJIZWxwZXIudHMiLCAiLi4vLi4vdGhyZWUtdnJtLXNwcmluZ2JvbmUvc3JjL1ZSTVNwcmluZ0JvbmVDb2xsaWRlclNoYXBlQ2Fwc3VsZS50cyIsICIuLi8uLi90aHJlZS12cm0tc3ByaW5nYm9uZS9zcmMvVlJNU3ByaW5nQm9uZUNvbGxpZGVyU2hhcGUudHMiLCAiLi4vLi4vdGhyZWUtdnJtLXNwcmluZ2JvbmUvc3JjL1ZSTVNwcmluZ0JvbmVDb2xsaWRlclNoYXBlUGxhbmUudHMiLCAiLi4vLi4vdGhyZWUtdnJtLXNwcmluZ2JvbmUvc3JjL1ZSTVNwcmluZ0JvbmVDb2xsaWRlclNoYXBlU3BoZXJlLnRzIiwgIi4uLy4uL3RocmVlLXZybS1zcHJpbmdib25lL3NyYy9oZWxwZXJzL3V0aWxzL0NvbGxpZGVyU2hhcGVDYXBzdWxlQnVmZmVyR2VvbWV0cnkudHMiLCAiLi4vLi4vdGhyZWUtdnJtLXNwcmluZ2JvbmUvc3JjL2hlbHBlcnMvdXRpbHMvQ29sbGlkZXJTaGFwZVBsYW5lQnVmZmVyR2VvbWV0cnkudHMiLCAiLi4vLi4vdGhyZWUtdnJtLXNwcmluZ2JvbmUvc3JjL2hlbHBlcnMvdXRpbHMvQ29sbGlkZXJTaGFwZVNwaGVyZUJ1ZmZlckdlb21ldHJ5LnRzIiwgIi4uLy4uL3RocmVlLXZybS1zcHJpbmdib25lL3NyYy9oZWxwZXJzL1ZSTVNwcmluZ0JvbmVKb2ludEhlbHBlci50cyIsICIuLi8uLi90aHJlZS12cm0tc3ByaW5nYm9uZS9zcmMvaGVscGVycy91dGlscy9TcHJpbmdCb25lQnVmZmVyR2VvbWV0cnkudHMiLCAiLi4vLi4vdGhyZWUtdnJtLXNwcmluZ2JvbmUvc3JjL1ZSTVNwcmluZ0JvbmVDb2xsaWRlci50cyIsICIuLi8uLi90aHJlZS12cm0tc3ByaW5nYm9uZS9zcmMvVlJNU3ByaW5nQm9uZUpvaW50LnRzIiwgIi4uLy4uL3RocmVlLXZybS1zcHJpbmdib25lL3NyYy91dGlscy9tYXQ0SW52ZXJ0Q29tcGF0LnRzIiwgIi4uLy4uL3RocmVlLXZybS1zcHJpbmdib25lL3NyYy91dGlscy9NYXRyaXg0SW52ZXJzZUNhY2hlLnRzIiwgIi4uLy4uL3RocmVlLXZybS1zcHJpbmdib25lL3NyYy9WUk1TcHJpbmdCb25lTG9hZGVyUGx1Z2luLnRzIiwgIi4uLy4uL3RocmVlLXZybS1zcHJpbmdib25lL3NyYy91dGlscy90cmF2ZXJzZUFuY2VzdG9yc0Zyb21Sb290LnRzIiwgIi4uLy4uL3RocmVlLXZybS1zcHJpbmdib25lL3NyYy91dGlscy90cmF2ZXJzZUNoaWxkcmVuVW50aWxDb25kaXRpb25NZXQudHMiLCAiLi4vLi4vdGhyZWUtdnJtLXNwcmluZ2JvbmUvc3JjL1ZSTVNwcmluZ0JvbmVNYW5hZ2VyLnRzIiwgIi4uL3NyYy9WUk1Mb2FkZXJQbHVnaW4udHMiLCAiLi4vc3JjL1ZSTVV0aWxzL2RlZXBEaXNwb3NlLnRzIiwgIi4uL3NyYy9WUk1VdGlscy9yZW1vdmVVbm5lY2Vzc2FyeUpvaW50cy50cyIsICIuLi9zcmMvVlJNVXRpbHMvcmVtb3ZlVW5uZWNlc3NhcnlWZXJ0aWNlcy50cyIsICIuLi9zcmMvVlJNVXRpbHMvcm90YXRlVlJNMC50cyIsICIuLi9zcmMvVlJNVXRpbHMvaW5kZXgudHMiXSwKICAic291cmNlc0NvbnRlbnQiOiBbImV4cG9ydCB7IFZSTSB9IGZyb20gJy4vVlJNJztcbmV4cG9ydCB7IFZSTUxvYWRlclBsdWdpbiB9IGZyb20gJy4vVlJNTG9hZGVyUGx1Z2luJztcbmV4cG9ydCB0eXBlIHsgVlJNTG9hZGVyUGx1Z2luT3B0aW9ucyB9IGZyb20gJy4vVlJNTG9hZGVyUGx1Z2luT3B0aW9ucyc7XG5leHBvcnQgdHlwZSB7IFZSTVBhcmFtZXRlcnMgfSBmcm9tICcuL1ZSTVBhcmFtZXRlcnMnO1xuXG5leHBvcnQgKiBmcm9tICcuL1ZSTVV0aWxzJztcblxuZXhwb3J0ICogZnJvbSAnQHBpeGl2L3RocmVlLXZybS1jb3JlJztcbmV4cG9ydCAqIGZyb20gJ0BwaXhpdi90aHJlZS12cm0tbWF0ZXJpYWxzLW10b29uJztcbmV4cG9ydCAqIGZyb20gJ0BwaXhpdi90aHJlZS12cm0tbm9kZS1jb25zdHJhaW50JztcbmV4cG9ydCAqIGZyb20gJ0BwaXhpdi90aHJlZS12cm0tc3ByaW5nYm9uZSc7XG4iLCAiaW1wb3J0ICogYXMgVEhSRUUgZnJvbSAndGhyZWUnO1xuaW1wb3J0IHsgVlJNRXhwcmVzc2lvbkJpbmQgfSBmcm9tICcuL1ZSTUV4cHJlc3Npb25CaW5kJztcbmltcG9ydCB0eXBlIHsgVlJNRXhwcmVzc2lvbk92ZXJyaWRlVHlwZSB9IGZyb20gJy4vVlJNRXhwcmVzc2lvbk92ZXJyaWRlVHlwZSc7XG5pbXBvcnQgdHlwZSB7IFZSTUV4cHJlc3Npb25NYW5hZ2VyIH0gZnJvbSAnLi9WUk1FeHByZXNzaW9uTWFuYWdlcic7XG5cbi8vIGFuaW1hdGlvbk1peGVyIFx1MzA2RVx1NzZFM1x1ODk5Nlx1NUJGRVx1OEM2MVx1MzA2Rlx1MzAwMVNjZW5lIFx1MzA2RVx1NEUyRFx1MzA2Qlx1NTE2NVx1MzA2M1x1MzA2Nlx1MzA0NFx1MzA4Qlx1NUZDNVx1ODk4MVx1MzA0Q1x1MzA0Mlx1MzA4Qlx1MzAwMlxuLy8gXHUzMDVEXHUzMDZFXHUzMDVGXHUzMDgxXHUzMDAxXHU4ODY4XHU3OTNBXHUzMEFBXHUzMEQ2XHUzMEI4XHUzMEE3XHUzMEFGXHUzMEM4XHUzMDY3XHUzMDZGXHUzMDZBXHUzMDQ0XHUzMDUxXHUzMDhDXHUzMDY5XHUzMDAxT2JqZWN0M0QgXHUzMDkyXHU3RDk5XHU2MjdGXHUzMDU3XHUzMDY2IFNjZW5lIFx1MzA2Qlx1NjI5NVx1NTE2NVx1MzA2N1x1MzA0RFx1MzA4Qlx1MzA4OFx1MzA0Nlx1MzA2Qlx1MzA1OVx1MzA4Qlx1MzAwMlxuZXhwb3J0IGNsYXNzIFZSTUV4cHJlc3Npb24gZXh0ZW5kcyBUSFJFRS5PYmplY3QzRCB7XG4gIC8qKlxuICAgKiBOYW1lIG9mIHRoaXMgZXhwcmVzc2lvbi5cbiAgICogRGlzdGluZ3Vpc2hlZCB3aXRoIGBuYW1lYCBzaW5jZSBgbmFtZWAgd2lsbCBiZSBjb25mbGljdGVkIHdpdGggT2JqZWN0M0QuXG4gICAqL1xuICBwdWJsaWMgZXhwcmVzc2lvbk5hbWU6IHN0cmluZztcblxuICAvKipcbiAgICogVGhlIGN1cnJlbnQgd2VpZ2h0IG9mIHRoZSBleHByZXNzaW9uLlxuICAgKlxuICAgKiBZb3UgdXN1YWxseSB3YW50IHRvIHNldCB0aGUgd2VpZ2h0IHZpYSB7QGxpbmsgVlJNRXhwcmVzc2lvbk1hbmFnZXIuc2V0VmFsdWV9LlxuICAgKlxuICAgKiBJdCBtaWdodCBhbHNvIGJlIGNvbnRyb2xsZWQgYnkgdGhlIFRocmVlLmpzIGFuaW1hdGlvbiBzeXN0ZW0uXG4gICAqL1xuICBwdWJsaWMgd2VpZ2h0ID0gMC4wO1xuXG4gIC8qKlxuICAgKiBJbnRlcnByZXQgdmFsdWVzIGdyZWF0ZXIgdGhhbiAwLjUgYXMgMS4wLCBvcnRoZXJ3aXNlIDAuMC5cbiAgICovXG4gIHB1YmxpYyBpc0JpbmFyeSA9IGZhbHNlO1xuXG4gIC8qKlxuICAgKiBTcGVjaWZ5IGhvdyB0aGUgZXhwcmVzc2lvbiBvdmVycmlkZXMgYmxpbmsgZXhwcmVzc2lvbnMuXG4gICAqL1xuICBwdWJsaWMgb3ZlcnJpZGVCbGluazogVlJNRXhwcmVzc2lvbk92ZXJyaWRlVHlwZSA9ICdub25lJztcblxuICAvKipcbiAgICogU3BlY2lmeSBob3cgdGhlIGV4cHJlc3Npb24gb3ZlcnJpZGVzIGxvb2tBdCBleHByZXNzaW9ucy5cbiAgICovXG4gIHB1YmxpYyBvdmVycmlkZUxvb2tBdDogVlJNRXhwcmVzc2lvbk92ZXJyaWRlVHlwZSA9ICdub25lJztcblxuICAvKipcbiAgICogU3BlY2lmeSBob3cgdGhlIGV4cHJlc3Npb24gb3ZlcnJpZGVzIG1vdXRoIGV4cHJlc3Npb25zLlxuICAgKi9cbiAgcHVibGljIG92ZXJyaWRlTW91dGg6IFZSTUV4cHJlc3Npb25PdmVycmlkZVR5cGUgPSAnbm9uZSc7XG5cbiAgcHJpdmF0ZSBfYmluZHM6IFZSTUV4cHJlc3Npb25CaW5kW10gPSBbXTtcblxuICBvdmVycmlkZSByZWFkb25seSB0eXBlOiBzdHJpbmcgfCAnVlJNRXhwcmVzc2lvbic7XG5cbiAgLyoqXG4gICAqIEEgdmFsdWUgcmVwcmVzZW50cyBob3cgbXVjaCBpdCBzaG91bGQgb3ZlcnJpZGUgYmxpbmsgZXhwcmVzc2lvbnMuXG4gICAqIGAwLjBgID09IG5vIG92ZXJyaWRlIGF0IGFsbCwgYDEuMGAgPT0gY29tcGxldGVseSBibG9jayB0aGUgZXhwcmVzc2lvbnMuXG4gICAqL1xuICBwdWJsaWMgZ2V0IG92ZXJyaWRlQmxpbmtBbW91bnQoKTogbnVtYmVyIHtcbiAgICBpZiAodGhpcy5vdmVycmlkZUJsaW5rID09PSAnYmxvY2snKSB7XG4gICAgICByZXR1cm4gMC4wIDwgdGhpcy5vdXRwdXRXZWlnaHQgPyAxLjAgOiAwLjA7XG4gICAgfSBlbHNlIGlmICh0aGlzLm92ZXJyaWRlQmxpbmsgPT09ICdibGVuZCcpIHtcbiAgICAgIHJldHVybiB0aGlzLm91dHB1dFdlaWdodDtcbiAgICB9IGVsc2Uge1xuICAgICAgcmV0dXJuIDAuMDtcbiAgICB9XG4gIH1cblxuICAvKipcbiAgICogQSB2YWx1ZSByZXByZXNlbnRzIGhvdyBtdWNoIGl0IHNob3VsZCBvdmVycmlkZSBsb29rQXQgZXhwcmVzc2lvbnMuXG4gICAqIGAwLjBgID09IG5vIG92ZXJyaWRlIGF0IGFsbCwgYDEuMGAgPT0gY29tcGxldGVseSBibG9jayB0aGUgZXhwcmVzc2lvbnMuXG4gICAqL1xuICBwdWJsaWMgZ2V0IG92ZXJyaWRlTG9va0F0QW1vdW50KCk6IG51bWJlciB7XG4gICAgaWYgKHRoaXMub3ZlcnJpZGVMb29rQXQgPT09ICdibG9jaycpIHtcbiAgICAgIHJldHVybiAwLjAgPCB0aGlzLm91dHB1dFdlaWdodCA/IDEuMCA6IDAuMDtcbiAgICB9IGVsc2UgaWYgKHRoaXMub3ZlcnJpZGVMb29rQXQgPT09ICdibGVuZCcpIHtcbiAgICAgIHJldHVybiB0aGlzLm91dHB1dFdlaWdodDtcbiAgICB9IGVsc2Uge1xuICAgICAgcmV0dXJuIDAuMDtcbiAgICB9XG4gIH1cblxuICAvKipcbiAgICogQSB2YWx1ZSByZXByZXNlbnRzIGhvdyBtdWNoIGl0IHNob3VsZCBvdmVycmlkZSBtb3V0aCBleHByZXNzaW9ucy5cbiAgICogYDAuMGAgPT0gbm8gb3ZlcnJpZGUgYXQgYWxsLCBgMS4wYCA9PSBjb21wbGV0ZWx5IGJsb2NrIHRoZSBleHByZXNzaW9ucy5cbiAgICovXG4gIHB1YmxpYyBnZXQgb3ZlcnJpZGVNb3V0aEFtb3VudCgpOiBudW1iZXIge1xuICAgIGlmICh0aGlzLm92ZXJyaWRlTW91dGggPT09ICdibG9jaycpIHtcbiAgICAgIHJldHVybiAwLjAgPCB0aGlzLm91dHB1dFdlaWdodCA/IDEuMCA6IDAuMDtcbiAgICB9IGVsc2UgaWYgKHRoaXMub3ZlcnJpZGVNb3V0aCA9PT0gJ2JsZW5kJykge1xuICAgICAgcmV0dXJuIHRoaXMub3V0cHV0V2VpZ2h0O1xuICAgIH0gZWxzZSB7XG4gICAgICByZXR1cm4gMC4wO1xuICAgIH1cbiAgfVxuXG4gIC8qKlxuICAgKiBBbiBvdXRwdXQgd2VpZ2h0IG9mIHRoaXMgZXhwcmVzc2lvbiwgY29uc2lkZXJpbmcgdGhlIHtAbGluayBpc0JpbmFyeX0uXG4gICAqL1xuICBwdWJsaWMgZ2V0IG91dHB1dFdlaWdodCgpOiBudW1iZXIge1xuICAgIGlmICh0aGlzLmlzQmluYXJ5KSB7XG4gICAgICByZXR1cm4gdGhpcy53ZWlnaHQgPiAwLjUgPyAxLjAgOiAwLjA7XG4gICAgfVxuXG4gICAgcmV0dXJuIHRoaXMud2VpZ2h0O1xuICB9XG5cbiAgY29uc3RydWN0b3IoZXhwcmVzc2lvbk5hbWU6IHN0cmluZykge1xuICAgIHN1cGVyKCk7XG5cbiAgICB0aGlzLm5hbWUgPSBgVlJNRXhwcmVzc2lvbl8ke2V4cHJlc3Npb25OYW1lfWA7XG4gICAgdGhpcy5leHByZXNzaW9uTmFtZSA9IGV4cHJlc3Npb25OYW1lO1xuXG4gICAgLy8gdHJhdmVyc2UgXHU2NjQyXHUzMDZFXHU2NTUxXHU2RTA4XHU2MjRCXHU2QkI1XHUzMDY4XHUzMDU3XHUzMDY2IE9iamVjdDNEIFx1MzA2N1x1MzA2Rlx1MzA2QVx1MzA0NFx1MzA1M1x1MzA2OFx1MzA5Mlx1NjYwRVx1NzkzQVx1MzA1N1x1MzA2Nlx1MzA0QVx1MzA0RlxuICAgIHRoaXMudHlwZSA9ICdWUk1FeHByZXNzaW9uJztcblxuICAgIC8vIFx1ODg2OFx1NzkzQVx1NzZFRVx1NzY4NFx1MzA2RVx1MzBBQVx1MzBENlx1MzBCOFx1MzBBN1x1MzBBRlx1MzBDOFx1MzA2N1x1MzA2Rlx1MzA2QVx1MzA0NFx1MzA2RVx1MzA2N1x1MzAwMVx1OENBMFx1ODM3N1x1OEVGRFx1NkUxQlx1MzA2RVx1MzA1Rlx1MzA4MVx1MzA2QiB2aXNpYmxlIFx1MzA5MiBmYWxzZSBcdTMwNkJcdTMwNTdcdTMwNjZcdTMwNEFcdTMwNEZcdTMwMDJcbiAgICAvLyBcdTMwNTNcdTMwOENcdTMwNkJcdTMwODhcdTMwOEFcdTMwMDFcdTMwNTNcdTMwNkVcdTMwQTRcdTMwRjNcdTMwQjlcdTMwQkZcdTMwRjNcdTMwQjlcdTMwNkJcdTVCRkVcdTMwNTlcdTMwOEJcdTZCQ0VcdTMwRDVcdTMwRUNcdTMwRkNcdTMwRTBcdTMwNkUgbWF0cml4IFx1ODFFQVx1NTJENVx1OEEwOFx1N0I5N1x1MzA5Mlx1NzcwMVx1NzU2NVx1MzA2N1x1MzA0RFx1MzA4Qlx1MzAwMlxuICAgIHRoaXMudmlzaWJsZSA9IGZhbHNlO1xuICB9XG5cbiAgcHVibGljIGFkZEJpbmQoYmluZDogVlJNRXhwcmVzc2lvbkJpbmQpOiB2b2lkIHtcbiAgICB0aGlzLl9iaW5kcy5wdXNoKGJpbmQpO1xuICB9XG5cbiAgLyoqXG4gICAqIEFwcGx5IHdlaWdodCB0byBldmVyeSBhc3NpZ25lZCBibGVuZCBzaGFwZXMuXG4gICAqIFNob3VsZCBiZSBjYWxsZWQgZXZlcnkgZnJhbWUuXG4gICAqL1xuICBwdWJsaWMgYXBwbHlXZWlnaHQob3B0aW9ucz86IHtcbiAgICAvKipcbiAgICAgKiBNdWx0aXBsaWVzIGEgdmFsdWUgdG8gaXRzIHdlaWdodCB0byBhcHBseS5cbiAgICAgKiBJbnRlbmRlZCB0byBiZSB1c2VkIGZvciBvdmVycmlkaW5nIGFuIGV4cHJlc3Npb24gd2VpZ2h0IGJ5IGFub3RoZXIgZXhwcmVzc2lvbi5cbiAgICAgKiBTZWUgYWxzbzoge0BsaW5rIG92ZXJyaWRlQmxpbmt9LCB7QGxpbmsgb3ZlcnJpZGVMb29rQXR9LCB7QGxpbmsgb3ZlcnJpZGVNb3V0aH1cbiAgICAgKi9cbiAgICBtdWx0aXBsaWVyPzogbnVtYmVyO1xuICB9KTogdm9pZCB7XG4gICAgbGV0IGFjdHVhbFdlaWdodCA9IHRoaXMub3V0cHV0V2VpZ2h0O1xuICAgIGFjdHVhbFdlaWdodCAqPSBvcHRpb25zPy5tdWx0aXBsaWVyID8/IDEuMDtcblxuICAgIC8vIGlmIHRoZSBleHByZXNzaW9uIGlzIGJpbmFyeSwgdGhlIG92ZXJyaWRlIHZhbHVlIG11c3QgYmUgYWxzbyB0cmVhdGVkIGFzIGJpbmFyeVxuICAgIGlmICh0aGlzLmlzQmluYXJ5ICYmIGFjdHVhbFdlaWdodCA8IDEuMCkge1xuICAgICAgYWN0dWFsV2VpZ2h0ID0gMC4wO1xuICAgIH1cblxuICAgIHRoaXMuX2JpbmRzLmZvckVhY2goKGJpbmQpID0+IGJpbmQuYXBwbHlXZWlnaHQoYWN0dWFsV2VpZ2h0KSk7XG4gIH1cblxuICAvKipcbiAgICogQ2xlYXIgcHJldmlvdXNseSBhc3NpZ25lZCBibGVuZCBzaGFwZXMuXG4gICAqL1xuICBwdWJsaWMgY2xlYXJBcHBsaWVkV2VpZ2h0KCk6IHZvaWQge1xuICAgIHRoaXMuX2JpbmRzLmZvckVhY2goKGJpbmQpID0+IGJpbmQuY2xlYXJBcHBsaWVkV2VpZ2h0KCkpO1xuICB9XG59XG4iLCAiaW1wb3J0IHR5cGUgKiBhcyBWMFZSTSBmcm9tICdAcGl4aXYvdHlwZXMtdnJtLTAuMCc7XG5pbXBvcnQgdHlwZSAqIGFzIFYxVlJNU2NoZW1hIGZyb20gJ0BwaXhpdi90eXBlcy12cm1jLXZybS0xLjAnO1xuaW1wb3J0ICogYXMgVEhSRUUgZnJvbSAndGhyZWUnO1xuaW1wb3J0IHsgR0xURiwgR0xURkxvYWRlclBsdWdpbiwgR0xURlBhcnNlciB9IGZyb20gJ3RocmVlL2V4YW1wbGVzL2pzbS9sb2FkZXJzL0dMVEZMb2FkZXIuanMnO1xuaW1wb3J0IHsgZ2x0ZkV4dHJhY3RQcmltaXRpdmVzRnJvbU5vZGUgfSBmcm9tICcuLi91dGlscy9nbHRmRXh0cmFjdFByaW1pdGl2ZXNGcm9tTm9kZSc7XG5pbXBvcnQgeyBWUk1FeHByZXNzaW9uIH0gZnJvbSAnLi9WUk1FeHByZXNzaW9uJztcbmltcG9ydCB7IFZSTUV4cHJlc3Npb25NYW5hZ2VyIH0gZnJvbSAnLi9WUk1FeHByZXNzaW9uTWFuYWdlcic7XG5pbXBvcnQgeyB2MEV4cHJlc3Npb25NYXRlcmlhbENvbG9yTWFwIH0gZnJvbSAnLi9WUk1FeHByZXNzaW9uTWF0ZXJpYWxDb2xvclR5cGUnO1xuaW1wb3J0IHsgVlJNRXhwcmVzc2lvbk1hdGVyaWFsQ29sb3JCaW5kIH0gZnJvbSAnLi9WUk1FeHByZXNzaW9uTWF0ZXJpYWxDb2xvckJpbmQnO1xuaW1wb3J0IHsgVlJNRXhwcmVzc2lvbk1vcnBoVGFyZ2V0QmluZCB9IGZyb20gJy4vVlJNRXhwcmVzc2lvbk1vcnBoVGFyZ2V0QmluZCc7XG5pbXBvcnQgeyBWUk1FeHByZXNzaW9uUHJlc2V0TmFtZSB9IGZyb20gJy4vVlJNRXhwcmVzc2lvblByZXNldE5hbWUnO1xuaW1wb3J0IHsgVlJNRXhwcmVzc2lvblRleHR1cmVUcmFuc2Zvcm1CaW5kIH0gZnJvbSAnLi9WUk1FeHByZXNzaW9uVGV4dHVyZVRyYW5zZm9ybUJpbmQnO1xuaW1wb3J0IHsgR0xURiBhcyBHTFRGU2NoZW1hIH0gZnJvbSAnQGdsdGYtdHJhbnNmb3JtL2NvcmUnO1xuXG4vKipcbiAqIFBvc3NpYmxlIHNwZWMgdmVyc2lvbnMgaXQgcmVjb2duaXplcy5cbiAqL1xuY29uc3QgUE9TU0lCTEVfU1BFQ19WRVJTSU9OUyA9IG5ldyBTZXQoWycxLjAnLCAnMS4wLWJldGEnXSk7XG5cbi8qKlxuICogQSBwbHVnaW4gb2YgR0xURkxvYWRlciB0aGF0IGltcG9ydHMgYSB7QGxpbmsgVlJNRXhwcmVzc2lvbk1hbmFnZXJ9IGZyb20gYSBWUk0gZXh0ZW5zaW9uIG9mIGEgR0xURi5cbiAqL1xuZXhwb3J0IGNsYXNzIFZSTUV4cHJlc3Npb25Mb2FkZXJQbHVnaW4gaW1wbGVtZW50cyBHTFRGTG9hZGVyUGx1Z2luIHtcbiAgcHVibGljIHN0YXRpYyByZWFkb25seSB2MHYxUHJlc2V0TmFtZU1hcDogeyBbdjBOYW1lIGluIFYwVlJNLkJsZW5kU2hhcGVQcmVzZXROYW1lXT86IFZSTUV4cHJlc3Npb25QcmVzZXROYW1lIH0gPSB7XG4gICAgYTogJ2FhJyxcbiAgICBlOiAnZWUnLFxuICAgIGk6ICdpaCcsXG4gICAgbzogJ29oJyxcbiAgICB1OiAnb3UnLFxuICAgIGJsaW5rOiAnYmxpbmsnLFxuICAgIGpveTogJ2hhcHB5JyxcbiAgICBhbmdyeTogJ2FuZ3J5JyxcbiAgICBzb3Jyb3c6ICdzYWQnLFxuICAgIGZ1bjogJ3JlbGF4ZWQnLFxuICAgIGxvb2t1cDogJ2xvb2tVcCcsXG4gICAgbG9va2Rvd246ICdsb29rRG93bicsXG4gICAgbG9va2xlZnQ6ICdsb29rTGVmdCcsXG4gICAgbG9va3JpZ2h0OiAnbG9va1JpZ2h0JyxcbiAgICAvLyBlc2xpbnQtZGlzYWJsZS1uZXh0LWxpbmUgQHR5cGVzY3JpcHQtZXNsaW50L25hbWluZy1jb252ZW50aW9uXG4gICAgYmxpbmtfbDogJ2JsaW5rTGVmdCcsXG4gICAgLy8gZXNsaW50LWRpc2FibGUtbmV4dC1saW5lIEB0eXBlc2NyaXB0LWVzbGludC9uYW1pbmctY29udmVudGlvblxuICAgIGJsaW5rX3I6ICdibGlua1JpZ2h0JyxcbiAgICBuZXV0cmFsOiAnbmV1dHJhbCcsXG4gIH07XG5cbiAgcHVibGljIHJlYWRvbmx5IHBhcnNlcjogR0xURlBhcnNlcjtcblxuICBwdWJsaWMgZ2V0IG5hbWUoKTogc3RyaW5nIHtcbiAgICAvLyBXZSBzaG91bGQgdXNlIHRoZSBleHRlbnNpb24gbmFtZSBpbnN0ZWFkIGJ1dCB3ZSBoYXZlIG11bHRpcGxlIHBsdWdpbnMgZm9yIGFuIGV4dGVuc2lvbi4uLlxuICAgIHJldHVybiAnVlJNRXhwcmVzc2lvbkxvYWRlclBsdWdpbic7XG4gIH1cblxuICBwdWJsaWMgY29uc3RydWN0b3IocGFyc2VyOiBHTFRGUGFyc2VyKSB7XG4gICAgdGhpcy5wYXJzZXIgPSBwYXJzZXI7XG4gIH1cblxuICBwdWJsaWMgYXN5bmMgYWZ0ZXJSb290KGdsdGY6IEdMVEYpOiBQcm9taXNlPHZvaWQ+IHtcbiAgICBnbHRmLnVzZXJEYXRhLnZybUV4cHJlc3Npb25NYW5hZ2VyID0gYXdhaXQgdGhpcy5faW1wb3J0KGdsdGYpO1xuICB9XG5cbiAgLyoqXG4gICAqIEltcG9ydCBhIHtAbGluayBWUk1FeHByZXNzaW9uTWFuYWdlcn0gZnJvbSBhIFZSTS5cbiAgICpcbiAgICogQHBhcmFtIGdsdGYgQSBwYXJzZWQgcmVzdWx0IG9mIEdMVEYgdGFrZW4gZnJvbSBHTFRGTG9hZGVyXG4gICAqL1xuICBwcml2YXRlIGFzeW5jIF9pbXBvcnQoZ2x0ZjogR0xURik6IFByb21pc2U8VlJNRXhwcmVzc2lvbk1hbmFnZXIgfCBudWxsPiB7XG4gICAgY29uc3QgdjFSZXN1bHQgPSBhd2FpdCB0aGlzLl92MUltcG9ydChnbHRmKTtcbiAgICBpZiAodjFSZXN1bHQpIHtcbiAgICAgIHJldHVybiB2MVJlc3VsdDtcbiAgICB9XG5cbiAgICBjb25zdCB2MFJlc3VsdCA9IGF3YWl0IHRoaXMuX3YwSW1wb3J0KGdsdGYpO1xuICAgIGlmICh2MFJlc3VsdCkge1xuICAgICAgcmV0dXJuIHYwUmVzdWx0O1xuICAgIH1cblxuICAgIHJldHVybiBudWxsO1xuICB9XG5cbiAgcHJpdmF0ZSBhc3luYyBfdjFJbXBvcnQoZ2x0ZjogR0xURik6IFByb21pc2U8VlJNRXhwcmVzc2lvbk1hbmFnZXIgfCBudWxsPiB7XG4gICAgY29uc3QganNvbiA9IHRoaXMucGFyc2VyLmpzb24gYXMgR0xURlNjaGVtYS5JR0xURjtcblxuICAgIC8vIGVhcmx5IGFib3J0IGlmIGl0IGRvZXNuJ3QgdXNlIHZybVxuICAgIGNvbnN0IGlzVlJNVXNlZCA9IGpzb24uZXh0ZW5zaW9uc1VzZWQ/LmluZGV4T2YoJ1ZSTUNfdnJtJykgIT09IC0xO1xuICAgIGlmICghaXNWUk1Vc2VkKSB7XG4gICAgICByZXR1cm4gbnVsbDtcbiAgICB9XG5cbiAgICBjb25zdCBleHRlbnNpb24gPSBqc29uLmV4dGVuc2lvbnM/LlsnVlJNQ192cm0nXSBhcyBWMVZSTVNjaGVtYS5WUk1DVlJNIHwgdW5kZWZpbmVkO1xuICAgIGlmICghZXh0ZW5zaW9uKSB7XG4gICAgICByZXR1cm4gbnVsbDtcbiAgICB9XG5cbiAgICBjb25zdCBzcGVjVmVyc2lvbiA9IGV4dGVuc2lvbi5zcGVjVmVyc2lvbjtcbiAgICBpZiAoIVBPU1NJQkxFX1NQRUNfVkVSU0lPTlMuaGFzKHNwZWNWZXJzaW9uKSkge1xuICAgICAgY29uc29sZS53YXJuKGBWUk1FeHByZXNzaW9uTG9hZGVyUGx1Z2luOiBVbmtub3duIFZSTUNfdnJtIHNwZWNWZXJzaW9uIFwiJHtzcGVjVmVyc2lvbn1cImApO1xuICAgICAgcmV0dXJuIG51bGw7XG4gICAgfVxuXG4gICAgY29uc3Qgc2NoZW1hRXhwcmVzc2lvbnMgPSBleHRlbnNpb24uZXhwcmVzc2lvbnM7XG4gICAgaWYgKCFzY2hlbWFFeHByZXNzaW9ucykge1xuICAgICAgcmV0dXJuIG51bGw7XG4gICAgfVxuXG4gICAgLy8gbGlzdCBleHByZXNzaW9uc1xuICAgIGNvbnN0IHByZXNldE5hbWVTZXQgPSBuZXcgU2V0PHN0cmluZz4oT2JqZWN0LnZhbHVlcyhWUk1FeHByZXNzaW9uUHJlc2V0TmFtZSkpO1xuICAgIGNvbnN0IG5hbWVTY2hlbWFFeHByZXNzaW9uTWFwID0gbmV3IE1hcDxzdHJpbmcsIFYxVlJNU2NoZW1hLkV4cHJlc3Npb24+KCk7XG5cbiAgICBpZiAoc2NoZW1hRXhwcmVzc2lvbnMucHJlc2V0ICE9IG51bGwpIHtcbiAgICAgIE9iamVjdC5lbnRyaWVzKHNjaGVtYUV4cHJlc3Npb25zLnByZXNldCkuZm9yRWFjaCgoW25hbWUsIHNjaGVtYUV4cHJlc3Npb25dKSA9PiB7XG4gICAgICAgIGlmIChzY2hlbWFFeHByZXNzaW9uID09IG51bGwpIHtcbiAgICAgICAgICByZXR1cm47XG4gICAgICAgIH0gLy8gdHlwZXNjcmlwdFxuXG4gICAgICAgIGlmICghcHJlc2V0TmFtZVNldC5oYXMobmFtZSkpIHtcbiAgICAgICAgICBjb25zb2xlLndhcm4oYFZSTUV4cHJlc3Npb25Mb2FkZXJQbHVnaW46IFVua25vd24gcHJlc2V0IG5hbWUgXCIke25hbWV9XCIgZGV0ZWN0ZWQuIElnbm9yaW5nIHRoZSBleHByZXNzaW9uYCk7XG4gICAgICAgICAgcmV0dXJuO1xuICAgICAgICB9XG5cbiAgICAgICAgbmFtZVNjaGVtYUV4cHJlc3Npb25NYXAuc2V0KG5hbWUsIHNjaGVtYUV4cHJlc3Npb24pO1xuICAgICAgfSk7XG4gICAgfVxuXG4gICAgaWYgKHNjaGVtYUV4cHJlc3Npb25zLmN1c3RvbSAhPSBudWxsKSB7XG4gICAgICBPYmplY3QuZW50cmllcyhzY2hlbWFFeHByZXNzaW9ucy5jdXN0b20pLmZvckVhY2goKFtuYW1lLCBzY2hlbWFFeHByZXNzaW9uXSkgPT4ge1xuICAgICAgICBpZiAocHJlc2V0TmFtZVNldC5oYXMobmFtZSkpIHtcbiAgICAgICAgICBjb25zb2xlLndhcm4oXG4gICAgICAgICAgICBgVlJNRXhwcmVzc2lvbkxvYWRlclBsdWdpbjogQ3VzdG9tIGV4cHJlc3Npb24gY2Fubm90IGhhdmUgcHJlc2V0IG5hbWUgXCIke25hbWV9XCIuIElnbm9yaW5nIHRoZSBleHByZXNzaW9uYCxcbiAgICAgICAgICApO1xuICAgICAgICAgIHJldHVybjtcbiAgICAgICAgfVxuXG4gICAgICAgIG5hbWVTY2hlbWFFeHByZXNzaW9uTWFwLnNldChuYW1lLCBzY2hlbWFFeHByZXNzaW9uKTtcbiAgICAgIH0pO1xuICAgIH1cblxuICAgIC8vIHByZXBhcmUgbWFuYWdlclxuICAgIGNvbnN0IG1hbmFnZXIgPSBuZXcgVlJNRXhwcmVzc2lvbk1hbmFnZXIoKTtcblxuICAgIC8vIGxvYWQgZXhwcmVzc2lvbnNcbiAgICBhd2FpdCBQcm9taXNlLmFsbChcbiAgICAgIEFycmF5LmZyb20obmFtZVNjaGVtYUV4cHJlc3Npb25NYXAuZW50cmllcygpKS5tYXAoYXN5bmMgKFtuYW1lLCBzY2hlbWFFeHByZXNzaW9uXSkgPT4ge1xuICAgICAgICBjb25zdCBleHByZXNzaW9uID0gbmV3IFZSTUV4cHJlc3Npb24obmFtZSk7XG4gICAgICAgIGdsdGYuc2NlbmUuYWRkKGV4cHJlc3Npb24pO1xuXG4gICAgICAgIGV4cHJlc3Npb24uaXNCaW5hcnkgPSBzY2hlbWFFeHByZXNzaW9uLmlzQmluYXJ5ID8/IGZhbHNlO1xuICAgICAgICBleHByZXNzaW9uLm92ZXJyaWRlQmxpbmsgPSBzY2hlbWFFeHByZXNzaW9uLm92ZXJyaWRlQmxpbmsgPz8gJ25vbmUnO1xuICAgICAgICBleHByZXNzaW9uLm92ZXJyaWRlTG9va0F0ID0gc2NoZW1hRXhwcmVzc2lvbi5vdmVycmlkZUxvb2tBdCA/PyAnbm9uZSc7XG4gICAgICAgIGV4cHJlc3Npb24ub3ZlcnJpZGVNb3V0aCA9IHNjaGVtYUV4cHJlc3Npb24ub3ZlcnJpZGVNb3V0aCA/PyAnbm9uZSc7XG5cbiAgICAgICAgc2NoZW1hRXhwcmVzc2lvbi5tb3JwaFRhcmdldEJpbmRzPy5mb3JFYWNoKGFzeW5jIChiaW5kKSA9PiB7XG4gICAgICAgICAgaWYgKGJpbmQubm9kZSA9PT0gdW5kZWZpbmVkIHx8IGJpbmQuaW5kZXggPT09IHVuZGVmaW5lZCkge1xuICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICAgIH1cblxuICAgICAgICAgIGNvbnN0IHByaW1pdGl2ZXMgPSAoYXdhaXQgZ2x0ZkV4dHJhY3RQcmltaXRpdmVzRnJvbU5vZGUoZ2x0ZiwgYmluZC5ub2RlKSkhO1xuICAgICAgICAgIGNvbnN0IG1vcnBoVGFyZ2V0SW5kZXggPSBiaW5kLmluZGV4O1xuXG4gICAgICAgICAgLy8gY2hlY2sgaWYgdGhlIG1lc2ggaGFzIHRoZSB0YXJnZXQgbW9ycGggdGFyZ2V0XG4gICAgICAgICAgaWYgKFxuICAgICAgICAgICAgIXByaW1pdGl2ZXMuZXZlcnkoXG4gICAgICAgICAgICAgIChwcmltaXRpdmUpID0+XG4gICAgICAgICAgICAgICAgQXJyYXkuaXNBcnJheShwcmltaXRpdmUubW9ycGhUYXJnZXRJbmZsdWVuY2VzKSAmJlxuICAgICAgICAgICAgICAgIG1vcnBoVGFyZ2V0SW5kZXggPCBwcmltaXRpdmUubW9ycGhUYXJnZXRJbmZsdWVuY2VzLmxlbmd0aCxcbiAgICAgICAgICAgIClcbiAgICAgICAgICApIHtcbiAgICAgICAgICAgIGNvbnNvbGUud2FybihcbiAgICAgICAgICAgICAgYFZSTUV4cHJlc3Npb25Mb2FkZXJQbHVnaW46ICR7c2NoZW1hRXhwcmVzc2lvbi5uYW1lfSBhdHRlbXB0cyB0byBpbmRleCBtb3JwaCAjJHttb3JwaFRhcmdldEluZGV4fSBidXQgbm90IGZvdW5kLmAsXG4gICAgICAgICAgICApO1xuICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICAgIH1cblxuICAgICAgICAgIGV4cHJlc3Npb24uYWRkQmluZChcbiAgICAgICAgICAgIG5ldyBWUk1FeHByZXNzaW9uTW9ycGhUYXJnZXRCaW5kKHtcbiAgICAgICAgICAgICAgcHJpbWl0aXZlcyxcbiAgICAgICAgICAgICAgaW5kZXg6IG1vcnBoVGFyZ2V0SW5kZXgsXG4gICAgICAgICAgICAgIHdlaWdodDogYmluZC53ZWlnaHQgPz8gMS4wLFxuICAgICAgICAgICAgfSksXG4gICAgICAgICAgKTtcbiAgICAgICAgfSk7XG5cbiAgICAgICAgaWYgKHNjaGVtYUV4cHJlc3Npb24ubWF0ZXJpYWxDb2xvckJpbmRzIHx8IHNjaGVtYUV4cHJlc3Npb24udGV4dHVyZVRyYW5zZm9ybUJpbmRzKSB7XG4gICAgICAgICAgLy8gbGlzdCB1cCBldmVyeSBtYXRlcmlhbCBpbiBgZ2x0Zi5zY2VuZWBcbiAgICAgICAgICBjb25zdCBnbHRmTWF0ZXJpYWxzOiBUSFJFRS5NYXRlcmlhbFtdID0gW107XG4gICAgICAgICAgZ2x0Zi5zY2VuZS50cmF2ZXJzZSgob2JqZWN0KSA9PiB7XG4gICAgICAgICAgICBjb25zdCBtYXRlcmlhbCA9IChvYmplY3QgYXMgYW55KS5tYXRlcmlhbCBhcyBUSFJFRS5NYXRlcmlhbCB8IHVuZGVmaW5lZDtcbiAgICAgICAgICAgIGlmIChtYXRlcmlhbCkge1xuICAgICAgICAgICAgICBnbHRmTWF0ZXJpYWxzLnB1c2gobWF0ZXJpYWwpO1xuICAgICAgICAgICAgfVxuICAgICAgICAgIH0pO1xuXG4gICAgICAgICAgc2NoZW1hRXhwcmVzc2lvbi5tYXRlcmlhbENvbG9yQmluZHM/LmZvckVhY2goYXN5bmMgKGJpbmQpID0+IHtcbiAgICAgICAgICAgIGNvbnN0IG1hdGVyaWFscyA9IGdsdGZNYXRlcmlhbHMuZmlsdGVyKChtYXRlcmlhbCkgPT4ge1xuICAgICAgICAgICAgICBjb25zdCBtYXRlcmlhbEluZGV4ID0gdGhpcy5wYXJzZXIuYXNzb2NpYXRpb25zLmdldChtYXRlcmlhbCk/Lm1hdGVyaWFscztcbiAgICAgICAgICAgICAgcmV0dXJuIGJpbmQubWF0ZXJpYWwgPT09IG1hdGVyaWFsSW5kZXg7XG4gICAgICAgICAgICB9KTtcblxuICAgICAgICAgICAgbWF0ZXJpYWxzLmZvckVhY2goKG1hdGVyaWFsKSA9PiB7XG4gICAgICAgICAgICAgIGV4cHJlc3Npb24uYWRkQmluZChcbiAgICAgICAgICAgICAgICBuZXcgVlJNRXhwcmVzc2lvbk1hdGVyaWFsQ29sb3JCaW5kKHtcbiAgICAgICAgICAgICAgICAgIG1hdGVyaWFsLFxuICAgICAgICAgICAgICAgICAgdHlwZTogYmluZC50eXBlLFxuICAgICAgICAgICAgICAgICAgdGFyZ2V0VmFsdWU6IG5ldyBUSFJFRS5Db2xvcigpLmZyb21BcnJheShiaW5kLnRhcmdldFZhbHVlKSxcbiAgICAgICAgICAgICAgICAgIHRhcmdldEFscGhhOiBiaW5kLnRhcmdldFZhbHVlWzNdLFxuICAgICAgICAgICAgICAgIH0pLFxuICAgICAgICAgICAgICApO1xuICAgICAgICAgICAgfSk7XG4gICAgICAgICAgfSk7XG5cbiAgICAgICAgICBzY2hlbWFFeHByZXNzaW9uLnRleHR1cmVUcmFuc2Zvcm1CaW5kcz8uZm9yRWFjaChhc3luYyAoYmluZCkgPT4ge1xuICAgICAgICAgICAgY29uc3QgbWF0ZXJpYWxzID0gZ2x0Zk1hdGVyaWFscy5maWx0ZXIoKG1hdGVyaWFsKSA9PiB7XG4gICAgICAgICAgICAgIGNvbnN0IG1hdGVyaWFsSW5kZXggPSB0aGlzLnBhcnNlci5hc3NvY2lhdGlvbnMuZ2V0KG1hdGVyaWFsKT8ubWF0ZXJpYWxzO1xuICAgICAgICAgICAgICByZXR1cm4gYmluZC5tYXRlcmlhbCA9PT0gbWF0ZXJpYWxJbmRleDtcbiAgICAgICAgICAgIH0pO1xuXG4gICAgICAgICAgICBtYXRlcmlhbHMuZm9yRWFjaCgobWF0ZXJpYWwpID0+IHtcbiAgICAgICAgICAgICAgZXhwcmVzc2lvbi5hZGRCaW5kKFxuICAgICAgICAgICAgICAgIG5ldyBWUk1FeHByZXNzaW9uVGV4dHVyZVRyYW5zZm9ybUJpbmQoe1xuICAgICAgICAgICAgICAgICAgbWF0ZXJpYWwsXG4gICAgICAgICAgICAgICAgICBvZmZzZXQ6IG5ldyBUSFJFRS5WZWN0b3IyKCkuZnJvbUFycmF5KGJpbmQub2Zmc2V0ID8/IFswLjAsIDAuMF0pLFxuICAgICAgICAgICAgICAgICAgc2NhbGU6IG5ldyBUSFJFRS5WZWN0b3IyKCkuZnJvbUFycmF5KGJpbmQuc2NhbGUgPz8gWzEuMCwgMS4wXSksXG4gICAgICAgICAgICAgICAgfSksXG4gICAgICAgICAgICAgICk7XG4gICAgICAgICAgICB9KTtcbiAgICAgICAgICB9KTtcbiAgICAgICAgfVxuXG4gICAgICAgIG1hbmFnZXIucmVnaXN0ZXJFeHByZXNzaW9uKGV4cHJlc3Npb24pO1xuICAgICAgfSksXG4gICAgKTtcblxuICAgIHJldHVybiBtYW5hZ2VyO1xuICB9XG5cbiAgcHJpdmF0ZSBhc3luYyBfdjBJbXBvcnQoZ2x0ZjogR0xURik6IFByb21pc2U8VlJNRXhwcmVzc2lvbk1hbmFnZXIgfCBudWxsPiB7XG4gICAgY29uc3QganNvbiA9IHRoaXMucGFyc2VyLmpzb24gYXMgR0xURlNjaGVtYS5JR0xURjtcblxuICAgIC8vIGVhcmx5IGFib3J0IGlmIGl0IGRvZXNuJ3QgdXNlIHZybVxuICAgIGNvbnN0IHZybUV4dCA9IGpzb24uZXh0ZW5zaW9ucz8uVlJNIGFzIFYwVlJNLlZSTSB8IHVuZGVmaW5lZDtcbiAgICBpZiAoIXZybUV4dCkge1xuICAgICAgcmV0dXJuIG51bGw7XG4gICAgfVxuXG4gICAgY29uc3Qgc2NoZW1hQmxlbmRTaGFwZSA9IHZybUV4dC5ibGVuZFNoYXBlTWFzdGVyO1xuICAgIGlmICghc2NoZW1hQmxlbmRTaGFwZSkge1xuICAgICAgcmV0dXJuIG51bGw7XG4gICAgfVxuXG4gICAgY29uc3QgbWFuYWdlciA9IG5ldyBWUk1FeHByZXNzaW9uTWFuYWdlcigpO1xuXG4gICAgY29uc3Qgc2NoZW1hQmxlbmRTaGFwZUdyb3VwcyA9IHNjaGVtYUJsZW5kU2hhcGUuYmxlbmRTaGFwZUdyb3VwcztcbiAgICBpZiAoIXNjaGVtYUJsZW5kU2hhcGVHcm91cHMpIHtcbiAgICAgIHJldHVybiBtYW5hZ2VyO1xuICAgIH1cblxuICAgIGNvbnN0IGJsZW5kU2hhcGVOYW1lU2V0ID0gbmV3IFNldDxzdHJpbmc+KCk7XG5cbiAgICBhd2FpdCBQcm9taXNlLmFsbChcbiAgICAgIHNjaGVtYUJsZW5kU2hhcGVHcm91cHMubWFwKGFzeW5jIChzY2hlbWFHcm91cCkgPT4ge1xuICAgICAgICBjb25zdCB2MFByZXNldE5hbWUgPSBzY2hlbWFHcm91cC5wcmVzZXROYW1lO1xuICAgICAgICBjb25zdCB2MVByZXNldE5hbWUgPVxuICAgICAgICAgICh2MFByZXNldE5hbWUgIT0gbnVsbCAmJiBWUk1FeHByZXNzaW9uTG9hZGVyUGx1Z2luLnYwdjFQcmVzZXROYW1lTWFwW3YwUHJlc2V0TmFtZV0pIHx8IG51bGw7XG4gICAgICAgIGNvbnN0IG5hbWUgPSB2MVByZXNldE5hbWUgPz8gc2NoZW1hR3JvdXAubmFtZTtcblxuICAgICAgICBpZiAobmFtZSA9PSBudWxsKSB7XG4gICAgICAgICAgY29uc29sZS53YXJuKCdWUk1FeHByZXNzaW9uTG9hZGVyUGx1Z2luOiBPbmUgb2YgY3VzdG9tIGV4cHJlc3Npb25zIGhhcyBubyBuYW1lLiBJZ25vcmluZyB0aGUgZXhwcmVzc2lvbicpO1xuICAgICAgICAgIHJldHVybjtcbiAgICAgICAgfVxuXG4gICAgICAgIC8vIGR1cGxpY2F0aW9uIGNoZWNrXG4gICAgICAgIGlmIChibGVuZFNoYXBlTmFtZVNldC5oYXMobmFtZSkpIHtcbiAgICAgICAgICBjb25zb2xlLndhcm4oXG4gICAgICAgICAgICBgVlJNRXhwcmVzc2lvbkxvYWRlclBsdWdpbjogQW4gZXhwcmVzc2lvbiBwcmVzZXQgJHt2MFByZXNldE5hbWV9IGhhcyBkdXBsaWNhdGVkIGVudHJpZXMuIElnbm9yaW5nIHRoZSBleHByZXNzaW9uYCxcbiAgICAgICAgICApO1xuICAgICAgICAgIHJldHVybjtcbiAgICAgICAgfVxuXG4gICAgICAgIGJsZW5kU2hhcGVOYW1lU2V0LmFkZChuYW1lKTtcblxuICAgICAgICBjb25zdCBleHByZXNzaW9uID0gbmV3IFZSTUV4cHJlc3Npb24obmFtZSk7XG4gICAgICAgIGdsdGYuc2NlbmUuYWRkKGV4cHJlc3Npb24pO1xuXG4gICAgICAgIGV4cHJlc3Npb24uaXNCaW5hcnkgPSBzY2hlbWFHcm91cC5pc0JpbmFyeSA/PyBmYWxzZTtcbiAgICAgICAgLy8gdjAgZG9lc24ndCBoYXZlIGlnbm9yZSBwcm9wZXJ0aWVzXG5cbiAgICAgICAgLy8gQmluZCBtb3JwaFRhcmdldFxuICAgICAgICBpZiAoc2NoZW1hR3JvdXAuYmluZHMpIHtcbiAgICAgICAgICBzY2hlbWFHcm91cC5iaW5kcy5mb3JFYWNoKGFzeW5jIChiaW5kKSA9PiB7XG4gICAgICAgICAgICBpZiAoYmluZC5tZXNoID09PSB1bmRlZmluZWQgfHwgYmluZC5pbmRleCA9PT0gdW5kZWZpbmVkKSB7XG4gICAgICAgICAgICAgIHJldHVybjtcbiAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgY29uc3Qgbm9kZXNVc2luZ01lc2g6IG51bWJlcltdID0gW107XG4gICAgICAgICAgICBqc29uLm5vZGVzPy5mb3JFYWNoKChub2RlLCBpKSA9PiB7XG4gICAgICAgICAgICAgIGlmIChub2RlLm1lc2ggPT09IGJpbmQubWVzaCkge1xuICAgICAgICAgICAgICAgIG5vZGVzVXNpbmdNZXNoLnB1c2goaSk7XG4gICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH0pO1xuXG4gICAgICAgICAgICBjb25zdCBtb3JwaFRhcmdldEluZGV4ID0gYmluZC5pbmRleDtcblxuICAgICAgICAgICAgYXdhaXQgUHJvbWlzZS5hbGwoXG4gICAgICAgICAgICAgIG5vZGVzVXNpbmdNZXNoLm1hcChhc3luYyAobm9kZUluZGV4KSA9PiB7XG4gICAgICAgICAgICAgICAgY29uc3QgcHJpbWl0aXZlcyA9IChhd2FpdCBnbHRmRXh0cmFjdFByaW1pdGl2ZXNGcm9tTm9kZShnbHRmLCBub2RlSW5kZXgpKSE7XG5cbiAgICAgICAgICAgICAgICAvLyBjaGVjayBpZiB0aGUgbWVzaCBoYXMgdGhlIHRhcmdldCBtb3JwaCB0YXJnZXRcbiAgICAgICAgICAgICAgICBpZiAoXG4gICAgICAgICAgICAgICAgICAhcHJpbWl0aXZlcy5ldmVyeShcbiAgICAgICAgICAgICAgICAgICAgKHByaW1pdGl2ZSkgPT5cbiAgICAgICAgICAgICAgICAgICAgICBBcnJheS5pc0FycmF5KHByaW1pdGl2ZS5tb3JwaFRhcmdldEluZmx1ZW5jZXMpICYmXG4gICAgICAgICAgICAgICAgICAgICAgbW9ycGhUYXJnZXRJbmRleCA8IHByaW1pdGl2ZS5tb3JwaFRhcmdldEluZmx1ZW5jZXMubGVuZ3RoLFxuICAgICAgICAgICAgICAgICAgKVxuICAgICAgICAgICAgICAgICkge1xuICAgICAgICAgICAgICAgICAgY29uc29sZS53YXJuKFxuICAgICAgICAgICAgICAgICAgICBgVlJNRXhwcmVzc2lvbkxvYWRlclBsdWdpbjogJHtzY2hlbWFHcm91cC5uYW1lfSBhdHRlbXB0cyB0byBpbmRleCAke21vcnBoVGFyZ2V0SW5kZXh9dGggbW9ycGggYnV0IG5vdCBmb3VuZC5gLFxuICAgICAgICAgICAgICAgICAgKTtcbiAgICAgICAgICAgICAgICAgIHJldHVybjtcbiAgICAgICAgICAgICAgICB9XG5cbiAgICAgICAgICAgICAgICBleHByZXNzaW9uLmFkZEJpbmQoXG4gICAgICAgICAgICAgICAgICBuZXcgVlJNRXhwcmVzc2lvbk1vcnBoVGFyZ2V0QmluZCh7XG4gICAgICAgICAgICAgICAgICAgIHByaW1pdGl2ZXMsXG4gICAgICAgICAgICAgICAgICAgIGluZGV4OiBtb3JwaFRhcmdldEluZGV4LFxuICAgICAgICAgICAgICAgICAgICB3ZWlnaHQ6IDAuMDEgKiAoYmluZC53ZWlnaHQgPz8gMTAwKSwgLy8gbmFycm93aW5nIHRoZSByYW5nZSBmcm9tIFsgMC4wIC0gMTAwLjAgXSB0byBbIDAuMCAtIDEuMCBdXG4gICAgICAgICAgICAgICAgICB9KSxcbiAgICAgICAgICAgICAgICApO1xuICAgICAgICAgICAgICB9KSxcbiAgICAgICAgICAgICk7XG4gICAgICAgICAgfSk7XG4gICAgICAgIH1cblxuICAgICAgICAvLyBCaW5kIE1hdGVyaWFsQ29sb3IgYW5kIFRleHR1cmVUcmFuc2Zvcm1cbiAgICAgICAgY29uc3QgbWF0ZXJpYWxWYWx1ZXMgPSBzY2hlbWFHcm91cC5tYXRlcmlhbFZhbHVlcztcbiAgICAgICAgaWYgKG1hdGVyaWFsVmFsdWVzICYmIG1hdGVyaWFsVmFsdWVzLmxlbmd0aCAhPT0gMCkge1xuICAgICAgICAgIG1hdGVyaWFsVmFsdWVzLmZvckVhY2goKG1hdGVyaWFsVmFsdWUpID0+IHtcbiAgICAgICAgICAgIGlmIChcbiAgICAgICAgICAgICAgbWF0ZXJpYWxWYWx1ZS5tYXRlcmlhbE5hbWUgPT09IHVuZGVmaW5lZCB8fFxuICAgICAgICAgICAgICBtYXRlcmlhbFZhbHVlLnByb3BlcnR5TmFtZSA9PT0gdW5kZWZpbmVkIHx8XG4gICAgICAgICAgICAgIG1hdGVyaWFsVmFsdWUudGFyZ2V0VmFsdWUgPT09IHVuZGVmaW5lZFxuICAgICAgICAgICAgKSB7XG4gICAgICAgICAgICAgIHJldHVybjtcbiAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgLyoqXG4gICAgICAgICAgICAgKiBcdTMwQTJcdTMwRDBcdTMwQkZcdTMwRkNcdTMwNkVcdTMwQUFcdTMwRDZcdTMwQjhcdTMwQTdcdTMwQUZcdTMwQzhcdTMwNkJcdThBMkRcdTVCOUFcdTMwNTVcdTMwOENcdTMwNjZcdTMwNDRcdTMwOEJcdTMwREVcdTMwQzZcdTMwRUFcdTMwQTJcdTMwRUJcdTMwNkVcdTUxODVcdTMwNEJcdTMwODlcbiAgICAgICAgICAgICAqIG1hdGVyaWFsVmFsdWVcdTMwNjdcdTYzMDdcdTVCOUFcdTMwNTVcdTMwOENcdTMwNjZcdTMwNDRcdTMwOEJcdTMwREVcdTMwQzZcdTMwRUFcdTMwQTJcdTMwRUJcdTMwOTJcdTk2QzZcdTMwODFcdTMwOEJcdTMwMDJcbiAgICAgICAgICAgICAqXG4gICAgICAgICAgICAgKiBcdTcyNzlcdTVCOUFcdTMwNkJcdTMwNkZcdTU0MERcdTUyNERcdTMwOTJcdTRGN0ZcdTc1MjhcdTMwNTlcdTMwOEJcdTMwMDJcbiAgICAgICAgICAgICAqIFx1MzBBMlx1MzBBNlx1MzBDOFx1MzBFOVx1MzBBNFx1MzBGM1x1NjNDRlx1NzUzQlx1NzUyOFx1MzA2RVx1MzBERVx1MzBDNlx1MzBFQVx1MzBBMlx1MzBFQlx1MzA4Mlx1NTQwQ1x1NjY0Mlx1MzA2Qlx1OTZDNlx1MzA4MVx1MzA4Qlx1MzAwMlxuICAgICAgICAgICAgICovXG4gICAgICAgICAgICBjb25zdCBtYXRlcmlhbHM6IFRIUkVFLk1hdGVyaWFsW10gPSBbXTtcbiAgICAgICAgICAgIGdsdGYuc2NlbmUudHJhdmVyc2UoKG9iamVjdCkgPT4ge1xuICAgICAgICAgICAgICBpZiAoKG9iamVjdCBhcyBhbnkpLm1hdGVyaWFsKSB7XG4gICAgICAgICAgICAgICAgY29uc3QgbWF0ZXJpYWw6IFRIUkVFLk1hdGVyaWFsW10gfCBUSFJFRS5NYXRlcmlhbCA9IChvYmplY3QgYXMgYW55KS5tYXRlcmlhbDtcbiAgICAgICAgICAgICAgICBpZiAoQXJyYXkuaXNBcnJheShtYXRlcmlhbCkpIHtcbiAgICAgICAgICAgICAgICAgIG1hdGVyaWFscy5wdXNoKFxuICAgICAgICAgICAgICAgICAgICAuLi5tYXRlcmlhbC5maWx0ZXIoXG4gICAgICAgICAgICAgICAgICAgICAgKG10bCkgPT5cbiAgICAgICAgICAgICAgICAgICAgICAgIChtdGwubmFtZSA9PT0gbWF0ZXJpYWxWYWx1ZS5tYXRlcmlhbE5hbWUhIHx8XG4gICAgICAgICAgICAgICAgICAgICAgICAgIG10bC5uYW1lID09PSBtYXRlcmlhbFZhbHVlLm1hdGVyaWFsTmFtZSEgKyAnIChPdXRsaW5lKScpICYmXG4gICAgICAgICAgICAgICAgICAgICAgICBtYXRlcmlhbHMuaW5kZXhPZihtdGwpID09PSAtMSxcbiAgICAgICAgICAgICAgICAgICAgKSxcbiAgICAgICAgICAgICAgICAgICk7XG4gICAgICAgICAgICAgICAgfSBlbHNlIGlmIChtYXRlcmlhbC5uYW1lID09PSBtYXRlcmlhbFZhbHVlLm1hdGVyaWFsTmFtZSAmJiBtYXRlcmlhbHMuaW5kZXhPZihtYXRlcmlhbCkgPT09IC0xKSB7XG4gICAgICAgICAgICAgICAgICBtYXRlcmlhbHMucHVzaChtYXRlcmlhbCk7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9KTtcblxuICAgICAgICAgICAgY29uc3QgbWF0ZXJpYWxQcm9wZXJ0eU5hbWUgPSBtYXRlcmlhbFZhbHVlLnByb3BlcnR5TmFtZTtcbiAgICAgICAgICAgIG1hdGVyaWFscy5mb3JFYWNoKChtYXRlcmlhbCkgPT4ge1xuICAgICAgICAgICAgICAvLyBUZXh0dXJlVHJhbnNmb3JtQmluZFxuICAgICAgICAgICAgICBpZiAobWF0ZXJpYWxQcm9wZXJ0eU5hbWUgPT09ICdfTWFpblRleF9TVCcpIHtcbiAgICAgICAgICAgICAgICBjb25zdCBzY2FsZSA9IG5ldyBUSFJFRS5WZWN0b3IyKG1hdGVyaWFsVmFsdWUudGFyZ2V0VmFsdWUhWzBdLCBtYXRlcmlhbFZhbHVlLnRhcmdldFZhbHVlIVsxXSk7XG4gICAgICAgICAgICAgICAgY29uc3Qgb2Zmc2V0ID0gbmV3IFRIUkVFLlZlY3RvcjIobWF0ZXJpYWxWYWx1ZS50YXJnZXRWYWx1ZSFbMl0sIG1hdGVyaWFsVmFsdWUudGFyZ2V0VmFsdWUhWzNdKTtcblxuICAgICAgICAgICAgICAgIG9mZnNldC55ID0gMS4wIC0gb2Zmc2V0LnkgLSBzY2FsZS55O1xuXG4gICAgICAgICAgICAgICAgZXhwcmVzc2lvbi5hZGRCaW5kKFxuICAgICAgICAgICAgICAgICAgbmV3IFZSTUV4cHJlc3Npb25UZXh0dXJlVHJhbnNmb3JtQmluZCh7XG4gICAgICAgICAgICAgICAgICAgIG1hdGVyaWFsLFxuICAgICAgICAgICAgICAgICAgICBzY2FsZSxcbiAgICAgICAgICAgICAgICAgICAgb2Zmc2V0LFxuICAgICAgICAgICAgICAgICAgfSksXG4gICAgICAgICAgICAgICAgKTtcblxuICAgICAgICAgICAgICAgIHJldHVybjtcbiAgICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICAgIC8vIE1hdGVyaWFsQ29sb3JCaW5kXG4gICAgICAgICAgICAgIGNvbnN0IG1hdGVyaWFsQ29sb3JUeXBlID0gdjBFeHByZXNzaW9uTWF0ZXJpYWxDb2xvck1hcFttYXRlcmlhbFByb3BlcnR5TmFtZV07XG4gICAgICAgICAgICAgIGlmIChtYXRlcmlhbENvbG9yVHlwZSkge1xuICAgICAgICAgICAgICAgIGV4cHJlc3Npb24uYWRkQmluZChcbiAgICAgICAgICAgICAgICAgIG5ldyBWUk1FeHByZXNzaW9uTWF0ZXJpYWxDb2xvckJpbmQoe1xuICAgICAgICAgICAgICAgICAgICBtYXRlcmlhbCxcbiAgICAgICAgICAgICAgICAgICAgdHlwZTogbWF0ZXJpYWxDb2xvclR5cGUsXG4gICAgICAgICAgICAgICAgICAgIHRhcmdldFZhbHVlOiBuZXcgVEhSRUUuQ29sb3IoKS5mcm9tQXJyYXkobWF0ZXJpYWxWYWx1ZS50YXJnZXRWYWx1ZSEpLFxuICAgICAgICAgICAgICAgICAgICB0YXJnZXRBbHBoYTogbWF0ZXJpYWxWYWx1ZS50YXJnZXRWYWx1ZSFbM10sXG4gICAgICAgICAgICAgICAgICB9KSxcbiAgICAgICAgICAgICAgICApO1xuXG4gICAgICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICAgICAgICB9XG5cbiAgICAgICAgICAgICAgY29uc29sZS53YXJuKG1hdGVyaWFsUHJvcGVydHlOYW1lICsgJyBpcyBub3Qgc3VwcG9ydGVkJyk7XG4gICAgICAgICAgICB9KTtcbiAgICAgICAgICB9KTtcbiAgICAgICAgfVxuXG4gICAgICAgIG1hbmFnZXIucmVnaXN0ZXJFeHByZXNzaW9uKGV4cHJlc3Npb24pO1xuICAgICAgfSksXG4gICAgKTtcblxuICAgIHJldHVybiBtYW5hZ2VyO1xuICB9XG59XG4iLCAiaW1wb3J0IHR5cGUgKiBhcyBUSFJFRSBmcm9tICd0aHJlZSc7XG5pbXBvcnQgdHlwZSB7IEdMVEYgfSBmcm9tICd0aHJlZS9leGFtcGxlcy9qc20vbG9hZGVycy9HTFRGTG9hZGVyLmpzJztcbmltcG9ydCB7IEdMVEYgYXMgR0xURlNjaGVtYSB9IGZyb20gJ0BnbHRmLXRyYW5zZm9ybS9jb3JlJztcblxuZnVuY3Rpb24gZXh0cmFjdFByaW1pdGl2ZXNJbnRlcm5hbChnbHRmOiBHTFRGLCBub2RlSW5kZXg6IG51bWJlciwgbm9kZTogVEhSRUUuT2JqZWN0M0QpOiBUSFJFRS5NZXNoW10gfCBudWxsIHtcbiAgY29uc3QganNvbiA9IGdsdGYucGFyc2VyLmpzb24gYXMgR0xURlNjaGVtYS5JR0xURjtcblxuICAvKipcbiAgICogTGV0J3MgbGlzdCB1cCBldmVyeSBwb3NzaWJsZSBwYXR0ZXJucyB0aGF0IHBhcnNlZCBnbHRmIG5vZGVzIHdpdGggYSBtZXNoIGNhbiBoYXZlLCwsXG4gICAqXG4gICAqIFwiKlwiIGluZGljYXRlcyB0aGF0IHRob3NlIG1lc2hlcyBzaG91bGQgYmUgbGlzdGVkIHVwIHVzaW5nIHRoaXMgZnVuY3Rpb25cbiAgICpcbiAgICogIyMjIEEgbm9kZSB3aXRoIGEgKG1lc2gsIGEgc2lnbmxlIHByaW1pdGl2ZSlcbiAgICpcbiAgICogLSBgVEhSRUUuTWVzaGA6IFRoZSBvbmx5IHByaW1pdGl2ZSBvZiB0aGUgbWVzaCAqXG4gICAqXG4gICAqICMjIyBBIG5vZGUgd2l0aCBhIChtZXNoLCBtdWx0aXBsZSBwcmltaXRpdmVzKVxuICAgKlxuICAgKiAtIGBUSFJFRS5Hcm91cGA6IFRoZSByb290IG9mIHRoZSBtZXNoXG4gICAqICAgLSBgVEhSRUUuTWVzaGA6IEEgcHJpbWl0aXZlIG9mIHRoZSBtZXNoICpcbiAgICogICAtIGBUSFJFRS5NZXNoYDogQSBwcmltaXRpdmUgb2YgdGhlIG1lc2ggKDIpICpcbiAgICpcbiAgICogIyMjIEEgbm9kZSB3aXRoIGEgKG1lc2gsIG11bHRpcGxlIHByaW1pdGl2ZXMpIEFORCAoYSBjaGlsZCB3aXRoIGEgbWVzaCwgYSBzaW5nbGUgcHJpbWl0aXZlKVxuICAgKlxuICAgKiAtIGBUSFJFRS5Hcm91cGA6IFRoZSByb290IG9mIHRoZSBtZXNoXG4gICAqICAgLSBgVEhSRUUuTWVzaGA6IEEgcHJpbWl0aXZlIG9mIHRoZSBtZXNoICpcbiAgICogICAtIGBUSFJFRS5NZXNoYDogQSBwcmltaXRpdmUgb2YgdGhlIG1lc2ggKDIpICpcbiAgICogICAtIGBUSFJFRS5NZXNoYDogQSBwcmltaXRpdmUgb2YgYSBNRVNIIE9GIFRIRSBDSElMRFxuICAgKlxuICAgKiAjIyMgQSBub2RlIHdpdGggYSAobWVzaCwgbXVsdGlwbGUgcHJpbWl0aXZlcykgQU5EIChhIGNoaWxkIHdpdGggYSBtZXNoLCBtdWx0aXBsZSBwcmltaXRpdmVzKVxuICAgKlxuICAgKiAtIGBUSFJFRS5Hcm91cGA6IFRoZSByb290IG9mIHRoZSBtZXNoXG4gICAqICAgLSBgVEhSRUUuTWVzaGA6IEEgcHJpbWl0aXZlIG9mIHRoZSBtZXNoICpcbiAgICogICAtIGBUSFJFRS5NZXNoYDogQSBwcmltaXRpdmUgb2YgdGhlIG1lc2ggKDIpICpcbiAgICogICAtIGBUSFJFRS5Hcm91cGA6IFRoZSByb290IG9mIGEgTUVTSCBPRiBUSEUgQ0hJTERcbiAgICogICAgIC0gYFRIUkVFLk1lc2hgOiBBIHByaW1pdGl2ZSBvZiB0aGUgbWVzaCBvZiB0aGUgY2hpbGRcbiAgICogICAgIC0gYFRIUkVFLk1lc2hgOiBBIHByaW1pdGl2ZSBvZiB0aGUgbWVzaCBvZiB0aGUgY2hpbGQgKDIpXG4gICAqXG4gICAqICMjIyBBIG5vZGUgd2l0aCBhIChtZXNoLCBtdWx0aXBsZSBwcmltaXRpdmVzKSBCVVQgdGhlIG5vZGUgaXMgYSBib25lXG4gICAqXG4gICAqIC0gYFRIUkVFLkJvbmVgOiBUaGUgcm9vdCBvZiB0aGUgbm9kZSwgYXMgYSBib25lXG4gICAqICAgLSBgVEhSRUUuR3JvdXBgOiBUaGUgcm9vdCBvZiB0aGUgbWVzaFxuICAgKiAgICAgLSBgVEhSRUUuTWVzaGA6IEEgcHJpbWl0aXZlIG9mIHRoZSBtZXNoICpcbiAgICogICAgIC0gYFRIUkVFLk1lc2hgOiBBIHByaW1pdGl2ZSBvZiB0aGUgbWVzaCAoMikgKlxuICAgKlxuICAgKiAjIyMgQSBub2RlIHdpdGggYSAobWVzaCwgbXVsdGlwbGUgcHJpbWl0aXZlcykgQU5EIChhIGNoaWxkIHdpdGggYSBtZXNoLCBtdWx0aXBsZSBwcmltaXRpdmVzKSBCVVQgdGhlIG5vZGUgaXMgYSBib25lXG4gICAqXG4gICAqIC0gYFRIUkVFLkJvbmVgOiBUaGUgcm9vdCBvZiB0aGUgbm9kZSwgYXMgYSBib25lXG4gICAqICAgLSBgVEhSRUUuR3JvdXBgOiBUaGUgcm9vdCBvZiB0aGUgbWVzaFxuICAgKiAgICAgLSBgVEhSRUUuTWVzaGA6IEEgcHJpbWl0aXZlIG9mIHRoZSBtZXNoICpcbiAgICogICAgIC0gYFRIUkVFLk1lc2hgOiBBIHByaW1pdGl2ZSBvZiB0aGUgbWVzaCAoMikgKlxuICAgKiAgIC0gYFRIUkVFLkdyb3VwYDogVGhlIHJvb3Qgb2YgYSBNRVNIIE9GIFRIRSBDSElMRFxuICAgKiAgICAgLSBgVEhSRUUuTWVzaGA6IEEgcHJpbWl0aXZlIG9mIHRoZSBtZXNoIG9mIHRoZSBjaGlsZFxuICAgKiAgICAgLSBgVEhSRUUuTWVzaGA6IEEgcHJpbWl0aXZlIG9mIHRoZSBtZXNoIG9mIHRoZSBjaGlsZCAoMilcbiAgICpcbiAgICogLi4uSSB3aWxsIHRha2UgYSBzdHJhdGVneSB0aGF0IHRyYXZlcnNlcyB0aGUgcm9vdCBvZiB0aGUgbm9kZSBhbmQgdGFrZSBmaXJzdCAocHJpbWl0aXZlQ291bnQpIG1lc2hlcy5cbiAgICovXG5cbiAgLy8gTWFrZSBzdXJlIHRoYXQgdGhlIG5vZGUgaGFzIGEgbWVzaFxuICBjb25zdCBzY2hlbWFOb2RlID0ganNvbi5ub2Rlcz8uW25vZGVJbmRleF07XG4gIGlmIChzY2hlbWFOb2RlID09IG51bGwpIHtcbiAgICBjb25zb2xlLndhcm4oYGV4dHJhY3RQcmltaXRpdmVzSW50ZXJuYWw6IEF0dGVtcHQgdG8gdXNlIG5vZGVzWyR7bm9kZUluZGV4fV0gb2YgZ2xURiBidXQgdGhlIG5vZGUgZG9lc24ndCBleGlzdGApO1xuICAgIHJldHVybiBudWxsO1xuICB9XG5cbiAgY29uc3QgbWVzaEluZGV4ID0gc2NoZW1hTm9kZS5tZXNoO1xuICBpZiAobWVzaEluZGV4ID09IG51bGwpIHtcbiAgICByZXR1cm4gbnVsbDtcbiAgfVxuXG4gIC8vIEhvdyBtYW55IHByaW1pdGl2ZXMgdGhlIG1lc2ggaGFzP1xuICBjb25zdCBzY2hlbWFNZXNoID0ganNvbi5tZXNoZXM/LlttZXNoSW5kZXhdO1xuICBpZiAoc2NoZW1hTWVzaCA9PSBudWxsKSB7XG4gICAgY29uc29sZS53YXJuKGBleHRyYWN0UHJpbWl0aXZlc0ludGVybmFsOiBBdHRlbXB0IHRvIHVzZSBtZXNoZXNbJHttZXNoSW5kZXh9XSBvZiBnbFRGIGJ1dCB0aGUgbWVzaCBkb2Vzbid0IGV4aXN0YCk7XG4gICAgcmV0dXJuIG51bGw7XG4gIH1cblxuICBjb25zdCBwcmltaXRpdmVDb3VudCA9IHNjaGVtYU1lc2gucHJpbWl0aXZlcy5sZW5ndGg7XG5cbiAgLy8gVHJhdmVyc2UgdGhlIG5vZGUgYW5kIHRha2UgZmlyc3QgKHByaW1pdGl2ZUNvdW50KSBtZXNoZXNcbiAgY29uc3QgcHJpbWl0aXZlczogVEhSRUUuTWVzaFtdID0gW107XG4gIG5vZGUudHJhdmVyc2UoKG9iamVjdCkgPT4ge1xuICAgIGlmIChwcmltaXRpdmVzLmxlbmd0aCA8IHByaW1pdGl2ZUNvdW50KSB7XG4gICAgICBpZiAoKG9iamVjdCBhcyBhbnkpLmlzTWVzaCkge1xuICAgICAgICBwcmltaXRpdmVzLnB1c2gob2JqZWN0IGFzIFRIUkVFLk1lc2gpO1xuICAgICAgfVxuICAgIH1cbiAgfSk7XG5cbiAgcmV0dXJuIHByaW1pdGl2ZXM7XG59XG5cbi8qKlxuICogRXh0cmFjdCBwcmltaXRpdmVzICggYFRIUkVFLk1lc2hbXWAgKSBvZiBhIG5vZGUgZnJvbSBhIGxvYWRlZCBHTFRGLlxuICogVGhlIG1haW4gcHVycG9zZSBvZiB0aGlzIGZ1bmN0aW9uIGlzIHRvIGRpc3Rpbmd1aXNoIHByaW1pdGl2ZXMgYW5kIGNoaWxkcmVuIGZyb20gYSBub2RlIHRoYXQgaGFzIGJvdGggbWVzaGVzIGFuZCBjaGlsZHJlbi5cbiAqXG4gKiBJdCB1dGlsaXplcyB0aGUgYmVoYXZpb3IgdGhhdCBHTFRGTG9hZGVyIGFkZHMgbWVzaCBwcmltaXRpdmVzIHRvIHRoZSBub2RlIG9iamVjdCAoIGBUSFJFRS5Hcm91cGAgKSBmaXJzdCB0aGVuIGFkZHMgaXRzIGNoaWxkcmVuLlxuICpcbiAqIEBwYXJhbSBnbHRmIEEgR0xURiBvYmplY3QgdGFrZW4gZnJvbSBHTFRGTG9hZGVyXG4gKiBAcGFyYW0gbm9kZUluZGV4IFRoZSBpbmRleCBvZiB0aGUgbm9kZVxuICovXG5leHBvcnQgYXN5bmMgZnVuY3Rpb24gZ2x0ZkV4dHJhY3RQcmltaXRpdmVzRnJvbU5vZGUoZ2x0ZjogR0xURiwgbm9kZUluZGV4OiBudW1iZXIpOiBQcm9taXNlPFRIUkVFLk1lc2hbXSB8IG51bGw+IHtcbiAgY29uc3Qgbm9kZTogVEhSRUUuT2JqZWN0M0QgPSBhd2FpdCBnbHRmLnBhcnNlci5nZXREZXBlbmRlbmN5KCdub2RlJywgbm9kZUluZGV4KTtcbiAgcmV0dXJuIGV4dHJhY3RQcmltaXRpdmVzSW50ZXJuYWwoZ2x0Ziwgbm9kZUluZGV4LCBub2RlKTtcbn1cblxuLyoqXG4gKiBFeHRyYWN0IHByaW1pdGl2ZXMgKCBgVEhSRUUuTWVzaFtdYCApIG9mIG5vZGVzIGZyb20gYSBsb2FkZWQgR0xURi5cbiAqIFNlZSB7QGxpbmsgZ2x0ZkV4dHJhY3RQcmltaXRpdmVzRnJvbU5vZGV9IGZvciBtb3JlIGRldGFpbHMuXG4gKlxuICogSXQgcmV0dXJucyBhIG1hcCBmcm9tIG5vZGUgaW5kZXggdG8gZXh0cmFjdGlvbiByZXN1bHQuXG4gKiBJZiBhIG5vZGUgZG9lcyBub3QgaGF2ZSBhIG1lc2gsIHRoZSBlbnRyeSBmb3IgdGhlIG5vZGUgd2lsbCBub3QgYmUgcHV0IGluIHRoZSByZXR1cm5pbmcgbWFwLlxuICpcbiAqIEBwYXJhbSBnbHRmIEEgR0xURiBvYmplY3QgdGFrZW4gZnJvbSBHTFRGTG9hZGVyXG4gKi9cbmV4cG9ydCBhc3luYyBmdW5jdGlvbiBnbHRmRXh0cmFjdFByaW1pdGl2ZXNGcm9tTm9kZXMoZ2x0ZjogR0xURik6IFByb21pc2U8TWFwPG51bWJlciwgVEhSRUUuTWVzaFtdPj4ge1xuICBjb25zdCBub2RlczogVEhSRUUuT2JqZWN0M0RbXSA9IGF3YWl0IGdsdGYucGFyc2VyLmdldERlcGVuZGVuY2llcygnbm9kZScpO1xuICBjb25zdCBtYXAgPSBuZXcgTWFwPG51bWJlciwgVEhSRUUuTWVzaFtdPigpO1xuXG4gIG5vZGVzLmZvckVhY2goKG5vZGUsIGluZGV4KSA9PiB7XG4gICAgY29uc3QgcmVzdWx0ID0gZXh0cmFjdFByaW1pdGl2ZXNJbnRlcm5hbChnbHRmLCBpbmRleCwgbm9kZSk7XG4gICAgaWYgKHJlc3VsdCAhPSBudWxsKSB7XG4gICAgICBtYXAuc2V0KGluZGV4LCByZXN1bHQpO1xuICAgIH1cbiAgfSk7XG5cbiAgcmV0dXJuIG1hcDtcbn1cbiIsICIvKiBlc2xpbnQtZGlzYWJsZSBAdHlwZXNjcmlwdC1lc2xpbnQvbmFtaW5nLWNvbnZlbnRpb24gKi9cblxuZXhwb3J0IGNvbnN0IFZSTUV4cHJlc3Npb25QcmVzZXROYW1lID0ge1xuICBBYTogJ2FhJyxcbiAgSWg6ICdpaCcsXG4gIE91OiAnb3UnLFxuICBFZTogJ2VlJyxcbiAgT2g6ICdvaCcsXG4gIEJsaW5rOiAnYmxpbmsnLFxuICBIYXBweTogJ2hhcHB5JyxcbiAgQW5ncnk6ICdhbmdyeScsXG4gIFNhZDogJ3NhZCcsXG4gIFJlbGF4ZWQ6ICdyZWxheGVkJyxcbiAgTG9va1VwOiAnbG9va1VwJyxcbiAgU3VycHJpc2VkOiAnc3VycHJpc2VkJyxcbiAgTG9va0Rvd246ICdsb29rRG93bicsXG4gIExvb2tMZWZ0OiAnbG9va0xlZnQnLFxuICBMb29rUmlnaHQ6ICdsb29rUmlnaHQnLFxuICBCbGlua0xlZnQ6ICdibGlua0xlZnQnLFxuICBCbGlua1JpZ2h0OiAnYmxpbmtSaWdodCcsXG4gIE5ldXRyYWw6ICduZXV0cmFsJyxcbn0gYXMgY29uc3Q7XG5cbmV4cG9ydCB0eXBlIFZSTUV4cHJlc3Npb25QcmVzZXROYW1lID0gKHR5cGVvZiBWUk1FeHByZXNzaW9uUHJlc2V0TmFtZSlba2V5b2YgdHlwZW9mIFZSTUV4cHJlc3Npb25QcmVzZXROYW1lXTtcbiIsICIvKipcbiAqIENsYW1wIHRoZSBpbnB1dCB2YWx1ZSB3aXRoaW4gWzAuMCAtIDEuMF0uXG4gKlxuICogQHBhcmFtIHZhbHVlIFRoZSBpbnB1dCB2YWx1ZVxuICovXG5leHBvcnQgZnVuY3Rpb24gc2F0dXJhdGUodmFsdWU6IG51bWJlcik6IG51bWJlciB7XG4gIHJldHVybiBNYXRoLm1heChNYXRoLm1pbih2YWx1ZSwgMS4wKSwgMC4wKTtcbn1cbiIsICJpbXBvcnQgeyBWUk1FeHByZXNzaW9uUHJlc2V0TmFtZSB9IGZyb20gJy4vVlJNRXhwcmVzc2lvblByZXNldE5hbWUnO1xuaW1wb3J0IHsgc2F0dXJhdGUgfSBmcm9tICcuLi91dGlscy9zYXR1cmF0ZSc7XG5pbXBvcnQgdHlwZSB7IFZSTUV4cHJlc3Npb24gfSBmcm9tICcuL1ZSTUV4cHJlc3Npb24nO1xuXG5leHBvcnQgY2xhc3MgVlJNRXhwcmVzc2lvbk1hbmFnZXIge1xuICAvKipcbiAgICogQSBzZXQgb2YgbmFtZSBvciBwcmVzZXQgbmFtZSBvZiBleHByZXNzaW9ucyB0aGF0IHdpbGwgYmUgb3ZlcnJpZGRlbiBieSB7QGxpbmsgVlJNRXhwcmVzc2lvbi5vdmVycmlkZUJsaW5rfS5cbiAgICovXG4gIHB1YmxpYyBibGlua0V4cHJlc3Npb25OYW1lcyA9IFsnYmxpbmsnLCAnYmxpbmtMZWZ0JywgJ2JsaW5rUmlnaHQnXTtcblxuICAvKipcbiAgICogQSBzZXQgb2YgbmFtZSBvciBwcmVzZXQgbmFtZSBvZiBleHByZXNzaW9ucyB0aGF0IHdpbGwgYmUgb3ZlcnJpZGRlbiBieSB7QGxpbmsgVlJNRXhwcmVzc2lvbi5vdmVycmlkZUxvb2tBdH0uXG4gICAqL1xuICBwdWJsaWMgbG9va0F0RXhwcmVzc2lvbk5hbWVzID0gWydsb29rTGVmdCcsICdsb29rUmlnaHQnLCAnbG9va1VwJywgJ2xvb2tEb3duJ107XG5cbiAgLyoqXG4gICAqIEEgc2V0IG9mIG5hbWUgb3IgcHJlc2V0IG5hbWUgb2YgZXhwcmVzc2lvbnMgdGhhdCB3aWxsIGJlIG92ZXJyaWRkZW4gYnkge0BsaW5rIFZSTUV4cHJlc3Npb24ub3ZlcnJpZGVNb3V0aH0uXG4gICAqL1xuICBwdWJsaWMgbW91dGhFeHByZXNzaW9uTmFtZXMgPSBbJ2FhJywgJ2VlJywgJ2loJywgJ29oJywgJ291J107XG5cbiAgLyoqXG4gICAqIEEgc2V0IG9mIHtAbGluayBWUk1FeHByZXNzaW9ufS5cbiAgICogV2hlbiB5b3Ugd2FudCB0byByZWdpc3RlciBleHByZXNzaW9ucywgdXNlIHtAbGluayByZWdpc3RlckV4cHJlc3Npb259XG4gICAqL1xuICBwcml2YXRlIF9leHByZXNzaW9uczogVlJNRXhwcmVzc2lvbltdID0gW107XG4gIHB1YmxpYyBnZXQgZXhwcmVzc2lvbnMoKTogVlJNRXhwcmVzc2lvbltdIHtcbiAgICByZXR1cm4gdGhpcy5fZXhwcmVzc2lvbnMuY29uY2F0KCk7XG4gIH1cblxuICAvKipcbiAgICogQSBtYXAgZnJvbSBuYW1lIHRvIGV4cHJlc3Npb24uXG4gICAqL1xuICBwcml2YXRlIF9leHByZXNzaW9uTWFwOiB7IFtuYW1lOiBzdHJpbmddOiBWUk1FeHByZXNzaW9uIH0gPSB7fTtcbiAgcHVibGljIGdldCBleHByZXNzaW9uTWFwKCk6IHsgW25hbWU6IHN0cmluZ106IFZSTUV4cHJlc3Npb24gfSB7XG4gICAgcmV0dXJuIE9iamVjdC5hc3NpZ24oe30sIHRoaXMuX2V4cHJlc3Npb25NYXApO1xuICB9XG5cbiAgLyoqXG4gICAqIEEgbWFwIGZyb20gbmFtZSB0byBleHByZXNzaW9uLCBidXQgZXhjbHVkaW5nIGN1c3RvbSBleHByZXNzaW9ucy5cbiAgICovXG4gIHB1YmxpYyBnZXQgcHJlc2V0RXhwcmVzc2lvbk1hcCgpOiB7IFtuYW1lIGluIFZSTUV4cHJlc3Npb25QcmVzZXROYW1lXT86IFZSTUV4cHJlc3Npb24gfSB7XG4gICAgY29uc3QgcmVzdWx0OiB7IFtuYW1lIGluIFZSTUV4cHJlc3Npb25QcmVzZXROYW1lXT86IFZSTUV4cHJlc3Npb24gfSA9IHt9O1xuXG4gICAgY29uc3QgcHJlc2V0TmFtZVNldCA9IG5ldyBTZXQ8c3RyaW5nPihPYmplY3QudmFsdWVzKFZSTUV4cHJlc3Npb25QcmVzZXROYW1lKSk7XG5cbiAgICBPYmplY3QuZW50cmllcyh0aGlzLl9leHByZXNzaW9uTWFwKS5mb3JFYWNoKChbbmFtZSwgZXhwcmVzc2lvbl0pID0+IHtcbiAgICAgIGlmIChwcmVzZXROYW1lU2V0LmhhcyhuYW1lKSkge1xuICAgICAgICByZXN1bHRbbmFtZSBhcyBWUk1FeHByZXNzaW9uUHJlc2V0TmFtZV0gPSBleHByZXNzaW9uO1xuICAgICAgfVxuICAgIH0pO1xuXG4gICAgcmV0dXJuIHJlc3VsdDtcbiAgfVxuXG4gIC8qKlxuICAgKiBBIG1hcCBmcm9tIG5hbWUgdG8gZXhwcmVzc2lvbiwgYnV0IGV4Y2x1ZGluZyBwcmVzZXQgZXhwcmVzc2lvbnMuXG4gICAqL1xuICBwdWJsaWMgZ2V0IGN1c3RvbUV4cHJlc3Npb25NYXAoKTogeyBbbmFtZTogc3RyaW5nXTogVlJNRXhwcmVzc2lvbiB9IHtcbiAgICBjb25zdCByZXN1bHQ6IHsgW25hbWU6IHN0cmluZ106IFZSTUV4cHJlc3Npb24gfSA9IHt9O1xuXG4gICAgY29uc3QgcHJlc2V0TmFtZVNldCA9IG5ldyBTZXQ8c3RyaW5nPihPYmplY3QudmFsdWVzKFZSTUV4cHJlc3Npb25QcmVzZXROYW1lKSk7XG5cbiAgICBPYmplY3QuZW50cmllcyh0aGlzLl9leHByZXNzaW9uTWFwKS5mb3JFYWNoKChbbmFtZSwgZXhwcmVzc2lvbl0pID0+IHtcbiAgICAgIGlmICghcHJlc2V0TmFtZVNldC5oYXMobmFtZSkpIHtcbiAgICAgICAgcmVzdWx0W25hbWVdID0gZXhwcmVzc2lvbjtcbiAgICAgIH1cbiAgICB9KTtcblxuICAgIHJldHVybiByZXN1bHQ7XG4gIH1cblxuICAvKipcbiAgICogQ3JlYXRlIGEgbmV3IHtAbGluayBWUk1FeHByZXNzaW9uTWFuYWdlcn0uXG4gICAqL1xuICBwdWJsaWMgY29uc3RydWN0b3IoKSB7XG4gICAgLy8gZG8gbm90aGluZ1xuICB9XG5cbiAgLyoqXG4gICAqIENvcHkgdGhlIGdpdmVuIHtAbGluayBWUk1FeHByZXNzaW9uTWFuYWdlcn0gaW50byB0aGlzIG9uZS5cbiAgICogQHBhcmFtIHNvdXJjZSBUaGUge0BsaW5rIFZSTUV4cHJlc3Npb25NYW5hZ2VyfSB5b3Ugd2FudCB0byBjb3B5XG4gICAqIEByZXR1cm5zIHRoaXNcbiAgICovXG4gIHB1YmxpYyBjb3B5KHNvdXJjZTogVlJNRXhwcmVzc2lvbk1hbmFnZXIpOiB0aGlzIHtcbiAgICAvLyBmaXJzdCB1bnJlZ2lzdGVyIGFsbCB0aGUgZXhwcmVzc2lvbiBpdCBoYXNcbiAgICBjb25zdCBleHByZXNzaW9ucyA9IHRoaXMuX2V4cHJlc3Npb25zLmNvbmNhdCgpO1xuICAgIGV4cHJlc3Npb25zLmZvckVhY2goKGV4cHJlc3Npb24pID0+IHtcbiAgICAgIHRoaXMudW5yZWdpc3RlckV4cHJlc3Npb24oZXhwcmVzc2lvbik7XG4gICAgfSk7XG5cbiAgICAvLyB0aGVuIHJlZ2lzdGVyIGFsbCB0aGUgZXhwcmVzc2lvbiBvZiB0aGUgc291cmNlXG4gICAgc291cmNlLl9leHByZXNzaW9ucy5mb3JFYWNoKChleHByZXNzaW9uKSA9PiB7XG4gICAgICB0aGlzLnJlZ2lzdGVyRXhwcmVzc2lvbihleHByZXNzaW9uKTtcbiAgICB9KTtcblxuICAgIC8vIGNvcHkgcmVtYWluaW5nIG1lbWJlcnNcbiAgICB0aGlzLmJsaW5rRXhwcmVzc2lvbk5hbWVzID0gc291cmNlLmJsaW5rRXhwcmVzc2lvbk5hbWVzLmNvbmNhdCgpO1xuICAgIHRoaXMubG9va0F0RXhwcmVzc2lvbk5hbWVzID0gc291cmNlLmxvb2tBdEV4cHJlc3Npb25OYW1lcy5jb25jYXQoKTtcbiAgICB0aGlzLm1vdXRoRXhwcmVzc2lvbk5hbWVzID0gc291cmNlLm1vdXRoRXhwcmVzc2lvbk5hbWVzLmNvbmNhdCgpO1xuXG4gICAgcmV0dXJuIHRoaXM7XG4gIH1cblxuICAvKipcbiAgICogUmV0dXJucyBhIGNsb25lIG9mIHRoaXMge0BsaW5rIFZSTUV4cHJlc3Npb25NYW5hZ2VyfS5cbiAgICogQHJldHVybnMgQ29waWVkIHtAbGluayBWUk1FeHByZXNzaW9uTWFuYWdlcn1cbiAgICovXG4gIHB1YmxpYyBjbG9uZSgpOiBWUk1FeHByZXNzaW9uTWFuYWdlciB7XG4gICAgcmV0dXJuIG5ldyBWUk1FeHByZXNzaW9uTWFuYWdlcigpLmNvcHkodGhpcyk7XG4gIH1cblxuICAvKipcbiAgICogUmV0dXJuIGEgcmVnaXN0ZXJlZCBleHByZXNzaW9uLlxuICAgKiBJZiBpdCBjYW5ub3QgZmluZCBhbiBleHByZXNzaW9uLCBpdCB3aWxsIHJldHVybiBgbnVsbGAgaW5zdGVhZC5cbiAgICpcbiAgICogQHBhcmFtIG5hbWUgTmFtZSBvciBwcmVzZXQgbmFtZSBvZiB0aGUgZXhwcmVzc2lvblxuICAgKi9cbiAgcHVibGljIGdldEV4cHJlc3Npb24obmFtZTogVlJNRXhwcmVzc2lvblByZXNldE5hbWUgfCBzdHJpbmcpOiBWUk1FeHByZXNzaW9uIHwgbnVsbCB7XG4gICAgcmV0dXJuIHRoaXMuX2V4cHJlc3Npb25NYXBbbmFtZV0gPz8gbnVsbDtcbiAgfVxuXG4gIC8qKlxuICAgKiBSZWdpc3RlciBhbiBleHByZXNzaW9uLlxuICAgKlxuICAgKiBAcGFyYW0gZXhwcmVzc2lvbiB7QGxpbmsgVlJNRXhwcmVzc2lvbn0gdGhhdCBkZXNjcmliZXMgdGhlIGV4cHJlc3Npb25cbiAgICovXG4gIHB1YmxpYyByZWdpc3RlckV4cHJlc3Npb24oZXhwcmVzc2lvbjogVlJNRXhwcmVzc2lvbik6IHZvaWQge1xuICAgIHRoaXMuX2V4cHJlc3Npb25zLnB1c2goZXhwcmVzc2lvbik7XG4gICAgdGhpcy5fZXhwcmVzc2lvbk1hcFtleHByZXNzaW9uLmV4cHJlc3Npb25OYW1lXSA9IGV4cHJlc3Npb247XG4gIH1cblxuICAvKipcbiAgICogVW5yZWdpc3RlciBhbiBleHByZXNzaW9uLlxuICAgKlxuICAgKiBAcGFyYW0gZXhwcmVzc2lvbiBUaGUgZXhwcmVzc2lvbiB5b3Ugd2FudCB0byB1bnJlZ2lzdGVyXG4gICAqL1xuICBwdWJsaWMgdW5yZWdpc3RlckV4cHJlc3Npb24oZXhwcmVzc2lvbjogVlJNRXhwcmVzc2lvbik6IHZvaWQge1xuICAgIGNvbnN0IGluZGV4ID0gdGhpcy5fZXhwcmVzc2lvbnMuaW5kZXhPZihleHByZXNzaW9uKTtcbiAgICBpZiAoaW5kZXggPT09IC0xKSB7XG4gICAgICBjb25zb2xlLndhcm4oJ1ZSTUV4cHJlc3Npb25NYW5hZ2VyOiBUaGUgc3BlY2lmaWVkIGV4cHJlc3Npb25zIGlzIG5vdCByZWdpc3RlcmVkJyk7XG4gICAgfVxuXG4gICAgdGhpcy5fZXhwcmVzc2lvbnMuc3BsaWNlKGluZGV4LCAxKTtcbiAgICBkZWxldGUgdGhpcy5fZXhwcmVzc2lvbk1hcFtleHByZXNzaW9uLmV4cHJlc3Npb25OYW1lXTtcbiAgfVxuXG4gIC8qKlxuICAgKiBHZXQgdGhlIGN1cnJlbnQgd2VpZ2h0IG9mIHRoZSBzcGVjaWZpZWQgZXhwcmVzc2lvbi5cbiAgICogSWYgaXQgZG9lc24ndCBoYXZlIGFuIGV4cHJlc3Npb24gb2YgZ2l2ZW4gbmFtZSwgaXQgd2lsbCByZXR1cm4gYG51bGxgIGluc3RlYWQuXG4gICAqXG4gICAqIEBwYXJhbSBuYW1lIE5hbWUgb2YgdGhlIGV4cHJlc3Npb25cbiAgICovXG4gIHB1YmxpYyBnZXRWYWx1ZShuYW1lOiBWUk1FeHByZXNzaW9uUHJlc2V0TmFtZSB8IHN0cmluZyk6IG51bWJlciB8IG51bGwge1xuICAgIGNvbnN0IGV4cHJlc3Npb24gPSB0aGlzLmdldEV4cHJlc3Npb24obmFtZSk7XG4gICAgcmV0dXJuIGV4cHJlc3Npb24/LndlaWdodCA/PyBudWxsO1xuICB9XG5cbiAgLyoqXG4gICAqIFNldCBhIHdlaWdodCB0byB0aGUgc3BlY2lmaWVkIGV4cHJlc3Npb24uXG4gICAqXG4gICAqIEBwYXJhbSBuYW1lIE5hbWUgb2YgdGhlIGV4cHJlc3Npb25cbiAgICogQHBhcmFtIHdlaWdodCBXZWlnaHRcbiAgICovXG4gIHB1YmxpYyBzZXRWYWx1ZShuYW1lOiBWUk1FeHByZXNzaW9uUHJlc2V0TmFtZSB8IHN0cmluZywgd2VpZ2h0OiBudW1iZXIpOiB2b2lkIHtcbiAgICBjb25zdCBleHByZXNzaW9uID0gdGhpcy5nZXRFeHByZXNzaW9uKG5hbWUpO1xuICAgIGlmIChleHByZXNzaW9uKSB7XG4gICAgICBleHByZXNzaW9uLndlaWdodCA9IHNhdHVyYXRlKHdlaWdodCk7XG4gICAgfVxuICB9XG5cbiAgLyoqXG4gICAqIFJlc2V0IHdlaWdodHMgb2YgYWxsIGV4cHJlc3Npb25zIHRvIGAwLjBgLlxuICAgKi9cbiAgcHVibGljIHJlc2V0VmFsdWVzKCk6IHZvaWQge1xuICAgIHRoaXMuX2V4cHJlc3Npb25zLmZvckVhY2goKGV4cHJlc3Npb24pID0+IHtcbiAgICAgIGV4cHJlc3Npb24ud2VpZ2h0ID0gMC4wO1xuICAgIH0pO1xuICB9XG5cbiAgLyoqXG4gICAqIEdldCBhIHRyYWNrIG5hbWUgb2Ygc3BlY2lmaWVkIGV4cHJlc3Npb24uXG4gICAqIFRoaXMgdHJhY2sgbmFtZSBpcyBuZWVkZWQgdG8gbWFuaXB1bGF0ZSBpdHMgZXhwcmVzc2lvbiB2aWEga2V5ZnJhbWUgYW5pbWF0aW9ucy5cbiAgICpcbiAgICogQGV4YW1wbGUgTWFuaXB1bGF0ZSBhbiBleHByZXNzaW9uIHVzaW5nIGtleWZyYW1lIGFuaW1hdGlvblxuICAgKiBgYGBqc1xuICAgKiBjb25zdCB0cmFja05hbWUgPSB2cm0uZXhwcmVzc2lvbk1hbmFnZXIuZ2V0RXhwcmVzc2lvblRyYWNrTmFtZSggJ2JsaW5rJyApO1xuICAgKiBjb25zdCB0cmFjayA9IG5ldyBUSFJFRS5OdW1iZXJLZXlmcmFtZVRyYWNrKFxuICAgKiAgIG5hbWUsXG4gICAqICAgWyAwLjAsIDAuNSwgMS4wIF0sIC8vIHRpbWVzXG4gICAqICAgWyAwLjAsIDEuMCwgMC4wIF0gLy8gdmFsdWVzXG4gICAqICk7XG4gICAqXG4gICAqIGNvbnN0IGNsaXAgPSBuZXcgVEhSRUUuQW5pbWF0aW9uQ2xpcChcbiAgICogICAnYmxpbmsnLCAvLyBuYW1lXG4gICAqICAgMS4wLCAvLyBkdXJhdGlvblxuICAgKiAgIFsgdHJhY2sgXSAvLyB0cmFja3NcbiAgICogKTtcbiAgICpcbiAgICogY29uc3QgbWl4ZXIgPSBuZXcgVEhSRUUuQW5pbWF0aW9uTWl4ZXIoIHZybS5zY2VuZSApO1xuICAgKiBjb25zdCBhY3Rpb24gPSBtaXhlci5jbGlwQWN0aW9uKCBjbGlwICk7XG4gICAqIGFjdGlvbi5wbGF5KCk7XG4gICAqIGBgYFxuICAgKlxuICAgKiBAcGFyYW0gbmFtZSBOYW1lIG9mIHRoZSBleHByZXNzaW9uXG4gICAqL1xuICBwdWJsaWMgZ2V0RXhwcmVzc2lvblRyYWNrTmFtZShuYW1lOiBWUk1FeHByZXNzaW9uUHJlc2V0TmFtZSB8IHN0cmluZyk6IHN0cmluZyB8IG51bGwge1xuICAgIGNvbnN0IGV4cHJlc3Npb24gPSB0aGlzLmdldEV4cHJlc3Npb24obmFtZSk7XG4gICAgcmV0dXJuIGV4cHJlc3Npb24gPyBgJHtleHByZXNzaW9uLm5hbWV9LndlaWdodGAgOiBudWxsO1xuICB9XG5cbiAgLyoqXG4gICAqIFVwZGF0ZSBldmVyeSBleHByZXNzaW9ucy5cbiAgICovXG4gIHB1YmxpYyB1cGRhdGUoKTogdm9pZCB7XG4gICAgLy8gc2VlIGhvdyBtdWNoIHdlIHNob3VsZCBvdmVycmlkZSBjZXJ0YWluIGV4cHJlc3Npb25zXG4gICAgY29uc3Qgd2VpZ2h0TXVsdGlwbGllcnMgPSB0aGlzLl9jYWxjdWxhdGVXZWlnaHRNdWx0aXBsaWVycygpO1xuXG4gICAgLy8gcmVzZXQgZXhwcmVzc2lvbiBiaW5kcyBmaXJzdFxuICAgIHRoaXMuX2V4cHJlc3Npb25zLmZvckVhY2goKGV4cHJlc3Npb24pID0+IHtcbiAgICAgIGV4cHJlc3Npb24uY2xlYXJBcHBsaWVkV2VpZ2h0KCk7XG4gICAgfSk7XG5cbiAgICAvLyB0aGVuIGFwcGx5IGJpbmRzXG4gICAgdGhpcy5fZXhwcmVzc2lvbnMuZm9yRWFjaCgoZXhwcmVzc2lvbikgPT4ge1xuICAgICAgbGV0IG11bHRpcGxpZXIgPSAxLjA7XG4gICAgICBjb25zdCBuYW1lID0gZXhwcmVzc2lvbi5leHByZXNzaW9uTmFtZTtcblxuICAgICAgaWYgKHRoaXMuYmxpbmtFeHByZXNzaW9uTmFtZXMuaW5kZXhPZihuYW1lKSAhPT0gLTEpIHtcbiAgICAgICAgbXVsdGlwbGllciAqPSB3ZWlnaHRNdWx0aXBsaWVycy5ibGluaztcbiAgICAgIH1cblxuICAgICAgaWYgKHRoaXMubG9va0F0RXhwcmVzc2lvbk5hbWVzLmluZGV4T2YobmFtZSkgIT09IC0xKSB7XG4gICAgICAgIG11bHRpcGxpZXIgKj0gd2VpZ2h0TXVsdGlwbGllcnMubG9va0F0O1xuICAgICAgfVxuXG4gICAgICBpZiAodGhpcy5tb3V0aEV4cHJlc3Npb25OYW1lcy5pbmRleE9mKG5hbWUpICE9PSAtMSkge1xuICAgICAgICBtdWx0aXBsaWVyICo9IHdlaWdodE11bHRpcGxpZXJzLm1vdXRoO1xuICAgICAgfVxuXG4gICAgICBleHByZXNzaW9uLmFwcGx5V2VpZ2h0KHsgbXVsdGlwbGllciB9KTtcbiAgICB9KTtcbiAgfVxuXG4gIC8qKlxuICAgKiBDYWxjdWxhdGUgc3VtIG9mIG92ZXJyaWRlIGFtb3VudHMgdG8gc2VlIGhvdyBtdWNoIHdlIHNob3VsZCBtdWx0aXBseSB3ZWlnaHRzIG9mIGNlcnRhaW4gZXhwcmVzc2lvbnMuXG4gICAqL1xuICBwcml2YXRlIF9jYWxjdWxhdGVXZWlnaHRNdWx0aXBsaWVycygpOiB7XG4gICAgYmxpbms6IG51bWJlcjtcbiAgICBsb29rQXQ6IG51bWJlcjtcbiAgICBtb3V0aDogbnVtYmVyO1xuICB9IHtcbiAgICBsZXQgYmxpbmsgPSAxLjA7XG4gICAgbGV0IGxvb2tBdCA9IDEuMDtcbiAgICBsZXQgbW91dGggPSAxLjA7XG5cbiAgICB0aGlzLl9leHByZXNzaW9ucy5mb3JFYWNoKChleHByZXNzaW9uKSA9PiB7XG4gICAgICBibGluayAtPSBleHByZXNzaW9uLm92ZXJyaWRlQmxpbmtBbW91bnQ7XG4gICAgICBsb29rQXQgLT0gZXhwcmVzc2lvbi5vdmVycmlkZUxvb2tBdEFtb3VudDtcbiAgICAgIG1vdXRoIC09IGV4cHJlc3Npb24ub3ZlcnJpZGVNb3V0aEFtb3VudDtcbiAgICB9KTtcblxuICAgIGJsaW5rID0gTWF0aC5tYXgoMC4wLCBibGluayk7XG4gICAgbG9va0F0ID0gTWF0aC5tYXgoMC4wLCBsb29rQXQpO1xuICAgIG1vdXRoID0gTWF0aC5tYXgoMC4wLCBtb3V0aCk7XG5cbiAgICByZXR1cm4geyBibGluaywgbG9va0F0LCBtb3V0aCB9O1xuICB9XG59XG4iLCAiLyogZXNsaW50LWRpc2FibGUgQHR5cGVzY3JpcHQtZXNsaW50L25hbWluZy1jb252ZW50aW9uICovXG5cbmV4cG9ydCBjb25zdCBWUk1FeHByZXNzaW9uTWF0ZXJpYWxDb2xvclR5cGUgPSB7XG4gIENvbG9yOiAnY29sb3InLFxuICBFbWlzc2lvbkNvbG9yOiAnZW1pc3Npb25Db2xvcicsXG4gIFNoYWRlQ29sb3I6ICdzaGFkZUNvbG9yJyxcbiAgTWF0Y2FwQ29sb3I6ICdtYXRjYXBDb2xvcicsXG4gIFJpbUNvbG9yOiAncmltQ29sb3InLFxuICBPdXRsaW5lQ29sb3I6ICdvdXRsaW5lQ29sb3InLFxufSBhcyBjb25zdDtcblxuZXhwb3J0IHR5cGUgVlJNRXhwcmVzc2lvbk1hdGVyaWFsQ29sb3JUeXBlID1cbiAgKHR5cGVvZiBWUk1FeHByZXNzaW9uTWF0ZXJpYWxDb2xvclR5cGUpW2tleW9mIHR5cGVvZiBWUk1FeHByZXNzaW9uTWF0ZXJpYWxDb2xvclR5cGVdO1xuXG5leHBvcnQgY29uc3QgdjBFeHByZXNzaW9uTWF0ZXJpYWxDb2xvck1hcDogeyBba2V5OiBzdHJpbmddOiBWUk1FeHByZXNzaW9uTWF0ZXJpYWxDb2xvclR5cGUgfCB1bmRlZmluZWQgfSA9IHtcbiAgX0NvbG9yOiBWUk1FeHByZXNzaW9uTWF0ZXJpYWxDb2xvclR5cGUuQ29sb3IsXG4gIF9FbWlzc2lvbkNvbG9yOiBWUk1FeHByZXNzaW9uTWF0ZXJpYWxDb2xvclR5cGUuRW1pc3Npb25Db2xvcixcbiAgX1NoYWRlQ29sb3I6IFZSTUV4cHJlc3Npb25NYXRlcmlhbENvbG9yVHlwZS5TaGFkZUNvbG9yLFxuICBfUmltQ29sb3I6IFZSTUV4cHJlc3Npb25NYXRlcmlhbENvbG9yVHlwZS5SaW1Db2xvcixcbiAgX091dGxpbmVDb2xvcjogVlJNRXhwcmVzc2lvbk1hdGVyaWFsQ29sb3JUeXBlLk91dGxpbmVDb2xvcixcbn07XG4iLCAiaW1wb3J0ICogYXMgVEhSRUUgZnJvbSAndGhyZWUnO1xuaW1wb3J0IHR5cGUgeyBWUk1FeHByZXNzaW9uQmluZCB9IGZyb20gJy4vVlJNRXhwcmVzc2lvbkJpbmQnO1xuaW1wb3J0IHR5cGUgeyBWUk1FeHByZXNzaW9uTWF0ZXJpYWxDb2xvclR5cGUgfSBmcm9tICcuL1ZSTUV4cHJlc3Npb25NYXRlcmlhbENvbG9yVHlwZSc7XG5cbmNvbnN0IF9jb2xvciA9IG5ldyBUSFJFRS5Db2xvcigpO1xuXG5pbnRlcmZhY2UgQ29sb3JCaW5kU3RhdGUge1xuICBwcm9wZXJ0eU5hbWU6IHN0cmluZztcbiAgaW5pdGlhbFZhbHVlOiBUSFJFRS5Db2xvcjtcbiAgZGVsdGFWYWx1ZTogVEhSRUUuQ29sb3I7XG59XG5cbmludGVyZmFjZSBBbHBoYUJpbmRTdGF0ZSB7XG4gIHByb3BlcnR5TmFtZTogc3RyaW5nO1xuICBpbml0aWFsVmFsdWU6IG51bWJlcjtcbiAgZGVsdGFWYWx1ZTogbnVtYmVyO1xufVxuXG5pbnRlcmZhY2UgQmluZFN0YXRlIHtcbiAgY29sb3I6IENvbG9yQmluZFN0YXRlIHwgbnVsbDtcbiAgYWxwaGE6IEFscGhhQmluZFN0YXRlIHwgbnVsbDtcbn1cblxuLyoqXG4gKiBBIGJpbmQgb2YgZXhwcmVzc2lvbiBpbmZsdWVuY2VzIHRvIGEgbWF0ZXJpYWwgY29sb3IuXG4gKi9cbmV4cG9ydCBjbGFzcyBWUk1FeHByZXNzaW9uTWF0ZXJpYWxDb2xvckJpbmQgaW1wbGVtZW50cyBWUk1FeHByZXNzaW9uQmluZCB7XG4gIC8qKlxuICAgKiBNYXBwaW5nIG9mIHByb3BlcnR5IG5hbWVzIGZyb20gVlJNQy9tYXRlcmlhbENvbG9yQmluZHMudHlwZSB0byB0aHJlZS5qcy9NYXRlcmlhbC5cbiAgICogVGhlIGZpcnN0IGVsZW1lbnQgc3RhbmRzIGZvciBjb2xvciBjaGFubmVscywgdGhlIHNlY29uZCBlbGVtZW50IHN0YW5kcyBmb3IgdGhlIGFscGhhIGNoYW5uZWwuXG4gICAqIFRoZSBzZWNvbmQgZWxlbWVudCBjYW4gYmUgbnVsbCBpZiB0aGUgdGFyZ2V0IHByb3BlcnR5IGRvZXNuJ3QgZXhpc3QuXG4gICAqL1xuICAvLyBUT0RPOiBXZSBtaWdodCB3YW50IHRvIHVzZSB0aGUgYHNhdGlzZmllc2Agb3BlcmF0b3Igb25jZSB3ZSBidW1wIFRTIHRvIDQuOSBvciBoaWdoZXJcbiAgLy8gU2VlOiBodHRwczovL2dpdGh1Yi5jb20vcGl4aXYvdGhyZWUtdnJtL3B1bGwvMTMyMyNkaXNjdXNzaW9uX3IxMzc0MDIwMDM1XG4gIHByaXZhdGUgc3RhdGljIF9wcm9wZXJ0eU5hbWVNYXBNYXA6IHtcbiAgICBbZGlzdGluZ3Vpc2hlcjogc3RyaW5nXTogeyBbdHlwZSBpbiBWUk1FeHByZXNzaW9uTWF0ZXJpYWxDb2xvclR5cGVdPzogcmVhZG9ubHkgW3N0cmluZywgc3RyaW5nIHwgbnVsbF0gfTtcbiAgfSA9IHtcbiAgICBpc01lc2hTdGFuZGFyZE1hdGVyaWFsOiB7XG4gICAgICBjb2xvcjogWydjb2xvcicsICdvcGFjaXR5J10sXG4gICAgICBlbWlzc2lvbkNvbG9yOiBbJ2VtaXNzaXZlJywgbnVsbF0sXG4gICAgfSxcbiAgICBpc01lc2hCYXNpY01hdGVyaWFsOiB7XG4gICAgICBjb2xvcjogWydjb2xvcicsICdvcGFjaXR5J10sXG4gICAgfSxcbiAgICBpc01Ub29uTWF0ZXJpYWw6IHtcbiAgICAgIGNvbG9yOiBbJ2NvbG9yJywgJ29wYWNpdHknXSxcbiAgICAgIGVtaXNzaW9uQ29sb3I6IFsnZW1pc3NpdmUnLCBudWxsXSxcbiAgICAgIG91dGxpbmVDb2xvcjogWydvdXRsaW5lQ29sb3JGYWN0b3InLCBudWxsXSxcbiAgICAgIG1hdGNhcENvbG9yOiBbJ21hdGNhcEZhY3RvcicsIG51bGxdLFxuICAgICAgcmltQ29sb3I6IFsncGFyYW1ldHJpY1JpbUNvbG9yRmFjdG9yJywgbnVsbF0sXG4gICAgICBzaGFkZUNvbG9yOiBbJ3NoYWRlQ29sb3JGYWN0b3InLCBudWxsXSxcbiAgICB9LFxuICB9O1xuXG4gIC8qKlxuICAgKiBUaGUgdGFyZ2V0IG1hdGVyaWFsLlxuICAgKi9cbiAgcHVibGljIHJlYWRvbmx5IG1hdGVyaWFsOiBUSFJFRS5NYXRlcmlhbDtcblxuICAvKipcbiAgICogVGhlIHR5cGUgb2YgdGhlIHRhcmdldCBwcm9wZXJ0eSBvZiB0aGUgbWF0ZXJpYWwuXG4gICAqL1xuICBwdWJsaWMgcmVhZG9ubHkgdHlwZTogVlJNRXhwcmVzc2lvbk1hdGVyaWFsQ29sb3JUeXBlO1xuXG4gIC8qKlxuICAgKiBUaGUgdGFyZ2V0IGNvbG9yLlxuICAgKi9cbiAgcHVibGljIHJlYWRvbmx5IHRhcmdldFZhbHVlOiBUSFJFRS5Db2xvcjtcblxuICAvKipcbiAgICogVGhlIHRhcmdldCBhbHBoYS5cbiAgICovXG4gIHB1YmxpYyByZWFkb25seSB0YXJnZXRBbHBoYTogbnVtYmVyO1xuXG4gIC8qKlxuICAgKiBJdHMgYmluZGluZyBzdGF0ZS5cbiAgICogSWYgaXQgY2Fubm90IGZpbmQgdGhlIHRhcmdldCBwcm9wZXJ0eSBpbiB0aGUgY29uc3RydWN0b3IsIGVhY2ggcHJvcGVydHkgd2lsbCBiZSBudWxsIGluc3RlYWQuXG4gICAqL1xuICBwcml2YXRlIF9zdGF0ZTogQmluZFN0YXRlO1xuXG4gIHB1YmxpYyBjb25zdHJ1Y3Rvcih7XG4gICAgbWF0ZXJpYWwsXG4gICAgdHlwZSxcbiAgICB0YXJnZXRWYWx1ZSxcbiAgICB0YXJnZXRBbHBoYSxcbiAgfToge1xuICAgIC8qKlxuICAgICAqIFRoZSB0YXJnZXQgbWF0ZXJpYWwuXG4gICAgICovXG4gICAgbWF0ZXJpYWw6IFRIUkVFLk1hdGVyaWFsO1xuXG4gICAgLyoqXG4gICAgICogVGhlIHR5cGUgb2YgdGhlIHRhcmdldCBwcm9wZXJ0eSBvZiB0aGUgbWF0ZXJpYWwuXG4gICAgICovXG4gICAgdHlwZTogVlJNRXhwcmVzc2lvbk1hdGVyaWFsQ29sb3JUeXBlO1xuXG4gICAgLyoqXG4gICAgICogVGhlIHRhcmdldCBjb2xvci5cbiAgICAgKi9cbiAgICB0YXJnZXRWYWx1ZTogVEhSRUUuQ29sb3I7XG5cbiAgICAvKipcbiAgICAgKiBUaGUgdGFyZ2V0IGFscGhhLlxuICAgICAqL1xuICAgIHRhcmdldEFscGhhPzogbnVtYmVyO1xuICB9KSB7XG4gICAgdGhpcy5tYXRlcmlhbCA9IG1hdGVyaWFsO1xuICAgIHRoaXMudHlwZSA9IHR5cGU7XG4gICAgdGhpcy50YXJnZXRWYWx1ZSA9IHRhcmdldFZhbHVlO1xuICAgIHRoaXMudGFyZ2V0QWxwaGEgPSB0YXJnZXRBbHBoYSA/PyAxLjA7XG5cbiAgICAvLyBpbml0IGJpbmQgc3RhdGVcbiAgICBjb25zdCBjb2xvciA9IHRoaXMuX2luaXRDb2xvckJpbmRTdGF0ZSgpO1xuICAgIGNvbnN0IGFscGhhID0gdGhpcy5faW5pdEFscGhhQmluZFN0YXRlKCk7XG4gICAgdGhpcy5fc3RhdGUgPSB7IGNvbG9yLCBhbHBoYSB9O1xuICB9XG5cbiAgcHVibGljIGFwcGx5V2VpZ2h0KHdlaWdodDogbnVtYmVyKTogdm9pZCB7XG4gICAgY29uc3QgeyBjb2xvciwgYWxwaGEgfSA9IHRoaXMuX3N0YXRlO1xuXG4gICAgaWYgKGNvbG9yICE9IG51bGwpIHtcbiAgICAgIGNvbnN0IHsgcHJvcGVydHlOYW1lLCBkZWx0YVZhbHVlIH0gPSBjb2xvcjtcblxuICAgICAgY29uc3QgdGFyZ2V0ID0gKHRoaXMubWF0ZXJpYWwgYXMgYW55KVtwcm9wZXJ0eU5hbWVdIGFzIFRIUkVFLkNvbG9yO1xuICAgICAgaWYgKHRhcmdldCAhPSB1bmRlZmluZWQpIHtcbiAgICAgICAgdGFyZ2V0LmFkZChfY29sb3IuY29weShkZWx0YVZhbHVlKS5tdWx0aXBseVNjYWxhcih3ZWlnaHQpKTtcbiAgICAgIH1cbiAgICB9XG5cbiAgICBpZiAoYWxwaGEgIT0gbnVsbCkge1xuICAgICAgY29uc3QgeyBwcm9wZXJ0eU5hbWUsIGRlbHRhVmFsdWUgfSA9IGFscGhhO1xuXG4gICAgICBjb25zdCB0YXJnZXQgPSAodGhpcy5tYXRlcmlhbCBhcyBhbnkpW3Byb3BlcnR5TmFtZV0gYXMgbnVtYmVyO1xuICAgICAgaWYgKHRhcmdldCAhPSB1bmRlZmluZWQpIHtcbiAgICAgICAgKCh0aGlzLm1hdGVyaWFsIGFzIGFueSlbcHJvcGVydHlOYW1lXSBhcyBudW1iZXIpICs9IGRlbHRhVmFsdWUgKiB3ZWlnaHQ7XG4gICAgICB9XG4gICAgfVxuICB9XG5cbiAgcHVibGljIGNsZWFyQXBwbGllZFdlaWdodCgpOiB2b2lkIHtcbiAgICBjb25zdCB7IGNvbG9yLCBhbHBoYSB9ID0gdGhpcy5fc3RhdGU7XG5cbiAgICBpZiAoY29sb3IgIT0gbnVsbCkge1xuICAgICAgY29uc3QgeyBwcm9wZXJ0eU5hbWUsIGluaXRpYWxWYWx1ZSB9ID0gY29sb3I7XG5cbiAgICAgIGNvbnN0IHRhcmdldCA9ICh0aGlzLm1hdGVyaWFsIGFzIGFueSlbcHJvcGVydHlOYW1lXSBhcyBUSFJFRS5Db2xvcjtcbiAgICAgIGlmICh0YXJnZXQgIT0gdW5kZWZpbmVkKSB7XG4gICAgICAgIHRhcmdldC5jb3B5KGluaXRpYWxWYWx1ZSk7XG4gICAgICB9XG4gICAgfVxuXG4gICAgaWYgKGFscGhhICE9IG51bGwpIHtcbiAgICAgIGNvbnN0IHsgcHJvcGVydHlOYW1lLCBpbml0aWFsVmFsdWUgfSA9IGFscGhhO1xuXG4gICAgICBjb25zdCB0YXJnZXQgPSAodGhpcy5tYXRlcmlhbCBhcyBhbnkpW3Byb3BlcnR5TmFtZV0gYXMgbnVtYmVyO1xuICAgICAgaWYgKHRhcmdldCAhPSB1bmRlZmluZWQpIHtcbiAgICAgICAgKCh0aGlzLm1hdGVyaWFsIGFzIGFueSlbcHJvcGVydHlOYW1lXSBhcyBudW1iZXIpID0gaW5pdGlhbFZhbHVlO1xuICAgICAgfVxuICAgIH1cbiAgfVxuXG4gIHByaXZhdGUgX2luaXRDb2xvckJpbmRTdGF0ZSgpOiBDb2xvckJpbmRTdGF0ZSB8IG51bGwge1xuICAgIGNvbnN0IHsgbWF0ZXJpYWwsIHR5cGUsIHRhcmdldFZhbHVlIH0gPSB0aGlzO1xuXG4gICAgY29uc3QgcHJvcGVydHlOYW1lTWFwID0gdGhpcy5fZ2V0UHJvcGVydHlOYW1lTWFwKCk7XG4gICAgY29uc3QgcHJvcGVydHlOYW1lID0gcHJvcGVydHlOYW1lTWFwPy5bdHlwZV0/LlswXSA/PyBudWxsO1xuXG4gICAgaWYgKHByb3BlcnR5TmFtZSA9PSBudWxsKSB7XG4gICAgICBjb25zb2xlLndhcm4oXG4gICAgICAgIGBUcmllZCB0byBhZGQgYSBtYXRlcmlhbCBjb2xvciBiaW5kIHRvIHRoZSBtYXRlcmlhbCAke1xuICAgICAgICAgIG1hdGVyaWFsLm5hbWUgPz8gJyhubyBuYW1lKSdcbiAgICAgICAgfSwgdGhlIHR5cGUgJHt0eXBlfSBidXQgdGhlIG1hdGVyaWFsIG9yIHRoZSB0eXBlIGlzIG5vdCBzdXBwb3J0ZWQuYCxcbiAgICAgICk7XG5cbiAgICAgIHJldHVybiBudWxsO1xuICAgIH1cblxuICAgIGNvbnN0IHRhcmdldCA9IChtYXRlcmlhbCBhcyBhbnkpW3Byb3BlcnR5TmFtZV0gYXMgVEhSRUUuQ29sb3I7XG5cbiAgICBjb25zdCBpbml0aWFsVmFsdWUgPSB0YXJnZXQuY2xvbmUoKTtcblxuICAgIC8vIFx1OENBMFx1MzA2RVx1NTAyNFx1MzA5Mlx1NEZERFx1NjMwMVx1MzA1OVx1MzA4Qlx1MzA1Rlx1MzA4MVx1MzA2QkNvbG9yLnN1Ylx1MzA5Mlx1NEY3Rlx1MzA4Rlx1MzA1QVx1MzA2Qlx1NURFRVx1NTIwNlx1MzA5Mlx1OEEwOFx1N0I5N1x1MzA1OVx1MzA4QlxuICAgIGNvbnN0IGRlbHRhVmFsdWUgPSBuZXcgVEhSRUUuQ29sb3IoXG4gICAgICB0YXJnZXRWYWx1ZS5yIC0gaW5pdGlhbFZhbHVlLnIsXG4gICAgICB0YXJnZXRWYWx1ZS5nIC0gaW5pdGlhbFZhbHVlLmcsXG4gICAgICB0YXJnZXRWYWx1ZS5iIC0gaW5pdGlhbFZhbHVlLmIsXG4gICAgKTtcblxuICAgIHJldHVybiB7IHByb3BlcnR5TmFtZSwgaW5pdGlhbFZhbHVlLCBkZWx0YVZhbHVlIH07XG4gIH1cblxuICBwcml2YXRlIF9pbml0QWxwaGFCaW5kU3RhdGUoKTogQWxwaGFCaW5kU3RhdGUgfCBudWxsIHtcbiAgICBjb25zdCB7IG1hdGVyaWFsLCB0eXBlLCB0YXJnZXRBbHBoYSB9ID0gdGhpcztcblxuICAgIGNvbnN0IHByb3BlcnR5TmFtZU1hcCA9IHRoaXMuX2dldFByb3BlcnR5TmFtZU1hcCgpO1xuICAgIGNvbnN0IHByb3BlcnR5TmFtZSA9IHByb3BlcnR5TmFtZU1hcD8uW3R5cGVdPy5bMV0gPz8gbnVsbDtcblxuICAgIGlmIChwcm9wZXJ0eU5hbWUgPT0gbnVsbCAmJiB0YXJnZXRBbHBoYSAhPT0gMS4wKSB7XG4gICAgICBjb25zb2xlLndhcm4oXG4gICAgICAgIGBUcmllZCB0byBhZGQgYSBtYXRlcmlhbCBhbHBoYSBiaW5kIHRvIHRoZSBtYXRlcmlhbCAke1xuICAgICAgICAgIG1hdGVyaWFsLm5hbWUgPz8gJyhubyBuYW1lKSdcbiAgICAgICAgfSwgdGhlIHR5cGUgJHt0eXBlfSBidXQgdGhlIG1hdGVyaWFsIG9yIHRoZSB0eXBlIGRvZXMgbm90IHN1cHBvcnQgYWxwaGEuYCxcbiAgICAgICk7XG5cbiAgICAgIHJldHVybiBudWxsO1xuICAgIH1cblxuICAgIGlmIChwcm9wZXJ0eU5hbWUgPT0gbnVsbCkge1xuICAgICAgcmV0dXJuIG51bGw7XG4gICAgfVxuXG4gICAgY29uc3QgaW5pdGlhbFZhbHVlID0gKG1hdGVyaWFsIGFzIGFueSlbcHJvcGVydHlOYW1lXSBhcyBudW1iZXI7XG5cbiAgICBjb25zdCBkZWx0YVZhbHVlID0gdGFyZ2V0QWxwaGEgLSBpbml0aWFsVmFsdWU7XG5cbiAgICByZXR1cm4geyBwcm9wZXJ0eU5hbWUsIGluaXRpYWxWYWx1ZSwgZGVsdGFWYWx1ZSB9O1xuICB9XG5cbiAgcHJpdmF0ZSBfZ2V0UHJvcGVydHlOYW1lTWFwKCk6XG4gICAgfCB7IFt0eXBlIGluIFZSTUV4cHJlc3Npb25NYXRlcmlhbENvbG9yVHlwZV0/OiByZWFkb25seSBbc3RyaW5nLCBzdHJpbmcgfCBudWxsXSB9XG4gICAgfCBudWxsIHtcbiAgICByZXR1cm4gKFxuICAgICAgT2JqZWN0LmVudHJpZXMoVlJNRXhwcmVzc2lvbk1hdGVyaWFsQ29sb3JCaW5kLl9wcm9wZXJ0eU5hbWVNYXBNYXApLmZpbmQoKFtkaXN0aW5ndWlzaGVyXSkgPT4ge1xuICAgICAgICByZXR1cm4gKHRoaXMubWF0ZXJpYWwgYXMgYW55KVtkaXN0aW5ndWlzaGVyXSA9PT0gdHJ1ZTtcbiAgICAgIH0pPy5bMV0gPz8gbnVsbFxuICAgICk7XG4gIH1cbn1cbiIsICJpbXBvcnQgdHlwZSAqIGFzIFRIUkVFIGZyb20gJ3RocmVlJztcbmltcG9ydCB0eXBlIHsgVlJNRXhwcmVzc2lvbkJpbmQgfSBmcm9tICcuL1ZSTUV4cHJlc3Npb25CaW5kJztcblxuLyoqXG4gKiBBIGJpbmQgb2Yge0BsaW5rIFZSTUV4cHJlc3Npb259IGluZmx1ZW5jZXMgdG8gbW9ycGggdGFyZ2V0cy5cbiAqL1xuZXhwb3J0IGNsYXNzIFZSTUV4cHJlc3Npb25Nb3JwaFRhcmdldEJpbmQgaW1wbGVtZW50cyBWUk1FeHByZXNzaW9uQmluZCB7XG4gIC8qKlxuICAgKiBUaGUgbWVzaCBwcmltaXRpdmVzIHRoYXQgYXR0YWNoZWQgdG8gdGFyZ2V0IG1lc2guXG4gICAqL1xuICBwdWJsaWMgcmVhZG9ubHkgcHJpbWl0aXZlczogVEhSRUUuTWVzaFtdO1xuXG4gIC8qKlxuICAgKiBUaGUgaW5kZXggb2YgdGhlIG1vcnBoIHRhcmdldCBpbiB0aGUgbWVzaC5cbiAgICovXG4gIHB1YmxpYyByZWFkb25seSBpbmRleDogbnVtYmVyO1xuXG4gIC8qKlxuICAgKiBUaGUgd2VpZ2h0IHZhbHVlIG9mIHRhcmdldCBtb3JwaCB0YXJnZXQuIFJhbmdpbmcgaW4gWzAuMCAtIDEuMF0uXG4gICAqL1xuICBwdWJsaWMgcmVhZG9ubHkgd2VpZ2h0OiBudW1iZXI7XG5cbiAgcHVibGljIGNvbnN0cnVjdG9yKHtcbiAgICBwcmltaXRpdmVzLFxuICAgIGluZGV4LFxuICAgIHdlaWdodCxcbiAgfToge1xuICAgIC8qKlxuICAgICAqIFRoZSBtZXNoIHByaW1pdGl2ZXMgdGhhdCBhdHRhY2hlZCB0byB0YXJnZXQgbWVzaC5cbiAgICAgKi9cbiAgICBwcmltaXRpdmVzOiBUSFJFRS5NZXNoW107XG5cbiAgICAvKipcbiAgICAgKiBUaGUgaW5kZXggb2YgdGhlIG1vcnBoIHRhcmdldCBpbiB0aGUgbWVzaC5cbiAgICAgKi9cbiAgICBpbmRleDogbnVtYmVyO1xuXG4gICAgLyoqXG4gICAgICogVGhlIHdlaWdodCB2YWx1ZSBvZiB0YXJnZXQgbW9ycGggdGFyZ2V0LiBSYW5naW5nIGluIFswLjAgLSAxLjBdLlxuICAgICAqL1xuICAgIHdlaWdodDogbnVtYmVyO1xuICB9KSB7XG4gICAgdGhpcy5wcmltaXRpdmVzID0gcHJpbWl0aXZlcztcbiAgICB0aGlzLmluZGV4ID0gaW5kZXg7XG4gICAgdGhpcy53ZWlnaHQgPSB3ZWlnaHQ7XG4gIH1cblxuICBwdWJsaWMgYXBwbHlXZWlnaHQod2VpZ2h0OiBudW1iZXIpOiB2b2lkIHtcbiAgICB0aGlzLnByaW1pdGl2ZXMuZm9yRWFjaCgobWVzaCkgPT4ge1xuICAgICAgaWYgKG1lc2gubW9ycGhUYXJnZXRJbmZsdWVuY2VzPy5bdGhpcy5pbmRleF0gIT0gbnVsbCkge1xuICAgICAgICBtZXNoLm1vcnBoVGFyZ2V0SW5mbHVlbmNlc1t0aGlzLmluZGV4XSArPSB0aGlzLndlaWdodCAqIHdlaWdodDtcbiAgICAgIH1cbiAgICB9KTtcbiAgfVxuXG4gIHB1YmxpYyBjbGVhckFwcGxpZWRXZWlnaHQoKTogdm9pZCB7XG4gICAgdGhpcy5wcmltaXRpdmVzLmZvckVhY2goKG1lc2gpID0+IHtcbiAgICAgIGlmIChtZXNoLm1vcnBoVGFyZ2V0SW5mbHVlbmNlcz8uW3RoaXMuaW5kZXhdICE9IG51bGwpIHtcbiAgICAgICAgbWVzaC5tb3JwaFRhcmdldEluZmx1ZW5jZXNbdGhpcy5pbmRleF0gPSAwLjA7XG4gICAgICB9XG4gICAgfSk7XG4gIH1cbn1cbiIsICJpbXBvcnQgKiBhcyBUSFJFRSBmcm9tICd0aHJlZSc7XG5pbXBvcnQgdHlwZSB7IFZSTUV4cHJlc3Npb25CaW5kIH0gZnJvbSAnLi9WUk1FeHByZXNzaW9uQmluZCc7XG5cbmNvbnN0IF92MiA9IG5ldyBUSFJFRS5WZWN0b3IyKCk7XG5cbi8qKlxuICogQSBiaW5kIG9mIGV4cHJlc3Npb24gaW5mbHVlbmNlcyB0byB0ZXh0dXJlIHRyYW5zZm9ybXMuXG4gKi9cbmV4cG9ydCBjbGFzcyBWUk1FeHByZXNzaW9uVGV4dHVyZVRyYW5zZm9ybUJpbmQgaW1wbGVtZW50cyBWUk1FeHByZXNzaW9uQmluZCB7XG4gIHByaXZhdGUgc3RhdGljIF9wcm9wZXJ0eU5hbWVzTWFwOiB7IFtkaXN0aW5ndWlzaGVyOiBzdHJpbmddOiBzdHJpbmdbXSB9ID0ge1xuICAgIGlzTWVzaFN0YW5kYXJkTWF0ZXJpYWw6IFtcbiAgICAgICdtYXAnLFxuICAgICAgJ2VtaXNzaXZlTWFwJyxcbiAgICAgICdidW1wTWFwJyxcbiAgICAgICdub3JtYWxNYXAnLFxuICAgICAgJ2Rpc3BsYWNlbWVudE1hcCcsXG4gICAgICAncm91Z2huZXNzTWFwJyxcbiAgICAgICdtZXRhbG5lc3NNYXAnLFxuICAgICAgJ2FscGhhTWFwJyxcbiAgICBdLFxuICAgIGlzTWVzaEJhc2ljTWF0ZXJpYWw6IFsnbWFwJywgJ3NwZWN1bGFyTWFwJywgJ2FscGhhTWFwJ10sXG4gICAgaXNNVG9vbk1hdGVyaWFsOiBbXG4gICAgICAnbWFwJyxcbiAgICAgICdub3JtYWxNYXAnLFxuICAgICAgJ2VtaXNzaXZlTWFwJyxcbiAgICAgICdzaGFkZU11bHRpcGx5VGV4dHVyZScsXG4gICAgICAncmltTXVsdGlwbHlUZXh0dXJlJyxcbiAgICAgICdvdXRsaW5lV2lkdGhNdWx0aXBseVRleHR1cmUnLFxuICAgICAgJ3V2QW5pbWF0aW9uTWFza1RleHR1cmUnLFxuICAgIF0sXG4gIH07XG5cbiAgLyoqXG4gICAqIFRoZSB0YXJnZXQgbWF0ZXJpYWwuXG4gICAqL1xuICBwdWJsaWMgcmVhZG9ubHkgbWF0ZXJpYWw6IFRIUkVFLk1hdGVyaWFsO1xuXG4gIC8qKlxuICAgKiBUaGUgdXYgc2NhbGUgb2YgdGhlIHRleHR1cmUuXG4gICAqL1xuICBwdWJsaWMgcmVhZG9ubHkgc2NhbGU6IFRIUkVFLlZlY3RvcjI7XG5cbiAgLyoqXG4gICAqIFRoZSB1diBvZmZzZXQgb2YgdGhlIHRleHR1cmUuXG4gICAqL1xuICBwdWJsaWMgcmVhZG9ubHkgb2Zmc2V0OiBUSFJFRS5WZWN0b3IyO1xuXG4gIC8qKlxuICAgKiBUaGUgbGlzdCBvZiB0ZXh0dXJlIG5hbWVzIGFuZCBpdHMgc3RhdGUgdGhhdCBzaG91bGQgYmUgdHJhbnNmb3JtZWQgYnkgdGhpcyBiaW5kLlxuICAgKi9cbiAgcHJpdmF0ZSBfcHJvcGVydGllczoge1xuICAgIG5hbWU6IHN0cmluZztcbiAgICBpbml0aWFsT2Zmc2V0OiBUSFJFRS5WZWN0b3IyO1xuICAgIGluaXRpYWxTY2FsZTogVEhSRUUuVmVjdG9yMjtcbiAgICBkZWx0YU9mZnNldDogVEhSRUUuVmVjdG9yMjtcbiAgICBkZWx0YVNjYWxlOiBUSFJFRS5WZWN0b3IyO1xuICB9W107XG5cbiAgcHVibGljIGNvbnN0cnVjdG9yKHtcbiAgICBtYXRlcmlhbCxcbiAgICBzY2FsZSxcbiAgICBvZmZzZXQsXG4gIH06IHtcbiAgICAvKipcbiAgICAgKiBUaGUgdGFyZ2V0IG1hdGVyaWFsLlxuICAgICAqL1xuICAgIG1hdGVyaWFsOiBUSFJFRS5NYXRlcmlhbDtcblxuICAgIC8qKlxuICAgICAqIFRoZSB1diBzY2FsZSBvZiB0aGUgdGV4dHVyZS5cbiAgICAgKi9cbiAgICBzY2FsZTogVEhSRUUuVmVjdG9yMjtcblxuICAgIC8qKlxuICAgICAqIFRoZSB1diBvZmZzZXQgb2YgdGhlIHRleHR1cmUuXG4gICAgICovXG4gICAgb2Zmc2V0OiBUSFJFRS5WZWN0b3IyO1xuICB9KSB7XG4gICAgdGhpcy5tYXRlcmlhbCA9IG1hdGVyaWFsO1xuICAgIHRoaXMuc2NhbGUgPSBzY2FsZTtcbiAgICB0aGlzLm9mZnNldCA9IG9mZnNldDtcblxuICAgIGNvbnN0IHByb3BlcnR5TmFtZXMgPSBPYmplY3QuZW50cmllcyhWUk1FeHByZXNzaW9uVGV4dHVyZVRyYW5zZm9ybUJpbmQuX3Byb3BlcnR5TmFtZXNNYXApLmZpbmQoXG4gICAgICAoW2Rpc3Rpbmd1aXNoZXJdKSA9PiB7XG4gICAgICAgIHJldHVybiAobWF0ZXJpYWwgYXMgYW55KVtkaXN0aW5ndWlzaGVyXSA9PT0gdHJ1ZTtcbiAgICAgIH0sXG4gICAgKT8uWzFdO1xuXG4gICAgaWYgKHByb3BlcnR5TmFtZXMgPT0gbnVsbCkge1xuICAgICAgY29uc29sZS53YXJuKFxuICAgICAgICBgVHJpZWQgdG8gYWRkIGEgdGV4dHVyZSB0cmFuc2Zvcm0gYmluZCB0byB0aGUgbWF0ZXJpYWwgJHtcbiAgICAgICAgICBtYXRlcmlhbC5uYW1lID8/ICcobm8gbmFtZSknXG4gICAgICAgIH0gYnV0IHRoZSBtYXRlcmlhbCBpcyBub3Qgc3VwcG9ydGVkLmAsXG4gICAgICApO1xuXG4gICAgICB0aGlzLl9wcm9wZXJ0aWVzID0gW107XG4gICAgfSBlbHNlIHtcbiAgICAgIHRoaXMuX3Byb3BlcnRpZXMgPSBbXTtcblxuICAgICAgcHJvcGVydHlOYW1lcy5mb3JFYWNoKChwcm9wZXJ0eU5hbWUpID0+IHtcbiAgICAgICAgY29uc3QgdGV4dHVyZSA9ICgobWF0ZXJpYWwgYXMgYW55KVtwcm9wZXJ0eU5hbWVdIGFzIFRIUkVFLlRleHR1cmUgfCB1bmRlZmluZWQpPy5jbG9uZSgpO1xuICAgICAgICBpZiAoIXRleHR1cmUpIHtcbiAgICAgICAgICByZXR1cm4gbnVsbDtcbiAgICAgICAgfVxuXG4gICAgICAgIChtYXRlcmlhbCBhcyBhbnkpW3Byb3BlcnR5TmFtZV0gPSB0ZXh0dXJlOyAvLyBiZWNhdXNlIHRoZSB0ZXh0dXJlIGlzIGNsb25lZFxuXG4gICAgICAgIGNvbnN0IGluaXRpYWxPZmZzZXQgPSB0ZXh0dXJlLm9mZnNldC5jbG9uZSgpO1xuICAgICAgICBjb25zdCBpbml0aWFsU2NhbGUgPSB0ZXh0dXJlLnJlcGVhdC5jbG9uZSgpO1xuICAgICAgICBjb25zdCBkZWx0YU9mZnNldCA9IG9mZnNldC5jbG9uZSgpLnN1Yihpbml0aWFsT2Zmc2V0KTtcbiAgICAgICAgY29uc3QgZGVsdGFTY2FsZSA9IHNjYWxlLmNsb25lKCkuc3ViKGluaXRpYWxTY2FsZSk7XG5cbiAgICAgICAgdGhpcy5fcHJvcGVydGllcy5wdXNoKHtcbiAgICAgICAgICBuYW1lOiBwcm9wZXJ0eU5hbWUsXG4gICAgICAgICAgaW5pdGlhbE9mZnNldCxcbiAgICAgICAgICBkZWx0YU9mZnNldCxcbiAgICAgICAgICBpbml0aWFsU2NhbGUsXG4gICAgICAgICAgZGVsdGFTY2FsZSxcbiAgICAgICAgfSk7XG4gICAgICB9KTtcbiAgICB9XG4gIH1cblxuICBwdWJsaWMgYXBwbHlXZWlnaHQod2VpZ2h0OiBudW1iZXIpOiB2b2lkIHtcbiAgICB0aGlzLl9wcm9wZXJ0aWVzLmZvckVhY2goKHByb3BlcnR5KSA9PiB7XG4gICAgICBjb25zdCB0YXJnZXQgPSAodGhpcy5tYXRlcmlhbCBhcyBhbnkpW3Byb3BlcnR5Lm5hbWVdIGFzIFRIUkVFLlRleHR1cmU7XG4gICAgICBpZiAodGFyZ2V0ID09PSB1bmRlZmluZWQpIHtcbiAgICAgICAgcmV0dXJuO1xuICAgICAgfSAvLyBUT0RPOiB3ZSBzaG91bGQga2ljayB0aGlzIGF0IGBhZGRNYXRlcmlhbFZhbHVlYFxuXG4gICAgICB0YXJnZXQub2Zmc2V0LmFkZChfdjIuY29weShwcm9wZXJ0eS5kZWx0YU9mZnNldCkubXVsdGlwbHlTY2FsYXIod2VpZ2h0KSk7XG4gICAgICB0YXJnZXQucmVwZWF0LmFkZChfdjIuY29weShwcm9wZXJ0eS5kZWx0YVNjYWxlKS5tdWx0aXBseVNjYWxhcih3ZWlnaHQpKTtcbiAgICB9KTtcbiAgfVxuXG4gIHB1YmxpYyBjbGVhckFwcGxpZWRXZWlnaHQoKTogdm9pZCB7XG4gICAgdGhpcy5fcHJvcGVydGllcy5mb3JFYWNoKChwcm9wZXJ0eSkgPT4ge1xuICAgICAgY29uc3QgdGFyZ2V0ID0gKHRoaXMubWF0ZXJpYWwgYXMgYW55KVtwcm9wZXJ0eS5uYW1lXSBhcyBUSFJFRS5UZXh0dXJlO1xuICAgICAgaWYgKHRhcmdldCA9PT0gdW5kZWZpbmVkKSB7XG4gICAgICAgIHJldHVybjtcbiAgICAgIH0gLy8gVE9ETzogd2Ugc2hvdWxkIGtpY2sgdGhpcyBhdCBgYWRkTWF0ZXJpYWxWYWx1ZWBcblxuICAgICAgdGFyZ2V0Lm9mZnNldC5jb3B5KHByb3BlcnR5LmluaXRpYWxPZmZzZXQpO1xuICAgICAgdGFyZ2V0LnJlcGVhdC5jb3B5KHByb3BlcnR5LmluaXRpYWxTY2FsZSk7XG4gICAgfSk7XG4gIH1cbn1cbiIsICIvKiBlc2xpbnQtZGlzYWJsZSBAdHlwZXNjcmlwdC1lc2xpbnQvbmFtaW5nLWNvbnZlbnRpb24gKi9cblxuZXhwb3J0IGNvbnN0IFZSTUV4cHJlc3Npb25PdmVycmlkZVR5cGUgPSB7XG4gIE5vbmU6ICdub25lJyxcbiAgQmxvY2s6ICdibG9jaycsXG4gIEJsZW5kOiAnYmxlbmQnLFxufSBhcyBjb25zdDtcblxuZXhwb3J0IHR5cGUgVlJNRXhwcmVzc2lvbk92ZXJyaWRlVHlwZSA9ICh0eXBlb2YgVlJNRXhwcmVzc2lvbk92ZXJyaWRlVHlwZSlba2V5b2YgdHlwZW9mIFZSTUV4cHJlc3Npb25PdmVycmlkZVR5cGVdO1xuIiwgImltcG9ydCB0eXBlIHsgVlJNRmlyc3RQZXJzb25NZXNoQW5ub3RhdGlvbiB9IGZyb20gJy4vVlJNRmlyc3RQZXJzb25NZXNoQW5ub3RhdGlvbic7XG5pbXBvcnQgKiBhcyBUSFJFRSBmcm9tICd0aHJlZSc7XG5pbXBvcnQgdHlwZSB7IFZSTUh1bWFub2lkIH0gZnJvbSAnLi4vaHVtYW5vaWQnO1xuXG5leHBvcnQgY2xhc3MgVlJNRmlyc3RQZXJzb24ge1xuICAvKipcbiAgICogQSBkZWZhdWx0IGNhbWVyYSBsYXllciBmb3IgYEZpcnN0UGVyc29uT25seWAgbGF5ZXIuXG4gICAqXG4gICAqIEBzZWUgW1tnZXRGaXJzdFBlcnNvbk9ubHlMYXllcl1dXG4gICAqL1xuICBwdWJsaWMgc3RhdGljIHJlYWRvbmx5IERFRkFVTFRfRklSU1RQRVJTT05fT05MWV9MQVlFUiA9IDk7XG5cbiAgLyoqXG4gICAqIEEgZGVmYXVsdCBjYW1lcmEgbGF5ZXIgZm9yIGBUaGlyZFBlcnNvbk9ubHlgIGxheWVyLlxuICAgKlxuICAgKiBAc2VlIFtbZ2V0VGhpcmRQZXJzb25Pbmx5TGF5ZXJdXVxuICAgKi9cbiAgcHVibGljIHN0YXRpYyByZWFkb25seSBERUZBVUxUX1RISVJEUEVSU09OX09OTFlfTEFZRVIgPSAxMDtcblxuICAvKipcbiAgICogSXRzIGFzc29jaWF0ZWQge0BsaW5rIFZSTUh1bWFub2lkfS5cbiAgICovXG4gIHB1YmxpYyByZWFkb25seSBodW1hbm9pZDogVlJNSHVtYW5vaWQ7XG4gIHB1YmxpYyBtZXNoQW5ub3RhdGlvbnM6IFZSTUZpcnN0UGVyc29uTWVzaEFubm90YXRpb25bXTtcblxuICBwcml2YXRlIF9maXJzdFBlcnNvbk9ubHlMYXllciA9IFZSTUZpcnN0UGVyc29uLkRFRkFVTFRfRklSU1RQRVJTT05fT05MWV9MQVlFUjtcbiAgcHJpdmF0ZSBfdGhpcmRQZXJzb25Pbmx5TGF5ZXIgPSBWUk1GaXJzdFBlcnNvbi5ERUZBVUxUX1RISVJEUEVSU09OX09OTFlfTEFZRVI7XG5cbiAgcHJpdmF0ZSBfaW5pdGlhbGl6ZWRMYXllcnMgPSBmYWxzZTtcblxuICAvKipcbiAgICogQ3JlYXRlIGEgbmV3IFZSTUZpcnN0UGVyc29uIG9iamVjdC5cbiAgICpcbiAgICogQHBhcmFtIGh1bWFub2lkIEEge0BsaW5rIFZSTUh1bWFub2lkfVxuICAgKiBAcGFyYW0gbWVzaEFubm90YXRpb25zIEEgcmVuZGVyZXIgc2V0dGluZ3MuIFNlZSB0aGUgZGVzY3JpcHRpb24gb2YgW1tSZW5kZXJlckZpcnN0UGVyc29uRmxhZ3NdXSBmb3IgbW9yZSBpbmZvXG4gICAqL1xuICBwdWJsaWMgY29uc3RydWN0b3IoaHVtYW5vaWQ6IFZSTUh1bWFub2lkLCBtZXNoQW5ub3RhdGlvbnM6IFZSTUZpcnN0UGVyc29uTWVzaEFubm90YXRpb25bXSkge1xuICAgIHRoaXMuaHVtYW5vaWQgPSBodW1hbm9pZDtcbiAgICB0aGlzLm1lc2hBbm5vdGF0aW9ucyA9IG1lc2hBbm5vdGF0aW9ucztcbiAgfVxuXG4gIC8qKlxuICAgKiBDb3B5IHRoZSBnaXZlbiB7QGxpbmsgVlJNRmlyc3RQZXJzb259IGludG8gdGhpcyBvbmUuXG4gICAqIHtAbGluayBodW1hbm9pZH0gbXVzdCBiZSBzYW1lIGFzIHRoZSBzb3VyY2Ugb25lLlxuICAgKiBAcGFyYW0gc291cmNlIFRoZSB7QGxpbmsgVlJNRmlyc3RQZXJzb259IHlvdSB3YW50IHRvIGNvcHlcbiAgICogQHJldHVybnMgdGhpc1xuICAgKi9cbiAgcHVibGljIGNvcHkoc291cmNlOiBWUk1GaXJzdFBlcnNvbik6IHRoaXMge1xuICAgIGlmICh0aGlzLmh1bWFub2lkICE9PSBzb3VyY2UuaHVtYW5vaWQpIHtcbiAgICAgIHRocm93IG5ldyBFcnJvcignVlJNRmlyc3RQZXJzb246IGh1bWFub2lkIG11c3QgYmUgc2FtZSBpbiBvcmRlciB0byBjb3B5Jyk7XG4gICAgfVxuXG4gICAgdGhpcy5tZXNoQW5ub3RhdGlvbnMgPSBzb3VyY2UubWVzaEFubm90YXRpb25zLm1hcCgoYW5ub3RhdGlvbikgPT4gKHtcbiAgICAgIG1lc2hlczogYW5ub3RhdGlvbi5tZXNoZXMuY29uY2F0KCksXG4gICAgICB0eXBlOiBhbm5vdGF0aW9uLnR5cGUsXG4gICAgfSkpO1xuXG4gICAgcmV0dXJuIHRoaXM7XG4gIH1cblxuICAvKipcbiAgICogUmV0dXJucyBhIGNsb25lIG9mIHRoaXMge0BsaW5rIFZSTUZpcnN0UGVyc29ufS5cbiAgICogQHJldHVybnMgQ29waWVkIHtAbGluayBWUk1GaXJzdFBlcnNvbn1cbiAgICovXG4gIHB1YmxpYyBjbG9uZSgpOiBWUk1GaXJzdFBlcnNvbiB7XG4gICAgcmV0dXJuIG5ldyBWUk1GaXJzdFBlcnNvbih0aGlzLmh1bWFub2lkLCB0aGlzLm1lc2hBbm5vdGF0aW9ucykuY29weSh0aGlzKTtcbiAgfVxuXG4gIC8qKlxuICAgKiBBIGNhbWVyYSBsYXllciByZXByZXNlbnRzIGBGaXJzdFBlcnNvbk9ubHlgIGxheWVyLlxuICAgKiBOb3RlIHRoYXQgKip5b3UgbXVzdCBjYWxsIHtAbGluayBzZXR1cH0gZmlyc3QgYmVmb3JlIHlvdSB1c2UgdGhlIGxheWVyIGZlYXR1cmUqKiBvciBpdCBkb2VzIG5vdCB3b3JrIHByb3Blcmx5LlxuICAgKlxuICAgKiBUaGUgdmFsdWUgaXMge0BsaW5rIERFRkFVTFRfRklSU1RQRVJTT05fT05MWV9MQVlFUn0gYnkgZGVmYXVsdCBidXQgeW91IGNhbiBjaGFuZ2UgdGhlIGxheWVyIGJ5IHNwZWNpZnlpbmcgdmlhIHtAbGluayBzZXR1cH0gaWYgeW91IHByZWZlci5cbiAgICpcbiAgICogQHNlZSBodHRwczovL3ZybS5kZXYvZW4vdW5pdnJtL2FwaS91bml2cm1fdXNlX2ZpcnN0cGVyc29uL1xuICAgKiBAc2VlIGh0dHBzOi8vdGhyZWVqcy5vcmcvZG9jcy8jYXBpL2VuL2NvcmUvTGF5ZXJzXG4gICAqL1xuICBwdWJsaWMgZ2V0IGZpcnN0UGVyc29uT25seUxheWVyKCk6IG51bWJlciB7XG4gICAgcmV0dXJuIHRoaXMuX2ZpcnN0UGVyc29uT25seUxheWVyO1xuICB9XG5cbiAgLyoqXG4gICAqIEEgY2FtZXJhIGxheWVyIHJlcHJlc2VudHMgYFRoaXJkUGVyc29uT25seWAgbGF5ZXIuXG4gICAqIE5vdGUgdGhhdCAqKnlvdSBtdXN0IGNhbGwge0BsaW5rIHNldHVwfSBmaXJzdCBiZWZvcmUgeW91IHVzZSB0aGUgbGF5ZXIgZmVhdHVyZSoqIG9yIGl0IGRvZXMgbm90IHdvcmsgcHJvcGVybHkuXG4gICAqXG4gICAqIFRoZSB2YWx1ZSBpcyB7QGxpbmsgREVGQVVMVF9USElSRFBFUlNPTl9PTkxZX0xBWUVSfSBieSBkZWZhdWx0IGJ1dCB5b3UgY2FuIGNoYW5nZSB0aGUgbGF5ZXIgYnkgc3BlY2lmeWluZyB2aWEge0BsaW5rIHNldHVwfSBpZiB5b3UgcHJlZmVyLlxuICAgKlxuICAgKiBAc2VlIGh0dHBzOi8vdnJtLmRldi9lbi91bml2cm0vYXBpL3VuaXZybV91c2VfZmlyc3RwZXJzb24vXG4gICAqIEBzZWUgaHR0cHM6Ly90aHJlZWpzLm9yZy9kb2NzLyNhcGkvZW4vY29yZS9MYXllcnNcbiAgICovXG4gIHB1YmxpYyBnZXQgdGhpcmRQZXJzb25Pbmx5TGF5ZXIoKTogbnVtYmVyIHtcbiAgICByZXR1cm4gdGhpcy5fdGhpcmRQZXJzb25Pbmx5TGF5ZXI7XG4gIH1cblxuICAvKipcbiAgICogSW4gdGhpcyBtZXRob2QsIGl0IGFzc2lnbnMgbGF5ZXJzIGZvciBldmVyeSBtZXNoZXMgYmFzZWQgb24gbWVzaCBhbm5vdGF0aW9ucy5cbiAgICogWW91IG11c3QgY2FsbCB0aGlzIG1ldGhvZCBmaXJzdCBiZWZvcmUgeW91IHVzZSB0aGUgbGF5ZXIgZmVhdHVyZS5cbiAgICpcbiAgICogVGhpcyBpcyBhbiBlcXVpdmFsZW50IG9mIFtWUk1GaXJzdFBlcnNvbi5TZXR1cF0oaHR0cHM6Ly9naXRodWIuY29tL3ZybS1jL1VuaVZSTS9ibG9iLzczYTViZDhmY2RkYWEyYTdhODczNTA5OWE5N2U2M2M5ZGIzZTVlYTAvQXNzZXRzL1ZSTS9SdW50aW1lL0ZpcnN0UGVyc29uL1ZSTUZpcnN0UGVyc29uLmNzI0wyOTUtTDI5OSkgb2YgdGhlIFVuaVZSTS5cbiAgICpcbiAgICogVGhlIGBjYW1lcmFMYXllcmAgcGFyYW1ldGVyIHNwZWNpZmllcyB3aGljaCBsYXllciB3aWxsIGJlIGFzc2lnbmVkIGZvciBgRmlyc3RQZXJzb25Pbmx5YCAvIGBUaGlyZFBlcnNvbk9ubHlgLlxuICAgKiBJbiBVbmlWUk0sIHdlIHNwZWNpZmllZCB0aG9zZSBieSBuYW1pbmcgZWFjaCBkZXNpcmVkIGxheWVyIGFzIGBGSVJTVFBFUlNPTl9PTkxZX0xBWUVSYCAvIGBUSElSRFBFUlNPTl9PTkxZX0xBWUVSYFxuICAgKiBidXQgd2UgYXJlIGdvaW5nIHRvIHNwZWNpZnkgdGhlc2UgbGF5ZXJzIGF0IGhlcmUgc2luY2Ugd2UgYXJlIHVuYWJsZSB0byBuYW1lIGxheWVycyBpbiBUaHJlZS5qcy5cbiAgICpcbiAgICogQHBhcmFtIGNhbWVyYUxheWVyIFNwZWNpZnkgd2hpY2ggbGF5ZXIgd2lsbCBiZSBmb3IgYEZpcnN0UGVyc29uT25seWAgLyBgVGhpcmRQZXJzb25Pbmx5YC5cbiAgICovXG4gIHB1YmxpYyBzZXR1cCh7XG4gICAgZmlyc3RQZXJzb25Pbmx5TGF5ZXIgPSBWUk1GaXJzdFBlcnNvbi5ERUZBVUxUX0ZJUlNUUEVSU09OX09OTFlfTEFZRVIsXG4gICAgdGhpcmRQZXJzb25Pbmx5TGF5ZXIgPSBWUk1GaXJzdFBlcnNvbi5ERUZBVUxUX1RISVJEUEVSU09OX09OTFlfTEFZRVIsXG4gIH0gPSB7fSk6IHZvaWQge1xuICAgIGlmICh0aGlzLl9pbml0aWFsaXplZExheWVycykge1xuICAgICAgcmV0dXJuO1xuICAgIH1cbiAgICB0aGlzLl9maXJzdFBlcnNvbk9ubHlMYXllciA9IGZpcnN0UGVyc29uT25seUxheWVyO1xuICAgIHRoaXMuX3RoaXJkUGVyc29uT25seUxheWVyID0gdGhpcmRQZXJzb25Pbmx5TGF5ZXI7XG5cbiAgICB0aGlzLm1lc2hBbm5vdGF0aW9ucy5mb3JFYWNoKChpdGVtKSA9PiB7XG4gICAgICBpdGVtLm1lc2hlcy5mb3JFYWNoKChtZXNoKSA9PiB7XG4gICAgICAgIGlmIChpdGVtLnR5cGUgPT09ICdmaXJzdFBlcnNvbk9ubHknKSB7XG4gICAgICAgICAgbWVzaC5sYXllcnMuc2V0KHRoaXMuX2ZpcnN0UGVyc29uT25seUxheWVyKTtcbiAgICAgICAgICBtZXNoLnRyYXZlcnNlKChjaGlsZCkgPT4gY2hpbGQubGF5ZXJzLnNldCh0aGlzLl9maXJzdFBlcnNvbk9ubHlMYXllcikpO1xuICAgICAgICB9IGVsc2UgaWYgKGl0ZW0udHlwZSA9PT0gJ3RoaXJkUGVyc29uT25seScpIHtcbiAgICAgICAgICBtZXNoLmxheWVycy5zZXQodGhpcy5fdGhpcmRQZXJzb25Pbmx5TGF5ZXIpO1xuICAgICAgICAgIG1lc2gudHJhdmVyc2UoKGNoaWxkKSA9PiBjaGlsZC5sYXllcnMuc2V0KHRoaXMuX3RoaXJkUGVyc29uT25seUxheWVyKSk7XG4gICAgICAgIH0gZWxzZSBpZiAoaXRlbS50eXBlID09PSAnYXV0bycpIHtcbiAgICAgICAgICB0aGlzLl9jcmVhdGVIZWFkbGVzc01vZGVsKG1lc2gpO1xuICAgICAgICB9XG4gICAgICB9KTtcbiAgICB9KTtcblxuICAgIHRoaXMuX2luaXRpYWxpemVkTGF5ZXJzID0gdHJ1ZTtcbiAgfVxuXG4gIHByaXZhdGUgX2V4Y2x1ZGVUcmlhbmdsZXModHJpYW5nbGVzOiBudW1iZXJbXSwgYndzOiBudW1iZXJbXVtdLCBza2luSW5kZXg6IG51bWJlcltdW10sIGV4Y2x1ZGU6IG51bWJlcltdKTogbnVtYmVyIHtcbiAgICBsZXQgY291bnQgPSAwO1xuICAgIGlmIChid3MgIT0gbnVsbCAmJiBid3MubGVuZ3RoID4gMCkge1xuICAgICAgZm9yIChsZXQgaSA9IDA7IGkgPCB0cmlhbmdsZXMubGVuZ3RoOyBpICs9IDMpIHtcbiAgICAgICAgY29uc3QgYSA9IHRyaWFuZ2xlc1tpXTtcbiAgICAgICAgY29uc3QgYiA9IHRyaWFuZ2xlc1tpICsgMV07XG4gICAgICAgIGNvbnN0IGMgPSB0cmlhbmdsZXNbaSArIDJdO1xuICAgICAgICBjb25zdCBidzAgPSBid3NbYV07XG4gICAgICAgIGNvbnN0IHNraW4wID0gc2tpbkluZGV4W2FdO1xuXG4gICAgICAgIGlmIChidzBbMF0gPiAwICYmIGV4Y2x1ZGUuaW5jbHVkZXMoc2tpbjBbMF0pKSBjb250aW51ZTtcbiAgICAgICAgaWYgKGJ3MFsxXSA+IDAgJiYgZXhjbHVkZS5pbmNsdWRlcyhza2luMFsxXSkpIGNvbnRpbnVlO1xuICAgICAgICBpZiAoYncwWzJdID4gMCAmJiBleGNsdWRlLmluY2x1ZGVzKHNraW4wWzJdKSkgY29udGludWU7XG4gICAgICAgIGlmIChidzBbM10gPiAwICYmIGV4Y2x1ZGUuaW5jbHVkZXMoc2tpbjBbM10pKSBjb250aW51ZTtcblxuICAgICAgICBjb25zdCBidzEgPSBid3NbYl07XG4gICAgICAgIGNvbnN0IHNraW4xID0gc2tpbkluZGV4W2JdO1xuICAgICAgICBpZiAoYncxWzBdID4gMCAmJiBleGNsdWRlLmluY2x1ZGVzKHNraW4xWzBdKSkgY29udGludWU7XG4gICAgICAgIGlmIChidzFbMV0gPiAwICYmIGV4Y2x1ZGUuaW5jbHVkZXMoc2tpbjFbMV0pKSBjb250aW51ZTtcbiAgICAgICAgaWYgKGJ3MVsyXSA+IDAgJiYgZXhjbHVkZS5pbmNsdWRlcyhza2luMVsyXSkpIGNvbnRpbnVlO1xuICAgICAgICBpZiAoYncxWzNdID4gMCAmJiBleGNsdWRlLmluY2x1ZGVzKHNraW4xWzNdKSkgY29udGludWU7XG5cbiAgICAgICAgY29uc3QgYncyID0gYndzW2NdO1xuICAgICAgICBjb25zdCBza2luMiA9IHNraW5JbmRleFtjXTtcbiAgICAgICAgaWYgKGJ3MlswXSA+IDAgJiYgZXhjbHVkZS5pbmNsdWRlcyhza2luMlswXSkpIGNvbnRpbnVlO1xuICAgICAgICBpZiAoYncyWzFdID4gMCAmJiBleGNsdWRlLmluY2x1ZGVzKHNraW4yWzFdKSkgY29udGludWU7XG4gICAgICAgIGlmIChidzJbMl0gPiAwICYmIGV4Y2x1ZGUuaW5jbHVkZXMoc2tpbjJbMl0pKSBjb250aW51ZTtcbiAgICAgICAgaWYgKGJ3MlszXSA+IDAgJiYgZXhjbHVkZS5pbmNsdWRlcyhza2luMlszXSkpIGNvbnRpbnVlO1xuXG4gICAgICAgIHRyaWFuZ2xlc1tjb3VudCsrXSA9IGE7XG4gICAgICAgIHRyaWFuZ2xlc1tjb3VudCsrXSA9IGI7XG4gICAgICAgIHRyaWFuZ2xlc1tjb3VudCsrXSA9IGM7XG4gICAgICB9XG4gICAgfVxuICAgIHJldHVybiBjb3VudDtcbiAgfVxuXG4gIHByaXZhdGUgX2NyZWF0ZUVyYXNlZE1lc2goc3JjOiBUSFJFRS5Ta2lubmVkTWVzaCwgZXJhc2luZ0JvbmVzSW5kZXg6IG51bWJlcltdKTogVEhSRUUuU2tpbm5lZE1lc2gge1xuICAgIGNvbnN0IGRzdCA9IG5ldyBUSFJFRS5Ta2lubmVkTWVzaChzcmMuZ2VvbWV0cnkuY2xvbmUoKSwgc3JjLm1hdGVyaWFsKTtcbiAgICBkc3QubmFtZSA9IGAke3NyYy5uYW1lfShlcmFzZSlgO1xuICAgIGRzdC5mcnVzdHVtQ3VsbGVkID0gc3JjLmZydXN0dW1DdWxsZWQ7XG4gICAgZHN0LmxheWVycy5zZXQodGhpcy5fZmlyc3RQZXJzb25Pbmx5TGF5ZXIpO1xuXG4gICAgY29uc3QgZ2VvbWV0cnkgPSBkc3QuZ2VvbWV0cnk7XG5cbiAgICBjb25zdCBza2luSW5kZXhBdHRyID0gZ2VvbWV0cnkuZ2V0QXR0cmlidXRlKCdza2luSW5kZXgnKTtcbiAgICBjb25zdCBza2luSW5kZXhBdHRyQXJyYXkgPSBza2luSW5kZXhBdHRyIGluc3RhbmNlb2YgVEhSRUUuR0xCdWZmZXJBdHRyaWJ1dGUgPyBbXSA6IHNraW5JbmRleEF0dHIuYXJyYXk7XG4gICAgY29uc3Qgc2tpbkluZGV4ID0gW107XG4gICAgZm9yIChsZXQgaSA9IDA7IGkgPCBza2luSW5kZXhBdHRyQXJyYXkubGVuZ3RoOyBpICs9IDQpIHtcbiAgICAgIHNraW5JbmRleC5wdXNoKFtcbiAgICAgICAgc2tpbkluZGV4QXR0ckFycmF5W2ldLFxuICAgICAgICBza2luSW5kZXhBdHRyQXJyYXlbaSArIDFdLFxuICAgICAgICBza2luSW5kZXhBdHRyQXJyYXlbaSArIDJdLFxuICAgICAgICBza2luSW5kZXhBdHRyQXJyYXlbaSArIDNdLFxuICAgICAgXSk7XG4gICAgfVxuXG4gICAgY29uc3Qgc2tpbldlaWdodEF0dHIgPSBnZW9tZXRyeS5nZXRBdHRyaWJ1dGUoJ3NraW5XZWlnaHQnKTtcbiAgICBjb25zdCBza2luV2VpZ2h0QXR0ckFycmF5ID0gc2tpbldlaWdodEF0dHIgaW5zdGFuY2VvZiBUSFJFRS5HTEJ1ZmZlckF0dHJpYnV0ZSA/IFtdIDogc2tpbldlaWdodEF0dHIuYXJyYXk7XG4gICAgY29uc3Qgc2tpbldlaWdodCA9IFtdO1xuICAgIGZvciAobGV0IGkgPSAwOyBpIDwgc2tpbldlaWdodEF0dHJBcnJheS5sZW5ndGg7IGkgKz0gNCkge1xuICAgICAgc2tpbldlaWdodC5wdXNoKFtcbiAgICAgICAgc2tpbldlaWdodEF0dHJBcnJheVtpXSxcbiAgICAgICAgc2tpbldlaWdodEF0dHJBcnJheVtpICsgMV0sXG4gICAgICAgIHNraW5XZWlnaHRBdHRyQXJyYXlbaSArIDJdLFxuICAgICAgICBza2luV2VpZ2h0QXR0ckFycmF5W2kgKyAzXSxcbiAgICAgIF0pO1xuICAgIH1cblxuICAgIGNvbnN0IGluZGV4ID0gZ2VvbWV0cnkuZ2V0SW5kZXgoKTtcbiAgICBpZiAoIWluZGV4KSB7XG4gICAgICB0aHJvdyBuZXcgRXJyb3IoXCJUaGUgZ2VvbWV0cnkgZG9lc24ndCBoYXZlIGFuIGluZGV4IGJ1ZmZlclwiKTtcbiAgICB9XG4gICAgY29uc3Qgb2xkVHJpYW5nbGVzID0gQXJyYXkuZnJvbShpbmRleC5hcnJheSk7XG5cbiAgICBjb25zdCBjb3VudCA9IHRoaXMuX2V4Y2x1ZGVUcmlhbmdsZXMob2xkVHJpYW5nbGVzLCBza2luV2VpZ2h0LCBza2luSW5kZXgsIGVyYXNpbmdCb25lc0luZGV4KTtcbiAgICBjb25zdCBuZXdUcmlhbmdsZTogbnVtYmVyW10gPSBbXTtcbiAgICBmb3IgKGxldCBpID0gMDsgaSA8IGNvdW50OyBpKyspIHtcbiAgICAgIG5ld1RyaWFuZ2xlW2ldID0gb2xkVHJpYW5nbGVzW2ldO1xuICAgIH1cbiAgICBnZW9tZXRyeS5zZXRJbmRleChuZXdUcmlhbmdsZSk7XG5cbiAgICAvLyBtdG9vbiBtYXRlcmlhbCBpbmNsdWRlcyBvbkJlZm9yZVJlbmRlci4gdGhpcyBpcyB1bnN1cHBvcnRlZCBhdCBTa2lubmVkTWVzaCNjbG9uZVxuICAgIGlmIChzcmMub25CZWZvcmVSZW5kZXIpIHtcbiAgICAgIGRzdC5vbkJlZm9yZVJlbmRlciA9IHNyYy5vbkJlZm9yZVJlbmRlcjtcbiAgICB9XG4gICAgZHN0LmJpbmQobmV3IFRIUkVFLlNrZWxldG9uKHNyYy5za2VsZXRvbi5ib25lcywgc3JjLnNrZWxldG9uLmJvbmVJbnZlcnNlcyksIG5ldyBUSFJFRS5NYXRyaXg0KCkpO1xuICAgIHJldHVybiBkc3Q7XG4gIH1cblxuICBwcml2YXRlIF9jcmVhdGVIZWFkbGVzc01vZGVsRm9yU2tpbm5lZE1lc2gocGFyZW50OiBUSFJFRS5PYmplY3QzRCwgbWVzaDogVEhSRUUuU2tpbm5lZE1lc2gpOiB2b2lkIHtcbiAgICBjb25zdCBlcmFzZUJvbmVJbmRleGVzOiBudW1iZXJbXSA9IFtdO1xuICAgIG1lc2guc2tlbGV0b24uYm9uZXMuZm9yRWFjaCgoYm9uZSwgaW5kZXgpID0+IHtcbiAgICAgIGlmICh0aGlzLl9pc0VyYXNlVGFyZ2V0KGJvbmUpKSBlcmFzZUJvbmVJbmRleGVzLnB1c2goaW5kZXgpO1xuICAgIH0pO1xuXG4gICAgLy8gVW5saWtlIFVuaVZSTSB3ZSBkb24ndCBjb3B5IG1lc2ggaWYgbm8gaW52aXNpYmxlIGJvbmUgd2FzIGZvdW5kXG4gICAgaWYgKCFlcmFzZUJvbmVJbmRleGVzLmxlbmd0aCkge1xuICAgICAgbWVzaC5sYXllcnMuZW5hYmxlKHRoaXMuX3RoaXJkUGVyc29uT25seUxheWVyKTtcbiAgICAgIG1lc2gubGF5ZXJzLmVuYWJsZSh0aGlzLl9maXJzdFBlcnNvbk9ubHlMYXllcik7XG4gICAgICByZXR1cm47XG4gICAgfVxuICAgIG1lc2gubGF5ZXJzLnNldCh0aGlzLl90aGlyZFBlcnNvbk9ubHlMYXllcik7XG4gICAgY29uc3QgbmV3TWVzaCA9IHRoaXMuX2NyZWF0ZUVyYXNlZE1lc2gobWVzaCwgZXJhc2VCb25lSW5kZXhlcyk7XG4gICAgcGFyZW50LmFkZChuZXdNZXNoKTtcbiAgfVxuXG4gIHByaXZhdGUgX2NyZWF0ZUhlYWRsZXNzTW9kZWwobm9kZTogVEhSRUUuT2JqZWN0M0QpOiB2b2lkIHtcbiAgICBpZiAobm9kZS50eXBlID09PSAnR3JvdXAnKSB7XG4gICAgICBub2RlLmxheWVycy5zZXQodGhpcy5fdGhpcmRQZXJzb25Pbmx5TGF5ZXIpO1xuICAgICAgaWYgKHRoaXMuX2lzRXJhc2VUYXJnZXQobm9kZSkpIHtcbiAgICAgICAgbm9kZS50cmF2ZXJzZSgoY2hpbGQpID0+IGNoaWxkLmxheWVycy5zZXQodGhpcy5fdGhpcmRQZXJzb25Pbmx5TGF5ZXIpKTtcbiAgICAgIH0gZWxzZSB7XG4gICAgICAgIGNvbnN0IHBhcmVudCA9IG5ldyBUSFJFRS5Hcm91cCgpO1xuICAgICAgICBwYXJlbnQubmFtZSA9IGBfaGVhZGxlc3NfJHtub2RlLm5hbWV9YDtcbiAgICAgICAgcGFyZW50LmxheWVycy5zZXQodGhpcy5fZmlyc3RQZXJzb25Pbmx5TGF5ZXIpO1xuICAgICAgICBub2RlLnBhcmVudCEuYWRkKHBhcmVudCk7XG4gICAgICAgIG5vZGUuY2hpbGRyZW5cbiAgICAgICAgICAuZmlsdGVyKChjaGlsZCkgPT4gY2hpbGQudHlwZSA9PT0gJ1NraW5uZWRNZXNoJylcbiAgICAgICAgICAuZm9yRWFjaCgoY2hpbGQpID0+IHtcbiAgICAgICAgICAgIGNvbnN0IHNraW5uZWRNZXNoID0gY2hpbGQgYXMgVEhSRUUuU2tpbm5lZE1lc2g7XG4gICAgICAgICAgICB0aGlzLl9jcmVhdGVIZWFkbGVzc01vZGVsRm9yU2tpbm5lZE1lc2gocGFyZW50LCBza2lubmVkTWVzaCk7XG4gICAgICAgICAgfSk7XG4gICAgICB9XG4gICAgfSBlbHNlIGlmIChub2RlLnR5cGUgPT09ICdTa2lubmVkTWVzaCcpIHtcbiAgICAgIGNvbnN0IHNraW5uZWRNZXNoID0gbm9kZSBhcyBUSFJFRS5Ta2lubmVkTWVzaDtcbiAgICAgIHRoaXMuX2NyZWF0ZUhlYWRsZXNzTW9kZWxGb3JTa2lubmVkTWVzaChub2RlLnBhcmVudCEsIHNraW5uZWRNZXNoKTtcbiAgICB9IGVsc2Uge1xuICAgICAgaWYgKHRoaXMuX2lzRXJhc2VUYXJnZXQobm9kZSkpIHtcbiAgICAgICAgbm9kZS5sYXllcnMuc2V0KHRoaXMuX3RoaXJkUGVyc29uT25seUxheWVyKTtcbiAgICAgICAgbm9kZS50cmF2ZXJzZSgoY2hpbGQpID0+IGNoaWxkLmxheWVycy5zZXQodGhpcy5fdGhpcmRQZXJzb25Pbmx5TGF5ZXIpKTtcbiAgICAgIH1cbiAgICB9XG4gIH1cblxuICBwcml2YXRlIF9pc0VyYXNlVGFyZ2V0KGJvbmU6IFRIUkVFLk9iamVjdDNEKTogYm9vbGVhbiB7XG4gICAgaWYgKGJvbmUgPT09IHRoaXMuaHVtYW5vaWQuZ2V0UmF3Qm9uZU5vZGUoJ2hlYWQnKSkge1xuICAgICAgcmV0dXJuIHRydWU7XG4gICAgfSBlbHNlIGlmICghYm9uZS5wYXJlbnQpIHtcbiAgICAgIHJldHVybiBmYWxzZTtcbiAgICB9IGVsc2Uge1xuICAgICAgcmV0dXJuIHRoaXMuX2lzRXJhc2VUYXJnZXQoYm9uZS5wYXJlbnQpO1xuICAgIH1cbiAgfVxufVxuIiwgImltcG9ydCB0eXBlICogYXMgVjBWUk0gZnJvbSAnQHBpeGl2L3R5cGVzLXZybS0wLjAnO1xuaW1wb3J0IHR5cGUgKiBhcyBWMVZSTVNjaGVtYSBmcm9tICdAcGl4aXYvdHlwZXMtdnJtYy12cm0tMS4wJztcbmltcG9ydCB0eXBlIHsgR0xURiwgR0xURkxvYWRlclBsdWdpbiwgR0xURlBhcnNlciB9IGZyb20gJ3RocmVlL2V4YW1wbGVzL2pzbS9sb2FkZXJzL0dMVEZMb2FkZXIuanMnO1xuaW1wb3J0IHR5cGUgeyBWUk1IdW1hbm9pZCB9IGZyb20gJy4uL2h1bWFub2lkL1ZSTUh1bWFub2lkJztcbmltcG9ydCB7IGdsdGZFeHRyYWN0UHJpbWl0aXZlc0Zyb21Ob2RlcyB9IGZyb20gJy4uL3V0aWxzL2dsdGZFeHRyYWN0UHJpbWl0aXZlc0Zyb21Ob2RlJztcbmltcG9ydCB7IFZSTUZpcnN0UGVyc29uIH0gZnJvbSAnLi9WUk1GaXJzdFBlcnNvbic7XG5pbXBvcnQgdHlwZSB7IFZSTUZpcnN0UGVyc29uTWVzaEFubm90YXRpb24gfSBmcm9tICcuL1ZSTUZpcnN0UGVyc29uTWVzaEFubm90YXRpb24nO1xuaW1wb3J0IHR5cGUgeyBWUk1GaXJzdFBlcnNvbk1lc2hBbm5vdGF0aW9uVHlwZSB9IGZyb20gJy4vVlJNRmlyc3RQZXJzb25NZXNoQW5ub3RhdGlvblR5cGUnO1xuaW1wb3J0IHsgR0xURiBhcyBHTFRGU2NoZW1hIH0gZnJvbSAnQGdsdGYtdHJhbnNmb3JtL2NvcmUnO1xuXG4vKipcbiAqIFBvc3NpYmxlIHNwZWMgdmVyc2lvbnMgaXQgcmVjb2duaXplcy5cbiAqL1xuY29uc3QgUE9TU0lCTEVfU1BFQ19WRVJTSU9OUyA9IG5ldyBTZXQoWycxLjAnLCAnMS4wLWJldGEnXSk7XG5cbi8qKlxuICogQSBwbHVnaW4gb2YgR0xURkxvYWRlciB0aGF0IGltcG9ydHMgYSB7QGxpbmsgVlJNRmlyc3RQZXJzb259IGZyb20gYSBWUk0gZXh0ZW5zaW9uIG9mIGEgR0xURi5cbiAqL1xuZXhwb3J0IGNsYXNzIFZSTUZpcnN0UGVyc29uTG9hZGVyUGx1Z2luIGltcGxlbWVudHMgR0xURkxvYWRlclBsdWdpbiB7XG4gIHB1YmxpYyByZWFkb25seSBwYXJzZXI6IEdMVEZQYXJzZXI7XG5cbiAgcHVibGljIGdldCBuYW1lKCk6IHN0cmluZyB7XG4gICAgLy8gV2Ugc2hvdWxkIHVzZSB0aGUgZXh0ZW5zaW9uIG5hbWUgaW5zdGVhZCBidXQgd2UgaGF2ZSBtdWx0aXBsZSBwbHVnaW5zIGZvciBhbiBleHRlbnNpb24uLi5cbiAgICByZXR1cm4gJ1ZSTUZpcnN0UGVyc29uTG9hZGVyUGx1Z2luJztcbiAgfVxuXG4gIHB1YmxpYyBjb25zdHJ1Y3RvcihwYXJzZXI6IEdMVEZQYXJzZXIpIHtcbiAgICB0aGlzLnBhcnNlciA9IHBhcnNlcjtcbiAgfVxuXG4gIHB1YmxpYyBhc3luYyBhZnRlclJvb3QoZ2x0ZjogR0xURik6IFByb21pc2U8dm9pZD4ge1xuICAgIGNvbnN0IHZybUh1bWFub2lkID0gZ2x0Zi51c2VyRGF0YS52cm1IdW1hbm9pZCBhcyBWUk1IdW1hbm9pZCB8IHVuZGVmaW5lZDtcblxuICAgIC8vIGV4cGxpY2l0bHkgZGlzdGluZ3Vpc2ggbnVsbCBhbmQgdW5kZWZpbmVkXG4gICAgLy8gc2luY2UgdnJtSHVtYW5vaWQgbWlnaHQgYmUgbnVsbCBhcyBhIHJlc3VsdFxuICAgIGlmICh2cm1IdW1hbm9pZCA9PT0gbnVsbCkge1xuICAgICAgcmV0dXJuO1xuICAgIH0gZWxzZSBpZiAodnJtSHVtYW5vaWQgPT09IHVuZGVmaW5lZCkge1xuICAgICAgdGhyb3cgbmV3IEVycm9yKFxuICAgICAgICAnVlJNRmlyc3RQZXJzb25Mb2FkZXJQbHVnaW46IHZybUh1bWFub2lkIGlzIHVuZGVmaW5lZC4gVlJNSHVtYW5vaWRMb2FkZXJQbHVnaW4gaGF2ZSB0byBiZSB1c2VkIGZpcnN0JyxcbiAgICAgICk7XG4gICAgfVxuXG4gICAgZ2x0Zi51c2VyRGF0YS52cm1GaXJzdFBlcnNvbiA9IGF3YWl0IHRoaXMuX2ltcG9ydChnbHRmLCB2cm1IdW1hbm9pZCk7XG4gIH1cblxuICAvKipcbiAgICogSW1wb3J0IGEge0BsaW5rIFZSTUZpcnN0UGVyc29ufSBmcm9tIGEgVlJNLlxuICAgKlxuICAgKiBAcGFyYW0gZ2x0ZiBBIHBhcnNlZCByZXN1bHQgb2YgR0xURiB0YWtlbiBmcm9tIEdMVEZMb2FkZXJcbiAgICogQHBhcmFtIGh1bWFub2lkIEEge0BsaW5rIFZSTUh1bWFub2lkfSBpbnN0YW5jZSB0aGF0IHJlcHJlc2VudHMgdGhlIFZSTVxuICAgKi9cblxuICBwcml2YXRlIGFzeW5jIF9pbXBvcnQoZ2x0ZjogR0xURiwgaHVtYW5vaWQ6IFZSTUh1bWFub2lkIHwgbnVsbCk6IFByb21pc2U8VlJNRmlyc3RQZXJzb24gfCBudWxsPiB7XG4gICAgaWYgKGh1bWFub2lkID09IG51bGwpIHtcbiAgICAgIHJldHVybiBudWxsO1xuICAgIH1cblxuICAgIGNvbnN0IHYxUmVzdWx0ID0gYXdhaXQgdGhpcy5fdjFJbXBvcnQoZ2x0ZiwgaHVtYW5vaWQpO1xuICAgIGlmICh2MVJlc3VsdCkge1xuICAgICAgcmV0dXJuIHYxUmVzdWx0O1xuICAgIH1cblxuICAgIGNvbnN0IHYwUmVzdWx0ID0gYXdhaXQgdGhpcy5fdjBJbXBvcnQoZ2x0ZiwgaHVtYW5vaWQpO1xuICAgIGlmICh2MFJlc3VsdCkge1xuICAgICAgcmV0dXJuIHYwUmVzdWx0O1xuICAgIH1cblxuICAgIHJldHVybiBudWxsO1xuICB9XG5cbiAgcHJpdmF0ZSBhc3luYyBfdjFJbXBvcnQoZ2x0ZjogR0xURiwgaHVtYW5vaWQ6IFZSTUh1bWFub2lkKTogUHJvbWlzZTxWUk1GaXJzdFBlcnNvbiB8IG51bGw+IHtcbiAgICBjb25zdCBqc29uID0gdGhpcy5wYXJzZXIuanNvbiBhcyBHTFRGU2NoZW1hLklHTFRGO1xuXG4gICAgLy8gZWFybHkgYWJvcnQgaWYgaXQgZG9lc24ndCB1c2UgdnJtXG4gICAgY29uc3QgaXNWUk1Vc2VkID0ganNvbi5leHRlbnNpb25zVXNlZD8uaW5kZXhPZignVlJNQ192cm0nKSAhPT0gLTE7XG4gICAgaWYgKCFpc1ZSTVVzZWQpIHtcbiAgICAgIHJldHVybiBudWxsO1xuICAgIH1cblxuICAgIGNvbnN0IGV4dGVuc2lvbiA9IGpzb24uZXh0ZW5zaW9ucz8uWydWUk1DX3ZybSddIGFzIFYxVlJNU2NoZW1hLlZSTUNWUk0gfCB1bmRlZmluZWQ7XG4gICAgaWYgKCFleHRlbnNpb24pIHtcbiAgICAgIHJldHVybiBudWxsO1xuICAgIH1cblxuICAgIGNvbnN0IHNwZWNWZXJzaW9uID0gZXh0ZW5zaW9uLnNwZWNWZXJzaW9uO1xuICAgIGlmICghUE9TU0lCTEVfU1BFQ19WRVJTSU9OUy5oYXMoc3BlY1ZlcnNpb24pKSB7XG4gICAgICBjb25zb2xlLndhcm4oYFZSTUZpcnN0UGVyc29uTG9hZGVyUGx1Z2luOiBVbmtub3duIFZSTUNfdnJtIHNwZWNWZXJzaW9uIFwiJHtzcGVjVmVyc2lvbn1cImApO1xuICAgICAgcmV0dXJuIG51bGw7XG4gICAgfVxuXG4gICAgY29uc3Qgc2NoZW1hRmlyc3RQZXJzb24gPSBleHRlbnNpb24uZmlyc3RQZXJzb247XG4gICAgaWYgKCFzY2hlbWFGaXJzdFBlcnNvbikge1xuICAgICAgcmV0dXJuIG51bGw7XG4gICAgfVxuXG4gICAgY29uc3QgbWVzaEFubm90YXRpb25zOiBWUk1GaXJzdFBlcnNvbk1lc2hBbm5vdGF0aW9uW10gPSBbXTtcbiAgICBjb25zdCBub2RlUHJpbWl0aXZlc01hcCA9IGF3YWl0IGdsdGZFeHRyYWN0UHJpbWl0aXZlc0Zyb21Ob2RlcyhnbHRmKTtcbiAgICBBcnJheS5mcm9tKG5vZGVQcmltaXRpdmVzTWFwLmVudHJpZXMoKSkuZm9yRWFjaCgoW25vZGVJbmRleCwgcHJpbWl0aXZlc10pID0+IHtcbiAgICAgIGNvbnN0IGFubm90YXRpb24gPSBzY2hlbWFGaXJzdFBlcnNvbi5tZXNoQW5ub3RhdGlvbnNcbiAgICAgICAgPyBzY2hlbWFGaXJzdFBlcnNvbi5tZXNoQW5ub3RhdGlvbnMuZmluZCgoYSkgPT4gYS5ub2RlID09PSBub2RlSW5kZXgpXG4gICAgICAgIDogdW5kZWZpbmVkO1xuXG4gICAgICBtZXNoQW5ub3RhdGlvbnMucHVzaCh7XG4gICAgICAgIG1lc2hlczogcHJpbWl0aXZlcyxcbiAgICAgICAgdHlwZTogYW5ub3RhdGlvbj8udHlwZSA/PyAnYm90aCcsXG4gICAgICB9KTtcbiAgICB9KTtcblxuICAgIHJldHVybiBuZXcgVlJNRmlyc3RQZXJzb24oaHVtYW5vaWQsIG1lc2hBbm5vdGF0aW9ucyk7XG4gIH1cblxuICBwcml2YXRlIGFzeW5jIF92MEltcG9ydChnbHRmOiBHTFRGLCBodW1hbm9pZDogVlJNSHVtYW5vaWQpOiBQcm9taXNlPFZSTUZpcnN0UGVyc29uIHwgbnVsbD4ge1xuICAgIGNvbnN0IGpzb24gPSB0aGlzLnBhcnNlci5qc29uIGFzIEdMVEZTY2hlbWEuSUdMVEY7XG5cbiAgICBjb25zdCB2cm1FeHQgPSBqc29uLmV4dGVuc2lvbnM/LlZSTSBhcyBWMFZSTS5WUk0gfCB1bmRlZmluZWQ7XG4gICAgaWYgKCF2cm1FeHQpIHtcbiAgICAgIHJldHVybiBudWxsO1xuICAgIH1cblxuICAgIGNvbnN0IHNjaGVtYUZpcnN0UGVyc29uOiBWMFZSTS5GaXJzdFBlcnNvbiB8IHVuZGVmaW5lZCA9IHZybUV4dC5maXJzdFBlcnNvbjtcbiAgICBpZiAoIXNjaGVtYUZpcnN0UGVyc29uKSB7XG4gICAgICByZXR1cm4gbnVsbDtcbiAgICB9XG5cbiAgICBjb25zdCBtZXNoQW5ub3RhdGlvbnM6IFZSTUZpcnN0UGVyc29uTWVzaEFubm90YXRpb25bXSA9IFtdO1xuICAgIGNvbnN0IG5vZGVQcmltaXRpdmVzTWFwID0gYXdhaXQgZ2x0ZkV4dHJhY3RQcmltaXRpdmVzRnJvbU5vZGVzKGdsdGYpO1xuXG4gICAgQXJyYXkuZnJvbShub2RlUHJpbWl0aXZlc01hcC5lbnRyaWVzKCkpLmZvckVhY2goKFtub2RlSW5kZXgsIHByaW1pdGl2ZXNdKSA9PiB7XG4gICAgICBjb25zdCBzY2hlbWFOb2RlID0ganNvbi5ub2RlcyFbbm9kZUluZGV4XTtcblxuICAgICAgY29uc3QgZmxhZyA9IHNjaGVtYUZpcnN0UGVyc29uLm1lc2hBbm5vdGF0aW9uc1xuICAgICAgICA/IHNjaGVtYUZpcnN0UGVyc29uLm1lc2hBbm5vdGF0aW9ucy5maW5kKChhKSA9PiBhLm1lc2ggPT09IHNjaGVtYU5vZGUubWVzaClcbiAgICAgICAgOiB1bmRlZmluZWQ7XG5cbiAgICAgIG1lc2hBbm5vdGF0aW9ucy5wdXNoKHtcbiAgICAgICAgbWVzaGVzOiBwcmltaXRpdmVzLFxuICAgICAgICB0eXBlOiB0aGlzLl9jb252ZXJ0VjBGbGFnVG9WMVR5cGUoZmxhZz8uZmlyc3RQZXJzb25GbGFnKSxcbiAgICAgIH0pO1xuICAgIH0pO1xuXG4gICAgcmV0dXJuIG5ldyBWUk1GaXJzdFBlcnNvbihodW1hbm9pZCwgbWVzaEFubm90YXRpb25zKTtcbiAgfVxuXG4gIHByaXZhdGUgX2NvbnZlcnRWMEZsYWdUb1YxVHlwZShmbGFnOiBzdHJpbmcgfCB1bmRlZmluZWQpOiBWUk1GaXJzdFBlcnNvbk1lc2hBbm5vdGF0aW9uVHlwZSB7XG4gICAgaWYgKGZsYWcgPT09ICdGaXJzdFBlcnNvbk9ubHknKSB7XG4gICAgICByZXR1cm4gJ2ZpcnN0UGVyc29uT25seSc7XG4gICAgfSBlbHNlIGlmIChmbGFnID09PSAnVGhpcmRQZXJzb25Pbmx5Jykge1xuICAgICAgcmV0dXJuICd0aGlyZFBlcnNvbk9ubHknO1xuICAgIH0gZWxzZSBpZiAoZmxhZyA9PT0gJ0F1dG8nKSB7XG4gICAgICByZXR1cm4gJ2F1dG8nO1xuICAgIH0gZWxzZSB7XG4gICAgICByZXR1cm4gJ2JvdGgnO1xuICAgIH1cbiAgfVxufVxuIiwgIi8qIGVzbGludC1kaXNhYmxlIEB0eXBlc2NyaXB0LWVzbGludC9uYW1pbmctY29udmVudGlvbiAqL1xuXG5leHBvcnQgY29uc3QgVlJNRmlyc3RQZXJzb25NZXNoQW5ub3RhdGlvblR5cGUgPSB7XG4gIEF1dG86ICdhdXRvJyxcbiAgQm90aDogJ2JvdGgnLFxuICBUaGlyZFBlcnNvbk9ubHk6ICd0aGlyZFBlcnNvbk9ubHknLFxuICBGaXJzdFBlcnNvbk9ubHk6ICdmaXJzdFBlcnNvbk9ubHknLFxufSBhcyBjb25zdDtcblxuZXhwb3J0IHR5cGUgVlJNRmlyc3RQZXJzb25NZXNoQW5ub3RhdGlvblR5cGUgPVxuICAodHlwZW9mIFZSTUZpcnN0UGVyc29uTWVzaEFubm90YXRpb25UeXBlKVtrZXlvZiB0eXBlb2YgVlJNRmlyc3RQZXJzb25NZXNoQW5ub3RhdGlvblR5cGVdO1xuIiwgImltcG9ydCAqIGFzIFRIUkVFIGZyb20gJ3RocmVlJztcbmltcG9ydCB7IFZSTUh1bWFuQm9uZSB9IGZyb20gJy4uL1ZSTUh1bWFuQm9uZSc7XG5pbXBvcnQgeyBWUk1IdW1hbm9pZCB9IGZyb20gJy4uL1ZSTUh1bWFub2lkJztcblxuY29uc3QgX3YzQSA9IG5ldyBUSFJFRS5WZWN0b3IzKCk7XG5jb25zdCBfdjNCID0gbmV3IFRIUkVFLlZlY3RvcjMoKTtcbmNvbnN0IF9xdWF0QSA9IG5ldyBUSFJFRS5RdWF0ZXJuaW9uKCk7XG5cbmV4cG9ydCBjbGFzcyBWUk1IdW1hbm9pZEhlbHBlciBleHRlbmRzIFRIUkVFLkdyb3VwIHtcbiAgcHVibGljIHJlYWRvbmx5IHZybUh1bWFub2lkOiBWUk1IdW1hbm9pZDtcbiAgcHJpdmF0ZSBfYm9uZUF4ZXNNYXA6IE1hcDxWUk1IdW1hbkJvbmUsIFRIUkVFLkF4ZXNIZWxwZXI+O1xuXG4gIHB1YmxpYyBjb25zdHJ1Y3RvcihodW1hbm9pZDogVlJNSHVtYW5vaWQpIHtcbiAgICBzdXBlcigpO1xuXG4gICAgdGhpcy52cm1IdW1hbm9pZCA9IGh1bWFub2lkO1xuXG4gICAgdGhpcy5fYm9uZUF4ZXNNYXAgPSBuZXcgTWFwKCk7XG5cbiAgICBPYmplY3QudmFsdWVzKGh1bWFub2lkLmh1bWFuQm9uZXMpLmZvckVhY2goKGJvbmUpID0+IHtcbiAgICAgIGNvbnN0IGhlbHBlciA9IG5ldyBUSFJFRS5BeGVzSGVscGVyKDEuMCk7XG5cbiAgICAgIGhlbHBlci5tYXRyaXhBdXRvVXBkYXRlID0gZmFsc2U7XG5cbiAgICAgIChoZWxwZXIubWF0ZXJpYWwgYXMgVEhSRUUuTWF0ZXJpYWwpLmRlcHRoVGVzdCA9IGZhbHNlO1xuICAgICAgKGhlbHBlci5tYXRlcmlhbCBhcyBUSFJFRS5NYXRlcmlhbCkuZGVwdGhXcml0ZSA9IGZhbHNlO1xuXG4gICAgICB0aGlzLmFkZChoZWxwZXIpO1xuXG4gICAgICB0aGlzLl9ib25lQXhlc01hcC5zZXQoYm9uZSwgaGVscGVyKTtcbiAgICB9KTtcbiAgfVxuXG4gIHB1YmxpYyBkaXNwb3NlKCk6IHZvaWQge1xuICAgIEFycmF5LmZyb20odGhpcy5fYm9uZUF4ZXNNYXAudmFsdWVzKCkpLmZvckVhY2goKGF4ZXMpID0+IHtcbiAgICAgIGF4ZXMuZ2VvbWV0cnkuZGlzcG9zZSgpO1xuICAgICAgKGF4ZXMubWF0ZXJpYWwgYXMgVEhSRUUuTWF0ZXJpYWwpLmRpc3Bvc2UoKTtcbiAgICB9KTtcbiAgfVxuXG4gIHB1YmxpYyB1cGRhdGVNYXRyaXhXb3JsZChmb3JjZTogYm9vbGVhbik6IHZvaWQge1xuICAgIEFycmF5LmZyb20odGhpcy5fYm9uZUF4ZXNNYXAuZW50cmllcygpKS5mb3JFYWNoKChbYm9uZSwgYXhlc10pID0+IHtcbiAgICAgIGJvbmUubm9kZS51cGRhdGVXb3JsZE1hdHJpeCh0cnVlLCBmYWxzZSk7XG5cbiAgICAgIGJvbmUubm9kZS5tYXRyaXhXb3JsZC5kZWNvbXBvc2UoX3YzQSwgX3F1YXRBLCBfdjNCKTtcblxuICAgICAgY29uc3Qgc2NhbGUgPSBfdjNBLnNldCgwLjEsIDAuMSwgMC4xKS5kaXZpZGUoX3YzQik7XG4gICAgICBheGVzLm1hdHJpeC5jb3B5KGJvbmUubm9kZS5tYXRyaXhXb3JsZCkuc2NhbGUoc2NhbGUpO1xuICAgIH0pO1xuXG4gICAgc3VwZXIudXBkYXRlTWF0cml4V29ybGQoZm9yY2UpO1xuICB9XG59XG4iLCAiLyogZXNsaW50LWRpc2FibGUgQHR5cGVzY3JpcHQtZXNsaW50L25hbWluZy1jb252ZW50aW9uICovXG5cbmltcG9ydCB7IFZSTUh1bWFuQm9uZU5hbWUgfSBmcm9tICcuL1ZSTUh1bWFuQm9uZU5hbWUnO1xuXG4vKipcbiAqIFRoZSBsaXN0IG9mIHtAbGluayBWUk1IdW1hbkJvbmVOYW1lfS4gRGVwZW5kZW5jeSBhd2FyZS5cbiAqL1xuZXhwb3J0IGNvbnN0IFZSTUh1bWFuQm9uZUxpc3Q6IFZSTUh1bWFuQm9uZU5hbWVbXSA9IFtcbiAgJ2hpcHMnLFxuICAnc3BpbmUnLFxuICAnY2hlc3QnLFxuICAndXBwZXJDaGVzdCcsXG4gICduZWNrJyxcblxuICAnaGVhZCcsXG4gICdsZWZ0RXllJyxcbiAgJ3JpZ2h0RXllJyxcbiAgJ2phdycsXG5cbiAgJ2xlZnRVcHBlckxlZycsXG4gICdsZWZ0TG93ZXJMZWcnLFxuICAnbGVmdEZvb3QnLFxuICAnbGVmdFRvZXMnLFxuXG4gICdyaWdodFVwcGVyTGVnJyxcbiAgJ3JpZ2h0TG93ZXJMZWcnLFxuICAncmlnaHRGb290JyxcbiAgJ3JpZ2h0VG9lcycsXG5cbiAgJ2xlZnRTaG91bGRlcicsXG4gICdsZWZ0VXBwZXJBcm0nLFxuICAnbGVmdExvd2VyQXJtJyxcbiAgJ2xlZnRIYW5kJyxcblxuICAncmlnaHRTaG91bGRlcicsXG4gICdyaWdodFVwcGVyQXJtJyxcbiAgJ3JpZ2h0TG93ZXJBcm0nLFxuICAncmlnaHRIYW5kJyxcblxuICAnbGVmdFRodW1iTWV0YWNhcnBhbCcsXG4gICdsZWZ0VGh1bWJQcm94aW1hbCcsXG4gICdsZWZ0VGh1bWJEaXN0YWwnLFxuICAnbGVmdEluZGV4UHJveGltYWwnLFxuICAnbGVmdEluZGV4SW50ZXJtZWRpYXRlJyxcbiAgJ2xlZnRJbmRleERpc3RhbCcsXG4gICdsZWZ0TWlkZGxlUHJveGltYWwnLFxuICAnbGVmdE1pZGRsZUludGVybWVkaWF0ZScsXG4gICdsZWZ0TWlkZGxlRGlzdGFsJyxcbiAgJ2xlZnRSaW5nUHJveGltYWwnLFxuICAnbGVmdFJpbmdJbnRlcm1lZGlhdGUnLFxuICAnbGVmdFJpbmdEaXN0YWwnLFxuICAnbGVmdExpdHRsZVByb3hpbWFsJyxcbiAgJ2xlZnRMaXR0bGVJbnRlcm1lZGlhdGUnLFxuICAnbGVmdExpdHRsZURpc3RhbCcsXG5cbiAgJ3JpZ2h0VGh1bWJNZXRhY2FycGFsJyxcbiAgJ3JpZ2h0VGh1bWJQcm94aW1hbCcsXG4gICdyaWdodFRodW1iRGlzdGFsJyxcbiAgJ3JpZ2h0SW5kZXhQcm94aW1hbCcsXG4gICdyaWdodEluZGV4SW50ZXJtZWRpYXRlJyxcbiAgJ3JpZ2h0SW5kZXhEaXN0YWwnLFxuICAncmlnaHRNaWRkbGVQcm94aW1hbCcsXG4gICdyaWdodE1pZGRsZUludGVybWVkaWF0ZScsXG4gICdyaWdodE1pZGRsZURpc3RhbCcsXG4gICdyaWdodFJpbmdQcm94aW1hbCcsXG4gICdyaWdodFJpbmdJbnRlcm1lZGlhdGUnLFxuICAncmlnaHRSaW5nRGlzdGFsJyxcbiAgJ3JpZ2h0TGl0dGxlUHJveGltYWwnLFxuICAncmlnaHRMaXR0bGVJbnRlcm1lZGlhdGUnLFxuICAncmlnaHRMaXR0bGVEaXN0YWwnLFxuXTtcbiIsICIvKiBlc2xpbnQtZGlzYWJsZSBAdHlwZXNjcmlwdC1lc2xpbnQvbmFtaW5nLWNvbnZlbnRpb24gKi9cblxuLyoqXG4gKiBUaGUgbmFtZXMgb2Yge0BsaW5rIFZSTUh1bWFub2lkfSBib25lIG5hbWVzLlxuICpcbiAqIFJlZjogaHR0cHM6Ly9naXRodWIuY29tL3ZybS1jL3ZybS1zcGVjaWZpY2F0aW9uL2Jsb2IvbWFzdGVyL3NwZWNpZmljYXRpb24vVlJNQ192cm0tMS4wL2h1bWFub2lkLm1kXG4gKi9cbmV4cG9ydCBjb25zdCBWUk1IdW1hbkJvbmVOYW1lID0ge1xuICBIaXBzOiAnaGlwcycsXG4gIFNwaW5lOiAnc3BpbmUnLFxuICBDaGVzdDogJ2NoZXN0JyxcbiAgVXBwZXJDaGVzdDogJ3VwcGVyQ2hlc3QnLFxuICBOZWNrOiAnbmVjaycsXG5cbiAgSGVhZDogJ2hlYWQnLFxuICBMZWZ0RXllOiAnbGVmdEV5ZScsXG4gIFJpZ2h0RXllOiAncmlnaHRFeWUnLFxuICBKYXc6ICdqYXcnLFxuXG4gIExlZnRVcHBlckxlZzogJ2xlZnRVcHBlckxlZycsXG4gIExlZnRMb3dlckxlZzogJ2xlZnRMb3dlckxlZycsXG4gIExlZnRGb290OiAnbGVmdEZvb3QnLFxuICBMZWZ0VG9lczogJ2xlZnRUb2VzJyxcblxuICBSaWdodFVwcGVyTGVnOiAncmlnaHRVcHBlckxlZycsXG4gIFJpZ2h0TG93ZXJMZWc6ICdyaWdodExvd2VyTGVnJyxcbiAgUmlnaHRGb290OiAncmlnaHRGb290JyxcbiAgUmlnaHRUb2VzOiAncmlnaHRUb2VzJyxcblxuICBMZWZ0U2hvdWxkZXI6ICdsZWZ0U2hvdWxkZXInLFxuICBMZWZ0VXBwZXJBcm06ICdsZWZ0VXBwZXJBcm0nLFxuICBMZWZ0TG93ZXJBcm06ICdsZWZ0TG93ZXJBcm0nLFxuICBMZWZ0SGFuZDogJ2xlZnRIYW5kJyxcblxuICBSaWdodFNob3VsZGVyOiAncmlnaHRTaG91bGRlcicsXG4gIFJpZ2h0VXBwZXJBcm06ICdyaWdodFVwcGVyQXJtJyxcbiAgUmlnaHRMb3dlckFybTogJ3JpZ2h0TG93ZXJBcm0nLFxuICBSaWdodEhhbmQ6ICdyaWdodEhhbmQnLFxuXG4gIExlZnRUaHVtYk1ldGFjYXJwYWw6ICdsZWZ0VGh1bWJNZXRhY2FycGFsJyxcbiAgTGVmdFRodW1iUHJveGltYWw6ICdsZWZ0VGh1bWJQcm94aW1hbCcsXG4gIExlZnRUaHVtYkRpc3RhbDogJ2xlZnRUaHVtYkRpc3RhbCcsXG4gIExlZnRJbmRleFByb3hpbWFsOiAnbGVmdEluZGV4UHJveGltYWwnLFxuICBMZWZ0SW5kZXhJbnRlcm1lZGlhdGU6ICdsZWZ0SW5kZXhJbnRlcm1lZGlhdGUnLFxuICBMZWZ0SW5kZXhEaXN0YWw6ICdsZWZ0SW5kZXhEaXN0YWwnLFxuICBMZWZ0TWlkZGxlUHJveGltYWw6ICdsZWZ0TWlkZGxlUHJveGltYWwnLFxuICBMZWZ0TWlkZGxlSW50ZXJtZWRpYXRlOiAnbGVmdE1pZGRsZUludGVybWVkaWF0ZScsXG4gIExlZnRNaWRkbGVEaXN0YWw6ICdsZWZ0TWlkZGxlRGlzdGFsJyxcbiAgTGVmdFJpbmdQcm94aW1hbDogJ2xlZnRSaW5nUHJveGltYWwnLFxuICBMZWZ0UmluZ0ludGVybWVkaWF0ZTogJ2xlZnRSaW5nSW50ZXJtZWRpYXRlJyxcbiAgTGVmdFJpbmdEaXN0YWw6ICdsZWZ0UmluZ0Rpc3RhbCcsXG4gIExlZnRMaXR0bGVQcm94aW1hbDogJ2xlZnRMaXR0bGVQcm94aW1hbCcsXG4gIExlZnRMaXR0bGVJbnRlcm1lZGlhdGU6ICdsZWZ0TGl0dGxlSW50ZXJtZWRpYXRlJyxcbiAgTGVmdExpdHRsZURpc3RhbDogJ2xlZnRMaXR0bGVEaXN0YWwnLFxuXG4gIFJpZ2h0VGh1bWJNZXRhY2FycGFsOiAncmlnaHRUaHVtYk1ldGFjYXJwYWwnLFxuICBSaWdodFRodW1iUHJveGltYWw6ICdyaWdodFRodW1iUHJveGltYWwnLFxuICBSaWdodFRodW1iRGlzdGFsOiAncmlnaHRUaHVtYkRpc3RhbCcsXG4gIFJpZ2h0SW5kZXhQcm94aW1hbDogJ3JpZ2h0SW5kZXhQcm94aW1hbCcsXG4gIFJpZ2h0SW5kZXhJbnRlcm1lZGlhdGU6ICdyaWdodEluZGV4SW50ZXJtZWRpYXRlJyxcbiAgUmlnaHRJbmRleERpc3RhbDogJ3JpZ2h0SW5kZXhEaXN0YWwnLFxuICBSaWdodE1pZGRsZVByb3hpbWFsOiAncmlnaHRNaWRkbGVQcm94aW1hbCcsXG4gIFJpZ2h0TWlkZGxlSW50ZXJtZWRpYXRlOiAncmlnaHRNaWRkbGVJbnRlcm1lZGlhdGUnLFxuICBSaWdodE1pZGRsZURpc3RhbDogJ3JpZ2h0TWlkZGxlRGlzdGFsJyxcbiAgUmlnaHRSaW5nUHJveGltYWw6ICdyaWdodFJpbmdQcm94aW1hbCcsXG4gIFJpZ2h0UmluZ0ludGVybWVkaWF0ZTogJ3JpZ2h0UmluZ0ludGVybWVkaWF0ZScsXG4gIFJpZ2h0UmluZ0Rpc3RhbDogJ3JpZ2h0UmluZ0Rpc3RhbCcsXG4gIFJpZ2h0TGl0dGxlUHJveGltYWw6ICdyaWdodExpdHRsZVByb3hpbWFsJyxcbiAgUmlnaHRMaXR0bGVJbnRlcm1lZGlhdGU6ICdyaWdodExpdHRsZUludGVybWVkaWF0ZScsXG4gIFJpZ2h0TGl0dGxlRGlzdGFsOiAncmlnaHRMaXR0bGVEaXN0YWwnLFxufSBhcyBjb25zdDtcblxuZXhwb3J0IHR5cGUgVlJNSHVtYW5Cb25lTmFtZSA9ICh0eXBlb2YgVlJNSHVtYW5Cb25lTmFtZSlba2V5b2YgdHlwZW9mIFZSTUh1bWFuQm9uZU5hbWVdO1xuIiwgIi8qIGVzbGludC1kaXNhYmxlIEB0eXBlc2NyaXB0LWVzbGludC9uYW1pbmctY29udmVudGlvbiAqL1xuXG5pbXBvcnQgeyBWUk1IdW1hbkJvbmVOYW1lIH0gZnJvbSAnLi9WUk1IdW1hbkJvbmVOYW1lJztcblxuLyoqXG4gKiBBbiBvYmplY3QgdGhhdCBtYXBzIGZyb20ge0BsaW5rIFZSTUh1bWFuQm9uZU5hbWV9IHRvIGl0cyBwYXJlbnQge0BsaW5rIFZSTUh1bWFuQm9uZU5hbWV9LlxuICpcbiAqIFJlZjogaHR0cHM6Ly9naXRodWIuY29tL3ZybS1jL3ZybS1zcGVjaWZpY2F0aW9uL2Jsb2IvbWFzdGVyL3NwZWNpZmljYXRpb24vVlJNQ192cm0tMS4wL2h1bWFub2lkLm1kXG4gKi9cbmV4cG9ydCBjb25zdCBWUk1IdW1hbkJvbmVQYXJlbnRNYXA6IHsgW2JvbmUgaW4gVlJNSHVtYW5Cb25lTmFtZV06IFZSTUh1bWFuQm9uZU5hbWUgfCBudWxsIH0gPSB7XG4gIGhpcHM6IG51bGwsXG4gIHNwaW5lOiAnaGlwcycsXG4gIGNoZXN0OiAnc3BpbmUnLFxuICB1cHBlckNoZXN0OiAnY2hlc3QnLFxuICBuZWNrOiAndXBwZXJDaGVzdCcsXG5cbiAgaGVhZDogJ25lY2snLFxuICBsZWZ0RXllOiAnaGVhZCcsXG4gIHJpZ2h0RXllOiAnaGVhZCcsXG4gIGphdzogJ2hlYWQnLFxuXG4gIGxlZnRVcHBlckxlZzogJ2hpcHMnLFxuICBsZWZ0TG93ZXJMZWc6ICdsZWZ0VXBwZXJMZWcnLFxuICBsZWZ0Rm9vdDogJ2xlZnRMb3dlckxlZycsXG4gIGxlZnRUb2VzOiAnbGVmdEZvb3QnLFxuXG4gIHJpZ2h0VXBwZXJMZWc6ICdoaXBzJyxcbiAgcmlnaHRMb3dlckxlZzogJ3JpZ2h0VXBwZXJMZWcnLFxuICByaWdodEZvb3Q6ICdyaWdodExvd2VyTGVnJyxcbiAgcmlnaHRUb2VzOiAncmlnaHRGb290JyxcblxuICBsZWZ0U2hvdWxkZXI6ICd1cHBlckNoZXN0JyxcbiAgbGVmdFVwcGVyQXJtOiAnbGVmdFNob3VsZGVyJyxcbiAgbGVmdExvd2VyQXJtOiAnbGVmdFVwcGVyQXJtJyxcbiAgbGVmdEhhbmQ6ICdsZWZ0TG93ZXJBcm0nLFxuXG4gIHJpZ2h0U2hvdWxkZXI6ICd1cHBlckNoZXN0JyxcbiAgcmlnaHRVcHBlckFybTogJ3JpZ2h0U2hvdWxkZXInLFxuICByaWdodExvd2VyQXJtOiAncmlnaHRVcHBlckFybScsXG4gIHJpZ2h0SGFuZDogJ3JpZ2h0TG93ZXJBcm0nLFxuXG4gIGxlZnRUaHVtYk1ldGFjYXJwYWw6ICdsZWZ0SGFuZCcsXG4gIGxlZnRUaHVtYlByb3hpbWFsOiAnbGVmdFRodW1iTWV0YWNhcnBhbCcsXG4gIGxlZnRUaHVtYkRpc3RhbDogJ2xlZnRUaHVtYlByb3hpbWFsJyxcbiAgbGVmdEluZGV4UHJveGltYWw6ICdsZWZ0SGFuZCcsXG4gIGxlZnRJbmRleEludGVybWVkaWF0ZTogJ2xlZnRJbmRleFByb3hpbWFsJyxcbiAgbGVmdEluZGV4RGlzdGFsOiAnbGVmdEluZGV4SW50ZXJtZWRpYXRlJyxcbiAgbGVmdE1pZGRsZVByb3hpbWFsOiAnbGVmdEhhbmQnLFxuICBsZWZ0TWlkZGxlSW50ZXJtZWRpYXRlOiAnbGVmdE1pZGRsZVByb3hpbWFsJyxcbiAgbGVmdE1pZGRsZURpc3RhbDogJ2xlZnRNaWRkbGVJbnRlcm1lZGlhdGUnLFxuICBsZWZ0UmluZ1Byb3hpbWFsOiAnbGVmdEhhbmQnLFxuICBsZWZ0UmluZ0ludGVybWVkaWF0ZTogJ2xlZnRSaW5nUHJveGltYWwnLFxuICBsZWZ0UmluZ0Rpc3RhbDogJ2xlZnRSaW5nSW50ZXJtZWRpYXRlJyxcbiAgbGVmdExpdHRsZVByb3hpbWFsOiAnbGVmdEhhbmQnLFxuICBsZWZ0TGl0dGxlSW50ZXJtZWRpYXRlOiAnbGVmdExpdHRsZVByb3hpbWFsJyxcbiAgbGVmdExpdHRsZURpc3RhbDogJ2xlZnRMaXR0bGVJbnRlcm1lZGlhdGUnLFxuXG4gIHJpZ2h0VGh1bWJNZXRhY2FycGFsOiAncmlnaHRIYW5kJyxcbiAgcmlnaHRUaHVtYlByb3hpbWFsOiAncmlnaHRUaHVtYk1ldGFjYXJwYWwnLFxuICByaWdodFRodW1iRGlzdGFsOiAncmlnaHRUaHVtYlByb3hpbWFsJyxcbiAgcmlnaHRJbmRleFByb3hpbWFsOiAncmlnaHRIYW5kJyxcbiAgcmlnaHRJbmRleEludGVybWVkaWF0ZTogJ3JpZ2h0SW5kZXhQcm94aW1hbCcsXG4gIHJpZ2h0SW5kZXhEaXN0YWw6ICdyaWdodEluZGV4SW50ZXJtZWRpYXRlJyxcbiAgcmlnaHRNaWRkbGVQcm94aW1hbDogJ3JpZ2h0SGFuZCcsXG4gIHJpZ2h0TWlkZGxlSW50ZXJtZWRpYXRlOiAncmlnaHRNaWRkbGVQcm94aW1hbCcsXG4gIHJpZ2h0TWlkZGxlRGlzdGFsOiAncmlnaHRNaWRkbGVJbnRlcm1lZGlhdGUnLFxuICByaWdodFJpbmdQcm94aW1hbDogJ3JpZ2h0SGFuZCcsXG4gIHJpZ2h0UmluZ0ludGVybWVkaWF0ZTogJ3JpZ2h0UmluZ1Byb3hpbWFsJyxcbiAgcmlnaHRSaW5nRGlzdGFsOiAncmlnaHRSaW5nSW50ZXJtZWRpYXRlJyxcbiAgcmlnaHRMaXR0bGVQcm94aW1hbDogJ3JpZ2h0SGFuZCcsXG4gIHJpZ2h0TGl0dGxlSW50ZXJtZWRpYXRlOiAncmlnaHRMaXR0bGVQcm94aW1hbCcsXG4gIHJpZ2h0TGl0dGxlRGlzdGFsOiAncmlnaHRMaXR0bGVJbnRlcm1lZGlhdGUnLFxufTtcbiIsICJpbXBvcnQgKiBhcyBUSFJFRSBmcm9tICd0aHJlZSc7XG5pbXBvcnQgeyBxdWF0SW52ZXJ0Q29tcGF0IH0gZnJvbSAnLi4vdXRpbHMvcXVhdEludmVydENvbXBhdCc7XG5pbXBvcnQgdHlwZSB7IFZSTUh1bWFuQm9uZSB9IGZyb20gJy4vVlJNSHVtYW5Cb25lJztcbmltcG9ydCB0eXBlIHsgVlJNSHVtYW5Cb25lcyB9IGZyb20gJy4vVlJNSHVtYW5Cb25lcyc7XG5pbXBvcnQgdHlwZSB7IFZSTUh1bWFuQm9uZU5hbWUgfSBmcm9tICcuL1ZSTUh1bWFuQm9uZU5hbWUnO1xuaW1wb3J0IHR5cGUgeyBWUk1Qb3NlIH0gZnJvbSAnLi9WUk1Qb3NlJztcblxuY29uc3QgX3YzQSA9IG5ldyBUSFJFRS5WZWN0b3IzKCk7XG5jb25zdCBfcXVhdEEgPSBuZXcgVEhSRUUuUXVhdGVybmlvbigpO1xuXG4vKipcbiAqIEEgY2xhc3MgcmVwcmVzZW50cyB0aGUgUmlnIG9mIGEgVlJNLlxuICovXG5leHBvcnQgY2xhc3MgVlJNUmlnIHtcbiAgLyoqXG4gICAqIEEge0BsaW5rIFZSTUh1bWFuQm9uZXN9IHRoYXQgY29udGFpbnMgYWxsIHRoZSBodW1hbiBib25lcyBvZiB0aGUgVlJNLlxuICAgKiBZb3UgbWlnaHQgd2FudCB0byBnZXQgdGhlc2UgYm9uZXMgdXNpbmcge0BsaW5rIFZSTUh1bWFub2lkLmdldEJvbmV9LlxuICAgKi9cbiAgcHVibGljIGh1bWFuQm9uZXM6IFZSTUh1bWFuQm9uZXM7XG5cbiAgLyoqXG4gICAqIEEge0BsaW5rIFZSTVBvc2V9IHRoYXQgaXMgaXRzIGRlZmF1bHQgc3RhdGUuXG4gICAqIE5vdGUgdGhhdCBpdCdzIG5vdCBjb21wYXRpYmxlIHdpdGgge0BsaW5rIHNldFBvc2V9IGFuZCB7QGxpbmsgZ2V0UG9zZX0sIHNpbmNlIGl0IGNvbnRhaW5zIG5vbi1yZWxhdGl2ZSB2YWx1ZXMgb2YgZWFjaCBsb2NhbCB0cmFuc2Zvcm1zLlxuICAgKi9cbiAgcHVibGljIHJlc3RQb3NlOiBWUk1Qb3NlO1xuXG4gIC8qKlxuICAgKiBDcmVhdGUgYSBuZXcge0BsaW5rIFZSTUh1bWFub2lkfS5cbiAgICogQHBhcmFtIGh1bWFuQm9uZXMgQSB7QGxpbmsgVlJNSHVtYW5Cb25lc30gY29udGFpbnMgYWxsIHRoZSBib25lcyBvZiB0aGUgbmV3IGh1bWFub2lkXG4gICAqL1xuICBwdWJsaWMgY29uc3RydWN0b3IoaHVtYW5Cb25lczogVlJNSHVtYW5Cb25lcykge1xuICAgIHRoaXMuaHVtYW5Cb25lcyA9IGh1bWFuQm9uZXM7XG5cbiAgICB0aGlzLnJlc3RQb3NlID0gdGhpcy5nZXRBYnNvbHV0ZVBvc2UoKTtcbiAgfVxuXG4gIC8qKlxuICAgKiBSZXR1cm4gdGhlIGN1cnJlbnQgYWJzb2x1dGUgcG9zZSBvZiB0aGlzIGh1bWFub2lkIGFzIGEge0BsaW5rIFZSTVBvc2V9LlxuICAgKiBOb3RlIHRoYXQgdGhlIG91dHB1dCByZXN1bHQgd2lsbCBjb250YWluIGluaXRpYWwgc3RhdGUgb2YgdGhlIFZSTSBhbmQgbm90IGNvbXBhdGlibGUgYmV0d2VlbiBkaWZmZXJlbnQgbW9kZWxzLlxuICAgKiBZb3UgbWlnaHQgd2FudCB0byB1c2Uge0BsaW5rIGdldFBvc2V9IGluc3RlYWQuXG4gICAqL1xuICBwdWJsaWMgZ2V0QWJzb2x1dGVQb3NlKCk6IFZSTVBvc2Uge1xuICAgIGNvbnN0IHBvc2UgPSB7fSBhcyBWUk1Qb3NlO1xuXG4gICAgT2JqZWN0LmtleXModGhpcy5odW1hbkJvbmVzKS5mb3JFYWNoKCh2cm1Cb25lTmFtZVN0cmluZykgPT4ge1xuICAgICAgY29uc3QgdnJtQm9uZU5hbWUgPSB2cm1Cb25lTmFtZVN0cmluZyBhcyBWUk1IdW1hbkJvbmVOYW1lO1xuICAgICAgY29uc3Qgbm9kZSA9IHRoaXMuZ2V0Qm9uZU5vZGUodnJtQm9uZU5hbWUpO1xuXG4gICAgICAvLyBJZ25vcmUgd2hlbiB0aGVyZSBhcmUgbm8gYm9uZSBvbiB0aGUgVlJNSHVtYW5vaWRcbiAgICAgIGlmICghbm9kZSkge1xuICAgICAgICByZXR1cm47XG4gICAgICB9XG5cbiAgICAgIC8vIEdldCB0aGUgcG9zaXRpb24gLyByb3RhdGlvbiBmcm9tIHRoZSBub2RlXG4gICAgICBfdjNBLmNvcHkobm9kZS5wb3NpdGlvbik7XG4gICAgICBfcXVhdEEuY29weShub2RlLnF1YXRlcm5pb24pO1xuXG4gICAgICAvLyBDb252ZXJ0IHRvIHJhdyBhcnJheXNcbiAgICAgIHBvc2VbdnJtQm9uZU5hbWVdID0ge1xuICAgICAgICBwb3NpdGlvbjogX3YzQS50b0FycmF5KCkgYXMgW251bWJlciwgbnVtYmVyLCBudW1iZXJdLFxuICAgICAgICByb3RhdGlvbjogX3F1YXRBLnRvQXJyYXkoKSBhcyBbbnVtYmVyLCBudW1iZXIsIG51bWJlciwgbnVtYmVyXSxcbiAgICAgIH07XG4gICAgfSk7XG5cbiAgICByZXR1cm4gcG9zZTtcbiAgfVxuXG4gIC8qKlxuICAgKiBSZXR1cm4gdGhlIGN1cnJlbnQgcG9zZSBvZiB0aGlzIGh1bWFub2lkIGFzIGEge0BsaW5rIFZSTVBvc2V9LlxuICAgKlxuICAgKiBFYWNoIHRyYW5zZm9ybSBpcyBhIGxvY2FsIHRyYW5zZm9ybSByZWxhdGl2ZSBmcm9tIHJlc3QgcG9zZSAoVC1wb3NlKS5cbiAgICovXG4gIHB1YmxpYyBnZXRQb3NlKCk6IFZSTVBvc2Uge1xuICAgIGNvbnN0IHBvc2UgPSB7fSBhcyBWUk1Qb3NlO1xuXG4gICAgT2JqZWN0LmtleXModGhpcy5odW1hbkJvbmVzKS5mb3JFYWNoKChib25lTmFtZVN0cmluZykgPT4ge1xuICAgICAgY29uc3QgYm9uZU5hbWUgPSBib25lTmFtZVN0cmluZyBhcyBWUk1IdW1hbkJvbmVOYW1lO1xuICAgICAgY29uc3Qgbm9kZSA9IHRoaXMuZ2V0Qm9uZU5vZGUoYm9uZU5hbWUpO1xuXG4gICAgICAvLyBJZ25vcmUgd2hlbiB0aGVyZSBhcmUgbm8gYm9uZSBvbiB0aGUgVlJNSHVtYW5vaWRcbiAgICAgIGlmICghbm9kZSkge1xuICAgICAgICByZXR1cm47XG4gICAgICB9XG5cbiAgICAgIC8vIFRha2UgYSBkaWZmIGZyb20gcmVzdFBvc2VcbiAgICAgIF92M0Euc2V0KDAsIDAsIDApO1xuICAgICAgX3F1YXRBLmlkZW50aXR5KCk7XG5cbiAgICAgIGNvbnN0IHJlc3RTdGF0ZSA9IHRoaXMucmVzdFBvc2VbYm9uZU5hbWVdO1xuICAgICAgaWYgKHJlc3RTdGF0ZT8ucG9zaXRpb24pIHtcbiAgICAgICAgX3YzQS5mcm9tQXJyYXkocmVzdFN0YXRlLnBvc2l0aW9uKS5uZWdhdGUoKTtcbiAgICAgIH1cbiAgICAgIGlmIChyZXN0U3RhdGU/LnJvdGF0aW9uKSB7XG4gICAgICAgIHF1YXRJbnZlcnRDb21wYXQoX3F1YXRBLmZyb21BcnJheShyZXN0U3RhdGUucm90YXRpb24pKTtcbiAgICAgIH1cblxuICAgICAgLy8gR2V0IHRoZSBwb3NpdGlvbiAvIHJvdGF0aW9uIGZyb20gdGhlIG5vZGVcbiAgICAgIF92M0EuYWRkKG5vZGUucG9zaXRpb24pO1xuICAgICAgX3F1YXRBLnByZW11bHRpcGx5KG5vZGUucXVhdGVybmlvbik7XG5cbiAgICAgIC8vIENvbnZlcnQgdG8gcmF3IGFycmF5c1xuICAgICAgcG9zZVtib25lTmFtZV0gPSB7XG4gICAgICAgIHBvc2l0aW9uOiBfdjNBLnRvQXJyYXkoKSBhcyBbbnVtYmVyLCBudW1iZXIsIG51bWJlcl0sXG4gICAgICAgIHJvdGF0aW9uOiBfcXVhdEEudG9BcnJheSgpIGFzIFtudW1iZXIsIG51bWJlciwgbnVtYmVyLCBudW1iZXJdLFxuICAgICAgfTtcbiAgICB9KTtcblxuICAgIHJldHVybiBwb3NlO1xuICB9XG5cbiAgLyoqXG4gICAqIExldCB0aGUgaHVtYW5vaWQgZG8gYSBzcGVjaWZpZWQgcG9zZS5cbiAgICpcbiAgICogRWFjaCB0cmFuc2Zvcm0gaGF2ZSB0byBiZSBhIGxvY2FsIHRyYW5zZm9ybSByZWxhdGl2ZSBmcm9tIHJlc3QgcG9zZSAoVC1wb3NlKS5cbiAgICogWW91IGNhbiBwYXNzIHdoYXQgeW91IGdvdCBmcm9tIHtAbGluayBnZXRQb3NlfS5cbiAgICpcbiAgICogQHBhcmFtIHBvc2VPYmplY3QgQSBbW1ZSTVBvc2VdXSB0aGF0IHJlcHJlc2VudHMgYSBzaW5nbGUgcG9zZVxuICAgKi9cbiAgcHVibGljIHNldFBvc2UocG9zZU9iamVjdDogVlJNUG9zZSk6IHZvaWQge1xuICAgIE9iamVjdC5lbnRyaWVzKHBvc2VPYmplY3QpLmZvckVhY2goKFtib25lTmFtZVN0cmluZywgc3RhdGVdKSA9PiB7XG4gICAgICBjb25zdCBib25lTmFtZSA9IGJvbmVOYW1lU3RyaW5nIGFzIFZSTUh1bWFuQm9uZU5hbWU7XG4gICAgICBjb25zdCBub2RlID0gdGhpcy5nZXRCb25lTm9kZShib25lTmFtZSk7XG5cbiAgICAgIC8vIElnbm9yZSB3aGVuIHRoZXJlIGFyZSBubyBib25lIHRoYXQgaXMgZGVmaW5lZCBpbiB0aGUgcG9zZSBvbiB0aGUgVlJNSHVtYW5vaWRcbiAgICAgIGlmICghbm9kZSkge1xuICAgICAgICByZXR1cm47XG4gICAgICB9XG5cbiAgICAgIGNvbnN0IHJlc3RTdGF0ZSA9IHRoaXMucmVzdFBvc2VbYm9uZU5hbWVdO1xuICAgICAgaWYgKCFyZXN0U3RhdGUpIHtcbiAgICAgICAgLy8gSXQncyB2ZXJ5IHVubGlrZWx5LiBQb3NzaWJseSBhIGJ1Z1xuICAgICAgICByZXR1cm47XG4gICAgICB9XG5cbiAgICAgIC8vIEFwcGx5IHRoZSBzdGF0ZSB0byB0aGUgYWN0dWFsIGJvbmVcbiAgICAgIGlmIChzdGF0ZT8ucG9zaXRpb24pIHtcbiAgICAgICAgbm9kZS5wb3NpdGlvbi5mcm9tQXJyYXkoc3RhdGUucG9zaXRpb24pO1xuXG4gICAgICAgIGlmIChyZXN0U3RhdGUucG9zaXRpb24pIHtcbiAgICAgICAgICBub2RlLnBvc2l0aW9uLmFkZChfdjNBLmZyb21BcnJheShyZXN0U3RhdGUucG9zaXRpb24pKTtcbiAgICAgICAgfVxuICAgICAgfVxuXG4gICAgICBpZiAoc3RhdGU/LnJvdGF0aW9uKSB7XG4gICAgICAgIG5vZGUucXVhdGVybmlvbi5mcm9tQXJyYXkoc3RhdGUucm90YXRpb24pO1xuXG4gICAgICAgIGlmIChyZXN0U3RhdGUucm90YXRpb24pIHtcbiAgICAgICAgICBub2RlLnF1YXRlcm5pb24ubXVsdGlwbHkoX3F1YXRBLmZyb21BcnJheShyZXN0U3RhdGUucm90YXRpb24pKTtcbiAgICAgICAgfVxuICAgICAgfVxuICAgIH0pO1xuICB9XG5cbiAgLyoqXG4gICAqIFJlc2V0IHRoZSBodW1hbm9pZCB0byBpdHMgcmVzdCBwb3NlLlxuICAgKi9cbiAgcHVibGljIHJlc2V0UG9zZSgpOiB2b2lkIHtcbiAgICBPYmplY3QuZW50cmllcyh0aGlzLnJlc3RQb3NlKS5mb3JFYWNoKChbYm9uZU5hbWUsIHJlc3RdKSA9PiB7XG4gICAgICBjb25zdCBub2RlID0gdGhpcy5nZXRCb25lTm9kZShib25lTmFtZSBhcyBWUk1IdW1hbkJvbmVOYW1lKTtcblxuICAgICAgaWYgKCFub2RlKSB7XG4gICAgICAgIHJldHVybjtcbiAgICAgIH1cblxuICAgICAgaWYgKHJlc3Q/LnBvc2l0aW9uKSB7XG4gICAgICAgIG5vZGUucG9zaXRpb24uZnJvbUFycmF5KHJlc3QucG9zaXRpb24pO1xuICAgICAgfVxuXG4gICAgICBpZiAocmVzdD8ucm90YXRpb24pIHtcbiAgICAgICAgbm9kZS5xdWF0ZXJuaW9uLmZyb21BcnJheShyZXN0LnJvdGF0aW9uKTtcbiAgICAgIH1cbiAgICB9KTtcbiAgfVxuXG4gIC8qKlxuICAgKiBSZXR1cm4gYSBib25lIGJvdW5kIHRvIGEgc3BlY2lmaWVkIHtAbGluayBWUk1IdW1hbkJvbmVOYW1lfSwgYXMgYSB7QGxpbmsgVlJNSHVtYW5Cb25lfS5cbiAgICpcbiAgICogQHBhcmFtIG5hbWUgTmFtZSBvZiB0aGUgYm9uZSB5b3Ugd2FudFxuICAgKi9cbiAgcHVibGljIGdldEJvbmUobmFtZTogVlJNSHVtYW5Cb25lTmFtZSk6IFZSTUh1bWFuQm9uZSB8IHVuZGVmaW5lZCB7XG4gICAgcmV0dXJuIHRoaXMuaHVtYW5Cb25lc1tuYW1lXSA/PyB1bmRlZmluZWQ7XG4gIH1cblxuICAvKipcbiAgICogUmV0dXJuIGEgYm9uZSBib3VuZCB0byBhIHNwZWNpZmllZCB7QGxpbmsgVlJNSHVtYW5Cb25lTmFtZX0sIGFzIGEgYFRIUkVFLk9iamVjdDNEYC5cbiAgICpcbiAgICogQHBhcmFtIG5hbWUgTmFtZSBvZiB0aGUgYm9uZSB5b3Ugd2FudFxuICAgKi9cbiAgcHVibGljIGdldEJvbmVOb2RlKG5hbWU6IFZSTUh1bWFuQm9uZU5hbWUpOiBUSFJFRS5PYmplY3QzRCB8IG51bGwge1xuICAgIHJldHVybiB0aGlzLmh1bWFuQm9uZXNbbmFtZV0/Lm5vZGUgPz8gbnVsbDtcbiAgfVxufVxuIiwgImltcG9ydCAqIGFzIFRIUkVFIGZyb20gJ3RocmVlJztcblxuLyoqXG4gKiBBIGNvbXBhdCBmdW5jdGlvbiBmb3IgYFF1YXRlcm5pb24uaW52ZXJ0KClgIC8gYFF1YXRlcm5pb24uaW52ZXJzZSgpYC5cbiAqIGBRdWF0ZXJuaW9uLmludmVydCgpYCBpcyBpbnRyb2R1Y2VkIGluIHIxMjMgYW5kIGBRdWF0ZXJuaW9uLmludmVyc2UoKWAgZW1pdHMgYSB3YXJuaW5nLlxuICogV2UgYXJlIGdvaW5nIHRvIHVzZSB0aGlzIGNvbXBhdCBmb3IgYSB3aGlsZS5cbiAqIEBwYXJhbSB0YXJnZXQgQSB0YXJnZXQgcXVhdGVybmlvblxuICovXG5leHBvcnQgZnVuY3Rpb24gcXVhdEludmVydENvbXBhdDxUIGV4dGVuZHMgVEhSRUUuUXVhdGVybmlvbj4odGFyZ2V0OiBUKTogVCB7XG4gIGlmICgodGFyZ2V0IGFzIGFueSkuaW52ZXJ0KSB7XG4gICAgdGFyZ2V0LmludmVydCgpO1xuICB9IGVsc2Uge1xuICAgICh0YXJnZXQgYXMgYW55KS5pbnZlcnNlKCk7XG4gIH1cblxuICByZXR1cm4gdGFyZ2V0O1xufVxuIiwgImltcG9ydCAqIGFzIFRIUkVFIGZyb20gJ3RocmVlJztcbmltcG9ydCB7IFZSTUh1bWFuQm9uZU5hbWUsIFZSTUh1bWFuQm9uZXMgfSBmcm9tICcuJztcbmltcG9ydCB7IFZSTUh1bWFuQm9uZUxpc3QgfSBmcm9tICcuL1ZSTUh1bWFuQm9uZUxpc3QnO1xuaW1wb3J0IHsgVlJNSHVtYW5Cb25lUGFyZW50TWFwIH0gZnJvbSAnLi9WUk1IdW1hbkJvbmVQYXJlbnRNYXAnO1xuaW1wb3J0IHsgVlJNUmlnIH0gZnJvbSAnLi9WUk1SaWcnO1xuXG5jb25zdCBfdjNBID0gbmV3IFRIUkVFLlZlY3RvcjMoKTtcbmNvbnN0IF9xdWF0QSA9IG5ldyBUSFJFRS5RdWF0ZXJuaW9uKCk7XG5jb25zdCBfYm9uZVdvcmxkUG9zID0gbmV3IFRIUkVFLlZlY3RvcjMoKTtcblxuLyoqXG4gKiBBIGNsYXNzIHJlcHJlc2VudHMgdGhlIG5vcm1hbGl6ZWQgUmlnIG9mIGEgVlJNLlxuICovXG5leHBvcnQgY2xhc3MgVlJNSHVtYW5vaWRSaWcgZXh0ZW5kcyBWUk1SaWcge1xuICBwcm90ZWN0ZWQgc3RhdGljIF9zZXR1cFRyYW5zZm9ybXMobW9kZWxSaWc6IFZSTVJpZyk6IHtcbiAgICByaWdCb25lczogVlJNSHVtYW5Cb25lcztcbiAgICByb290OiBUSFJFRS5PYmplY3QzRDtcbiAgICBwYXJlbnRXb3JsZFJvdGF0aW9uczogeyBbYm9uZU5hbWUgaW4gVlJNSHVtYW5Cb25lTmFtZV0/OiBUSFJFRS5RdWF0ZXJuaW9uIH07XG4gICAgYm9uZVJvdGF0aW9uczogeyBbYm9uZU5hbWUgaW4gVlJNSHVtYW5Cb25lTmFtZV0/OiBUSFJFRS5RdWF0ZXJuaW9uIH07XG4gIH0ge1xuICAgIGNvbnN0IHJvb3QgPSBuZXcgVEhSRUUuT2JqZWN0M0QoKTtcbiAgICByb290Lm5hbWUgPSAnVlJNSHVtYW5vaWRSaWcnO1xuXG4gICAgLy8gc3RvcmUgYm9uZVdvcmxkUG9zaXRpb25zLCBib25lV29ybGRSb3RhdGlvbnMsIGFuZCBwYXJlbnRXb3JsZFJvdGF0aW9uc1xuICAgIGNvbnN0IGJvbmVXb3JsZFBvc2l0aW9uczogeyBbYm9uZU5hbWUgaW4gVlJNSHVtYW5Cb25lTmFtZV0/OiBUSFJFRS5WZWN0b3IzIH0gPSB7fTtcbiAgICBjb25zdCBib25lV29ybGRSb3RhdGlvbnM6IHsgW2JvbmVOYW1lIGluIFZSTUh1bWFuQm9uZU5hbWVdPzogVEhSRUUuUXVhdGVybmlvbiB9ID0ge307XG4gICAgY29uc3QgYm9uZVJvdGF0aW9uczogeyBbYm9uZU5hbWUgaW4gVlJNSHVtYW5Cb25lTmFtZV0/OiBUSFJFRS5RdWF0ZXJuaW9uIH0gPSB7fTtcbiAgICBjb25zdCBwYXJlbnRXb3JsZFJvdGF0aW9uczogeyBbYm9uZU5hbWUgaW4gVlJNSHVtYW5Cb25lTmFtZV0/OiBUSFJFRS5RdWF0ZXJuaW9uIH0gPSB7fTtcblxuICAgIFZSTUh1bWFuQm9uZUxpc3QuZm9yRWFjaCgoYm9uZU5hbWUpID0+IHtcbiAgICAgIGNvbnN0IGJvbmVOb2RlID0gbW9kZWxSaWcuZ2V0Qm9uZU5vZGUoYm9uZU5hbWUpO1xuXG4gICAgICBpZiAoYm9uZU5vZGUpIHtcbiAgICAgICAgY29uc3QgYm9uZVdvcmxkUG9zaXRpb24gPSBuZXcgVEhSRUUuVmVjdG9yMygpO1xuICAgICAgICBjb25zdCBib25lV29ybGRSb3RhdGlvbiA9IG5ldyBUSFJFRS5RdWF0ZXJuaW9uKCk7XG5cbiAgICAgICAgYm9uZU5vZGUudXBkYXRlV29ybGRNYXRyaXgodHJ1ZSwgZmFsc2UpO1xuICAgICAgICBib25lTm9kZS5tYXRyaXhXb3JsZC5kZWNvbXBvc2UoYm9uZVdvcmxkUG9zaXRpb24sIGJvbmVXb3JsZFJvdGF0aW9uLCBfdjNBKTtcblxuICAgICAgICBib25lV29ybGRQb3NpdGlvbnNbYm9uZU5hbWVdID0gYm9uZVdvcmxkUG9zaXRpb247XG4gICAgICAgIGJvbmVXb3JsZFJvdGF0aW9uc1tib25lTmFtZV0gPSBib25lV29ybGRSb3RhdGlvbjtcbiAgICAgICAgYm9uZVJvdGF0aW9uc1tib25lTmFtZV0gPSBib25lTm9kZS5xdWF0ZXJuaW9uLmNsb25lKCk7XG5cbiAgICAgICAgY29uc3QgcGFyZW50V29ybGRSb3RhdGlvbiA9IG5ldyBUSFJFRS5RdWF0ZXJuaW9uKCk7XG4gICAgICAgIGJvbmVOb2RlLnBhcmVudD8ubWF0cml4V29ybGQuZGVjb21wb3NlKF92M0EsIHBhcmVudFdvcmxkUm90YXRpb24sIF92M0EpO1xuICAgICAgICBwYXJlbnRXb3JsZFJvdGF0aW9uc1tib25lTmFtZV0gPSBwYXJlbnRXb3JsZFJvdGF0aW9uO1xuICAgICAgfVxuICAgIH0pO1xuXG4gICAgLy8gYnVpbGQgcmlnIGhpZXJhcmNoeSArIHN0b3JlIHBhcmVudFdvcmxkUm90YXRpb25zXG4gICAgY29uc3QgcmlnQm9uZXM6IFBhcnRpYWw8VlJNSHVtYW5Cb25lcz4gPSB7fTtcbiAgICBWUk1IdW1hbkJvbmVMaXN0LmZvckVhY2goKGJvbmVOYW1lKSA9PiB7XG4gICAgICBjb25zdCBib25lTm9kZSA9IG1vZGVsUmlnLmdldEJvbmVOb2RlKGJvbmVOYW1lKTtcblxuICAgICAgaWYgKGJvbmVOb2RlKSB7XG4gICAgICAgIGNvbnN0IGJvbmVXb3JsZFBvc2l0aW9uID0gYm9uZVdvcmxkUG9zaXRpb25zW2JvbmVOYW1lXSBhcyBUSFJFRS5WZWN0b3IzO1xuXG4gICAgICAgIC8vIHNlZSB0aGUgbmVhcmVzdCBwYXJlbnQgcG9zaXRpb25cbiAgICAgICAgbGV0IGN1cnJlbnRCb25lTmFtZTogVlJNSHVtYW5Cb25lTmFtZSB8IG51bGwgPSBib25lTmFtZTtcbiAgICAgICAgbGV0IHBhcmVudEJvbmVXb3JsZFBvc2l0aW9uOiBUSFJFRS5WZWN0b3IzIHwgdW5kZWZpbmVkO1xuICAgICAgICB3aGlsZSAocGFyZW50Qm9uZVdvcmxkUG9zaXRpb24gPT0gbnVsbCkge1xuICAgICAgICAgIGN1cnJlbnRCb25lTmFtZSA9IFZSTUh1bWFuQm9uZVBhcmVudE1hcFtjdXJyZW50Qm9uZU5hbWVdO1xuICAgICAgICAgIGlmIChjdXJyZW50Qm9uZU5hbWUgPT0gbnVsbCkge1xuICAgICAgICAgICAgYnJlYWs7XG4gICAgICAgICAgfVxuICAgICAgICAgIHBhcmVudEJvbmVXb3JsZFBvc2l0aW9uID0gYm9uZVdvcmxkUG9zaXRpb25zW2N1cnJlbnRCb25lTmFtZV07XG4gICAgICAgIH1cblxuICAgICAgICAvLyBhZGQgdG8gaGllcmFyY2h5XG4gICAgICAgIGNvbnN0IHJpZ0JvbmVOb2RlID0gbmV3IFRIUkVFLk9iamVjdDNEKCk7XG4gICAgICAgIHJpZ0JvbmVOb2RlLm5hbWUgPSAnTm9ybWFsaXplZF8nICsgYm9uZU5vZGUubmFtZTtcblxuICAgICAgICBjb25zdCBwYXJlbnRSaWdCb25lTm9kZSA9IChjdXJyZW50Qm9uZU5hbWUgPyByaWdCb25lc1tjdXJyZW50Qm9uZU5hbWVdPy5ub2RlIDogcm9vdCkgYXMgVEhSRUUuT2JqZWN0M0Q7XG5cbiAgICAgICAgcGFyZW50UmlnQm9uZU5vZGUuYWRkKHJpZ0JvbmVOb2RlKTtcbiAgICAgICAgcmlnQm9uZU5vZGUucG9zaXRpb24uY29weShib25lV29ybGRQb3NpdGlvbik7XG4gICAgICAgIGlmIChwYXJlbnRCb25lV29ybGRQb3NpdGlvbikge1xuICAgICAgICAgIHJpZ0JvbmVOb2RlLnBvc2l0aW9uLnN1YihwYXJlbnRCb25lV29ybGRQb3NpdGlvbik7XG4gICAgICAgIH1cblxuICAgICAgICByaWdCb25lc1tib25lTmFtZV0gPSB7IG5vZGU6IHJpZ0JvbmVOb2RlIH07XG4gICAgICB9XG4gICAgfSk7XG5cbiAgICByZXR1cm4ge1xuICAgICAgcmlnQm9uZXM6IHJpZ0JvbmVzIGFzIFZSTUh1bWFuQm9uZXMsXG4gICAgICByb290LFxuICAgICAgcGFyZW50V29ybGRSb3RhdGlvbnMsXG4gICAgICBib25lUm90YXRpb25zLFxuICAgIH07XG4gIH1cblxuICBwdWJsaWMgcmVhZG9ubHkgb3JpZ2luYWw6IFZSTVJpZztcbiAgcHVibGljIHJlYWRvbmx5IHJvb3Q6IFRIUkVFLk9iamVjdDNEO1xuICBwcm90ZWN0ZWQgcmVhZG9ubHkgX3BhcmVudFdvcmxkUm90YXRpb25zOiB7IFtib25lTmFtZSBpbiBWUk1IdW1hbkJvbmVOYW1lXT86IFRIUkVFLlF1YXRlcm5pb24gfTtcbiAgcHJvdGVjdGVkIHJlYWRvbmx5IF9ib25lUm90YXRpb25zOiB7IFtib25lTmFtZSBpbiBWUk1IdW1hbkJvbmVOYW1lXT86IFRIUkVFLlF1YXRlcm5pb24gfTtcblxuICBwdWJsaWMgY29uc3RydWN0b3IoaHVtYW5vaWQ6IFZSTVJpZykge1xuICAgIGNvbnN0IHsgcmlnQm9uZXMsIHJvb3QsIHBhcmVudFdvcmxkUm90YXRpb25zLCBib25lUm90YXRpb25zIH0gPSBWUk1IdW1hbm9pZFJpZy5fc2V0dXBUcmFuc2Zvcm1zKGh1bWFub2lkKTtcblxuICAgIHN1cGVyKHJpZ0JvbmVzKTtcblxuICAgIHRoaXMub3JpZ2luYWwgPSBodW1hbm9pZDtcbiAgICB0aGlzLnJvb3QgPSByb290O1xuICAgIHRoaXMuX3BhcmVudFdvcmxkUm90YXRpb25zID0gcGFyZW50V29ybGRSb3RhdGlvbnM7XG4gICAgdGhpcy5fYm9uZVJvdGF0aW9ucyA9IGJvbmVSb3RhdGlvbnM7XG4gIH1cblxuICAvKipcbiAgICogVXBkYXRlIHRoaXMgaHVtYW5vaWQgcmlnLlxuICAgKi9cbiAgcHVibGljIHVwZGF0ZSgpOiB2b2lkIHtcbiAgICBWUk1IdW1hbkJvbmVMaXN0LmZvckVhY2goKGJvbmVOYW1lKSA9PiB7XG4gICAgICBjb25zdCBib25lTm9kZSA9IHRoaXMub3JpZ2luYWwuZ2V0Qm9uZU5vZGUoYm9uZU5hbWUpO1xuXG4gICAgICBpZiAoYm9uZU5vZGUgIT0gbnVsbCkge1xuICAgICAgICBjb25zdCByaWdCb25lTm9kZSA9IHRoaXMuZ2V0Qm9uZU5vZGUoYm9uZU5hbWUpITtcbiAgICAgICAgY29uc3QgcGFyZW50V29ybGRSb3RhdGlvbiA9IHRoaXMuX3BhcmVudFdvcmxkUm90YXRpb25zW2JvbmVOYW1lXSE7XG4gICAgICAgIGNvbnN0IGludlBhcmVudFdvcmxkUm90YXRpb24gPSBfcXVhdEEuY29weShwYXJlbnRXb3JsZFJvdGF0aW9uKS5pbnZlcnQoKTtcbiAgICAgICAgY29uc3QgYm9uZVJvdGF0aW9uID0gdGhpcy5fYm9uZVJvdGF0aW9uc1tib25lTmFtZV0hO1xuXG4gICAgICAgIGJvbmVOb2RlLnF1YXRlcm5pb25cbiAgICAgICAgICAuY29weShyaWdCb25lTm9kZS5xdWF0ZXJuaW9uKVxuICAgICAgICAgIC5tdWx0aXBseShwYXJlbnRXb3JsZFJvdGF0aW9uKVxuICAgICAgICAgIC5wcmVtdWx0aXBseShpbnZQYXJlbnRXb3JsZFJvdGF0aW9uKVxuICAgICAgICAgIC5tdWx0aXBseShib25lUm90YXRpb24pO1xuXG4gICAgICAgIC8vIE1vdmUgdGhlIG1hc3MgY2VudGVyIG9mIHRoZSBWUk1cbiAgICAgICAgaWYgKGJvbmVOYW1lID09PSAnaGlwcycpIHtcbiAgICAgICAgICBjb25zdCBib25lV29ybGRQb3NpdGlvbiA9IHJpZ0JvbmVOb2RlLmdldFdvcmxkUG9zaXRpb24oX2JvbmVXb3JsZFBvcyk7XG4gICAgICAgICAgYm9uZU5vZGUucGFyZW50IS51cGRhdGVXb3JsZE1hdHJpeCh0cnVlLCBmYWxzZSk7XG4gICAgICAgICAgY29uc3QgcGFyZW50V29ybGRNYXRyaXggPSBib25lTm9kZS5wYXJlbnQhLm1hdHJpeFdvcmxkO1xuICAgICAgICAgIGNvbnN0IGxvY2FsUG9zaXRpb24gPSBib25lV29ybGRQb3NpdGlvbi5hcHBseU1hdHJpeDQocGFyZW50V29ybGRNYXRyaXguaW52ZXJ0KCkpO1xuICAgICAgICAgIGJvbmVOb2RlLnBvc2l0aW9uLmNvcHkobG9jYWxQb3NpdGlvbik7XG4gICAgICAgIH1cbiAgICAgIH1cbiAgICB9KTtcbiAgfVxufVxuIiwgImltcG9ydCAqIGFzIFRIUkVFIGZyb20gJ3RocmVlJztcbmltcG9ydCB0eXBlIHsgVlJNSHVtYW5Cb25lIH0gZnJvbSAnLi9WUk1IdW1hbkJvbmUnO1xuaW1wb3J0IHR5cGUgeyBWUk1IdW1hbkJvbmVzIH0gZnJvbSAnLi9WUk1IdW1hbkJvbmVzJztcbmltcG9ydCB0eXBlIHsgVlJNSHVtYW5Cb25lTmFtZSB9IGZyb20gJy4vVlJNSHVtYW5Cb25lTmFtZSc7XG5pbXBvcnQgdHlwZSB7IFZSTVBvc2UgfSBmcm9tICcuL1ZSTVBvc2UnO1xuaW1wb3J0IHsgVlJNUmlnIH0gZnJvbSAnLi9WUk1SaWcnO1xuaW1wb3J0IHsgVlJNSHVtYW5vaWRSaWcgfSBmcm9tICcuL1ZSTUh1bWFub2lkUmlnJztcblxuLyoqXG4gKiBBIGNsYXNzIHJlcHJlc2VudHMgYSBodW1hbm9pZCBvZiBhIFZSTS5cbiAqL1xuZXhwb3J0IGNsYXNzIFZSTUh1bWFub2lkIHtcbiAgLyoqXG4gICAqIFdoZXRoZXIgaXQgY29waWVzIHBvc2UgZnJvbSBub3JtYWxpemVkSHVtYW5Cb25lcyB0byByYXdIdW1hbkJvbmVzIG9uIHtAbGluayB1cGRhdGV9LlxuICAgKiBgdHJ1ZWAgYnkgZGVmYXVsdC5cbiAgICpcbiAgICogQGRlZmF1bHQgdHJ1ZVxuICAgKi9cbiAgcHVibGljIGF1dG9VcGRhdGVIdW1hbkJvbmVzOiBib29sZWFuO1xuXG4gIC8qKlxuICAgKiBBIHJhdyByaWcgb2YgdGhlIFZSTS5cbiAgICovXG4gIHByaXZhdGUgX3Jhd0h1bWFuQm9uZXM6IFZSTVJpZzsgLy8gVE9ETzogUmVuYW1lXG5cbiAgLyoqXG4gICAqIEEgbm9ybWFsaXplZCByaWcgb2YgdGhlIFZSTS5cbiAgICovXG4gIHByaXZhdGUgX25vcm1hbGl6ZWRIdW1hbkJvbmVzOiBWUk1IdW1hbm9pZFJpZzsgLy8gVE9ETzogUmVuYW1lXG5cbiAgLyoqXG4gICAqIEBkZXByZWNhdGVkIERlcHJlY2F0ZWQuIFVzZSBlaXRoZXIge0BsaW5rIHJhd1Jlc3RQb3NlfSBvciB7QGxpbmsgbm9ybWFsaXplZFJlc3RQb3NlfSBpbnN0ZWFkLlxuICAgKi9cbiAgcHVibGljIGdldCByZXN0UG9zZSgpOiBWUk1Qb3NlIHtcbiAgICBjb25zb2xlLndhcm4oJ1ZSTUh1bWFub2lkOiByZXN0UG9zZSBpcyBkZXByZWNhdGVkLiBVc2UgZWl0aGVyIHJhd1Jlc3RQb3NlIG9yIG5vcm1hbGl6ZWRSZXN0UG9zZSBpbnN0ZWFkLicpO1xuXG4gICAgcmV0dXJuIHRoaXMucmF3UmVzdFBvc2U7XG4gIH1cblxuICAvKipcbiAgICogQSB7QGxpbmsgVlJNUG9zZX0gb2YgaXRzIHJhdyBodW1hbiBib25lcyB0aGF0IGlzIGl0cyBkZWZhdWx0IHN0YXRlLlxuICAgKiBOb3RlIHRoYXQgaXQncyBub3QgY29tcGF0aWJsZSB3aXRoIHtAbGluayBzZXRSYXdQb3NlfSBhbmQge0BsaW5rIGdldFJhd1Bvc2V9LCBzaW5jZSBpdCBjb250YWlucyBub24tcmVsYXRpdmUgdmFsdWVzIG9mIGVhY2ggbG9jYWwgdHJhbnNmb3Jtcy5cbiAgICovXG4gIHB1YmxpYyBnZXQgcmF3UmVzdFBvc2UoKTogVlJNUG9zZSB7XG4gICAgcmV0dXJuIHRoaXMuX3Jhd0h1bWFuQm9uZXMucmVzdFBvc2U7XG4gIH1cblxuICAvKipcbiAgICogQSB7QGxpbmsgVlJNUG9zZX0gb2YgaXRzIG5vcm1hbGl6ZWQgaHVtYW4gYm9uZXMgdGhhdCBpcyBpdHMgZGVmYXVsdCBzdGF0ZS5cbiAgICogTm90ZSB0aGF0IGl0J3Mgbm90IGNvbXBhdGlibGUgd2l0aCB7QGxpbmsgc2V0Tm9ybWFsaXplZFBvc2V9IGFuZCB7QGxpbmsgZ2V0Tm9ybWFsaXplZFBvc2V9LCBzaW5jZSBpdCBjb250YWlucyBub24tcmVsYXRpdmUgdmFsdWVzIG9mIGVhY2ggbG9jYWwgdHJhbnNmb3Jtcy5cbiAgICovXG4gIHB1YmxpYyBnZXQgbm9ybWFsaXplZFJlc3RQb3NlKCk6IFZSTVBvc2Uge1xuICAgIHJldHVybiB0aGlzLl9ub3JtYWxpemVkSHVtYW5Cb25lcy5yZXN0UG9zZTtcbiAgfVxuXG4gIC8qKlxuICAgKiBBIG1hcCBmcm9tIHtAbGluayBWUk1IdW1hbkJvbmVOYW1lfSB0byByYXcge0BsaW5rIFZSTUh1bWFuQm9uZX1zLlxuICAgKi9cbiAgcHVibGljIGdldCBodW1hbkJvbmVzKCk6IFZSTUh1bWFuQm9uZXMge1xuICAgIC8vIGFuIGFsaWFzIG9mIGByYXdIdW1hbkJvbmVzYFxuICAgIHJldHVybiB0aGlzLl9yYXdIdW1hbkJvbmVzLmh1bWFuQm9uZXM7XG4gIH1cblxuICAvKipcbiAgICogQSBtYXAgZnJvbSB7QGxpbmsgVlJNSHVtYW5Cb25lTmFtZX0gdG8gcmF3IHtAbGluayBWUk1IdW1hbkJvbmV9cy5cbiAgICovXG4gIHB1YmxpYyBnZXQgcmF3SHVtYW5Cb25lcygpOiBWUk1IdW1hbkJvbmVzIHtcbiAgICByZXR1cm4gdGhpcy5fcmF3SHVtYW5Cb25lcy5odW1hbkJvbmVzO1xuICB9XG5cbiAgLyoqXG4gICAqIEEgbWFwIGZyb20ge0BsaW5rIFZSTUh1bWFuQm9uZU5hbWV9IHRvIG5vcm1hbGl6ZWQge0BsaW5rIFZSTUh1bWFuQm9uZX1zLlxuICAgKi9cbiAgcHVibGljIGdldCBub3JtYWxpemVkSHVtYW5Cb25lcygpOiBWUk1IdW1hbkJvbmVzIHtcbiAgICByZXR1cm4gdGhpcy5fbm9ybWFsaXplZEh1bWFuQm9uZXMuaHVtYW5Cb25lcztcbiAgfVxuXG4gIC8qKlxuICAgKiBUaGUgcm9vdCBvZiBub3JtYWxpemVkIHtAbGluayBWUk1IdW1hbkJvbmV9cy5cbiAgICovXG4gIHB1YmxpYyBnZXQgbm9ybWFsaXplZEh1bWFuQm9uZXNSb290KCk6IFRIUkVFLk9iamVjdDNEIHtcbiAgICByZXR1cm4gdGhpcy5fbm9ybWFsaXplZEh1bWFuQm9uZXMucm9vdDtcbiAgfVxuXG4gIC8qKlxuICAgKiBDcmVhdGUgYSBuZXcge0BsaW5rIFZSTUh1bWFub2lkfS5cbiAgICogQHBhcmFtIGh1bWFuQm9uZXMgQSB7QGxpbmsgVlJNSHVtYW5Cb25lc30gY29udGFpbnMgYWxsIHRoZSBib25lcyBvZiB0aGUgbmV3IGh1bWFub2lkXG4gICAqIEBwYXJhbSBhdXRvVXBkYXRlSHVtYW5Cb25lcyBXaGV0aGVyIGl0IGNvcGllcyBwb3NlIGZyb20gbm9ybWFsaXplZEh1bWFuQm9uZXMgdG8gcmF3SHVtYW5Cb25lcyBvbiB7QGxpbmsgdXBkYXRlfS4gYHRydWVgIGJ5IGRlZmF1bHQuXG4gICAqL1xuICBwdWJsaWMgY29uc3RydWN0b3IoaHVtYW5Cb25lczogVlJNSHVtYW5Cb25lcywgb3B0aW9ucz86IHsgYXV0b1VwZGF0ZUh1bWFuQm9uZXM/OiBib29sZWFuIH0pIHtcbiAgICB0aGlzLmF1dG9VcGRhdGVIdW1hbkJvbmVzID0gb3B0aW9ucz8uYXV0b1VwZGF0ZUh1bWFuQm9uZXMgPz8gdHJ1ZTtcbiAgICB0aGlzLl9yYXdIdW1hbkJvbmVzID0gbmV3IFZSTVJpZyhodW1hbkJvbmVzKTtcbiAgICB0aGlzLl9ub3JtYWxpemVkSHVtYW5Cb25lcyA9IG5ldyBWUk1IdW1hbm9pZFJpZyh0aGlzLl9yYXdIdW1hbkJvbmVzKTtcbiAgfVxuXG4gIC8qKlxuICAgKiBDb3B5IHRoZSBnaXZlbiB7QGxpbmsgVlJNSHVtYW5vaWR9IGludG8gdGhpcyBvbmUuXG4gICAqIEBwYXJhbSBzb3VyY2UgVGhlIHtAbGluayBWUk1IdW1hbm9pZH0geW91IHdhbnQgdG8gY29weVxuICAgKiBAcmV0dXJucyB0aGlzXG4gICAqL1xuICBwdWJsaWMgY29weShzb3VyY2U6IFZSTUh1bWFub2lkKTogdGhpcyB7XG4gICAgdGhpcy5hdXRvVXBkYXRlSHVtYW5Cb25lcyA9IHNvdXJjZS5hdXRvVXBkYXRlSHVtYW5Cb25lcztcbiAgICB0aGlzLl9yYXdIdW1hbkJvbmVzID0gbmV3IFZSTVJpZyhzb3VyY2UuaHVtYW5Cb25lcyk7XG4gICAgdGhpcy5fbm9ybWFsaXplZEh1bWFuQm9uZXMgPSBuZXcgVlJNSHVtYW5vaWRSaWcodGhpcy5fcmF3SHVtYW5Cb25lcyk7XG5cbiAgICByZXR1cm4gdGhpcztcbiAgfVxuXG4gIC8qKlxuICAgKiBSZXR1cm5zIGEgY2xvbmUgb2YgdGhpcyB7QGxpbmsgVlJNSHVtYW5vaWR9LlxuICAgKiBAcmV0dXJucyBDb3BpZWQge0BsaW5rIFZSTUh1bWFub2lkfVxuICAgKi9cbiAgcHVibGljIGNsb25lKCk6IFZSTUh1bWFub2lkIHtcbiAgICByZXR1cm4gbmV3IFZSTUh1bWFub2lkKHRoaXMuaHVtYW5Cb25lcywgeyBhdXRvVXBkYXRlSHVtYW5Cb25lczogdGhpcy5hdXRvVXBkYXRlSHVtYW5Cb25lcyB9KS5jb3B5KHRoaXMpO1xuICB9XG5cbiAgLyoqXG4gICAqIEBkZXByZWNhdGVkIERlcHJlY2F0ZWQuIFVzZSBlaXRoZXIge0BsaW5rIGdldFJhd0Fic29sdXRlUG9zZX0gb3Ige0BsaW5rIGdldE5vcm1hbGl6ZWRBYnNvbHV0ZVBvc2V9IGluc3RlYWQuXG4gICAqL1xuICBwdWJsaWMgZ2V0QWJzb2x1dGVQb3NlKCk6IFZSTVBvc2Uge1xuICAgIGNvbnNvbGUud2FybihcbiAgICAgICdWUk1IdW1hbm9pZDogZ2V0QWJzb2x1dGVQb3NlKCkgaXMgZGVwcmVjYXRlZC4gVXNlIGVpdGhlciBnZXRSYXdBYnNvbHV0ZVBvc2UoKSBvciBnZXROb3JtYWxpemVkQWJzb2x1dGVQb3NlKCkgaW5zdGVhZC4nLFxuICAgICk7XG5cbiAgICByZXR1cm4gdGhpcy5nZXRSYXdBYnNvbHV0ZVBvc2UoKTtcbiAgfVxuXG4gIC8qKlxuICAgKiBSZXR1cm4gdGhlIGN1cnJlbnQgYWJzb2x1dGUgcG9zZSBvZiB0aGlzIHJhdyBodW1hbiBib25lcyBhcyBhIHtAbGluayBWUk1Qb3NlfS5cbiAgICogTm90ZSB0aGF0IHRoZSBvdXRwdXQgcmVzdWx0IHdpbGwgY29udGFpbiBpbml0aWFsIHN0YXRlIG9mIHRoZSBWUk0gYW5kIG5vdCBjb21wYXRpYmxlIGJldHdlZW4gZGlmZmVyZW50IG1vZGVscy5cbiAgICogWW91IG1pZ2h0IHdhbnQgdG8gdXNlIHtAbGluayBnZXRSYXdQb3NlfSBpbnN0ZWFkLlxuICAgKi9cbiAgcHVibGljIGdldFJhd0Fic29sdXRlUG9zZSgpOiBWUk1Qb3NlIHtcbiAgICByZXR1cm4gdGhpcy5fcmF3SHVtYW5Cb25lcy5nZXRBYnNvbHV0ZVBvc2UoKTtcbiAgfVxuXG4gIC8qKlxuICAgKiBSZXR1cm4gdGhlIGN1cnJlbnQgYWJzb2x1dGUgcG9zZSBvZiB0aGlzIG5vcm1hbGl6ZWQgaHVtYW4gYm9uZXMgYXMgYSB7QGxpbmsgVlJNUG9zZX0uXG4gICAqIE5vdGUgdGhhdCB0aGUgb3V0cHV0IHJlc3VsdCB3aWxsIGNvbnRhaW4gaW5pdGlhbCBzdGF0ZSBvZiB0aGUgVlJNIGFuZCBub3QgY29tcGF0aWJsZSBiZXR3ZWVuIGRpZmZlcmVudCBtb2RlbHMuXG4gICAqIFlvdSBtaWdodCB3YW50IHRvIHVzZSB7QGxpbmsgZ2V0Tm9ybWFsaXplZFBvc2V9IGluc3RlYWQuXG4gICAqL1xuICBwdWJsaWMgZ2V0Tm9ybWFsaXplZEFic29sdXRlUG9zZSgpOiBWUk1Qb3NlIHtcbiAgICByZXR1cm4gdGhpcy5fbm9ybWFsaXplZEh1bWFuQm9uZXMuZ2V0QWJzb2x1dGVQb3NlKCk7XG4gIH1cblxuICAvKipcbiAgICogQGRlcHJlY2F0ZWQgRGVwcmVjYXRlZC4gVXNlIGVpdGhlciB7QGxpbmsgZ2V0UmF3UG9zZX0gb3Ige0BsaW5rIGdldE5vcm1hbGl6ZWRQb3NlfSBpbnN0ZWFkLlxuICAgKi9cbiAgcHVibGljIGdldFBvc2UoKTogVlJNUG9zZSB7XG4gICAgY29uc29sZS53YXJuKCdWUk1IdW1hbm9pZDogZ2V0UG9zZSgpIGlzIGRlcHJlY2F0ZWQuIFVzZSBlaXRoZXIgZ2V0UmF3UG9zZSgpIG9yIGdldE5vcm1hbGl6ZWRQb3NlKCkgaW5zdGVhZC4nKTtcblxuICAgIHJldHVybiB0aGlzLmdldFJhd1Bvc2UoKTtcbiAgfVxuXG4gIC8qKlxuICAgKiBSZXR1cm4gdGhlIGN1cnJlbnQgcG9zZSBvZiByYXcgaHVtYW4gYm9uZXMgYXMgYSB7QGxpbmsgVlJNUG9zZX0uXG4gICAqXG4gICAqIEVhY2ggdHJhbnNmb3JtIGlzIGEgbG9jYWwgdHJhbnNmb3JtIHJlbGF0aXZlIGZyb20gcmVzdCBwb3NlIChULXBvc2UpLlxuICAgKi9cbiAgcHVibGljIGdldFJhd1Bvc2UoKTogVlJNUG9zZSB7XG4gICAgcmV0dXJuIHRoaXMuX3Jhd0h1bWFuQm9uZXMuZ2V0UG9zZSgpO1xuICB9XG5cbiAgLyoqXG4gICAqIFJldHVybiB0aGUgY3VycmVudCBwb3NlIG9mIG5vcm1hbGl6ZWQgaHVtYW4gYm9uZXMgYXMgYSB7QGxpbmsgVlJNUG9zZX0uXG4gICAqXG4gICAqIEVhY2ggdHJhbnNmb3JtIGlzIGEgbG9jYWwgdHJhbnNmb3JtIHJlbGF0aXZlIGZyb20gcmVzdCBwb3NlIChULXBvc2UpLlxuICAgKi9cbiAgcHVibGljIGdldE5vcm1hbGl6ZWRQb3NlKCk6IFZSTVBvc2Uge1xuICAgIHJldHVybiB0aGlzLl9ub3JtYWxpemVkSHVtYW5Cb25lcy5nZXRQb3NlKCk7XG4gIH1cblxuICAvKipcbiAgICogQGRlcHJlY2F0ZWQgRGVwcmVjYXRlZC4gVXNlIGVpdGhlciB7QGxpbmsgc2V0UmF3UG9zZX0gb3Ige0BsaW5rIHNldE5vcm1hbGl6ZWRQb3NlfSBpbnN0ZWFkLlxuICAgKi9cbiAgcHVibGljIHNldFBvc2UocG9zZU9iamVjdDogVlJNUG9zZSk6IHZvaWQge1xuICAgIGNvbnNvbGUud2FybignVlJNSHVtYW5vaWQ6IHNldFBvc2UoKSBpcyBkZXByZWNhdGVkLiBVc2UgZWl0aGVyIHNldFJhd1Bvc2UoKSBvciBzZXROb3JtYWxpemVkUG9zZSgpIGluc3RlYWQuJyk7XG5cbiAgICByZXR1cm4gdGhpcy5zZXRSYXdQb3NlKHBvc2VPYmplY3QpO1xuICB9XG5cbiAgLyoqXG4gICAqIExldCB0aGUgcmF3IGh1bWFuIGJvbmVzIGRvIGEgc3BlY2lmaWVkIHBvc2UuXG4gICAqXG4gICAqIEVhY2ggdHJhbnNmb3JtIGhhdmUgdG8gYmUgYSBsb2NhbCB0cmFuc2Zvcm0gcmVsYXRpdmUgZnJvbSByZXN0IHBvc2UgKFQtcG9zZSkuXG4gICAqIFlvdSBjYW4gcGFzcyB3aGF0IHlvdSBnb3QgZnJvbSB7QGxpbmsgZ2V0UmF3UG9zZX0uXG4gICAqXG4gICAqIElmIHlvdSBhcmUgdXNpbmcge0BsaW5rIGF1dG9VcGRhdGVIdW1hbkJvbmVzfSwgeW91IG1pZ2h0IHdhbnQgdG8gdXNlIHtAbGluayBzZXROb3JtYWxpemVkUG9zZX0gaW5zdGVhZC5cbiAgICpcbiAgICogQHBhcmFtIHBvc2VPYmplY3QgQSB7QGxpbmsgVlJNUG9zZX0gdGhhdCByZXByZXNlbnRzIGEgc2luZ2xlIHBvc2VcbiAgICovXG4gIHB1YmxpYyBzZXRSYXdQb3NlKHBvc2VPYmplY3Q6IFZSTVBvc2UpOiB2b2lkIHtcbiAgICByZXR1cm4gdGhpcy5fcmF3SHVtYW5Cb25lcy5zZXRQb3NlKHBvc2VPYmplY3QpO1xuICB9XG5cbiAgLyoqXG4gICAqIExldCB0aGUgbm9ybWFsaXplZCBodW1hbiBib25lcyBkbyBhIHNwZWNpZmllZCBwb3NlLlxuICAgKlxuICAgKiBFYWNoIHRyYW5zZm9ybSBoYXZlIHRvIGJlIGEgbG9jYWwgdHJhbnNmb3JtIHJlbGF0aXZlIGZyb20gcmVzdCBwb3NlIChULXBvc2UpLlxuICAgKiBZb3UgY2FuIHBhc3Mgd2hhdCB5b3UgZ290IGZyb20ge0BsaW5rIGdldE5vcm1hbGl6ZWRQb3NlfS5cbiAgICpcbiAgICogQHBhcmFtIHBvc2VPYmplY3QgQSB7QGxpbmsgVlJNUG9zZX0gdGhhdCByZXByZXNlbnRzIGEgc2luZ2xlIHBvc2VcbiAgICovXG4gIHB1YmxpYyBzZXROb3JtYWxpemVkUG9zZShwb3NlT2JqZWN0OiBWUk1Qb3NlKTogdm9pZCB7XG4gICAgcmV0dXJuIHRoaXMuX25vcm1hbGl6ZWRIdW1hbkJvbmVzLnNldFBvc2UocG9zZU9iamVjdCk7XG4gIH1cblxuICAvKipcbiAgICogQGRlcHJlY2F0ZWQgRGVwcmVjYXRlZC4gVXNlIGVpdGhlciB7QGxpbmsgcmVzZXRSYXdQb3NlfSBvciB7QGxpbmsgcmVzZXROb3JtYWxpemVkUG9zZX0gaW5zdGVhZC5cbiAgICovXG4gIHB1YmxpYyByZXNldFBvc2UoKTogdm9pZCB7XG4gICAgY29uc29sZS53YXJuKCdWUk1IdW1hbm9pZDogcmVzZXRQb3NlKCkgaXMgZGVwcmVjYXRlZC4gVXNlIGVpdGhlciByZXNldFJhd1Bvc2UoKSBvciByZXNldE5vcm1hbGl6ZWRQb3NlKCkgaW5zdGVhZC4nKTtcblxuICAgIHJldHVybiB0aGlzLnJlc2V0UmF3UG9zZSgpO1xuICB9XG5cbiAgLyoqXG4gICAqIFJlc2V0IHRoZSByYXcgaHVtYW5vaWQgdG8gaXRzIHJlc3QgcG9zZS5cbiAgICpcbiAgICogSWYgeW91IGFyZSB1c2luZyB7QGxpbmsgYXV0b1VwZGF0ZUh1bWFuQm9uZXN9LCB5b3UgbWlnaHQgd2FudCB0byB1c2Uge0BsaW5rIHJlc2V0Tm9ybWFsaXplZFBvc2V9IGluc3RlYWQuXG4gICAqL1xuICBwdWJsaWMgcmVzZXRSYXdQb3NlKCk6IHZvaWQge1xuICAgIHJldHVybiB0aGlzLl9yYXdIdW1hbkJvbmVzLnJlc2V0UG9zZSgpO1xuICB9XG5cbiAgLyoqXG4gICAqIFJlc2V0IHRoZSBub3JtYWxpemVkIGh1bWFub2lkIHRvIGl0cyByZXN0IHBvc2UuXG4gICAqL1xuICBwdWJsaWMgcmVzZXROb3JtYWxpemVkUG9zZSgpOiB2b2lkIHtcbiAgICByZXR1cm4gdGhpcy5fbm9ybWFsaXplZEh1bWFuQm9uZXMucmVzZXRQb3NlKCk7XG4gIH1cblxuICAvKipcbiAgICogQGRlcHJlY2F0ZWQgRGVwcmVjYXRlZC4gVXNlIGVpdGhlciB7QGxpbmsgZ2V0UmF3Qm9uZX0gb3Ige0BsaW5rIGdldE5vcm1hbGl6ZWRCb25lfSBpbnN0ZWFkLlxuICAgKi9cbiAgcHVibGljIGdldEJvbmUobmFtZTogVlJNSHVtYW5Cb25lTmFtZSk6IFZSTUh1bWFuQm9uZSB8IHVuZGVmaW5lZCB7XG4gICAgY29uc29sZS53YXJuKCdWUk1IdW1hbm9pZDogZ2V0Qm9uZSgpIGlzIGRlcHJlY2F0ZWQuIFVzZSBlaXRoZXIgZ2V0UmF3Qm9uZSgpIG9yIGdldE5vcm1hbGl6ZWRCb25lKCkgaW5zdGVhZC4nKTtcblxuICAgIHJldHVybiB0aGlzLmdldFJhd0JvbmUobmFtZSk7XG4gIH1cblxuICAvKipcbiAgICogUmV0dXJuIGEgcmF3IHtAbGluayBWUk1IdW1hbkJvbmV9IGJvdW5kIHRvIGEgc3BlY2lmaWVkIHtAbGluayBWUk1IdW1hbkJvbmVOYW1lfS5cbiAgICpcbiAgICogQHBhcmFtIG5hbWUgTmFtZSBvZiB0aGUgYm9uZSB5b3Ugd2FudFxuICAgKi9cbiAgcHVibGljIGdldFJhd0JvbmUobmFtZTogVlJNSHVtYW5Cb25lTmFtZSk6IFZSTUh1bWFuQm9uZSB8IHVuZGVmaW5lZCB7XG4gICAgcmV0dXJuIHRoaXMuX3Jhd0h1bWFuQm9uZXMuZ2V0Qm9uZShuYW1lKTtcbiAgfVxuXG4gIC8qKlxuICAgKiBSZXR1cm4gYSBub3JtYWxpemVkIHtAbGluayBWUk1IdW1hbkJvbmV9IGJvdW5kIHRvIGEgc3BlY2lmaWVkIHtAbGluayBWUk1IdW1hbkJvbmVOYW1lfS5cbiAgICpcbiAgICogQHBhcmFtIG5hbWUgTmFtZSBvZiB0aGUgYm9uZSB5b3Ugd2FudFxuICAgKi9cbiAgcHVibGljIGdldE5vcm1hbGl6ZWRCb25lKG5hbWU6IFZSTUh1bWFuQm9uZU5hbWUpOiBWUk1IdW1hbkJvbmUgfCB1bmRlZmluZWQge1xuICAgIHJldHVybiB0aGlzLl9ub3JtYWxpemVkSHVtYW5Cb25lcy5nZXRCb25lKG5hbWUpO1xuICB9XG5cbiAgLyoqXG4gICAqIEBkZXByZWNhdGVkIERlcHJlY2F0ZWQuIFVzZSBlaXRoZXIge0BsaW5rIGdldFJhd0JvbmVOb2RlfSBvciB7QGxpbmsgZ2V0Tm9ybWFsaXplZEJvbmVOb2RlfSBpbnN0ZWFkLlxuICAgKi9cbiAgcHVibGljIGdldEJvbmVOb2RlKG5hbWU6IFZSTUh1bWFuQm9uZU5hbWUpOiBUSFJFRS5PYmplY3QzRCB8IG51bGwge1xuICAgIGNvbnNvbGUud2FybihcbiAgICAgICdWUk1IdW1hbm9pZDogZ2V0Qm9uZU5vZGUoKSBpcyBkZXByZWNhdGVkLiBVc2UgZWl0aGVyIGdldFJhd0JvbmVOb2RlKCkgb3IgZ2V0Tm9ybWFsaXplZEJvbmVOb2RlKCkgaW5zdGVhZC4nLFxuICAgICk7XG5cbiAgICByZXR1cm4gdGhpcy5nZXRSYXdCb25lTm9kZShuYW1lKTtcbiAgfVxuXG4gIC8qKlxuICAgKiBSZXR1cm4gYSByYXcgYm9uZSBhcyBhIGBUSFJFRS5PYmplY3QzRGAgYm91bmQgdG8gYSBzcGVjaWZpZWQge0BsaW5rIFZSTUh1bWFuQm9uZU5hbWV9LlxuICAgKlxuICAgKiBAcGFyYW0gbmFtZSBOYW1lIG9mIHRoZSBib25lIHlvdSB3YW50XG4gICAqL1xuICBwdWJsaWMgZ2V0UmF3Qm9uZU5vZGUobmFtZTogVlJNSHVtYW5Cb25lTmFtZSk6IFRIUkVFLk9iamVjdDNEIHwgbnVsbCB7XG4gICAgcmV0dXJuIHRoaXMuX3Jhd0h1bWFuQm9uZXMuZ2V0Qm9uZU5vZGUobmFtZSk7XG4gIH1cblxuICAvKipcbiAgICogUmV0dXJuIGEgbm9ybWFsaXplZCBib25lIGFzIGEgYFRIUkVFLk9iamVjdDNEYCBib3VuZCB0byBhIHNwZWNpZmllZCB7QGxpbmsgVlJNSHVtYW5Cb25lTmFtZX0uXG4gICAqXG4gICAqIEBwYXJhbSBuYW1lIE5hbWUgb2YgdGhlIGJvbmUgeW91IHdhbnRcbiAgICovXG4gIHB1YmxpYyBnZXROb3JtYWxpemVkQm9uZU5vZGUobmFtZTogVlJNSHVtYW5Cb25lTmFtZSk6IFRIUkVFLk9iamVjdDNEIHwgbnVsbCB7XG4gICAgcmV0dXJuIHRoaXMuX25vcm1hbGl6ZWRIdW1hbkJvbmVzLmdldEJvbmVOb2RlKG5hbWUpO1xuICB9XG5cbiAgLyoqXG4gICAqIFVwZGF0ZSB0aGUgaHVtYW5vaWQgY29tcG9uZW50LlxuICAgKlxuICAgKiBJZiB7QGxpbmsgYXV0b1VwZGF0ZUh1bWFuQm9uZXN9IGlzIGB0cnVlYCwgaXQgdHJhbnNmZXJzIHRoZSBwb3NlIG9mIG5vcm1hbGl6ZWQgaHVtYW4gYm9uZXMgdG8gcmF3IGh1bWFuIGJvbmVzLlxuICAgKi9cbiAgcHVibGljIHVwZGF0ZSgpOiB2b2lkIHtcbiAgICBpZiAodGhpcy5hdXRvVXBkYXRlSHVtYW5Cb25lcykge1xuICAgICAgdGhpcy5fbm9ybWFsaXplZEh1bWFuQm9uZXMudXBkYXRlKCk7XG4gICAgfVxuICB9XG59XG4iLCAiLyogZXNsaW50LWRpc2FibGUgQHR5cGVzY3JpcHQtZXNsaW50L25hbWluZy1jb252ZW50aW9uICovXG5cbmV4cG9ydCBjb25zdCBWUk1SZXF1aXJlZEh1bWFuQm9uZU5hbWUgPSB7XG4gIEhpcHM6ICdoaXBzJyxcbiAgU3BpbmU6ICdzcGluZScsXG4gIEhlYWQ6ICdoZWFkJyxcbiAgTGVmdFVwcGVyTGVnOiAnbGVmdFVwcGVyTGVnJyxcbiAgTGVmdExvd2VyTGVnOiAnbGVmdExvd2VyTGVnJyxcbiAgTGVmdEZvb3Q6ICdsZWZ0Rm9vdCcsXG4gIFJpZ2h0VXBwZXJMZWc6ICdyaWdodFVwcGVyTGVnJyxcbiAgUmlnaHRMb3dlckxlZzogJ3JpZ2h0TG93ZXJMZWcnLFxuICBSaWdodEZvb3Q6ICdyaWdodEZvb3QnLFxuICBMZWZ0VXBwZXJBcm06ICdsZWZ0VXBwZXJBcm0nLFxuICBMZWZ0TG93ZXJBcm06ICdsZWZ0TG93ZXJBcm0nLFxuICBMZWZ0SGFuZDogJ2xlZnRIYW5kJyxcbiAgUmlnaHRVcHBlckFybTogJ3JpZ2h0VXBwZXJBcm0nLFxuICBSaWdodExvd2VyQXJtOiAncmlnaHRMb3dlckFybScsXG4gIFJpZ2h0SGFuZDogJ3JpZ2h0SGFuZCcsXG59IGFzIGNvbnN0O1xuXG5leHBvcnQgdHlwZSBWUk1SZXF1aXJlZEh1bWFuQm9uZU5hbWUgPSAodHlwZW9mIFZSTVJlcXVpcmVkSHVtYW5Cb25lTmFtZSlba2V5b2YgdHlwZW9mIFZSTVJlcXVpcmVkSHVtYW5Cb25lTmFtZV07XG4iLCAiaW1wb3J0IHR5cGUgKiBhcyBUSFJFRSBmcm9tICd0aHJlZSc7XG5pbXBvcnQgdHlwZSAqIGFzIFYwVlJNIGZyb20gJ0BwaXhpdi90eXBlcy12cm0tMC4wJztcbmltcG9ydCB0eXBlICogYXMgVjFWUk1TY2hlbWEgZnJvbSAnQHBpeGl2L3R5cGVzLXZybWMtdnJtLTEuMCc7XG5pbXBvcnQgdHlwZSB7IEdMVEYsIEdMVEZMb2FkZXJQbHVnaW4sIEdMVEZQYXJzZXIgfSBmcm9tICd0aHJlZS9leGFtcGxlcy9qc20vbG9hZGVycy9HTFRGTG9hZGVyLmpzJztcbmltcG9ydCB7IFZSTUh1bWFub2lkIH0gZnJvbSAnLi9WUk1IdW1hbm9pZCc7XG5pbXBvcnQgdHlwZSB7IFZSTUh1bWFuQm9uZXMgfSBmcm9tICcuL1ZSTUh1bWFuQm9uZXMnO1xuaW1wb3J0IHsgVlJNUmVxdWlyZWRIdW1hbkJvbmVOYW1lIH0gZnJvbSAnLi9WUk1SZXF1aXJlZEh1bWFuQm9uZU5hbWUnO1xuaW1wb3J0IHsgR0xURiBhcyBHTFRGU2NoZW1hIH0gZnJvbSAnQGdsdGYtdHJhbnNmb3JtL2NvcmUnO1xuaW1wb3J0IHsgVlJNSHVtYW5vaWRIZWxwZXIgfSBmcm9tICcuL2hlbHBlcnMvVlJNSHVtYW5vaWRIZWxwZXInO1xuaW1wb3J0IHsgVlJNSHVtYW5vaWRMb2FkZXJQbHVnaW5PcHRpb25zIH0gZnJvbSAnLi9WUk1IdW1hbm9pZExvYWRlclBsdWdpbk9wdGlvbnMnO1xuXG4vKipcbiAqIFBvc3NpYmxlIHNwZWMgdmVyc2lvbnMgaXQgcmVjb2duaXplcy5cbiAqL1xuY29uc3QgUE9TU0lCTEVfU1BFQ19WRVJTSU9OUyA9IG5ldyBTZXQoWycxLjAnLCAnMS4wLWJldGEnXSk7XG5cbi8qKlxuICogQSBtYXAgZnJvbSBvbGQgdGh1bWIgYm9uZSBuYW1lcyB0byBuZXcgdGh1bWIgYm9uZSBuYW1lc1xuICovXG5jb25zdCB0aHVtYkJvbmVOYW1lTWFwOiB7IFtrZXk6IHN0cmluZ106IFYxVlJNU2NoZW1hLkh1bWFub2lkSHVtYW5Cb25lTmFtZSB8IHVuZGVmaW5lZCB9ID0ge1xuICBsZWZ0VGh1bWJQcm94aW1hbDogJ2xlZnRUaHVtYk1ldGFjYXJwYWwnLFxuICBsZWZ0VGh1bWJJbnRlcm1lZGlhdGU6ICdsZWZ0VGh1bWJQcm94aW1hbCcsXG4gIHJpZ2h0VGh1bWJQcm94aW1hbDogJ3JpZ2h0VGh1bWJNZXRhY2FycGFsJyxcbiAgcmlnaHRUaHVtYkludGVybWVkaWF0ZTogJ3JpZ2h0VGh1bWJQcm94aW1hbCcsXG59O1xuXG4vKipcbiAqIEEgcGx1Z2luIG9mIEdMVEZMb2FkZXIgdGhhdCBpbXBvcnRzIGEge0BsaW5rIFZSTUh1bWFub2lkfSBmcm9tIGEgVlJNIGV4dGVuc2lvbiBvZiBhIEdMVEYuXG4gKi9cbmV4cG9ydCBjbGFzcyBWUk1IdW1hbm9pZExvYWRlclBsdWdpbiBpbXBsZW1lbnRzIEdMVEZMb2FkZXJQbHVnaW4ge1xuICAvKipcbiAgICogU3BlY2lmeSBhbiBPYmplY3QzRCB0byBhZGQge0BsaW5rIFZSTUh1bWFub2lkSGVscGVyfS5cbiAgICogSWYgbm90IHNwZWNpZmllZCwgaGVscGVyIHdpbGwgbm90IGJlIGNyZWF0ZWQuXG4gICAqIElmIGByZW5kZXJPcmRlcmAgaXMgc2V0IHRvIHRoZSByb290LCB0aGUgaGVscGVyIHdpbGwgY29weSB0aGUgc2FtZSBgcmVuZGVyT3JkZXJgIC5cbiAgICovXG4gIHB1YmxpYyBoZWxwZXJSb290PzogVEhSRUUuT2JqZWN0M0Q7XG5cbiAgcHVibGljIGF1dG9VcGRhdGVIdW1hbkJvbmVzPzogYm9vbGVhbjtcblxuICBwdWJsaWMgcmVhZG9ubHkgcGFyc2VyOiBHTFRGUGFyc2VyO1xuXG4gIHB1YmxpYyBnZXQgbmFtZSgpOiBzdHJpbmcge1xuICAgIC8vIFdlIHNob3VsZCB1c2UgdGhlIGV4dGVuc2lvbiBuYW1lIGluc3RlYWQgYnV0IHdlIGhhdmUgbXVsdGlwbGUgcGx1Z2lucyBmb3IgYW4gZXh0ZW5zaW9uLi4uXG4gICAgcmV0dXJuICdWUk1IdW1hbm9pZExvYWRlclBsdWdpbic7XG4gIH1cblxuICBwdWJsaWMgY29uc3RydWN0b3IocGFyc2VyOiBHTFRGUGFyc2VyLCBvcHRpb25zPzogVlJNSHVtYW5vaWRMb2FkZXJQbHVnaW5PcHRpb25zKSB7XG4gICAgdGhpcy5wYXJzZXIgPSBwYXJzZXI7XG5cbiAgICB0aGlzLmhlbHBlclJvb3QgPSBvcHRpb25zPy5oZWxwZXJSb290O1xuICAgIHRoaXMuYXV0b1VwZGF0ZUh1bWFuQm9uZXMgPSBvcHRpb25zPy5hdXRvVXBkYXRlSHVtYW5Cb25lcztcbiAgfVxuXG4gIHB1YmxpYyBhc3luYyBhZnRlclJvb3QoZ2x0ZjogR0xURik6IFByb21pc2U8dm9pZD4ge1xuICAgIGdsdGYudXNlckRhdGEudnJtSHVtYW5vaWQgPSBhd2FpdCB0aGlzLl9pbXBvcnQoZ2x0Zik7XG4gIH1cblxuICAvKipcbiAgICogSW1wb3J0IGEge0BsaW5rIFZSTUh1bWFub2lkfSBmcm9tIGEgVlJNLlxuICAgKlxuICAgKiBAcGFyYW0gZ2x0ZiBBIHBhcnNlZCByZXN1bHQgb2YgR0xURiB0YWtlbiBmcm9tIEdMVEZMb2FkZXJcbiAgICovXG4gIHByaXZhdGUgYXN5bmMgX2ltcG9ydChnbHRmOiBHTFRGKTogUHJvbWlzZTxWUk1IdW1hbm9pZCB8IG51bGw+IHtcbiAgICBjb25zdCB2MVJlc3VsdCA9IGF3YWl0IHRoaXMuX3YxSW1wb3J0KGdsdGYpO1xuICAgIGlmICh2MVJlc3VsdCkge1xuICAgICAgcmV0dXJuIHYxUmVzdWx0O1xuICAgIH1cblxuICAgIGNvbnN0IHYwUmVzdWx0ID0gYXdhaXQgdGhpcy5fdjBJbXBvcnQoZ2x0Zik7XG4gICAgaWYgKHYwUmVzdWx0KSB7XG4gICAgICByZXR1cm4gdjBSZXN1bHQ7XG4gICAgfVxuXG4gICAgcmV0dXJuIG51bGw7XG4gIH1cblxuICBwcml2YXRlIGFzeW5jIF92MUltcG9ydChnbHRmOiBHTFRGKTogUHJvbWlzZTxWUk1IdW1hbm9pZCB8IG51bGw+IHtcbiAgICBjb25zdCBqc29uID0gdGhpcy5wYXJzZXIuanNvbiBhcyBHTFRGU2NoZW1hLklHTFRGO1xuXG4gICAgLy8gZWFybHkgYWJvcnQgaWYgaXQgZG9lc24ndCB1c2UgdnJtXG4gICAgY29uc3QgaXNWUk1Vc2VkID0ganNvbi5leHRlbnNpb25zVXNlZD8uaW5kZXhPZignVlJNQ192cm0nKSAhPT0gLTE7XG4gICAgaWYgKCFpc1ZSTVVzZWQpIHtcbiAgICAgIHJldHVybiBudWxsO1xuICAgIH1cblxuICAgIGNvbnN0IGV4dGVuc2lvbiA9IGpzb24uZXh0ZW5zaW9ucz8uWydWUk1DX3ZybSddIGFzIFYxVlJNU2NoZW1hLlZSTUNWUk0gfCB1bmRlZmluZWQ7XG4gICAgaWYgKCFleHRlbnNpb24pIHtcbiAgICAgIHJldHVybiBudWxsO1xuICAgIH1cblxuICAgIGNvbnN0IHNwZWNWZXJzaW9uID0gZXh0ZW5zaW9uLnNwZWNWZXJzaW9uO1xuICAgIGlmICghUE9TU0lCTEVfU1BFQ19WRVJTSU9OUy5oYXMoc3BlY1ZlcnNpb24pKSB7XG4gICAgICBjb25zb2xlLndhcm4oYFZSTUh1bWFub2lkTG9hZGVyUGx1Z2luOiBVbmtub3duIFZSTUNfdnJtIHNwZWNWZXJzaW9uIFwiJHtzcGVjVmVyc2lvbn1cImApO1xuICAgICAgcmV0dXJuIG51bGw7XG4gICAgfVxuXG4gICAgY29uc3Qgc2NoZW1hSHVtYW5vaWQgPSBleHRlbnNpb24uaHVtYW5vaWQ7XG4gICAgaWYgKCFzY2hlbWFIdW1hbm9pZCkge1xuICAgICAgcmV0dXJuIG51bGw7XG4gICAgfVxuXG4gICAgLyoqXG4gICAgICogY29tcGF0OiAxLjAtYmV0YSB0aHVtYiBib25lIG5hbWVzXG4gICAgICpcbiAgICAgKiBgdHJ1ZWAgaWYgYGxlZnRUaHVtYkludGVybWVkaWF0ZWAgb3IgYHJpZ2h0VGh1bWJJbnRlcm1lZGlhdGVgIGV4aXN0c1xuICAgICAqL1xuICAgIGNvbnN0IGV4aXN0c1ByZXZpb3VzVGh1bWJOYW1lID1cbiAgICAgIChzY2hlbWFIdW1hbm9pZC5odW1hbkJvbmVzIGFzIGFueSkubGVmdFRodW1iSW50ZXJtZWRpYXRlICE9IG51bGwgfHxcbiAgICAgIChzY2hlbWFIdW1hbm9pZC5odW1hbkJvbmVzIGFzIGFueSkucmlnaHRUaHVtYkludGVybWVkaWF0ZSAhPSBudWxsO1xuXG4gICAgY29uc3QgaHVtYW5Cb25lczogUGFydGlhbDxWUk1IdW1hbkJvbmVzPiA9IHt9O1xuICAgIGlmIChzY2hlbWFIdW1hbm9pZC5odW1hbkJvbmVzICE9IG51bGwpIHtcbiAgICAgIGF3YWl0IFByb21pc2UuYWxsKFxuICAgICAgICBPYmplY3QuZW50cmllcyhzY2hlbWFIdW1hbm9pZC5odW1hbkJvbmVzKS5tYXAoYXN5bmMgKFtib25lTmFtZVN0cmluZywgc2NoZW1hSHVtYW5Cb25lXSkgPT4ge1xuICAgICAgICAgIGxldCBib25lTmFtZSA9IGJvbmVOYW1lU3RyaW5nIGFzIFYxVlJNU2NoZW1hLkh1bWFub2lkSHVtYW5Cb25lTmFtZTtcbiAgICAgICAgICBjb25zdCBpbmRleCA9IHNjaGVtYUh1bWFuQm9uZS5ub2RlO1xuXG4gICAgICAgICAgLy8gY29tcGF0OiAxLjAtYmV0YSBwcmV2aW91cyB0aHVtYiBib25lIG5hbWVzXG4gICAgICAgICAgaWYgKGV4aXN0c1ByZXZpb3VzVGh1bWJOYW1lKSB7XG4gICAgICAgICAgICBjb25zdCB0aHVtYkJvbmVOYW1lID0gdGh1bWJCb25lTmFtZU1hcFtib25lTmFtZV07XG4gICAgICAgICAgICBpZiAodGh1bWJCb25lTmFtZSAhPSBudWxsKSB7XG4gICAgICAgICAgICAgIGJvbmVOYW1lID0gdGh1bWJCb25lTmFtZTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICB9XG5cbiAgICAgICAgICBjb25zdCBub2RlID0gYXdhaXQgdGhpcy5wYXJzZXIuZ2V0RGVwZW5kZW5jeSgnbm9kZScsIGluZGV4KTtcblxuICAgICAgICAgIC8vIGlmIHRoZSBzcGVjaWZpZWQgbm9kZSBkb2VzIG5vdCBleGlzdCwgZW1pdCBhIHdhcm5pbmdcbiAgICAgICAgICBpZiAobm9kZSA9PSBudWxsKSB7XG4gICAgICAgICAgICBjb25zb2xlLndhcm4oYEEgZ2xURiBub2RlIGJvdW5kIHRvIHRoZSBodW1hbm9pZCBib25lICR7Ym9uZU5hbWV9IChpbmRleCA9ICR7aW5kZXh9KSBkb2VzIG5vdCBleGlzdGApO1xuICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICAgIH1cblxuICAgICAgICAgIC8vIHNldCB0byB0aGUgYGh1bWFuQm9uZXNgXG4gICAgICAgICAgaHVtYW5Cb25lc1tib25lTmFtZV0gPSB7IG5vZGUgfTtcbiAgICAgICAgfSksXG4gICAgICApO1xuICAgIH1cblxuICAgIGNvbnN0IGh1bWFub2lkID0gbmV3IFZSTUh1bWFub2lkKHRoaXMuX2Vuc3VyZVJlcXVpcmVkQm9uZXNFeGlzdChodW1hbkJvbmVzKSwge1xuICAgICAgYXV0b1VwZGF0ZUh1bWFuQm9uZXM6IHRoaXMuYXV0b1VwZGF0ZUh1bWFuQm9uZXMsXG4gICAgfSk7XG4gICAgZ2x0Zi5zY2VuZS5hZGQoaHVtYW5vaWQubm9ybWFsaXplZEh1bWFuQm9uZXNSb290KTtcblxuICAgIGlmICh0aGlzLmhlbHBlclJvb3QpIHtcbiAgICAgIGNvbnN0IGhlbHBlciA9IG5ldyBWUk1IdW1hbm9pZEhlbHBlcihodW1hbm9pZCk7XG4gICAgICB0aGlzLmhlbHBlclJvb3QuYWRkKGhlbHBlcik7XG4gICAgICBoZWxwZXIucmVuZGVyT3JkZXIgPSB0aGlzLmhlbHBlclJvb3QucmVuZGVyT3JkZXI7XG4gICAgfVxuXG4gICAgcmV0dXJuIGh1bWFub2lkO1xuICB9XG5cbiAgcHJpdmF0ZSBhc3luYyBfdjBJbXBvcnQoZ2x0ZjogR0xURik6IFByb21pc2U8VlJNSHVtYW5vaWQgfCBudWxsPiB7XG4gICAgY29uc3QganNvbiA9IHRoaXMucGFyc2VyLmpzb24gYXMgR0xURlNjaGVtYS5JR0xURjtcblxuICAgIGNvbnN0IHZybUV4dCA9IGpzb24uZXh0ZW5zaW9ucz8uVlJNIGFzIFYwVlJNLlZSTSB8IHVuZGVmaW5lZDtcbiAgICBpZiAoIXZybUV4dCkge1xuICAgICAgcmV0dXJuIG51bGw7XG4gICAgfVxuXG4gICAgY29uc3Qgc2NoZW1hSHVtYW5vaWQ6IFYwVlJNLkh1bWFub2lkIHwgdW5kZWZpbmVkID0gdnJtRXh0Lmh1bWFub2lkO1xuICAgIGlmICghc2NoZW1hSHVtYW5vaWQpIHtcbiAgICAgIHJldHVybiBudWxsO1xuICAgIH1cblxuICAgIGNvbnN0IGh1bWFuQm9uZXM6IFBhcnRpYWw8VlJNSHVtYW5Cb25lcz4gPSB7fTtcbiAgICBpZiAoc2NoZW1hSHVtYW5vaWQuaHVtYW5Cb25lcyAhPSBudWxsKSB7XG4gICAgICBhd2FpdCBQcm9taXNlLmFsbChcbiAgICAgICAgc2NoZW1hSHVtYW5vaWQuaHVtYW5Cb25lcy5tYXAoYXN5bmMgKGJvbmUpID0+IHtcbiAgICAgICAgICBjb25zdCBib25lTmFtZSA9IGJvbmUuYm9uZTtcbiAgICAgICAgICBjb25zdCBpbmRleCA9IGJvbmUubm9kZTtcblxuICAgICAgICAgIGlmIChib25lTmFtZSA9PSBudWxsIHx8IGluZGV4ID09IG51bGwpIHtcbiAgICAgICAgICAgIHJldHVybjtcbiAgICAgICAgICB9XG5cbiAgICAgICAgICBjb25zdCBub2RlID0gYXdhaXQgdGhpcy5wYXJzZXIuZ2V0RGVwZW5kZW5jeSgnbm9kZScsIGluZGV4KTtcblxuICAgICAgICAgIC8vIGlmIHRoZSBzcGVjaWZpZWQgbm9kZSBkb2VzIG5vdCBleGlzdCwgZW1pdCBhIHdhcm5pbmdcbiAgICAgICAgICBpZiAobm9kZSA9PSBudWxsKSB7XG4gICAgICAgICAgICBjb25zb2xlLndhcm4oYEEgZ2xURiBub2RlIGJvdW5kIHRvIHRoZSBodW1hbm9pZCBib25lICR7Ym9uZU5hbWV9IChpbmRleCA9ICR7aW5kZXh9KSBkb2VzIG5vdCBleGlzdGApO1xuICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICAgIH1cblxuICAgICAgICAgIC8vIG1hcCB0byBuZXcgYm9uZSBuYW1lXG4gICAgICAgICAgY29uc3QgdGh1bWJCb25lTmFtZSA9IHRodW1iQm9uZU5hbWVNYXBbYm9uZU5hbWVdO1xuICAgICAgICAgIGNvbnN0IG5ld0JvbmVOYW1lID0gKHRodW1iQm9uZU5hbWUgPz8gYm9uZU5hbWUpIGFzIFYxVlJNU2NoZW1hLkh1bWFub2lkSHVtYW5Cb25lTmFtZTtcblxuICAgICAgICAgIC8vIHYwIFZSTXMgbWlnaHQgaGF2ZSBhIG11bHRpcGxlIG5vZGVzIGF0dGFjaGVkIHRvIGEgc2luZ2xlIGJvbmUuLi5cbiAgICAgICAgICAvLyBzbyBpZiB0aGVyZSBhbHJlYWR5IGlzIGFuIGVudHJ5IGluIHRoZSBgaHVtYW5Cb25lc2AsIHNob3cgYSB3YXJuaW5nIGFuZCBpZ25vcmUgaXRcbiAgICAgICAgICBpZiAoaHVtYW5Cb25lc1tuZXdCb25lTmFtZV0gIT0gbnVsbCkge1xuICAgICAgICAgICAgY29uc29sZS53YXJuKFxuICAgICAgICAgICAgICBgTXVsdGlwbGUgYm9uZSBlbnRyaWVzIGZvciAke25ld0JvbmVOYW1lfSBkZXRlY3RlZCAoaW5kZXggPSAke2luZGV4fSksIGlnbm9yaW5nIGR1cGxpY2F0ZWQgZW50cmllcy5gLFxuICAgICAgICAgICAgKTtcbiAgICAgICAgICAgIHJldHVybjtcbiAgICAgICAgICB9XG5cbiAgICAgICAgICAvLyBzZXQgdG8gdGhlIGBodW1hbkJvbmVzYFxuICAgICAgICAgIGh1bWFuQm9uZXNbbmV3Qm9uZU5hbWVdID0geyBub2RlIH07XG4gICAgICAgIH0pLFxuICAgICAgKTtcbiAgICB9XG5cbiAgICBjb25zdCBodW1hbm9pZCA9IG5ldyBWUk1IdW1hbm9pZCh0aGlzLl9lbnN1cmVSZXF1aXJlZEJvbmVzRXhpc3QoaHVtYW5Cb25lcyksIHtcbiAgICAgIGF1dG9VcGRhdGVIdW1hbkJvbmVzOiB0aGlzLmF1dG9VcGRhdGVIdW1hbkJvbmVzLFxuICAgIH0pO1xuICAgIGdsdGYuc2NlbmUuYWRkKGh1bWFub2lkLm5vcm1hbGl6ZWRIdW1hbkJvbmVzUm9vdCk7XG5cbiAgICBpZiAodGhpcy5oZWxwZXJSb290KSB7XG4gICAgICBjb25zdCBoZWxwZXIgPSBuZXcgVlJNSHVtYW5vaWRIZWxwZXIoaHVtYW5vaWQpO1xuICAgICAgdGhpcy5oZWxwZXJSb290LmFkZChoZWxwZXIpO1xuICAgICAgaGVscGVyLnJlbmRlck9yZGVyID0gdGhpcy5oZWxwZXJSb290LnJlbmRlck9yZGVyO1xuICAgIH1cblxuICAgIHJldHVybiBodW1hbm9pZDtcbiAgfVxuXG4gIC8qKlxuICAgKiBFbnN1cmUgcmVxdWlyZWQgYm9uZXMgZXhpc3QgaW4gZ2l2ZW4gaHVtYW4gYm9uZXMuXG4gICAqIEBwYXJhbSBodW1hbkJvbmVzIEh1bWFuIGJvbmVzXG4gICAqIEByZXR1cm5zIEh1bWFuIGJvbmVzLCBubyBsb25nZXIgcGFydGlhbCFcbiAgICovXG4gIHByaXZhdGUgX2Vuc3VyZVJlcXVpcmVkQm9uZXNFeGlzdChodW1hbkJvbmVzOiBQYXJ0aWFsPFZSTUh1bWFuQm9uZXM+KTogVlJNSHVtYW5Cb25lcyB7XG4gICAgLy8gZW5zdXJlIHJlcXVpcmVkIGJvbmVzIGV4aXN0XG4gICAgY29uc3QgbWlzc2luZ1JlcXVpcmVkQm9uZXMgPSBPYmplY3QudmFsdWVzKFZSTVJlcXVpcmVkSHVtYW5Cb25lTmFtZSkuZmlsdGVyKFxuICAgICAgKHJlcXVpcmVkQm9uZU5hbWUpID0+IGh1bWFuQm9uZXNbcmVxdWlyZWRCb25lTmFtZV0gPT0gbnVsbCxcbiAgICApO1xuXG4gICAgLy8gdGhyb3cgYW4gZXJyb3IgaWYgdGhlcmUgYXJlIG1pc3NpbmcgYm9uZXNcbiAgICBpZiAobWlzc2luZ1JlcXVpcmVkQm9uZXMubGVuZ3RoID4gMCkge1xuICAgICAgdGhyb3cgbmV3IEVycm9yKFxuICAgICAgICBgVlJNSHVtYW5vaWRMb2FkZXJQbHVnaW46IFRoZXNlIGh1bWFub2lkIGJvbmVzIGFyZSByZXF1aXJlZCBidXQgbm90IGV4aXN0OiAke21pc3NpbmdSZXF1aXJlZEJvbmVzLmpvaW4oJywgJyl9YCxcbiAgICAgICk7XG4gICAgfVxuXG4gICAgcmV0dXJuIGh1bWFuQm9uZXMgYXMgVlJNSHVtYW5Cb25lcztcbiAgfVxufVxuIiwgImltcG9ydCAqIGFzIFRIUkVFIGZyb20gJ3RocmVlJztcbmltcG9ydCB7IFZSTUxvb2tBdCB9IGZyb20gJy4uL1ZSTUxvb2tBdCc7XG5pbXBvcnQgeyBGYW5CdWZmZXJHZW9tZXRyeSB9IGZyb20gJy4vdXRpbHMvRmFuQnVmZmVyR2VvbWV0cnknO1xuaW1wb3J0IHsgTGluZUFuZFNwaGVyZUJ1ZmZlckdlb21ldHJ5IH0gZnJvbSAnLi91dGlscy9MaW5lQW5kU3BoZXJlQnVmZmVyR2VvbWV0cnknO1xuXG5jb25zdCBfcXVhdEEgPSBuZXcgVEhSRUUuUXVhdGVybmlvbigpO1xuY29uc3QgX3F1YXRCID0gbmV3IFRIUkVFLlF1YXRlcm5pb24oKTtcbmNvbnN0IF92M0EgPSBuZXcgVEhSRUUuVmVjdG9yMygpO1xuY29uc3QgX3YzQiA9IG5ldyBUSFJFRS5WZWN0b3IzKCk7XG5cbmNvbnN0IFNRUlRfMl9PVkVSXzIgPSBNYXRoLnNxcnQoMi4wKSAvIDIuMDtcbmNvbnN0IFFVQVRfWFlfQ1c5MCA9IG5ldyBUSFJFRS5RdWF0ZXJuaW9uKDAsIDAsIC1TUVJUXzJfT1ZFUl8yLCBTUVJUXzJfT1ZFUl8yKTtcbmNvbnN0IFZFQzNfUE9TSVRJVkVfWSA9IG5ldyBUSFJFRS5WZWN0b3IzKDAuMCwgMS4wLCAwLjApO1xuXG5leHBvcnQgY2xhc3MgVlJNTG9va0F0SGVscGVyIGV4dGVuZHMgVEhSRUUuR3JvdXAge1xuICBwdWJsaWMgcmVhZG9ubHkgdnJtTG9va0F0OiBWUk1Mb29rQXQ7XG4gIHByaXZhdGUgcmVhZG9ubHkgX21lc2hZYXc6IFRIUkVFLk1lc2g8RmFuQnVmZmVyR2VvbWV0cnksIFRIUkVFLk1lc2hCYXNpY01hdGVyaWFsPjtcbiAgcHJpdmF0ZSByZWFkb25seSBfbWVzaFBpdGNoOiBUSFJFRS5NZXNoPEZhbkJ1ZmZlckdlb21ldHJ5LCBUSFJFRS5NZXNoQmFzaWNNYXRlcmlhbD47XG4gIHByaXZhdGUgcmVhZG9ubHkgX2xpbmVUYXJnZXQ6IFRIUkVFLkxpbmVTZWdtZW50czxMaW5lQW5kU3BoZXJlQnVmZmVyR2VvbWV0cnksIFRIUkVFLkxpbmVCYXNpY01hdGVyaWFsPjtcblxuICBwdWJsaWMgY29uc3RydWN0b3IobG9va0F0OiBWUk1Mb29rQXQpIHtcbiAgICBzdXBlcigpO1xuICAgIHRoaXMubWF0cml4QXV0b1VwZGF0ZSA9IGZhbHNlO1xuXG4gICAgdGhpcy52cm1Mb29rQXQgPSBsb29rQXQ7XG5cbiAgICB7XG4gICAgICBjb25zdCBnZW9tZXRyeSA9IG5ldyBGYW5CdWZmZXJHZW9tZXRyeSgpO1xuICAgICAgZ2VvbWV0cnkucmFkaXVzID0gMC41O1xuXG4gICAgICBjb25zdCBtYXRlcmlhbCA9IG5ldyBUSFJFRS5NZXNoQmFzaWNNYXRlcmlhbCh7XG4gICAgICAgIGNvbG9yOiAweDAwZmYwMCxcbiAgICAgICAgdHJhbnNwYXJlbnQ6IHRydWUsXG4gICAgICAgIG9wYWNpdHk6IDAuNSxcbiAgICAgICAgc2lkZTogVEhSRUUuRG91YmxlU2lkZSxcbiAgICAgICAgZGVwdGhUZXN0OiBmYWxzZSxcbiAgICAgICAgZGVwdGhXcml0ZTogZmFsc2UsXG4gICAgICB9KTtcblxuICAgICAgdGhpcy5fbWVzaFBpdGNoID0gbmV3IFRIUkVFLk1lc2goZ2VvbWV0cnksIG1hdGVyaWFsKTtcbiAgICAgIHRoaXMuYWRkKHRoaXMuX21lc2hQaXRjaCk7XG4gICAgfVxuXG4gICAge1xuICAgICAgY29uc3QgZ2VvbWV0cnkgPSBuZXcgRmFuQnVmZmVyR2VvbWV0cnkoKTtcbiAgICAgIGdlb21ldHJ5LnJhZGl1cyA9IDAuNTtcblxuICAgICAgY29uc3QgbWF0ZXJpYWwgPSBuZXcgVEhSRUUuTWVzaEJhc2ljTWF0ZXJpYWwoe1xuICAgICAgICBjb2xvcjogMHhmZjAwMDAsXG4gICAgICAgIHRyYW5zcGFyZW50OiB0cnVlLFxuICAgICAgICBvcGFjaXR5OiAwLjUsXG4gICAgICAgIHNpZGU6IFRIUkVFLkRvdWJsZVNpZGUsXG4gICAgICAgIGRlcHRoVGVzdDogZmFsc2UsXG4gICAgICAgIGRlcHRoV3JpdGU6IGZhbHNlLFxuICAgICAgfSk7XG5cbiAgICAgIHRoaXMuX21lc2hZYXcgPSBuZXcgVEhSRUUuTWVzaChnZW9tZXRyeSwgbWF0ZXJpYWwpO1xuICAgICAgdGhpcy5hZGQodGhpcy5fbWVzaFlhdyk7XG4gICAgfVxuXG4gICAge1xuICAgICAgY29uc3QgZ2VvbWV0cnkgPSBuZXcgTGluZUFuZFNwaGVyZUJ1ZmZlckdlb21ldHJ5KCk7XG4gICAgICBnZW9tZXRyeS5yYWRpdXMgPSAwLjE7XG5cbiAgICAgIGNvbnN0IG1hdGVyaWFsID0gbmV3IFRIUkVFLkxpbmVCYXNpY01hdGVyaWFsKHtcbiAgICAgICAgY29sb3I6IDB4ZmZmZmZmLFxuICAgICAgICBkZXB0aFRlc3Q6IGZhbHNlLFxuICAgICAgICBkZXB0aFdyaXRlOiBmYWxzZSxcbiAgICAgIH0pO1xuXG4gICAgICB0aGlzLl9saW5lVGFyZ2V0ID0gbmV3IFRIUkVFLkxpbmVTZWdtZW50cyhnZW9tZXRyeSwgbWF0ZXJpYWwpO1xuICAgICAgdGhpcy5fbGluZVRhcmdldC5mcnVzdHVtQ3VsbGVkID0gZmFsc2U7XG4gICAgICB0aGlzLmFkZCh0aGlzLl9saW5lVGFyZ2V0KTtcbiAgICB9XG4gIH1cblxuICBwdWJsaWMgZGlzcG9zZSgpOiB2b2lkIHtcbiAgICB0aGlzLl9tZXNoWWF3Lmdlb21ldHJ5LmRpc3Bvc2UoKTtcbiAgICB0aGlzLl9tZXNoWWF3Lm1hdGVyaWFsLmRpc3Bvc2UoKTtcblxuICAgIHRoaXMuX21lc2hQaXRjaC5nZW9tZXRyeS5kaXNwb3NlKCk7XG4gICAgdGhpcy5fbWVzaFBpdGNoLm1hdGVyaWFsLmRpc3Bvc2UoKTtcblxuICAgIHRoaXMuX2xpbmVUYXJnZXQuZ2VvbWV0cnkuZGlzcG9zZSgpO1xuICAgIHRoaXMuX2xpbmVUYXJnZXQubWF0ZXJpYWwuZGlzcG9zZSgpO1xuICB9XG5cbiAgcHVibGljIHVwZGF0ZU1hdHJpeFdvcmxkKGZvcmNlOiBib29sZWFuKTogdm9pZCB7XG4gICAgLy8gdXBkYXRlIGdlb21ldHJpZXNcbiAgICBjb25zdCB5YXcgPSBUSFJFRS5NYXRoVXRpbHMuREVHMlJBRCAqIHRoaXMudnJtTG9va0F0LnlhdztcbiAgICB0aGlzLl9tZXNoWWF3Lmdlb21ldHJ5LnRoZXRhID0geWF3O1xuICAgIHRoaXMuX21lc2hZYXcuZ2VvbWV0cnkudXBkYXRlKCk7XG5cbiAgICBjb25zdCBwaXRjaCA9IFRIUkVFLk1hdGhVdGlscy5ERUcyUkFEICogdGhpcy52cm1Mb29rQXQucGl0Y2g7XG4gICAgdGhpcy5fbWVzaFBpdGNoLmdlb21ldHJ5LnRoZXRhID0gcGl0Y2g7XG4gICAgdGhpcy5fbWVzaFBpdGNoLmdlb21ldHJ5LnVwZGF0ZSgpO1xuXG4gICAgLy8gZ2V0IHdvcmxkIHBvc2l0aW9uIGFuZCBxdWF0ZXJuaW9uXG4gICAgdGhpcy52cm1Mb29rQXQuZ2V0TG9va0F0V29ybGRQb3NpdGlvbihfdjNBKTtcbiAgICB0aGlzLnZybUxvb2tBdC5nZXRMb29rQXRXb3JsZFF1YXRlcm5pb24oX3F1YXRBKTtcblxuICAgIC8vIGNhbGN1bGF0ZSByb3RhdGlvbiB1c2luZyBmYWNlRnJvbnRcbiAgICBfcXVhdEEubXVsdGlwbHkodGhpcy52cm1Mb29rQXQuZ2V0RmFjZUZyb250UXVhdGVybmlvbihfcXVhdEIpKTtcblxuICAgIC8vIHNldCB0cmFuc2Zvcm0gdG8gbWVzaGVzXG4gICAgdGhpcy5fbWVzaFlhdy5wb3NpdGlvbi5jb3B5KF92M0EpO1xuICAgIHRoaXMuX21lc2hZYXcucXVhdGVybmlvbi5jb3B5KF9xdWF0QSk7XG5cbiAgICB0aGlzLl9tZXNoUGl0Y2gucG9zaXRpb24uY29weShfdjNBKTtcbiAgICB0aGlzLl9tZXNoUGl0Y2gucXVhdGVybmlvbi5jb3B5KF9xdWF0QSk7XG4gICAgdGhpcy5fbWVzaFBpdGNoLnF1YXRlcm5pb24ubXVsdGlwbHkoX3F1YXRCLnNldEZyb21BeGlzQW5nbGUoVkVDM19QT1NJVElWRV9ZLCB5YXcpKTtcbiAgICB0aGlzLl9tZXNoUGl0Y2gucXVhdGVybmlvbi5tdWx0aXBseShRVUFUX1hZX0NXOTApO1xuXG4gICAgLy8gdXBkYXRlIHRhcmdldCBsaW5lIGFuZCBzcGhlcmVcbiAgICBjb25zdCB7IHRhcmdldCwgYXV0b1VwZGF0ZSB9ID0gdGhpcy52cm1Mb29rQXQ7XG4gICAgaWYgKHRhcmdldCAhPSBudWxsICYmIGF1dG9VcGRhdGUpIHtcbiAgICAgIHRhcmdldC5nZXRXb3JsZFBvc2l0aW9uKF92M0IpLnN1YihfdjNBKTtcbiAgICAgIHRoaXMuX2xpbmVUYXJnZXQuZ2VvbWV0cnkudGFpbC5jb3B5KF92M0IpO1xuICAgICAgdGhpcy5fbGluZVRhcmdldC5nZW9tZXRyeS51cGRhdGUoKTtcbiAgICAgIHRoaXMuX2xpbmVUYXJnZXQucG9zaXRpb24uY29weShfdjNBKTtcbiAgICB9XG5cbiAgICAvLyBhcHBseSB0cmFuc2Zvcm0gdG8gbWVzaGVzXG4gICAgc3VwZXIudXBkYXRlTWF0cml4V29ybGQoZm9yY2UpO1xuICB9XG59XG4iLCAiaW1wb3J0ICogYXMgVEhSRUUgZnJvbSAndGhyZWUnO1xuXG5leHBvcnQgY2xhc3MgRmFuQnVmZmVyR2VvbWV0cnkgZXh0ZW5kcyBUSFJFRS5CdWZmZXJHZW9tZXRyeSB7XG4gIHB1YmxpYyB0aGV0YTogbnVtYmVyO1xuICBwdWJsaWMgcmFkaXVzOiBudW1iZXI7XG4gIHByaXZhdGUgX2N1cnJlbnRUaGV0YSA9IDA7XG4gIHByaXZhdGUgX2N1cnJlbnRSYWRpdXMgPSAwO1xuICBwcml2YXRlIHJlYWRvbmx5IF9hdHRyUG9zOiBUSFJFRS5CdWZmZXJBdHRyaWJ1dGU7XG4gIHByaXZhdGUgcmVhZG9ubHkgX2F0dHJJbmRleDogVEhSRUUuQnVmZmVyQXR0cmlidXRlO1xuXG4gIHB1YmxpYyBjb25zdHJ1Y3RvcigpIHtcbiAgICBzdXBlcigpO1xuXG4gICAgdGhpcy50aGV0YSA9IDAuMDtcbiAgICB0aGlzLnJhZGl1cyA9IDAuMDtcbiAgICB0aGlzLl9jdXJyZW50VGhldGEgPSAwLjA7XG4gICAgdGhpcy5fY3VycmVudFJhZGl1cyA9IDAuMDtcblxuICAgIHRoaXMuX2F0dHJQb3MgPSBuZXcgVEhSRUUuQnVmZmVyQXR0cmlidXRlKG5ldyBGbG9hdDMyQXJyYXkoNjUgKiAzKSwgMyk7XG4gICAgdGhpcy5zZXRBdHRyaWJ1dGUoJ3Bvc2l0aW9uJywgdGhpcy5fYXR0clBvcyk7XG5cbiAgICB0aGlzLl9hdHRySW5kZXggPSBuZXcgVEhSRUUuQnVmZmVyQXR0cmlidXRlKG5ldyBVaW50MTZBcnJheSgzICogNjMpLCAxKTtcbiAgICB0aGlzLnNldEluZGV4KHRoaXMuX2F0dHJJbmRleCk7XG5cbiAgICB0aGlzLl9idWlsZEluZGV4KCk7XG4gICAgdGhpcy51cGRhdGUoKTtcbiAgfVxuXG4gIHB1YmxpYyB1cGRhdGUoKTogdm9pZCB7XG4gICAgbGV0IHNob3VsZFVwZGF0ZUdlb21ldHJ5ID0gZmFsc2U7XG5cbiAgICBpZiAodGhpcy5fY3VycmVudFRoZXRhICE9PSB0aGlzLnRoZXRhKSB7XG4gICAgICB0aGlzLl9jdXJyZW50VGhldGEgPSB0aGlzLnRoZXRhO1xuICAgICAgc2hvdWxkVXBkYXRlR2VvbWV0cnkgPSB0cnVlO1xuICAgIH1cblxuICAgIGlmICh0aGlzLl9jdXJyZW50UmFkaXVzICE9PSB0aGlzLnJhZGl1cykge1xuICAgICAgdGhpcy5fY3VycmVudFJhZGl1cyA9IHRoaXMucmFkaXVzO1xuICAgICAgc2hvdWxkVXBkYXRlR2VvbWV0cnkgPSB0cnVlO1xuICAgIH1cblxuICAgIGlmIChzaG91bGRVcGRhdGVHZW9tZXRyeSkge1xuICAgICAgdGhpcy5fYnVpbGRQb3NpdGlvbigpO1xuICAgIH1cbiAgfVxuXG4gIHByaXZhdGUgX2J1aWxkUG9zaXRpb24oKTogdm9pZCB7XG4gICAgdGhpcy5fYXR0clBvcy5zZXRYWVooMCwgMC4wLCAwLjAsIDAuMCk7XG5cbiAgICBmb3IgKGxldCBpID0gMDsgaSA8IDY0OyBpKyspIHtcbiAgICAgIGNvbnN0IHQgPSAoaSAvIDYzLjApICogdGhpcy5fY3VycmVudFRoZXRhO1xuXG4gICAgICB0aGlzLl9hdHRyUG9zLnNldFhZWihpICsgMSwgdGhpcy5fY3VycmVudFJhZGl1cyAqIE1hdGguc2luKHQpLCAwLjAsIHRoaXMuX2N1cnJlbnRSYWRpdXMgKiBNYXRoLmNvcyh0KSk7XG4gICAgfVxuXG4gICAgdGhpcy5fYXR0clBvcy5uZWVkc1VwZGF0ZSA9IHRydWU7XG4gIH1cblxuICBwcml2YXRlIF9idWlsZEluZGV4KCk6IHZvaWQge1xuICAgIGZvciAobGV0IGkgPSAwOyBpIDwgNjM7IGkrKykge1xuICAgICAgdGhpcy5fYXR0ckluZGV4LnNldFhZWihpICogMywgMCwgaSArIDEsIGkgKyAyKTtcbiAgICB9XG5cbiAgICB0aGlzLl9hdHRySW5kZXgubmVlZHNVcGRhdGUgPSB0cnVlO1xuICB9XG59XG4iLCAiaW1wb3J0ICogYXMgVEhSRUUgZnJvbSAndGhyZWUnO1xuXG5leHBvcnQgY2xhc3MgTGluZUFuZFNwaGVyZUJ1ZmZlckdlb21ldHJ5IGV4dGVuZHMgVEhSRUUuQnVmZmVyR2VvbWV0cnkge1xuICBwdWJsaWMgcmFkaXVzOiBudW1iZXI7XG4gIHB1YmxpYyB0YWlsOiBUSFJFRS5WZWN0b3IzO1xuICBwcml2YXRlIF9jdXJyZW50UmFkaXVzOiBudW1iZXI7XG4gIHByaXZhdGUgX2N1cnJlbnRUYWlsOiBUSFJFRS5WZWN0b3IzO1xuICBwcml2YXRlIHJlYWRvbmx5IF9hdHRyUG9zOiBUSFJFRS5CdWZmZXJBdHRyaWJ1dGU7XG4gIHByaXZhdGUgcmVhZG9ubHkgX2F0dHJJbmRleDogVEhSRUUuQnVmZmVyQXR0cmlidXRlO1xuXG4gIHB1YmxpYyBjb25zdHJ1Y3RvcigpIHtcbiAgICBzdXBlcigpO1xuXG4gICAgdGhpcy5yYWRpdXMgPSAwLjA7XG4gICAgdGhpcy5fY3VycmVudFJhZGl1cyA9IDAuMDtcblxuICAgIHRoaXMudGFpbCA9IG5ldyBUSFJFRS5WZWN0b3IzKCk7XG4gICAgdGhpcy5fY3VycmVudFRhaWwgPSBuZXcgVEhSRUUuVmVjdG9yMygpO1xuXG4gICAgdGhpcy5fYXR0clBvcyA9IG5ldyBUSFJFRS5CdWZmZXJBdHRyaWJ1dGUobmV3IEZsb2F0MzJBcnJheSgyOTQpLCAzKTtcbiAgICB0aGlzLnNldEF0dHJpYnV0ZSgncG9zaXRpb24nLCB0aGlzLl9hdHRyUG9zKTtcblxuICAgIHRoaXMuX2F0dHJJbmRleCA9IG5ldyBUSFJFRS5CdWZmZXJBdHRyaWJ1dGUobmV3IFVpbnQxNkFycmF5KDE5NCksIDEpO1xuICAgIHRoaXMuc2V0SW5kZXgodGhpcy5fYXR0ckluZGV4KTtcblxuICAgIHRoaXMuX2J1aWxkSW5kZXgoKTtcbiAgICB0aGlzLnVwZGF0ZSgpO1xuICB9XG5cbiAgcHVibGljIHVwZGF0ZSgpOiB2b2lkIHtcbiAgICBsZXQgc2hvdWxkVXBkYXRlR2VvbWV0cnkgPSBmYWxzZTtcblxuICAgIGlmICh0aGlzLl9jdXJyZW50UmFkaXVzICE9PSB0aGlzLnJhZGl1cykge1xuICAgICAgdGhpcy5fY3VycmVudFJhZGl1cyA9IHRoaXMucmFkaXVzO1xuICAgICAgc2hvdWxkVXBkYXRlR2VvbWV0cnkgPSB0cnVlO1xuICAgIH1cblxuICAgIGlmICghdGhpcy5fY3VycmVudFRhaWwuZXF1YWxzKHRoaXMudGFpbCkpIHtcbiAgICAgIHRoaXMuX2N1cnJlbnRUYWlsLmNvcHkodGhpcy50YWlsKTtcbiAgICAgIHNob3VsZFVwZGF0ZUdlb21ldHJ5ID0gdHJ1ZTtcbiAgICB9XG5cbiAgICBpZiAoc2hvdWxkVXBkYXRlR2VvbWV0cnkpIHtcbiAgICAgIHRoaXMuX2J1aWxkUG9zaXRpb24oKTtcbiAgICB9XG4gIH1cblxuICBwcml2YXRlIF9idWlsZFBvc2l0aW9uKCk6IHZvaWQge1xuICAgIGZvciAobGV0IGkgPSAwOyBpIDwgMzI7IGkrKykge1xuICAgICAgY29uc3QgdCA9IChpIC8gMTYuMCkgKiBNYXRoLlBJO1xuXG4gICAgICB0aGlzLl9hdHRyUG9zLnNldFhZWihpLCBNYXRoLmNvcyh0KSwgTWF0aC5zaW4odCksIDAuMCk7XG4gICAgICB0aGlzLl9hdHRyUG9zLnNldFhZWigzMiArIGksIDAuMCwgTWF0aC5jb3ModCksIE1hdGguc2luKHQpKTtcbiAgICAgIHRoaXMuX2F0dHJQb3Muc2V0WFlaKDY0ICsgaSwgTWF0aC5zaW4odCksIDAuMCwgTWF0aC5jb3ModCkpO1xuICAgIH1cblxuICAgIHRoaXMuc2NhbGUodGhpcy5fY3VycmVudFJhZGl1cywgdGhpcy5fY3VycmVudFJhZGl1cywgdGhpcy5fY3VycmVudFJhZGl1cyk7XG4gICAgdGhpcy50cmFuc2xhdGUodGhpcy5fY3VycmVudFRhaWwueCwgdGhpcy5fY3VycmVudFRhaWwueSwgdGhpcy5fY3VycmVudFRhaWwueik7XG5cbiAgICB0aGlzLl9hdHRyUG9zLnNldFhZWig5NiwgMCwgMCwgMCk7XG4gICAgdGhpcy5fYXR0clBvcy5zZXRYWVooOTcsIHRoaXMuX2N1cnJlbnRUYWlsLngsIHRoaXMuX2N1cnJlbnRUYWlsLnksIHRoaXMuX2N1cnJlbnRUYWlsLnopO1xuXG4gICAgdGhpcy5fYXR0clBvcy5uZWVkc1VwZGF0ZSA9IHRydWU7XG4gIH1cblxuICBwcml2YXRlIF9idWlsZEluZGV4KCk6IHZvaWQge1xuICAgIGZvciAobGV0IGkgPSAwOyBpIDwgMzI7IGkrKykge1xuICAgICAgY29uc3QgaTEgPSAoaSArIDEpICUgMzI7XG5cbiAgICAgIHRoaXMuX2F0dHJJbmRleC5zZXRYWShpICogMiwgaSwgaTEpO1xuICAgICAgdGhpcy5fYXR0ckluZGV4LnNldFhZKDY0ICsgaSAqIDIsIDMyICsgaSwgMzIgKyBpMSk7XG4gICAgICB0aGlzLl9hdHRySW5kZXguc2V0WFkoMTI4ICsgaSAqIDIsIDY0ICsgaSwgNjQgKyBpMSk7XG4gICAgfVxuICAgIHRoaXMuX2F0dHJJbmRleC5zZXRYWSgxOTIsIDk2LCA5Nyk7XG5cbiAgICB0aGlzLl9hdHRySW5kZXgubmVlZHNVcGRhdGUgPSB0cnVlO1xuICB9XG59XG4iLCAiaW1wb3J0ICogYXMgVEhSRUUgZnJvbSAndGhyZWUnO1xuaW1wb3J0IHsgVlJNSHVtYW5vaWQgfSBmcm9tICcuLi9odW1hbm9pZCc7XG5pbXBvcnQgeyBnZXRXb3JsZFF1YXRlcm5pb25MaXRlIH0gZnJvbSAnLi4vdXRpbHMvZ2V0V29ybGRRdWF0ZXJuaW9uTGl0ZSc7XG5pbXBvcnQgeyBxdWF0SW52ZXJ0Q29tcGF0IH0gZnJvbSAnLi4vdXRpbHMvcXVhdEludmVydENvbXBhdCc7XG5pbXBvcnQgeyBjYWxjQXppbXV0aEFsdGl0dWRlIH0gZnJvbSAnLi91dGlscy9jYWxjQXppbXV0aEFsdGl0dWRlJztcbmltcG9ydCB0eXBlIHsgVlJNTG9va0F0QXBwbGllciB9IGZyb20gJy4vVlJNTG9va0F0QXBwbGllcic7XG5pbXBvcnQgeyBzYW5pdGl6ZUFuZ2xlIH0gZnJvbSAnLi91dGlscy9zYW5pdGl6ZUFuZ2xlJztcblxuY29uc3QgVkVDM19QT1NJVElWRV9aID0gbmV3IFRIUkVFLlZlY3RvcjMoMC4wLCAwLjAsIDEuMCk7XG5cbmNvbnN0IF92M0EgPSBuZXcgVEhSRUUuVmVjdG9yMygpO1xuY29uc3QgX3YzQiA9IG5ldyBUSFJFRS5WZWN0b3IzKCk7XG5jb25zdCBfdjNDID0gbmV3IFRIUkVFLlZlY3RvcjMoKTtcbmNvbnN0IF9xdWF0QSA9IG5ldyBUSFJFRS5RdWF0ZXJuaW9uKCk7XG5jb25zdCBfcXVhdEIgPSBuZXcgVEhSRUUuUXVhdGVybmlvbigpO1xuY29uc3QgX3F1YXRDID0gbmV3IFRIUkVFLlF1YXRlcm5pb24oKTtcbmNvbnN0IF9xdWF0RCA9IG5ldyBUSFJFRS5RdWF0ZXJuaW9uKCk7XG5jb25zdCBfZXVsZXJBID0gbmV3IFRIUkVFLkV1bGVyKCk7XG5cbi8qKlxuICogQSBjbGFzcyBjb250cm9scyBleWUgZ2F6ZSBtb3ZlbWVudHMgb2YgYSBWUk0uXG4gKi9cbmV4cG9ydCBjbGFzcyBWUk1Mb29rQXQge1xuICBwdWJsaWMgc3RhdGljIHJlYWRvbmx5IEVVTEVSX09SREVSID0gJ1lYWic7IC8vIHlhdy1waXRjaC1yb2xsXG5cbiAgLyoqXG4gICAqIFRoZSBvcmlnaW4gb2YgTG9va0F0LiBQb3NpdGlvbiBvZmZzZXQgZnJvbSB0aGUgaGVhZCBib25lLlxuICAgKi9cbiAgcHVibGljIG9mZnNldEZyb21IZWFkQm9uZSA9IG5ldyBUSFJFRS5WZWN0b3IzKCk7XG5cbiAgLyoqXG4gICAqIEl0cyBhc3NvY2lhdGVkIHtAbGluayBWUk1IdW1hbm9pZH0uXG4gICAqL1xuICBwdWJsaWMgcmVhZG9ubHkgaHVtYW5vaWQ6IFZSTUh1bWFub2lkO1xuXG4gIC8qKlxuICAgKiBUaGUge0BsaW5rIFZSTUxvb2tBdEFwcGxpZXJ9IG9mIHRoZSBMb29rQXQuXG4gICAqL1xuICBwdWJsaWMgYXBwbGllcjogVlJNTG9va0F0QXBwbGllcjtcblxuICAvKipcbiAgICogSWYgdGhpcyBpcyB0cnVlLCB0aGUgTG9va0F0IHdpbGwgYmUgdXBkYXRlZCBhdXRvbWF0aWNhbGx5IGJ5IGNhbGxpbmcge0BsaW5rIHVwZGF0ZX0sIHRvd2FyZGluZyB0aGUgZGlyZWN0aW9uIHRvIHRoZSB7QGxpbmsgdGFyZ2V0fS5cbiAgICogYHRydWVgIGJ5IGRlZmF1bHQuXG4gICAqXG4gICAqIFNlZSBhbHNvOiB7QGxpbmsgdGFyZ2V0fVxuICAgKi9cbiAgcHVibGljIGF1dG9VcGRhdGUgPSB0cnVlO1xuXG4gIC8qKlxuICAgKiBUaGUgdGFyZ2V0IG9iamVjdCBvZiB0aGUgTG9va0F0LlxuICAgKiBOb3RlIHRoYXQgaXQgZG9lcyBub3QgbWFrZSBhbnkgc2Vuc2UgaWYge0BsaW5rIGF1dG9VcGRhdGV9IGlzIGRpc2FibGVkLlxuICAgKlxuICAgKiBTZWUgYWxzbzoge0BsaW5rIGF1dG9VcGRhdGV9XG4gICAqL1xuICBwdWJsaWMgdGFyZ2V0PzogVEhSRUUuT2JqZWN0M0QgfCBudWxsO1xuXG4gIC8qKlxuICAgKiBUaGUgZnJvbnQgZGlyZWN0aW9uIG9mIHRoZSBmYWNlLlxuICAgKiBJbnRlbmRlZCB0byBiZSB1c2VkIGZvciBWUk0gMC4wIGNvbXBhdCAoVlJNIDAuMCBtb2RlbHMgYXJlIGZhY2luZyBaLSBpbnN0ZWFkIG9mIForKS5cbiAgICogWW91IHVzdWFsbHkgZG9uJ3Qgd2FudCB0byB0b3VjaCB0aGlzLlxuICAgKi9cbiAgcHVibGljIGZhY2VGcm9udCA9IG5ldyBUSFJFRS5WZWN0b3IzKDAuMCwgMC4wLCAxLjApO1xuXG4gIC8qKlxuICAgKiBJdHMgY3VycmVudCBhbmdsZSBhcm91bmQgWSBheGlzLCBpbiBkZWdyZWUuXG4gICAqL1xuICBwcm90ZWN0ZWQgX3lhdzogbnVtYmVyO1xuXG4gIC8qKlxuICAgKiBJdHMgY3VycmVudCBhbmdsZSBhcm91bmQgWSBheGlzLCBpbiBkZWdyZWUuXG4gICAqL1xuICBwdWJsaWMgZ2V0IHlhdygpOiBudW1iZXIge1xuICAgIHJldHVybiB0aGlzLl95YXc7XG4gIH1cblxuICAvKipcbiAgICogSXRzIGN1cnJlbnQgYW5nbGUgYXJvdW5kIFkgYXhpcywgaW4gZGVncmVlLlxuICAgKi9cbiAgcHVibGljIHNldCB5YXcodmFsdWU6IG51bWJlcikge1xuICAgIHRoaXMuX3lhdyA9IHZhbHVlO1xuICAgIHRoaXMuX25lZWRzVXBkYXRlID0gdHJ1ZTtcbiAgfVxuXG4gIC8qKlxuICAgKiBJdHMgY3VycmVudCBhbmdsZSBhcm91bmQgWCBheGlzLCBpbiBkZWdyZWUuXG4gICAqL1xuICBwcm90ZWN0ZWQgX3BpdGNoOiBudW1iZXI7XG5cbiAgLyoqXG4gICAqIEl0cyBjdXJyZW50IGFuZ2xlIGFyb3VuZCBYIGF4aXMsIGluIGRlZ3JlZS5cbiAgICovXG4gIHB1YmxpYyBnZXQgcGl0Y2goKTogbnVtYmVyIHtcbiAgICByZXR1cm4gdGhpcy5fcGl0Y2g7XG4gIH1cblxuICAvKipcbiAgICogSXRzIGN1cnJlbnQgYW5nbGUgYXJvdW5kIFggYXhpcywgaW4gZGVncmVlLlxuICAgKi9cbiAgcHVibGljIHNldCBwaXRjaCh2YWx1ZTogbnVtYmVyKSB7XG4gICAgdGhpcy5fcGl0Y2ggPSB2YWx1ZTtcbiAgICB0aGlzLl9uZWVkc1VwZGF0ZSA9IHRydWU7XG4gIH1cblxuICAvKipcbiAgICogU3BlY2lmaWVzIHRoYXQgYW5nbGVzIG5lZWQgdG8gYmUgYXBwbGllZCB0byBpdHMgW0BsaW5rIGFwcGxpZXJdLlxuICAgKi9cbiAgcHJvdGVjdGVkIF9uZWVkc1VwZGF0ZTogYm9vbGVhbjtcblxuICAvKipcbiAgICogV29ybGQgcm90YXRpb24gb2YgdGhlIGhlYWQgaW4gaXRzIHJlc3QgcG9zZS5cbiAgICovXG4gIHByaXZhdGUgX3Jlc3RIZWFkV29ybGRRdWF0ZXJuaW9uOiBUSFJFRS5RdWF0ZXJuaW9uO1xuXG4gIC8qKlxuICAgKiBAZGVwcmVjYXRlZCBVc2Uge0BsaW5rIGdldEV1bGVyfSBpbnN0ZWFkLlxuICAgKi9cbiAgcHVibGljIGdldCBldWxlcigpOiBUSFJFRS5FdWxlciB7XG4gICAgY29uc29sZS53YXJuKCdWUk1Mb29rQXQ6IGV1bGVyIGlzIGRlcHJlY2F0ZWQuIHVzZSBnZXRFdWxlcigpIGluc3RlYWQuJyk7XG5cbiAgICByZXR1cm4gdGhpcy5nZXRFdWxlcihuZXcgVEhSRUUuRXVsZXIoKSk7XG4gIH1cblxuICAvKipcbiAgICogQ3JlYXRlIGEgbmV3IHtAbGluayBWUk1Mb29rQXR9LlxuICAgKlxuICAgKiBAcGFyYW0gaHVtYW5vaWQgQSB7QGxpbmsgVlJNSHVtYW5vaWR9XG4gICAqIEBwYXJhbSBhcHBsaWVyIEEge0BsaW5rIFZSTUxvb2tBdEFwcGxpZXJ9XG4gICAqL1xuICBwdWJsaWMgY29uc3RydWN0b3IoaHVtYW5vaWQ6IFZSTUh1bWFub2lkLCBhcHBsaWVyOiBWUk1Mb29rQXRBcHBsaWVyKSB7XG4gICAgdGhpcy5odW1hbm9pZCA9IGh1bWFub2lkO1xuICAgIHRoaXMuYXBwbGllciA9IGFwcGxpZXI7XG5cbiAgICB0aGlzLl95YXcgPSAwLjA7XG4gICAgdGhpcy5fcGl0Y2ggPSAwLjA7XG4gICAgdGhpcy5fbmVlZHNVcGRhdGUgPSB0cnVlO1xuXG4gICAgdGhpcy5fcmVzdEhlYWRXb3JsZFF1YXRlcm5pb24gPSB0aGlzLmdldExvb2tBdFdvcmxkUXVhdGVybmlvbihuZXcgVEhSRUUuUXVhdGVybmlvbigpKTtcbiAgfVxuXG4gIC8qKlxuICAgKiBHZXQgaXRzIHlhdy1waXRjaCBhbmdsZXMgYXMgYW4gYEV1bGVyYC5cbiAgICogRG9lcyBOT1QgY29uc2lkZXIge0BsaW5rIGZhY2VGcm9udH07IGl0IHJldHVybnMgYEV1bGVyKDAsIDAsIDA7IFwiWVhaXCIpYCBieSBkZWZhdWx0IHJlZ2FyZGxlc3Mgb2YgdGhlIGZhY2VGcm9udCB2YWx1ZS5cbiAgICpcbiAgICogQHBhcmFtIHRhcmdldCBUaGUgdGFyZ2V0IGV1bGVyXG4gICAqL1xuICBwdWJsaWMgZ2V0RXVsZXIodGFyZ2V0OiBUSFJFRS5FdWxlcik6IFRIUkVFLkV1bGVyIHtcbiAgICByZXR1cm4gdGFyZ2V0LnNldChUSFJFRS5NYXRoVXRpbHMuREVHMlJBRCAqIHRoaXMuX3BpdGNoLCBUSFJFRS5NYXRoVXRpbHMuREVHMlJBRCAqIHRoaXMuX3lhdywgMC4wLCAnWVhaJyk7XG4gIH1cblxuICAvKipcbiAgICogQ29weSB0aGUgZ2l2ZW4ge0BsaW5rIFZSTUxvb2tBdH0gaW50byB0aGlzIG9uZS5cbiAgICoge0BsaW5rIGh1bWFub2lkfSBtdXN0IGJlIHNhbWUgYXMgdGhlIHNvdXJjZSBvbmUuXG4gICAqIHtAbGluayBhcHBsaWVyfSB3aWxsIHJlZmVyZW5jZSB0aGUgc2FtZSBpbnN0YW5jZSBhcyB0aGUgc291cmNlIG9uZS5cbiAgICogQHBhcmFtIHNvdXJjZSBUaGUge0BsaW5rIFZSTUxvb2tBdH0geW91IHdhbnQgdG8gY29weVxuICAgKiBAcmV0dXJucyB0aGlzXG4gICAqL1xuICBwdWJsaWMgY29weShzb3VyY2U6IFZSTUxvb2tBdCk6IHRoaXMge1xuICAgIGlmICh0aGlzLmh1bWFub2lkICE9PSBzb3VyY2UuaHVtYW5vaWQpIHtcbiAgICAgIHRocm93IG5ldyBFcnJvcignVlJNTG9va0F0OiBodW1hbm9pZCBtdXN0IGJlIHNhbWUgaW4gb3JkZXIgdG8gY29weScpO1xuICAgIH1cblxuICAgIHRoaXMub2Zmc2V0RnJvbUhlYWRCb25lLmNvcHkoc291cmNlLm9mZnNldEZyb21IZWFkQm9uZSk7XG4gICAgdGhpcy5hcHBsaWVyID0gc291cmNlLmFwcGxpZXI7XG4gICAgdGhpcy5hdXRvVXBkYXRlID0gc291cmNlLmF1dG9VcGRhdGU7XG4gICAgdGhpcy50YXJnZXQgPSBzb3VyY2UudGFyZ2V0O1xuICAgIHRoaXMuZmFjZUZyb250LmNvcHkoc291cmNlLmZhY2VGcm9udCk7XG5cbiAgICByZXR1cm4gdGhpcztcbiAgfVxuXG4gIC8qKlxuICAgKiBSZXR1cm5zIGEgY2xvbmUgb2YgdGhpcyB7QGxpbmsgVlJNTG9va0F0fS5cbiAgICogTm90ZSB0aGF0IHtAbGluayBodW1hbm9pZH0gYW5kIHtAbGluayBhcHBsaWVyfSB3aWxsIHJlZmVyZW5jZSB0aGUgc2FtZSBpbnN0YW5jZSBhcyB0aGlzIG9uZS5cbiAgICogQHJldHVybnMgQ29waWVkIHtAbGluayBWUk1Mb29rQXR9XG4gICAqL1xuICBwdWJsaWMgY2xvbmUoKTogVlJNTG9va0F0IHtcbiAgICByZXR1cm4gbmV3IFZSTUxvb2tBdCh0aGlzLmh1bWFub2lkLCB0aGlzLmFwcGxpZXIpLmNvcHkodGhpcyk7XG4gIH1cblxuICAvKipcbiAgICogUmVzZXQgdGhlIGxvb2tBdCBkaXJlY3Rpb24gKHlhdyBhbmQgcGl0Y2gpIHRvIHRoZSBpbml0aWFsIGRpcmVjdGlvbi5cbiAgICovXG4gIHB1YmxpYyByZXNldCgpOiB2b2lkIHtcbiAgICB0aGlzLl95YXcgPSAwLjA7XG4gICAgdGhpcy5fcGl0Y2ggPSAwLjA7XG4gICAgdGhpcy5fbmVlZHNVcGRhdGUgPSB0cnVlO1xuICB9XG5cbiAgLyoqXG4gICAqIEdldCBpdHMgbG9va0F0IHBvc2l0aW9uIGluIHdvcmxkIGNvb3JkaW5hdGUuXG4gICAqXG4gICAqIEBwYXJhbSB0YXJnZXQgQSB0YXJnZXQgYFRIUkVFLlZlY3RvcjNgXG4gICAqL1xuICBwdWJsaWMgZ2V0TG9va0F0V29ybGRQb3NpdGlvbih0YXJnZXQ6IFRIUkVFLlZlY3RvcjMpOiBUSFJFRS5WZWN0b3IzIHtcbiAgICBjb25zdCBoZWFkID0gdGhpcy5odW1hbm9pZC5nZXRSYXdCb25lTm9kZSgnaGVhZCcpITtcblxuICAgIHJldHVybiB0YXJnZXQuY29weSh0aGlzLm9mZnNldEZyb21IZWFkQm9uZSkuYXBwbHlNYXRyaXg0KGhlYWQubWF0cml4V29ybGQpO1xuICB9XG5cbiAgLyoqXG4gICAqIEdldCBpdHMgbG9va0F0IHJvdGF0aW9uIGluIHdvcmxkIGNvb3JkaW5hdGUuXG4gICAqIERvZXMgTk9UIGNvbnNpZGVyIHtAbGluayBmYWNlRnJvbnR9LlxuICAgKlxuICAgKiBAcGFyYW0gdGFyZ2V0IEEgdGFyZ2V0IGBUSFJFRS5RdWF0ZXJuaW9uYFxuICAgKi9cbiAgcHVibGljIGdldExvb2tBdFdvcmxkUXVhdGVybmlvbih0YXJnZXQ6IFRIUkVFLlF1YXRlcm5pb24pOiBUSFJFRS5RdWF0ZXJuaW9uIHtcbiAgICBjb25zdCBoZWFkID0gdGhpcy5odW1hbm9pZC5nZXRSYXdCb25lTm9kZSgnaGVhZCcpITtcblxuICAgIHJldHVybiBnZXRXb3JsZFF1YXRlcm5pb25MaXRlKGhlYWQsIHRhcmdldCk7XG4gIH1cblxuICAvKipcbiAgICogR2V0IGEgcXVhdGVybmlvbiB0aGF0IHJvdGF0ZXMgdGhlICtaIHVuaXQgdmVjdG9yIG9mIHRoZSBodW1hbm9pZCBIZWFkIHRvIHRoZSB7QGxpbmsgZmFjZUZyb250fSBkaXJlY3Rpb24uXG4gICAqXG4gICAqIEBwYXJhbSB0YXJnZXQgQSB0YXJnZXQgYFRIUkVFLlF1YXRlcm5pb25gXG4gICAqL1xuICBwdWJsaWMgZ2V0RmFjZUZyb250UXVhdGVybmlvbih0YXJnZXQ6IFRIUkVFLlF1YXRlcm5pb24pOiBUSFJFRS5RdWF0ZXJuaW9uIHtcbiAgICBpZiAodGhpcy5mYWNlRnJvbnQuZGlzdGFuY2VUb1NxdWFyZWQoVkVDM19QT1NJVElWRV9aKSA8IDAuMDEpIHtcbiAgICAgIHJldHVybiB0YXJnZXQuY29weSh0aGlzLl9yZXN0SGVhZFdvcmxkUXVhdGVybmlvbikuaW52ZXJ0KCk7XG4gICAgfVxuXG4gICAgY29uc3QgW2ZhY2VGcm9udEF6aW11dGgsIGZhY2VGcm9udEFsdGl0dWRlXSA9IGNhbGNBemltdXRoQWx0aXR1ZGUodGhpcy5mYWNlRnJvbnQpO1xuICAgIF9ldWxlckEuc2V0KDAuMCwgMC41ICogTWF0aC5QSSArIGZhY2VGcm9udEF6aW11dGgsIGZhY2VGcm9udEFsdGl0dWRlLCAnWVpYJyk7XG5cbiAgICByZXR1cm4gdGFyZ2V0LnNldEZyb21FdWxlcihfZXVsZXJBKS5wcmVtdWx0aXBseShfcXVhdEQuY29weSh0aGlzLl9yZXN0SGVhZFdvcmxkUXVhdGVybmlvbikuaW52ZXJ0KCkpO1xuICB9XG5cbiAgLyoqXG4gICAqIEdldCBpdHMgTG9va0F0IGRpcmVjdGlvbiBpbiB3b3JsZCBjb29yZGluYXRlLlxuICAgKlxuICAgKiBAcGFyYW0gdGFyZ2V0IEEgdGFyZ2V0IGBUSFJFRS5WZWN0b3IzYFxuICAgKi9cbiAgcHVibGljIGdldExvb2tBdFdvcmxkRGlyZWN0aW9uKHRhcmdldDogVEhSRUUuVmVjdG9yMyk6IFRIUkVFLlZlY3RvcjMge1xuICAgIHRoaXMuZ2V0TG9va0F0V29ybGRRdWF0ZXJuaW9uKF9xdWF0Qik7XG4gICAgdGhpcy5nZXRGYWNlRnJvbnRRdWF0ZXJuaW9uKF9xdWF0Qyk7XG5cbiAgICByZXR1cm4gdGFyZ2V0XG4gICAgICAuY29weShWRUMzX1BPU0lUSVZFX1opXG4gICAgICAuYXBwbHlRdWF0ZXJuaW9uKF9xdWF0QilcbiAgICAgIC5hcHBseVF1YXRlcm5pb24oX3F1YXRDKVxuICAgICAgLmFwcGx5RXVsZXIodGhpcy5nZXRFdWxlcihfZXVsZXJBKSk7XG4gIH1cblxuICAvKipcbiAgICogU2V0IGl0cyBsb29rQXQgdGFyZ2V0IHBvc2l0aW9uLlxuICAgKlxuICAgKiBOb3RlIHRoYXQgaXRzIHJlc3VsdCB3aWxsIGJlIGluc3RhbnRseSBvdmVyd3JpdHRlbiBpZiB7QGxpbmsgVlJNTG9va0F0SGVhZC5hdXRvVXBkYXRlfSBpcyBlbmFibGVkLlxuICAgKlxuICAgKiBJZiB5b3Ugd2FudCB0byB0cmFjayBhbiBvYmplY3QgY29udGludW91c2x5LCB5b3UgbWlnaHQgd2FudCB0byB1c2Uge0BsaW5rIHRhcmdldH0gaW5zdGVhZC5cbiAgICpcbiAgICogQHBhcmFtIHBvc2l0aW9uIEEgdGFyZ2V0IHBvc2l0aW9uLCBpbiB3b3JsZCBzcGFjZVxuICAgKi9cbiAgcHVibGljIGxvb2tBdChwb3NpdGlvbjogVEhSRUUuVmVjdG9yMyk6IHZvaWQge1xuICAgIC8vIExvb2sgYXQgZGlyZWN0aW9uIGluIGxvY2FsIGNvb3JkaW5hdGVcbiAgICBjb25zdCBoZWFkUm90RGlmZkludiA9IF9xdWF0QVxuICAgICAgLmNvcHkodGhpcy5fcmVzdEhlYWRXb3JsZFF1YXRlcm5pb24pXG4gICAgICAubXVsdGlwbHkocXVhdEludmVydENvbXBhdCh0aGlzLmdldExvb2tBdFdvcmxkUXVhdGVybmlvbihfcXVhdEIpKSk7XG4gICAgY29uc3QgaGVhZFBvcyA9IHRoaXMuZ2V0TG9va0F0V29ybGRQb3NpdGlvbihfdjNCKTtcbiAgICBjb25zdCBsb29rQXREaXIgPSBfdjNDLmNvcHkocG9zaXRpb24pLnN1YihoZWFkUG9zKS5hcHBseVF1YXRlcm5pb24oaGVhZFJvdERpZmZJbnYpLm5vcm1hbGl6ZSgpO1xuXG4gICAgLy8gY2FsY3VsYXRlIGFuZ2xlc1xuICAgIGNvbnN0IFthemltdXRoRnJvbSwgYWx0aXR1ZGVGcm9tXSA9IGNhbGNBemltdXRoQWx0aXR1ZGUodGhpcy5mYWNlRnJvbnQpO1xuICAgIGNvbnN0IFthemltdXRoVG8sIGFsdGl0dWRlVG9dID0gY2FsY0F6aW11dGhBbHRpdHVkZShsb29rQXREaXIpO1xuICAgIGNvbnN0IHlhdyA9IHNhbml0aXplQW5nbGUoYXppbXV0aFRvIC0gYXppbXV0aEZyb20pO1xuICAgIGNvbnN0IHBpdGNoID0gc2FuaXRpemVBbmdsZShhbHRpdHVkZUZyb20gLSBhbHRpdHVkZVRvKTsgLy8gc3Bpbm5pbmcgKDEsIDAsIDApIENDVyBhcm91bmQgWiBheGlzIG1ha2VzIHRoZSB2ZWN0b3IgbG9vayB1cCwgd2hpbGUgc3Bpbm5pbmcgKDAsIDAsIDEpIENDVyBhcm91bmQgWCBheGlzIG1ha2VzIHRoZSB2ZWN0b3IgbG9vayBkb3duXG5cbiAgICAvLyBhcHBseSBhbmdsZXNcbiAgICB0aGlzLl95YXcgPSBUSFJFRS5NYXRoVXRpbHMuUkFEMkRFRyAqIHlhdztcbiAgICB0aGlzLl9waXRjaCA9IFRIUkVFLk1hdGhVdGlscy5SQUQyREVHICogcGl0Y2g7XG5cbiAgICB0aGlzLl9uZWVkc1VwZGF0ZSA9IHRydWU7XG4gIH1cblxuICAvKipcbiAgICogVXBkYXRlIHRoZSBWUk1Mb29rQXRIZWFkLlxuICAgKiBJZiB7QGxpbmsgYXV0b1VwZGF0ZX0gaXMgZW5hYmxlZCwgdGhpcyB3aWxsIG1ha2UgaXQgbG9vayBhdCB0aGUge0BsaW5rIHRhcmdldH0uXG4gICAqXG4gICAqIEBwYXJhbSBkZWx0YSBkZWx0YVRpbWUsIGl0IGlzbid0IHVzZWQgdGhvdWdoLiBZb3UgY2FuIHVzZSB0aGUgcGFyYW1ldGVyIGlmIHlvdSB3YW50IHRvIHVzZSB0aGlzIGluIHlvdXIgb3duIGV4dGVuZGVkIHtAbGluayBWUk1Mb29rQXR9LlxuICAgKi9cbiAgcHVibGljIHVwZGF0ZShkZWx0YTogbnVtYmVyKTogdm9pZCB7XG4gICAgaWYgKHRoaXMudGFyZ2V0ICE9IG51bGwgJiYgdGhpcy5hdXRvVXBkYXRlKSB7XG4gICAgICB0aGlzLmxvb2tBdCh0aGlzLnRhcmdldC5nZXRXb3JsZFBvc2l0aW9uKF92M0EpKTtcbiAgICB9XG5cbiAgICBpZiAodGhpcy5fbmVlZHNVcGRhdGUpIHtcbiAgICAgIHRoaXMuX25lZWRzVXBkYXRlID0gZmFsc2U7XG5cbiAgICAgIHRoaXMuYXBwbGllci5hcHBseVlhd1BpdGNoKHRoaXMuX3lhdywgdGhpcy5fcGl0Y2gpO1xuICAgIH1cbiAgfVxufVxuIiwgImltcG9ydCAqIGFzIFRIUkVFIGZyb20gJ3RocmVlJztcblxuY29uc3QgX3Bvc2l0aW9uID0gbmV3IFRIUkVFLlZlY3RvcjMoKTtcbmNvbnN0IF9zY2FsZSA9IG5ldyBUSFJFRS5WZWN0b3IzKCk7XG5cbi8qKlxuICogQSByZXBsYWNlbWVudCBvZiBgT2JqZWN0M0QuZ2V0V29ybGRRdWF0ZXJuaW9uYC5cbiAqIEV4dHJhY3QgdGhlIHdvcmxkIHF1YXRlcm5pb24gb2YgYW4gb2JqZWN0IGZyb20gaXRzIHdvcmxkIHNwYWNlIG1hdHJpeCwgd2l0aG91dCBjYWxsaW5nIGBPYmplY3QzRC51cGRhdGVXb3JsZE1hdHJpeGAuXG4gKiBVc2UgdGhpcyB3aGVuIHlvdSdyZSBzdXJlIHRoYXQgdGhlIHdvcmxkIG1hdHJpeCBpcyB1cC10by1kYXRlLlxuICpcbiAqIEBwYXJhbSBvYmplY3QgVGhlIG9iamVjdFxuICogQHBhcmFtIG91dCBBIHRhcmdldCBxdWF0ZXJuaW9uXG4gKi9cbmV4cG9ydCBmdW5jdGlvbiBnZXRXb3JsZFF1YXRlcm5pb25MaXRlKG9iamVjdDogVEhSRUUuT2JqZWN0M0QsIG91dDogVEhSRUUuUXVhdGVybmlvbik6IFRIUkVFLlF1YXRlcm5pb24ge1xuICBvYmplY3QubWF0cml4V29ybGQuZGVjb21wb3NlKF9wb3NpdGlvbiwgb3V0LCBfc2NhbGUpO1xuICByZXR1cm4gb3V0O1xufVxuIiwgImltcG9ydCAqIGFzIFRIUkVFIGZyb20gJ3RocmVlJztcblxuLyoqXG4gKiBDYWxjdWxhdGUgYXppbXV0aCAvIGFsdGl0dWRlIGFuZ2xlcyBmcm9tIGEgdmVjdG9yLlxuICpcbiAqIFRoaXMgcmV0dXJucyBhIGRpZmZlcmVuY2Ugb2YgYW5nbGVzIGZyb20gKDEsIDAsIDApLlxuICogQXppbXV0aCByZXByZXNlbnRzIGFuIGFuZ2xlIGFyb3VuZCBZIGF4aXMuXG4gKiBBbHRpdHVkZSByZXByZXNlbnRzIGFuIGFuZ2xlIGFyb3VuZCBaIGF4aXMuXG4gKiBJdCBpcyByb3RhdGVkIGluIGludHJpbnNpYyBZLVogb3JkZXIuXG4gKlxuICogQHBhcmFtIHZlY3RvciBUaGUgdmVjdG9yXG4gKiBAcmV0dXJucyBBIHR1cGxlIGNvbnRhaW5zIHR3byBhbmdsZXMsIGBbIGF6aW11dGgsIGFsdGl0dWRlIF1gXG4gKi9cbmV4cG9ydCBmdW5jdGlvbiBjYWxjQXppbXV0aEFsdGl0dWRlKHZlY3RvcjogVEhSRUUuVmVjdG9yMyk6IFthemltdXRoOiBudW1iZXIsIGFsdGl0dWRlOiBudW1iZXJdIHtcbiAgcmV0dXJuIFtNYXRoLmF0YW4yKC12ZWN0b3IueiwgdmVjdG9yLngpLCBNYXRoLmF0YW4yKHZlY3Rvci55LCBNYXRoLnNxcnQodmVjdG9yLnggKiB2ZWN0b3IueCArIHZlY3Rvci56ICogdmVjdG9yLnopKV07XG59XG4iLCAiLyoqXG4gKiBNYWtlIHN1cmUgdGhlIGFuZ2xlIGlzIHdpdGhpbiAtUEkgdG8gUEkuXG4gKlxuICogQGV4YW1wbGVcbiAqIGBgYGpzXG4gKiBzYW5pdGl6ZUFuZ2xlKDEuNSAqIE1hdGguUEkpIC8vIC0wLjUgKiBQSVxuICogYGBgXG4gKlxuICogQHBhcmFtIGFuZ2xlIEFuIGlucHV0IGFuZ2xlXG4gKi9cbmV4cG9ydCBmdW5jdGlvbiBzYW5pdGl6ZUFuZ2xlKGFuZ2xlOiBudW1iZXIpOiBudW1iZXIge1xuICBjb25zdCByb3VuZFR1cm4gPSBNYXRoLnJvdW5kKGFuZ2xlIC8gMi4wIC8gTWF0aC5QSSk7XG4gIHJldHVybiBhbmdsZSAtIDIuMCAqIE1hdGguUEkgKiByb3VuZFR1cm47XG59XG4iLCAiaW1wb3J0IHsgVlJNSHVtYW5vaWQgfSBmcm9tICcuLi9odW1hbm9pZCc7XG5pbXBvcnQgKiBhcyBUSFJFRSBmcm9tICd0aHJlZSc7XG5pbXBvcnQgdHlwZSB7IFZSTUxvb2tBdEFwcGxpZXIgfSBmcm9tICcuL1ZSTUxvb2tBdEFwcGxpZXInO1xuaW1wb3J0IHsgVlJNTG9va0F0UmFuZ2VNYXAgfSBmcm9tICcuL1ZSTUxvb2tBdFJhbmdlTWFwJztcbmltcG9ydCB7IGNhbGNBemltdXRoQWx0aXR1ZGUgfSBmcm9tICcuL3V0aWxzL2NhbGNBemltdXRoQWx0aXR1ZGUnO1xuaW1wb3J0IHsgZ2V0V29ybGRRdWF0ZXJuaW9uTGl0ZSB9IGZyb20gJy4uL3V0aWxzL2dldFdvcmxkUXVhdGVybmlvbkxpdGUnO1xuXG5jb25zdCBWRUMzX1BPU0lUSVZFX1ogPSBuZXcgVEhSRUUuVmVjdG9yMygwLjAsIDAuMCwgMS4wKTtcblxuY29uc3QgX3F1YXRBID0gbmV3IFRIUkVFLlF1YXRlcm5pb24oKTtcbmNvbnN0IF9xdWF0QiA9IG5ldyBUSFJFRS5RdWF0ZXJuaW9uKCk7XG5jb25zdCBfZXVsZXJBID0gbmV3IFRIUkVFLkV1bGVyKDAuMCwgMC4wLCAwLjAsICdZWFonKTtcblxuLyoqXG4gKiBBIGNsYXNzIHRoYXQgYXBwbGllcyBleWUgZ2F6ZSBkaXJlY3Rpb25zIHRvIGEgVlJNLlxuICogSXQgd2lsbCBiZSB1c2VkIGJ5IHtAbGluayBWUk1Mb29rQXR9LlxuICovXG5leHBvcnQgY2xhc3MgVlJNTG9va0F0Qm9uZUFwcGxpZXIgaW1wbGVtZW50cyBWUk1Mb29rQXRBcHBsaWVyIHtcbiAgLyoqXG4gICAqIFJlcHJlc2VudCBpdHMgdHlwZSBvZiBhcHBsaWVyLlxuICAgKi9cbiAgcHVibGljIHN0YXRpYyByZWFkb25seSB0eXBlID0gJ2JvbmUnO1xuXG4gIC8qKlxuICAgKiBJdHMgYXNzb2NpYXRlZCB7QGxpbmsgVlJNSHVtYW5vaWR9LlxuICAgKi9cbiAgcHVibGljIHJlYWRvbmx5IGh1bWFub2lkOiBWUk1IdW1hbm9pZDtcblxuICAvKipcbiAgICogQSB7QGxpbmsgVlJNTG9va0F0UmFuZ2VNYXB9IGZvciBob3Jpem9udGFsIGlud2FyZCBtb3ZlbWVudC4gVGhlIGxlZnQgZXllIG1vdmVzIHJpZ2h0LiBUaGUgcmlnaHQgZXllIG1vdmVzIGxlZnQuXG4gICAqL1xuICBwdWJsaWMgcmFuZ2VNYXBIb3Jpem9udGFsSW5uZXI6IFZSTUxvb2tBdFJhbmdlTWFwO1xuXG4gIC8qKlxuICAgKiBBIHtAbGluayBWUk1Mb29rQXRSYW5nZU1hcH0gZm9yIGhvcml6b250YWwgb3V0d2FyZCBtb3ZlbWVudC4gVGhlIGxlZnQgZXllIG1vdmVzIGxlZnQuIFRoZSByaWdodCBleWUgbW92ZXMgcmlnaHQuXG4gICAqL1xuICBwdWJsaWMgcmFuZ2VNYXBIb3Jpem9udGFsT3V0ZXI6IFZSTUxvb2tBdFJhbmdlTWFwO1xuXG4gIC8qKlxuICAgKiBBIHtAbGluayBWUk1Mb29rQXRSYW5nZU1hcH0gZm9yIHZlcnRpY2FsIGRvd253YXJkIG1vdmVtZW50LiBCb3RoIGV5ZXMgbW92ZSB1cHdhcmRzLlxuICAgKi9cbiAgcHVibGljIHJhbmdlTWFwVmVydGljYWxEb3duOiBWUk1Mb29rQXRSYW5nZU1hcDtcblxuICAvKipcbiAgICogQSB7QGxpbmsgVlJNTG9va0F0UmFuZ2VNYXB9IGZvciB2ZXJ0aWNhbCB1cHdhcmQgbW92ZW1lbnQuIEJvdGggZXllcyBtb3ZlIGRvd253YXJkcy5cbiAgICovXG4gIHB1YmxpYyByYW5nZU1hcFZlcnRpY2FsVXA6IFZSTUxvb2tBdFJhbmdlTWFwO1xuXG4gIC8qKlxuICAgKiBUaGUgZnJvbnQgZGlyZWN0aW9uIG9mIHRoZSBmYWNlLlxuICAgKiBJbnRlbmRlZCB0byBiZSB1c2VkIGZvciBWUk0gMC4wIGNvbXBhdCAoVlJNIDAuMCBtb2RlbHMgYXJlIGZhY2luZyBaLSBpbnN0ZWFkIG9mIForKS5cbiAgICogWW91IHVzdWFsbHkgZG9uJ3Qgd2FudCB0byB0b3VjaCB0aGlzLlxuICAgKi9cbiAgcHVibGljIGZhY2VGcm9udDogVEhSRUUuVmVjdG9yMztcblxuICAvKipcbiAgICogVGhlIHJlc3QgcXVhdGVybmlvbiBvZiBMZWZ0RXllIGJvbmUuXG4gICAqL1xuICBwcml2YXRlIF9yZXN0UXVhdExlZnRFeWU6IFRIUkVFLlF1YXRlcm5pb247XG5cbiAgLyoqXG4gICAqIFRoZSByZXN0IHF1YXRlcm5pb24gb2YgUmlnaHRFeWUgYm9uZS5cbiAgICovXG4gIHByaXZhdGUgX3Jlc3RRdWF0UmlnaHRFeWU6IFRIUkVFLlF1YXRlcm5pb247XG5cbiAgLyoqXG4gICAqIFRoZSB3b3JsZC1zcGFjZSByZXN0IHF1YXRlcm5pb24gb2YgdGhlIHBhcmVudCBvZiB0aGUgaHVtYW5vaWQgTGVmdEV5ZS5cbiAgICovXG4gIHByaXZhdGUgX3Jlc3RMZWZ0RXllUGFyZW50V29ybGRRdWF0OiBUSFJFRS5RdWF0ZXJuaW9uO1xuXG4gIC8qKlxuICAgKiBUaGUgd29ybGQtc3BhY2UgcmVzdCBxdWF0ZXJuaW9uIG9mIHRoZSBwYXJlbnQgb2YgdGhlIGh1bWFub2lkIFJpZ2h0RXllLlxuICAgKi9cbiAgcHJpdmF0ZSBfcmVzdFJpZ2h0RXllUGFyZW50V29ybGRRdWF0OiBUSFJFRS5RdWF0ZXJuaW9uO1xuXG4gIC8qKlxuICAgKiBDcmVhdGUgYSBuZXcge0BsaW5rIFZSTUxvb2tBdEJvbmVBcHBsaWVyfS5cbiAgICpcbiAgICogQHBhcmFtIGh1bWFub2lkIEEge0BsaW5rIFZSTUh1bWFub2lkfVxuICAgKiBAcGFyYW0gcmFuZ2VNYXBIb3Jpem9udGFsSW5uZXIgQSB7QGxpbmsgVlJNTG9va0F0UmFuZ2VNYXB9IHVzZWQgZm9yIGlubmVyIHRyYW5zdmVyc2UgZGlyZWN0aW9uXG4gICAqIEBwYXJhbSByYW5nZU1hcEhvcml6b250YWxPdXRlciBBIHtAbGluayBWUk1Mb29rQXRSYW5nZU1hcH0gdXNlZCBmb3Igb3V0ZXIgdHJhbnN2ZXJzZSBkaXJlY3Rpb25cbiAgICogQHBhcmFtIHJhbmdlTWFwVmVydGljYWxEb3duIEEge0BsaW5rIFZSTUxvb2tBdFJhbmdlTWFwfSB1c2VkIGZvciBkb3duIGRpcmVjdGlvblxuICAgKiBAcGFyYW0gcmFuZ2VNYXBWZXJ0aWNhbFVwIEEge0BsaW5rIFZSTUxvb2tBdFJhbmdlTWFwfSB1c2VkIGZvciB1cCBkaXJlY3Rpb25cbiAgICovXG4gIHB1YmxpYyBjb25zdHJ1Y3RvcihcbiAgICBodW1hbm9pZDogVlJNSHVtYW5vaWQsXG4gICAgcmFuZ2VNYXBIb3Jpem9udGFsSW5uZXI6IFZSTUxvb2tBdFJhbmdlTWFwLFxuICAgIHJhbmdlTWFwSG9yaXpvbnRhbE91dGVyOiBWUk1Mb29rQXRSYW5nZU1hcCxcbiAgICByYW5nZU1hcFZlcnRpY2FsRG93bjogVlJNTG9va0F0UmFuZ2VNYXAsXG4gICAgcmFuZ2VNYXBWZXJ0aWNhbFVwOiBWUk1Mb29rQXRSYW5nZU1hcCxcbiAgKSB7XG4gICAgdGhpcy5odW1hbm9pZCA9IGh1bWFub2lkO1xuXG4gICAgdGhpcy5yYW5nZU1hcEhvcml6b250YWxJbm5lciA9IHJhbmdlTWFwSG9yaXpvbnRhbElubmVyO1xuICAgIHRoaXMucmFuZ2VNYXBIb3Jpem9udGFsT3V0ZXIgPSByYW5nZU1hcEhvcml6b250YWxPdXRlcjtcbiAgICB0aGlzLnJhbmdlTWFwVmVydGljYWxEb3duID0gcmFuZ2VNYXBWZXJ0aWNhbERvd247XG4gICAgdGhpcy5yYW5nZU1hcFZlcnRpY2FsVXAgPSByYW5nZU1hcFZlcnRpY2FsVXA7XG5cbiAgICB0aGlzLmZhY2VGcm9udCA9IG5ldyBUSFJFRS5WZWN0b3IzKDAuMCwgMC4wLCAxLjApO1xuXG4gICAgLy8gc2V0IHJlc3QgcXVhdGVybmlvbnNcbiAgICB0aGlzLl9yZXN0UXVhdExlZnRFeWUgPSBuZXcgVEhSRUUuUXVhdGVybmlvbigpO1xuICAgIHRoaXMuX3Jlc3RRdWF0UmlnaHRFeWUgPSBuZXcgVEhSRUUuUXVhdGVybmlvbigpO1xuICAgIHRoaXMuX3Jlc3RMZWZ0RXllUGFyZW50V29ybGRRdWF0ID0gbmV3IFRIUkVFLlF1YXRlcm5pb24oKTtcbiAgICB0aGlzLl9yZXN0UmlnaHRFeWVQYXJlbnRXb3JsZFF1YXQgPSBuZXcgVEhSRUUuUXVhdGVybmlvbigpO1xuXG4gICAgY29uc3QgbGVmdEV5ZSA9IHRoaXMuaHVtYW5vaWQuZ2V0UmF3Qm9uZU5vZGUoJ2xlZnRFeWUnKTtcbiAgICBjb25zdCByaWdodEV5ZSA9IHRoaXMuaHVtYW5vaWQuZ2V0UmF3Qm9uZU5vZGUoJ3JpZ2h0RXllJyk7XG5cbiAgICBpZiAobGVmdEV5ZSkge1xuICAgICAgdGhpcy5fcmVzdFF1YXRMZWZ0RXllLmNvcHkobGVmdEV5ZS5xdWF0ZXJuaW9uKTtcbiAgICAgIGdldFdvcmxkUXVhdGVybmlvbkxpdGUobGVmdEV5ZS5wYXJlbnQhLCB0aGlzLl9yZXN0TGVmdEV5ZVBhcmVudFdvcmxkUXVhdCk7XG4gICAgfVxuXG4gICAgaWYgKHJpZ2h0RXllKSB7XG4gICAgICB0aGlzLl9yZXN0UXVhdFJpZ2h0RXllLmNvcHkocmlnaHRFeWUucXVhdGVybmlvbik7XG4gICAgICBnZXRXb3JsZFF1YXRlcm5pb25MaXRlKHJpZ2h0RXllLnBhcmVudCEsIHRoaXMuX3Jlc3RSaWdodEV5ZVBhcmVudFdvcmxkUXVhdCk7XG4gICAgfVxuICB9XG5cbiAgLyoqXG4gICAqIEFwcGx5IHRoZSBpbnB1dCBhbmdsZSB0byBpdHMgYXNzb2NpYXRlZCBWUk0gbW9kZWwuXG4gICAqXG4gICAqIEBwYXJhbSB5YXcgUm90YXRpb24gYXJvdW5kIFkgYXhpcywgaW4gZGVncmVlXG4gICAqIEBwYXJhbSBwaXRjaCBSb3RhdGlvbiBhcm91bmQgWCBheGlzLCBpbiBkZWdyZWVcbiAgICovXG4gIHB1YmxpYyBhcHBseVlhd1BpdGNoKHlhdzogbnVtYmVyLCBwaXRjaDogbnVtYmVyKTogdm9pZCB7XG4gICAgY29uc3QgbGVmdEV5ZSA9IHRoaXMuaHVtYW5vaWQuZ2V0UmF3Qm9uZU5vZGUoJ2xlZnRFeWUnKTtcbiAgICBjb25zdCByaWdodEV5ZSA9IHRoaXMuaHVtYW5vaWQuZ2V0UmF3Qm9uZU5vZGUoJ3JpZ2h0RXllJyk7XG4gICAgY29uc3QgbGVmdEV5ZU5vcm1hbGl6ZWQgPSB0aGlzLmh1bWFub2lkLmdldE5vcm1hbGl6ZWRCb25lTm9kZSgnbGVmdEV5ZScpO1xuICAgIGNvbnN0IHJpZ2h0RXllTm9ybWFsaXplZCA9IHRoaXMuaHVtYW5vaWQuZ2V0Tm9ybWFsaXplZEJvbmVOb2RlKCdyaWdodEV5ZScpO1xuICAgIC8vIGxlZnRcbiAgICBpZiAobGVmdEV5ZSkge1xuICAgICAgaWYgKHBpdGNoIDwgMC4wKSB7XG4gICAgICAgIF9ldWxlckEueCA9IC1USFJFRS5NYXRoVXRpbHMuREVHMlJBRCAqIHRoaXMucmFuZ2VNYXBWZXJ0aWNhbERvd24ubWFwKC1waXRjaCk7XG4gICAgICB9IGVsc2Uge1xuICAgICAgICBfZXVsZXJBLnggPSBUSFJFRS5NYXRoVXRpbHMuREVHMlJBRCAqIHRoaXMucmFuZ2VNYXBWZXJ0aWNhbFVwLm1hcChwaXRjaCk7XG4gICAgICB9XG5cbiAgICAgIGlmICh5YXcgPCAwLjApIHtcbiAgICAgICAgX2V1bGVyQS55ID0gLVRIUkVFLk1hdGhVdGlscy5ERUcyUkFEICogdGhpcy5yYW5nZU1hcEhvcml6b250YWxJbm5lci5tYXAoLXlhdyk7XG4gICAgICB9IGVsc2Uge1xuICAgICAgICBfZXVsZXJBLnkgPSBUSFJFRS5NYXRoVXRpbHMuREVHMlJBRCAqIHRoaXMucmFuZ2VNYXBIb3Jpem9udGFsT3V0ZXIubWFwKHlhdyk7XG4gICAgICB9XG5cbiAgICAgIF9xdWF0QS5zZXRGcm9tRXVsZXIoX2V1bGVyQSk7XG4gICAgICB0aGlzLl9nZXRXb3JsZEZhY2VGcm9udFF1YXQoX3F1YXRCKTtcblxuICAgICAgLy8gX3F1YXRCICogX3F1YXRBICogX3F1YXRCXi0xXG4gICAgICAvLyB3aGVyZSBfcXVhdEEgaXMgTG9va0F0IHJvdGF0aW9uXG4gICAgICAvLyBhbmQgX3F1YXRCIGlzIHdvcmxkRmFjZUZyb250UXVhdFxuICAgICAgbGVmdEV5ZU5vcm1hbGl6ZWQhLnF1YXRlcm5pb24uY29weShfcXVhdEIpLm11bHRpcGx5KF9xdWF0QSkubXVsdGlwbHkoX3F1YXRCLmludmVydCgpKTtcblxuICAgICAgX3F1YXRBLmNvcHkodGhpcy5fcmVzdExlZnRFeWVQYXJlbnRXb3JsZFF1YXQpO1xuXG4gICAgICAvLyBfcXVhdEFeLTEgKiBsZWZ0RXllTm9ybWFsaXplZC5xdWF0ZXJuaW9uICogX3F1YXRBICogcmVzdFF1YXRMZWZ0RXllXG4gICAgICAvLyB3aGVyZSBfcXVhdEEgaXMgcmVzdExlZnRFeWVQYXJlbnRXb3JsZFF1YXRcbiAgICAgIGxlZnRFeWUucXVhdGVybmlvblxuICAgICAgICAuY29weShsZWZ0RXllTm9ybWFsaXplZCEucXVhdGVybmlvbilcbiAgICAgICAgLm11bHRpcGx5KF9xdWF0QSlcbiAgICAgICAgLnByZW11bHRpcGx5KF9xdWF0QS5pbnZlcnQoKSlcbiAgICAgICAgLm11bHRpcGx5KHRoaXMuX3Jlc3RRdWF0TGVmdEV5ZSk7XG4gICAgfVxuXG4gICAgLy8gcmlnaHRcbiAgICBpZiAocmlnaHRFeWUpIHtcbiAgICAgIGlmIChwaXRjaCA8IDAuMCkge1xuICAgICAgICBfZXVsZXJBLnggPSAtVEhSRUUuTWF0aFV0aWxzLkRFRzJSQUQgKiB0aGlzLnJhbmdlTWFwVmVydGljYWxEb3duLm1hcCgtcGl0Y2gpO1xuICAgICAgfSBlbHNlIHtcbiAgICAgICAgX2V1bGVyQS54ID0gVEhSRUUuTWF0aFV0aWxzLkRFRzJSQUQgKiB0aGlzLnJhbmdlTWFwVmVydGljYWxVcC5tYXAocGl0Y2gpO1xuICAgICAgfVxuXG4gICAgICBpZiAoeWF3IDwgMC4wKSB7XG4gICAgICAgIF9ldWxlckEueSA9IC1USFJFRS5NYXRoVXRpbHMuREVHMlJBRCAqIHRoaXMucmFuZ2VNYXBIb3Jpem9udGFsT3V0ZXIubWFwKC15YXcpO1xuICAgICAgfSBlbHNlIHtcbiAgICAgICAgX2V1bGVyQS55ID0gVEhSRUUuTWF0aFV0aWxzLkRFRzJSQUQgKiB0aGlzLnJhbmdlTWFwSG9yaXpvbnRhbElubmVyLm1hcCh5YXcpO1xuICAgICAgfVxuXG4gICAgICBfcXVhdEEuc2V0RnJvbUV1bGVyKF9ldWxlckEpO1xuICAgICAgdGhpcy5fZ2V0V29ybGRGYWNlRnJvbnRRdWF0KF9xdWF0Qik7XG5cbiAgICAgIC8vIF9xdWF0QiAqIF9xdWF0QSAqIF9xdWF0Ql4tMVxuICAgICAgLy8gd2hlcmUgX3F1YXRBIGlzIExvb2tBdCByb3RhdGlvblxuICAgICAgLy8gYW5kIF9xdWF0QiBpcyB3b3JsZEZhY2VGcm9udFF1YXRcbiAgICAgIHJpZ2h0RXllTm9ybWFsaXplZCEucXVhdGVybmlvbi5jb3B5KF9xdWF0QikubXVsdGlwbHkoX3F1YXRBKS5tdWx0aXBseShfcXVhdEIuaW52ZXJ0KCkpO1xuXG4gICAgICBfcXVhdEEuY29weSh0aGlzLl9yZXN0UmlnaHRFeWVQYXJlbnRXb3JsZFF1YXQpO1xuXG4gICAgICAvLyBfcXVhdEFeLTEgKiByaWdodEV5ZU5vcm1hbGl6ZWQucXVhdGVybmlvbiAqIF9xdWF0QSAqIHJlc3RRdWF0UmlnaHRFeWVcbiAgICAgIC8vIHdoZXJlIF9xdWF0QSBpcyByZXN0UmlnaHRFeWVQYXJlbnRXb3JsZFF1YXRcbiAgICAgIHJpZ2h0RXllLnF1YXRlcm5pb25cbiAgICAgICAgLmNvcHkocmlnaHRFeWVOb3JtYWxpemVkIS5xdWF0ZXJuaW9uKVxuICAgICAgICAubXVsdGlwbHkoX3F1YXRBKVxuICAgICAgICAucHJlbXVsdGlwbHkoX3F1YXRBLmludmVydCgpKVxuICAgICAgICAubXVsdGlwbHkodGhpcy5fcmVzdFF1YXRSaWdodEV5ZSk7XG4gICAgfVxuICB9XG5cbiAgLyoqXG4gICAqIEBkZXByZWNhdGVkIFVzZSB7QGxpbmsgYXBwbHlZYXdQaXRjaH0gaW5zdGVhZC5cbiAgICovXG4gIHB1YmxpYyBsb29rQXQoZXVsZXI6IFRIUkVFLkV1bGVyKTogdm9pZCB7XG4gICAgY29uc29sZS53YXJuKCdWUk1Mb29rQXRCb25lQXBwbGllcjogbG9va0F0KCkgaXMgZGVwcmVjYXRlZC4gdXNlIGFwcGx5KCkgaW5zdGVhZC4nKTtcblxuICAgIGNvbnN0IHlhdyA9IFRIUkVFLk1hdGhVdGlscy5SQUQyREVHICogZXVsZXIueTtcbiAgICBjb25zdCBwaXRjaCA9IFRIUkVFLk1hdGhVdGlscy5SQUQyREVHICogZXVsZXIueDtcblxuICAgIHRoaXMuYXBwbHlZYXdQaXRjaCh5YXcsIHBpdGNoKTtcbiAgfVxuXG4gIC8qKlxuICAgKiBHZXQgYSBxdWF0ZXJuaW9uIHRoYXQgcm90YXRlcyB0aGUgd29ybGQtc3BhY2UgK1ogdW5pdCB2ZWN0b3IgdG8gdGhlIHtAbGluayBmYWNlRnJvbnR9IGRpcmVjdGlvbi5cbiAgICpcbiAgICogQHBhcmFtIHRhcmdldCBBIHRhcmdldCBgVEhSRUUuUXVhdGVybmlvbmBcbiAgICovXG4gIHByaXZhdGUgX2dldFdvcmxkRmFjZUZyb250UXVhdCh0YXJnZXQ6IFRIUkVFLlF1YXRlcm5pb24pOiBUSFJFRS5RdWF0ZXJuaW9uIHtcbiAgICBpZiAodGhpcy5mYWNlRnJvbnQuZGlzdGFuY2VUb1NxdWFyZWQoVkVDM19QT1NJVElWRV9aKSA8IDAuMDEpIHtcbiAgICAgIHJldHVybiB0YXJnZXQuaWRlbnRpdHkoKTtcbiAgICB9XG5cbiAgICBjb25zdCBbZmFjZUZyb250QXppbXV0aCwgZmFjZUZyb250QWx0aXR1ZGVdID0gY2FsY0F6aW11dGhBbHRpdHVkZSh0aGlzLmZhY2VGcm9udCk7XG4gICAgX2V1bGVyQS5zZXQoMC4wLCAwLjUgKiBNYXRoLlBJICsgZmFjZUZyb250QXppbXV0aCwgZmFjZUZyb250QWx0aXR1ZGUsICdZWlgnKTtcblxuICAgIHJldHVybiB0YXJnZXQuc2V0RnJvbUV1bGVyKF9ldWxlckEpO1xuICB9XG59XG4iLCAiaW1wb3J0IHsgVlJNRXhwcmVzc2lvbk1hbmFnZXIgfSBmcm9tICcuLi9leHByZXNzaW9ucyc7XG5pbXBvcnQgKiBhcyBUSFJFRSBmcm9tICd0aHJlZSc7XG5pbXBvcnQgdHlwZSB7IFZSTUxvb2tBdEFwcGxpZXIgfSBmcm9tICcuL1ZSTUxvb2tBdEFwcGxpZXInO1xuaW1wb3J0IHsgVlJNTG9va0F0UmFuZ2VNYXAgfSBmcm9tICcuL1ZSTUxvb2tBdFJhbmdlTWFwJztcblxuLyoqXG4gKiBBIGNsYXNzIHRoYXQgYXBwbGllcyBleWUgZ2F6ZSBkaXJlY3Rpb25zIHRvIGEgVlJNLlxuICogSXQgd2lsbCBiZSB1c2VkIGJ5IHtAbGluayBWUk1Mb29rQXR9LlxuICovXG5leHBvcnQgY2xhc3MgVlJNTG9va0F0RXhwcmVzc2lvbkFwcGxpZXIgaW1wbGVtZW50cyBWUk1Mb29rQXRBcHBsaWVyIHtcbiAgLyoqXG4gICAqIFJlcHJlc2VudCBpdHMgdHlwZSBvZiBhcHBsaWVyLlxuICAgKi9cbiAgcHVibGljIHN0YXRpYyByZWFkb25seSB0eXBlID0gJ2V4cHJlc3Npb24nO1xuXG4gIC8qKlxuICAgKiBJdHMgYXNzb2NpYXRlZCB7QGxpbmsgVlJNRXhwcmVzc2lvbk1hbmFnZXJ9LlxuICAgKi9cbiAgcHVibGljIHJlYWRvbmx5IGV4cHJlc3Npb25zOiBWUk1FeHByZXNzaW9uTWFuYWdlcjtcblxuICAvKipcbiAgICogSXQgd29uJ3QgYmUgdXNlZCBpbiBleHByZXNzaW9uIGFwcGxpZXIuXG4gICAqIFNlZSBhbHNvOiB7QGxpbmsgcmFuZ2VNYXBIb3Jpem9udGFsT3V0ZXJ9XG4gICAqL1xuICBwdWJsaWMgcmFuZ2VNYXBIb3Jpem9udGFsSW5uZXI6IFZSTUxvb2tBdFJhbmdlTWFwO1xuXG4gIC8qKlxuICAgKiBBIHtAbGluayBWUk1Mb29rQXRSYW5nZU1hcH0gZm9yIGhvcml6b250YWwgbW92ZW1lbnQuIEJvdGggZXllcyBtb3ZlIGxlZnQgb3IgcmlnaHQuXG4gICAqL1xuICBwdWJsaWMgcmFuZ2VNYXBIb3Jpem9udGFsT3V0ZXI6IFZSTUxvb2tBdFJhbmdlTWFwO1xuXG4gIC8qKlxuICAgKiBBIHtAbGluayBWUk1Mb29rQXRSYW5nZU1hcH0gZm9yIHZlcnRpY2FsIGRvd253YXJkIG1vdmVtZW50LiBCb3RoIGV5ZXMgbW92ZSB1cHdhcmRzLlxuICAgKi9cbiAgcHVibGljIHJhbmdlTWFwVmVydGljYWxEb3duOiBWUk1Mb29rQXRSYW5nZU1hcDtcblxuICAvKipcbiAgICogQSB7QGxpbmsgVlJNTG9va0F0UmFuZ2VNYXB9IGZvciB2ZXJ0aWNhbCB1cHdhcmQgbW92ZW1lbnQuIEJvdGggZXllcyBtb3ZlIGRvd253YXJkcy5cbiAgICovXG4gIHB1YmxpYyByYW5nZU1hcFZlcnRpY2FsVXA6IFZSTUxvb2tBdFJhbmdlTWFwO1xuXG4gIC8qKlxuICAgKiBDcmVhdGUgYSBuZXcge0BsaW5rIFZSTUxvb2tBdEV4cHJlc3Npb25BcHBsaWVyfS5cbiAgICpcbiAgICogQHBhcmFtIGV4cHJlc3Npb25zIEEge0BsaW5rIFZSTUV4cHJlc3Npb25NYW5hZ2VyfVxuICAgKiBAcGFyYW0gcmFuZ2VNYXBIb3Jpem9udGFsSW5uZXIgQSB7QGxpbmsgVlJNTG9va0F0UmFuZ2VNYXB9IHVzZWQgZm9yIGlubmVyIHRyYW5zdmVyc2UgZGlyZWN0aW9uXG4gICAqIEBwYXJhbSByYW5nZU1hcEhvcml6b250YWxPdXRlciBBIHtAbGluayBWUk1Mb29rQXRSYW5nZU1hcH0gdXNlZCBmb3Igb3V0ZXIgdHJhbnN2ZXJzZSBkaXJlY3Rpb25cbiAgICogQHBhcmFtIHJhbmdlTWFwVmVydGljYWxEb3duIEEge0BsaW5rIFZSTUxvb2tBdFJhbmdlTWFwfSB1c2VkIGZvciBkb3duIGRpcmVjdGlvblxuICAgKiBAcGFyYW0gcmFuZ2VNYXBWZXJ0aWNhbFVwIEEge0BsaW5rIFZSTUxvb2tBdFJhbmdlTWFwfSB1c2VkIGZvciB1cCBkaXJlY3Rpb25cbiAgICovXG4gIHB1YmxpYyBjb25zdHJ1Y3RvcihcbiAgICBleHByZXNzaW9uczogVlJNRXhwcmVzc2lvbk1hbmFnZXIsXG4gICAgcmFuZ2VNYXBIb3Jpem9udGFsSW5uZXI6IFZSTUxvb2tBdFJhbmdlTWFwLFxuICAgIHJhbmdlTWFwSG9yaXpvbnRhbE91dGVyOiBWUk1Mb29rQXRSYW5nZU1hcCxcbiAgICByYW5nZU1hcFZlcnRpY2FsRG93bjogVlJNTG9va0F0UmFuZ2VNYXAsXG4gICAgcmFuZ2VNYXBWZXJ0aWNhbFVwOiBWUk1Mb29rQXRSYW5nZU1hcCxcbiAgKSB7XG4gICAgdGhpcy5leHByZXNzaW9ucyA9IGV4cHJlc3Npb25zO1xuXG4gICAgdGhpcy5yYW5nZU1hcEhvcml6b250YWxJbm5lciA9IHJhbmdlTWFwSG9yaXpvbnRhbElubmVyO1xuICAgIHRoaXMucmFuZ2VNYXBIb3Jpem9udGFsT3V0ZXIgPSByYW5nZU1hcEhvcml6b250YWxPdXRlcjtcbiAgICB0aGlzLnJhbmdlTWFwVmVydGljYWxEb3duID0gcmFuZ2VNYXBWZXJ0aWNhbERvd247XG4gICAgdGhpcy5yYW5nZU1hcFZlcnRpY2FsVXAgPSByYW5nZU1hcFZlcnRpY2FsVXA7XG4gIH1cblxuICAvKipcbiAgICogQXBwbHkgdGhlIGlucHV0IGFuZ2xlIHRvIGl0cyBhc3NvY2lhdGVkIFZSTSBtb2RlbC5cbiAgICpcbiAgICogQHBhcmFtIHlhdyBSb3RhdGlvbiBhcm91bmQgWSBheGlzLCBpbiBkZWdyZWVcbiAgICogQHBhcmFtIHBpdGNoIFJvdGF0aW9uIGFyb3VuZCBYIGF4aXMsIGluIGRlZ3JlZVxuICAgKi9cbiAgcHVibGljIGFwcGx5WWF3UGl0Y2goeWF3OiBudW1iZXIsIHBpdGNoOiBudW1iZXIpOiB2b2lkIHtcbiAgICBpZiAocGl0Y2ggPCAwLjApIHtcbiAgICAgIHRoaXMuZXhwcmVzc2lvbnMuc2V0VmFsdWUoJ2xvb2tEb3duJywgMC4wKTtcbiAgICAgIHRoaXMuZXhwcmVzc2lvbnMuc2V0VmFsdWUoJ2xvb2tVcCcsIHRoaXMucmFuZ2VNYXBWZXJ0aWNhbFVwLm1hcCgtcGl0Y2gpKTtcbiAgICB9IGVsc2Uge1xuICAgICAgdGhpcy5leHByZXNzaW9ucy5zZXRWYWx1ZSgnbG9va1VwJywgMC4wKTtcbiAgICAgIHRoaXMuZXhwcmVzc2lvbnMuc2V0VmFsdWUoJ2xvb2tEb3duJywgdGhpcy5yYW5nZU1hcFZlcnRpY2FsRG93bi5tYXAocGl0Y2gpKTtcbiAgICB9XG5cbiAgICBpZiAoeWF3IDwgMC4wKSB7XG4gICAgICB0aGlzLmV4cHJlc3Npb25zLnNldFZhbHVlKCdsb29rTGVmdCcsIDAuMCk7XG4gICAgICB0aGlzLmV4cHJlc3Npb25zLnNldFZhbHVlKCdsb29rUmlnaHQnLCB0aGlzLnJhbmdlTWFwSG9yaXpvbnRhbE91dGVyLm1hcCgteWF3KSk7XG4gICAgfSBlbHNlIHtcbiAgICAgIHRoaXMuZXhwcmVzc2lvbnMuc2V0VmFsdWUoJ2xvb2tSaWdodCcsIDAuMCk7XG4gICAgICB0aGlzLmV4cHJlc3Npb25zLnNldFZhbHVlKCdsb29rTGVmdCcsIHRoaXMucmFuZ2VNYXBIb3Jpem9udGFsT3V0ZXIubWFwKHlhdykpO1xuICAgIH1cbiAgfVxuXG4gIC8qKlxuICAgKiBAZGVwcmVjYXRlZCBVc2Uge0BsaW5rIGFwcGx5WWF3UGl0Y2h9IGluc3RlYWQuXG4gICAqL1xuICBwdWJsaWMgbG9va0F0KGV1bGVyOiBUSFJFRS5FdWxlcik6IHZvaWQge1xuICAgIGNvbnNvbGUud2FybignVlJNTG9va0F0Qm9uZUFwcGxpZXI6IGxvb2tBdCgpIGlzIGRlcHJlY2F0ZWQuIHVzZSBhcHBseSgpIGluc3RlYWQuJyk7XG5cbiAgICBjb25zdCB5YXcgPSBUSFJFRS5NYXRoVXRpbHMuUkFEMkRFRyAqIGV1bGVyLnk7XG4gICAgY29uc3QgcGl0Y2ggPSBUSFJFRS5NYXRoVXRpbHMuUkFEMkRFRyAqIGV1bGVyLng7XG5cbiAgICB0aGlzLmFwcGx5WWF3UGl0Y2goeWF3LCBwaXRjaCk7XG4gIH1cbn1cbiIsICJpbXBvcnQgeyBzYXR1cmF0ZSB9IGZyb20gJy4uL3V0aWxzL3NhdHVyYXRlJztcblxuZXhwb3J0IGNsYXNzIFZSTUxvb2tBdFJhbmdlTWFwIHtcbiAgLyoqXG4gICAqIExpbWl0cyB0aGUgbWF4aW11bSBhbmdsZSBvZiB0aGUgaW5wdXQgYW5nbGUgb2YgdGhlIExvb2tBdCB2ZWN0b3IgZnJvbSB0aGUgZnJvbnQgb2YgdGhlIGhlYWQgKHRoZSBwb3NpdGl2ZSB6IGF4aXMpLlxuICAgKi9cbiAgcHVibGljIGlucHV0TWF4VmFsdWU6IG51bWJlcjtcblxuICAvKipcbiAgICogUmVwcmVzZW50cyBhbiBhbmdsZSAoaW4gZGVncmVlcykgZm9yIGJvbmUgdHlwZSBvZiBMb29rQXQgYXBwbGllcnMsIG9yIGEgd2VpZ2h0IGZvciBleHByZXNzaW9uIHR5cGUgb2YgTG9va0F0IGFwcGxpZXJzLlxuICAgKiBUaGUgaW5wdXQgdmFsdWUgd2lsbCB0YWtlIGAxLjBgIHdoZW4gdGhlIGlucHV0IGFuZ2xlIGVxdWFscyAob3IgZ3JlYXRlcikgdG8ge0BsaW5rIGlucHV0TWF4VmFsdWV9LlxuICAgKi9cbiAgcHVibGljIG91dHB1dFNjYWxlOiBudW1iZXI7XG5cbiAgLyoqXG4gICAqIENyZWF0ZSBhIG5ldyB7QGxpbmsgVlJNTG9va0F0UmFuZ2VNYXB9LlxuICAgKlxuICAgKiBAcGFyYW0gaW5wdXRNYXhWYWx1ZSBUaGUge0BsaW5rIGlucHV0TWF4VmFsdWV9IG9mIHRoZSBtYXBcbiAgICogQHBhcmFtIG91dHB1dFNjYWxlIFRoZSB7QGxpbmsgb3V0cHV0U2NhbGV9IG9mIHRoZSBtYXBcbiAgICovXG4gIHB1YmxpYyBjb25zdHJ1Y3RvcihpbnB1dE1heFZhbHVlOiBudW1iZXIsIG91dHB1dFNjYWxlOiBudW1iZXIpIHtcbiAgICB0aGlzLmlucHV0TWF4VmFsdWUgPSBpbnB1dE1heFZhbHVlO1xuICAgIHRoaXMub3V0cHV0U2NhbGUgPSBvdXRwdXRTY2FsZTtcbiAgfVxuXG4gIC8qKlxuICAgKiBFdmFsdWF0ZSBhbiBpbnB1dCB2YWx1ZSBhbmQgb3V0cHV0IGEgbWFwcGVkIHZhbHVlLlxuICAgKiBAcGFyYW0gc3JjIFRoZSBpbnB1dCB2YWx1ZVxuICAgKi9cbiAgcHVibGljIG1hcChzcmM6IG51bWJlcik6IG51bWJlciB7XG4gICAgcmV0dXJuIHRoaXMub3V0cHV0U2NhbGUgKiBzYXR1cmF0ZShzcmMgLyB0aGlzLmlucHV0TWF4VmFsdWUpO1xuICB9XG59XG4iLCAiaW1wb3J0IHR5cGUgKiBhcyBUSFJFRSBmcm9tICd0aHJlZSc7XG5pbXBvcnQgdHlwZSAqIGFzIFYwVlJNIGZyb20gJ0BwaXhpdi90eXBlcy12cm0tMC4wJztcbmltcG9ydCB0eXBlICogYXMgVjFWUk1TY2hlbWEgZnJvbSAnQHBpeGl2L3R5cGVzLXZybWMtdnJtLTEuMCc7XG5pbXBvcnQgdHlwZSB7IEdMVEYsIEdMVEZMb2FkZXJQbHVnaW4sIEdMVEZQYXJzZXIgfSBmcm9tICd0aHJlZS9leGFtcGxlcy9qc20vbG9hZGVycy9HTFRGTG9hZGVyLmpzJztcbmltcG9ydCB0eXBlIHsgVlJNRXhwcmVzc2lvbk1hbmFnZXIgfSBmcm9tICcuLi9leHByZXNzaW9ucy9WUk1FeHByZXNzaW9uTWFuYWdlcic7XG5pbXBvcnQgdHlwZSB7IFZSTUh1bWFub2lkIH0gZnJvbSAnLi4vaHVtYW5vaWQvVlJNSHVtYW5vaWQnO1xuaW1wb3J0IHsgVlJNTG9va0F0SGVscGVyIH0gZnJvbSAnLi9oZWxwZXJzL1ZSTUxvb2tBdEhlbHBlcic7XG5pbXBvcnQgeyBWUk1Mb29rQXQgfSBmcm9tICcuL1ZSTUxvb2tBdCc7XG5pbXBvcnQgdHlwZSB7IFZSTUxvb2tBdEFwcGxpZXIgfSBmcm9tICcuL1ZSTUxvb2tBdEFwcGxpZXInO1xuaW1wb3J0IHsgVlJNTG9va0F0Qm9uZUFwcGxpZXIgfSBmcm9tICcuL1ZSTUxvb2tBdEJvbmVBcHBsaWVyJztcbmltcG9ydCB7IFZSTUxvb2tBdEV4cHJlc3Npb25BcHBsaWVyIH0gZnJvbSAnLi9WUk1Mb29rQXRFeHByZXNzaW9uQXBwbGllcic7XG5pbXBvcnQgdHlwZSB7IFZSTUxvb2tBdExvYWRlclBsdWdpbk9wdGlvbnMgfSBmcm9tICcuL1ZSTUxvb2tBdExvYWRlclBsdWdpbk9wdGlvbnMnO1xuaW1wb3J0IHsgVlJNTG9va0F0UmFuZ2VNYXAgfSBmcm9tICcuL1ZSTUxvb2tBdFJhbmdlTWFwJztcbmltcG9ydCB7IEdMVEYgYXMgR0xURlNjaGVtYSB9IGZyb20gJ0BnbHRmLXRyYW5zZm9ybS9jb3JlJztcblxuLyoqXG4gKiBQb3NzaWJsZSBzcGVjIHZlcnNpb25zIGl0IHJlY29nbml6ZXMuXG4gKi9cbmNvbnN0IFBPU1NJQkxFX1NQRUNfVkVSU0lPTlMgPSBuZXcgU2V0KFsnMS4wJywgJzEuMC1iZXRhJ10pO1xuXG4vKipcbiAqIFRoZSBtaW5pbXVtIHBlcm1pdHRlZCB2YWx1ZSBmb3Ige0BsaW5rIFYxVlJNU2NoZW1hLkxvb2tBdFJhbmdlTWFwLmlucHV0TWF4VmFsdWV9LlxuICogSWYgdGhlIGdpdmVuIHZhbHVlIGlzIHNtYWxsZXIgdGhhbiB0aGlzLCB0aGUgbG9hZGVyIHNob3dzIGEgd2FybmluZyBhbmQgY2xhbXBzIHVwIHRoZSB2YWx1ZS5cbiAqL1xuY29uc3QgSU5QVVRfTUFYX1ZBTFVFX01JTklNVU0gPSAwLjAxO1xuXG4vKipcbiAqIEEgcGx1Z2luIG9mIEdMVEZMb2FkZXIgdGhhdCBpbXBvcnRzIGEge0BsaW5rIFZSTUxvb2tBdH0gZnJvbSBhIFZSTSBleHRlbnNpb24gb2YgYSBHTFRGLlxuICovXG5leHBvcnQgY2xhc3MgVlJNTG9va0F0TG9hZGVyUGx1Z2luIGltcGxlbWVudHMgR0xURkxvYWRlclBsdWdpbiB7XG4gIC8qKlxuICAgKiBTcGVjaWZ5IGFuIE9iamVjdDNEIHRvIGFkZCB7QGxpbmsgVlJNTG9va0F0SGVscGVyfSBzLlxuICAgKiBJZiBub3Qgc3BlY2lmaWVkLCBoZWxwZXIgd2lsbCBub3QgYmUgY3JlYXRlZC5cbiAgICogSWYgYHJlbmRlck9yZGVyYCBpcyBzZXQgdG8gdGhlIHJvb3QsIGhlbHBlcnMgd2lsbCBjb3B5IHRoZSBzYW1lIGByZW5kZXJPcmRlcmAgLlxuICAgKi9cbiAgcHVibGljIGhlbHBlclJvb3Q/OiBUSFJFRS5PYmplY3QzRDtcblxuICBwdWJsaWMgcmVhZG9ubHkgcGFyc2VyOiBHTFRGUGFyc2VyO1xuXG4gIHB1YmxpYyBnZXQgbmFtZSgpOiBzdHJpbmcge1xuICAgIC8vIFdlIHNob3VsZCB1c2UgdGhlIGV4dGVuc2lvbiBuYW1lIGluc3RlYWQgYnV0IHdlIGhhdmUgbXVsdGlwbGUgcGx1Z2lucyBmb3IgYW4gZXh0ZW5zaW9uLi4uXG4gICAgcmV0dXJuICdWUk1Mb29rQXRMb2FkZXJQbHVnaW4nO1xuICB9XG5cbiAgcHVibGljIGNvbnN0cnVjdG9yKHBhcnNlcjogR0xURlBhcnNlciwgb3B0aW9ucz86IFZSTUxvb2tBdExvYWRlclBsdWdpbk9wdGlvbnMpIHtcbiAgICB0aGlzLnBhcnNlciA9IHBhcnNlcjtcblxuICAgIHRoaXMuaGVscGVyUm9vdCA9IG9wdGlvbnM/LmhlbHBlclJvb3Q7XG4gIH1cblxuICBwdWJsaWMgYXN5bmMgYWZ0ZXJSb290KGdsdGY6IEdMVEYpOiBQcm9taXNlPHZvaWQ+IHtcbiAgICBjb25zdCB2cm1IdW1hbm9pZCA9IGdsdGYudXNlckRhdGEudnJtSHVtYW5vaWQgYXMgVlJNSHVtYW5vaWQgfCB1bmRlZmluZWQ7XG5cbiAgICAvLyBleHBsaWNpdGx5IGRpc3Rpbmd1aXNoIG51bGwgYW5kIHVuZGVmaW5lZFxuICAgIC8vIHNpbmNlIHZybUh1bWFub2lkIG1pZ2h0IGJlIG51bGwgYXMgYSByZXN1bHRcbiAgICBpZiAodnJtSHVtYW5vaWQgPT09IG51bGwpIHtcbiAgICAgIHJldHVybjtcbiAgICB9IGVsc2UgaWYgKHZybUh1bWFub2lkID09PSB1bmRlZmluZWQpIHtcbiAgICAgIHRocm93IG5ldyBFcnJvcignVlJNTG9va0F0TG9hZGVyUGx1Z2luOiB2cm1IdW1hbm9pZCBpcyB1bmRlZmluZWQuIFZSTUh1bWFub2lkTG9hZGVyUGx1Z2luIGhhdmUgdG8gYmUgdXNlZCBmaXJzdCcpO1xuICAgIH1cblxuICAgIGNvbnN0IHZybUV4cHJlc3Npb25NYW5hZ2VyID0gZ2x0Zi51c2VyRGF0YS52cm1FeHByZXNzaW9uTWFuYWdlciBhcyBWUk1FeHByZXNzaW9uTWFuYWdlciB8IHVuZGVmaW5lZDtcblxuICAgIGlmICh2cm1FeHByZXNzaW9uTWFuYWdlciA9PT0gbnVsbCkge1xuICAgICAgcmV0dXJuO1xuICAgIH0gZWxzZSBpZiAodnJtRXhwcmVzc2lvbk1hbmFnZXIgPT09IHVuZGVmaW5lZCkge1xuICAgICAgdGhyb3cgbmV3IEVycm9yKFxuICAgICAgICAnVlJNTG9va0F0TG9hZGVyUGx1Z2luOiB2cm1FeHByZXNzaW9uTWFuYWdlciBpcyB1bmRlZmluZWQuIFZSTUV4cHJlc3Npb25Mb2FkZXJQbHVnaW4gaGF2ZSB0byBiZSB1c2VkIGZpcnN0JyxcbiAgICAgICk7XG4gICAgfVxuXG4gICAgZ2x0Zi51c2VyRGF0YS52cm1Mb29rQXQgPSBhd2FpdCB0aGlzLl9pbXBvcnQoZ2x0ZiwgdnJtSHVtYW5vaWQsIHZybUV4cHJlc3Npb25NYW5hZ2VyKTtcbiAgfVxuXG4gIC8qKlxuICAgKiBJbXBvcnQgYSB7QGxpbmsgVlJNTG9va0F0fSBmcm9tIGEgVlJNLlxuICAgKlxuICAgKiBAcGFyYW0gZ2x0ZiBBIHBhcnNlZCByZXN1bHQgb2YgR0xURiB0YWtlbiBmcm9tIEdMVEZMb2FkZXJcbiAgICogQHBhcmFtIGh1bWFub2lkIEEge0BsaW5rIFZSTUh1bWFub2lkfSBpbnN0YW5jZSB0aGF0IHJlcHJlc2VudHMgdGhlIFZSTVxuICAgKiBAcGFyYW0gZXhwcmVzc2lvbnMgQSB7QGxpbmsgVlJNRXhwcmVzc2lvbk1hbmFnZXJ9IGluc3RhbmNlIHRoYXQgcmVwcmVzZW50cyB0aGUgVlJNXG4gICAqL1xuICBwcml2YXRlIGFzeW5jIF9pbXBvcnQoXG4gICAgZ2x0ZjogR0xURixcbiAgICBodW1hbm9pZDogVlJNSHVtYW5vaWQgfCBudWxsLFxuICAgIGV4cHJlc3Npb25zOiBWUk1FeHByZXNzaW9uTWFuYWdlciB8IG51bGwsXG4gICk6IFByb21pc2U8VlJNTG9va0F0IHwgbnVsbD4ge1xuICAgIGlmIChodW1hbm9pZCA9PSBudWxsIHx8IGV4cHJlc3Npb25zID09IG51bGwpIHtcbiAgICAgIHJldHVybiBudWxsO1xuICAgIH1cblxuICAgIGNvbnN0IHYxUmVzdWx0ID0gYXdhaXQgdGhpcy5fdjFJbXBvcnQoZ2x0ZiwgaHVtYW5vaWQsIGV4cHJlc3Npb25zKTtcbiAgICBpZiAodjFSZXN1bHQpIHtcbiAgICAgIHJldHVybiB2MVJlc3VsdDtcbiAgICB9XG5cbiAgICBjb25zdCB2MFJlc3VsdCA9IGF3YWl0IHRoaXMuX3YwSW1wb3J0KGdsdGYsIGh1bWFub2lkLCBleHByZXNzaW9ucyk7XG4gICAgaWYgKHYwUmVzdWx0KSB7XG4gICAgICByZXR1cm4gdjBSZXN1bHQ7XG4gICAgfVxuXG4gICAgcmV0dXJuIG51bGw7XG4gIH1cblxuICBwcml2YXRlIGFzeW5jIF92MUltcG9ydChcbiAgICBnbHRmOiBHTFRGLFxuICAgIGh1bWFub2lkOiBWUk1IdW1hbm9pZCxcbiAgICBleHByZXNzaW9uczogVlJNRXhwcmVzc2lvbk1hbmFnZXIsXG4gICk6IFByb21pc2U8VlJNTG9va0F0IHwgbnVsbD4ge1xuICAgIGNvbnN0IGpzb24gPSB0aGlzLnBhcnNlci5qc29uIGFzIEdMVEZTY2hlbWEuSUdMVEY7XG5cbiAgICAvLyBlYXJseSBhYm9ydCBpZiBpdCBkb2Vzbid0IHVzZSB2cm1cbiAgICBjb25zdCBpc1ZSTVVzZWQgPSBqc29uLmV4dGVuc2lvbnNVc2VkPy5pbmRleE9mKCdWUk1DX3ZybScpICE9PSAtMTtcbiAgICBpZiAoIWlzVlJNVXNlZCkge1xuICAgICAgcmV0dXJuIG51bGw7XG4gICAgfVxuXG4gICAgY29uc3QgZXh0ZW5zaW9uID0ganNvbi5leHRlbnNpb25zPy5bJ1ZSTUNfdnJtJ10gYXMgVjFWUk1TY2hlbWEuVlJNQ1ZSTSB8IHVuZGVmaW5lZDtcbiAgICBpZiAoIWV4dGVuc2lvbikge1xuICAgICAgcmV0dXJuIG51bGw7XG4gICAgfVxuXG4gICAgY29uc3Qgc3BlY1ZlcnNpb24gPSBleHRlbnNpb24uc3BlY1ZlcnNpb247XG4gICAgaWYgKCFQT1NTSUJMRV9TUEVDX1ZFUlNJT05TLmhhcyhzcGVjVmVyc2lvbikpIHtcbiAgICAgIGNvbnNvbGUud2FybihgVlJNTG9va0F0TG9hZGVyUGx1Z2luOiBVbmtub3duIFZSTUNfdnJtIHNwZWNWZXJzaW9uIFwiJHtzcGVjVmVyc2lvbn1cImApO1xuICAgICAgcmV0dXJuIG51bGw7XG4gICAgfVxuXG4gICAgY29uc3Qgc2NoZW1hTG9va0F0ID0gZXh0ZW5zaW9uLmxvb2tBdDtcbiAgICBpZiAoIXNjaGVtYUxvb2tBdCkge1xuICAgICAgcmV0dXJuIG51bGw7XG4gICAgfVxuXG4gICAgY29uc3QgZGVmYXVsdE91dHB1dFNjYWxlID0gc2NoZW1hTG9va0F0LnR5cGUgPT09ICdleHByZXNzaW9uJyA/IDEuMCA6IDEwLjA7XG5cbiAgICBjb25zdCBtYXBISSA9IHRoaXMuX3YxSW1wb3J0UmFuZ2VNYXAoc2NoZW1hTG9va0F0LnJhbmdlTWFwSG9yaXpvbnRhbElubmVyLCBkZWZhdWx0T3V0cHV0U2NhbGUpO1xuICAgIGNvbnN0IG1hcEhPID0gdGhpcy5fdjFJbXBvcnRSYW5nZU1hcChzY2hlbWFMb29rQXQucmFuZ2VNYXBIb3Jpem9udGFsT3V0ZXIsIGRlZmF1bHRPdXRwdXRTY2FsZSk7XG4gICAgY29uc3QgbWFwVkQgPSB0aGlzLl92MUltcG9ydFJhbmdlTWFwKHNjaGVtYUxvb2tBdC5yYW5nZU1hcFZlcnRpY2FsRG93biwgZGVmYXVsdE91dHB1dFNjYWxlKTtcbiAgICBjb25zdCBtYXBWVSA9IHRoaXMuX3YxSW1wb3J0UmFuZ2VNYXAoc2NoZW1hTG9va0F0LnJhbmdlTWFwVmVydGljYWxVcCwgZGVmYXVsdE91dHB1dFNjYWxlKTtcblxuICAgIGxldCBhcHBsaWVyO1xuXG4gICAgaWYgKHNjaGVtYUxvb2tBdC50eXBlID09PSAnZXhwcmVzc2lvbicpIHtcbiAgICAgIGFwcGxpZXIgPSBuZXcgVlJNTG9va0F0RXhwcmVzc2lvbkFwcGxpZXIoZXhwcmVzc2lvbnMsIG1hcEhJLCBtYXBITywgbWFwVkQsIG1hcFZVKTtcbiAgICB9IGVsc2Uge1xuICAgICAgYXBwbGllciA9IG5ldyBWUk1Mb29rQXRCb25lQXBwbGllcihodW1hbm9pZCwgbWFwSEksIG1hcEhPLCBtYXBWRCwgbWFwVlUpO1xuICAgIH1cblxuICAgIGNvbnN0IGxvb2tBdCA9IHRoaXMuX2ltcG9ydExvb2tBdChodW1hbm9pZCwgYXBwbGllcik7XG5cbiAgICBsb29rQXQub2Zmc2V0RnJvbUhlYWRCb25lLmZyb21BcnJheShzY2hlbWFMb29rQXQub2Zmc2V0RnJvbUhlYWRCb25lID8/IFswLjAsIDAuMDYsIDAuMF0pO1xuXG4gICAgcmV0dXJuIGxvb2tBdDtcbiAgfVxuXG4gIHByaXZhdGUgX3YxSW1wb3J0UmFuZ2VNYXAoXG4gICAgc2NoZW1hUmFuZ2VNYXA6IFYxVlJNU2NoZW1hLkxvb2tBdFJhbmdlTWFwIHwgdW5kZWZpbmVkLFxuICAgIGRlZmF1bHRPdXRwdXRTY2FsZTogbnVtYmVyLFxuICApOiBWUk1Mb29rQXRSYW5nZU1hcCB7XG4gICAgbGV0IGlucHV0TWF4VmFsdWUgPSBzY2hlbWFSYW5nZU1hcD8uaW5wdXRNYXhWYWx1ZSA/PyA5MC4wO1xuICAgIGNvbnN0IG91dHB1dFNjYWxlID0gc2NoZW1hUmFuZ2VNYXA/Lm91dHB1dFNjYWxlID8/IGRlZmF1bHRPdXRwdXRTY2FsZTtcblxuICAgIC8vIEl0IG1pZ2h0IGNhdXNlIE5hTiB3aGVuIGBpbnB1dE1heFZhbHVlYCBpcyB0b28gc21hbGxcbiAgICAvLyB3aGljaCBtYWtlcyB0aGUgbWVzaCBvZiB0aGUgaGVhZCBkaXNhcHBlYXJcbiAgICAvLyBTZWU6IGh0dHBzOi8vZ2l0aHViLmNvbS9waXhpdi90aHJlZS12cm0vaXNzdWVzLzEyMDFcbiAgICBpZiAoaW5wdXRNYXhWYWx1ZSA8IElOUFVUX01BWF9WQUxVRV9NSU5JTVVNKSB7XG4gICAgICBjb25zb2xlLndhcm4oXG4gICAgICAgICdWUk1Mb29rQXRMb2FkZXJQbHVnaW46IGlucHV0TWF4VmFsdWUgb2YgYSByYW5nZSBtYXAgaXMgdG9vIHNtYWxsLiBDb25zaWRlciByZXZpZXdpbmcgdGhlIHJhbmdlIG1hcCEnLFxuICAgICAgKTtcbiAgICAgIGlucHV0TWF4VmFsdWUgPSBJTlBVVF9NQVhfVkFMVUVfTUlOSU1VTTtcbiAgICB9XG5cbiAgICByZXR1cm4gbmV3IFZSTUxvb2tBdFJhbmdlTWFwKGlucHV0TWF4VmFsdWUsIG91dHB1dFNjYWxlKTtcbiAgfVxuXG4gIHByaXZhdGUgYXN5bmMgX3YwSW1wb3J0KFxuICAgIGdsdGY6IEdMVEYsXG4gICAgaHVtYW5vaWQ6IFZSTUh1bWFub2lkLFxuICAgIGV4cHJlc3Npb25zOiBWUk1FeHByZXNzaW9uTWFuYWdlcixcbiAgKTogUHJvbWlzZTxWUk1Mb29rQXQgfCBudWxsPiB7XG4gICAgY29uc3QganNvbiA9IHRoaXMucGFyc2VyLmpzb24gYXMgR0xURlNjaGVtYS5JR0xURjtcblxuICAgIC8vIGVhcmx5IGFib3J0IGlmIGl0IGRvZXNuJ3QgdXNlIHZybVxuICAgIGNvbnN0IHZybUV4dCA9IGpzb24uZXh0ZW5zaW9ucz8uVlJNIGFzIFYwVlJNLlZSTSB8IHVuZGVmaW5lZDtcbiAgICBpZiAoIXZybUV4dCkge1xuICAgICAgcmV0dXJuIG51bGw7XG4gICAgfVxuXG4gICAgY29uc3Qgc2NoZW1hRmlyc3RQZXJzb24gPSB2cm1FeHQuZmlyc3RQZXJzb247XG4gICAgaWYgKCFzY2hlbWFGaXJzdFBlcnNvbikge1xuICAgICAgcmV0dXJuIG51bGw7XG4gICAgfVxuXG4gICAgY29uc3QgZGVmYXVsdE91dHB1dFNjYWxlID0gc2NoZW1hRmlyc3RQZXJzb24ubG9va0F0VHlwZU5hbWUgPT09ICdCbGVuZFNoYXBlJyA/IDEuMCA6IDEwLjA7XG5cbiAgICBjb25zdCBtYXBISSA9IHRoaXMuX3YwSW1wb3J0RGVncmVlTWFwKHNjaGVtYUZpcnN0UGVyc29uLmxvb2tBdEhvcml6b250YWxJbm5lciwgZGVmYXVsdE91dHB1dFNjYWxlKTtcbiAgICBjb25zdCBtYXBITyA9IHRoaXMuX3YwSW1wb3J0RGVncmVlTWFwKHNjaGVtYUZpcnN0UGVyc29uLmxvb2tBdEhvcml6b250YWxPdXRlciwgZGVmYXVsdE91dHB1dFNjYWxlKTtcbiAgICBjb25zdCBtYXBWRCA9IHRoaXMuX3YwSW1wb3J0RGVncmVlTWFwKHNjaGVtYUZpcnN0UGVyc29uLmxvb2tBdFZlcnRpY2FsRG93biwgZGVmYXVsdE91dHB1dFNjYWxlKTtcbiAgICBjb25zdCBtYXBWVSA9IHRoaXMuX3YwSW1wb3J0RGVncmVlTWFwKHNjaGVtYUZpcnN0UGVyc29uLmxvb2tBdFZlcnRpY2FsVXAsIGRlZmF1bHRPdXRwdXRTY2FsZSk7XG5cbiAgICBsZXQgYXBwbGllcjtcblxuICAgIGlmIChzY2hlbWFGaXJzdFBlcnNvbi5sb29rQXRUeXBlTmFtZSA9PT0gJ0JsZW5kU2hhcGUnKSB7XG4gICAgICBhcHBsaWVyID0gbmV3IFZSTUxvb2tBdEV4cHJlc3Npb25BcHBsaWVyKGV4cHJlc3Npb25zLCBtYXBISSwgbWFwSE8sIG1hcFZELCBtYXBWVSk7XG4gICAgfSBlbHNlIHtcbiAgICAgIGFwcGxpZXIgPSBuZXcgVlJNTG9va0F0Qm9uZUFwcGxpZXIoaHVtYW5vaWQsIG1hcEhJLCBtYXBITywgbWFwVkQsIG1hcFZVKTtcbiAgICB9XG5cbiAgICBjb25zdCBsb29rQXQgPSB0aGlzLl9pbXBvcnRMb29rQXQoaHVtYW5vaWQsIGFwcGxpZXIpO1xuXG4gICAgaWYgKHNjaGVtYUZpcnN0UGVyc29uLmZpcnN0UGVyc29uQm9uZU9mZnNldCkge1xuICAgICAgbG9va0F0Lm9mZnNldEZyb21IZWFkQm9uZS5zZXQoXG4gICAgICAgIHNjaGVtYUZpcnN0UGVyc29uLmZpcnN0UGVyc29uQm9uZU9mZnNldC54ID8/IDAuMCxcbiAgICAgICAgc2NoZW1hRmlyc3RQZXJzb24uZmlyc3RQZXJzb25Cb25lT2Zmc2V0LnkgPz8gMC4wNixcbiAgICAgICAgLShzY2hlbWFGaXJzdFBlcnNvbi5maXJzdFBlcnNvbkJvbmVPZmZzZXQueiA/PyAwLjApLFxuICAgICAgKTtcbiAgICB9IGVsc2Uge1xuICAgICAgbG9va0F0Lm9mZnNldEZyb21IZWFkQm9uZS5zZXQoMC4wLCAwLjA2LCAwLjApO1xuICAgIH1cblxuICAgIC8vIFZSTSAwLjAgYXJlIGZhY2luZyBaLSBpbnN0ZWFkIG9mIForXG4gICAgbG9va0F0LmZhY2VGcm9udC5zZXQoMC4wLCAwLjAsIC0xLjApO1xuXG4gICAgaWYgKGFwcGxpZXIgaW5zdGFuY2VvZiBWUk1Mb29rQXRCb25lQXBwbGllcikge1xuICAgICAgYXBwbGllci5mYWNlRnJvbnQuc2V0KDAuMCwgMC4wLCAtMS4wKTtcbiAgICB9XG5cbiAgICByZXR1cm4gbG9va0F0O1xuICB9XG5cbiAgcHJpdmF0ZSBfdjBJbXBvcnREZWdyZWVNYXAoXG4gICAgc2NoZW1hRGVncmVlTWFwOiBWMFZSTS5GaXJzdFBlcnNvbkRlZ3JlZU1hcCB8IHVuZGVmaW5lZCxcbiAgICBkZWZhdWx0T3V0cHV0U2NhbGU6IG51bWJlcixcbiAgKTogVlJNTG9va0F0UmFuZ2VNYXAge1xuICAgIGNvbnN0IGN1cnZlID0gc2NoZW1hRGVncmVlTWFwPy5jdXJ2ZTtcbiAgICBpZiAoSlNPTi5zdHJpbmdpZnkoY3VydmUpICE9PSAnWzAsMCwwLDEsMSwxLDEsMF0nKSB7XG4gICAgICBjb25zb2xlLndhcm4oJ0N1cnZlcyBvZiBMb29rQXREZWdyZWVNYXAgZGVmaW5lZCBpbiBWUk0gMC4wIGFyZSBub3Qgc3VwcG9ydGVkJyk7XG4gICAgfVxuXG4gICAgbGV0IHhSYW5nZSA9IHNjaGVtYURlZ3JlZU1hcD8ueFJhbmdlID8/IDkwLjA7XG4gICAgY29uc3QgeVJhbmdlID0gc2NoZW1hRGVncmVlTWFwPy55UmFuZ2UgPz8gZGVmYXVsdE91dHB1dFNjYWxlO1xuXG4gICAgLy8gSXQgbWlnaHQgY2F1c2UgTmFOIHdoZW4gYHhSYW5nZWAgaXMgdG9vIHNtYWxsXG4gICAgLy8gd2hpY2ggbWFrZXMgdGhlIG1lc2ggb2YgdGhlIGhlYWQgZGlzYXBwZWFyXG4gICAgLy8gU2VlOiBodHRwczovL2dpdGh1Yi5jb20vcGl4aXYvdGhyZWUtdnJtL2lzc3Vlcy8xMjAxXG4gICAgaWYgKHhSYW5nZSA8IElOUFVUX01BWF9WQUxVRV9NSU5JTVVNKSB7XG4gICAgICBjb25zb2xlLndhcm4oJ1ZSTUxvb2tBdExvYWRlclBsdWdpbjogeFJhbmdlIG9mIGEgZGVncmVlIG1hcCBpcyB0b28gc21hbGwuIENvbnNpZGVyIHJldmlld2luZyB0aGUgZGVncmVlIG1hcCEnKTtcbiAgICAgIHhSYW5nZSA9IElOUFVUX01BWF9WQUxVRV9NSU5JTVVNO1xuICAgIH1cblxuICAgIHJldHVybiBuZXcgVlJNTG9va0F0UmFuZ2VNYXAoeFJhbmdlLCB5UmFuZ2UpO1xuICB9XG5cbiAgcHJpdmF0ZSBfaW1wb3J0TG9va0F0KGh1bWFub2lkOiBWUk1IdW1hbm9pZCwgYXBwbGllcjogVlJNTG9va0F0QXBwbGllcik6IFZSTUxvb2tBdCB7XG4gICAgY29uc3QgbG9va0F0ID0gbmV3IFZSTUxvb2tBdChodW1hbm9pZCwgYXBwbGllcik7XG5cbiAgICBpZiAodGhpcy5oZWxwZXJSb290KSB7XG4gICAgICBjb25zdCBoZWxwZXIgPSBuZXcgVlJNTG9va0F0SGVscGVyKGxvb2tBdCk7XG4gICAgICB0aGlzLmhlbHBlclJvb3QuYWRkKGhlbHBlcik7XG4gICAgICBoZWxwZXIucmVuZGVyT3JkZXIgPSB0aGlzLmhlbHBlclJvb3QucmVuZGVyT3JkZXI7XG4gICAgfVxuXG4gICAgcmV0dXJuIGxvb2tBdDtcbiAgfVxufVxuIiwgIi8qIGVzbGludC1kaXNhYmxlIEB0eXBlc2NyaXB0LWVzbGludC9uYW1pbmctY29udmVudGlvbiAqL1xuXG4vKipcbiAqIFJlcHJlc2VudHMgYSB0eXBlIG9mIGFwcGxpZXIuXG4gKi9cbmV4cG9ydCBjb25zdCBWUk1Mb29rQXRUeXBlTmFtZSA9IHtcbiAgQm9uZTogJ2JvbmUnLFxuICBFeHByZXNzaW9uOiAnZXhwcmVzc2lvbicsXG59O1xuXG5leHBvcnQgdHlwZSBWUk1Mb29rQXRUeXBlTmFtZSA9ICh0eXBlb2YgVlJNTG9va0F0VHlwZU5hbWUpW2tleW9mIHR5cGVvZiBWUk1Mb29rQXRUeXBlTmFtZV07XG4iLCAiaW1wb3J0IHR5cGUgeyBHTFRGLCBHTFRGTG9hZGVyUGx1Z2luLCBHTFRGUGFyc2VyIH0gZnJvbSAndGhyZWUvZXhhbXBsZXMvanNtL2xvYWRlcnMvR0xURkxvYWRlci5qcyc7XG5pbXBvcnQgdHlwZSB7IFZSTTBNZXRhIH0gZnJvbSAnLi9WUk0wTWV0YSc7XG5pbXBvcnQgdHlwZSB7IFZSTTFNZXRhIH0gZnJvbSAnLi9WUk0xTWV0YSc7XG5pbXBvcnQgdHlwZSB7IFZSTU1ldGEgfSBmcm9tICcuL1ZSTU1ldGEnO1xuaW1wb3J0IHR5cGUgeyBWUk1NZXRhTG9hZGVyUGx1Z2luT3B0aW9ucyB9IGZyb20gJy4vVlJNTWV0YUxvYWRlclBsdWdpbk9wdGlvbnMnO1xuaW1wb3J0IHR5cGUgKiBhcyBWMFZSTSBmcm9tICdAcGl4aXYvdHlwZXMtdnJtLTAuMCc7XG5pbXBvcnQgdHlwZSAqIGFzIFYxVlJNU2NoZW1hIGZyb20gJ0BwaXhpdi90eXBlcy12cm1jLXZybS0xLjAnO1xuaW1wb3J0ICogYXMgVEhSRUUgZnJvbSAndGhyZWUnO1xuaW1wb3J0IHsgcmVzb2x2ZVVSTCB9IGZyb20gJy4uL3V0aWxzL3Jlc29sdmVVUkwnO1xuaW1wb3J0IHsgR0xURiBhcyBHTFRGU2NoZW1hIH0gZnJvbSAnQGdsdGYtdHJhbnNmb3JtL2NvcmUnO1xuXG4vKipcbiAqIFBvc3NpYmxlIHNwZWMgdmVyc2lvbnMgaXQgcmVjb2duaXplcy5cbiAqL1xuY29uc3QgUE9TU0lCTEVfU1BFQ19WRVJTSU9OUyA9IG5ldyBTZXQoWycxLjAnLCAnMS4wLWJldGEnXSk7XG5cbi8qKlxuICogQSBwbHVnaW4gb2YgR0xURkxvYWRlciB0aGF0IGltcG9ydHMgYSB7QGxpbmsgVlJNMU1ldGF9IGZyb20gYSBWUk0gZXh0ZW5zaW9uIG9mIGEgR0xURi5cbiAqL1xuZXhwb3J0IGNsYXNzIFZSTU1ldGFMb2FkZXJQbHVnaW4gaW1wbGVtZW50cyBHTFRGTG9hZGVyUGx1Z2luIHtcbiAgcHVibGljIHJlYWRvbmx5IHBhcnNlcjogR0xURlBhcnNlcjtcblxuICAvKipcbiAgICogSWYgYGZhbHNlYCwgaXQgd29uJ3QgbG9hZCBpdHMgdGh1bWJuYWlsIGltYWdlICh7QGxpbmsgVlJNMU1ldGEudGh1bWJuYWlsSW1hZ2V9KS5cbiAgICogYGZhbHNlYCBieSBkZWZhdWx0LlxuICAgKi9cbiAgcHVibGljIG5lZWRUaHVtYm5haWxJbWFnZTogYm9vbGVhbjtcblxuICAvKipcbiAgICogQSBsaXN0IG9mIGxpY2Vuc2UgdXJscy5cbiAgICogVGhpcyBtZXRhIGxvYWRlciB3aWxsIGFjY2VwdCB0aGVzZSBgbGljZW5zZVVybGBzLlxuICAgKiBPdGhlcndpc2UgaXQgd29uJ3QgYmUgbG9hZGVkLlxuICAgKi9cbiAgcHVibGljIGFjY2VwdExpY2Vuc2VVcmxzOiBzdHJpbmdbXTtcblxuICAvKipcbiAgICogV2hldGhlciBpdCBzaG91bGQgYWNjZXB0IFZSTTAuMCBtZXRhIG9yIG5vdC5cbiAgICogTm90ZSB0aGF0IGl0IG1pZ2h0IGxvYWQge0BsaW5rIFZSTTBNZXRhfSBpbnN0ZWFkIG9mIHtAbGluayBWUk0xTWV0YX0gd2hlbiB0aGlzIGlzIGB0cnVlYC5cbiAgICogYHRydWVgIGJ5IGRlZmF1bHQuXG4gICAqL1xuICBwdWJsaWMgYWNjZXB0VjBNZXRhOiBib29sZWFuO1xuXG4gIHB1YmxpYyBnZXQgbmFtZSgpOiBzdHJpbmcge1xuICAgIC8vIFdlIHNob3VsZCB1c2UgdGhlIGV4dGVuc2lvbiBuYW1lIGluc3RlYWQgYnV0IHdlIGhhdmUgbXVsdGlwbGUgcGx1Z2lucyBmb3IgYW4gZXh0ZW5zaW9uLi4uXG4gICAgcmV0dXJuICdWUk1NZXRhTG9hZGVyUGx1Z2luJztcbiAgfVxuXG4gIHB1YmxpYyBjb25zdHJ1Y3RvcihwYXJzZXI6IEdMVEZQYXJzZXIsIG9wdGlvbnM/OiBWUk1NZXRhTG9hZGVyUGx1Z2luT3B0aW9ucykge1xuICAgIHRoaXMucGFyc2VyID0gcGFyc2VyO1xuXG4gICAgdGhpcy5uZWVkVGh1bWJuYWlsSW1hZ2UgPSBvcHRpb25zPy5uZWVkVGh1bWJuYWlsSW1hZ2UgPz8gZmFsc2U7XG4gICAgdGhpcy5hY2NlcHRMaWNlbnNlVXJscyA9IG9wdGlvbnM/LmFjY2VwdExpY2Vuc2VVcmxzID8/IFsnaHR0cHM6Ly92cm0uZGV2L2xpY2Vuc2VzLzEuMC8nXTtcbiAgICB0aGlzLmFjY2VwdFYwTWV0YSA9IG9wdGlvbnM/LmFjY2VwdFYwTWV0YSA/PyB0cnVlO1xuICB9XG5cbiAgcHVibGljIGFzeW5jIGFmdGVyUm9vdChnbHRmOiBHTFRGKTogUHJvbWlzZTx2b2lkPiB7XG4gICAgZ2x0Zi51c2VyRGF0YS52cm1NZXRhID0gYXdhaXQgdGhpcy5faW1wb3J0KGdsdGYpO1xuICB9XG5cbiAgcHJpdmF0ZSBhc3luYyBfaW1wb3J0KGdsdGY6IEdMVEYpOiBQcm9taXNlPFZSTU1ldGEgfCBudWxsPiB7XG4gICAgY29uc3QgdjFSZXN1bHQgPSBhd2FpdCB0aGlzLl92MUltcG9ydChnbHRmKTtcbiAgICBpZiAodjFSZXN1bHQgIT0gbnVsbCkge1xuICAgICAgcmV0dXJuIHYxUmVzdWx0O1xuICAgIH1cblxuICAgIGNvbnN0IHYwUmVzdWx0ID0gYXdhaXQgdGhpcy5fdjBJbXBvcnQoZ2x0Zik7XG4gICAgaWYgKHYwUmVzdWx0ICE9IG51bGwpIHtcbiAgICAgIHJldHVybiB2MFJlc3VsdDtcbiAgICB9XG5cbiAgICByZXR1cm4gbnVsbDtcbiAgfVxuXG4gIHByaXZhdGUgYXN5bmMgX3YxSW1wb3J0KGdsdGY6IEdMVEYpOiBQcm9taXNlPFZSTTFNZXRhIHwgbnVsbD4ge1xuICAgIGNvbnN0IGpzb24gPSB0aGlzLnBhcnNlci5qc29uIGFzIEdMVEZTY2hlbWEuSUdMVEY7XG5cbiAgICAvLyBlYXJseSBhYm9ydCBpZiBpdCBkb2Vzbid0IHVzZSB2cm1cbiAgICBjb25zdCBpc1ZSTVVzZWQgPSBqc29uLmV4dGVuc2lvbnNVc2VkPy5pbmRleE9mKCdWUk1DX3ZybScpICE9PSAtMTtcbiAgICBpZiAoIWlzVlJNVXNlZCkge1xuICAgICAgcmV0dXJuIG51bGw7XG4gICAgfVxuXG4gICAgY29uc3QgZXh0ZW5zaW9uID0ganNvbi5leHRlbnNpb25zPy5bJ1ZSTUNfdnJtJ10gYXMgVjFWUk1TY2hlbWEuVlJNQ1ZSTSB8IHVuZGVmaW5lZDtcbiAgICBpZiAoZXh0ZW5zaW9uID09IG51bGwpIHtcbiAgICAgIHJldHVybiBudWxsO1xuICAgIH1cblxuICAgIGNvbnN0IHNwZWNWZXJzaW9uID0gZXh0ZW5zaW9uLnNwZWNWZXJzaW9uO1xuICAgIGlmICghUE9TU0lCTEVfU1BFQ19WRVJTSU9OUy5oYXMoc3BlY1ZlcnNpb24pKSB7XG4gICAgICBjb25zb2xlLndhcm4oYFZSTU1ldGFMb2FkZXJQbHVnaW46IFVua25vd24gVlJNQ192cm0gc3BlY1ZlcnNpb24gXCIke3NwZWNWZXJzaW9ufVwiYCk7XG4gICAgICByZXR1cm4gbnVsbDtcbiAgICB9XG5cbiAgICBjb25zdCBzY2hlbWFNZXRhID0gZXh0ZW5zaW9uLm1ldGE7XG4gICAgaWYgKCFzY2hlbWFNZXRhKSB7XG4gICAgICByZXR1cm4gbnVsbDtcbiAgICB9XG5cbiAgICAvLyB0aHJvdyBhbiBlcnJvciBpZiBhY2NlcHRWME1ldGEgaXMgZmFsc2VcbiAgICBjb25zdCBsaWNlbnNlVXJsID0gc2NoZW1hTWV0YS5saWNlbnNlVXJsO1xuICAgIGNvbnN0IGFjY2VwdExpY2Vuc2VVcmxzU2V0ID0gbmV3IFNldCh0aGlzLmFjY2VwdExpY2Vuc2VVcmxzKTtcbiAgICBpZiAoIWFjY2VwdExpY2Vuc2VVcmxzU2V0LmhhcyhsaWNlbnNlVXJsKSkge1xuICAgICAgdGhyb3cgbmV3IEVycm9yKGBWUk1NZXRhTG9hZGVyUGx1Z2luOiBUaGUgbGljZW5zZSB1cmwgXCIke2xpY2Vuc2VVcmx9XCIgaXMgbm90IGFjY2VwdGVkYCk7XG4gICAgfVxuXG4gICAgbGV0IHRodW1ibmFpbEltYWdlOiBIVE1MSW1hZ2VFbGVtZW50IHwgdW5kZWZpbmVkID0gdW5kZWZpbmVkO1xuICAgIGlmICh0aGlzLm5lZWRUaHVtYm5haWxJbWFnZSAmJiBzY2hlbWFNZXRhLnRodW1ibmFpbEltYWdlICE9IG51bGwpIHtcbiAgICAgIHRodW1ibmFpbEltYWdlID0gKGF3YWl0IHRoaXMuX2V4dHJhY3RHTFRGSW1hZ2Uoc2NoZW1hTWV0YS50aHVtYm5haWxJbWFnZSkpID8/IHVuZGVmaW5lZDtcbiAgICB9XG5cbiAgICByZXR1cm4ge1xuICAgICAgbWV0YVZlcnNpb246ICcxJyxcbiAgICAgIG5hbWU6IHNjaGVtYU1ldGEubmFtZSxcbiAgICAgIHZlcnNpb246IHNjaGVtYU1ldGEudmVyc2lvbixcbiAgICAgIGF1dGhvcnM6IHNjaGVtYU1ldGEuYXV0aG9ycyxcbiAgICAgIGNvcHlyaWdodEluZm9ybWF0aW9uOiBzY2hlbWFNZXRhLmNvcHlyaWdodEluZm9ybWF0aW9uLFxuICAgICAgY29udGFjdEluZm9ybWF0aW9uOiBzY2hlbWFNZXRhLmNvbnRhY3RJbmZvcm1hdGlvbixcbiAgICAgIHJlZmVyZW5jZXM6IHNjaGVtYU1ldGEucmVmZXJlbmNlcyxcbiAgICAgIHRoaXJkUGFydHlMaWNlbnNlczogc2NoZW1hTWV0YS50aGlyZFBhcnR5TGljZW5zZXMsXG4gICAgICB0aHVtYm5haWxJbWFnZSxcbiAgICAgIGxpY2Vuc2VVcmw6IHNjaGVtYU1ldGEubGljZW5zZVVybCxcbiAgICAgIGF2YXRhclBlcm1pc3Npb246IHNjaGVtYU1ldGEuYXZhdGFyUGVybWlzc2lvbixcbiAgICAgIGFsbG93RXhjZXNzaXZlbHlWaW9sZW50VXNhZ2U6IHNjaGVtYU1ldGEuYWxsb3dFeGNlc3NpdmVseVZpb2xlbnRVc2FnZSxcbiAgICAgIGFsbG93RXhjZXNzaXZlbHlTZXh1YWxVc2FnZTogc2NoZW1hTWV0YS5hbGxvd0V4Y2Vzc2l2ZWx5U2V4dWFsVXNhZ2UsXG4gICAgICBjb21tZXJjaWFsVXNhZ2U6IHNjaGVtYU1ldGEuY29tbWVyY2lhbFVzYWdlLFxuICAgICAgYWxsb3dQb2xpdGljYWxPclJlbGlnaW91c1VzYWdlOiBzY2hlbWFNZXRhLmFsbG93UG9saXRpY2FsT3JSZWxpZ2lvdXNVc2FnZSxcbiAgICAgIGFsbG93QW50aXNvY2lhbE9ySGF0ZVVzYWdlOiBzY2hlbWFNZXRhLmFsbG93QW50aXNvY2lhbE9ySGF0ZVVzYWdlLFxuICAgICAgY3JlZGl0Tm90YXRpb246IHNjaGVtYU1ldGEuY3JlZGl0Tm90YXRpb24sXG4gICAgICBhbGxvd1JlZGlzdHJpYnV0aW9uOiBzY2hlbWFNZXRhLmFsbG93UmVkaXN0cmlidXRpb24sXG4gICAgICBtb2RpZmljYXRpb246IHNjaGVtYU1ldGEubW9kaWZpY2F0aW9uLFxuICAgICAgb3RoZXJMaWNlbnNlVXJsOiBzY2hlbWFNZXRhLm90aGVyTGljZW5zZVVybCxcbiAgICB9O1xuICB9XG5cbiAgcHJpdmF0ZSBhc3luYyBfdjBJbXBvcnQoZ2x0ZjogR0xURik6IFByb21pc2U8VlJNME1ldGEgfCBudWxsPiB7XG4gICAgY29uc3QganNvbiA9IHRoaXMucGFyc2VyLmpzb24gYXMgR0xURlNjaGVtYS5JR0xURjtcblxuICAgIC8vIGVhcmx5IGFib3J0IGlmIGl0IGRvZXNuJ3QgdXNlIHZybVxuICAgIGNvbnN0IHZybUV4dCA9IGpzb24uZXh0ZW5zaW9ucz8uVlJNIGFzIFYwVlJNLlZSTSB8IHVuZGVmaW5lZDtcbiAgICBpZiAoIXZybUV4dCkge1xuICAgICAgcmV0dXJuIG51bGw7XG4gICAgfVxuXG4gICAgY29uc3Qgc2NoZW1hTWV0YSA9IHZybUV4dC5tZXRhO1xuICAgIGlmICghc2NoZW1hTWV0YSkge1xuICAgICAgcmV0dXJuIG51bGw7XG4gICAgfVxuXG4gICAgLy8gdGhyb3cgYW4gZXJyb3IgaWYgYWNjZXB0VjBNZXRhIGlzIGZhbHNlXG4gICAgaWYgKCF0aGlzLmFjY2VwdFYwTWV0YSkge1xuICAgICAgdGhyb3cgbmV3IEVycm9yKCdWUk1NZXRhTG9hZGVyUGx1Z2luOiBBdHRlbXB0ZWQgdG8gbG9hZCBWUk0wLjAgbWV0YSBidXQgYWNjZXB0VjBNZXRhIGlzIGZhbHNlJyk7XG4gICAgfVxuXG4gICAgLy8gbG9hZCB0aHVtYm5haWwgdGV4dHVyZVxuICAgIGxldCB0ZXh0dXJlOiBUSFJFRS5UZXh0dXJlIHwgbnVsbCB8IHVuZGVmaW5lZDtcbiAgICBpZiAodGhpcy5uZWVkVGh1bWJuYWlsSW1hZ2UgJiYgc2NoZW1hTWV0YS50ZXh0dXJlICE9IG51bGwgJiYgc2NoZW1hTWV0YS50ZXh0dXJlICE9PSAtMSkge1xuICAgICAgdGV4dHVyZSA9IGF3YWl0IHRoaXMucGFyc2VyLmdldERlcGVuZGVuY3koJ3RleHR1cmUnLCBzY2hlbWFNZXRhLnRleHR1cmUpO1xuICAgIH1cblxuICAgIHJldHVybiB7XG4gICAgICBtZXRhVmVyc2lvbjogJzAnLFxuICAgICAgYWxsb3dlZFVzZXJOYW1lOiBzY2hlbWFNZXRhLmFsbG93ZWRVc2VyTmFtZSxcbiAgICAgIGF1dGhvcjogc2NoZW1hTWV0YS5hdXRob3IsXG4gICAgICBjb21tZXJjaWFsVXNzYWdlTmFtZTogc2NoZW1hTWV0YS5jb21tZXJjaWFsVXNzYWdlTmFtZSxcbiAgICAgIGNvbnRhY3RJbmZvcm1hdGlvbjogc2NoZW1hTWV0YS5jb250YWN0SW5mb3JtYXRpb24sXG4gICAgICBsaWNlbnNlTmFtZTogc2NoZW1hTWV0YS5saWNlbnNlTmFtZSxcbiAgICAgIG90aGVyTGljZW5zZVVybDogc2NoZW1hTWV0YS5vdGhlckxpY2Vuc2VVcmwsXG4gICAgICBvdGhlclBlcm1pc3Npb25Vcmw6IHNjaGVtYU1ldGEub3RoZXJQZXJtaXNzaW9uVXJsLFxuICAgICAgcmVmZXJlbmNlOiBzY2hlbWFNZXRhLnJlZmVyZW5jZSxcbiAgICAgIHNleHVhbFVzc2FnZU5hbWU6IHNjaGVtYU1ldGEuc2V4dWFsVXNzYWdlTmFtZSxcbiAgICAgIHRleHR1cmU6IHRleHR1cmUgPz8gdW5kZWZpbmVkLFxuICAgICAgdGl0bGU6IHNjaGVtYU1ldGEudGl0bGUsXG4gICAgICB2ZXJzaW9uOiBzY2hlbWFNZXRhLnZlcnNpb24sXG4gICAgICB2aW9sZW50VXNzYWdlTmFtZTogc2NoZW1hTWV0YS52aW9sZW50VXNzYWdlTmFtZSxcbiAgICB9O1xuICB9XG5cbiAgcHJpdmF0ZSBhc3luYyBfZXh0cmFjdEdMVEZJbWFnZShpbmRleDogbnVtYmVyKTogUHJvbWlzZTxIVE1MSW1hZ2VFbGVtZW50IHwgbnVsbD4ge1xuICAgIGNvbnN0IGpzb24gPSB0aGlzLnBhcnNlci5qc29uIGFzIEdMVEZTY2hlbWEuSUdMVEY7XG5cbiAgICBjb25zdCBzb3VyY2UgPSBqc29uLmltYWdlcz8uW2luZGV4XTtcblxuICAgIGlmIChzb3VyY2UgPT0gbnVsbCkge1xuICAgICAgY29uc29sZS53YXJuKFxuICAgICAgICBgVlJNTWV0YUxvYWRlclBsdWdpbjogQXR0ZW1wdCB0byB1c2UgaW1hZ2VzWyR7aW5kZXh9XSBvZiBnbFRGIGFzIGEgdGh1bWJuYWlsIGJ1dCB0aGUgaW1hZ2UgZG9lc24ndCBleGlzdGAsXG4gICAgICApO1xuICAgICAgcmV0dXJuIG51bGw7XG4gICAgfVxuXG4gICAgLy8gUmVmOiBodHRwczovL2dpdGh1Yi5jb20vbXJkb29iL3RocmVlLmpzL2Jsb2IvcjEyNC9leGFtcGxlcy9qc20vbG9hZGVycy9HTFRGTG9hZGVyLmpzI0wyNDY3XG5cbiAgICAvLyBgc291cmNlLnVyaWAgbWlnaHQgYmUgYSByZWZlcmVuY2UgdG8gYSBmaWxlXG4gICAgbGV0IHNvdXJjZVVSSTogc3RyaW5nIHwgdW5kZWZpbmVkID0gc291cmNlLnVyaTtcblxuICAgIC8vIExvYWQgdGhlIGJpbmFyeSBhcyBhIGJsb2JcbiAgICBpZiAoc291cmNlLmJ1ZmZlclZpZXcgIT0gbnVsbCkge1xuICAgICAgY29uc3QgYnVmZmVyVmlldyA9IGF3YWl0IHRoaXMucGFyc2VyLmdldERlcGVuZGVuY3koJ2J1ZmZlclZpZXcnLCBzb3VyY2UuYnVmZmVyVmlldyk7XG4gICAgICBjb25zdCBibG9iID0gbmV3IEJsb2IoW2J1ZmZlclZpZXddLCB7IHR5cGU6IHNvdXJjZS5taW1lVHlwZSB9KTtcbiAgICAgIHNvdXJjZVVSSSA9IFVSTC5jcmVhdGVPYmplY3RVUkwoYmxvYik7XG4gICAgfVxuXG4gICAgaWYgKHNvdXJjZVVSSSA9PSBudWxsKSB7XG4gICAgICBjb25zb2xlLndhcm4oXG4gICAgICAgIGBWUk1NZXRhTG9hZGVyUGx1Z2luOiBBdHRlbXB0IHRvIHVzZSBpbWFnZXNbJHtpbmRleH1dIG9mIGdsVEYgYXMgYSB0aHVtYm5haWwgYnV0IHRoZSBpbWFnZSBjb3VsZG4ndCBsb2FkIHByb3Blcmx5YCxcbiAgICAgICk7XG4gICAgICByZXR1cm4gbnVsbDtcbiAgICB9XG5cbiAgICBjb25zdCBsb2FkZXIgPSBuZXcgVEhSRUUuSW1hZ2VMb2FkZXIoKTtcbiAgICByZXR1cm4gYXdhaXQgbG9hZGVyLmxvYWRBc3luYyhyZXNvbHZlVVJMKHNvdXJjZVVSSSwgKHRoaXMucGFyc2VyIGFzIGFueSkub3B0aW9ucy5wYXRoKSkuY2F0Y2goKGVycm9yKSA9PiB7XG4gICAgICBjb25zb2xlLmVycm9yKGVycm9yKTtcbiAgICAgIGNvbnNvbGUud2FybignVlJNTWV0YUxvYWRlclBsdWdpbjogRmFpbGVkIHRvIGxvYWQgYSB0aHVtYm5haWwgaW1hZ2UnKTtcbiAgICAgIHJldHVybiBudWxsO1xuICAgIH0pO1xuICB9XG59XG4iLCAiLyoqXG4gKiBZb2lua2VkIGZyb20gaHR0cHM6Ly9naXRodWIuY29tL21yZG9vYi90aHJlZS5qcy9ibG9iL21hc3Rlci9leGFtcGxlcy9qc20vbG9hZGVycy9HTFRGTG9hZGVyLmpzXG4gKi9cbmV4cG9ydCBmdW5jdGlvbiByZXNvbHZlVVJMKHVybDogc3RyaW5nLCBwYXRoOiBzdHJpbmcpOiBzdHJpbmcge1xuICAvLyBJbnZhbGlkIFVSTFxuICBpZiAodHlwZW9mIHVybCAhPT0gJ3N0cmluZycgfHwgdXJsID09PSAnJykgcmV0dXJuICcnO1xuXG4gIC8vIEhvc3QgUmVsYXRpdmUgVVJMXG4gIGlmICgvXmh0dHBzPzpcXC9cXC8vaS50ZXN0KHBhdGgpICYmIC9eXFwvLy50ZXN0KHVybCkpIHtcbiAgICBwYXRoID0gcGF0aC5yZXBsYWNlKC8oXmh0dHBzPzpcXC9cXC9bXi9dKykuKi9pLCAnJDEnKTtcbiAgfVxuXG4gIC8vIEFic29sdXRlIFVSTCBodHRwOi8vLGh0dHBzOi8vLC8vXG4gIGlmICgvXihodHRwcz86KT9cXC9cXC8vaS50ZXN0KHVybCkpIHJldHVybiB1cmw7XG5cbiAgLy8gRGF0YSBVUklcbiAgaWYgKC9eZGF0YTouKiwuKiQvaS50ZXN0KHVybCkpIHJldHVybiB1cmw7XG5cbiAgLy8gQmxvYiBVUkxcbiAgaWYgKC9eYmxvYjouKiQvaS50ZXN0KHVybCkpIHJldHVybiB1cmw7XG5cbiAgLy8gUmVsYXRpdmUgVVJMXG4gIHJldHVybiBwYXRoICsgdXJsO1xufVxuIiwgImltcG9ydCAqIGFzIFRIUkVFIGZyb20gJ3RocmVlJztcbmltcG9ydCB7IFZSTUV4cHJlc3Npb25NYW5hZ2VyIH0gZnJvbSAnLi9leHByZXNzaW9ucy9WUk1FeHByZXNzaW9uTWFuYWdlcic7XG5pbXBvcnQgeyBWUk1GaXJzdFBlcnNvbiB9IGZyb20gJy4vZmlyc3RQZXJzb24vVlJNRmlyc3RQZXJzb24nO1xuaW1wb3J0IHsgVlJNSHVtYW5vaWQgfSBmcm9tICcuL2h1bWFub2lkL1ZSTUh1bWFub2lkJztcbmltcG9ydCB7IFZSTUxvb2tBdCB9IGZyb20gJy4vbG9va0F0L1ZSTUxvb2tBdCc7XG5pbXBvcnQgeyBWUk1NZXRhIH0gZnJvbSAnLi9tZXRhL1ZSTU1ldGEnO1xuaW1wb3J0IHsgVlJNQ29yZVBhcmFtZXRlcnMgfSBmcm9tICcuL1ZSTUNvcmVQYXJhbWV0ZXJzJztcblxuLyoqXG4gKiBBIGNsYXNzIHRoYXQgcmVwcmVzZW50cyBhIHNpbmdsZSBWUk0gbW9kZWwuXG4gKiBUaGlzIGNsYXNzIG9ubHkgaW5jbHVkZXMgY29yZSBzcGVjIG9mIHRoZSBWUk0gKGBWUk1DX3ZybWApLlxuICovXG5leHBvcnQgY2xhc3MgVlJNQ29yZSB7XG4gIC8qKlxuICAgKiBgVEhSRUUuR3JvdXBgIHRoYXQgY29udGFpbnMgdGhlIGVudGlyZSBWUk0uXG4gICAqL1xuICBwdWJsaWMgcmVhZG9ubHkgc2NlbmU6IFRIUkVFLkdyb3VwO1xuXG4gIC8qKlxuICAgKiBDb250YWlucyBtZXRhIGZpZWxkcyBvZiB0aGUgVlJNLlxuICAgKiBZb3UgbWlnaHQgd2FudCB0byByZWZlciB0aGVzZSBsaWNlbnNlIGZpZWxkcyBiZWZvcmUgdXNlIHlvdXIgVlJNcy5cbiAgICovXG4gIHB1YmxpYyByZWFkb25seSBtZXRhOiBWUk1NZXRhO1xuXG4gIC8qKlxuICAgKiBDb250YWlucyB7QGxpbmsgVlJNSHVtYW5vaWR9IG9mIHRoZSBWUk0uXG4gICAqIFlvdSBjYW4gY29udHJvbCBlYWNoIGJvbmVzIHVzaW5nIHtAbGluayBWUk1IdW1hbm9pZC5nZXROb3JtYWxpemVkQm9uZU5vZGV9IG9yIHtAbGluayBWUk1IdW1hbm9pZC5nZXRSYXdCb25lTm9kZX0uXG4gICAqXG4gICAqIEBUT0RPIEFkZCBhIGxpbmsgdG8gVlJNIHNwZWNcbiAgICovXG4gIHB1YmxpYyByZWFkb25seSBodW1hbm9pZDogVlJNSHVtYW5vaWQ7XG5cbiAgLyoqXG4gICAqIENvbnRhaW5zIHtAbGluayBWUk1FeHByZXNzaW9uTWFuYWdlcn0gb2YgdGhlIFZSTS5cbiAgICogWW91IG1pZ2h0IHdhbnQgdG8gY29udHJvbCB0aGVzZSBmYWNpYWwgZXhwcmVzc2lvbnMgdmlhIHtAbGluayBWUk1FeHByZXNzaW9uTWFuYWdlci5zZXRWYWx1ZX0uXG4gICAqL1xuICBwdWJsaWMgcmVhZG9ubHkgZXhwcmVzc2lvbk1hbmFnZXI/OiBWUk1FeHByZXNzaW9uTWFuYWdlcjtcblxuICAvKipcbiAgICogQ29udGFpbnMge0BsaW5rIFZSTUZpcnN0UGVyc29ufSBvZiB0aGUgVlJNLlxuICAgKiBWUk1GaXJzdFBlcnNvbiBpcyBtb3N0bHkgdXNlZCBmb3IgbWVzaCBjdWxsaW5nIGZvciBmaXJzdCBwZXJzb24gdmlldy5cbiAgICovXG4gIHB1YmxpYyByZWFkb25seSBmaXJzdFBlcnNvbj86IFZSTUZpcnN0UGVyc29uO1xuXG4gIC8qKlxuICAgKiBDb250YWlucyB7QGxpbmsgVlJNTG9va0F0fSBvZiB0aGUgVlJNLlxuICAgKiBZb3UgbWlnaHQgd2FudCB0byB1c2Uge0BsaW5rIFZSTUxvb2tBdC50YXJnZXR9IHRvIGNvbnRyb2wgdGhlIGV5ZSBkaXJlY3Rpb24gb2YgeW91ciBWUk1zLlxuICAgKi9cbiAgcHVibGljIHJlYWRvbmx5IGxvb2tBdD86IFZSTUxvb2tBdDtcblxuICAvKipcbiAgICogQ3JlYXRlIGEgbmV3IFZSTSBpbnN0YW5jZS5cbiAgICpcbiAgICogQHBhcmFtIHBhcmFtcyBbW1ZSTVBhcmFtZXRlcnNdXSB0aGF0IHJlcHJlc2VudHMgY29tcG9uZW50cyBvZiB0aGUgVlJNXG4gICAqL1xuICBwdWJsaWMgY29uc3RydWN0b3IocGFyYW1zOiBWUk1Db3JlUGFyYW1ldGVycykge1xuICAgIHRoaXMuc2NlbmUgPSBwYXJhbXMuc2NlbmU7XG4gICAgdGhpcy5tZXRhID0gcGFyYW1zLm1ldGE7XG4gICAgdGhpcy5odW1hbm9pZCA9IHBhcmFtcy5odW1hbm9pZDtcbiAgICB0aGlzLmV4cHJlc3Npb25NYW5hZ2VyID0gcGFyYW1zLmV4cHJlc3Npb25NYW5hZ2VyO1xuICAgIHRoaXMuZmlyc3RQZXJzb24gPSBwYXJhbXMuZmlyc3RQZXJzb247XG4gICAgdGhpcy5sb29rQXQgPSBwYXJhbXMubG9va0F0O1xuICB9XG5cbiAgLyoqXG4gICAqICoqWW91IG5lZWQgdG8gY2FsbCB0aGlzIG9uIHlvdXIgdXBkYXRlIGxvb3AuKipcbiAgICpcbiAgICogVGhpcyBmdW5jdGlvbiB1cGRhdGVzIGV2ZXJ5IFZSTSBjb21wb25lbnRzLlxuICAgKlxuICAgKiBAcGFyYW0gZGVsdGEgZGVsdGFUaW1lXG4gICAqL1xuICBwdWJsaWMgdXBkYXRlKGRlbHRhOiBudW1iZXIpOiB2b2lkIHtcbiAgICB0aGlzLmh1bWFub2lkLnVwZGF0ZSgpO1xuXG4gICAgaWYgKHRoaXMubG9va0F0KSB7XG4gICAgICB0aGlzLmxvb2tBdC51cGRhdGUoZGVsdGEpO1xuICAgIH1cblxuICAgIGlmICh0aGlzLmV4cHJlc3Npb25NYW5hZ2VyKSB7XG4gICAgICB0aGlzLmV4cHJlc3Npb25NYW5hZ2VyLnVwZGF0ZSgpO1xuICAgIH1cbiAgfVxufVxuIiwgImltcG9ydCB7IEdMVEYsIEdMVEZMb2FkZXJQbHVnaW4sIEdMVEZQYXJzZXIgfSBmcm9tICd0aHJlZS9leGFtcGxlcy9qc20vbG9hZGVycy9HTFRGTG9hZGVyLmpzJztcbmltcG9ydCB7IFZSTUNvcmVMb2FkZXJQbHVnaW5PcHRpb25zIH0gZnJvbSAnLi9WUk1Db3JlTG9hZGVyUGx1Z2luT3B0aW9ucyc7XG5pbXBvcnQgeyBWUk1Db3JlIH0gZnJvbSAnLi9WUk1Db3JlJztcbmltcG9ydCB7IFZSTUV4cHJlc3Npb25Mb2FkZXJQbHVnaW4gfSBmcm9tICcuL2V4cHJlc3Npb25zL1ZSTUV4cHJlc3Npb25Mb2FkZXJQbHVnaW4nO1xuaW1wb3J0IHsgVlJNRmlyc3RQZXJzb25Mb2FkZXJQbHVnaW4gfSBmcm9tICcuL2ZpcnN0UGVyc29uL1ZSTUZpcnN0UGVyc29uTG9hZGVyUGx1Z2luJztcbmltcG9ydCB7IFZSTUh1bWFub2lkTG9hZGVyUGx1Z2luIH0gZnJvbSAnLi9odW1hbm9pZC9WUk1IdW1hbm9pZExvYWRlclBsdWdpbic7XG5pbXBvcnQgeyBWUk1NZXRhTG9hZGVyUGx1Z2luIH0gZnJvbSAnLi9tZXRhL1ZSTU1ldGFMb2FkZXJQbHVnaW4nO1xuaW1wb3J0IHsgVlJNTG9va0F0TG9hZGVyUGx1Z2luIH0gZnJvbSAnLi9sb29rQXQvVlJNTG9va0F0TG9hZGVyUGx1Z2luJztcbmltcG9ydCB0eXBlIHsgVlJNSHVtYW5vaWQgfSBmcm9tICcuL2h1bWFub2lkJztcbmltcG9ydCB0eXBlIHsgVlJNTWV0YSB9IGZyb20gJy4vbWV0YSc7XG5cbmV4cG9ydCBjbGFzcyBWUk1Db3JlTG9hZGVyUGx1Z2luIGltcGxlbWVudHMgR0xURkxvYWRlclBsdWdpbiB7XG4gIHB1YmxpYyBnZXQgbmFtZSgpOiBzdHJpbmcge1xuICAgIC8vIFdlIHNob3VsZCB1c2UgdGhlIGV4dGVuc2lvbiBuYW1lIGluc3RlYWQgYnV0IHdlIGhhdmUgbXVsdGlwbGUgcGx1Z2lucyBmb3IgYW4gZXh0ZW5zaW9uLi4uXG4gICAgcmV0dXJuICdWUk1DX3ZybSc7XG4gIH1cblxuICBwdWJsaWMgcmVhZG9ubHkgcGFyc2VyOiBHTFRGUGFyc2VyO1xuXG4gIHB1YmxpYyByZWFkb25seSBleHByZXNzaW9uUGx1Z2luOiBWUk1FeHByZXNzaW9uTG9hZGVyUGx1Z2luO1xuICBwdWJsaWMgcmVhZG9ubHkgZmlyc3RQZXJzb25QbHVnaW46IFZSTUZpcnN0UGVyc29uTG9hZGVyUGx1Z2luO1xuICBwdWJsaWMgcmVhZG9ubHkgaHVtYW5vaWRQbHVnaW46IFZSTUh1bWFub2lkTG9hZGVyUGx1Z2luO1xuICBwdWJsaWMgcmVhZG9ubHkgbG9va0F0UGx1Z2luOiBWUk1Mb29rQXRMb2FkZXJQbHVnaW47XG4gIHB1YmxpYyByZWFkb25seSBtZXRhUGx1Z2luOiBWUk1NZXRhTG9hZGVyUGx1Z2luO1xuXG4gIHB1YmxpYyBjb25zdHJ1Y3RvcihwYXJzZXI6IEdMVEZQYXJzZXIsIG9wdGlvbnM/OiBWUk1Db3JlTG9hZGVyUGx1Z2luT3B0aW9ucykge1xuICAgIHRoaXMucGFyc2VyID0gcGFyc2VyO1xuXG4gICAgY29uc3QgaGVscGVyUm9vdCA9IG9wdGlvbnM/LmhlbHBlclJvb3Q7XG4gICAgY29uc3QgYXV0b1VwZGF0ZUh1bWFuQm9uZXMgPSBvcHRpb25zPy5hdXRvVXBkYXRlSHVtYW5Cb25lcztcblxuICAgIHRoaXMuZXhwcmVzc2lvblBsdWdpbiA9IG9wdGlvbnM/LmV4cHJlc3Npb25QbHVnaW4gPz8gbmV3IFZSTUV4cHJlc3Npb25Mb2FkZXJQbHVnaW4ocGFyc2VyKTtcbiAgICB0aGlzLmZpcnN0UGVyc29uUGx1Z2luID0gb3B0aW9ucz8uZmlyc3RQZXJzb25QbHVnaW4gPz8gbmV3IFZSTUZpcnN0UGVyc29uTG9hZGVyUGx1Z2luKHBhcnNlcik7XG4gICAgdGhpcy5odW1hbm9pZFBsdWdpbiA9XG4gICAgICBvcHRpb25zPy5odW1hbm9pZFBsdWdpbiA/PyBuZXcgVlJNSHVtYW5vaWRMb2FkZXJQbHVnaW4ocGFyc2VyLCB7IGhlbHBlclJvb3QsIGF1dG9VcGRhdGVIdW1hbkJvbmVzIH0pO1xuICAgIHRoaXMubG9va0F0UGx1Z2luID0gb3B0aW9ucz8ubG9va0F0UGx1Z2luID8/IG5ldyBWUk1Mb29rQXRMb2FkZXJQbHVnaW4ocGFyc2VyLCB7IGhlbHBlclJvb3QgfSk7XG4gICAgdGhpcy5tZXRhUGx1Z2luID0gb3B0aW9ucz8ubWV0YVBsdWdpbiA/PyBuZXcgVlJNTWV0YUxvYWRlclBsdWdpbihwYXJzZXIpO1xuICB9XG5cbiAgcHVibGljIGFzeW5jIGFmdGVyUm9vdChnbHRmOiBHTFRGKTogUHJvbWlzZTx2b2lkPiB7XG4gICAgYXdhaXQgdGhpcy5tZXRhUGx1Z2luLmFmdGVyUm9vdChnbHRmKTtcbiAgICBhd2FpdCB0aGlzLmh1bWFub2lkUGx1Z2luLmFmdGVyUm9vdChnbHRmKTtcbiAgICBhd2FpdCB0aGlzLmV4cHJlc3Npb25QbHVnaW4uYWZ0ZXJSb290KGdsdGYpO1xuICAgIGF3YWl0IHRoaXMubG9va0F0UGx1Z2luLmFmdGVyUm9vdChnbHRmKTtcbiAgICBhd2FpdCB0aGlzLmZpcnN0UGVyc29uUGx1Z2luLmFmdGVyUm9vdChnbHRmKTtcblxuICAgIGNvbnN0IG1ldGEgPSBnbHRmLnVzZXJEYXRhLnZybU1ldGEgYXMgVlJNTWV0YSB8IG51bGw7XG4gICAgY29uc3QgaHVtYW5vaWQgPSBnbHRmLnVzZXJEYXRhLnZybUh1bWFub2lkIGFzIFZSTUh1bWFub2lkIHwgbnVsbDtcblxuICAgIC8vIG1ldGEgYW5kIGh1bWFub2lkIGFyZSByZXF1aXJlZCB0byBiZSBhIFZSTS5cbiAgICAvLyBEb24ndCBjcmVhdGUgVlJNIGlmIHRoZXkgYXJlIG51bGxcbiAgICBpZiAobWV0YSAmJiBodW1hbm9pZCkge1xuICAgICAgY29uc3QgdnJtQ29yZSA9IG5ldyBWUk1Db3JlKHtcbiAgICAgICAgc2NlbmU6IGdsdGYuc2NlbmUsXG4gICAgICAgIGV4cHJlc3Npb25NYW5hZ2VyOiBnbHRmLnVzZXJEYXRhLnZybUV4cHJlc3Npb25NYW5hZ2VyLFxuICAgICAgICBmaXJzdFBlcnNvbjogZ2x0Zi51c2VyRGF0YS52cm1GaXJzdFBlcnNvbixcbiAgICAgICAgaHVtYW5vaWQsXG4gICAgICAgIGxvb2tBdDogZ2x0Zi51c2VyRGF0YS52cm1Mb29rQXQsXG4gICAgICAgIG1ldGEsXG4gICAgICB9KTtcblxuICAgICAgZ2x0Zi51c2VyRGF0YS52cm1Db3JlID0gdnJtQ29yZTtcbiAgICB9XG4gIH1cbn1cbiIsICJpbXBvcnQgKiBhcyBUSFJFRSBmcm9tICd0aHJlZSc7XG5pbXBvcnQgeyBWUk1Db3JlIH0gZnJvbSAnQHBpeGl2L3RocmVlLXZybS1jb3JlJztcbmltcG9ydCB7IFZSTU5vZGVDb25zdHJhaW50TWFuYWdlciB9IGZyb20gJ0BwaXhpdi90aHJlZS12cm0tbm9kZS1jb25zdHJhaW50JztcbmltcG9ydCB7IFZSTVNwcmluZ0JvbmVNYW5hZ2VyIH0gZnJvbSAnQHBpeGl2L3RocmVlLXZybS1zcHJpbmdib25lJztcbmltcG9ydCB7IFZSTVBhcmFtZXRlcnMgfSBmcm9tICcuL1ZSTVBhcmFtZXRlcnMnO1xuXG4vKipcbiAqIEEgY2xhc3MgdGhhdCByZXByZXNlbnRzIGEgc2luZ2xlIFZSTSBtb2RlbC5cbiAqL1xuZXhwb3J0IGNsYXNzIFZSTSBleHRlbmRzIFZSTUNvcmUge1xuICAvKipcbiAgICogQ29udGFpbnMgbWF0ZXJpYWxzIG9mIHRoZSBWUk0uXG4gICAqIGB1cGRhdGVgIG1ldGhvZCBvZiB0aGVzZSBtYXRlcmlhbHMgd2lsbCBiZSBjYWxsZWQgdmlhIGl0cyB7QGxpbmsgVlJNLnVwZGF0ZX0gbWV0aG9kLlxuICAgKi9cbiAgcHVibGljIHJlYWRvbmx5IG1hdGVyaWFscz86IFRIUkVFLk1hdGVyaWFsW107XG5cbiAgLyoqXG4gICAqIEEge0BsaW5rIFZSTVNwcmluZ0JvbmVNYW5hZ2VyfSBtYW5pcHVsYXRlcyBhbGwgc3ByaW5nIGJvbmVzIGF0dGFjaGVkIG9uIHRoZSBWUk0uXG4gICAqIFVzdWFsbHkgeW91IGRvbid0IGhhdmUgdG8gY2FyZSBhYm91dCB0aGlzIHByb3BlcnR5LlxuICAgKi9cbiAgcHVibGljIHJlYWRvbmx5IHNwcmluZ0JvbmVNYW5hZ2VyPzogVlJNU3ByaW5nQm9uZU1hbmFnZXI7XG5cbiAgLyoqXG4gICAqIEEge0BsaW5rIFZSTU5vZGVDb25zdHJhaW50TWFuYWdlcn0gbWFuaXB1bGF0ZXMgYWxsIGNvbnN0cmFpbnRzIGF0dGFjaGVkIG9uIHRoZSBWUk0uXG4gICAqIFVzdWFsbHkgeW91IGRvbid0IGhhdmUgdG8gY2FyZSBhYm91dCB0aGlzIHByb3BlcnR5LlxuICAgKi9cbiAgcHVibGljIHJlYWRvbmx5IG5vZGVDb25zdHJhaW50TWFuYWdlcj86IFZSTU5vZGVDb25zdHJhaW50TWFuYWdlcjtcblxuICAvKipcbiAgICogQ3JlYXRlIGEgbmV3IFZSTSBpbnN0YW5jZS5cbiAgICpcbiAgICogQHBhcmFtIHBhcmFtcyBbW1ZSTVBhcmFtZXRlcnNdXSB0aGF0IHJlcHJlc2VudHMgY29tcG9uZW50cyBvZiB0aGUgVlJNXG4gICAqL1xuICBwdWJsaWMgY29uc3RydWN0b3IocGFyYW1zOiBWUk1QYXJhbWV0ZXJzKSB7XG4gICAgc3VwZXIocGFyYW1zKTtcblxuICAgIHRoaXMubWF0ZXJpYWxzID0gcGFyYW1zLm1hdGVyaWFscztcbiAgICB0aGlzLnNwcmluZ0JvbmVNYW5hZ2VyID0gcGFyYW1zLnNwcmluZ0JvbmVNYW5hZ2VyO1xuICAgIHRoaXMubm9kZUNvbnN0cmFpbnRNYW5hZ2VyID0gcGFyYW1zLm5vZGVDb25zdHJhaW50TWFuYWdlcjtcbiAgfVxuXG4gIC8qKlxuICAgKiAqKllvdSBuZWVkIHRvIGNhbGwgdGhpcyBvbiB5b3VyIHVwZGF0ZSBsb29wLioqXG4gICAqXG4gICAqIFRoaXMgZnVuY3Rpb24gdXBkYXRlcyBldmVyeSBWUk0gY29tcG9uZW50cy5cbiAgICpcbiAgICogQHBhcmFtIGRlbHRhIGRlbHRhVGltZVxuICAgKi9cbiAgcHVibGljIHVwZGF0ZShkZWx0YTogbnVtYmVyKTogdm9pZCB7XG4gICAgc3VwZXIudXBkYXRlKGRlbHRhKTtcblxuICAgIGlmICh0aGlzLm5vZGVDb25zdHJhaW50TWFuYWdlcikge1xuICAgICAgdGhpcy5ub2RlQ29uc3RyYWludE1hbmFnZXIudXBkYXRlKCk7XG4gICAgfVxuXG4gICAgaWYgKHRoaXMuc3ByaW5nQm9uZU1hbmFnZXIpIHtcbiAgICAgIHRoaXMuc3ByaW5nQm9uZU1hbmFnZXIudXBkYXRlKGRlbHRhKTtcbiAgICB9XG5cbiAgICBpZiAodGhpcy5tYXRlcmlhbHMpIHtcbiAgICAgIHRoaXMubWF0ZXJpYWxzLmZvckVhY2goKG1hdGVyaWFsOiBhbnkpID0+IHtcbiAgICAgICAgaWYgKG1hdGVyaWFsLnVwZGF0ZSkge1xuICAgICAgICAgIG1hdGVyaWFsLnVwZGF0ZShkZWx0YSk7XG4gICAgICAgIH1cbiAgICAgIH0pO1xuICAgIH1cbiAgfVxufVxuIiwgImltcG9ydCAqIGFzIFRIUkVFIGZyb20gJ3RocmVlJztcbmltcG9ydCAqIGFzIFYxTVRvb25TY2hlbWEgZnJvbSAnQHBpeGl2L3R5cGVzLXZybWMtbWF0ZXJpYWxzLW10b29uLTEuMCc7XG5pbXBvcnQgdHlwZSB7IEdMVEYsIEdMVEZMb2FkZXIsIEdMVEZMb2FkZXJQbHVnaW4sIEdMVEZQYXJzZXIgfSBmcm9tICd0aHJlZS9leGFtcGxlcy9qc20vbG9hZGVycy9HTFRGTG9hZGVyLmpzJztcbmltcG9ydCB0eXBlIHsgTVRvb25NYXRlcmlhbFBhcmFtZXRlcnMgfSBmcm9tICcuL01Ub29uTWF0ZXJpYWxQYXJhbWV0ZXJzJztcbmltcG9ydCB0eXBlIHsgTVRvb25NYXRlcmlhbE91dGxpbmVXaWR0aE1vZGUgfSBmcm9tICcuL01Ub29uTWF0ZXJpYWxPdXRsaW5lV2lkdGhNb2RlJztcbmltcG9ydCB7IEdMVEZNVG9vbk1hdGVyaWFsUGFyYW1zQXNzaWduSGVscGVyIH0gZnJvbSAnLi9HTFRGTVRvb25NYXRlcmlhbFBhcmFtc0Fzc2lnbkhlbHBlcic7XG5pbXBvcnQgdHlwZSB7IE1Ub29uTWF0ZXJpYWxMb2FkZXJQbHVnaW5PcHRpb25zIH0gZnJvbSAnLi9NVG9vbk1hdGVyaWFsTG9hZGVyUGx1Z2luT3B0aW9ucyc7XG5pbXBvcnQgdHlwZSB7IE1Ub29uTWF0ZXJpYWxEZWJ1Z01vZGUgfSBmcm9tICcuL01Ub29uTWF0ZXJpYWxEZWJ1Z01vZGUnO1xuaW1wb3J0IHsgR0xURiBhcyBHTFRGU2NoZW1hIH0gZnJvbSAnQGdsdGYtdHJhbnNmb3JtL2NvcmUnO1xuaW1wb3J0IHsgTVRvb25NYXRlcmlhbCB9IGZyb20gJy4vTVRvb25NYXRlcmlhbCc7XG5pbXBvcnQgdHlwZSB7IE1Ub29uTm9kZU1hdGVyaWFsIH0gZnJvbSAnLi9ub2Rlcy9NVG9vbk5vZGVNYXRlcmlhbCc7XG5cbi8qKlxuICogUG9zc2libGUgc3BlYyB2ZXJzaW9ucyBpdCByZWNvZ25pemVzLlxuICovXG5jb25zdCBQT1NTSUJMRV9TUEVDX1ZFUlNJT05TID0gbmV3IFNldChbJzEuMCcsICcxLjAtYmV0YSddKTtcblxuLyoqXG4gKiBBIGxvYWRlciBwbHVnaW4gb2Yge0BsaW5rIEdMVEZMb2FkZXJ9IGZvciB0aGUgZXh0ZW5zaW9uIGBWUk1DX21hdGVyaWFsc19tdG9vbmAuXG4gKlxuICogVGhpcyBwbHVnaW4gaXMgZm9yIHVzZXMgd2l0aCBXZWJHTFJlbmRlcmVyIGJ5IGRlZmF1bHQuXG4gKiBUbyB1c2UgTVRvb24gaW4gV2ViR1BVUmVuZGVyZXIsIHNldCB7QGxpbmsgbWF0ZXJpYWxUeXBlfSB0byB7QGxpbmsgTVRvb25Ob2RlTWF0ZXJpYWx9LlxuICpcbiAqIEBleGFtcGxlIHRvIHVzZSB3aXRoIFdlYkdQVVJlbmRlcmVyXG4gKiBgYGBqc1xuICogaW1wb3J0IHsgTVRvb25NYXRlcmlhbExvYWRlclBsdWdpbiB9IGZyb20gJ0BwaXhpdi90aHJlZS12cm0tbWF0ZXJpYWxzLW10b29uJztcbiAqIGltcG9ydCB7IE1Ub29uTm9kZU1hdGVyaWFsIH0gZnJvbSAnQHBpeGl2L3RocmVlLXZybS1tYXRlcmlhbHMtbXRvb24vbm9kZXMnO1xuICpcbiAqIC8vIC4uLlxuICpcbiAqIC8vIFJlZ2lzdGVyIGEgTVRvb25NYXRlcmlhbExvYWRlclBsdWdpbiB3aXRoIE1Ub29uTm9kZU1hdGVyaWFsXG4gKiBsb2FkZXIucmVnaXN0ZXIoKHBhcnNlcikgPT4ge1xuICpcbiAqICAgLy8gY3JlYXRlIGEgV2ViR1BVIGNvbXBhdGlibGUgTVRvb25NYXRlcmlhbExvYWRlclBsdWdpblxuICogICByZXR1cm4gbmV3IE1Ub29uTWF0ZXJpYWxMb2FkZXJQbHVnaW4ocGFyc2VyLCB7XG4gKlxuICogICAgIC8vIHNldCB0aGUgbWF0ZXJpYWwgdHlwZSB0byBNVG9vbk5vZGVNYXRlcmlhbFxuICogICAgIG1hdGVyaWFsVHlwZTogTVRvb25Ob2RlTWF0ZXJpYWwsXG4gKlxuICogICB9KTtcbiAqXG4gKiB9KTtcbiAqIGBgYFxuICovXG5leHBvcnQgY2xhc3MgTVRvb25NYXRlcmlhbExvYWRlclBsdWdpbiBpbXBsZW1lbnRzIEdMVEZMb2FkZXJQbHVnaW4ge1xuICBwdWJsaWMgc3RhdGljIEVYVEVOU0lPTl9OQU1FID0gJ1ZSTUNfbWF0ZXJpYWxzX210b29uJztcblxuICAvKipcbiAgICogVGhlIHR5cGUgb2YgdGhlIG1hdGVyaWFsIHRoYXQgdGhpcyBwbHVnaW4gd2lsbCBnZW5lcmF0ZS5cbiAgICpcbiAgICogSWYgeW91IGFyZSB1c2luZyB0aGlzIHBsdWdpbiB3aXRoIFdlYkdQVSwgc2V0IHRoaXMgdG8ge0BsaW5rIE1Ub29uTm9kZU1hdGVyaWFsfS5cbiAgICpcbiAgICogQGRlZmF1bHQgTVRvb25NYXRlcmlhbFxuICAgKi9cbiAgcHVibGljIG1hdGVyaWFsVHlwZTogdHlwZW9mIFRIUkVFLk1hdGVyaWFsO1xuXG4gIC8qKlxuICAgKiBUaGlzIHZhbHVlIHdpbGwgYmUgYWRkZWQgdG8gYHJlbmRlck9yZGVyYCBvZiBldmVyeSBtZXNoZXMgd2hvIGhhdmUgTWF0ZXJpYWxzTVRvb24uXG4gICAqIFRoZSBmaW5hbCByZW5kZXJPcmRlciB3aWxsIGJlIHN1bSBvZiB0aGlzIGByZW5kZXJPcmRlck9mZnNldGAgYW5kIGByZW5kZXJRdWV1ZU9mZnNldE51bWJlcmAgZm9yIGVhY2ggbWF0ZXJpYWxzLlxuICAgKlxuICAgKiBAZGVmYXVsdCAwXG4gICAqL1xuICBwdWJsaWMgcmVuZGVyT3JkZXJPZmZzZXQ6IG51bWJlcjtcblxuICAvKipcbiAgICogVGhlcmUgaXMgYSBsaW5lIG9mIHRoZSBzaGFkZXIgY2FsbGVkIFwiY29tbWVudCBvdXQgaWYgeW91IHdhbnQgdG8gUEJSIGFic29sdXRlbHlcIiBpbiBWUk0wLjAgTVRvb24uXG4gICAqIFdoZW4gdGhpcyBpcyB0cnVlLCB0aGUgbWF0ZXJpYWwgZW5hYmxlcyB0aGUgbGluZSB0byBtYWtlIGl0IGNvbXBhdGlibGUgd2l0aCB0aGUgbGVnYWN5IHJlbmRlcmluZyBvZiBWUk0uXG4gICAqIFVzdWFsbHkgbm90IHJlY29tbWVuZGVkIHRvIHR1cm4gdGhpcyBvbi5cbiAgICpcbiAgICogQGRlZmF1bHQgZmFsc2VcbiAgICovXG4gIHB1YmxpYyB2MENvbXBhdFNoYWRlOiBib29sZWFuO1xuXG4gIC8qKlxuICAgKiBEZWJ1ZyBtb2RlIGZvciB0aGUgbWF0ZXJpYWwuXG4gICAqIFlvdSBjYW4gdmlzdWFsaXplIHNldmVyYWwgY29tcG9uZW50cyBmb3IgZGlhZ25vc2lzIHVzaW5nIGRlYnVnIG1vZGUuXG4gICAqXG4gICAqIFNlZToge0BsaW5rIE1Ub29uTWF0ZXJpYWxEZWJ1Z01vZGV9XG4gICAqXG4gICAqIEBkZWZhdWx0ICdub25lJ1xuICAgKi9cbiAgcHVibGljIGRlYnVnTW9kZTogTVRvb25NYXRlcmlhbERlYnVnTW9kZTtcblxuICBwdWJsaWMgcmVhZG9ubHkgcGFyc2VyOiBHTFRGUGFyc2VyO1xuXG4gIC8qKlxuICAgKiBMb2FkZWQgbWF0ZXJpYWxzIHdpbGwgYmUgc3RvcmVkIGluIHRoaXMgc2V0LlxuICAgKiBXaWxsIGJlIHRyYW5zZmVycmVkIGludG8gYGdsdGYudXNlckRhdGEudnJtTVRvb25NYXRlcmlhbHNgIGluIHtAbGluayBhZnRlclJvb3R9LlxuICAgKi9cbiAgcHJpdmF0ZSByZWFkb25seSBfbVRvb25NYXRlcmlhbFNldDogU2V0PFRIUkVFLk1hdGVyaWFsPjtcblxuICBwdWJsaWMgZ2V0IG5hbWUoKTogc3RyaW5nIHtcbiAgICByZXR1cm4gTVRvb25NYXRlcmlhbExvYWRlclBsdWdpbi5FWFRFTlNJT05fTkFNRTtcbiAgfVxuXG4gIHB1YmxpYyBjb25zdHJ1Y3RvcihwYXJzZXI6IEdMVEZQYXJzZXIsIG9wdGlvbnM6IE1Ub29uTWF0ZXJpYWxMb2FkZXJQbHVnaW5PcHRpb25zID0ge30pIHtcbiAgICB0aGlzLnBhcnNlciA9IHBhcnNlcjtcblxuICAgIHRoaXMubWF0ZXJpYWxUeXBlID0gb3B0aW9ucy5tYXRlcmlhbFR5cGUgPz8gTVRvb25NYXRlcmlhbDtcbiAgICB0aGlzLnJlbmRlck9yZGVyT2Zmc2V0ID0gb3B0aW9ucy5yZW5kZXJPcmRlck9mZnNldCA/PyAwO1xuICAgIHRoaXMudjBDb21wYXRTaGFkZSA9IG9wdGlvbnMudjBDb21wYXRTaGFkZSA/PyBmYWxzZTtcbiAgICB0aGlzLmRlYnVnTW9kZSA9IG9wdGlvbnMuZGVidWdNb2RlID8/ICdub25lJztcblxuICAgIHRoaXMuX21Ub29uTWF0ZXJpYWxTZXQgPSBuZXcgU2V0KCk7XG4gIH1cblxuICBwdWJsaWMgYXN5bmMgYmVmb3JlUm9vdCgpOiBQcm9taXNlPHZvaWQ+IHtcbiAgICB0aGlzLl9yZW1vdmVVbmxpdEV4dGVuc2lvbklmTVRvb25FeGlzdHMoKTtcbiAgfVxuXG4gIHB1YmxpYyBhc3luYyBhZnRlclJvb3QoZ2x0ZjogR0xURik6IFByb21pc2U8dm9pZD4ge1xuICAgIGdsdGYudXNlckRhdGEudnJtTVRvb25NYXRlcmlhbHMgPSBBcnJheS5mcm9tKHRoaXMuX21Ub29uTWF0ZXJpYWxTZXQpO1xuICB9XG5cbiAgcHVibGljIGdldE1hdGVyaWFsVHlwZShtYXRlcmlhbEluZGV4OiBudW1iZXIpOiB0eXBlb2YgVEhSRUUuTWF0ZXJpYWwgfCBudWxsIHtcbiAgICBjb25zdCB2MUV4dGVuc2lvbiA9IHRoaXMuX2dldE1Ub29uRXh0ZW5zaW9uKG1hdGVyaWFsSW5kZXgpO1xuICAgIGlmICh2MUV4dGVuc2lvbikge1xuICAgICAgcmV0dXJuIHRoaXMubWF0ZXJpYWxUeXBlO1xuICAgIH1cblxuICAgIHJldHVybiBudWxsO1xuICB9XG5cbiAgcHVibGljIGV4dGVuZE1hdGVyaWFsUGFyYW1zKG1hdGVyaWFsSW5kZXg6IG51bWJlciwgbWF0ZXJpYWxQYXJhbXM6IE1Ub29uTWF0ZXJpYWxQYXJhbWV0ZXJzKTogUHJvbWlzZTxhbnk+IHwgbnVsbCB7XG4gICAgY29uc3QgZXh0ZW5zaW9uID0gdGhpcy5fZ2V0TVRvb25FeHRlbnNpb24obWF0ZXJpYWxJbmRleCk7XG4gICAgaWYgKGV4dGVuc2lvbikge1xuICAgICAgcmV0dXJuIHRoaXMuX2V4dGVuZE1hdGVyaWFsUGFyYW1zKGV4dGVuc2lvbiwgbWF0ZXJpYWxQYXJhbXMpO1xuICAgIH1cblxuICAgIHJldHVybiBudWxsO1xuICB9XG5cbiAgcHVibGljIGFzeW5jIGxvYWRNZXNoKG1lc2hJbmRleDogbnVtYmVyKTogUHJvbWlzZTxUSFJFRS5Hcm91cCB8IFRIUkVFLk1lc2ggfCBUSFJFRS5Ta2lubmVkTWVzaD4ge1xuICAgIGNvbnN0IHBhcnNlciA9IHRoaXMucGFyc2VyO1xuICAgIGNvbnN0IGpzb24gPSBwYXJzZXIuanNvbiBhcyBHTFRGU2NoZW1hLklHTFRGO1xuXG4gICAgY29uc3QgbWVzaERlZiA9IGpzb24ubWVzaGVzPy5bbWVzaEluZGV4XTtcblxuICAgIGlmIChtZXNoRGVmID09IG51bGwpIHtcbiAgICAgIHRocm93IG5ldyBFcnJvcihcbiAgICAgICAgYE1Ub29uTWF0ZXJpYWxMb2FkZXJQbHVnaW46IEF0dGVtcHQgdG8gdXNlIG1lc2hlc1ske21lc2hJbmRleH1dIG9mIGdsVEYgYnV0IHRoZSBtZXNoIGRvZXNuJ3QgZXhpc3RgLFxuICAgICAgKTtcbiAgICB9XG5cbiAgICBjb25zdCBwcmltaXRpdmVzRGVmID0gbWVzaERlZi5wcmltaXRpdmVzO1xuXG4gICAgY29uc3QgbWVzaE9yR3JvdXAgPSBhd2FpdCBwYXJzZXIubG9hZE1lc2gobWVzaEluZGV4KTtcblxuICAgIGlmIChwcmltaXRpdmVzRGVmLmxlbmd0aCA9PT0gMSkge1xuICAgICAgY29uc3QgbWVzaCA9IG1lc2hPckdyb3VwIGFzIFRIUkVFLk1lc2g7XG4gICAgICBjb25zdCBtYXRlcmlhbEluZGV4ID0gcHJpbWl0aXZlc0RlZlswXS5tYXRlcmlhbDtcblxuICAgICAgaWYgKG1hdGVyaWFsSW5kZXggIT0gbnVsbCkge1xuICAgICAgICB0aGlzLl9zZXR1cFByaW1pdGl2ZShtZXNoLCBtYXRlcmlhbEluZGV4KTtcbiAgICAgIH1cbiAgICB9IGVsc2Uge1xuICAgICAgY29uc3QgZ3JvdXAgPSBtZXNoT3JHcm91cCBhcyBUSFJFRS5Hcm91cDtcbiAgICAgIGZvciAobGV0IGkgPSAwOyBpIDwgcHJpbWl0aXZlc0RlZi5sZW5ndGg7IGkrKykge1xuICAgICAgICBjb25zdCBtZXNoID0gZ3JvdXAuY2hpbGRyZW5baV0gYXMgVEhSRUUuTWVzaDtcbiAgICAgICAgY29uc3QgbWF0ZXJpYWxJbmRleCA9IHByaW1pdGl2ZXNEZWZbaV0ubWF0ZXJpYWw7XG5cbiAgICAgICAgaWYgKG1hdGVyaWFsSW5kZXggIT0gbnVsbCkge1xuICAgICAgICAgIHRoaXMuX3NldHVwUHJpbWl0aXZlKG1lc2gsIG1hdGVyaWFsSW5kZXgpO1xuICAgICAgICB9XG4gICAgICB9XG4gICAgfVxuXG4gICAgcmV0dXJuIG1lc2hPckdyb3VwO1xuICB9XG5cbiAgLyoqXG4gICAqIERlbGV0ZSB1c2Ugb2YgYEtIUl9tYXRlcmlhbHNfdW5saXRgIGZyb20gaXRzIGBtYXRlcmlhbHNgIGlmIHRoZSBtYXRlcmlhbCBpcyB1c2luZyBNVG9vbi5cbiAgICpcbiAgICogU2luY2UgR0xURkxvYWRlciBoYXZlIHNvIG1hbnkgaGFyZGNvZGVkIHByb2NlZHVyZSByZWxhdGVkIHRvIGBLSFJfbWF0ZXJpYWxzX3VubGl0YFxuICAgKiB3ZSBoYXZlIHRvIGRlbGV0ZSB0aGUgZXh0ZW5zaW9uIGJlZm9yZSB3ZSBzdGFydCB0byBwYXJzZSB0aGUgZ2xURi5cbiAgICovXG4gIHByaXZhdGUgX3JlbW92ZVVubGl0RXh0ZW5zaW9uSWZNVG9vbkV4aXN0cygpOiB2b2lkIHtcbiAgICBjb25zdCBwYXJzZXIgPSB0aGlzLnBhcnNlcjtcbiAgICBjb25zdCBqc29uID0gcGFyc2VyLmpzb24gYXMgR0xURlNjaGVtYS5JR0xURjtcblxuICAgIGNvbnN0IG1hdGVyaWFsRGVmcyA9IGpzb24ubWF0ZXJpYWxzO1xuICAgIG1hdGVyaWFsRGVmcz8ubWFwKChtYXRlcmlhbERlZiwgaU1hdGVyaWFsKSA9PiB7XG4gICAgICBjb25zdCBleHRlbnNpb24gPSB0aGlzLl9nZXRNVG9vbkV4dGVuc2lvbihpTWF0ZXJpYWwpO1xuXG4gICAgICBpZiAoZXh0ZW5zaW9uICYmIG1hdGVyaWFsRGVmLmV4dGVuc2lvbnM/LlsnS0hSX21hdGVyaWFsc191bmxpdCddKSB7XG4gICAgICAgIGRlbGV0ZSBtYXRlcmlhbERlZi5leHRlbnNpb25zWydLSFJfbWF0ZXJpYWxzX3VubGl0J107XG4gICAgICB9XG4gICAgfSk7XG4gIH1cblxuICBwcm90ZWN0ZWQgX2dldE1Ub29uRXh0ZW5zaW9uKG1hdGVyaWFsSW5kZXg6IG51bWJlcik6IFYxTVRvb25TY2hlbWEuVlJNQ01hdGVyaWFsc01Ub29uIHwgdW5kZWZpbmVkIHtcbiAgICBjb25zdCBwYXJzZXIgPSB0aGlzLnBhcnNlcjtcbiAgICBjb25zdCBqc29uID0gcGFyc2VyLmpzb24gYXMgR0xURlNjaGVtYS5JR0xURjtcblxuICAgIGNvbnN0IG1hdGVyaWFsRGVmID0ganNvbi5tYXRlcmlhbHM/LlttYXRlcmlhbEluZGV4XTtcblxuICAgIGlmIChtYXRlcmlhbERlZiA9PSBudWxsKSB7XG4gICAgICBjb25zb2xlLndhcm4oXG4gICAgICAgIGBNVG9vbk1hdGVyaWFsTG9hZGVyUGx1Z2luOiBBdHRlbXB0IHRvIHVzZSBtYXRlcmlhbHNbJHttYXRlcmlhbEluZGV4fV0gb2YgZ2xURiBidXQgdGhlIG1hdGVyaWFsIGRvZXNuJ3QgZXhpc3RgLFxuICAgICAgKTtcbiAgICAgIHJldHVybiB1bmRlZmluZWQ7XG4gICAgfVxuXG4gICAgY29uc3QgZXh0ZW5zaW9uID0gbWF0ZXJpYWxEZWYuZXh0ZW5zaW9ucz8uW01Ub29uTWF0ZXJpYWxMb2FkZXJQbHVnaW4uRVhURU5TSU9OX05BTUVdIGFzXG4gICAgICB8IFYxTVRvb25TY2hlbWEuVlJNQ01hdGVyaWFsc01Ub29uXG4gICAgICB8IHVuZGVmaW5lZDtcbiAgICBpZiAoZXh0ZW5zaW9uID09IG51bGwpIHtcbiAgICAgIHJldHVybiB1bmRlZmluZWQ7XG4gICAgfVxuXG4gICAgY29uc3Qgc3BlY1ZlcnNpb24gPSBleHRlbnNpb24uc3BlY1ZlcnNpb247XG4gICAgaWYgKCFQT1NTSUJMRV9TUEVDX1ZFUlNJT05TLmhhcyhzcGVjVmVyc2lvbikpIHtcbiAgICAgIGNvbnNvbGUud2FybihcbiAgICAgICAgYE1Ub29uTWF0ZXJpYWxMb2FkZXJQbHVnaW46IFVua25vd24gJHtNVG9vbk1hdGVyaWFsTG9hZGVyUGx1Z2luLkVYVEVOU0lPTl9OQU1FfSBzcGVjVmVyc2lvbiBcIiR7c3BlY1ZlcnNpb259XCJgLFxuICAgICAgKTtcbiAgICAgIHJldHVybiB1bmRlZmluZWQ7XG4gICAgfVxuXG4gICAgcmV0dXJuIGV4dGVuc2lvbjtcbiAgfVxuXG4gIHByaXZhdGUgYXN5bmMgX2V4dGVuZE1hdGVyaWFsUGFyYW1zKFxuICAgIGV4dGVuc2lvbjogVjFNVG9vblNjaGVtYS5WUk1DTWF0ZXJpYWxzTVRvb24sXG4gICAgbWF0ZXJpYWxQYXJhbXM6IE1Ub29uTWF0ZXJpYWxQYXJhbWV0ZXJzLFxuICApOiBQcm9taXNlPHZvaWQ+IHtcbiAgICAvLyBSZW1vdmluZyBtYXRlcmlhbCBwYXJhbXMgdGhhdCBpcyBub3QgcmVxdWlyZWQgdG8gc3VwcmVzcyB3YXJuaW5ncy5cbiAgICBkZWxldGUgKG1hdGVyaWFsUGFyYW1zIGFzIFRIUkVFLk1lc2hTdGFuZGFyZE1hdGVyaWFsUGFyYW1ldGVycykubWV0YWxuZXNzO1xuICAgIGRlbGV0ZSAobWF0ZXJpYWxQYXJhbXMgYXMgVEhSRUUuTWVzaFN0YW5kYXJkTWF0ZXJpYWxQYXJhbWV0ZXJzKS5yb3VnaG5lc3M7XG5cbiAgICBjb25zdCBhc3NpZ25IZWxwZXIgPSBuZXcgR0xURk1Ub29uTWF0ZXJpYWxQYXJhbXNBc3NpZ25IZWxwZXIodGhpcy5wYXJzZXIsIG1hdGVyaWFsUGFyYW1zKTtcblxuICAgIGFzc2lnbkhlbHBlci5hc3NpZ25QcmltaXRpdmUoJ3RyYW5zcGFyZW50V2l0aFpXcml0ZScsIGV4dGVuc2lvbi50cmFuc3BhcmVudFdpdGhaV3JpdGUpO1xuICAgIGFzc2lnbkhlbHBlci5hc3NpZ25Db2xvcignc2hhZGVDb2xvckZhY3RvcicsIGV4dGVuc2lvbi5zaGFkZUNvbG9yRmFjdG9yKTtcbiAgICBhc3NpZ25IZWxwZXIuYXNzaWduVGV4dHVyZSgnc2hhZGVNdWx0aXBseVRleHR1cmUnLCBleHRlbnNpb24uc2hhZGVNdWx0aXBseVRleHR1cmUsIHRydWUpO1xuICAgIGFzc2lnbkhlbHBlci5hc3NpZ25QcmltaXRpdmUoJ3NoYWRpbmdTaGlmdEZhY3RvcicsIGV4dGVuc2lvbi5zaGFkaW5nU2hpZnRGYWN0b3IpO1xuICAgIGFzc2lnbkhlbHBlci5hc3NpZ25UZXh0dXJlKCdzaGFkaW5nU2hpZnRUZXh0dXJlJywgZXh0ZW5zaW9uLnNoYWRpbmdTaGlmdFRleHR1cmUsIHRydWUpO1xuICAgIGFzc2lnbkhlbHBlci5hc3NpZ25QcmltaXRpdmUoJ3NoYWRpbmdTaGlmdFRleHR1cmVTY2FsZScsIGV4dGVuc2lvbi5zaGFkaW5nU2hpZnRUZXh0dXJlPy5zY2FsZSk7XG4gICAgYXNzaWduSGVscGVyLmFzc2lnblByaW1pdGl2ZSgnc2hhZGluZ1Rvb255RmFjdG9yJywgZXh0ZW5zaW9uLnNoYWRpbmdUb29ueUZhY3Rvcik7XG4gICAgYXNzaWduSGVscGVyLmFzc2lnblByaW1pdGl2ZSgnZ2lFcXVhbGl6YXRpb25GYWN0b3InLCBleHRlbnNpb24uZ2lFcXVhbGl6YXRpb25GYWN0b3IpO1xuICAgIGFzc2lnbkhlbHBlci5hc3NpZ25Db2xvcignbWF0Y2FwRmFjdG9yJywgZXh0ZW5zaW9uLm1hdGNhcEZhY3Rvcik7XG4gICAgYXNzaWduSGVscGVyLmFzc2lnblRleHR1cmUoJ21hdGNhcFRleHR1cmUnLCBleHRlbnNpb24ubWF0Y2FwVGV4dHVyZSwgdHJ1ZSk7XG4gICAgYXNzaWduSGVscGVyLmFzc2lnbkNvbG9yKCdwYXJhbWV0cmljUmltQ29sb3JGYWN0b3InLCBleHRlbnNpb24ucGFyYW1ldHJpY1JpbUNvbG9yRmFjdG9yKTtcbiAgICBhc3NpZ25IZWxwZXIuYXNzaWduVGV4dHVyZSgncmltTXVsdGlwbHlUZXh0dXJlJywgZXh0ZW5zaW9uLnJpbU11bHRpcGx5VGV4dHVyZSwgdHJ1ZSk7XG4gICAgYXNzaWduSGVscGVyLmFzc2lnblByaW1pdGl2ZSgncmltTGlnaHRpbmdNaXhGYWN0b3InLCBleHRlbnNpb24ucmltTGlnaHRpbmdNaXhGYWN0b3IpO1xuICAgIGFzc2lnbkhlbHBlci5hc3NpZ25QcmltaXRpdmUoJ3BhcmFtZXRyaWNSaW1GcmVzbmVsUG93ZXJGYWN0b3InLCBleHRlbnNpb24ucGFyYW1ldHJpY1JpbUZyZXNuZWxQb3dlckZhY3Rvcik7XG4gICAgYXNzaWduSGVscGVyLmFzc2lnblByaW1pdGl2ZSgncGFyYW1ldHJpY1JpbUxpZnRGYWN0b3InLCBleHRlbnNpb24ucGFyYW1ldHJpY1JpbUxpZnRGYWN0b3IpO1xuICAgIGFzc2lnbkhlbHBlci5hc3NpZ25QcmltaXRpdmUoJ291dGxpbmVXaWR0aE1vZGUnLCBleHRlbnNpb24ub3V0bGluZVdpZHRoTW9kZSBhcyBNVG9vbk1hdGVyaWFsT3V0bGluZVdpZHRoTW9kZSk7XG4gICAgYXNzaWduSGVscGVyLmFzc2lnblByaW1pdGl2ZSgnb3V0bGluZVdpZHRoRmFjdG9yJywgZXh0ZW5zaW9uLm91dGxpbmVXaWR0aEZhY3Rvcik7XG4gICAgYXNzaWduSGVscGVyLmFzc2lnblRleHR1cmUoJ291dGxpbmVXaWR0aE11bHRpcGx5VGV4dHVyZScsIGV4dGVuc2lvbi5vdXRsaW5lV2lkdGhNdWx0aXBseVRleHR1cmUsIGZhbHNlKTtcbiAgICBhc3NpZ25IZWxwZXIuYXNzaWduQ29sb3IoJ291dGxpbmVDb2xvckZhY3RvcicsIGV4dGVuc2lvbi5vdXRsaW5lQ29sb3JGYWN0b3IpO1xuICAgIGFzc2lnbkhlbHBlci5hc3NpZ25QcmltaXRpdmUoJ291dGxpbmVMaWdodGluZ01peEZhY3RvcicsIGV4dGVuc2lvbi5vdXRsaW5lTGlnaHRpbmdNaXhGYWN0b3IpO1xuICAgIGFzc2lnbkhlbHBlci5hc3NpZ25UZXh0dXJlKCd1dkFuaW1hdGlvbk1hc2tUZXh0dXJlJywgZXh0ZW5zaW9uLnV2QW5pbWF0aW9uTWFza1RleHR1cmUsIGZhbHNlKTtcbiAgICBhc3NpZ25IZWxwZXIuYXNzaWduUHJpbWl0aXZlKCd1dkFuaW1hdGlvblNjcm9sbFhTcGVlZEZhY3RvcicsIGV4dGVuc2lvbi51dkFuaW1hdGlvblNjcm9sbFhTcGVlZEZhY3Rvcik7XG4gICAgYXNzaWduSGVscGVyLmFzc2lnblByaW1pdGl2ZSgndXZBbmltYXRpb25TY3JvbGxZU3BlZWRGYWN0b3InLCBleHRlbnNpb24udXZBbmltYXRpb25TY3JvbGxZU3BlZWRGYWN0b3IpO1xuICAgIGFzc2lnbkhlbHBlci5hc3NpZ25QcmltaXRpdmUoJ3V2QW5pbWF0aW9uUm90YXRpb25TcGVlZEZhY3RvcicsIGV4dGVuc2lvbi51dkFuaW1hdGlvblJvdGF0aW9uU3BlZWRGYWN0b3IpO1xuXG4gICAgYXNzaWduSGVscGVyLmFzc2lnblByaW1pdGl2ZSgndjBDb21wYXRTaGFkZScsIHRoaXMudjBDb21wYXRTaGFkZSk7XG4gICAgYXNzaWduSGVscGVyLmFzc2lnblByaW1pdGl2ZSgnZGVidWdNb2RlJywgdGhpcy5kZWJ1Z01vZGUpO1xuXG4gICAgYXdhaXQgYXNzaWduSGVscGVyLnBlbmRpbmc7XG4gIH1cblxuICAvKipcbiAgICogVGhpcyB3aWxsIGRvIHR3byBwcm9jZXNzZXMgdGhhdCBpcyByZXF1aXJlZCB0byByZW5kZXIgTVRvb24gcHJvcGVybHkuXG4gICAqXG4gICAqIC0gU2V0IHJlbmRlciBvcmRlclxuICAgKiAtIEdlbmVyYXRlIG91dGxpbmVcbiAgICpcbiAgICogQHBhcmFtIG1lc2ggQSB0YXJnZXQgR0xURiBwcmltaXRpdmVcbiAgICogQHBhcmFtIG1hdGVyaWFsSW5kZXggVGhlIG1hdGVyaWFsIGluZGV4IG9mIHRoZSBwcmltaXRpdmVcbiAgICovXG4gIHByaXZhdGUgX3NldHVwUHJpbWl0aXZlKG1lc2g6IFRIUkVFLk1lc2gsIG1hdGVyaWFsSW5kZXg6IG51bWJlcik6IHZvaWQge1xuICAgIGNvbnN0IGV4dGVuc2lvbiA9IHRoaXMuX2dldE1Ub29uRXh0ZW5zaW9uKG1hdGVyaWFsSW5kZXgpO1xuICAgIGlmIChleHRlbnNpb24pIHtcbiAgICAgIGNvbnN0IHJlbmRlck9yZGVyID0gdGhpcy5fcGFyc2VSZW5kZXJPcmRlcihleHRlbnNpb24pO1xuICAgICAgbWVzaC5yZW5kZXJPcmRlciA9IHJlbmRlck9yZGVyICsgdGhpcy5yZW5kZXJPcmRlck9mZnNldDtcblxuICAgICAgdGhpcy5fZ2VuZXJhdGVPdXRsaW5lKG1lc2gpO1xuXG4gICAgICB0aGlzLl9hZGRUb01hdGVyaWFsU2V0KG1lc2gpO1xuXG4gICAgICByZXR1cm47XG4gICAgfVxuICB9XG5cbiAgLyoqXG4gICAqIENoZWNrIHdoZXRoZXIgdGhlIG1hdGVyaWFsIHNob3VsZCBnZW5lcmF0ZSBvdXRsaW5lIG9yIG5vdC5cbiAgICogQHBhcmFtIHN1cmZhY2VNYXRlcmlhbCBUaGUgbWF0ZXJpYWwgdG8gY2hlY2tcbiAgICogQHJldHVybnMgVHJ1ZSBpZiB0aGUgbWF0ZXJpYWwgc2hvdWxkIGdlbmVyYXRlIG91dGxpbmVcbiAgICovXG4gIHByaXZhdGUgX3Nob3VsZEdlbmVyYXRlT3V0bGluZShzdXJmYWNlTWF0ZXJpYWw6IFRIUkVFLk1hdGVyaWFsKTogYm9vbGVhbiB7XG4gICAgLy8gd2UgbWlnaHQgcmVjZWl2ZSBNVG9vbk5vZGVNYXRlcmlhbCBhcyB3ZWxsIGFzIE1Ub29uTWF0ZXJpYWxcbiAgICAvLyBzbyB3ZSdyZSBnb25uYSBkdWNrIHR5cGUgdG8gY2hlY2sgaWYgaXQncyBjb21wYXRpYmxlIHdpdGggTVRvb24gdHlwZSBvdXRsaW5lc1xuICAgIHJldHVybiAoXG4gICAgICB0eXBlb2YgKHN1cmZhY2VNYXRlcmlhbCBhcyBhbnkpLm91dGxpbmVXaWR0aE1vZGUgPT09ICdzdHJpbmcnICYmXG4gICAgICAoc3VyZmFjZU1hdGVyaWFsIGFzIGFueSkub3V0bGluZVdpZHRoTW9kZSAhPT0gJ25vbmUnICYmXG4gICAgICB0eXBlb2YgKHN1cmZhY2VNYXRlcmlhbCBhcyBhbnkpLm91dGxpbmVXaWR0aEZhY3RvciA9PT0gJ251bWJlcicgJiZcbiAgICAgIChzdXJmYWNlTWF0ZXJpYWwgYXMgYW55KS5vdXRsaW5lV2lkdGhGYWN0b3IgPiAwLjBcbiAgICApO1xuICB9XG5cbiAgLyoqXG4gICAqIEdlbmVyYXRlIG91dGxpbmUgZm9yIHRoZSBnaXZlbiBtZXNoLCBpZiBpdCBuZWVkcy5cbiAgICpcbiAgICogQHBhcmFtIG1lc2ggVGhlIHRhcmdldCBtZXNoXG4gICAqL1xuICBwcml2YXRlIF9nZW5lcmF0ZU91dGxpbmUobWVzaDogVEhSRUUuTWVzaCk6IHZvaWQge1xuICAgIC8vIE9LLCBpdCdzIHRoZSBoYWNreSBwYXJ0LlxuICAgIC8vIFdlIGFyZSBnb2luZyB0byBkdXBsaWNhdGUgdGhlIE1Ub29uTWF0ZXJpYWwgZm9yIG91dGxpbmUgdXNlLlxuICAgIC8vIFRoZW4gd2UgYXJlIGdvaW5nIHRvIGNyZWF0ZSB0d28gZ2VvbWV0cnkgZ3JvdXBzIGFuZCByZWZlciBzYW1lIGJ1ZmZlciBidXQgZGlmZmVyZW50IG1hdGVyaWFsLlxuICAgIC8vIEl0J3MgaG93IHdlIGRyYXcgdHdvIG1hdGVyaWFscyBhdCBvbmNlIHVzaW5nIGEgc2luZ2xlIG1lc2guXG5cbiAgICAvLyBtYWtlIHN1cmUgdGhlIG1hdGVyaWFsIGlzIHNpbmdsZVxuICAgIGNvbnN0IHN1cmZhY2VNYXRlcmlhbCA9IG1lc2gubWF0ZXJpYWw7XG4gICAgaWYgKCEoc3VyZmFjZU1hdGVyaWFsIGluc3RhbmNlb2YgVEhSRUUuTWF0ZXJpYWwpKSB7XG4gICAgICByZXR1cm47XG4gICAgfVxuXG4gICAgaWYgKCF0aGlzLl9zaG91bGRHZW5lcmF0ZU91dGxpbmUoc3VyZmFjZU1hdGVyaWFsKSkge1xuICAgICAgcmV0dXJuO1xuICAgIH1cblxuICAgIC8vIG1ha2UgaXRzIG1hdGVyaWFsIGFuIGFycmF5XG4gICAgbWVzaC5tYXRlcmlhbCA9IFtzdXJmYWNlTWF0ZXJpYWxdOyAvLyBtZXNoLm1hdGVyaWFsIGlzIGd1YXJhbnRlZWQgdG8gYmUgYSBNYXRlcmlhbCBpbiBHTFRGTG9hZGVyXG5cbiAgICAvLyBkdXBsaWNhdGUgdGhlIG1hdGVyaWFsIGZvciBvdXRsaW5lIHVzZVxuICAgIGNvbnN0IG91dGxpbmVNYXRlcmlhbCA9IHN1cmZhY2VNYXRlcmlhbC5jbG9uZSgpO1xuICAgIG91dGxpbmVNYXRlcmlhbC5uYW1lICs9ICcgKE91dGxpbmUpJztcbiAgICAob3V0bGluZU1hdGVyaWFsIGFzIGFueSkuaXNPdXRsaW5lID0gdHJ1ZTtcbiAgICBvdXRsaW5lTWF0ZXJpYWwuc2lkZSA9IFRIUkVFLkJhY2tTaWRlO1xuICAgIG1lc2gubWF0ZXJpYWwucHVzaChvdXRsaW5lTWF0ZXJpYWwpO1xuXG4gICAgLy8gbWFrZSB0d28gZ2VvbWV0cnkgZ3JvdXBzIG91dCBvZiBhIHNhbWUgYnVmZmVyXG4gICAgY29uc3QgZ2VvbWV0cnkgPSBtZXNoLmdlb21ldHJ5OyAvLyBtZXNoLmdlb21ldHJ5IGlzIGd1YXJhbnRlZWQgdG8gYmUgYSBCdWZmZXJHZW9tZXRyeSBpbiBHTFRGTG9hZGVyXG4gICAgY29uc3QgcHJpbWl0aXZlVmVydGljZXMgPSBnZW9tZXRyeS5pbmRleCA/IGdlb21ldHJ5LmluZGV4LmNvdW50IDogZ2VvbWV0cnkuYXR0cmlidXRlcy5wb3NpdGlvbi5jb3VudCAvIDM7XG4gICAgZ2VvbWV0cnkuYWRkR3JvdXAoMCwgcHJpbWl0aXZlVmVydGljZXMsIDApO1xuICAgIGdlb21ldHJ5LmFkZEdyb3VwKDAsIHByaW1pdGl2ZVZlcnRpY2VzLCAxKTtcbiAgfVxuXG4gIHByaXZhdGUgX2FkZFRvTWF0ZXJpYWxTZXQobWVzaDogVEhSRUUuTWVzaCk6IHZvaWQge1xuICAgIGNvbnN0IG1hdGVyaWFsT3JNYXRlcmlhbHMgPSBtZXNoLm1hdGVyaWFsO1xuICAgIGNvbnN0IG1hdGVyaWFsU2V0ID0gbmV3IFNldDxUSFJFRS5NYXRlcmlhbD4oKTtcblxuICAgIGlmIChBcnJheS5pc0FycmF5KG1hdGVyaWFsT3JNYXRlcmlhbHMpKSB7XG4gICAgICBtYXRlcmlhbE9yTWF0ZXJpYWxzLmZvckVhY2goKG1hdGVyaWFsKSA9PiBtYXRlcmlhbFNldC5hZGQobWF0ZXJpYWwpKTtcbiAgICB9IGVsc2Uge1xuICAgICAgbWF0ZXJpYWxTZXQuYWRkKG1hdGVyaWFsT3JNYXRlcmlhbHMpO1xuICAgIH1cblxuICAgIGZvciAoY29uc3QgbWF0ZXJpYWwgb2YgbWF0ZXJpYWxTZXQpIHtcbiAgICAgIHRoaXMuX21Ub29uTWF0ZXJpYWxTZXQuYWRkKG1hdGVyaWFsKTtcbiAgICB9XG4gIH1cblxuICBwcml2YXRlIF9wYXJzZVJlbmRlck9yZGVyKGV4dGVuc2lvbjogVjFNVG9vblNjaGVtYS5WUk1DTWF0ZXJpYWxzTVRvb24pOiBudW1iZXIge1xuICAgIC8vIHRyYW5zcGFyZW50V2l0aFpXcml0ZSByYW5nZXMgZnJvbSAwIHRvICs5XG4gICAgLy8gbWVyZSB0cmFuc3BhcmVudCByYW5nZXMgZnJvbSAtOSB0byAwXG4gICAgY29uc3QgZW5hYmxlZFpXcml0ZSA9IGV4dGVuc2lvbi50cmFuc3BhcmVudFdpdGhaV3JpdGU7XG4gICAgcmV0dXJuIChlbmFibGVkWldyaXRlID8gMCA6IDE5KSArIChleHRlbnNpb24ucmVuZGVyUXVldWVPZmZzZXROdW1iZXIgPz8gMCk7XG4gIH1cbn1cbiIsICJpbXBvcnQgKiBhcyBUSFJFRSBmcm9tICd0aHJlZSc7XG5pbXBvcnQgeyBHTFRGUGFyc2VyIH0gZnJvbSAndGhyZWUvZXhhbXBsZXMvanNtL2xvYWRlcnMvR0xURkxvYWRlci5qcyc7XG5pbXBvcnQgeyBNVG9vbk1hdGVyaWFsUGFyYW1ldGVycyB9IGZyb20gJy4vTVRvb25NYXRlcmlhbFBhcmFtZXRlcnMnO1xuaW1wb3J0IHsgc2V0VGV4dHVyZUNvbG9yU3BhY2UgfSBmcm9tICcuL3V0aWxzL3NldFRleHR1cmVDb2xvclNwYWNlJztcblxuLyoqXG4gKiBNYXRlcmlhbFBhcmFtZXRlcnMgaGF0ZXMgYHVuZGVmaW5lZGAuIFRoaXMgaGVscGVyIGF1dG9tYXRpY2FsbHkgcmVqZWN0cyBhc3NpZ24gb2YgdGhlc2UgYHVuZGVmaW5lZGAuXG4gKiBJdCBhbHNvIGhhbmRsZXMgYXN5bmNocm9ub3VzIHByb2Nlc3Mgb2YgdGV4dHVyZXMuXG4gKiBNYWtlIHN1cmUgYXdhaXQgZm9yIHtAbGluayBHTFRGTVRvb25NYXRlcmlhbFBhcmFtc0Fzc2lnbkhlbHBlci5wZW5kaW5nfS5cbiAqL1xuZXhwb3J0IGNsYXNzIEdMVEZNVG9vbk1hdGVyaWFsUGFyYW1zQXNzaWduSGVscGVyIHtcbiAgcHJpdmF0ZSByZWFkb25seSBfcGFyc2VyOiBHTFRGUGFyc2VyO1xuICBwcml2YXRlIF9tYXRlcmlhbFBhcmFtczogTVRvb25NYXRlcmlhbFBhcmFtZXRlcnM7XG4gIHByaXZhdGUgX3BlbmRpbmdzOiBQcm9taXNlPGFueT5bXTtcblxuICBwdWJsaWMgZ2V0IHBlbmRpbmcoKTogUHJvbWlzZTx1bmtub3duPiB7XG4gICAgcmV0dXJuIFByb21pc2UuYWxsKHRoaXMuX3BlbmRpbmdzKTtcbiAgfVxuXG4gIHB1YmxpYyBjb25zdHJ1Y3RvcihwYXJzZXI6IEdMVEZQYXJzZXIsIG1hdGVyaWFsUGFyYW1zOiBNVG9vbk1hdGVyaWFsUGFyYW1ldGVycykge1xuICAgIHRoaXMuX3BhcnNlciA9IHBhcnNlcjtcbiAgICB0aGlzLl9tYXRlcmlhbFBhcmFtcyA9IG1hdGVyaWFsUGFyYW1zO1xuICAgIHRoaXMuX3BlbmRpbmdzID0gW107XG4gIH1cblxuICBwdWJsaWMgYXNzaWduUHJpbWl0aXZlPFQgZXh0ZW5kcyBrZXlvZiBNVG9vbk1hdGVyaWFsUGFyYW1ldGVycz4oa2V5OiBULCB2YWx1ZTogTVRvb25NYXRlcmlhbFBhcmFtZXRlcnNbVF0pOiB2b2lkIHtcbiAgICBpZiAodmFsdWUgIT0gbnVsbCkge1xuICAgICAgdGhpcy5fbWF0ZXJpYWxQYXJhbXNba2V5XSA9IHZhbHVlO1xuICAgIH1cbiAgfVxuXG4gIHB1YmxpYyBhc3NpZ25Db2xvcjxUIGV4dGVuZHMga2V5b2YgTVRvb25NYXRlcmlhbFBhcmFtZXRlcnM+KFxuICAgIGtleTogVCxcbiAgICB2YWx1ZTogbnVtYmVyW10gfCB1bmRlZmluZWQsXG4gICAgY29udmVydFNSR0JUb0xpbmVhcj86IGJvb2xlYW4sXG4gICk6IHZvaWQge1xuICAgIGlmICh2YWx1ZSAhPSBudWxsKSB7XG4gICAgICB0aGlzLl9tYXRlcmlhbFBhcmFtc1trZXldID0gbmV3IFRIUkVFLkNvbG9yKCkuZnJvbUFycmF5KHZhbHVlKTtcblxuICAgICAgaWYgKGNvbnZlcnRTUkdCVG9MaW5lYXIpIHtcbiAgICAgICAgdGhpcy5fbWF0ZXJpYWxQYXJhbXNba2V5XS5jb252ZXJ0U1JHQlRvTGluZWFyKCk7XG4gICAgICB9XG4gICAgfVxuICB9XG5cbiAgcHVibGljIGFzeW5jIGFzc2lnblRleHR1cmU8VCBleHRlbmRzIGtleW9mIE1Ub29uTWF0ZXJpYWxQYXJhbWV0ZXJzPihcbiAgICBrZXk6IFQsXG4gICAgdGV4dHVyZTogeyBpbmRleDogbnVtYmVyIH0gfCB1bmRlZmluZWQsXG4gICAgaXNDb2xvclRleHR1cmU6IGJvb2xlYW4sXG4gICk6IFByb21pc2U8dm9pZD4ge1xuICAgIGNvbnN0IHByb21pc2UgPSAoYXN5bmMgKCkgPT4ge1xuICAgICAgaWYgKHRleHR1cmUgIT0gbnVsbCkge1xuICAgICAgICBhd2FpdCB0aGlzLl9wYXJzZXIuYXNzaWduVGV4dHVyZSh0aGlzLl9tYXRlcmlhbFBhcmFtcywga2V5LCB0ZXh0dXJlKTtcblxuICAgICAgICBpZiAoaXNDb2xvclRleHR1cmUpIHtcbiAgICAgICAgICBzZXRUZXh0dXJlQ29sb3JTcGFjZSh0aGlzLl9tYXRlcmlhbFBhcmFtc1trZXldLCAnc3JnYicpO1xuICAgICAgICB9XG4gICAgICB9XG4gICAgfSkoKTtcblxuICAgIHRoaXMuX3BlbmRpbmdzLnB1c2gocHJvbWlzZSk7XG5cbiAgICByZXR1cm4gcHJvbWlzZTtcbiAgfVxuXG4gIHB1YmxpYyBhc3luYyBhc3NpZ25UZXh0dXJlQnlJbmRleDxUIGV4dGVuZHMga2V5b2YgTVRvb25NYXRlcmlhbFBhcmFtZXRlcnM+KFxuICAgIGtleTogVCxcbiAgICB0ZXh0dXJlSW5kZXg6IG51bWJlciB8IHVuZGVmaW5lZCxcbiAgICBpc0NvbG9yVGV4dHVyZTogYm9vbGVhbixcbiAgKTogUHJvbWlzZTx2b2lkPiB7XG4gICAgcmV0dXJuIHRoaXMuYXNzaWduVGV4dHVyZShrZXksIHRleHR1cmVJbmRleCAhPSBudWxsID8geyBpbmRleDogdGV4dHVyZUluZGV4IH0gOiB1bmRlZmluZWQsIGlzQ29sb3JUZXh0dXJlKTtcbiAgfVxufVxuIiwgImltcG9ydCAqIGFzIFRIUkVFIGZyb20gJ3RocmVlJztcblxuY29uc3QgY29sb3JTcGFjZUVuY29kaW5nTWFwOiBSZWNvcmQ8JycgfCAnc3JnYicsIGFueT4gPSB7XG4gIC8vIGVzbGludC1kaXNhYmxlLW5leHQtbGluZSBAdHlwZXNjcmlwdC1lc2xpbnQvbmFtaW5nLWNvbnZlbnRpb25cbiAgJyc6IDMwMDAsXG4gIHNyZ2I6IDMwMDEsXG59O1xuXG4vKipcbiAqIEEgY29tcGF0IGZ1bmN0aW9uIHRvIHNldCB0ZXh0dXJlIGNvbG9yIHNwYWNlLlxuICpcbiAqIENPTVBBVDogcHJlLXIxNTJcbiAqIFN0YXJ0aW5nIGZyb20gVGhyZWUuanMgcjE1MiwgYHRleHR1cmUuZW5jb2RpbmdgIGlzIHJlbmFtZWQgdG8gYHRleHR1cmUuY29sb3JTcGFjZWAuXG4gKiBUaGlzIGZ1bmN0aW9uIHdpbGwgaGFuZGxlIHRoZSBjb21hcHQuXG4gKlxuICogQHBhcmFtIHRleHR1cmUgVGhlIHRleHR1cmUgeW91IHdhbnQgdG8gc2V0IHRoZSBjb2xvciBzcGFjZSB0b1xuICogQHBhcmFtIGNvbG9yU3BhY2UgVGhlIGNvbG9yIHNwYWNlIHlvdSB3YW50IHRvIHNldCB0byB0aGUgdGV4dHVyZVxuICovXG5leHBvcnQgZnVuY3Rpb24gc2V0VGV4dHVyZUNvbG9yU3BhY2UodGV4dHVyZTogVEhSRUUuVGV4dHVyZSwgY29sb3JTcGFjZTogJycgfCAnc3JnYicpOiB2b2lkIHtcbiAgaWYgKHBhcnNlSW50KFRIUkVFLlJFVklTSU9OLCAxMCkgPj0gMTUyKSB7XG4gICAgdGV4dHVyZS5jb2xvclNwYWNlID0gY29sb3JTcGFjZTtcbiAgfSBlbHNlIHtcbiAgICAodGV4dHVyZSBhcyBhbnkpLmVuY29kaW5nID0gY29sb3JTcGFjZUVuY29kaW5nTWFwW2NvbG9yU3BhY2VdO1xuICB9XG59XG4iLCAiLyogdHNsaW50OmRpc2FibGU6bWVtYmVyLW9yZGVyaW5nICovXG5cbmltcG9ydCAqIGFzIFRIUkVFIGZyb20gJ3RocmVlJztcbmltcG9ydCB2ZXJ0ZXhTaGFkZXIgZnJvbSAnLi9zaGFkZXJzL210b29uLnZlcnQnO1xuaW1wb3J0IGZyYWdtZW50U2hhZGVyIGZyb20gJy4vc2hhZGVycy9tdG9vbi5mcmFnJztcbmltcG9ydCB7IE1Ub29uTWF0ZXJpYWxEZWJ1Z01vZGUgfSBmcm9tICcuL01Ub29uTWF0ZXJpYWxEZWJ1Z01vZGUnO1xuaW1wb3J0IHsgTVRvb25NYXRlcmlhbE91dGxpbmVXaWR0aE1vZGUgfSBmcm9tICcuL01Ub29uTWF0ZXJpYWxPdXRsaW5lV2lkdGhNb2RlJztcbmltcG9ydCB0eXBlIHsgTVRvb25NYXRlcmlhbFBhcmFtZXRlcnMgfSBmcm9tICcuL01Ub29uTWF0ZXJpYWxQYXJhbWV0ZXJzJztcbmltcG9ydCB7IGdldFRleHR1cmVDb2xvclNwYWNlIH0gZnJvbSAnLi91dGlscy9nZXRUZXh0dXJlQ29sb3JTcGFjZSc7XG5cbi8qKlxuICogTVRvb24gaXMgYSBtYXRlcmlhbCBzcGVjaWZpY2F0aW9uIHRoYXQgaGFzIHZhcmlvdXMgZmVhdHVyZXMuXG4gKiBUaGUgc3BlYyBhbmQgaW1wbGVtZW50YXRpb24gYXJlIG9yaWdpbmFsbHkgZm91bmRlZCBmb3IgVW5pdHkgZW5naW5lIGFuZCB0aGlzIGlzIGEgcG9ydCBvZiB0aGUgbWF0ZXJpYWwuXG4gKlxuICogU2VlOiBodHRwczovL2dpdGh1Yi5jb20vU2FudGFyaC9NVG9vblxuICovXG5leHBvcnQgY2xhc3MgTVRvb25NYXRlcmlhbCBleHRlbmRzIFRIUkVFLlNoYWRlck1hdGVyaWFsIHtcbiAgcHVibGljIHVuaWZvcm1zOiB7XG4gICAgbGl0RmFjdG9yOiBUSFJFRS5JVW5pZm9ybTxUSFJFRS5Db2xvcj47XG4gICAgYWxwaGFUZXN0OiBUSFJFRS5JVW5pZm9ybTxudW1iZXI+O1xuICAgIG9wYWNpdHk6IFRIUkVFLklVbmlmb3JtPG51bWJlcj47XG4gICAgbWFwOiBUSFJFRS5JVW5pZm9ybTxUSFJFRS5UZXh0dXJlIHwgbnVsbD47XG4gICAgbWFwVXZUcmFuc2Zvcm06IFRIUkVFLklVbmlmb3JtPFRIUkVFLk1hdHJpeDM+O1xuICAgIG5vcm1hbE1hcDogVEhSRUUuSVVuaWZvcm08VEhSRUUuVGV4dHVyZSB8IG51bGw+O1xuICAgIG5vcm1hbE1hcFV2VHJhbnNmb3JtOiBUSFJFRS5JVW5pZm9ybTxUSFJFRS5NYXRyaXgzPjtcbiAgICBub3JtYWxTY2FsZTogVEhSRUUuSVVuaWZvcm08VEhSRUUuVmVjdG9yMj47XG4gICAgZW1pc3NpdmU6IFRIUkVFLklVbmlmb3JtPFRIUkVFLkNvbG9yPjtcbiAgICBlbWlzc2l2ZUludGVuc2l0eTogVEhSRUUuSVVuaWZvcm08bnVtYmVyPjtcbiAgICBlbWlzc2l2ZU1hcDogVEhSRUUuSVVuaWZvcm08VEhSRUUuVGV4dHVyZSB8IG51bGw+O1xuICAgIGVtaXNzaXZlTWFwVXZUcmFuc2Zvcm06IFRIUkVFLklVbmlmb3JtPFRIUkVFLk1hdHJpeDM+O1xuICAgIHNoYWRlQ29sb3JGYWN0b3I6IFRIUkVFLklVbmlmb3JtPFRIUkVFLkNvbG9yPjtcbiAgICBzaGFkZU11bHRpcGx5VGV4dHVyZTogVEhSRUUuSVVuaWZvcm08VEhSRUUuVGV4dHVyZSB8IG51bGw+O1xuICAgIHNoYWRlTXVsdGlwbHlUZXh0dXJlVXZUcmFuc2Zvcm06IFRIUkVFLklVbmlmb3JtPFRIUkVFLk1hdHJpeDM+O1xuICAgIHNoYWRpbmdTaGlmdEZhY3RvcjogVEhSRUUuSVVuaWZvcm08bnVtYmVyPjtcbiAgICBzaGFkaW5nU2hpZnRUZXh0dXJlOiBUSFJFRS5JVW5pZm9ybTxUSFJFRS5UZXh0dXJlIHwgbnVsbD47XG4gICAgc2hhZGluZ1NoaWZ0VGV4dHVyZVV2VHJhbnNmb3JtOiBUSFJFRS5JVW5pZm9ybTxUSFJFRS5NYXRyaXgzPjtcbiAgICBzaGFkaW5nU2hpZnRUZXh0dXJlU2NhbGU6IFRIUkVFLklVbmlmb3JtPG51bWJlcj47XG4gICAgc2hhZGluZ1Rvb255RmFjdG9yOiBUSFJFRS5JVW5pZm9ybTxudW1iZXI+O1xuICAgIGdpRXF1YWxpemF0aW9uRmFjdG9yOiBUSFJFRS5JVW5pZm9ybTxudW1iZXI+O1xuICAgIG1hdGNhcEZhY3RvcjogVEhSRUUuSVVuaWZvcm08VEhSRUUuQ29sb3I+O1xuICAgIG1hdGNhcFRleHR1cmU6IFRIUkVFLklVbmlmb3JtPFRIUkVFLlRleHR1cmUgfCBudWxsPjtcbiAgICBtYXRjYXBUZXh0dXJlVXZUcmFuc2Zvcm06IFRIUkVFLklVbmlmb3JtPFRIUkVFLk1hdHJpeDM+O1xuICAgIHBhcmFtZXRyaWNSaW1Db2xvckZhY3RvcjogVEhSRUUuSVVuaWZvcm08VEhSRUUuQ29sb3I+O1xuICAgIHJpbU11bHRpcGx5VGV4dHVyZTogVEhSRUUuSVVuaWZvcm08VEhSRUUuVGV4dHVyZSB8IG51bGw+O1xuICAgIHJpbU11bHRpcGx5VGV4dHVyZVV2VHJhbnNmb3JtOiBUSFJFRS5JVW5pZm9ybTxUSFJFRS5NYXRyaXgzPjtcbiAgICByaW1MaWdodGluZ01peEZhY3RvcjogVEhSRUUuSVVuaWZvcm08bnVtYmVyPjtcbiAgICBwYXJhbWV0cmljUmltRnJlc25lbFBvd2VyRmFjdG9yOiBUSFJFRS5JVW5pZm9ybTxudW1iZXI+O1xuICAgIHBhcmFtZXRyaWNSaW1MaWZ0RmFjdG9yOiBUSFJFRS5JVW5pZm9ybTxudW1iZXI+O1xuICAgIG91dGxpbmVXaWR0aE11bHRpcGx5VGV4dHVyZTogVEhSRUUuSVVuaWZvcm08VEhSRUUuVGV4dHVyZSB8IG51bGw+O1xuICAgIG91dGxpbmVXaWR0aE11bHRpcGx5VGV4dHVyZVV2VHJhbnNmb3JtOiBUSFJFRS5JVW5pZm9ybTxUSFJFRS5NYXRyaXgzPjtcbiAgICBvdXRsaW5lV2lkdGhGYWN0b3I6IFRIUkVFLklVbmlmb3JtPG51bWJlcj47XG4gICAgb3V0bGluZUNvbG9yRmFjdG9yOiBUSFJFRS5JVW5pZm9ybTxUSFJFRS5Db2xvcj47XG4gICAgb3V0bGluZUxpZ2h0aW5nTWl4RmFjdG9yOiBUSFJFRS5JVW5pZm9ybTxudW1iZXI+O1xuICAgIHV2QW5pbWF0aW9uTWFza1RleHR1cmU6IFRIUkVFLklVbmlmb3JtPFRIUkVFLlRleHR1cmUgfCBudWxsPjtcbiAgICB1dkFuaW1hdGlvbk1hc2tUZXh0dXJlVXZUcmFuc2Zvcm06IFRIUkVFLklVbmlmb3JtPFRIUkVFLk1hdHJpeDM+O1xuICAgIHV2QW5pbWF0aW9uU2Nyb2xsWE9mZnNldDogVEhSRUUuSVVuaWZvcm08bnVtYmVyPjtcbiAgICB1dkFuaW1hdGlvblNjcm9sbFlPZmZzZXQ6IFRIUkVFLklVbmlmb3JtPG51bWJlcj47XG4gICAgdXZBbmltYXRpb25Sb3RhdGlvblBoYXNlOiBUSFJFRS5JVW5pZm9ybTxudW1iZXI+O1xuICB9O1xuXG4gIHB1YmxpYyBnZXQgY29sb3IoKTogVEhSRUUuQ29sb3Ige1xuICAgIHJldHVybiB0aGlzLnVuaWZvcm1zLmxpdEZhY3Rvci52YWx1ZTtcbiAgfVxuICBwdWJsaWMgc2V0IGNvbG9yKHZhbHVlOiBUSFJFRS5Db2xvcikge1xuICAgIHRoaXMudW5pZm9ybXMubGl0RmFjdG9yLnZhbHVlID0gdmFsdWU7XG4gIH1cblxuICBwdWJsaWMgZ2V0IG1hcCgpOiBUSFJFRS5UZXh0dXJlIHwgbnVsbCB7XG4gICAgcmV0dXJuIHRoaXMudW5pZm9ybXMubWFwLnZhbHVlO1xuICB9XG4gIHB1YmxpYyBzZXQgbWFwKHZhbHVlOiBUSFJFRS5UZXh0dXJlIHwgbnVsbCkge1xuICAgIHRoaXMudW5pZm9ybXMubWFwLnZhbHVlID0gdmFsdWU7XG4gIH1cblxuICBwdWJsaWMgZ2V0IG5vcm1hbE1hcCgpOiBUSFJFRS5UZXh0dXJlIHwgbnVsbCB7XG4gICAgcmV0dXJuIHRoaXMudW5pZm9ybXMubm9ybWFsTWFwLnZhbHVlO1xuICB9XG4gIHB1YmxpYyBzZXQgbm9ybWFsTWFwKHZhbHVlOiBUSFJFRS5UZXh0dXJlIHwgbnVsbCkge1xuICAgIHRoaXMudW5pZm9ybXMubm9ybWFsTWFwLnZhbHVlID0gdmFsdWU7XG4gIH1cblxuICBwdWJsaWMgZ2V0IG5vcm1hbFNjYWxlKCk6IFRIUkVFLlZlY3RvcjIge1xuICAgIHJldHVybiB0aGlzLnVuaWZvcm1zLm5vcm1hbFNjYWxlLnZhbHVlO1xuICB9XG4gIHB1YmxpYyBzZXQgbm9ybWFsU2NhbGUodmFsdWU6IFRIUkVFLlZlY3RvcjIpIHtcbiAgICB0aGlzLnVuaWZvcm1zLm5vcm1hbFNjYWxlLnZhbHVlID0gdmFsdWU7XG4gIH1cblxuICBwdWJsaWMgZ2V0IGVtaXNzaXZlKCk6IFRIUkVFLkNvbG9yIHtcbiAgICByZXR1cm4gdGhpcy51bmlmb3Jtcy5lbWlzc2l2ZS52YWx1ZTtcbiAgfVxuICBwdWJsaWMgc2V0IGVtaXNzaXZlKHZhbHVlOiBUSFJFRS5Db2xvcikge1xuICAgIHRoaXMudW5pZm9ybXMuZW1pc3NpdmUudmFsdWUgPSB2YWx1ZTtcbiAgfVxuXG4gIHB1YmxpYyBnZXQgZW1pc3NpdmVJbnRlbnNpdHkoKTogbnVtYmVyIHtcbiAgICByZXR1cm4gdGhpcy51bmlmb3Jtcy5lbWlzc2l2ZUludGVuc2l0eS52YWx1ZTtcbiAgfVxuICBwdWJsaWMgc2V0IGVtaXNzaXZlSW50ZW5zaXR5KHZhbHVlOiBudW1iZXIpIHtcbiAgICB0aGlzLnVuaWZvcm1zLmVtaXNzaXZlSW50ZW5zaXR5LnZhbHVlID0gdmFsdWU7XG4gIH1cblxuICBwdWJsaWMgZ2V0IGVtaXNzaXZlTWFwKCk6IFRIUkVFLlRleHR1cmUgfCBudWxsIHtcbiAgICByZXR1cm4gdGhpcy51bmlmb3Jtcy5lbWlzc2l2ZU1hcC52YWx1ZTtcbiAgfVxuICBwdWJsaWMgc2V0IGVtaXNzaXZlTWFwKHZhbHVlOiBUSFJFRS5UZXh0dXJlIHwgbnVsbCkge1xuICAgIHRoaXMudW5pZm9ybXMuZW1pc3NpdmVNYXAudmFsdWUgPSB2YWx1ZTtcbiAgfVxuXG4gIHB1YmxpYyBnZXQgc2hhZGVDb2xvckZhY3RvcigpOiBUSFJFRS5Db2xvciB7XG4gICAgcmV0dXJuIHRoaXMudW5pZm9ybXMuc2hhZGVDb2xvckZhY3Rvci52YWx1ZTtcbiAgfVxuICBwdWJsaWMgc2V0IHNoYWRlQ29sb3JGYWN0b3IodmFsdWU6IFRIUkVFLkNvbG9yKSB7XG4gICAgdGhpcy51bmlmb3Jtcy5zaGFkZUNvbG9yRmFjdG9yLnZhbHVlID0gdmFsdWU7XG4gIH1cblxuICBwdWJsaWMgZ2V0IHNoYWRlTXVsdGlwbHlUZXh0dXJlKCk6IFRIUkVFLlRleHR1cmUgfCBudWxsIHtcbiAgICByZXR1cm4gdGhpcy51bmlmb3Jtcy5zaGFkZU11bHRpcGx5VGV4dHVyZS52YWx1ZTtcbiAgfVxuICBwdWJsaWMgc2V0IHNoYWRlTXVsdGlwbHlUZXh0dXJlKHZhbHVlOiBUSFJFRS5UZXh0dXJlIHwgbnVsbCkge1xuICAgIHRoaXMudW5pZm9ybXMuc2hhZGVNdWx0aXBseVRleHR1cmUudmFsdWUgPSB2YWx1ZTtcbiAgfVxuXG4gIHB1YmxpYyBnZXQgc2hhZGluZ1NoaWZ0RmFjdG9yKCk6IG51bWJlciB7XG4gICAgcmV0dXJuIHRoaXMudW5pZm9ybXMuc2hhZGluZ1NoaWZ0RmFjdG9yLnZhbHVlO1xuICB9XG4gIHB1YmxpYyBzZXQgc2hhZGluZ1NoaWZ0RmFjdG9yKHZhbHVlOiBudW1iZXIpIHtcbiAgICB0aGlzLnVuaWZvcm1zLnNoYWRpbmdTaGlmdEZhY3Rvci52YWx1ZSA9IHZhbHVlO1xuICB9XG5cbiAgcHVibGljIGdldCBzaGFkaW5nU2hpZnRUZXh0dXJlKCk6IFRIUkVFLlRleHR1cmUgfCBudWxsIHtcbiAgICByZXR1cm4gdGhpcy51bmlmb3Jtcy5zaGFkaW5nU2hpZnRUZXh0dXJlLnZhbHVlO1xuICB9XG4gIHB1YmxpYyBzZXQgc2hhZGluZ1NoaWZ0VGV4dHVyZSh2YWx1ZTogVEhSRUUuVGV4dHVyZSB8IG51bGwpIHtcbiAgICB0aGlzLnVuaWZvcm1zLnNoYWRpbmdTaGlmdFRleHR1cmUudmFsdWUgPSB2YWx1ZTtcbiAgfVxuXG4gIHB1YmxpYyBnZXQgc2hhZGluZ1NoaWZ0VGV4dHVyZVNjYWxlKCk6IG51bWJlciB7XG4gICAgcmV0dXJuIHRoaXMudW5pZm9ybXMuc2hhZGluZ1NoaWZ0VGV4dHVyZVNjYWxlLnZhbHVlO1xuICB9XG4gIHB1YmxpYyBzZXQgc2hhZGluZ1NoaWZ0VGV4dHVyZVNjYWxlKHZhbHVlOiBudW1iZXIpIHtcbiAgICB0aGlzLnVuaWZvcm1zLnNoYWRpbmdTaGlmdFRleHR1cmVTY2FsZS52YWx1ZSA9IHZhbHVlO1xuICB9XG5cbiAgcHVibGljIGdldCBzaGFkaW5nVG9vbnlGYWN0b3IoKTogbnVtYmVyIHtcbiAgICByZXR1cm4gdGhpcy51bmlmb3Jtcy5zaGFkaW5nVG9vbnlGYWN0b3IudmFsdWU7XG4gIH1cbiAgcHVibGljIHNldCBzaGFkaW5nVG9vbnlGYWN0b3IodmFsdWU6IG51bWJlcikge1xuICAgIHRoaXMudW5pZm9ybXMuc2hhZGluZ1Rvb255RmFjdG9yLnZhbHVlID0gdmFsdWU7XG4gIH1cblxuICBwdWJsaWMgZ2V0IGdpRXF1YWxpemF0aW9uRmFjdG9yKCk6IG51bWJlciB7XG4gICAgcmV0dXJuIHRoaXMudW5pZm9ybXMuZ2lFcXVhbGl6YXRpb25GYWN0b3IudmFsdWU7XG4gIH1cbiAgcHVibGljIHNldCBnaUVxdWFsaXphdGlvbkZhY3Rvcih2YWx1ZTogbnVtYmVyKSB7XG4gICAgdGhpcy51bmlmb3Jtcy5naUVxdWFsaXphdGlvbkZhY3Rvci52YWx1ZSA9IHZhbHVlO1xuICB9XG5cbiAgcHVibGljIGdldCBtYXRjYXBGYWN0b3IoKTogVEhSRUUuQ29sb3Ige1xuICAgIHJldHVybiB0aGlzLnVuaWZvcm1zLm1hdGNhcEZhY3Rvci52YWx1ZTtcbiAgfVxuICBwdWJsaWMgc2V0IG1hdGNhcEZhY3Rvcih2YWx1ZTogVEhSRUUuQ29sb3IpIHtcbiAgICB0aGlzLnVuaWZvcm1zLm1hdGNhcEZhY3Rvci52YWx1ZSA9IHZhbHVlO1xuICB9XG5cbiAgcHVibGljIGdldCBtYXRjYXBUZXh0dXJlKCk6IFRIUkVFLlRleHR1cmUgfCBudWxsIHtcbiAgICByZXR1cm4gdGhpcy51bmlmb3Jtcy5tYXRjYXBUZXh0dXJlLnZhbHVlO1xuICB9XG4gIHB1YmxpYyBzZXQgbWF0Y2FwVGV4dHVyZSh2YWx1ZTogVEhSRUUuVGV4dHVyZSB8IG51bGwpIHtcbiAgICB0aGlzLnVuaWZvcm1zLm1hdGNhcFRleHR1cmUudmFsdWUgPSB2YWx1ZTtcbiAgfVxuXG4gIHB1YmxpYyBnZXQgcGFyYW1ldHJpY1JpbUNvbG9yRmFjdG9yKCk6IFRIUkVFLkNvbG9yIHtcbiAgICByZXR1cm4gdGhpcy51bmlmb3Jtcy5wYXJhbWV0cmljUmltQ29sb3JGYWN0b3IudmFsdWU7XG4gIH1cbiAgcHVibGljIHNldCBwYXJhbWV0cmljUmltQ29sb3JGYWN0b3IodmFsdWU6IFRIUkVFLkNvbG9yKSB7XG4gICAgdGhpcy51bmlmb3Jtcy5wYXJhbWV0cmljUmltQ29sb3JGYWN0b3IudmFsdWUgPSB2YWx1ZTtcbiAgfVxuXG4gIHB1YmxpYyBnZXQgcmltTXVsdGlwbHlUZXh0dXJlKCk6IFRIUkVFLlRleHR1cmUgfCBudWxsIHtcbiAgICByZXR1cm4gdGhpcy51bmlmb3Jtcy5yaW1NdWx0aXBseVRleHR1cmUudmFsdWU7XG4gIH1cbiAgcHVibGljIHNldCByaW1NdWx0aXBseVRleHR1cmUodmFsdWU6IFRIUkVFLlRleHR1cmUgfCBudWxsKSB7XG4gICAgdGhpcy51bmlmb3Jtcy5yaW1NdWx0aXBseVRleHR1cmUudmFsdWUgPSB2YWx1ZTtcbiAgfVxuXG4gIHB1YmxpYyBnZXQgcmltTGlnaHRpbmdNaXhGYWN0b3IoKTogbnVtYmVyIHtcbiAgICByZXR1cm4gdGhpcy51bmlmb3Jtcy5yaW1MaWdodGluZ01peEZhY3Rvci52YWx1ZTtcbiAgfVxuICBwdWJsaWMgc2V0IHJpbUxpZ2h0aW5nTWl4RmFjdG9yKHZhbHVlOiBudW1iZXIpIHtcbiAgICB0aGlzLnVuaWZvcm1zLnJpbUxpZ2h0aW5nTWl4RmFjdG9yLnZhbHVlID0gdmFsdWU7XG4gIH1cblxuICBwdWJsaWMgZ2V0IHBhcmFtZXRyaWNSaW1GcmVzbmVsUG93ZXJGYWN0b3IoKTogbnVtYmVyIHtcbiAgICByZXR1cm4gdGhpcy51bmlmb3Jtcy5wYXJhbWV0cmljUmltRnJlc25lbFBvd2VyRmFjdG9yLnZhbHVlO1xuICB9XG4gIHB1YmxpYyBzZXQgcGFyYW1ldHJpY1JpbUZyZXNuZWxQb3dlckZhY3Rvcih2YWx1ZTogbnVtYmVyKSB7XG4gICAgdGhpcy51bmlmb3Jtcy5wYXJhbWV0cmljUmltRnJlc25lbFBvd2VyRmFjdG9yLnZhbHVlID0gdmFsdWU7XG4gIH1cblxuICBwdWJsaWMgZ2V0IHBhcmFtZXRyaWNSaW1MaWZ0RmFjdG9yKCk6IG51bWJlciB7XG4gICAgcmV0dXJuIHRoaXMudW5pZm9ybXMucGFyYW1ldHJpY1JpbUxpZnRGYWN0b3IudmFsdWU7XG4gIH1cbiAgcHVibGljIHNldCBwYXJhbWV0cmljUmltTGlmdEZhY3Rvcih2YWx1ZTogbnVtYmVyKSB7XG4gICAgdGhpcy51bmlmb3Jtcy5wYXJhbWV0cmljUmltTGlmdEZhY3Rvci52YWx1ZSA9IHZhbHVlO1xuICB9XG5cbiAgcHVibGljIGdldCBvdXRsaW5lV2lkdGhNdWx0aXBseVRleHR1cmUoKTogVEhSRUUuVGV4dHVyZSB8IG51bGwge1xuICAgIHJldHVybiB0aGlzLnVuaWZvcm1zLm91dGxpbmVXaWR0aE11bHRpcGx5VGV4dHVyZS52YWx1ZTtcbiAgfVxuICBwdWJsaWMgc2V0IG91dGxpbmVXaWR0aE11bHRpcGx5VGV4dHVyZSh2YWx1ZTogVEhSRUUuVGV4dHVyZSB8IG51bGwpIHtcbiAgICB0aGlzLnVuaWZvcm1zLm91dGxpbmVXaWR0aE11bHRpcGx5VGV4dHVyZS52YWx1ZSA9IHZhbHVlO1xuICB9XG5cbiAgcHVibGljIGdldCBvdXRsaW5lV2lkdGhGYWN0b3IoKTogbnVtYmVyIHtcbiAgICByZXR1cm4gdGhpcy51bmlmb3Jtcy5vdXRsaW5lV2lkdGhGYWN0b3IudmFsdWU7XG4gIH1cbiAgcHVibGljIHNldCBvdXRsaW5lV2lkdGhGYWN0b3IodmFsdWU6IG51bWJlcikge1xuICAgIHRoaXMudW5pZm9ybXMub3V0bGluZVdpZHRoRmFjdG9yLnZhbHVlID0gdmFsdWU7XG4gIH1cblxuICBwdWJsaWMgZ2V0IG91dGxpbmVDb2xvckZhY3RvcigpOiBUSFJFRS5Db2xvciB7XG4gICAgcmV0dXJuIHRoaXMudW5pZm9ybXMub3V0bGluZUNvbG9yRmFjdG9yLnZhbHVlO1xuICB9XG4gIHB1YmxpYyBzZXQgb3V0bGluZUNvbG9yRmFjdG9yKHZhbHVlOiBUSFJFRS5Db2xvcikge1xuICAgIHRoaXMudW5pZm9ybXMub3V0bGluZUNvbG9yRmFjdG9yLnZhbHVlID0gdmFsdWU7XG4gIH1cblxuICBwdWJsaWMgZ2V0IG91dGxpbmVMaWdodGluZ01peEZhY3RvcigpOiBudW1iZXIge1xuICAgIHJldHVybiB0aGlzLnVuaWZvcm1zLm91dGxpbmVMaWdodGluZ01peEZhY3Rvci52YWx1ZTtcbiAgfVxuICBwdWJsaWMgc2V0IG91dGxpbmVMaWdodGluZ01peEZhY3Rvcih2YWx1ZTogbnVtYmVyKSB7XG4gICAgdGhpcy51bmlmb3Jtcy5vdXRsaW5lTGlnaHRpbmdNaXhGYWN0b3IudmFsdWUgPSB2YWx1ZTtcbiAgfVxuXG4gIHB1YmxpYyBnZXQgdXZBbmltYXRpb25NYXNrVGV4dHVyZSgpOiBUSFJFRS5UZXh0dXJlIHwgbnVsbCB7XG4gICAgcmV0dXJuIHRoaXMudW5pZm9ybXMudXZBbmltYXRpb25NYXNrVGV4dHVyZS52YWx1ZTtcbiAgfVxuICBwdWJsaWMgc2V0IHV2QW5pbWF0aW9uTWFza1RleHR1cmUodmFsdWU6IFRIUkVFLlRleHR1cmUgfCBudWxsKSB7XG4gICAgdGhpcy51bmlmb3Jtcy51dkFuaW1hdGlvbk1hc2tUZXh0dXJlLnZhbHVlID0gdmFsdWU7XG4gIH1cblxuICBwdWJsaWMgZ2V0IHV2QW5pbWF0aW9uU2Nyb2xsWE9mZnNldCgpOiBudW1iZXIge1xuICAgIHJldHVybiB0aGlzLnVuaWZvcm1zLnV2QW5pbWF0aW9uU2Nyb2xsWE9mZnNldC52YWx1ZTtcbiAgfVxuICBwdWJsaWMgc2V0IHV2QW5pbWF0aW9uU2Nyb2xsWE9mZnNldCh2YWx1ZTogbnVtYmVyKSB7XG4gICAgdGhpcy51bmlmb3Jtcy51dkFuaW1hdGlvblNjcm9sbFhPZmZzZXQudmFsdWUgPSB2YWx1ZTtcbiAgfVxuXG4gIHB1YmxpYyBnZXQgdXZBbmltYXRpb25TY3JvbGxZT2Zmc2V0KCk6IG51bWJlciB7XG4gICAgcmV0dXJuIHRoaXMudW5pZm9ybXMudXZBbmltYXRpb25TY3JvbGxZT2Zmc2V0LnZhbHVlO1xuICB9XG4gIHB1YmxpYyBzZXQgdXZBbmltYXRpb25TY3JvbGxZT2Zmc2V0KHZhbHVlOiBudW1iZXIpIHtcbiAgICB0aGlzLnVuaWZvcm1zLnV2QW5pbWF0aW9uU2Nyb2xsWU9mZnNldC52YWx1ZSA9IHZhbHVlO1xuICB9XG5cbiAgcHVibGljIGdldCB1dkFuaW1hdGlvblJvdGF0aW9uUGhhc2UoKTogbnVtYmVyIHtcbiAgICByZXR1cm4gdGhpcy51bmlmb3Jtcy51dkFuaW1hdGlvblJvdGF0aW9uUGhhc2UudmFsdWU7XG4gIH1cbiAgcHVibGljIHNldCB1dkFuaW1hdGlvblJvdGF0aW9uUGhhc2UodmFsdWU6IG51bWJlcikge1xuICAgIHRoaXMudW5pZm9ybXMudXZBbmltYXRpb25Sb3RhdGlvblBoYXNlLnZhbHVlID0gdmFsdWU7XG4gIH1cblxuICBwdWJsaWMgdXZBbmltYXRpb25TY3JvbGxYU3BlZWRGYWN0b3IgPSAwLjA7XG4gIHB1YmxpYyB1dkFuaW1hdGlvblNjcm9sbFlTcGVlZEZhY3RvciA9IDAuMDtcbiAgcHVibGljIHV2QW5pbWF0aW9uUm90YXRpb25TcGVlZEZhY3RvciA9IDAuMDtcblxuICAvKipcbiAgICogV2hldGhlciB0aGUgbWF0ZXJpYWwgaXMgYWZmZWN0ZWQgYnkgZm9nLlxuICAgKiBgdHJ1ZWAgYnkgZGVmYXVsdC5cbiAgICovXG4gIHB1YmxpYyBmb2cgPSB0cnVlO1xuXG4gIC8qKlxuICAgKiBXaWxsIGJlIHJlYWQgaW4gV2ViR0xQcm9ncmFtc1xuICAgKlxuICAgKiBTZWU6IGh0dHBzOi8vZ2l0aHViLmNvbS9tcmRvb2IvdGhyZWUuanMvYmxvYi80ZjUyMzZhYzNkNmY0MWQ5MDRhYTU4NDAxYjQwNTU0ZThmYmRjYjE1L3NyYy9yZW5kZXJlcnMvd2ViZ2wvV2ViR0xQcm9ncmFtcy5qcyNMMTkwLUwxOTFcbiAgICovXG4gIHB1YmxpYyBub3JtYWxNYXBUeXBlID0gVEhSRUUuVGFuZ2VudFNwYWNlTm9ybWFsTWFwO1xuXG4gIC8qKlxuICAgKiBXaGVuIHRoaXMgaXMgYHRydWVgLCB2ZXJ0ZXggY29sb3JzIHdpbGwgYmUgaWdub3JlZC5cbiAgICogYHRydWVgIGJ5IGRlZmF1bHQuXG4gICAqL1xuICBwcml2YXRlIF9pZ25vcmVWZXJ0ZXhDb2xvciA9IHRydWU7XG5cbiAgLyoqXG4gICAqIFdoZW4gdGhpcyBpcyBgdHJ1ZWAsIHZlcnRleCBjb2xvcnMgd2lsbCBiZSBpZ25vcmVkLlxuICAgKiBgdHJ1ZWAgYnkgZGVmYXVsdC5cbiAgICovXG4gIHB1YmxpYyBnZXQgaWdub3JlVmVydGV4Q29sb3IoKTogYm9vbGVhbiB7XG4gICAgcmV0dXJuIHRoaXMuX2lnbm9yZVZlcnRleENvbG9yO1xuICB9XG4gIHB1YmxpYyBzZXQgaWdub3JlVmVydGV4Q29sb3IodmFsdWU6IGJvb2xlYW4pIHtcbiAgICB0aGlzLl9pZ25vcmVWZXJ0ZXhDb2xvciA9IHZhbHVlO1xuXG4gICAgdGhpcy5uZWVkc1VwZGF0ZSA9IHRydWU7XG4gIH1cblxuICBwcml2YXRlIF92MENvbXBhdFNoYWRlID0gZmFsc2U7XG5cbiAgLyoqXG4gICAqIFRoZXJlIGlzIGEgbGluZSBvZiB0aGUgc2hhZGVyIGNhbGxlZCBcImNvbW1lbnQgb3V0IGlmIHlvdSB3YW50IHRvIFBCUiBhYnNvbHV0ZWx5XCIgaW4gVlJNMC4wIE1Ub29uLlxuICAgKiBXaGVuIHRoaXMgaXMgdHJ1ZSwgdGhlIG1hdGVyaWFsIGVuYWJsZXMgdGhlIGxpbmUgdG8gbWFrZSBpdCBjb21wYXRpYmxlIHdpdGggdGhlIGxlZ2FjeSByZW5kZXJpbmcgb2YgVlJNLlxuICAgKiBVc3VhbGx5IG5vdCByZWNvbW1lbmRlZCB0byB0dXJuIHRoaXMgb24uXG4gICAqIGBmYWxzZWAgYnkgZGVmYXVsdC5cbiAgICovXG4gIGdldCB2MENvbXBhdFNoYWRlKCk6IGJvb2xlYW4ge1xuICAgIHJldHVybiB0aGlzLl92MENvbXBhdFNoYWRlO1xuICB9XG5cbiAgLyoqXG4gICAqIFRoZXJlIGlzIGEgbGluZSBvZiB0aGUgc2hhZGVyIGNhbGxlZCBcImNvbW1lbnQgb3V0IGlmIHlvdSB3YW50IHRvIFBCUiBhYnNvbHV0ZWx5XCIgaW4gVlJNMC4wIE1Ub29uLlxuICAgKiBXaGVuIHRoaXMgaXMgdHJ1ZSwgdGhlIG1hdGVyaWFsIGVuYWJsZXMgdGhlIGxpbmUgdG8gbWFrZSBpdCBjb21wYXRpYmxlIHdpdGggdGhlIGxlZ2FjeSByZW5kZXJpbmcgb2YgVlJNLlxuICAgKiBVc3VhbGx5IG5vdCByZWNvbW1lbmRlZCB0byB0dXJuIHRoaXMgb24uXG4gICAqIGBmYWxzZWAgYnkgZGVmYXVsdC5cbiAgICovXG4gIHNldCB2MENvbXBhdFNoYWRlKHY6IGJvb2xlYW4pIHtcbiAgICB0aGlzLl92MENvbXBhdFNoYWRlID0gdjtcblxuICAgIHRoaXMubmVlZHNVcGRhdGUgPSB0cnVlO1xuICB9XG5cbiAgcHJpdmF0ZSBfZGVidWdNb2RlOiBNVG9vbk1hdGVyaWFsRGVidWdNb2RlID0gTVRvb25NYXRlcmlhbERlYnVnTW9kZS5Ob25lO1xuXG4gIC8qKlxuICAgKiBEZWJ1ZyBtb2RlIGZvciB0aGUgbWF0ZXJpYWwuXG4gICAqIFlvdSBjYW4gdmlzdWFsaXplIHNldmVyYWwgY29tcG9uZW50cyBmb3IgZGlhZ25vc2lzIHVzaW5nIGRlYnVnIG1vZGUuXG4gICAqXG4gICAqIFNlZToge0BsaW5rIE1Ub29uTWF0ZXJpYWxEZWJ1Z01vZGV9XG4gICAqL1xuICBnZXQgZGVidWdNb2RlKCk6IE1Ub29uTWF0ZXJpYWxEZWJ1Z01vZGUge1xuICAgIHJldHVybiB0aGlzLl9kZWJ1Z01vZGU7XG4gIH1cblxuICAvKipcbiAgICogRGVidWcgbW9kZSBmb3IgdGhlIG1hdGVyaWFsLlxuICAgKiBZb3UgY2FuIHZpc3VhbGl6ZSBzZXZlcmFsIGNvbXBvbmVudHMgZm9yIGRpYWdub3NpcyB1c2luZyBkZWJ1ZyBtb2RlLlxuICAgKlxuICAgKiBTZWU6IHtAbGluayBNVG9vbk1hdGVyaWFsRGVidWdNb2RlfVxuICAgKi9cbiAgc2V0IGRlYnVnTW9kZShtOiBNVG9vbk1hdGVyaWFsRGVidWdNb2RlKSB7XG4gICAgdGhpcy5fZGVidWdNb2RlID0gbTtcblxuICAgIHRoaXMubmVlZHNVcGRhdGUgPSB0cnVlO1xuICB9XG5cbiAgcHJpdmF0ZSBfb3V0bGluZVdpZHRoTW9kZTogTVRvb25NYXRlcmlhbE91dGxpbmVXaWR0aE1vZGUgPSBNVG9vbk1hdGVyaWFsT3V0bGluZVdpZHRoTW9kZS5Ob25lO1xuXG4gIGdldCBvdXRsaW5lV2lkdGhNb2RlKCk6IE1Ub29uTWF0ZXJpYWxPdXRsaW5lV2lkdGhNb2RlIHtcbiAgICByZXR1cm4gdGhpcy5fb3V0bGluZVdpZHRoTW9kZTtcbiAgfVxuICBzZXQgb3V0bGluZVdpZHRoTW9kZShtOiBNVG9vbk1hdGVyaWFsT3V0bGluZVdpZHRoTW9kZSkge1xuICAgIHRoaXMuX291dGxpbmVXaWR0aE1vZGUgPSBtO1xuXG4gICAgdGhpcy5uZWVkc1VwZGF0ZSA9IHRydWU7XG4gIH1cblxuICBwcml2YXRlIF9pc091dGxpbmUgPSBmYWxzZTtcblxuICBnZXQgaXNPdXRsaW5lKCk6IGJvb2xlYW4ge1xuICAgIHJldHVybiB0aGlzLl9pc091dGxpbmU7XG4gIH1cbiAgc2V0IGlzT3V0bGluZShiOiBib29sZWFuKSB7XG4gICAgdGhpcy5faXNPdXRsaW5lID0gYjtcblxuICAgIHRoaXMubmVlZHNVcGRhdGUgPSB0cnVlO1xuICB9XG5cbiAgLyoqXG4gICAqIFJlYWRvbmx5IGJvb2xlYW4gdGhhdCBpbmRpY2F0ZXMgdGhpcyBpcyBhIFtbTVRvb25NYXRlcmlhbF1dLlxuICAgKi9cbiAgcHVibGljIGdldCBpc01Ub29uTWF0ZXJpYWwoKTogdHJ1ZSB7XG4gICAgcmV0dXJuIHRydWU7XG4gIH1cblxuICBjb25zdHJ1Y3RvcihwYXJhbWV0ZXJzOiBNVG9vbk1hdGVyaWFsUGFyYW1ldGVycyA9IHt9KSB7XG4gICAgc3VwZXIoeyB2ZXJ0ZXhTaGFkZXIsIGZyYWdtZW50U2hhZGVyIH0pO1xuXG4gICAgLy8gb3ZlcnJpZGUgZGVwdGhXcml0ZSB3aXRoIHRyYW5zcGFyZW50V2l0aFpXcml0ZVxuICAgIGlmIChwYXJhbWV0ZXJzLnRyYW5zcGFyZW50V2l0aFpXcml0ZSkge1xuICAgICAgcGFyYW1ldGVycy5kZXB0aFdyaXRlID0gdHJ1ZTtcbiAgICB9XG4gICAgZGVsZXRlIHBhcmFtZXRlcnMudHJhbnNwYXJlbnRXaXRoWldyaXRlO1xuXG4gICAgLy8gPT0gZW5hYmxpbmcgYnVuY2ggb2Ygc3R1ZmYgPT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09XG4gICAgcGFyYW1ldGVycy5mb2cgPSB0cnVlO1xuICAgIHBhcmFtZXRlcnMubGlnaHRzID0gdHJ1ZTtcbiAgICBwYXJhbWV0ZXJzLmNsaXBwaW5nID0gdHJ1ZTtcblxuICAgIC8vID09IHVuaWZvcm1zID09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PVxuICAgIHRoaXMudW5pZm9ybXMgPSBUSFJFRS5Vbmlmb3Jtc1V0aWxzLm1lcmdlKFtcbiAgICAgIFRIUkVFLlVuaWZvcm1zTGliLmNvbW1vbiwgLy8gbWFwXG4gICAgICBUSFJFRS5Vbmlmb3Jtc0xpYi5ub3JtYWxtYXAsIC8vIG5vcm1hbE1hcFxuICAgICAgVEhSRUUuVW5pZm9ybXNMaWIuZW1pc3NpdmVtYXAsIC8vIGVtaXNzaXZlTWFwXG4gICAgICBUSFJFRS5Vbmlmb3Jtc0xpYi5mb2csXG4gICAgICBUSFJFRS5Vbmlmb3Jtc0xpYi5saWdodHMsXG4gICAgICB7XG4gICAgICAgIGxpdEZhY3RvcjogeyB2YWx1ZTogbmV3IFRIUkVFLkNvbG9yKDEuMCwgMS4wLCAxLjApIH0sXG4gICAgICAgIG1hcFV2VHJhbnNmb3JtOiB7IHZhbHVlOiBuZXcgVEhSRUUuTWF0cml4MygpIH0sXG4gICAgICAgIGNvbG9yQWxwaGE6IHsgdmFsdWU6IDEuMCB9LFxuICAgICAgICBub3JtYWxNYXBVdlRyYW5zZm9ybTogeyB2YWx1ZTogbmV3IFRIUkVFLk1hdHJpeDMoKSB9LFxuICAgICAgICBzaGFkZUNvbG9yRmFjdG9yOiB7IHZhbHVlOiBuZXcgVEhSRUUuQ29sb3IoMC4wLCAwLjAsIDAuMCkgfSxcbiAgICAgICAgc2hhZGVNdWx0aXBseVRleHR1cmU6IHsgdmFsdWU6IG51bGwgfSxcbiAgICAgICAgc2hhZGVNdWx0aXBseVRleHR1cmVVdlRyYW5zZm9ybTogeyB2YWx1ZTogbmV3IFRIUkVFLk1hdHJpeDMoKSB9LFxuICAgICAgICBzaGFkaW5nU2hpZnRGYWN0b3I6IHsgdmFsdWU6IDAuMCB9LFxuICAgICAgICBzaGFkaW5nU2hpZnRUZXh0dXJlOiB7IHZhbHVlOiBudWxsIH0sXG4gICAgICAgIHNoYWRpbmdTaGlmdFRleHR1cmVVdlRyYW5zZm9ybTogeyB2YWx1ZTogbmV3IFRIUkVFLk1hdHJpeDMoKSB9LFxuICAgICAgICBzaGFkaW5nU2hpZnRUZXh0dXJlU2NhbGU6IHsgdmFsdWU6IDEuMCB9LFxuICAgICAgICBzaGFkaW5nVG9vbnlGYWN0b3I6IHsgdmFsdWU6IDAuOSB9LFxuICAgICAgICBnaUVxdWFsaXphdGlvbkZhY3RvcjogeyB2YWx1ZTogMC45IH0sXG4gICAgICAgIG1hdGNhcEZhY3RvcjogeyB2YWx1ZTogbmV3IFRIUkVFLkNvbG9yKDEuMCwgMS4wLCAxLjApIH0sXG4gICAgICAgIG1hdGNhcFRleHR1cmU6IHsgdmFsdWU6IG51bGwgfSxcbiAgICAgICAgbWF0Y2FwVGV4dHVyZVV2VHJhbnNmb3JtOiB7IHZhbHVlOiBuZXcgVEhSRUUuTWF0cml4MygpIH0sXG4gICAgICAgIHBhcmFtZXRyaWNSaW1Db2xvckZhY3RvcjogeyB2YWx1ZTogbmV3IFRIUkVFLkNvbG9yKDAuMCwgMC4wLCAwLjApIH0sXG4gICAgICAgIHJpbU11bHRpcGx5VGV4dHVyZTogeyB2YWx1ZTogbnVsbCB9LFxuICAgICAgICByaW1NdWx0aXBseVRleHR1cmVVdlRyYW5zZm9ybTogeyB2YWx1ZTogbmV3IFRIUkVFLk1hdHJpeDMoKSB9LFxuICAgICAgICByaW1MaWdodGluZ01peEZhY3RvcjogeyB2YWx1ZTogMS4wIH0sXG4gICAgICAgIHBhcmFtZXRyaWNSaW1GcmVzbmVsUG93ZXJGYWN0b3I6IHsgdmFsdWU6IDUuMCB9LFxuICAgICAgICBwYXJhbWV0cmljUmltTGlmdEZhY3RvcjogeyB2YWx1ZTogMC4wIH0sXG4gICAgICAgIGVtaXNzaXZlOiB7IHZhbHVlOiBuZXcgVEhSRUUuQ29sb3IoMC4wLCAwLjAsIDAuMCkgfSxcbiAgICAgICAgZW1pc3NpdmVJbnRlbnNpdHk6IHsgdmFsdWU6IDEuMCB9LFxuICAgICAgICBlbWlzc2l2ZU1hcFV2VHJhbnNmb3JtOiB7IHZhbHVlOiBuZXcgVEhSRUUuTWF0cml4MygpIH0sXG4gICAgICAgIG91dGxpbmVXaWR0aE11bHRpcGx5VGV4dHVyZTogeyB2YWx1ZTogbnVsbCB9LFxuICAgICAgICBvdXRsaW5lV2lkdGhNdWx0aXBseVRleHR1cmVVdlRyYW5zZm9ybTogeyB2YWx1ZTogbmV3IFRIUkVFLk1hdHJpeDMoKSB9LFxuICAgICAgICBvdXRsaW5lV2lkdGhGYWN0b3I6IHsgdmFsdWU6IDAuMCB9LFxuICAgICAgICBvdXRsaW5lQ29sb3JGYWN0b3I6IHsgdmFsdWU6IG5ldyBUSFJFRS5Db2xvcigwLjAsIDAuMCwgMC4wKSB9LFxuICAgICAgICBvdXRsaW5lTGlnaHRpbmdNaXhGYWN0b3I6IHsgdmFsdWU6IDEuMCB9LFxuICAgICAgICB1dkFuaW1hdGlvbk1hc2tUZXh0dXJlOiB7IHZhbHVlOiBudWxsIH0sXG4gICAgICAgIHV2QW5pbWF0aW9uTWFza1RleHR1cmVVdlRyYW5zZm9ybTogeyB2YWx1ZTogbmV3IFRIUkVFLk1hdHJpeDMoKSB9LFxuICAgICAgICB1dkFuaW1hdGlvblNjcm9sbFhPZmZzZXQ6IHsgdmFsdWU6IDAuMCB9LFxuICAgICAgICB1dkFuaW1hdGlvblNjcm9sbFlPZmZzZXQ6IHsgdmFsdWU6IDAuMCB9LFxuICAgICAgICB1dkFuaW1hdGlvblJvdGF0aW9uUGhhc2U6IHsgdmFsdWU6IDAuMCB9LFxuICAgICAgfSxcbiAgICAgIHBhcmFtZXRlcnMudW5pZm9ybXMgPz8ge30sXG4gICAgXSkgYXMgdHlwZW9mIE1Ub29uTWF0ZXJpYWwucHJvdG90eXBlLnVuaWZvcm1zO1xuXG4gICAgLy8gPT0gZmluYWxseSBjb21waWxlIHRoZSBzaGFkZXIgcHJvZ3JhbSA9PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09XG4gICAgdGhpcy5zZXRWYWx1ZXMocGFyYW1ldGVycyk7XG5cbiAgICAvLyA9PSB1cGxvYWQgdW5pZm9ybXMgdGhhdCBuZWVkIHRvIHVwbG9hZCA9PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT1cbiAgICB0aGlzLl91cGxvYWRVbmlmb3Jtc1dvcmthcm91bmQoKTtcblxuICAgIC8vID09IHVwZGF0ZSBzaGFkZXIgc3R1ZmYgPT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PVxuICAgIHRoaXMuY3VzdG9tUHJvZ3JhbUNhY2hlS2V5ID0gKCkgPT5cbiAgICAgIFtcbiAgICAgICAgLi4uT2JqZWN0LmVudHJpZXModGhpcy5fZ2VuZXJhdGVEZWZpbmVzKCkpLm1hcCgoW3Rva2VuLCBtYWNyb10pID0+IGAke3Rva2VufToke21hY3JvfWApLFxuICAgICAgICB0aGlzLm1hdGNhcFRleHR1cmUgPyBgbWF0Y2FwVGV4dHVyZUNvbG9yU3BhY2U6JHtnZXRUZXh0dXJlQ29sb3JTcGFjZSh0aGlzLm1hdGNhcFRleHR1cmUpfWAgOiAnJyxcbiAgICAgICAgdGhpcy5zaGFkZU11bHRpcGx5VGV4dHVyZVxuICAgICAgICAgID8gYHNoYWRlTXVsdGlwbHlUZXh0dXJlQ29sb3JTcGFjZToke2dldFRleHR1cmVDb2xvclNwYWNlKHRoaXMuc2hhZGVNdWx0aXBseVRleHR1cmUpfWBcbiAgICAgICAgICA6ICcnLFxuICAgICAgICB0aGlzLnJpbU11bHRpcGx5VGV4dHVyZSA/IGByaW1NdWx0aXBseVRleHR1cmVDb2xvclNwYWNlOiR7Z2V0VGV4dHVyZUNvbG9yU3BhY2UodGhpcy5yaW1NdWx0aXBseVRleHR1cmUpfWAgOiAnJyxcbiAgICAgIF0uam9pbignLCcpO1xuXG4gICAgdGhpcy5vbkJlZm9yZUNvbXBpbGUgPSAoc2hhZGVyKSA9PiB7XG4gICAgICBjb25zdCB0aHJlZVJldmlzaW9uID0gcGFyc2VJbnQoVEhSRUUuUkVWSVNJT04sIDEwKTtcblxuICAgICAgY29uc3QgZGVmaW5lcyA9XG4gICAgICAgIE9iamVjdC5lbnRyaWVzKHsgLi4udGhpcy5fZ2VuZXJhdGVEZWZpbmVzKCksIC4uLnRoaXMuZGVmaW5lcyB9KVxuICAgICAgICAgIC5maWx0ZXIoKFt0b2tlbiwgbWFjcm9dKSA9PiAhIW1hY3JvKVxuICAgICAgICAgIC5tYXAoKFt0b2tlbiwgbWFjcm9dKSA9PiBgI2RlZmluZSAke3Rva2VufSAke21hY3JvfWApXG4gICAgICAgICAgLmpvaW4oJ1xcbicpICsgJ1xcbic7XG5cbiAgICAgIC8vIC0tIGdlbmVyYXRlIHNoYWRlciBjb2RlIC0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS1cbiAgICAgIHNoYWRlci52ZXJ0ZXhTaGFkZXIgPSBkZWZpbmVzICsgc2hhZGVyLnZlcnRleFNoYWRlcjtcbiAgICAgIHNoYWRlci5mcmFnbWVudFNoYWRlciA9IGRlZmluZXMgKyBzaGFkZXIuZnJhZ21lbnRTaGFkZXI7XG5cbiAgICAgIC8vIC0tIGNvbXBhdCAtLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS1cblxuICAgICAgLy8gQ09NUEFUOiBwcmUtcjE1NFxuICAgICAgLy8gVGhyZWUuanMgcjE1NCByZW5hbWVzIHRoZSBzaGFkZXIgY2h1bmsgPGNvbG9yc3BhY2VfZnJhZ21lbnQ+IHRvIDxlbmNvZGluZ3NfZnJhZ21lbnQ+XG4gICAgICBpZiAodGhyZWVSZXZpc2lvbiA8IDE1NCkge1xuICAgICAgICBzaGFkZXIuZnJhZ21lbnRTaGFkZXIgPSBzaGFkZXIuZnJhZ21lbnRTaGFkZXIucmVwbGFjZShcbiAgICAgICAgICAnI2luY2x1ZGUgPGNvbG9yc3BhY2VfZnJhZ21lbnQ+JyxcbiAgICAgICAgICAnI2luY2x1ZGUgPGVuY29kaW5nc19mcmFnbWVudD4nLFxuICAgICAgICApO1xuICAgICAgfVxuICAgIH07XG4gIH1cblxuICAvKipcbiAgICogVXBkYXRlIHRoaXMgbWF0ZXJpYWwuXG4gICAqXG4gICAqIEBwYXJhbSBkZWx0YSBkZWx0YVRpbWUgc2luY2UgbGFzdCB1cGRhdGVcbiAgICovXG4gIHB1YmxpYyB1cGRhdGUoZGVsdGE6IG51bWJlcik6IHZvaWQge1xuICAgIHRoaXMuX3VwbG9hZFVuaWZvcm1zV29ya2Fyb3VuZCgpO1xuICAgIHRoaXMuX3VwZGF0ZVVWQW5pbWF0aW9uKGRlbHRhKTtcbiAgfVxuXG4gIHB1YmxpYyBjb3B5KHNvdXJjZTogdGhpcyk6IHRoaXMge1xuICAgIHN1cGVyLmNvcHkoc291cmNlKTtcbiAgICAvLyB1bmlmb3JtcyBhcmUgYWxyZWFkeSBjb3BpZWQgYXQgdGhpcyBtb21lbnRcblxuICAgIC8vIEJlZ2lubmluZyBmcm9tIHIxMzMsIHVuaWZvcm0gdGV4dHVyZXMgd2lsbCBiZSBjbG9uZWQgaW5zdGVhZCBvZiByZWZlcmVuY2VcbiAgICAvLyBTZWU6IGh0dHBzOi8vZ2l0aHViLmNvbS9tcmRvb2IvdGhyZWUuanMvYmxvYi9hODgxM2JlMDRhODQ5YmQxNTVmN2NmNmYxYjIzZDhlZTJlMGZiNDhiL2V4YW1wbGVzL2pzbS9sb2FkZXJzL0dMVEZMb2FkZXIuanMjTDMwNDdcbiAgICAvLyBTZWU6IGh0dHBzOi8vZ2l0aHViLmNvbS9tcmRvb2IvdGhyZWUuanMvYmxvYi9hODgxM2JlMDRhODQ5YmQxNTVmN2NmNmYxYjIzZDhlZTJlMGZiNDhiL3NyYy9yZW5kZXJlcnMvc2hhZGVycy9Vbmlmb3Jtc1V0aWxzLmpzI0wyMlxuICAgIC8vIFRoaXMgd2lsbCBsZWF2ZSB0aGVpciBgLnZlcnNpb25gIHRvIGJlIGAwYFxuICAgIC8vIGFuZCB0aGVzZSB0ZXh0dXJlcyB3b24ndCBiZSB1cGxvYWRlZCB0byBHUFVcbiAgICAvLyBXZSBhcmUgZ29pbmcgdG8gd29ya2Fyb3VuZCB0aGlzIGluIGhlcmVcbiAgICAvLyBJJ3ZlIG9wZW5lZCBhbiBpc3N1ZSBmb3IgdGhpczogaHR0cHM6Ly9naXRodWIuY29tL21yZG9vYi90aHJlZS5qcy9pc3N1ZXMvMjI3MThcbiAgICB0aGlzLm1hcCA9IHNvdXJjZS5tYXA7XG4gICAgdGhpcy5ub3JtYWxNYXAgPSBzb3VyY2Uubm9ybWFsTWFwO1xuICAgIHRoaXMuZW1pc3NpdmVNYXAgPSBzb3VyY2UuZW1pc3NpdmVNYXA7XG4gICAgdGhpcy5zaGFkZU11bHRpcGx5VGV4dHVyZSA9IHNvdXJjZS5zaGFkZU11bHRpcGx5VGV4dHVyZTtcbiAgICB0aGlzLnNoYWRpbmdTaGlmdFRleHR1cmUgPSBzb3VyY2Uuc2hhZGluZ1NoaWZ0VGV4dHVyZTtcbiAgICB0aGlzLm1hdGNhcFRleHR1cmUgPSBzb3VyY2UubWF0Y2FwVGV4dHVyZTtcbiAgICB0aGlzLnJpbU11bHRpcGx5VGV4dHVyZSA9IHNvdXJjZS5yaW1NdWx0aXBseVRleHR1cmU7XG4gICAgdGhpcy5vdXRsaW5lV2lkdGhNdWx0aXBseVRleHR1cmUgPSBzb3VyY2Uub3V0bGluZVdpZHRoTXVsdGlwbHlUZXh0dXJlO1xuICAgIHRoaXMudXZBbmltYXRpb25NYXNrVGV4dHVyZSA9IHNvdXJjZS51dkFuaW1hdGlvbk1hc2tUZXh0dXJlO1xuXG4gICAgLy8gPT0gY29weSBtZW1iZXJzID09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09XG4gICAgdGhpcy5ub3JtYWxNYXBUeXBlID0gc291cmNlLm5vcm1hbE1hcFR5cGU7XG5cbiAgICB0aGlzLnV2QW5pbWF0aW9uU2Nyb2xsWFNwZWVkRmFjdG9yID0gc291cmNlLnV2QW5pbWF0aW9uU2Nyb2xsWFNwZWVkRmFjdG9yO1xuICAgIHRoaXMudXZBbmltYXRpb25TY3JvbGxZU3BlZWRGYWN0b3IgPSBzb3VyY2UudXZBbmltYXRpb25TY3JvbGxZU3BlZWRGYWN0b3I7XG4gICAgdGhpcy51dkFuaW1hdGlvblJvdGF0aW9uU3BlZWRGYWN0b3IgPSBzb3VyY2UudXZBbmltYXRpb25Sb3RhdGlvblNwZWVkRmFjdG9yO1xuXG4gICAgdGhpcy5pZ25vcmVWZXJ0ZXhDb2xvciA9IHNvdXJjZS5pZ25vcmVWZXJ0ZXhDb2xvcjtcblxuICAgIHRoaXMudjBDb21wYXRTaGFkZSA9IHNvdXJjZS52MENvbXBhdFNoYWRlO1xuICAgIHRoaXMuZGVidWdNb2RlID0gc291cmNlLmRlYnVnTW9kZTtcbiAgICB0aGlzLm91dGxpbmVXaWR0aE1vZGUgPSBzb3VyY2Uub3V0bGluZVdpZHRoTW9kZTtcblxuICAgIHRoaXMuaXNPdXRsaW5lID0gc291cmNlLmlzT3V0bGluZTtcblxuICAgIC8vID09IHVwZGF0ZSBzaGFkZXIgc3R1ZmYgPT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PVxuICAgIHRoaXMubmVlZHNVcGRhdGUgPSB0cnVlO1xuXG4gICAgcmV0dXJuIHRoaXM7XG4gIH1cblxuICAvKipcbiAgICogVXBkYXRlIFVWIGFuaW1hdGlvbiBzdGF0ZS5cbiAgICogSW50ZW5kZWQgdG8gYmUgY2FsbGVkIHZpYSB7QGxpbmsgdXBkYXRlfS5cbiAgICogQHBhcmFtIGRlbHRhIGRlbHRhVGltZVxuICAgKi9cbiAgcHJpdmF0ZSBfdXBkYXRlVVZBbmltYXRpb24oZGVsdGE6IG51bWJlcik6IHZvaWQge1xuICAgIHRoaXMudW5pZm9ybXMudXZBbmltYXRpb25TY3JvbGxYT2Zmc2V0LnZhbHVlICs9IGRlbHRhICogdGhpcy51dkFuaW1hdGlvblNjcm9sbFhTcGVlZEZhY3RvcjtcbiAgICB0aGlzLnVuaWZvcm1zLnV2QW5pbWF0aW9uU2Nyb2xsWU9mZnNldC52YWx1ZSArPSBkZWx0YSAqIHRoaXMudXZBbmltYXRpb25TY3JvbGxZU3BlZWRGYWN0b3I7XG4gICAgdGhpcy51bmlmb3Jtcy51dkFuaW1hdGlvblJvdGF0aW9uUGhhc2UudmFsdWUgKz0gZGVsdGEgKiB0aGlzLnV2QW5pbWF0aW9uUm90YXRpb25TcGVlZEZhY3RvcjtcbiAgICB0aGlzLnVuaWZvcm1zLmFscGhhVGVzdC52YWx1ZSA9IHRoaXMuYWxwaGFUZXN0O1xuXG4gICAgdGhpcy51bmlmb3Jtc05lZWRVcGRhdGUgPSB0cnVlO1xuICB9XG5cbiAgLyoqXG4gICAqIFVwbG9hZCB1bmlmb3JtcyB0aGF0IG5lZWQgdG8gdXBsb2FkIGJ1dCBkb2Vzbid0IGF1dG9tYXRpY2FsbHkgYmVjYXVzZSBvZiByZWFzb25zLlxuICAgKiBJbnRlbmRlZCB0byBiZSBjYWxsZWQgdmlhIHtAbGluayBjb25zdHJ1Y3Rvcn0gYW5kIHtAbGluayB1cGRhdGV9LlxuICAgKi9cbiAgcHJpdmF0ZSBfdXBsb2FkVW5pZm9ybXNXb3JrYXJvdW5kKCk6IHZvaWQge1xuICAgIC8vIHdvcmthcm91bmQ6IHNpbmNlIG9wYWNpdHkgaXMgZGVmaW5lZCBhcyBhIHByb3BlcnR5IGluIFRIUkVFLk1hdGVyaWFsXG4gICAgLy8gYW5kIGNhbm5vdCBiZSBvdmVycmlkZGVuIGFzIGFuIGFjY2Vzc29yLFxuICAgIC8vIFdlIGFyZSBnb2luZyB0byB1cGRhdGUgb3BhY2l0eSBoZXJlXG4gICAgdGhpcy51bmlmb3Jtcy5vcGFjaXR5LnZhbHVlID0gdGhpcy5vcGFjaXR5O1xuXG4gICAgLy8gd29ya2Fyb3VuZDogdGV4dHVyZSB0cmFuc2Zvcm1zIGFyZSBub3QgdXBkYXRlZCBhdXRvbWF0aWNhbGx5XG4gICAgdGhpcy5fdXBkYXRlVGV4dHVyZU1hdHJpeCh0aGlzLnVuaWZvcm1zLm1hcCwgdGhpcy51bmlmb3Jtcy5tYXBVdlRyYW5zZm9ybSk7XG4gICAgdGhpcy5fdXBkYXRlVGV4dHVyZU1hdHJpeCh0aGlzLnVuaWZvcm1zLm5vcm1hbE1hcCwgdGhpcy51bmlmb3Jtcy5ub3JtYWxNYXBVdlRyYW5zZm9ybSk7XG4gICAgdGhpcy5fdXBkYXRlVGV4dHVyZU1hdHJpeCh0aGlzLnVuaWZvcm1zLmVtaXNzaXZlTWFwLCB0aGlzLnVuaWZvcm1zLmVtaXNzaXZlTWFwVXZUcmFuc2Zvcm0pO1xuICAgIHRoaXMuX3VwZGF0ZVRleHR1cmVNYXRyaXgodGhpcy51bmlmb3Jtcy5zaGFkZU11bHRpcGx5VGV4dHVyZSwgdGhpcy51bmlmb3Jtcy5zaGFkZU11bHRpcGx5VGV4dHVyZVV2VHJhbnNmb3JtKTtcbiAgICB0aGlzLl91cGRhdGVUZXh0dXJlTWF0cml4KHRoaXMudW5pZm9ybXMuc2hhZGluZ1NoaWZ0VGV4dHVyZSwgdGhpcy51bmlmb3Jtcy5zaGFkaW5nU2hpZnRUZXh0dXJlVXZUcmFuc2Zvcm0pO1xuICAgIHRoaXMuX3VwZGF0ZVRleHR1cmVNYXRyaXgodGhpcy51bmlmb3Jtcy5tYXRjYXBUZXh0dXJlLCB0aGlzLnVuaWZvcm1zLm1hdGNhcFRleHR1cmVVdlRyYW5zZm9ybSk7XG4gICAgdGhpcy5fdXBkYXRlVGV4dHVyZU1hdHJpeCh0aGlzLnVuaWZvcm1zLnJpbU11bHRpcGx5VGV4dHVyZSwgdGhpcy51bmlmb3Jtcy5yaW1NdWx0aXBseVRleHR1cmVVdlRyYW5zZm9ybSk7XG4gICAgdGhpcy5fdXBkYXRlVGV4dHVyZU1hdHJpeChcbiAgICAgIHRoaXMudW5pZm9ybXMub3V0bGluZVdpZHRoTXVsdGlwbHlUZXh0dXJlLFxuICAgICAgdGhpcy51bmlmb3Jtcy5vdXRsaW5lV2lkdGhNdWx0aXBseVRleHR1cmVVdlRyYW5zZm9ybSxcbiAgICApO1xuICAgIHRoaXMuX3VwZGF0ZVRleHR1cmVNYXRyaXgodGhpcy51bmlmb3Jtcy51dkFuaW1hdGlvbk1hc2tUZXh0dXJlLCB0aGlzLnVuaWZvcm1zLnV2QW5pbWF0aW9uTWFza1RleHR1cmVVdlRyYW5zZm9ybSk7XG5cbiAgICB0aGlzLnVuaWZvcm1zTmVlZFVwZGF0ZSA9IHRydWU7XG4gIH1cblxuICAvKipcbiAgICogUmV0dXJucyBhIG1hcCBvYmplY3Qgb2YgcHJlcHJvY2Vzc29yIHRva2VuIGFuZCBtYWNybyBvZiB0aGUgc2hhZGVyIHByb2dyYW0uXG4gICAqL1xuICBwcml2YXRlIF9nZW5lcmF0ZURlZmluZXMoKTogeyBbdG9rZW46IHN0cmluZ106IGJvb2xlYW4gfCBudW1iZXIgfCBzdHJpbmcgfSB7XG4gICAgY29uc3QgdGhyZWVSZXZpc2lvbiA9IHBhcnNlSW50KFRIUkVFLlJFVklTSU9OLCAxMCk7XG5cbiAgICBjb25zdCB1c2VVdkluVmVydCA9IHRoaXMub3V0bGluZVdpZHRoTXVsdGlwbHlUZXh0dXJlICE9PSBudWxsO1xuICAgIGNvbnN0IHVzZVV2SW5GcmFnID1cbiAgICAgIHRoaXMubWFwICE9PSBudWxsIHx8XG4gICAgICB0aGlzLm5vcm1hbE1hcCAhPT0gbnVsbCB8fFxuICAgICAgdGhpcy5lbWlzc2l2ZU1hcCAhPT0gbnVsbCB8fFxuICAgICAgdGhpcy5zaGFkZU11bHRpcGx5VGV4dHVyZSAhPT0gbnVsbCB8fFxuICAgICAgdGhpcy5zaGFkaW5nU2hpZnRUZXh0dXJlICE9PSBudWxsIHx8XG4gICAgICB0aGlzLnJpbU11bHRpcGx5VGV4dHVyZSAhPT0gbnVsbCB8fFxuICAgICAgdGhpcy51dkFuaW1hdGlvbk1hc2tUZXh0dXJlICE9PSBudWxsO1xuXG4gICAgcmV0dXJuIHtcbiAgICAgIC8vIFRlbXBvcmFyeSBjb21wYXQgYWdhaW5zdCBzaGFkZXIgY2hhbmdlIEAgVGhyZWUuanMgcjEyNlxuICAgICAgLy8gU2VlOiAjMjEyMDUsICMyMTMwNywgIzIxMjk5XG4gICAgICBUSFJFRV9WUk1fVEhSRUVfUkVWSVNJT046IHRocmVlUmV2aXNpb24sXG5cbiAgICAgIE9VVExJTkU6IHRoaXMuX2lzT3V0bGluZSxcbiAgICAgIE1UT09OX1VTRV9VVjogdXNlVXZJblZlcnQgfHwgdXNlVXZJbkZyYWcsIC8vIHdlIGNhbid0IHVzZSBgVVNFX1VWYCAsIGl0IHdpbGwgYmUgcmVkZWZpbmVkIGluIFdlYkdMUHJvZ3JhbS5qc1xuICAgICAgTVRPT05fVVZTX1ZFUlRFWF9PTkxZOiB1c2VVdkluVmVydCAmJiAhdXNlVXZJbkZyYWcsXG4gICAgICBWMF9DT01QQVRfU0hBREU6IHRoaXMuX3YwQ29tcGF0U2hhZGUsXG4gICAgICBVU0VfU0hBREVNVUxUSVBMWVRFWFRVUkU6IHRoaXMuc2hhZGVNdWx0aXBseVRleHR1cmUgIT09IG51bGwsXG4gICAgICBVU0VfU0hBRElOR1NISUZUVEVYVFVSRTogdGhpcy5zaGFkaW5nU2hpZnRUZXh0dXJlICE9PSBudWxsLFxuICAgICAgVVNFX01BVENBUFRFWFRVUkU6IHRoaXMubWF0Y2FwVGV4dHVyZSAhPT0gbnVsbCxcbiAgICAgIFVTRV9SSU1NVUxUSVBMWVRFWFRVUkU6IHRoaXMucmltTXVsdGlwbHlUZXh0dXJlICE9PSBudWxsLFxuICAgICAgVVNFX09VVExJTkVXSURUSE1VTFRJUExZVEVYVFVSRTogdGhpcy5faXNPdXRsaW5lICYmIHRoaXMub3V0bGluZVdpZHRoTXVsdGlwbHlUZXh0dXJlICE9PSBudWxsLFxuICAgICAgVVNFX1VWQU5JTUFUSU9OTUFTS1RFWFRVUkU6IHRoaXMudXZBbmltYXRpb25NYXNrVGV4dHVyZSAhPT0gbnVsbCxcbiAgICAgIElHTk9SRV9WRVJURVhfQ09MT1I6IHRoaXMuX2lnbm9yZVZlcnRleENvbG9yID09PSB0cnVlLFxuICAgICAgREVCVUdfTk9STUFMOiB0aGlzLl9kZWJ1Z01vZGUgPT09ICdub3JtYWwnLFxuICAgICAgREVCVUdfTElUU0hBREVSQVRFOiB0aGlzLl9kZWJ1Z01vZGUgPT09ICdsaXRTaGFkZVJhdGUnLFxuICAgICAgREVCVUdfVVY6IHRoaXMuX2RlYnVnTW9kZSA9PT0gJ3V2JyxcbiAgICAgIE9VVExJTkVfV0lEVEhfU0NSRUVOOlxuICAgICAgICB0aGlzLl9pc091dGxpbmUgJiYgdGhpcy5fb3V0bGluZVdpZHRoTW9kZSA9PT0gTVRvb25NYXRlcmlhbE91dGxpbmVXaWR0aE1vZGUuU2NyZWVuQ29vcmRpbmF0ZXMsXG4gICAgfTtcbiAgfVxuXG4gIHByaXZhdGUgX3VwZGF0ZVRleHR1cmVNYXRyaXgoc3JjOiBUSFJFRS5JVW5pZm9ybTxUSFJFRS5UZXh0dXJlIHwgbnVsbD4sIGRzdDogVEhSRUUuSVVuaWZvcm08VEhSRUUuTWF0cml4Mz4pOiB2b2lkIHtcbiAgICBpZiAoc3JjLnZhbHVlKSB7XG4gICAgICBpZiAoc3JjLnZhbHVlLm1hdHJpeEF1dG9VcGRhdGUpIHtcbiAgICAgICAgc3JjLnZhbHVlLnVwZGF0ZU1hdHJpeCgpO1xuICAgICAgfVxuXG4gICAgICBkc3QudmFsdWUuY29weShzcmMudmFsdWUubWF0cml4KTtcbiAgICB9XG4gIH1cbn1cbiIsICIvLyAjZGVmaW5lIFBIT05HXG5cbnZhcnlpbmcgdmVjMyB2Vmlld1Bvc2l0aW9uO1xuXG4jaWZuZGVmIEZMQVRfU0hBREVEXG4gIHZhcnlpbmcgdmVjMyB2Tm9ybWFsO1xuI2VuZGlmXG5cbiNpbmNsdWRlIDxjb21tb24+XG5cbi8vICNpbmNsdWRlIDx1dl9wYXJzX3ZlcnRleD5cbiNpZmRlZiBNVE9PTl9VU0VfVVZcbiAgdmFyeWluZyB2ZWMyIHZVdjtcblxuICAvLyBDT01QQVQ6IHByZS1yMTUxIHVzZXMgYSBjb21tb24gdXZUcmFuc2Zvcm1cbiAgI2lmIFRIUkVFX1ZSTV9USFJFRV9SRVZJU0lPTiA8IDE1MVxuICAgIHVuaWZvcm0gbWF0MyB1dlRyYW5zZm9ybTtcbiAgI2VuZGlmXG4jZW5kaWZcblxuLy8gI2luY2x1ZGUgPHV2Ml9wYXJzX3ZlcnRleD5cbi8vIENPTUFQVDogcHJlLXIxNTEgdXNlcyB1djIgZm9yIGxpZ2h0TWFwIGFuZCBhb01hcFxuI2lmIFRIUkVFX1ZSTV9USFJFRV9SRVZJU0lPTiA8IDE1MVxuICAjaWYgZGVmaW5lZCggVVNFX0xJR0hUTUFQICkgfHwgZGVmaW5lZCggVVNFX0FPTUFQIClcbiAgICBhdHRyaWJ1dGUgdmVjMiB1djI7XG4gICAgdmFyeWluZyB2ZWMyIHZVdjI7XG4gICAgdW5pZm9ybSBtYXQzIHV2MlRyYW5zZm9ybTtcbiAgI2VuZGlmXG4jZW5kaWZcblxuLy8gI2luY2x1ZGUgPGRpc3BsYWNlbWVudG1hcF9wYXJzX3ZlcnRleD5cbi8vICNpbmNsdWRlIDxlbnZtYXBfcGFyc192ZXJ0ZXg+XG4jaW5jbHVkZSA8Y29sb3JfcGFyc192ZXJ0ZXg+XG4jaW5jbHVkZSA8Zm9nX3BhcnNfdmVydGV4PlxuI2luY2x1ZGUgPG1vcnBodGFyZ2V0X3BhcnNfdmVydGV4PlxuI2luY2x1ZGUgPHNraW5uaW5nX3BhcnNfdmVydGV4PlxuI2luY2x1ZGUgPHNoYWRvd21hcF9wYXJzX3ZlcnRleD5cbiNpbmNsdWRlIDxsb2dkZXB0aGJ1Zl9wYXJzX3ZlcnRleD5cbiNpbmNsdWRlIDxjbGlwcGluZ19wbGFuZXNfcGFyc192ZXJ0ZXg+XG5cbiNpZmRlZiBVU0VfT1VUTElORVdJRFRITVVMVElQTFlURVhUVVJFXG4gIHVuaWZvcm0gc2FtcGxlcjJEIG91dGxpbmVXaWR0aE11bHRpcGx5VGV4dHVyZTtcbiAgdW5pZm9ybSBtYXQzIG91dGxpbmVXaWR0aE11bHRpcGx5VGV4dHVyZVV2VHJhbnNmb3JtO1xuI2VuZGlmXG5cbnVuaWZvcm0gZmxvYXQgb3V0bGluZVdpZHRoRmFjdG9yO1xuXG52b2lkIG1haW4oKSB7XG5cbiAgLy8gI2luY2x1ZGUgPHV2X3ZlcnRleD5cbiAgI2lmZGVmIE1UT09OX1VTRV9VVlxuICAgIC8vIENPTVBBVDogcHJlLXIxNTEgdXNlcyBhIGNvbW1vbiB1dlRyYW5zZm9ybVxuICAgICNpZiBUSFJFRV9WUk1fVEhSRUVfUkVWSVNJT04gPj0gMTUxXG4gICAgICB2VXYgPSB1djtcbiAgICAjZWxzZVxuICAgICAgdlV2ID0gKCB1dlRyYW5zZm9ybSAqIHZlYzMoIHV2LCAxICkgKS54eTtcbiAgICAjZW5kaWZcbiAgI2VuZGlmXG5cbiAgLy8gI2luY2x1ZGUgPHV2Ml92ZXJ0ZXg+XG4gIC8vIENPTUFQVDogcHJlLXIxNTEgdXNlcyB1djIgZm9yIGxpZ2h0TWFwIGFuZCBhb01hcFxuICAjaWYgVEhSRUVfVlJNX1RIUkVFX1JFVklTSU9OIDwgMTUxXG4gICAgI2lmIGRlZmluZWQoIFVTRV9MSUdIVE1BUCApIHx8IGRlZmluZWQoIFVTRV9BT01BUCApXG4gICAgICB2VXYyID0gKCB1djJUcmFuc2Zvcm0gKiB2ZWMzKCB1djIsIDEgKSApLnh5O1xuICAgICNlbmRpZlxuICAjZW5kaWZcblxuICAjaW5jbHVkZSA8Y29sb3JfdmVydGV4PlxuXG4gICNpbmNsdWRlIDxiZWdpbm5vcm1hbF92ZXJ0ZXg+XG4gICNpbmNsdWRlIDxtb3JwaG5vcm1hbF92ZXJ0ZXg+XG4gICNpbmNsdWRlIDxza2luYmFzZV92ZXJ0ZXg+XG4gICNpbmNsdWRlIDxza2lubm9ybWFsX3ZlcnRleD5cblxuICAvLyB3ZSBuZWVkIHRoaXMgdG8gY29tcHV0ZSB0aGUgb3V0bGluZSBwcm9wZXJseVxuICBvYmplY3ROb3JtYWwgPSBub3JtYWxpemUoIG9iamVjdE5vcm1hbCApO1xuXG4gICNpbmNsdWRlIDxkZWZhdWx0bm9ybWFsX3ZlcnRleD5cblxuICAjaWZuZGVmIEZMQVRfU0hBREVEIC8vIE5vcm1hbCBjb21wdXRlZCB3aXRoIGRlcml2YXRpdmVzIHdoZW4gRkxBVF9TSEFERURcbiAgICB2Tm9ybWFsID0gbm9ybWFsaXplKCB0cmFuc2Zvcm1lZE5vcm1hbCApO1xuICAjZW5kaWZcblxuICAjaW5jbHVkZSA8YmVnaW5fdmVydGV4PlxuXG4gICNpbmNsdWRlIDxtb3JwaHRhcmdldF92ZXJ0ZXg+XG4gICNpbmNsdWRlIDxza2lubmluZ192ZXJ0ZXg+XG4gIC8vICNpbmNsdWRlIDxkaXNwbGFjZW1lbnRtYXBfdmVydGV4PlxuICAjaW5jbHVkZSA8cHJvamVjdF92ZXJ0ZXg+XG4gICNpbmNsdWRlIDxsb2dkZXB0aGJ1Zl92ZXJ0ZXg+XG4gICNpbmNsdWRlIDxjbGlwcGluZ19wbGFuZXNfdmVydGV4PlxuXG4gIHZWaWV3UG9zaXRpb24gPSAtIG12UG9zaXRpb24ueHl6O1xuXG4gICNpZmRlZiBPVVRMSU5FXG4gICAgZmxvYXQgd29ybGROb3JtYWxMZW5ndGggPSBsZW5ndGgoIHRyYW5zZm9ybWVkTm9ybWFsICk7XG4gICAgdmVjMyBvdXRsaW5lT2Zmc2V0ID0gb3V0bGluZVdpZHRoRmFjdG9yICogd29ybGROb3JtYWxMZW5ndGggKiBvYmplY3ROb3JtYWw7XG5cbiAgICAjaWZkZWYgVVNFX09VVExJTkVXSURUSE1VTFRJUExZVEVYVFVSRVxuICAgICAgdmVjMiBvdXRsaW5lV2lkdGhNdWx0aXBseVRleHR1cmVVdiA9ICggb3V0bGluZVdpZHRoTXVsdGlwbHlUZXh0dXJlVXZUcmFuc2Zvcm0gKiB2ZWMzKCB2VXYsIDEgKSApLnh5O1xuICAgICAgZmxvYXQgb3V0bGluZVRleCA9IHRleHR1cmUyRCggb3V0bGluZVdpZHRoTXVsdGlwbHlUZXh0dXJlLCBvdXRsaW5lV2lkdGhNdWx0aXBseVRleHR1cmVVdiApLmc7XG4gICAgICBvdXRsaW5lT2Zmc2V0ICo9IG91dGxpbmVUZXg7XG4gICAgI2VuZGlmXG5cbiAgICAjaWZkZWYgT1VUTElORV9XSURUSF9TQ1JFRU5cbiAgICAgIG91dGxpbmVPZmZzZXQgKj0gdlZpZXdQb3NpdGlvbi56IC8gcHJvamVjdGlvbk1hdHJpeFsgMSBdLnk7XG4gICAgI2VuZGlmXG5cbiAgICBnbF9Qb3NpdGlvbiA9IHByb2plY3Rpb25NYXRyaXggKiBtb2RlbFZpZXdNYXRyaXggKiB2ZWM0KCBvdXRsaW5lT2Zmc2V0ICsgdHJhbnNmb3JtZWQsIDEuMCApO1xuXG4gICAgZ2xfUG9zaXRpb24ueiArPSAxRS02ICogZ2xfUG9zaXRpb24udzsgLy8gYW50aS1hcnRpZmFjdCBtYWdpY1xuICAjZW5kaWZcblxuICAjaW5jbHVkZSA8d29ybGRwb3NfdmVydGV4PlxuICAvLyAjaW5jbHVkZSA8ZW52bWFwX3ZlcnRleD5cbiAgI2luY2x1ZGUgPHNoYWRvd21hcF92ZXJ0ZXg+XG4gICNpbmNsdWRlIDxmb2dfdmVydGV4PlxuXG59IiwgIi8vICNkZWZpbmUgUEhPTkdcblxudW5pZm9ybSB2ZWMzIGxpdEZhY3RvcjtcblxudW5pZm9ybSBmbG9hdCBvcGFjaXR5O1xuXG51bmlmb3JtIHZlYzMgc2hhZGVDb2xvckZhY3RvcjtcbiNpZmRlZiBVU0VfU0hBREVNVUxUSVBMWVRFWFRVUkVcbiAgdW5pZm9ybSBzYW1wbGVyMkQgc2hhZGVNdWx0aXBseVRleHR1cmU7XG4gIHVuaWZvcm0gbWF0MyBzaGFkZU11bHRpcGx5VGV4dHVyZVV2VHJhbnNmb3JtO1xuI2VuZGlmXG5cbnVuaWZvcm0gZmxvYXQgc2hhZGluZ1NoaWZ0RmFjdG9yO1xudW5pZm9ybSBmbG9hdCBzaGFkaW5nVG9vbnlGYWN0b3I7XG5cbiNpZmRlZiBVU0VfU0hBRElOR1NISUZUVEVYVFVSRVxuICB1bmlmb3JtIHNhbXBsZXIyRCBzaGFkaW5nU2hpZnRUZXh0dXJlO1xuICB1bmlmb3JtIG1hdDMgc2hhZGluZ1NoaWZ0VGV4dHVyZVV2VHJhbnNmb3JtO1xuICB1bmlmb3JtIGZsb2F0IHNoYWRpbmdTaGlmdFRleHR1cmVTY2FsZTtcbiNlbmRpZlxuXG51bmlmb3JtIGZsb2F0IGdpRXF1YWxpemF0aW9uRmFjdG9yO1xuXG51bmlmb3JtIHZlYzMgcGFyYW1ldHJpY1JpbUNvbG9yRmFjdG9yO1xuI2lmZGVmIFVTRV9SSU1NVUxUSVBMWVRFWFRVUkVcbiAgdW5pZm9ybSBzYW1wbGVyMkQgcmltTXVsdGlwbHlUZXh0dXJlO1xuICB1bmlmb3JtIG1hdDMgcmltTXVsdGlwbHlUZXh0dXJlVXZUcmFuc2Zvcm07XG4jZW5kaWZcbnVuaWZvcm0gZmxvYXQgcmltTGlnaHRpbmdNaXhGYWN0b3I7XG51bmlmb3JtIGZsb2F0IHBhcmFtZXRyaWNSaW1GcmVzbmVsUG93ZXJGYWN0b3I7XG51bmlmb3JtIGZsb2F0IHBhcmFtZXRyaWNSaW1MaWZ0RmFjdG9yO1xuXG4jaWZkZWYgVVNFX01BVENBUFRFWFRVUkVcbiAgdW5pZm9ybSB2ZWMzIG1hdGNhcEZhY3RvcjtcbiAgdW5pZm9ybSBzYW1wbGVyMkQgbWF0Y2FwVGV4dHVyZTtcbiAgdW5pZm9ybSBtYXQzIG1hdGNhcFRleHR1cmVVdlRyYW5zZm9ybTtcbiNlbmRpZlxuXG51bmlmb3JtIHZlYzMgZW1pc3NpdmU7XG51bmlmb3JtIGZsb2F0IGVtaXNzaXZlSW50ZW5zaXR5O1xuXG51bmlmb3JtIHZlYzMgb3V0bGluZUNvbG9yRmFjdG9yO1xudW5pZm9ybSBmbG9hdCBvdXRsaW5lTGlnaHRpbmdNaXhGYWN0b3I7XG5cbiNpZmRlZiBVU0VfVVZBTklNQVRJT05NQVNLVEVYVFVSRVxuICB1bmlmb3JtIHNhbXBsZXIyRCB1dkFuaW1hdGlvbk1hc2tUZXh0dXJlO1xuICB1bmlmb3JtIG1hdDMgdXZBbmltYXRpb25NYXNrVGV4dHVyZVV2VHJhbnNmb3JtO1xuI2VuZGlmXG5cbnVuaWZvcm0gZmxvYXQgdXZBbmltYXRpb25TY3JvbGxYT2Zmc2V0O1xudW5pZm9ybSBmbG9hdCB1dkFuaW1hdGlvblNjcm9sbFlPZmZzZXQ7XG51bmlmb3JtIGZsb2F0IHV2QW5pbWF0aW9uUm90YXRpb25QaGFzZTtcblxuI2luY2x1ZGUgPGNvbW1vbj5cbiNpbmNsdWRlIDxwYWNraW5nPlxuI2luY2x1ZGUgPGRpdGhlcmluZ19wYXJzX2ZyYWdtZW50PlxuI2luY2x1ZGUgPGNvbG9yX3BhcnNfZnJhZ21lbnQ+XG5cbi8vICNpbmNsdWRlIDx1dl9wYXJzX2ZyYWdtZW50PlxuI2lmICggZGVmaW5lZCggTVRPT05fVVNFX1VWICkgJiYgIWRlZmluZWQoIE1UT09OX1VWU19WRVJURVhfT05MWSApIClcbiAgdmFyeWluZyB2ZWMyIHZVdjtcbiNlbmRpZlxuXG4vLyAjaW5jbHVkZSA8dXYyX3BhcnNfZnJhZ21lbnQ+XG4vLyBDT01BUFQ6IHByZS1yMTUxIHVzZXMgdXYyIGZvciBsaWdodE1hcCBhbmQgYW9NYXBcbiNpZiBUSFJFRV9WUk1fVEhSRUVfUkVWSVNJT04gPCAxNTFcbiAgI2lmIGRlZmluZWQoIFVTRV9MSUdIVE1BUCApIHx8IGRlZmluZWQoIFVTRV9BT01BUCApXG4gICAgdmFyeWluZyB2ZWMyIHZVdjI7XG4gICNlbmRpZlxuI2VuZGlmXG5cbiNpbmNsdWRlIDxtYXBfcGFyc19mcmFnbWVudD5cblxuI2lmZGVmIFVTRV9NQVBcbiAgdW5pZm9ybSBtYXQzIG1hcFV2VHJhbnNmb3JtO1xuI2VuZGlmXG5cbi8vICNpbmNsdWRlIDxhbHBoYW1hcF9wYXJzX2ZyYWdtZW50PlxuXG4jaW5jbHVkZSA8YWxwaGF0ZXN0X3BhcnNfZnJhZ21lbnQ+XG5cbiNpbmNsdWRlIDxhb21hcF9wYXJzX2ZyYWdtZW50PlxuLy8gI2luY2x1ZGUgPGxpZ2h0bWFwX3BhcnNfZnJhZ21lbnQ+XG4jaW5jbHVkZSA8ZW1pc3NpdmVtYXBfcGFyc19mcmFnbWVudD5cblxuI2lmZGVmIFVTRV9FTUlTU0lWRU1BUFxuICB1bmlmb3JtIG1hdDMgZW1pc3NpdmVNYXBVdlRyYW5zZm9ybTtcbiNlbmRpZlxuXG4vLyAjaW5jbHVkZSA8ZW52bWFwX2NvbW1vbl9wYXJzX2ZyYWdtZW50PlxuLy8gI2luY2x1ZGUgPGVudm1hcF9wYXJzX2ZyYWdtZW50PlxuLy8gI2luY2x1ZGUgPGN1YmVfdXZfcmVmbGVjdGlvbl9mcmFnbWVudD5cbiNpbmNsdWRlIDxmb2dfcGFyc19mcmFnbWVudD5cblxuLy8gI2luY2x1ZGUgPGJzZGZzPlxuLy8gQ09NUEFUOiBwcmUtcjE1MSBkb2Vzbid0IGhhdmUgQlJERl9MYW1iZXJ0IGluIDxjb21tb24+XG4jaWYgVEhSRUVfVlJNX1RIUkVFX1JFVklTSU9OIDwgMTUxXG4gIHZlYzMgQlJERl9MYW1iZXJ0KCBjb25zdCBpbiB2ZWMzIGRpZmZ1c2VDb2xvciApIHtcbiAgICByZXR1cm4gUkVDSVBST0NBTF9QSSAqIGRpZmZ1c2VDb2xvcjtcbiAgfVxuI2VuZGlmXG5cbiNpbmNsdWRlIDxsaWdodHNfcGFyc19iZWdpbj5cblxuI2luY2x1ZGUgPG5vcm1hbF9wYXJzX2ZyYWdtZW50PlxuXG4vLyAjaW5jbHVkZSA8bGlnaHRzX3Bob25nX3BhcnNfZnJhZ21lbnQ+XG52YXJ5aW5nIHZlYzMgdlZpZXdQb3NpdGlvbjtcblxuc3RydWN0IE1Ub29uTWF0ZXJpYWwge1xuICB2ZWMzIGRpZmZ1c2VDb2xvcjtcbiAgdmVjMyBzaGFkZUNvbG9yO1xuICBmbG9hdCBzaGFkaW5nU2hpZnQ7XG59O1xuXG5mbG9hdCBsaW5lYXJzdGVwKCBmbG9hdCBhLCBmbG9hdCBiLCBmbG9hdCB0ICkge1xuICByZXR1cm4gY2xhbXAoICggdCAtIGEgKSAvICggYiAtIGEgKSwgMC4wLCAxLjAgKTtcbn1cblxuLyoqXG4gKiBDb252ZXJ0IE5kb3RMIGludG8gdG9vbiBzaGFkaW5nIGZhY3RvciB1c2luZyBzaGFkaW5nU2hpZnQgYW5kIHNoYWRpbmdUb29ueVxuICovXG5mbG9hdCBnZXRTaGFkaW5nKFxuICBjb25zdCBpbiBmbG9hdCBkb3ROTCxcbiAgY29uc3QgaW4gZmxvYXQgc2hhZG93LFxuICBjb25zdCBpbiBmbG9hdCBzaGFkaW5nU2hpZnRcbikge1xuICBmbG9hdCBzaGFkaW5nID0gZG90Tkw7XG4gIHNoYWRpbmcgPSBzaGFkaW5nICsgc2hhZGluZ1NoaWZ0O1xuICBzaGFkaW5nID0gbGluZWFyc3RlcCggLTEuMCArIHNoYWRpbmdUb29ueUZhY3RvciwgMS4wIC0gc2hhZGluZ1Rvb255RmFjdG9yLCBzaGFkaW5nICk7XG4gIHNoYWRpbmcgKj0gc2hhZG93O1xuICByZXR1cm4gc2hhZGluZztcbn1cblxuLyoqXG4gKiBNaXggZGlmZnVzZUNvbG9yIGFuZCBzaGFkZUNvbG9yIHVzaW5nIHNoYWRpbmcgZmFjdG9yIGFuZCBsaWdodCBjb2xvclxuICovXG52ZWMzIGdldERpZmZ1c2UoXG4gIGNvbnN0IGluIE1Ub29uTWF0ZXJpYWwgbWF0ZXJpYWwsXG4gIGNvbnN0IGluIGZsb2F0IHNoYWRpbmcsXG4gIGluIHZlYzMgbGlnaHRDb2xvclxuKSB7XG4gICNpZmRlZiBERUJVR19MSVRTSEFERVJBVEVcbiAgICByZXR1cm4gdmVjMyggQlJERl9MYW1iZXJ0KCBzaGFkaW5nICogbGlnaHRDb2xvciApICk7XG4gICNlbmRpZlxuXG4gIHZlYzMgY29sID0gbGlnaHRDb2xvciAqIEJSREZfTGFtYmVydCggbWl4KCBtYXRlcmlhbC5zaGFkZUNvbG9yLCBtYXRlcmlhbC5kaWZmdXNlQ29sb3IsIHNoYWRpbmcgKSApO1xuXG4gIC8vIFRoZSBcImNvbW1lbnQgb3V0IGlmIHlvdSB3YW50IHRvIFBCUiBhYnNvbHV0ZWx5XCIgbGluZVxuICAjaWZkZWYgVjBfQ09NUEFUX1NIQURFXG4gICAgY29sID0gbWluKCBjb2wsIG1hdGVyaWFsLmRpZmZ1c2VDb2xvciApO1xuICAjZW5kaWZcblxuICByZXR1cm4gY29sO1xufVxuXG4vLyBDT01QQVQ6IHByZS1yMTU2IHVzZXMgYSBzdHJ1Y3QgR2VvbWV0cmljQ29udGV4dFxuI2lmIFRIUkVFX1ZSTV9USFJFRV9SRVZJU0lPTiA+PSAxNTdcbiAgdm9pZCBSRV9EaXJlY3RfTVRvb24oIGNvbnN0IGluIEluY2lkZW50TGlnaHQgZGlyZWN0TGlnaHQsIGNvbnN0IGluIHZlYzMgZ2VvbWV0cnlQb3NpdGlvbiwgY29uc3QgaW4gdmVjMyBnZW9tZXRyeU5vcm1hbCwgY29uc3QgaW4gdmVjMyBnZW9tZXRyeVZpZXdEaXIsIGNvbnN0IGluIHZlYzMgZ2VvbWV0cnlDbGVhcmNvYXROb3JtYWwsIGNvbnN0IGluIE1Ub29uTWF0ZXJpYWwgbWF0ZXJpYWwsIGNvbnN0IGluIGZsb2F0IHNoYWRvdywgaW5vdXQgUmVmbGVjdGVkTGlnaHQgcmVmbGVjdGVkTGlnaHQgKSB7XG4gICAgZmxvYXQgZG90TkwgPSBjbGFtcCggZG90KCBnZW9tZXRyeU5vcm1hbCwgZGlyZWN0TGlnaHQuZGlyZWN0aW9uICksIC0xLjAsIDEuMCApO1xuICAgIHZlYzMgaXJyYWRpYW5jZSA9IGRpcmVjdExpZ2h0LmNvbG9yO1xuXG4gICAgLy8gZGlyZWN0U3BlY3VsYXIgd2lsbCBiZSB1c2VkIGZvciByaW0gbGlnaHRpbmcsIG5vdCBhbiBhY3R1YWwgc3BlY3VsYXJcbiAgICByZWZsZWN0ZWRMaWdodC5kaXJlY3RTcGVjdWxhciArPSBpcnJhZGlhbmNlO1xuXG4gICAgaXJyYWRpYW5jZSAqPSBkb3ROTDtcblxuICAgIGZsb2F0IHNoYWRpbmcgPSBnZXRTaGFkaW5nKCBkb3ROTCwgc2hhZG93LCBtYXRlcmlhbC5zaGFkaW5nU2hpZnQgKTtcblxuICAgIC8vIHRvb24gc2hhZGVkIGRpZmZ1c2VcbiAgICByZWZsZWN0ZWRMaWdodC5kaXJlY3REaWZmdXNlICs9IGdldERpZmZ1c2UoIG1hdGVyaWFsLCBzaGFkaW5nLCBkaXJlY3RMaWdodC5jb2xvciApO1xuICB9XG5cbiAgdm9pZCBSRV9JbmRpcmVjdERpZmZ1c2VfTVRvb24oIGNvbnN0IGluIHZlYzMgaXJyYWRpYW5jZSwgY29uc3QgaW4gdmVjMyBnZW9tZXRyeVBvc2l0aW9uLCBjb25zdCBpbiB2ZWMzIGdlb21ldHJ5Tm9ybWFsLCBjb25zdCBpbiB2ZWMzIGdlb21ldHJ5Vmlld0RpciwgY29uc3QgaW4gdmVjMyBnZW9tZXRyeUNsZWFyY29hdE5vcm1hbCwgY29uc3QgaW4gTVRvb25NYXRlcmlhbCBtYXRlcmlhbCwgaW5vdXQgUmVmbGVjdGVkTGlnaHQgcmVmbGVjdGVkTGlnaHQgKSB7XG4gICAgLy8gaW5kaXJlY3QgZGlmZnVzZSB3aWxsIHVzZSBkaWZmdXNlQ29sb3IsIG5vIHNoYWRlQ29sb3IgaW52b2x2ZWRcbiAgICByZWZsZWN0ZWRMaWdodC5pbmRpcmVjdERpZmZ1c2UgKz0gaXJyYWRpYW5jZSAqIEJSREZfTGFtYmVydCggbWF0ZXJpYWwuZGlmZnVzZUNvbG9yICk7XG5cbiAgICAvLyBkaXJlY3RTcGVjdWxhciB3aWxsIGJlIHVzZWQgZm9yIHJpbSBsaWdodGluZywgbm90IGFuIGFjdHVhbCBzcGVjdWxhclxuICAgIHJlZmxlY3RlZExpZ2h0LmRpcmVjdFNwZWN1bGFyICs9IGlycmFkaWFuY2U7XG4gIH1cbiNlbHNlXG4gIHZvaWQgUkVfRGlyZWN0X01Ub29uKCBjb25zdCBpbiBJbmNpZGVudExpZ2h0IGRpcmVjdExpZ2h0LCBjb25zdCBpbiBHZW9tZXRyaWNDb250ZXh0IGdlb21ldHJ5LCBjb25zdCBpbiBNVG9vbk1hdGVyaWFsIG1hdGVyaWFsLCBjb25zdCBpbiBmbG9hdCBzaGFkb3csIGlub3V0IFJlZmxlY3RlZExpZ2h0IHJlZmxlY3RlZExpZ2h0ICkge1xuICAgIGZsb2F0IGRvdE5MID0gY2xhbXAoIGRvdCggZ2VvbWV0cnkubm9ybWFsLCBkaXJlY3RMaWdodC5kaXJlY3Rpb24gKSwgLTEuMCwgMS4wICk7XG4gICAgdmVjMyBpcnJhZGlhbmNlID0gZGlyZWN0TGlnaHQuY29sb3I7XG5cbiAgICAvLyBkaXJlY3RTcGVjdWxhciB3aWxsIGJlIHVzZWQgZm9yIHJpbSBsaWdodGluZywgbm90IGFuIGFjdHVhbCBzcGVjdWxhclxuICAgIHJlZmxlY3RlZExpZ2h0LmRpcmVjdFNwZWN1bGFyICs9IGlycmFkaWFuY2U7XG5cbiAgICBpcnJhZGlhbmNlICo9IGRvdE5MO1xuXG4gICAgZmxvYXQgc2hhZGluZyA9IGdldFNoYWRpbmcoIGRvdE5MLCBzaGFkb3csIG1hdGVyaWFsLnNoYWRpbmdTaGlmdCApO1xuXG4gICAgLy8gdG9vbiBzaGFkZWQgZGlmZnVzZVxuICAgIHJlZmxlY3RlZExpZ2h0LmRpcmVjdERpZmZ1c2UgKz0gZ2V0RGlmZnVzZSggbWF0ZXJpYWwsIHNoYWRpbmcsIGRpcmVjdExpZ2h0LmNvbG9yICk7XG4gIH1cblxuICB2b2lkIFJFX0luZGlyZWN0RGlmZnVzZV9NVG9vbiggY29uc3QgaW4gdmVjMyBpcnJhZGlhbmNlLCBjb25zdCBpbiBHZW9tZXRyaWNDb250ZXh0IGdlb21ldHJ5LCBjb25zdCBpbiBNVG9vbk1hdGVyaWFsIG1hdGVyaWFsLCBpbm91dCBSZWZsZWN0ZWRMaWdodCByZWZsZWN0ZWRMaWdodCApIHtcbiAgICAvLyBpbmRpcmVjdCBkaWZmdXNlIHdpbGwgdXNlIGRpZmZ1c2VDb2xvciwgbm8gc2hhZGVDb2xvciBpbnZvbHZlZFxuICAgIHJlZmxlY3RlZExpZ2h0LmluZGlyZWN0RGlmZnVzZSArPSBpcnJhZGlhbmNlICogQlJERl9MYW1iZXJ0KCBtYXRlcmlhbC5kaWZmdXNlQ29sb3IgKTtcblxuICAgIC8vIGRpcmVjdFNwZWN1bGFyIHdpbGwgYmUgdXNlZCBmb3IgcmltIGxpZ2h0aW5nLCBub3QgYW4gYWN0dWFsIHNwZWN1bGFyXG4gICAgcmVmbGVjdGVkTGlnaHQuZGlyZWN0U3BlY3VsYXIgKz0gaXJyYWRpYW5jZTtcbiAgfVxuI2VuZGlmXG5cbiNkZWZpbmUgUkVfRGlyZWN0IFJFX0RpcmVjdF9NVG9vblxuI2RlZmluZSBSRV9JbmRpcmVjdERpZmZ1c2UgUkVfSW5kaXJlY3REaWZmdXNlX01Ub29uXG4jZGVmaW5lIE1hdGVyaWFsX0xpZ2h0UHJvYmVMT0QoIG1hdGVyaWFsICkgKDApXG5cbiNpbmNsdWRlIDxzaGFkb3dtYXBfcGFyc19mcmFnbWVudD5cbi8vICNpbmNsdWRlIDxidW1wbWFwX3BhcnNfZnJhZ21lbnQ+XG5cbi8vICNpbmNsdWRlIDxub3JtYWxtYXBfcGFyc19mcmFnbWVudD5cbiNpZmRlZiBVU0VfTk9STUFMTUFQXG5cbiAgdW5pZm9ybSBzYW1wbGVyMkQgbm9ybWFsTWFwO1xuICB1bmlmb3JtIG1hdDMgbm9ybWFsTWFwVXZUcmFuc2Zvcm07XG4gIHVuaWZvcm0gdmVjMiBub3JtYWxTY2FsZTtcblxuI2VuZGlmXG5cbi8vIENPTVBBVDogcHJlLXIxNTFcbi8vIFVTRV9OT1JNQUxNQVBfT0JKRUNUU1BBQ0UgdXNlZCB0byBiZSBPQkpFQ1RTUEFDRV9OT1JNQUxNQVAgaW4gcHJlLXIxNTFcbiNpZiBkZWZpbmVkKCBVU0VfTk9STUFMTUFQX09CSkVDVFNQQUNFICkgfHwgZGVmaW5lZCggT0JKRUNUU1BBQ0VfTk9STUFMTUFQIClcblxuICB1bmlmb3JtIG1hdDMgbm9ybWFsTWF0cml4O1xuXG4jZW5kaWZcblxuLy8gQ09NUEFUOiBwcmUtcjE1MVxuLy8gVVNFX05PUk1BTE1BUF9UQU5HRU5UU1BBQ0UgdXNlZCB0byBiZSBUQU5HRU5UU1BBQ0VfTk9STUFMTUFQIGluIHByZS1yMTUxXG4jaWYgISBkZWZpbmVkICggVVNFX1RBTkdFTlQgKSAmJiAoIGRlZmluZWQgKCBVU0VfTk9STUFMTUFQX1RBTkdFTlRTUEFDRSApIHx8IGRlZmluZWQgKCBUQU5HRU5UU1BBQ0VfTk9STUFMTUFQICkgKVxuXG4gIC8vIFBlci1QaXhlbCBUYW5nZW50IFNwYWNlIE5vcm1hbCBNYXBwaW5nXG4gIC8vIGh0dHA6Ly9oYWNrc29mbGlmZS5ibG9nc3BvdC5jaC8yMDA5LzExL3Blci1waXhlbC10YW5nZW50LXNwYWNlLW5vcm1hbC1tYXBwaW5nLmh0bWxcblxuICAvLyB0aHJlZS12cm0gc3BlY2lmaWMgY2hhbmdlOiBpdCByZXF1aXJlcyBgdXZgIGFzIGFuIGlucHV0IGluIG9yZGVyIHRvIHN1cHBvcnQgdXYgc2Nyb2xsc1xuXG4gIC8vIFRlbXBvcmFyeSBjb21wYXQgYWdhaW5zdCBzaGFkZXIgY2hhbmdlIEAgVGhyZWUuanMgcjEyNiwgcjE1MVxuICAjaWYgVEhSRUVfVlJNX1RIUkVFX1JFVklTSU9OID49IDE1MVxuXG4gICAgbWF0MyBnZXRUYW5nZW50RnJhbWUoIHZlYzMgZXllX3BvcywgdmVjMyBzdXJmX25vcm0sIHZlYzIgdXYgKSB7XG5cbiAgICAgIHZlYzMgcTAgPSBkRmR4KCBleWVfcG9zLnh5eiApO1xuICAgICAgdmVjMyBxMSA9IGRGZHkoIGV5ZV9wb3MueHl6ICk7XG4gICAgICB2ZWMyIHN0MCA9IGRGZHgoIHV2LnN0ICk7XG4gICAgICB2ZWMyIHN0MSA9IGRGZHkoIHV2LnN0ICk7XG5cbiAgICAgIHZlYzMgTiA9IHN1cmZfbm9ybTtcblxuICAgICAgdmVjMyBxMXBlcnAgPSBjcm9zcyggcTEsIE4gKTtcbiAgICAgIHZlYzMgcTBwZXJwID0gY3Jvc3MoIE4sIHEwICk7XG5cbiAgICAgIHZlYzMgVCA9IHExcGVycCAqIHN0MC54ICsgcTBwZXJwICogc3QxLng7XG4gICAgICB2ZWMzIEIgPSBxMXBlcnAgKiBzdDAueSArIHEwcGVycCAqIHN0MS55O1xuXG4gICAgICBmbG9hdCBkZXQgPSBtYXgoIGRvdCggVCwgVCApLCBkb3QoIEIsIEIgKSApO1xuICAgICAgZmxvYXQgc2NhbGUgPSAoIGRldCA9PSAwLjAgKSA/IDAuMCA6IGludmVyc2VzcXJ0KCBkZXQgKTtcblxuICAgICAgcmV0dXJuIG1hdDMoIFQgKiBzY2FsZSwgQiAqIHNjYWxlLCBOICk7XG5cbiAgICB9XG5cbiAgI2Vsc2VcblxuICAgIHZlYzMgcGVydHVyYk5vcm1hbDJBcmIoIHZlYzIgdXYsIHZlYzMgZXllX3BvcywgdmVjMyBzdXJmX25vcm0sIHZlYzMgbWFwTiwgZmxvYXQgZmFjZURpcmVjdGlvbiApIHtcblxuICAgICAgdmVjMyBxMCA9IHZlYzMoIGRGZHgoIGV5ZV9wb3MueCApLCBkRmR4KCBleWVfcG9zLnkgKSwgZEZkeCggZXllX3Bvcy56ICkgKTtcbiAgICAgIHZlYzMgcTEgPSB2ZWMzKCBkRmR5KCBleWVfcG9zLnggKSwgZEZkeSggZXllX3Bvcy55ICksIGRGZHkoIGV5ZV9wb3MueiApICk7XG4gICAgICB2ZWMyIHN0MCA9IGRGZHgoIHV2LnN0ICk7XG4gICAgICB2ZWMyIHN0MSA9IGRGZHkoIHV2LnN0ICk7XG5cbiAgICAgIHZlYzMgTiA9IG5vcm1hbGl6ZSggc3VyZl9ub3JtICk7XG5cbiAgICAgIHZlYzMgcTFwZXJwID0gY3Jvc3MoIHExLCBOICk7XG4gICAgICB2ZWMzIHEwcGVycCA9IGNyb3NzKCBOLCBxMCApO1xuXG4gICAgICB2ZWMzIFQgPSBxMXBlcnAgKiBzdDAueCArIHEwcGVycCAqIHN0MS54O1xuICAgICAgdmVjMyBCID0gcTFwZXJwICogc3QwLnkgKyBxMHBlcnAgKiBzdDEueTtcblxuICAgICAgLy8gdGhyZWUtdnJtIHNwZWNpZmljIGNoYW5nZTogV29ya2Fyb3VuZCBmb3IgdGhlIGlzc3VlIHRoYXQgaGFwcGVucyB3aGVuIGRlbHRhIG9mIHV2ID0gMC4wXG4gICAgICAvLyBUT0RPOiBJcyB0aGlzIHN0aWxsIHJlcXVpcmVkPyBPciBzaGFsbCBJIG1ha2UgYSBQUiBhYm91dCBpdD9cbiAgICAgIGlmICggbGVuZ3RoKCBUICkgPT0gMC4wIHx8IGxlbmd0aCggQiApID09IDAuMCApIHtcbiAgICAgICAgcmV0dXJuIHN1cmZfbm9ybTtcbiAgICAgIH1cblxuICAgICAgZmxvYXQgZGV0ID0gbWF4KCBkb3QoIFQsIFQgKSwgZG90KCBCLCBCICkgKTtcbiAgICAgIGZsb2F0IHNjYWxlID0gKCBkZXQgPT0gMC4wICkgPyAwLjAgOiBmYWNlRGlyZWN0aW9uICogaW52ZXJzZXNxcnQoIGRldCApO1xuXG4gICAgICByZXR1cm4gbm9ybWFsaXplKCBUICogKCBtYXBOLnggKiBzY2FsZSApICsgQiAqICggbWFwTi55ICogc2NhbGUgKSArIE4gKiBtYXBOLnogKTtcblxuICAgIH1cblxuICAjZW5kaWZcblxuI2VuZGlmXG5cbi8vICNpbmNsdWRlIDxzcGVjdWxhcm1hcF9wYXJzX2ZyYWdtZW50PlxuI2luY2x1ZGUgPGxvZ2RlcHRoYnVmX3BhcnNfZnJhZ21lbnQ+XG4jaW5jbHVkZSA8Y2xpcHBpbmdfcGxhbmVzX3BhcnNfZnJhZ21lbnQ+XG5cbi8vID09IHBvc3QgY29ycmVjdGlvbiA9PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09XG52b2lkIHBvc3RDb3JyZWN0aW9uKCkge1xuICAjaW5jbHVkZSA8dG9uZW1hcHBpbmdfZnJhZ21lbnQ+XG4gICNpbmNsdWRlIDxjb2xvcnNwYWNlX2ZyYWdtZW50PlxuICAjaW5jbHVkZSA8Zm9nX2ZyYWdtZW50PlxuICAjaW5jbHVkZSA8cHJlbXVsdGlwbGllZF9hbHBoYV9mcmFnbWVudD5cbiAgI2luY2x1ZGUgPGRpdGhlcmluZ19mcmFnbWVudD5cbn1cblxuLy8gPT0gbWFpbiBwcm9jZWR1cmUgPT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT1cbnZvaWQgbWFpbigpIHtcbiAgI2luY2x1ZGUgPGNsaXBwaW5nX3BsYW5lc19mcmFnbWVudD5cblxuICB2ZWMyIHV2ID0gdmVjMigwLjUsIDAuNSk7XG5cbiAgI2lmICggZGVmaW5lZCggTVRPT05fVVNFX1VWICkgJiYgIWRlZmluZWQoIE1UT09OX1VWU19WRVJURVhfT05MWSApIClcbiAgICB1diA9IHZVdjtcblxuICAgIGZsb2F0IHV2QW5pbU1hc2sgPSAxLjA7XG4gICAgI2lmZGVmIFVTRV9VVkFOSU1BVElPTk1BU0tURVhUVVJFXG4gICAgICB2ZWMyIHV2QW5pbWF0aW9uTWFza1RleHR1cmVVdiA9ICggdXZBbmltYXRpb25NYXNrVGV4dHVyZVV2VHJhbnNmb3JtICogdmVjMyggdXYsIDEgKSApLnh5O1xuICAgICAgdXZBbmltTWFzayA9IHRleHR1cmUyRCggdXZBbmltYXRpb25NYXNrVGV4dHVyZSwgdXZBbmltYXRpb25NYXNrVGV4dHVyZVV2ICkuYjtcbiAgICAjZW5kaWZcblxuICAgIGZsb2F0IHV2Um90Q29zID0gY29zKCB1dkFuaW1hdGlvblJvdGF0aW9uUGhhc2UgKiB1dkFuaW1NYXNrICk7XG4gICAgZmxvYXQgdXZSb3RTaW4gPSBzaW4oIHV2QW5pbWF0aW9uUm90YXRpb25QaGFzZSAqIHV2QW5pbU1hc2sgKTtcbiAgICB1diA9IG1hdDIoIHV2Um90Q29zLCAtdXZSb3RTaW4sIHV2Um90U2luLCB1dlJvdENvcyApICogKCB1diAtIDAuNSApICsgMC41O1xuICAgIHV2ID0gdXYgKyB2ZWMyKCB1dkFuaW1hdGlvblNjcm9sbFhPZmZzZXQsIHV2QW5pbWF0aW9uU2Nyb2xsWU9mZnNldCApICogdXZBbmltTWFzaztcbiAgI2VuZGlmXG5cbiAgI2lmZGVmIERFQlVHX1VWXG4gICAgZ2xfRnJhZ0NvbG9yID0gdmVjNCggMC4wLCAwLjAsIDAuMCwgMS4wICk7XG4gICAgI2lmICggZGVmaW5lZCggTVRPT05fVVNFX1VWICkgJiYgIWRlZmluZWQoIE1UT09OX1VWU19WRVJURVhfT05MWSApIClcbiAgICAgIGdsX0ZyYWdDb2xvciA9IHZlYzQoIHV2LCAwLjAsIDEuMCApO1xuICAgICNlbmRpZlxuICAgIHJldHVybjtcbiAgI2VuZGlmXG5cbiAgdmVjNCBkaWZmdXNlQ29sb3IgPSB2ZWM0KCBsaXRGYWN0b3IsIG9wYWNpdHkgKTtcbiAgUmVmbGVjdGVkTGlnaHQgcmVmbGVjdGVkTGlnaHQgPSBSZWZsZWN0ZWRMaWdodCggdmVjMyggMC4wICksIHZlYzMoIDAuMCApLCB2ZWMzKCAwLjAgKSwgdmVjMyggMC4wICkgKTtcbiAgdmVjMyB0b3RhbEVtaXNzaXZlUmFkaWFuY2UgPSBlbWlzc2l2ZSAqIGVtaXNzaXZlSW50ZW5zaXR5O1xuXG4gICNpbmNsdWRlIDxsb2dkZXB0aGJ1Zl9mcmFnbWVudD5cblxuICAvLyAjaW5jbHVkZSA8bWFwX2ZyYWdtZW50PlxuICAjaWZkZWYgVVNFX01BUFxuICAgIHZlYzIgbWFwVXYgPSAoIG1hcFV2VHJhbnNmb3JtICogdmVjMyggdXYsIDEgKSApLnh5O1xuICAgIHZlYzQgc2FtcGxlZERpZmZ1c2VDb2xvciA9IHRleHR1cmUyRCggbWFwLCBtYXBVdiApO1xuICAgICNpZmRlZiBERUNPREVfVklERU9fVEVYVFVSRVxuICAgICAgc2FtcGxlZERpZmZ1c2VDb2xvciA9IHZlYzQoIG1peCggcG93KCBzYW1wbGVkRGlmZnVzZUNvbG9yLnJnYiAqIDAuOTQ3ODY3Mjk4NiArIHZlYzMoIDAuMDUyMTMyNzAxNCApLCB2ZWMzKCAyLjQgKSApLCBzYW1wbGVkRGlmZnVzZUNvbG9yLnJnYiAqIDAuMDc3Mzk5MzgwOCwgdmVjMyggbGVzc1RoYW5FcXVhbCggc2FtcGxlZERpZmZ1c2VDb2xvci5yZ2IsIHZlYzMoIDAuMDQwNDUgKSApICkgKSwgc2FtcGxlZERpZmZ1c2VDb2xvci53ICk7XG4gICAgI2VuZGlmXG4gICAgZGlmZnVzZUNvbG9yICo9IHNhbXBsZWREaWZmdXNlQ29sb3I7XG4gICNlbmRpZlxuXG4gIC8vICNpbmNsdWRlIDxjb2xvcl9mcmFnbWVudD5cbiAgI2lmICggZGVmaW5lZCggVVNFX0NPTE9SICkgJiYgIWRlZmluZWQoIElHTk9SRV9WRVJURVhfQ09MT1IgKSApXG4gICAgZGlmZnVzZUNvbG9yLnJnYiAqPSB2Q29sb3I7XG4gICNlbmRpZlxuXG4gIC8vICNpbmNsdWRlIDxhbHBoYW1hcF9mcmFnbWVudD5cblxuICAjaW5jbHVkZSA8YWxwaGF0ZXN0X2ZyYWdtZW50PlxuXG4gIC8vICNpbmNsdWRlIDxzcGVjdWxhcm1hcF9mcmFnbWVudD5cblxuICAvLyAjaW5jbHVkZSA8bm9ybWFsX2ZyYWdtZW50X2JlZ2luPlxuICBmbG9hdCBmYWNlRGlyZWN0aW9uID0gZ2xfRnJvbnRGYWNpbmcgPyAxLjAgOiAtMS4wO1xuXG4gICNpZmRlZiBGTEFUX1NIQURFRFxuXG4gICAgdmVjMyBmZHggPSBkRmR4KCB2Vmlld1Bvc2l0aW9uICk7XG4gICAgdmVjMyBmZHkgPSBkRmR5KCB2Vmlld1Bvc2l0aW9uICk7XG4gICAgdmVjMyBub3JtYWwgPSBub3JtYWxpemUoIGNyb3NzKCBmZHgsIGZkeSApICk7XG5cbiAgI2Vsc2VcblxuICAgIHZlYzMgbm9ybWFsID0gbm9ybWFsaXplKCB2Tm9ybWFsICk7XG5cbiAgICAjaWZkZWYgRE9VQkxFX1NJREVEXG5cbiAgICAgIG5vcm1hbCAqPSBmYWNlRGlyZWN0aW9uO1xuXG4gICAgI2VuZGlmXG5cbiAgI2VuZGlmXG5cbiAgI2lmZGVmIFVTRV9OT1JNQUxNQVBcblxuICAgIHZlYzIgbm9ybWFsTWFwVXYgPSAoIG5vcm1hbE1hcFV2VHJhbnNmb3JtICogdmVjMyggdXYsIDEgKSApLnh5O1xuXG4gICNlbmRpZlxuXG4gICNpZmRlZiBVU0VfTk9STUFMTUFQX1RBTkdFTlRTUEFDRVxuXG4gICAgI2lmZGVmIFVTRV9UQU5HRU5UXG5cbiAgICAgIG1hdDMgdGJuID0gbWF0Myggbm9ybWFsaXplKCB2VGFuZ2VudCApLCBub3JtYWxpemUoIHZCaXRhbmdlbnQgKSwgbm9ybWFsICk7XG5cbiAgICAjZWxzZVxuXG4gICAgICBtYXQzIHRibiA9IGdldFRhbmdlbnRGcmFtZSggLSB2Vmlld1Bvc2l0aW9uLCBub3JtYWwsIG5vcm1hbE1hcFV2ICk7XG5cbiAgICAjZW5kaWZcblxuICAgICNpZiBkZWZpbmVkKCBET1VCTEVfU0lERUQgKSAmJiAhIGRlZmluZWQoIEZMQVRfU0hBREVEIClcblxuICAgICAgdGJuWzBdICo9IGZhY2VEaXJlY3Rpb247XG4gICAgICB0Ym5bMV0gKj0gZmFjZURpcmVjdGlvbjtcblxuICAgICNlbmRpZlxuXG4gICNlbmRpZlxuXG4gICNpZmRlZiBVU0VfQ0xFQVJDT0FUX05PUk1BTE1BUFxuXG4gICAgI2lmZGVmIFVTRV9UQU5HRU5UXG5cbiAgICAgIG1hdDMgdGJuMiA9IG1hdDMoIG5vcm1hbGl6ZSggdlRhbmdlbnQgKSwgbm9ybWFsaXplKCB2Qml0YW5nZW50ICksIG5vcm1hbCApO1xuXG4gICAgI2Vsc2VcblxuICAgICAgbWF0MyB0Ym4yID0gZ2V0VGFuZ2VudEZyYW1lKCAtIHZWaWV3UG9zaXRpb24sIG5vcm1hbCwgdkNsZWFyY29hdE5vcm1hbE1hcFV2ICk7XG5cbiAgICAjZW5kaWZcblxuICAgICNpZiBkZWZpbmVkKCBET1VCTEVfU0lERUQgKSAmJiAhIGRlZmluZWQoIEZMQVRfU0hBREVEIClcblxuICAgICAgdGJuMlswXSAqPSBmYWNlRGlyZWN0aW9uO1xuICAgICAgdGJuMlsxXSAqPSBmYWNlRGlyZWN0aW9uO1xuXG4gICAgI2VuZGlmXG5cbiAgI2VuZGlmXG5cbiAgLy8gbm9uIHBlcnR1cmJlZCBub3JtYWwgZm9yIGNsZWFyY29hdCBhbW9uZyBvdGhlcnNcblxuICB2ZWMzIG5vblBlcnR1cmJlZE5vcm1hbCA9IG5vcm1hbDtcblxuICAjaWZkZWYgT1VUTElORVxuICAgIG5vcm1hbCAqPSAtMS4wO1xuICAjZW5kaWZcblxuICAvLyAjaW5jbHVkZSA8bm9ybWFsX2ZyYWdtZW50X21hcHM+XG5cbiAgLy8gQ09NUEFUOiBwcmUtcjE1MVxuICAvLyBVU0VfTk9STUFMTUFQX09CSkVDVFNQQUNFIHVzZWQgdG8gYmUgT0JKRUNUU1BBQ0VfTk9STUFMTUFQIGluIHByZS1yMTUxXG4gICNpZiBkZWZpbmVkKCBVU0VfTk9STUFMTUFQX09CSkVDVFNQQUNFICkgfHwgZGVmaW5lZCggT0JKRUNUU1BBQ0VfTk9STUFMTUFQIClcblxuICAgIG5vcm1hbCA9IHRleHR1cmUyRCggbm9ybWFsTWFwLCBub3JtYWxNYXBVdiApLnh5eiAqIDIuMCAtIDEuMDsgLy8gb3ZlcnJpZGVzIGJvdGggZmxhdFNoYWRpbmcgYW5kIGF0dHJpYnV0ZSBub3JtYWxzXG5cbiAgICAjaWZkZWYgRkxJUF9TSURFRFxuXG4gICAgICBub3JtYWwgPSAtIG5vcm1hbDtcblxuICAgICNlbmRpZlxuXG4gICAgI2lmZGVmIERPVUJMRV9TSURFRFxuXG4gICAgICBub3JtYWwgPSBub3JtYWwgKiBmYWNlRGlyZWN0aW9uO1xuXG4gICAgI2VuZGlmXG5cbiAgICBub3JtYWwgPSBub3JtYWxpemUoIG5vcm1hbE1hdHJpeCAqIG5vcm1hbCApO1xuXG4gIC8vIENPTVBBVDogcHJlLXIxNTFcbiAgLy8gVVNFX05PUk1BTE1BUF9UQU5HRU5UU1BBQ0UgdXNlZCB0byBiZSBUQU5HRU5UU1BBQ0VfTk9STUFMTUFQIGluIHByZS1yMTUxXG4gICNlbGlmIGRlZmluZWQoIFVTRV9OT1JNQUxNQVBfVEFOR0VOVFNQQUNFICkgfHwgZGVmaW5lZCggVEFOR0VOVFNQQUNFX05PUk1BTE1BUCApXG5cbiAgICB2ZWMzIG1hcE4gPSB0ZXh0dXJlMkQoIG5vcm1hbE1hcCwgbm9ybWFsTWFwVXYgKS54eXogKiAyLjAgLSAxLjA7XG4gICAgbWFwTi54eSAqPSBub3JtYWxTY2FsZTtcblxuICAgIC8vIENPTVBBVDogcHJlLXIxNTFcbiAgICAjaWYgVEhSRUVfVlJNX1RIUkVFX1JFVklTSU9OID49IDE1MSB8fCBkZWZpbmVkKCBVU0VfVEFOR0VOVCApXG5cbiAgICAgIG5vcm1hbCA9IG5vcm1hbGl6ZSggdGJuICogbWFwTiApO1xuXG4gICAgI2Vsc2VcblxuICAgICAgbm9ybWFsID0gcGVydHVyYk5vcm1hbDJBcmIoIHV2LCAtdlZpZXdQb3NpdGlvbiwgbm9ybWFsLCBtYXBOLCBmYWNlRGlyZWN0aW9uICk7XG5cbiAgICAjZW5kaWZcblxuICAjZW5kaWZcblxuICAvLyAjaW5jbHVkZSA8ZW1pc3NpdmVtYXBfZnJhZ21lbnQ+XG4gICNpZmRlZiBVU0VfRU1JU1NJVkVNQVBcbiAgICB2ZWMyIGVtaXNzaXZlTWFwVXYgPSAoIGVtaXNzaXZlTWFwVXZUcmFuc2Zvcm0gKiB2ZWMzKCB1diwgMSApICkueHk7XG4gICAgdG90YWxFbWlzc2l2ZVJhZGlhbmNlICo9IHRleHR1cmUyRCggZW1pc3NpdmVNYXAsIGVtaXNzaXZlTWFwVXYgKS5yZ2I7XG4gICNlbmRpZlxuXG4gICNpZmRlZiBERUJVR19OT1JNQUxcbiAgICBnbF9GcmFnQ29sb3IgPSB2ZWM0KCAwLjUgKyAwLjUgKiBub3JtYWwsIDEuMCApO1xuICAgIHJldHVybjtcbiAgI2VuZGlmXG5cbiAgLy8gLS0gTVRvb246IGxpZ2h0aW5nIC0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tXG4gIC8vIGFjY3VtdWxhdGlvblxuICAvLyAjaW5jbHVkZSA8bGlnaHRzX3Bob25nX2ZyYWdtZW50PlxuICBNVG9vbk1hdGVyaWFsIG1hdGVyaWFsO1xuXG4gIG1hdGVyaWFsLmRpZmZ1c2VDb2xvciA9IGRpZmZ1c2VDb2xvci5yZ2I7XG5cbiAgbWF0ZXJpYWwuc2hhZGVDb2xvciA9IHNoYWRlQ29sb3JGYWN0b3I7XG4gICNpZmRlZiBVU0VfU0hBREVNVUxUSVBMWVRFWFRVUkVcbiAgICB2ZWMyIHNoYWRlTXVsdGlwbHlUZXh0dXJlVXYgPSAoIHNoYWRlTXVsdGlwbHlUZXh0dXJlVXZUcmFuc2Zvcm0gKiB2ZWMzKCB1diwgMSApICkueHk7XG4gICAgbWF0ZXJpYWwuc2hhZGVDb2xvciAqPSB0ZXh0dXJlMkQoIHNoYWRlTXVsdGlwbHlUZXh0dXJlLCBzaGFkZU11bHRpcGx5VGV4dHVyZVV2ICkucmdiO1xuICAjZW5kaWZcblxuICAjaWYgKCBkZWZpbmVkKCBVU0VfQ09MT1IgKSAmJiAhZGVmaW5lZCggSUdOT1JFX1ZFUlRFWF9DT0xPUiApIClcbiAgICBtYXRlcmlhbC5zaGFkZUNvbG9yLnJnYiAqPSB2Q29sb3I7XG4gICNlbmRpZlxuXG4gIG1hdGVyaWFsLnNoYWRpbmdTaGlmdCA9IHNoYWRpbmdTaGlmdEZhY3RvcjtcbiAgI2lmZGVmIFVTRV9TSEFESU5HU0hJRlRURVhUVVJFXG4gICAgdmVjMiBzaGFkaW5nU2hpZnRUZXh0dXJlVXYgPSAoIHNoYWRpbmdTaGlmdFRleHR1cmVVdlRyYW5zZm9ybSAqIHZlYzMoIHV2LCAxICkgKS54eTtcbiAgICBtYXRlcmlhbC5zaGFkaW5nU2hpZnQgKz0gdGV4dHVyZTJEKCBzaGFkaW5nU2hpZnRUZXh0dXJlLCBzaGFkaW5nU2hpZnRUZXh0dXJlVXYgKS5yICogc2hhZGluZ1NoaWZ0VGV4dHVyZVNjYWxlO1xuICAjZW5kaWZcblxuICAvLyAjaW5jbHVkZSA8bGlnaHRzX2ZyYWdtZW50X2JlZ2luPlxuXG4gIC8vIE1Ub29uIFNwZWNpZmljIGNoYW5nZXM6XG4gIC8vIFNpbmNlIHdlIHdhbnQgdG8gdGFrZSBzaGFkb3dzIGludG8gYWNjb3VudCBvZiBzaGFkaW5nIGluc3RlYWQgb2YgaXJyYWRpYW5jZSxcbiAgLy8gd2UgaGFkIHRvIG1vZGlmeSB0aGUgY29kZXMgdGhhdCBtdWx0aXBsaWVzIHRoZSByZXN1bHRzIG9mIHNoYWRvd21hcCBpbnRvIGNvbG9yIG9mIGRpcmVjdCBsaWdodHMuXG5cbiAgLy8gQ09NUEFUOiBwcmUtcjE1NiB1c2VzIGEgc3RydWN0IEdlb21ldHJpY0NvbnRleHRcbiAgI2lmIFRIUkVFX1ZSTV9USFJFRV9SRVZJU0lPTiA+PSAxNTdcbiAgICB2ZWMzIGdlb21ldHJ5UG9zaXRpb24gPSAtIHZWaWV3UG9zaXRpb247XG4gICAgdmVjMyBnZW9tZXRyeU5vcm1hbCA9IG5vcm1hbDtcbiAgICB2ZWMzIGdlb21ldHJ5Vmlld0RpciA9ICggaXNPcnRob2dyYXBoaWMgKSA/IHZlYzMoIDAsIDAsIDEgKSA6IG5vcm1hbGl6ZSggdlZpZXdQb3NpdGlvbiApO1xuXG4gICAgdmVjMyBnZW9tZXRyeUNsZWFyY29hdE5vcm1hbDtcblxuICAgICNpZmRlZiBVU0VfQ0xFQVJDT0FUXG5cbiAgICAgIGdlb21ldHJ5Q2xlYXJjb2F0Tm9ybWFsID0gY2xlYXJjb2F0Tm9ybWFsO1xuXG4gICAgI2VuZGlmXG4gICNlbHNlXG4gICAgR2VvbWV0cmljQ29udGV4dCBnZW9tZXRyeTtcblxuICAgIGdlb21ldHJ5LnBvc2l0aW9uID0gLSB2Vmlld1Bvc2l0aW9uO1xuICAgIGdlb21ldHJ5Lm5vcm1hbCA9IG5vcm1hbDtcbiAgICBnZW9tZXRyeS52aWV3RGlyID0gKCBpc09ydGhvZ3JhcGhpYyApID8gdmVjMyggMCwgMCwgMSApIDogbm9ybWFsaXplKCB2Vmlld1Bvc2l0aW9uICk7XG5cbiAgICAjaWZkZWYgVVNFX0NMRUFSQ09BVFxuXG4gICAgICBnZW9tZXRyeS5jbGVhcmNvYXROb3JtYWwgPSBjbGVhcmNvYXROb3JtYWw7XG5cbiAgICAjZW5kaWZcbiAgI2VuZGlmXG5cbiAgSW5jaWRlbnRMaWdodCBkaXJlY3RMaWdodDtcblxuICAvLyBzaW5jZSB0aGVzZSB2YXJpYWJsZXMgd2lsbCBiZSB1c2VkIGluIHVucm9sbGVkIGxvb3AsIHdlIGhhdmUgdG8gZGVmaW5lIGluIHByaW9yXG4gIGZsb2F0IHNoYWRvdztcblxuICAjaWYgKCBOVU1fUE9JTlRfTElHSFRTID4gMCApICYmIGRlZmluZWQoIFJFX0RpcmVjdCApXG5cbiAgICBQb2ludExpZ2h0IHBvaW50TGlnaHQ7XG4gICAgI2lmIGRlZmluZWQoIFVTRV9TSEFET1dNQVAgKSAmJiBOVU1fUE9JTlRfTElHSFRfU0hBRE9XUyA+IDBcbiAgICBQb2ludExpZ2h0U2hhZG93IHBvaW50TGlnaHRTaGFkb3c7XG4gICAgI2VuZGlmXG5cbiAgICAjcHJhZ21hIHVucm9sbF9sb29wX3N0YXJ0XG4gICAgZm9yICggaW50IGkgPSAwOyBpIDwgTlVNX1BPSU5UX0xJR0hUUzsgaSArKyApIHtcblxuICAgICAgcG9pbnRMaWdodCA9IHBvaW50TGlnaHRzWyBpIF07XG5cbiAgICAgIC8vIENPTVBBVDogcHJlLXIxNTYgdXNlcyBhIHN0cnVjdCBHZW9tZXRyaWNDb250ZXh0XG4gICAgICAjaWYgVEhSRUVfVlJNX1RIUkVFX1JFVklTSU9OID49IDE1N1xuICAgICAgICBnZXRQb2ludExpZ2h0SW5mbyggcG9pbnRMaWdodCwgZ2VvbWV0cnlQb3NpdGlvbiwgZGlyZWN0TGlnaHQgKTtcbiAgICAgICNlbHNlXG4gICAgICAgIGdldFBvaW50TGlnaHRJbmZvKCBwb2ludExpZ2h0LCBnZW9tZXRyeSwgZGlyZWN0TGlnaHQgKTtcbiAgICAgICNlbmRpZlxuXG4gICAgICBzaGFkb3cgPSAxLjA7XG4gICAgICAjaWYgZGVmaW5lZCggVVNFX1NIQURPV01BUCApICYmICggVU5ST0xMRURfTE9PUF9JTkRFWCA8IE5VTV9QT0lOVF9MSUdIVF9TSEFET1dTIClcbiAgICAgIHBvaW50TGlnaHRTaGFkb3cgPSBwb2ludExpZ2h0U2hhZG93c1sgaSBdO1xuICAgICAgLy8gQ09NUEFUOiBwcmUtcjE2NlxuICAgICAgLy8gcjE2NiBpbnRyb2R1Y2VkIHNoYWRvd0ludGVuc2l0eVxuICAgICAgI2lmIFRIUkVFX1ZSTV9USFJFRV9SRVZJU0lPTiA+PSAxNjZcbiAgICAgICAgc2hhZG93ID0gYWxsKCBidmVjMiggZGlyZWN0TGlnaHQudmlzaWJsZSwgcmVjZWl2ZVNoYWRvdyApICkgPyBnZXRQb2ludFNoYWRvdyggcG9pbnRTaGFkb3dNYXBbIGkgXSwgcG9pbnRMaWdodFNoYWRvdy5zaGFkb3dNYXBTaXplLCBwb2ludExpZ2h0U2hhZG93LnNoYWRvd0ludGVuc2l0eSwgcG9pbnRMaWdodFNoYWRvdy5zaGFkb3dCaWFzLCBwb2ludExpZ2h0U2hhZG93LnNoYWRvd1JhZGl1cywgdlBvaW50U2hhZG93Q29vcmRbIGkgXSwgcG9pbnRMaWdodFNoYWRvdy5zaGFkb3dDYW1lcmFOZWFyLCBwb2ludExpZ2h0U2hhZG93LnNoYWRvd0NhbWVyYUZhciApIDogMS4wO1xuICAgICAgI2Vsc2VcbiAgICAgICAgc2hhZG93ID0gYWxsKCBidmVjMiggZGlyZWN0TGlnaHQudmlzaWJsZSwgcmVjZWl2ZVNoYWRvdyApICkgPyBnZXRQb2ludFNoYWRvdyggcG9pbnRTaGFkb3dNYXBbIGkgXSwgcG9pbnRMaWdodFNoYWRvdy5zaGFkb3dNYXBTaXplLCBwb2ludExpZ2h0U2hhZG93LnNoYWRvd0JpYXMsIHBvaW50TGlnaHRTaGFkb3cuc2hhZG93UmFkaXVzLCB2UG9pbnRTaGFkb3dDb29yZFsgaSBdLCBwb2ludExpZ2h0U2hhZG93LnNoYWRvd0NhbWVyYU5lYXIsIHBvaW50TGlnaHRTaGFkb3cuc2hhZG93Q2FtZXJhRmFyICkgOiAxLjA7XG4gICAgICAjZW5kaWZcbiAgICAgICNlbmRpZlxuXG4gICAgICAvLyBDT01QQVQ6IHByZS1yMTU2IHVzZXMgYSBzdHJ1Y3QgR2VvbWV0cmljQ29udGV4dFxuICAgICAgI2lmIFRIUkVFX1ZSTV9USFJFRV9SRVZJU0lPTiA+PSAxNTdcbiAgICAgICAgUkVfRGlyZWN0KCBkaXJlY3RMaWdodCwgZ2VvbWV0cnlQb3NpdGlvbiwgZ2VvbWV0cnlOb3JtYWwsIGdlb21ldHJ5Vmlld0RpciwgZ2VvbWV0cnlDbGVhcmNvYXROb3JtYWwsIG1hdGVyaWFsLCBzaGFkb3csIHJlZmxlY3RlZExpZ2h0ICk7XG4gICAgICAjZWxzZVxuICAgICAgICBSRV9EaXJlY3QoIGRpcmVjdExpZ2h0LCBnZW9tZXRyeSwgbWF0ZXJpYWwsIHNoYWRvdywgcmVmbGVjdGVkTGlnaHQgKTtcbiAgICAgICNlbmRpZlxuXG4gICAgfVxuICAgICNwcmFnbWEgdW5yb2xsX2xvb3BfZW5kXG5cbiAgI2VuZGlmXG5cbiAgI2lmICggTlVNX1NQT1RfTElHSFRTID4gMCApICYmIGRlZmluZWQoIFJFX0RpcmVjdCApXG5cbiAgICBTcG90TGlnaHQgc3BvdExpZ2h0O1xuICAgICNpZiBkZWZpbmVkKCBVU0VfU0hBRE9XTUFQICkgJiYgTlVNX1NQT1RfTElHSFRfU0hBRE9XUyA+IDBcbiAgICBTcG90TGlnaHRTaGFkb3cgc3BvdExpZ2h0U2hhZG93O1xuICAgICNlbmRpZlxuXG4gICAgI3ByYWdtYSB1bnJvbGxfbG9vcF9zdGFydFxuICAgIGZvciAoIGludCBpID0gMDsgaSA8IE5VTV9TUE9UX0xJR0hUUzsgaSArKyApIHtcblxuICAgICAgc3BvdExpZ2h0ID0gc3BvdExpZ2h0c1sgaSBdO1xuXG4gICAgICAvLyBDT01QQVQ6IHByZS1yMTU2IHVzZXMgYSBzdHJ1Y3QgR2VvbWV0cmljQ29udGV4dFxuICAgICAgI2lmIFRIUkVFX1ZSTV9USFJFRV9SRVZJU0lPTiA+PSAxNTdcbiAgICAgICAgZ2V0U3BvdExpZ2h0SW5mbyggc3BvdExpZ2h0LCBnZW9tZXRyeVBvc2l0aW9uLCBkaXJlY3RMaWdodCApO1xuICAgICAgI2Vsc2VcbiAgICAgICAgZ2V0U3BvdExpZ2h0SW5mbyggc3BvdExpZ2h0LCBnZW9tZXRyeSwgZGlyZWN0TGlnaHQgKTtcbiAgICAgICNlbmRpZlxuXG4gICAgICBzaGFkb3cgPSAxLjA7XG4gICAgICAjaWYgZGVmaW5lZCggVVNFX1NIQURPV01BUCApICYmICggVU5ST0xMRURfTE9PUF9JTkRFWCA8IE5VTV9TUE9UX0xJR0hUX1NIQURPV1MgKVxuICAgICAgc3BvdExpZ2h0U2hhZG93ID0gc3BvdExpZ2h0U2hhZG93c1sgaSBdO1xuICAgICAgLy8gQ09NUEFUOiBwcmUtcjE2NlxuICAgICAgLy8gcjE2NiBpbnRyb2R1Y2VkIHNoYWRvd0ludGVuc2l0eVxuICAgICAgI2lmIFRIUkVFX1ZSTV9USFJFRV9SRVZJU0lPTiA+PSAxNjZcbiAgICAgICAgc2hhZG93ID0gYWxsKCBidmVjMiggZGlyZWN0TGlnaHQudmlzaWJsZSwgcmVjZWl2ZVNoYWRvdyApICkgPyBnZXRTaGFkb3coIHNwb3RTaGFkb3dNYXBbIGkgXSwgc3BvdExpZ2h0U2hhZG93LnNoYWRvd01hcFNpemUsIHNwb3RMaWdodFNoYWRvdy5zaGFkb3dJbnRlbnNpdHksIHNwb3RMaWdodFNoYWRvdy5zaGFkb3dCaWFzLCBzcG90TGlnaHRTaGFkb3cuc2hhZG93UmFkaXVzLCB2U3BvdFNoYWRvd0Nvb3JkWyBpIF0gKSA6IDEuMDtcbiAgICAgICNlbHNlXG4gICAgICAgIHNoYWRvdyA9IGFsbCggYnZlYzIoIGRpcmVjdExpZ2h0LnZpc2libGUsIHJlY2VpdmVTaGFkb3cgKSApID8gZ2V0U2hhZG93KCBzcG90U2hhZG93TWFwWyBpIF0sIHNwb3RMaWdodFNoYWRvdy5zaGFkb3dNYXBTaXplLCBzcG90TGlnaHRTaGFkb3cuc2hhZG93Qmlhcywgc3BvdExpZ2h0U2hhZG93LnNoYWRvd1JhZGl1cywgdlNwb3RTaGFkb3dDb29yZFsgaSBdICkgOiAxLjA7XG4gICAgICAjZW5kaWZcbiAgICAgICNlbmRpZlxuXG4gICAgICAvLyBDT01QQVQ6IHByZS1yMTU2IHVzZXMgYSBzdHJ1Y3QgR2VvbWV0cmljQ29udGV4dFxuICAgICAgI2lmIFRIUkVFX1ZSTV9USFJFRV9SRVZJU0lPTiA+PSAxNTdcbiAgICAgICAgUkVfRGlyZWN0KCBkaXJlY3RMaWdodCwgZ2VvbWV0cnlQb3NpdGlvbiwgZ2VvbWV0cnlOb3JtYWwsIGdlb21ldHJ5Vmlld0RpciwgZ2VvbWV0cnlDbGVhcmNvYXROb3JtYWwsIG1hdGVyaWFsLCBzaGFkb3csIHJlZmxlY3RlZExpZ2h0ICk7XG4gICAgICAjZWxzZVxuICAgICAgICBSRV9EaXJlY3QoIGRpcmVjdExpZ2h0LCBnZW9tZXRyeSwgbWF0ZXJpYWwsIHNoYWRvdywgcmVmbGVjdGVkTGlnaHQgKTtcbiAgICAgICNlbmRpZlxuXG4gICAgfVxuICAgICNwcmFnbWEgdW5yb2xsX2xvb3BfZW5kXG5cbiAgI2VuZGlmXG5cbiAgI2lmICggTlVNX0RJUl9MSUdIVFMgPiAwICkgJiYgZGVmaW5lZCggUkVfRGlyZWN0IClcblxuICAgIERpcmVjdGlvbmFsTGlnaHQgZGlyZWN0aW9uYWxMaWdodDtcbiAgICAjaWYgZGVmaW5lZCggVVNFX1NIQURPV01BUCApICYmIE5VTV9ESVJfTElHSFRfU0hBRE9XUyA+IDBcbiAgICBEaXJlY3Rpb25hbExpZ2h0U2hhZG93IGRpcmVjdGlvbmFsTGlnaHRTaGFkb3c7XG4gICAgI2VuZGlmXG5cbiAgICAjcHJhZ21hIHVucm9sbF9sb29wX3N0YXJ0XG4gICAgZm9yICggaW50IGkgPSAwOyBpIDwgTlVNX0RJUl9MSUdIVFM7IGkgKysgKSB7XG5cbiAgICAgIGRpcmVjdGlvbmFsTGlnaHQgPSBkaXJlY3Rpb25hbExpZ2h0c1sgaSBdO1xuXG4gICAgICAvLyBDT01QQVQ6IHByZS1yMTU2IHVzZXMgYSBzdHJ1Y3QgR2VvbWV0cmljQ29udGV4dFxuICAgICAgI2lmIFRIUkVFX1ZSTV9USFJFRV9SRVZJU0lPTiA+PSAxNTdcbiAgICAgICAgZ2V0RGlyZWN0aW9uYWxMaWdodEluZm8oIGRpcmVjdGlvbmFsTGlnaHQsIGRpcmVjdExpZ2h0ICk7XG4gICAgICAjZWxzZVxuICAgICAgICBnZXREaXJlY3Rpb25hbExpZ2h0SW5mbyggZGlyZWN0aW9uYWxMaWdodCwgZ2VvbWV0cnksIGRpcmVjdExpZ2h0ICk7XG4gICAgICAjZW5kaWZcblxuICAgICAgc2hhZG93ID0gMS4wO1xuICAgICAgI2lmIGRlZmluZWQoIFVTRV9TSEFET1dNQVAgKSAmJiAoIFVOUk9MTEVEX0xPT1BfSU5ERVggPCBOVU1fRElSX0xJR0hUX1NIQURPV1MgKVxuICAgICAgZGlyZWN0aW9uYWxMaWdodFNoYWRvdyA9IGRpcmVjdGlvbmFsTGlnaHRTaGFkb3dzWyBpIF07XG4gICAgICAvLyBDT01QQVQ6IHByZS1yMTY2XG4gICAgICAvLyByMTY2IGludHJvZHVjZWQgc2hhZG93SW50ZW5zaXR5XG4gICAgICAjaWYgVEhSRUVfVlJNX1RIUkVFX1JFVklTSU9OID49IDE2NlxuICAgICAgICBzaGFkb3cgPSBhbGwoIGJ2ZWMyKCBkaXJlY3RMaWdodC52aXNpYmxlLCByZWNlaXZlU2hhZG93ICkgKSA/IGdldFNoYWRvdyggZGlyZWN0aW9uYWxTaGFkb3dNYXBbIGkgXSwgZGlyZWN0aW9uYWxMaWdodFNoYWRvdy5zaGFkb3dNYXBTaXplLCBkaXJlY3Rpb25hbExpZ2h0U2hhZG93LnNoYWRvd0ludGVuc2l0eSwgZGlyZWN0aW9uYWxMaWdodFNoYWRvdy5zaGFkb3dCaWFzLCBkaXJlY3Rpb25hbExpZ2h0U2hhZG93LnNoYWRvd1JhZGl1cywgdkRpcmVjdGlvbmFsU2hhZG93Q29vcmRbIGkgXSApIDogMS4wO1xuICAgICAgI2Vsc2VcbiAgICAgICAgc2hhZG93ID0gYWxsKCBidmVjMiggZGlyZWN0TGlnaHQudmlzaWJsZSwgcmVjZWl2ZVNoYWRvdyApICkgPyBnZXRTaGFkb3coIGRpcmVjdGlvbmFsU2hhZG93TWFwWyBpIF0sIGRpcmVjdGlvbmFsTGlnaHRTaGFkb3cuc2hhZG93TWFwU2l6ZSwgZGlyZWN0aW9uYWxMaWdodFNoYWRvdy5zaGFkb3dCaWFzLCBkaXJlY3Rpb25hbExpZ2h0U2hhZG93LnNoYWRvd1JhZGl1cywgdkRpcmVjdGlvbmFsU2hhZG93Q29vcmRbIGkgXSApIDogMS4wO1xuICAgICAgI2VuZGlmXG4gICAgICAjZW5kaWZcblxuICAgICAgLy8gQ09NUEFUOiBwcmUtcjE1NiB1c2VzIGEgc3RydWN0IEdlb21ldHJpY0NvbnRleHRcbiAgICAgICNpZiBUSFJFRV9WUk1fVEhSRUVfUkVWSVNJT04gPj0gMTU3XG4gICAgICAgIFJFX0RpcmVjdCggZGlyZWN0TGlnaHQsIGdlb21ldHJ5UG9zaXRpb24sIGdlb21ldHJ5Tm9ybWFsLCBnZW9tZXRyeVZpZXdEaXIsIGdlb21ldHJ5Q2xlYXJjb2F0Tm9ybWFsLCBtYXRlcmlhbCwgc2hhZG93LCByZWZsZWN0ZWRMaWdodCApO1xuICAgICAgI2Vsc2VcbiAgICAgICAgUkVfRGlyZWN0KCBkaXJlY3RMaWdodCwgZ2VvbWV0cnksIG1hdGVyaWFsLCBzaGFkb3csIHJlZmxlY3RlZExpZ2h0ICk7XG4gICAgICAjZW5kaWZcblxuICAgIH1cbiAgICAjcHJhZ21hIHVucm9sbF9sb29wX2VuZFxuXG4gICNlbmRpZlxuXG4gIC8vICNpZiAoIE5VTV9SRUNUX0FSRUFfTElHSFRTID4gMCApICYmIGRlZmluZWQoIFJFX0RpcmVjdF9SZWN0QXJlYSApXG5cbiAgLy8gICBSZWN0QXJlYUxpZ2h0IHJlY3RBcmVhTGlnaHQ7XG5cbiAgLy8gICAjcHJhZ21hIHVucm9sbF9sb29wX3N0YXJ0XG4gIC8vICAgZm9yICggaW50IGkgPSAwOyBpIDwgTlVNX1JFQ1RfQVJFQV9MSUdIVFM7IGkgKysgKSB7XG5cbiAgLy8gICAgIHJlY3RBcmVhTGlnaHQgPSByZWN0QXJlYUxpZ2h0c1sgaSBdO1xuICAvLyAgICAgUkVfRGlyZWN0X1JlY3RBcmVhKCByZWN0QXJlYUxpZ2h0LCBnZW9tZXRyeSwgbWF0ZXJpYWwsIHJlZmxlY3RlZExpZ2h0ICk7XG5cbiAgLy8gICB9XG4gIC8vICAgI3ByYWdtYSB1bnJvbGxfbG9vcF9lbmRcblxuICAvLyAjZW5kaWZcblxuICAjaWYgZGVmaW5lZCggUkVfSW5kaXJlY3REaWZmdXNlIClcblxuICAgIHZlYzMgaWJsSXJyYWRpYW5jZSA9IHZlYzMoIDAuMCApO1xuXG4gICAgdmVjMyBpcnJhZGlhbmNlID0gZ2V0QW1iaWVudExpZ2h0SXJyYWRpYW5jZSggYW1iaWVudExpZ2h0Q29sb3IgKTtcblxuICAgIC8vIENPTVBBVDogcHJlLXIxNTYgdXNlcyBhIHN0cnVjdCBHZW9tZXRyaWNDb250ZXh0XG4gICAgLy8gQ09NUEFUOiBwcmUtcjE1NiBkb2Vzbid0IGhhdmUgYSBkZWZpbmUgVVNFX0xJR0hUX1BST0JFU1xuICAgICNpZiBUSFJFRV9WUk1fVEhSRUVfUkVWSVNJT04gPj0gMTU3XG4gICAgICAjaWYgZGVmaW5lZCggVVNFX0xJR0hUX1BST0JFUyApXG4gICAgICAgIGlycmFkaWFuY2UgKz0gZ2V0TGlnaHRQcm9iZUlycmFkaWFuY2UoIGxpZ2h0UHJvYmUsIGdlb21ldHJ5Tm9ybWFsICk7XG4gICAgICAjZW5kaWZcbiAgICAjZWxzZVxuICAgICAgaXJyYWRpYW5jZSArPSBnZXRMaWdodFByb2JlSXJyYWRpYW5jZSggbGlnaHRQcm9iZSwgZ2VvbWV0cnkubm9ybWFsICk7XG4gICAgI2VuZGlmXG5cbiAgICAjaWYgKCBOVU1fSEVNSV9MSUdIVFMgPiAwIClcblxuICAgICAgI3ByYWdtYSB1bnJvbGxfbG9vcF9zdGFydFxuICAgICAgZm9yICggaW50IGkgPSAwOyBpIDwgTlVNX0hFTUlfTElHSFRTOyBpICsrICkge1xuXG4gICAgICAgIC8vIENPTVBBVDogcHJlLXIxNTYgdXNlcyBhIHN0cnVjdCBHZW9tZXRyaWNDb250ZXh0XG4gICAgICAgICNpZiBUSFJFRV9WUk1fVEhSRUVfUkVWSVNJT04gPj0gMTU3XG4gICAgICAgICAgaXJyYWRpYW5jZSArPSBnZXRIZW1pc3BoZXJlTGlnaHRJcnJhZGlhbmNlKCBoZW1pc3BoZXJlTGlnaHRzWyBpIF0sIGdlb21ldHJ5Tm9ybWFsICk7XG4gICAgICAgICNlbHNlXG4gICAgICAgICAgaXJyYWRpYW5jZSArPSBnZXRIZW1pc3BoZXJlTGlnaHRJcnJhZGlhbmNlKCBoZW1pc3BoZXJlTGlnaHRzWyBpIF0sIGdlb21ldHJ5Lm5vcm1hbCApO1xuICAgICAgICAjZW5kaWZcblxuICAgICAgfVxuICAgICAgI3ByYWdtYSB1bnJvbGxfbG9vcF9lbmRcblxuICAgICNlbmRpZlxuXG4gICNlbmRpZlxuXG4gIC8vICNpZiBkZWZpbmVkKCBSRV9JbmRpcmVjdFNwZWN1bGFyIClcblxuICAvLyAgIHZlYzMgcmFkaWFuY2UgPSB2ZWMzKCAwLjAgKTtcbiAgLy8gICB2ZWMzIGNsZWFyY29hdFJhZGlhbmNlID0gdmVjMyggMC4wICk7XG5cbiAgLy8gI2VuZGlmXG5cbiAgI2luY2x1ZGUgPGxpZ2h0c19mcmFnbWVudF9tYXBzPlxuICAjaW5jbHVkZSA8bGlnaHRzX2ZyYWdtZW50X2VuZD5cblxuICAvLyBtb2R1bGF0aW9uXG4gICNpbmNsdWRlIDxhb21hcF9mcmFnbWVudD5cblxuICB2ZWMzIGNvbCA9IHJlZmxlY3RlZExpZ2h0LmRpcmVjdERpZmZ1c2UgKyByZWZsZWN0ZWRMaWdodC5pbmRpcmVjdERpZmZ1c2U7XG5cbiAgI2lmZGVmIERFQlVHX0xJVFNIQURFUkFURVxuICAgIGdsX0ZyYWdDb2xvciA9IHZlYzQoIGNvbCwgZGlmZnVzZUNvbG9yLmEgKTtcbiAgICBwb3N0Q29ycmVjdGlvbigpO1xuICAgIHJldHVybjtcbiAgI2VuZGlmXG5cbiAgLy8gLS0gTVRvb246IHJpbSBsaWdodGluZyAtLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLVxuICB2ZWMzIHZpZXdEaXIgPSBub3JtYWxpemUoIHZWaWV3UG9zaXRpb24gKTtcblxuICAjaWZuZGVmIFBIWVNJQ0FMTFlfQ09SUkVDVF9MSUdIVFNcbiAgICByZWZsZWN0ZWRMaWdodC5kaXJlY3RTcGVjdWxhciAvPSBQSTtcbiAgI2VuZGlmXG4gIHZlYzMgcmltTWl4ID0gbWl4KCB2ZWMzKCAxLjAgKSwgcmVmbGVjdGVkTGlnaHQuZGlyZWN0U3BlY3VsYXIsIDEuMCApO1xuXG4gIHZlYzMgcmltID0gcGFyYW1ldHJpY1JpbUNvbG9yRmFjdG9yICogcG93KCBzYXR1cmF0ZSggMS4wIC0gZG90KCB2aWV3RGlyLCBub3JtYWwgKSArIHBhcmFtZXRyaWNSaW1MaWZ0RmFjdG9yICksIHBhcmFtZXRyaWNSaW1GcmVzbmVsUG93ZXJGYWN0b3IgKTtcblxuICAjaWZkZWYgVVNFX01BVENBUFRFWFRVUkVcbiAgICB7XG4gICAgICB2ZWMzIHggPSBub3JtYWxpemUoIHZlYzMoIHZpZXdEaXIueiwgMC4wLCAtdmlld0Rpci54ICkgKTtcbiAgICAgIHZlYzMgeSA9IGNyb3NzKCB2aWV3RGlyLCB4ICk7IC8vIGd1YXJhbnRlZWQgdG8gYmUgbm9ybWFsaXplZFxuICAgICAgdmVjMiBzcGhlcmVVdiA9IDAuNSArIDAuNSAqIHZlYzIoIGRvdCggeCwgbm9ybWFsICksIC1kb3QoIHksIG5vcm1hbCApICk7XG4gICAgICBzcGhlcmVVdiA9ICggbWF0Y2FwVGV4dHVyZVV2VHJhbnNmb3JtICogdmVjMyggc3BoZXJlVXYsIDEgKSApLnh5O1xuICAgICAgdmVjMyBtYXRjYXAgPSB0ZXh0dXJlMkQoIG1hdGNhcFRleHR1cmUsIHNwaGVyZVV2ICkucmdiO1xuICAgICAgcmltICs9IG1hdGNhcEZhY3RvciAqIG1hdGNhcDtcbiAgICB9XG4gICNlbmRpZlxuXG4gICNpZmRlZiBVU0VfUklNTVVMVElQTFlURVhUVVJFXG4gICAgdmVjMiByaW1NdWx0aXBseVRleHR1cmVVdiA9ICggcmltTXVsdGlwbHlUZXh0dXJlVXZUcmFuc2Zvcm0gKiB2ZWMzKCB1diwgMSApICkueHk7XG4gICAgcmltICo9IHRleHR1cmUyRCggcmltTXVsdGlwbHlUZXh0dXJlLCByaW1NdWx0aXBseVRleHR1cmVVdiApLnJnYjtcbiAgI2VuZGlmXG5cbiAgY29sICs9IHJpbU1peCAqIHJpbTtcblxuICAvLyAtLSBNVG9vbjogRW1pc3Npb24gLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS1cbiAgY29sICs9IHRvdGFsRW1pc3NpdmVSYWRpYW5jZTtcblxuICAvLyAjaW5jbHVkZSA8ZW52bWFwX2ZyYWdtZW50PlxuXG4gIC8vIC0tIEFsbW9zdCBkb25lISAtLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLVxuICAjaWYgZGVmaW5lZCggT1VUTElORSApXG4gICAgY29sID0gb3V0bGluZUNvbG9yRmFjdG9yLnJnYiAqIG1peCggdmVjMyggMS4wICksIGNvbCwgb3V0bGluZUxpZ2h0aW5nTWl4RmFjdG9yICk7XG4gICNlbmRpZlxuXG4gICNpZmRlZiBPUEFRVUVcbiAgICBkaWZmdXNlQ29sb3IuYSA9IDEuMDtcbiAgI2VuZGlmXG5cbiAgZ2xfRnJhZ0NvbG9yID0gdmVjNCggY29sLCBkaWZmdXNlQ29sb3IuYSApO1xuICBwb3N0Q29ycmVjdGlvbigpO1xufVxuIiwgIi8qIGVzbGludC1kaXNhYmxlIEB0eXBlc2NyaXB0LWVzbGludC9uYW1pbmctY29udmVudGlvbiAqL1xuXG4vKipcbiAqIFNwZWNpZmllcnMgb2YgZGVidWcgbW9kZSBvZiB7QGxpbmsgTVRvb25NYXRlcmlhbH0uXG4gKlxuICogU2VlOiB7QGxpbmsgTVRvb25NYXRlcmlhbC5kZWJ1Z01vZGV9XG4gKi9cbmV4cG9ydCBjb25zdCBNVG9vbk1hdGVyaWFsRGVidWdNb2RlID0ge1xuICAvKipcbiAgICogUmVuZGVyIG5vcm1hbGx5LlxuICAgKi9cbiAgTm9uZTogJ25vbmUnLFxuXG4gIC8qKlxuICAgKiBWaXN1YWxpemUgbm9ybWFscyBvZiB0aGUgc3VyZmFjZS5cbiAgICovXG4gIE5vcm1hbDogJ25vcm1hbCcsXG5cbiAgLyoqXG4gICAqIFZpc3VhbGl6ZSBsaXQvc2hhZGUgb2YgdGhlIHN1cmZhY2UuXG4gICAqL1xuICBMaXRTaGFkZVJhdGU6ICdsaXRTaGFkZVJhdGUnLFxuXG4gIC8qKlxuICAgKiBWaXN1YWxpemUgVVYgb2YgdGhlIHN1cmZhY2UuXG4gICAqL1xuICBVVjogJ3V2Jyxcbn0gYXMgY29uc3Q7XG5cbmV4cG9ydCB0eXBlIE1Ub29uTWF0ZXJpYWxEZWJ1Z01vZGUgPSAodHlwZW9mIE1Ub29uTWF0ZXJpYWxEZWJ1Z01vZGUpW2tleW9mIHR5cGVvZiBNVG9vbk1hdGVyaWFsRGVidWdNb2RlXTtcbiIsICIvKiBlc2xpbnQtZGlzYWJsZSBAdHlwZXNjcmlwdC1lc2xpbnQvbmFtaW5nLWNvbnZlbnRpb24gKi9cblxuZXhwb3J0IGNvbnN0IE1Ub29uTWF0ZXJpYWxPdXRsaW5lV2lkdGhNb2RlID0ge1xuICBOb25lOiAnbm9uZScsXG4gIFdvcmxkQ29vcmRpbmF0ZXM6ICd3b3JsZENvb3JkaW5hdGVzJyxcbiAgU2NyZWVuQ29vcmRpbmF0ZXM6ICdzY3JlZW5Db29yZGluYXRlcycsXG59IGFzIGNvbnN0O1xuXG5leHBvcnQgdHlwZSBNVG9vbk1hdGVyaWFsT3V0bGluZVdpZHRoTW9kZSA9XG4gICh0eXBlb2YgTVRvb25NYXRlcmlhbE91dGxpbmVXaWR0aE1vZGUpW2tleW9mIHR5cGVvZiBNVG9vbk1hdGVyaWFsT3V0bGluZVdpZHRoTW9kZV07XG4iLCAiaW1wb3J0ICogYXMgVEhSRUUgZnJvbSAndGhyZWUnO1xuXG5jb25zdCBlbmNvZGluZ0NvbG9yU3BhY2VNYXA6IFJlY29yZDxhbnksICcnIHwgJ3NyZ2InPiA9IHtcbiAgLy8gZXNsaW50LWRpc2FibGUtbmV4dC1saW5lIEB0eXBlc2NyaXB0LWVzbGludC9uYW1pbmctY29udmVudGlvblxuICAzMDAwOiAnJyxcbiAgLy8gZXNsaW50LWRpc2FibGUtbmV4dC1saW5lIEB0eXBlc2NyaXB0LWVzbGludC9uYW1pbmctY29udmVudGlvblxuICAzMDAxOiAnc3JnYicsXG59O1xuXG4vKipcbiAqIEEgY29tcGF0IGZ1bmN0aW9uIHRvIGdldCB0ZXh0dXJlIGNvbG9yIHNwYWNlLlxuICpcbiAqIENPTVBBVDogcHJlLXIxNTJcbiAqIFN0YXJ0aW5nIGZyb20gVGhyZWUuanMgcjE1MiwgYHRleHR1cmUuZW5jb2RpbmdgIGlzIHJlbmFtZWQgdG8gYHRleHR1cmUuY29sb3JTcGFjZWAuXG4gKiBUaGlzIGZ1bmN0aW9uIHdpbGwgaGFuZGxlIHRoZSBjb21hcHQuXG4gKlxuICogQHBhcmFtIHRleHR1cmUgVGhlIHRleHR1cmUgeW91IHdhbnQgdG8gZ2V0IHRoZSBjb2xvciBzcGFjZSBmcm9tXG4gKi9cbmV4cG9ydCBmdW5jdGlvbiBnZXRUZXh0dXJlQ29sb3JTcGFjZSh0ZXh0dXJlOiBUSFJFRS5UZXh0dXJlKTogJycgfCAnc3JnYicge1xuICBpZiAocGFyc2VJbnQoVEhSRUUuUkVWSVNJT04sIDEwKSA+PSAxNTIpIHtcbiAgICByZXR1cm4gdGV4dHVyZS5jb2xvclNwYWNlIGFzICcnIHwgJ3NyZ2InO1xuICB9IGVsc2Uge1xuICAgIHJldHVybiBlbmNvZGluZ0NvbG9yU3BhY2VNYXBbKHRleHR1cmUgYXMgYW55KS5lbmNvZGluZ107XG4gIH1cbn1cbiIsICJpbXBvcnQgeyBHTFRGTG9hZGVyUGx1Z2luLCBHTFRGUGFyc2VyIH0gZnJvbSAndGhyZWUvZXhhbXBsZXMvanNtL2xvYWRlcnMvR0xURkxvYWRlci5qcyc7XG5pbXBvcnQgKiBhcyBIRFJFbWlzc2l2ZU11bHRpcGxpZXJTY2hlbWEgZnJvbSAnQHBpeGl2L3R5cGVzLXZybWMtbWF0ZXJpYWxzLWhkci1lbWlzc2l2ZS1tdWx0aXBsaWVyLTEuMCc7XG5pbXBvcnQgeyBHTFRGIGFzIEdMVEZTY2hlbWEgfSBmcm9tICdAZ2x0Zi10cmFuc2Zvcm0vY29yZSc7XG5cbmV4cG9ydCBjbGFzcyBWUk1NYXRlcmlhbHNIRFJFbWlzc2l2ZU11bHRpcGxpZXJMb2FkZXJQbHVnaW4gaW1wbGVtZW50cyBHTFRGTG9hZGVyUGx1Z2luIHtcbiAgcHVibGljIHN0YXRpYyBFWFRFTlNJT05fTkFNRSA9ICdWUk1DX21hdGVyaWFsc19oZHJfZW1pc3NpdmVNdWx0aXBsaWVyJyBhcyBjb25zdDtcblxuICBwdWJsaWMgcmVhZG9ubHkgcGFyc2VyOiBHTFRGUGFyc2VyO1xuXG4gIHB1YmxpYyBnZXQgbmFtZSgpOiBzdHJpbmcge1xuICAgIHJldHVybiBWUk1NYXRlcmlhbHNIRFJFbWlzc2l2ZU11bHRpcGxpZXJMb2FkZXJQbHVnaW4uRVhURU5TSU9OX05BTUU7XG4gIH1cblxuICBwdWJsaWMgY29uc3RydWN0b3IocGFyc2VyOiBHTFRGUGFyc2VyKSB7XG4gICAgdGhpcy5wYXJzZXIgPSBwYXJzZXI7XG4gIH1cblxuICBwdWJsaWMgYXN5bmMgZXh0ZW5kTWF0ZXJpYWxQYXJhbXMobWF0ZXJpYWxJbmRleDogbnVtYmVyLCBtYXRlcmlhbFBhcmFtczogeyBba2V5OiBzdHJpbmddOiBhbnkgfSk6IFByb21pc2U8dm9pZD4ge1xuICAgIGNvbnN0IGV4dGVuc2lvbiA9IHRoaXMuX2dldEhEUkVtaXNzaXZlTXVsdGlwbGllckV4dGVuc2lvbihtYXRlcmlhbEluZGV4KTtcbiAgICBpZiAoZXh0ZW5zaW9uID09IG51bGwpIHtcbiAgICAgIHJldHVybjtcbiAgICB9XG5cbiAgICAvLyBUaGlzIGV4dGVuc2lvbiBpcyBhcmNoaXZlZC4gRW1pdCB3YXJuaW5nXG4gICAgLy8gU2VlOiBodHRwczovL2dpdGh1Yi5jb20vdnJtLWMvdnJtLXNwZWNpZmljYXRpb24vcHVsbC8zNzVcbiAgICBjb25zb2xlLndhcm4oXG4gICAgICAnVlJNTWF0ZXJpYWxzSERSRW1pc3NpdmVNdWx0aXBsaWVyTG9hZGVyUGx1Z2luOiBgVlJNQ19tYXRlcmlhbHNfaGRyX2VtaXNzaXZlTXVsdGlwbGllcmAgaXMgYXJjaGl2ZWQuIFVzZSBgS0hSX21hdGVyaWFsc19lbWlzc2l2ZV9zdHJlbmd0aGAgaW5zdGVhZC4nLFxuICAgICk7XG5cbiAgICBjb25zdCBlbWlzc2l2ZU11bHRpcGxpZXIgPSBleHRlbnNpb24uZW1pc3NpdmVNdWx0aXBsaWVyO1xuICAgIG1hdGVyaWFsUGFyYW1zLmVtaXNzaXZlSW50ZW5zaXR5ID0gZW1pc3NpdmVNdWx0aXBsaWVyO1xuICB9XG5cbiAgcHJpdmF0ZSBfZ2V0SERSRW1pc3NpdmVNdWx0aXBsaWVyRXh0ZW5zaW9uKFxuICAgIG1hdGVyaWFsSW5kZXg6IG51bWJlcixcbiAgKTogSERSRW1pc3NpdmVNdWx0aXBsaWVyU2NoZW1hLlZSTUNNYXRlcmlhbHNIRFJFbWlzc2l2ZU11bHRpcGxpZXIgfCB1bmRlZmluZWQge1xuICAgIGNvbnN0IHBhcnNlciA9IHRoaXMucGFyc2VyO1xuICAgIGNvbnN0IGpzb24gPSBwYXJzZXIuanNvbiBhcyBHTFRGU2NoZW1hLklHTFRGO1xuXG4gICAgY29uc3QgbWF0ZXJpYWxEZWYgPSBqc29uLm1hdGVyaWFscz8uW21hdGVyaWFsSW5kZXhdO1xuXG4gICAgaWYgKG1hdGVyaWFsRGVmID09IG51bGwpIHtcbiAgICAgIGNvbnNvbGUud2FybihcbiAgICAgICAgYFZSTU1hdGVyaWFsc0hEUkVtaXNzaXZlTXVsdGlwbGllckxvYWRlclBsdWdpbjogQXR0ZW1wdCB0byB1c2UgbWF0ZXJpYWxzWyR7bWF0ZXJpYWxJbmRleH1dIG9mIGdsVEYgYnV0IHRoZSBtYXRlcmlhbCBkb2Vzbid0IGV4aXN0YCxcbiAgICAgICk7XG4gICAgICByZXR1cm4gdW5kZWZpbmVkO1xuICAgIH1cblxuICAgIGNvbnN0IGV4dGVuc2lvbiA9IG1hdGVyaWFsRGVmLmV4dGVuc2lvbnM/LltWUk1NYXRlcmlhbHNIRFJFbWlzc2l2ZU11bHRpcGxpZXJMb2FkZXJQbHVnaW4uRVhURU5TSU9OX05BTUVdIGFzXG4gICAgICB8IEhEUkVtaXNzaXZlTXVsdGlwbGllclNjaGVtYS5WUk1DTWF0ZXJpYWxzSERSRW1pc3NpdmVNdWx0aXBsaWVyXG4gICAgICB8IHVuZGVmaW5lZDtcbiAgICBpZiAoZXh0ZW5zaW9uID09IG51bGwpIHtcbiAgICAgIHJldHVybiB1bmRlZmluZWQ7XG4gICAgfVxuXG4gICAgcmV0dXJuIGV4dGVuc2lvbjtcbiAgfVxufVxuIiwgImltcG9ydCAqIGFzIFRIUkVFIGZyb20gJ3RocmVlJztcbmltcG9ydCB7IFZSTSBhcyBWMFZSTSwgTWF0ZXJpYWwgYXMgVjBNYXRlcmlhbCB9IGZyb20gJ0BwaXhpdi90eXBlcy12cm0tMC4wJztcbmltcG9ydCAqIGFzIFYxTVRvb25TY2hlbWEgZnJvbSAnQHBpeGl2L3R5cGVzLXZybWMtbWF0ZXJpYWxzLW10b29uLTEuMCc7XG5pbXBvcnQgdHlwZSB7IEdMVEZMb2FkZXJQbHVnaW4sIEdMVEZQYXJzZXIgfSBmcm9tICd0aHJlZS9leGFtcGxlcy9qc20vbG9hZGVycy9HTFRGTG9hZGVyLmpzJztcbmltcG9ydCB7IGdhbW1hRU9URiB9IGZyb20gJy4vdXRpbHMvZ2FtbWFFT1RGJztcbmltcG9ydCB7IEdMVEYgYXMgR0xURlNjaGVtYSB9IGZyb20gJ0BnbHRmLXRyYW5zZm9ybS9jb3JlJztcblxuZXhwb3J0IGNsYXNzIFZSTU1hdGVyaWFsc1YwQ29tcGF0UGx1Z2luIGltcGxlbWVudHMgR0xURkxvYWRlclBsdWdpbiB7XG4gIHB1YmxpYyByZWFkb25seSBwYXJzZXI6IEdMVEZQYXJzZXI7XG5cbiAgLyoqXG4gICAqIEEgbWFwIGZyb20gdjAgcmVuZGVyIHF1ZXVlIHRvIHYxIHJlbmRlciBxdWV1ZSBvZmZzZXQsIGZvciBUcmFuc3BhcmVudCBtYXRlcmlhbHMuXG4gICAqL1xuICBwcml2YXRlIHJlYWRvbmx5IF9yZW5kZXJRdWV1ZU1hcFRyYW5zcGFyZW50OiBNYXA8bnVtYmVyLCBudW1iZXI+O1xuXG4gIC8qKlxuICAgKiBBIG1hcCBmcm9tIHYwIHJlbmRlciBxdWV1ZSB0byB2MSByZW5kZXIgcXVldWUgb2Zmc2V0LCBmb3IgVHJhbnNwYXJlbnRaV3JpdGUgbWF0ZXJpYWxzLlxuICAgKi9cbiAgcHJpdmF0ZSByZWFkb25seSBfcmVuZGVyUXVldWVNYXBUcmFuc3BhcmVudFpXcml0ZTogTWFwPG51bWJlciwgbnVtYmVyPjtcblxuICBwdWJsaWMgZ2V0IG5hbWUoKTogc3RyaW5nIHtcbiAgICByZXR1cm4gJ1ZSTU1hdGVyaWFsc1YwQ29tcGF0UGx1Z2luJztcbiAgfVxuXG4gIHB1YmxpYyBjb25zdHJ1Y3RvcihwYXJzZXI6IEdMVEZQYXJzZXIpIHtcbiAgICB0aGlzLnBhcnNlciA9IHBhcnNlcjtcblxuICAgIHRoaXMuX3JlbmRlclF1ZXVlTWFwVHJhbnNwYXJlbnQgPSBuZXcgTWFwKCk7XG4gICAgdGhpcy5fcmVuZGVyUXVldWVNYXBUcmFuc3BhcmVudFpXcml0ZSA9IG5ldyBNYXAoKTtcblxuICAgIC8vIFdPUktBUk9VTkQ6IEFkZCBLSFJfdGV4dHVyZV90cmFuc2Zvcm0gdG8gZXh0ZW5zaW9uc1VzZWRcbiAgICAvLyBJdCBpcyB0b28gbGF0ZSB0byBhZGQgdGhpcyBpbiBiZWZvcmVSb290XG4gICAgY29uc3QganNvbiA9IHRoaXMucGFyc2VyLmpzb24gYXMgR0xURlNjaGVtYS5JR0xURjtcblxuICAgIGpzb24uZXh0ZW5zaW9uc1VzZWQgPSBqc29uLmV4dGVuc2lvbnNVc2VkID8/IFtdO1xuICAgIGlmIChqc29uLmV4dGVuc2lvbnNVc2VkLmluZGV4T2YoJ0tIUl90ZXh0dXJlX3RyYW5zZm9ybScpID09PSAtMSkge1xuICAgICAganNvbi5leHRlbnNpb25zVXNlZC5wdXNoKCdLSFJfdGV4dHVyZV90cmFuc2Zvcm0nKTtcbiAgICB9XG4gIH1cblxuICBwdWJsaWMgYXN5bmMgYmVmb3JlUm9vdCgpOiBQcm9taXNlPHZvaWQ+IHtcbiAgICBjb25zdCBqc29uID0gdGhpcy5wYXJzZXIuanNvbiBhcyBHTFRGU2NoZW1hLklHTFRGO1xuXG4gICAgLy8gZWFybHkgYWJvcnQgaWYgaXQgZG9lc24ndCB1c2UgVjBWUk1cbiAgICBjb25zdCB2MFZSTUV4dGVuc2lvbiA9IGpzb24uZXh0ZW5zaW9ucz8uWydWUk0nXSBhcyBWMFZSTSB8IHVuZGVmaW5lZDtcbiAgICBjb25zdCB2ME1hdGVyaWFsUHJvcGVydGllcyA9IHYwVlJNRXh0ZW5zaW9uPy5tYXRlcmlhbFByb3BlcnRpZXM7XG4gICAgaWYgKCF2ME1hdGVyaWFsUHJvcGVydGllcykge1xuICAgICAgcmV0dXJuO1xuICAgIH1cblxuICAgIC8vIHBvcHVsYXRlIHJlbmRlciBxdWV1ZSBtYXBcbiAgICB0aGlzLl9wb3B1bGF0ZVJlbmRlclF1ZXVlTWFwKHYwTWF0ZXJpYWxQcm9wZXJ0aWVzKTtcblxuICAgIC8vIGNvbnZlcnQgVjAgbWF0ZXJpYWwgcHJvcGVydGllcyBpbnRvIFYxIGNvbXBhdGlibGUgZm9ybWF0XG4gICAgdjBNYXRlcmlhbFByb3BlcnRpZXMuZm9yRWFjaCgobWF0ZXJpYWxQcm9wZXJ0aWVzLCBtYXRlcmlhbEluZGV4KSA9PiB7XG4gICAgICBjb25zdCBtYXRlcmlhbERlZiA9IGpzb24ubWF0ZXJpYWxzPy5bbWF0ZXJpYWxJbmRleF07XG5cbiAgICAgIGlmIChtYXRlcmlhbERlZiA9PSBudWxsKSB7XG4gICAgICAgIGNvbnNvbGUud2FybihcbiAgICAgICAgICBgVlJNTWF0ZXJpYWxzVjBDb21wYXRQbHVnaW46IEF0dGVtcHQgdG8gdXNlIG1hdGVyaWFsc1ske21hdGVyaWFsSW5kZXh9XSBvZiBnbFRGIGJ1dCB0aGUgbWF0ZXJpYWwgZG9lc24ndCBleGlzdGAsXG4gICAgICAgICk7XG4gICAgICAgIHJldHVybjtcbiAgICAgIH1cblxuICAgICAgaWYgKG1hdGVyaWFsUHJvcGVydGllcy5zaGFkZXIgPT09ICdWUk0vTVRvb24nKSB7XG4gICAgICAgIGNvbnN0IG1hdGVyaWFsID0gdGhpcy5fcGFyc2VWME1Ub29uUHJvcGVydGllcyhtYXRlcmlhbFByb3BlcnRpZXMsIG1hdGVyaWFsRGVmKTtcbiAgICAgICAganNvbi5tYXRlcmlhbHMhW21hdGVyaWFsSW5kZXhdID0gbWF0ZXJpYWw7XG4gICAgICB9IGVsc2UgaWYgKG1hdGVyaWFsUHJvcGVydGllcy5zaGFkZXI/LnN0YXJ0c1dpdGgoJ1ZSTS9VbmxpdCcpKSB7XG4gICAgICAgIGNvbnN0IG1hdGVyaWFsID0gdGhpcy5fcGFyc2VWMFVubGl0UHJvcGVydGllcyhtYXRlcmlhbFByb3BlcnRpZXMsIG1hdGVyaWFsRGVmKTtcbiAgICAgICAganNvbi5tYXRlcmlhbHMhW21hdGVyaWFsSW5kZXhdID0gbWF0ZXJpYWw7XG4gICAgICB9IGVsc2UgaWYgKG1hdGVyaWFsUHJvcGVydGllcy5zaGFkZXIgPT09ICdWUk1fVVNFX0dMVEZTSEFERVInKSB7XG4gICAgICAgIC8vIGBqc29uLm1hdGVyaWFsc1ttYXRlcmlhbEluZGV4XWAgc2hvdWxkIGJlIGFscmVhZHkgdmFsaWRcbiAgICAgIH0gZWxzZSB7XG4gICAgICAgIGNvbnNvbGUud2FybihgVlJNTWF0ZXJpYWxzVjBDb21wYXRQbHVnaW46IFVua25vd24gc2hhZGVyOiAke21hdGVyaWFsUHJvcGVydGllcy5zaGFkZXJ9YCk7XG4gICAgICB9XG4gICAgfSk7XG4gIH1cblxuICBwcml2YXRlIF9wYXJzZVYwTVRvb25Qcm9wZXJ0aWVzKFxuICAgIG1hdGVyaWFsUHJvcGVydGllczogVjBNYXRlcmlhbCxcbiAgICBzY2hlbWFNYXRlcmlhbDogR0xURlNjaGVtYS5JTWF0ZXJpYWwsXG4gICk6IEdMVEZTY2hlbWEuSU1hdGVyaWFsIHtcbiAgICBjb25zdCBpc1RyYW5zcGFyZW50ID0gbWF0ZXJpYWxQcm9wZXJ0aWVzLmtleXdvcmRNYXA/LlsnX0FMUEhBQkxFTkRfT04nXSA/PyBmYWxzZTtcbiAgICBjb25zdCBlbmFibGVkWldyaXRlID0gbWF0ZXJpYWxQcm9wZXJ0aWVzLmZsb2F0UHJvcGVydGllcz8uWydfWldyaXRlJ10gPT09IDE7XG4gICAgY29uc3QgdHJhbnNwYXJlbnRXaXRoWldyaXRlID0gZW5hYmxlZFpXcml0ZSAmJiBpc1RyYW5zcGFyZW50O1xuXG4gICAgY29uc3QgcmVuZGVyUXVldWVPZmZzZXROdW1iZXIgPSB0aGlzLl92MFBhcnNlUmVuZGVyUXVldWUobWF0ZXJpYWxQcm9wZXJ0aWVzKTtcblxuICAgIGNvbnN0IGlzQ3V0b2ZmID0gbWF0ZXJpYWxQcm9wZXJ0aWVzLmtleXdvcmRNYXA/LlsnX0FMUEhBVEVTVF9PTiddID8/IGZhbHNlO1xuICAgIGNvbnN0IGFscGhhTW9kZSA9IGlzVHJhbnNwYXJlbnQgPyAnQkxFTkQnIDogaXNDdXRvZmYgPyAnTUFTSycgOiAnT1BBUVVFJztcbiAgICBjb25zdCBhbHBoYUN1dG9mZiA9IGlzQ3V0b2ZmID8gKG1hdGVyaWFsUHJvcGVydGllcy5mbG9hdFByb3BlcnRpZXM/LlsnX0N1dG9mZiddID8/IDAuNSkgOiB1bmRlZmluZWQ7XG5cbiAgICBjb25zdCBjdWxsTW9kZSA9IG1hdGVyaWFsUHJvcGVydGllcy5mbG9hdFByb3BlcnRpZXM/LlsnX0N1bGxNb2RlJ10gPz8gMjsgLy8gZW51bSwgeyBPZmYsIEZyb250LCBCYWNrIH1cbiAgICBjb25zdCBkb3VibGVTaWRlZCA9IGN1bGxNb2RlID09PSAwO1xuXG4gICAgY29uc3QgdGV4dHVyZVRyYW5zZm9ybUV4dCA9IHRoaXMuX3BvcnRUZXh0dXJlVHJhbnNmb3JtKG1hdGVyaWFsUHJvcGVydGllcyk7XG5cbiAgICBjb25zdCBiYXNlQ29sb3JGYWN0b3IgPSAobWF0ZXJpYWxQcm9wZXJ0aWVzLnZlY3RvclByb3BlcnRpZXM/LlsnX0NvbG9yJ10gPz8gWzEuMCwgMS4wLCAxLjAsIDEuMF0pLm1hcChcbiAgICAgICh2OiBudW1iZXIsIGk6IG51bWJlcikgPT4gKGkgPT09IDMgPyB2IDogZ2FtbWFFT1RGKHYpKSwgLy8gYWxwaGEgY2hhbm5lbCBpcyBzdG9yZWQgaW4gbGluZWFyXG4gICAgKTtcbiAgICBjb25zdCBiYXNlQ29sb3JUZXh0dXJlSW5kZXggPSBtYXRlcmlhbFByb3BlcnRpZXMudGV4dHVyZVByb3BlcnRpZXM/LlsnX01haW5UZXgnXTtcbiAgICBjb25zdCBiYXNlQ29sb3JUZXh0dXJlID1cbiAgICAgIGJhc2VDb2xvclRleHR1cmVJbmRleCAhPSBudWxsXG4gICAgICAgID8ge1xuICAgICAgICAgICAgaW5kZXg6IGJhc2VDb2xvclRleHR1cmVJbmRleCxcbiAgICAgICAgICAgIGV4dGVuc2lvbnM6IHtcbiAgICAgICAgICAgICAgLi4udGV4dHVyZVRyYW5zZm9ybUV4dCxcbiAgICAgICAgICAgIH0sXG4gICAgICAgICAgfVxuICAgICAgICA6IHVuZGVmaW5lZDtcblxuICAgIGNvbnN0IG5vcm1hbFRleHR1cmVTY2FsZSA9IG1hdGVyaWFsUHJvcGVydGllcy5mbG9hdFByb3BlcnRpZXM/LlsnX0J1bXBTY2FsZSddID8/IDEuMDtcbiAgICBjb25zdCBub3JtYWxUZXh0dXJlSW5kZXggPSBtYXRlcmlhbFByb3BlcnRpZXMudGV4dHVyZVByb3BlcnRpZXM/LlsnX0J1bXBNYXAnXTtcbiAgICBjb25zdCBub3JtYWxUZXh0dXJlID1cbiAgICAgIG5vcm1hbFRleHR1cmVJbmRleCAhPSBudWxsXG4gICAgICAgID8ge1xuICAgICAgICAgICAgaW5kZXg6IG5vcm1hbFRleHR1cmVJbmRleCxcbiAgICAgICAgICAgIHNjYWxlOiBub3JtYWxUZXh0dXJlU2NhbGUsXG4gICAgICAgICAgICBleHRlbnNpb25zOiB7XG4gICAgICAgICAgICAgIC4uLnRleHR1cmVUcmFuc2Zvcm1FeHQsXG4gICAgICAgICAgICB9LFxuICAgICAgICAgIH1cbiAgICAgICAgOiB1bmRlZmluZWQ7XG5cbiAgICBjb25zdCBlbWlzc2l2ZUZhY3RvciA9IChtYXRlcmlhbFByb3BlcnRpZXMudmVjdG9yUHJvcGVydGllcz8uWydfRW1pc3Npb25Db2xvciddID8/IFswLjAsIDAuMCwgMC4wLCAxLjBdKS5tYXAoXG4gICAgICBnYW1tYUVPVEYsXG4gICAgKTtcbiAgICBjb25zdCBlbWlzc2l2ZVRleHR1cmVJbmRleCA9IG1hdGVyaWFsUHJvcGVydGllcy50ZXh0dXJlUHJvcGVydGllcz8uWydfRW1pc3Npb25NYXAnXTtcbiAgICBjb25zdCBlbWlzc2l2ZVRleHR1cmUgPVxuICAgICAgZW1pc3NpdmVUZXh0dXJlSW5kZXggIT0gbnVsbFxuICAgICAgICA/IHtcbiAgICAgICAgICAgIGluZGV4OiBlbWlzc2l2ZVRleHR1cmVJbmRleCxcbiAgICAgICAgICAgIGV4dGVuc2lvbnM6IHtcbiAgICAgICAgICAgICAgLi4udGV4dHVyZVRyYW5zZm9ybUV4dCxcbiAgICAgICAgICAgIH0sXG4gICAgICAgICAgfVxuICAgICAgICA6IHVuZGVmaW5lZDtcblxuICAgIGNvbnN0IHNoYWRlQ29sb3JGYWN0b3IgPSAobWF0ZXJpYWxQcm9wZXJ0aWVzLnZlY3RvclByb3BlcnRpZXM/LlsnX1NoYWRlQ29sb3InXSA/PyBbMC45NywgMC44MSwgMC44NiwgMS4wXSkubWFwKFxuICAgICAgZ2FtbWFFT1RGLFxuICAgICk7XG4gICAgY29uc3Qgc2hhZGVNdWx0aXBseVRleHR1cmVJbmRleCA9IG1hdGVyaWFsUHJvcGVydGllcy50ZXh0dXJlUHJvcGVydGllcz8uWydfU2hhZGVUZXh0dXJlJ107XG4gICAgY29uc3Qgc2hhZGVNdWx0aXBseVRleHR1cmUgPVxuICAgICAgc2hhZGVNdWx0aXBseVRleHR1cmVJbmRleCAhPSBudWxsXG4gICAgICAgID8ge1xuICAgICAgICAgICAgaW5kZXg6IHNoYWRlTXVsdGlwbHlUZXh0dXJlSW5kZXgsXG4gICAgICAgICAgICBleHRlbnNpb25zOiB7XG4gICAgICAgICAgICAgIC4uLnRleHR1cmVUcmFuc2Zvcm1FeHQsXG4gICAgICAgICAgICB9LFxuICAgICAgICAgIH1cbiAgICAgICAgOiB1bmRlZmluZWQ7XG5cbiAgICAvLyAvLyBjb252ZXJ0IHYwIHNoYWRlIHNoaWZ0IC8gc2hhZGUgdG9vbnlcbiAgICBsZXQgc2hhZGluZ1NoaWZ0RmFjdG9yID0gbWF0ZXJpYWxQcm9wZXJ0aWVzLmZsb2F0UHJvcGVydGllcz8uWydfU2hhZGVTaGlmdCddID8/IDAuMDtcbiAgICBsZXQgc2hhZGluZ1Rvb255RmFjdG9yID0gbWF0ZXJpYWxQcm9wZXJ0aWVzLmZsb2F0UHJvcGVydGllcz8uWydfU2hhZGVUb29ueSddID8/IDAuOTtcbiAgICBzaGFkaW5nVG9vbnlGYWN0b3IgPSBUSFJFRS5NYXRoVXRpbHMubGVycChzaGFkaW5nVG9vbnlGYWN0b3IsIDEuMCwgMC41ICsgMC41ICogc2hhZGluZ1NoaWZ0RmFjdG9yKTtcbiAgICBzaGFkaW5nU2hpZnRGYWN0b3IgPSAtc2hhZGluZ1NoaWZ0RmFjdG9yIC0gKDEuMCAtIHNoYWRpbmdUb29ueUZhY3Rvcik7XG5cbiAgICBjb25zdCBnaUludGVuc2l0eUZhY3RvciA9IG1hdGVyaWFsUHJvcGVydGllcy5mbG9hdFByb3BlcnRpZXM/LlsnX0luZGlyZWN0TGlnaHRJbnRlbnNpdHknXSA/PyAwLjE7XG4gICAgY29uc3QgZ2lFcXVhbGl6YXRpb25GYWN0b3IgPSBnaUludGVuc2l0eUZhY3RvciA/IDEuMCAtIGdpSW50ZW5zaXR5RmFjdG9yIDogdW5kZWZpbmVkO1xuXG4gICAgY29uc3QgbWF0Y2FwVGV4dHVyZUluZGV4ID0gbWF0ZXJpYWxQcm9wZXJ0aWVzLnRleHR1cmVQcm9wZXJ0aWVzPy5bJ19TcGhlcmVBZGQnXTtcbiAgICBjb25zdCBtYXRjYXBGYWN0b3IgPSBtYXRjYXBUZXh0dXJlSW5kZXggIT0gbnVsbCA/IFsxLjAsIDEuMCwgMS4wXSA6IHVuZGVmaW5lZDtcbiAgICBjb25zdCBtYXRjYXBUZXh0dXJlID1cbiAgICAgIG1hdGNhcFRleHR1cmVJbmRleCAhPSBudWxsXG4gICAgICAgID8ge1xuICAgICAgICAgICAgaW5kZXg6IG1hdGNhcFRleHR1cmVJbmRleCxcbiAgICAgICAgICB9XG4gICAgICAgIDogdW5kZWZpbmVkO1xuXG4gICAgY29uc3QgcmltTGlnaHRpbmdNaXhGYWN0b3IgPSBtYXRlcmlhbFByb3BlcnRpZXMuZmxvYXRQcm9wZXJ0aWVzPy5bJ19SaW1MaWdodGluZ01peCddID8/IDAuMDtcbiAgICBjb25zdCByaW1NdWx0aXBseVRleHR1cmVJbmRleCA9IG1hdGVyaWFsUHJvcGVydGllcy50ZXh0dXJlUHJvcGVydGllcz8uWydfUmltVGV4dHVyZSddO1xuICAgIGNvbnN0IHJpbU11bHRpcGx5VGV4dHVyZSA9XG4gICAgICByaW1NdWx0aXBseVRleHR1cmVJbmRleCAhPSBudWxsXG4gICAgICAgID8ge1xuICAgICAgICAgICAgaW5kZXg6IHJpbU11bHRpcGx5VGV4dHVyZUluZGV4LFxuICAgICAgICAgICAgZXh0ZW5zaW9uczoge1xuICAgICAgICAgICAgICAuLi50ZXh0dXJlVHJhbnNmb3JtRXh0LFxuICAgICAgICAgICAgfSxcbiAgICAgICAgICB9XG4gICAgICAgIDogdW5kZWZpbmVkO1xuXG4gICAgY29uc3QgcGFyYW1ldHJpY1JpbUNvbG9yRmFjdG9yID0gKG1hdGVyaWFsUHJvcGVydGllcy52ZWN0b3JQcm9wZXJ0aWVzPy5bJ19SaW1Db2xvciddID8/IFswLjAsIDAuMCwgMC4wLCAxLjBdKS5tYXAoXG4gICAgICBnYW1tYUVPVEYsXG4gICAgKTtcbiAgICBjb25zdCBwYXJhbWV0cmljUmltRnJlc25lbFBvd2VyRmFjdG9yID0gbWF0ZXJpYWxQcm9wZXJ0aWVzLmZsb2F0UHJvcGVydGllcz8uWydfUmltRnJlc25lbFBvd2VyJ10gPz8gMS4wO1xuICAgIGNvbnN0IHBhcmFtZXRyaWNSaW1MaWZ0RmFjdG9yID0gbWF0ZXJpYWxQcm9wZXJ0aWVzLmZsb2F0UHJvcGVydGllcz8uWydfUmltTGlmdCddID8/IDAuMDtcblxuICAgIGNvbnN0IG91dGxpbmVXaWR0aE1vZGUgPSBbJ25vbmUnLCAnd29ybGRDb29yZGluYXRlcycsICdzY3JlZW5Db29yZGluYXRlcyddW1xuICAgICAgbWF0ZXJpYWxQcm9wZXJ0aWVzLmZsb2F0UHJvcGVydGllcz8uWydfT3V0bGluZVdpZHRoTW9kZSddID8/IDBcbiAgICBdIGFzIFYxTVRvb25TY2hlbWEuTWF0ZXJpYWxzTVRvb25PdXRsaW5lV2lkdGhNb2RlO1xuXG4gICAgLy8gLy8gdjAgb3V0bGluZVdpZHRoRmFjdG9yIGlzIGluIGNlbnRpbWV0ZXJcbiAgICBsZXQgb3V0bGluZVdpZHRoRmFjdG9yID0gbWF0ZXJpYWxQcm9wZXJ0aWVzLmZsb2F0UHJvcGVydGllcz8uWydfT3V0bGluZVdpZHRoJ10gPz8gMC4wO1xuICAgIG91dGxpbmVXaWR0aEZhY3RvciA9IDAuMDEgKiBvdXRsaW5lV2lkdGhGYWN0b3I7XG5cbiAgICBjb25zdCBvdXRsaW5lV2lkdGhNdWx0aXBseVRleHR1cmVJbmRleCA9IG1hdGVyaWFsUHJvcGVydGllcy50ZXh0dXJlUHJvcGVydGllcz8uWydfT3V0bGluZVdpZHRoVGV4dHVyZSddO1xuICAgIGNvbnN0IG91dGxpbmVXaWR0aE11bHRpcGx5VGV4dHVyZSA9XG4gICAgICBvdXRsaW5lV2lkdGhNdWx0aXBseVRleHR1cmVJbmRleCAhPSBudWxsXG4gICAgICAgID8ge1xuICAgICAgICAgICAgaW5kZXg6IG91dGxpbmVXaWR0aE11bHRpcGx5VGV4dHVyZUluZGV4LFxuICAgICAgICAgICAgZXh0ZW5zaW9uczoge1xuICAgICAgICAgICAgICAuLi50ZXh0dXJlVHJhbnNmb3JtRXh0LFxuICAgICAgICAgICAgfSxcbiAgICAgICAgICB9XG4gICAgICAgIDogdW5kZWZpbmVkO1xuXG4gICAgY29uc3Qgb3V0bGluZUNvbG9yRmFjdG9yID0gKG1hdGVyaWFsUHJvcGVydGllcy52ZWN0b3JQcm9wZXJ0aWVzPy5bJ19PdXRsaW5lQ29sb3InXSA/PyBbMC4wLCAwLjAsIDAuMF0pLm1hcChcbiAgICAgIGdhbW1hRU9URixcbiAgICApO1xuICAgIGNvbnN0IG91dGxpbmVDb2xvck1vZGUgPSBtYXRlcmlhbFByb3BlcnRpZXMuZmxvYXRQcm9wZXJ0aWVzPy5bJ19PdXRsaW5lQ29sb3JNb2RlJ10gPz8gMDsgLy8gZW51bSwgeyBGaXhlZCwgTWl4ZWQgfVxuICAgIGNvbnN0IG91dGxpbmVMaWdodGluZ01peEZhY3RvciA9XG4gICAgICBvdXRsaW5lQ29sb3JNb2RlID09PSAxID8gKG1hdGVyaWFsUHJvcGVydGllcy5mbG9hdFByb3BlcnRpZXM/LlsnX091dGxpbmVMaWdodGluZ01peCddID8/IDEuMCkgOiAwLjA7XG5cbiAgICBjb25zdCB1dkFuaW1hdGlvbk1hc2tUZXh0dXJlSW5kZXggPSBtYXRlcmlhbFByb3BlcnRpZXMudGV4dHVyZVByb3BlcnRpZXM/LlsnX1V2QW5pbU1hc2tUZXh0dXJlJ107XG4gICAgY29uc3QgdXZBbmltYXRpb25NYXNrVGV4dHVyZSA9XG4gICAgICB1dkFuaW1hdGlvbk1hc2tUZXh0dXJlSW5kZXggIT0gbnVsbFxuICAgICAgICA/IHtcbiAgICAgICAgICAgIGluZGV4OiB1dkFuaW1hdGlvbk1hc2tUZXh0dXJlSW5kZXgsXG4gICAgICAgICAgICBleHRlbnNpb25zOiB7XG4gICAgICAgICAgICAgIC4uLnRleHR1cmVUcmFuc2Zvcm1FeHQsXG4gICAgICAgICAgICB9LFxuICAgICAgICAgIH1cbiAgICAgICAgOiB1bmRlZmluZWQ7XG5cbiAgICBjb25zdCB1dkFuaW1hdGlvblNjcm9sbFhTcGVlZEZhY3RvciA9IG1hdGVyaWFsUHJvcGVydGllcy5mbG9hdFByb3BlcnRpZXM/LlsnX1V2QW5pbVNjcm9sbFgnXSA/PyAwLjA7XG5cbiAgICAvLyB1dkFuaW1hdGlvblNjcm9sbFlTcGVlZEZhY3RvciB3aWxsIGJlIG9wcG9zaXRlIGJldHdlZW4gVjAgYW5kIFYxXG4gICAgbGV0IHV2QW5pbWF0aW9uU2Nyb2xsWVNwZWVkRmFjdG9yID0gbWF0ZXJpYWxQcm9wZXJ0aWVzLmZsb2F0UHJvcGVydGllcz8uWydfVXZBbmltU2Nyb2xsWSddID8/IDAuMDtcbiAgICBpZiAodXZBbmltYXRpb25TY3JvbGxZU3BlZWRGYWN0b3IgIT0gbnVsbCkge1xuICAgICAgdXZBbmltYXRpb25TY3JvbGxZU3BlZWRGYWN0b3IgPSAtdXZBbmltYXRpb25TY3JvbGxZU3BlZWRGYWN0b3I7XG4gICAgfVxuXG4gICAgY29uc3QgdXZBbmltYXRpb25Sb3RhdGlvblNwZWVkRmFjdG9yID0gbWF0ZXJpYWxQcm9wZXJ0aWVzLmZsb2F0UHJvcGVydGllcz8uWydfVXZBbmltUm90YXRpb24nXSA/PyAwLjA7XG5cbiAgICBjb25zdCBtdG9vbkV4dGVuc2lvbjogVjFNVG9vblNjaGVtYS5WUk1DTWF0ZXJpYWxzTVRvb24gPSB7XG4gICAgICBzcGVjVmVyc2lvbjogJzEuMCcsXG4gICAgICB0cmFuc3BhcmVudFdpdGhaV3JpdGUsXG4gICAgICByZW5kZXJRdWV1ZU9mZnNldE51bWJlcixcbiAgICAgIHNoYWRlQ29sb3JGYWN0b3IsXG4gICAgICBzaGFkZU11bHRpcGx5VGV4dHVyZSxcbiAgICAgIHNoYWRpbmdTaGlmdEZhY3RvcixcbiAgICAgIHNoYWRpbmdUb29ueUZhY3RvcixcbiAgICAgIGdpRXF1YWxpemF0aW9uRmFjdG9yLFxuICAgICAgbWF0Y2FwRmFjdG9yLFxuICAgICAgbWF0Y2FwVGV4dHVyZSxcbiAgICAgIHJpbUxpZ2h0aW5nTWl4RmFjdG9yLFxuICAgICAgcmltTXVsdGlwbHlUZXh0dXJlLFxuICAgICAgcGFyYW1ldHJpY1JpbUNvbG9yRmFjdG9yLFxuICAgICAgcGFyYW1ldHJpY1JpbUZyZXNuZWxQb3dlckZhY3RvcixcbiAgICAgIHBhcmFtZXRyaWNSaW1MaWZ0RmFjdG9yLFxuICAgICAgb3V0bGluZVdpZHRoTW9kZSxcbiAgICAgIG91dGxpbmVXaWR0aEZhY3RvcixcbiAgICAgIG91dGxpbmVXaWR0aE11bHRpcGx5VGV4dHVyZSxcbiAgICAgIG91dGxpbmVDb2xvckZhY3RvcixcbiAgICAgIG91dGxpbmVMaWdodGluZ01peEZhY3RvcixcbiAgICAgIHV2QW5pbWF0aW9uTWFza1RleHR1cmUsXG4gICAgICB1dkFuaW1hdGlvblNjcm9sbFhTcGVlZEZhY3RvcixcbiAgICAgIHV2QW5pbWF0aW9uU2Nyb2xsWVNwZWVkRmFjdG9yLFxuICAgICAgdXZBbmltYXRpb25Sb3RhdGlvblNwZWVkRmFjdG9yLFxuICAgIH07XG5cbiAgICByZXR1cm4ge1xuICAgICAgLi4uc2NoZW1hTWF0ZXJpYWwsXG5cbiAgICAgIHBick1ldGFsbGljUm91Z2huZXNzOiB7XG4gICAgICAgIGJhc2VDb2xvckZhY3RvcixcbiAgICAgICAgYmFzZUNvbG9yVGV4dHVyZSxcbiAgICAgIH0sXG4gICAgICBub3JtYWxUZXh0dXJlLFxuICAgICAgZW1pc3NpdmVUZXh0dXJlLFxuICAgICAgZW1pc3NpdmVGYWN0b3IsXG4gICAgICBhbHBoYU1vZGUsXG4gICAgICBhbHBoYUN1dG9mZixcbiAgICAgIGRvdWJsZVNpZGVkLFxuICAgICAgZXh0ZW5zaW9uczoge1xuICAgICAgICAvLyBlc2xpbnQtZGlzYWJsZS1uZXh0LWxpbmUgQHR5cGVzY3JpcHQtZXNsaW50L25hbWluZy1jb252ZW50aW9uXG4gICAgICAgIFZSTUNfbWF0ZXJpYWxzX210b29uOiBtdG9vbkV4dGVuc2lvbixcbiAgICAgIH0sXG4gICAgfTtcbiAgfVxuXG4gIHByaXZhdGUgX3BhcnNlVjBVbmxpdFByb3BlcnRpZXMoXG4gICAgbWF0ZXJpYWxQcm9wZXJ0aWVzOiBWME1hdGVyaWFsLFxuICAgIHNjaGVtYU1hdGVyaWFsOiBHTFRGU2NoZW1hLklNYXRlcmlhbCxcbiAgKTogR0xURlNjaGVtYS5JTWF0ZXJpYWwge1xuICAgIGNvbnN0IGlzVHJhbnNwYXJlbnRaV3JpdGUgPSBtYXRlcmlhbFByb3BlcnRpZXMuc2hhZGVyID09PSAnVlJNL1VubGl0VHJhbnNwYXJlbnRaV3JpdGUnO1xuICAgIGNvbnN0IGlzVHJhbnNwYXJlbnQgPSBtYXRlcmlhbFByb3BlcnRpZXMuc2hhZGVyID09PSAnVlJNL1VubGl0VHJhbnNwYXJlbnQnIHx8IGlzVHJhbnNwYXJlbnRaV3JpdGU7XG5cbiAgICBjb25zdCByZW5kZXJRdWV1ZU9mZnNldE51bWJlciA9IHRoaXMuX3YwUGFyc2VSZW5kZXJRdWV1ZShtYXRlcmlhbFByb3BlcnRpZXMpO1xuXG4gICAgY29uc3QgaXNDdXRvZmYgPSBtYXRlcmlhbFByb3BlcnRpZXMuc2hhZGVyID09PSAnVlJNL1VubGl0Q3V0b3V0JztcbiAgICBjb25zdCBhbHBoYU1vZGUgPSBpc1RyYW5zcGFyZW50ID8gJ0JMRU5EJyA6IGlzQ3V0b2ZmID8gJ01BU0snIDogJ09QQVFVRSc7XG4gICAgY29uc3QgYWxwaGFDdXRvZmYgPSBpc0N1dG9mZiA/IChtYXRlcmlhbFByb3BlcnRpZXMuZmxvYXRQcm9wZXJ0aWVzPy5bJ19DdXRvZmYnXSA/PyAwLjUpIDogdW5kZWZpbmVkO1xuXG4gICAgY29uc3QgdGV4dHVyZVRyYW5zZm9ybUV4dCA9IHRoaXMuX3BvcnRUZXh0dXJlVHJhbnNmb3JtKG1hdGVyaWFsUHJvcGVydGllcyk7XG5cbiAgICBjb25zdCBiYXNlQ29sb3JGYWN0b3IgPSAobWF0ZXJpYWxQcm9wZXJ0aWVzLnZlY3RvclByb3BlcnRpZXM/LlsnX0NvbG9yJ10gPz8gWzEuMCwgMS4wLCAxLjAsIDEuMF0pLm1hcChnYW1tYUVPVEYpO1xuICAgIGNvbnN0IGJhc2VDb2xvclRleHR1cmVJbmRleCA9IG1hdGVyaWFsUHJvcGVydGllcy50ZXh0dXJlUHJvcGVydGllcz8uWydfTWFpblRleCddO1xuICAgIGNvbnN0IGJhc2VDb2xvclRleHR1cmUgPVxuICAgICAgYmFzZUNvbG9yVGV4dHVyZUluZGV4ICE9IG51bGxcbiAgICAgICAgPyB7XG4gICAgICAgICAgICBpbmRleDogYmFzZUNvbG9yVGV4dHVyZUluZGV4LFxuICAgICAgICAgICAgZXh0ZW5zaW9uczoge1xuICAgICAgICAgICAgICAuLi50ZXh0dXJlVHJhbnNmb3JtRXh0LFxuICAgICAgICAgICAgfSxcbiAgICAgICAgICB9XG4gICAgICAgIDogdW5kZWZpbmVkO1xuXG4gICAgLy8gdXNlIG10b29uIGluc3RlYWQgb2YgdW5saXQsIHNpbmNlIHRoZXJlIG1pZ2h0IGJlIFZSTTAuMCBzcGVjaWZpYyBmZWF0dXJlcyB0aGF0IGFyZSBub3Qgc3VwcG9ydGVkIGJ5IGdsdGZcbiAgICBjb25zdCBtdG9vbkV4dGVuc2lvbjogVjFNVG9vblNjaGVtYS5WUk1DTWF0ZXJpYWxzTVRvb24gPSB7XG4gICAgICBzcGVjVmVyc2lvbjogJzEuMCcsXG4gICAgICB0cmFuc3BhcmVudFdpdGhaV3JpdGU6IGlzVHJhbnNwYXJlbnRaV3JpdGUsXG4gICAgICByZW5kZXJRdWV1ZU9mZnNldE51bWJlcixcbiAgICAgIHNoYWRlQ29sb3JGYWN0b3I6IGJhc2VDb2xvckZhY3RvcixcbiAgICAgIHNoYWRlTXVsdGlwbHlUZXh0dXJlOiBiYXNlQ29sb3JUZXh0dXJlLFxuICAgIH07XG5cbiAgICByZXR1cm4ge1xuICAgICAgLi4uc2NoZW1hTWF0ZXJpYWwsXG5cbiAgICAgIHBick1ldGFsbGljUm91Z2huZXNzOiB7XG4gICAgICAgIGJhc2VDb2xvckZhY3RvcixcbiAgICAgICAgYmFzZUNvbG9yVGV4dHVyZSxcbiAgICAgIH0sXG4gICAgICBhbHBoYU1vZGUsXG4gICAgICBhbHBoYUN1dG9mZixcbiAgICAgIGV4dGVuc2lvbnM6IHtcbiAgICAgICAgLy8gZXNsaW50LWRpc2FibGUtbmV4dC1saW5lIEB0eXBlc2NyaXB0LWVzbGludC9uYW1pbmctY29udmVudGlvblxuICAgICAgICBWUk1DX21hdGVyaWFsc19tdG9vbjogbXRvb25FeHRlbnNpb24sXG4gICAgICB9LFxuICAgIH07XG4gIH1cblxuICAvKipcbiAgICogQ3JlYXRlIGEgZ2xURiBgS0hSX3RleHR1cmVfdHJhbnNmb3JtYCBleHRlbnNpb24gZnJvbSB2MCB0ZXh0dXJlIHRyYW5zZm9ybSBpbmZvLlxuICAgKi9cbiAgcHJpdmF0ZSBfcG9ydFRleHR1cmVUcmFuc2Zvcm0obWF0ZXJpYWxQcm9wZXJ0aWVzOiBWME1hdGVyaWFsKTogeyBbbmFtZTogc3RyaW5nXTogYW55IH0ge1xuICAgIGNvbnN0IHRleHR1cmVUcmFuc2Zvcm0gPSBtYXRlcmlhbFByb3BlcnRpZXMudmVjdG9yUHJvcGVydGllcz8uWydfTWFpblRleCddO1xuICAgIGlmICh0ZXh0dXJlVHJhbnNmb3JtID09IG51bGwpIHtcbiAgICAgIHJldHVybiB7fTtcbiAgICB9XG5cbiAgICBjb25zdCBvZmZzZXQgPSBbdGV4dHVyZVRyYW5zZm9ybT8uWzBdID8/IDAuMCwgdGV4dHVyZVRyYW5zZm9ybT8uWzFdID8/IDAuMF07XG4gICAgY29uc3Qgc2NhbGUgPSBbdGV4dHVyZVRyYW5zZm9ybT8uWzJdID8/IDEuMCwgdGV4dHVyZVRyYW5zZm9ybT8uWzNdID8/IDEuMF07XG5cbiAgICBvZmZzZXRbMV0gPSAxLjAgLSBzY2FsZVsxXSAtIG9mZnNldFsxXTtcblxuICAgIHJldHVybiB7XG4gICAgICAvLyBlc2xpbnQtZGlzYWJsZS1uZXh0LWxpbmUgQHR5cGVzY3JpcHQtZXNsaW50L25hbWluZy1jb252ZW50aW9uXG4gICAgICBLSFJfdGV4dHVyZV90cmFuc2Zvcm06IHsgb2Zmc2V0LCBzY2FsZSB9LFxuICAgIH07XG4gIH1cblxuICAvKipcbiAgICogQ29udmVydCB2MCByZW5kZXIgb3JkZXIgaW50byB2MSByZW5kZXIgb3JkZXIuXG4gICAqIFRoaXMgdXNlcyBhIG1hcCBmcm9tIHYwIHJlbmRlciBxdWV1ZSB0byB2MSBjb21wbGlhbnQgcmVuZGVyIHF1ZXVlIG9mZnNldCB3aGljaCBpcyBnZW5lcmF0ZWQgaW4ge0BsaW5rIF9wb3B1bGF0ZVJlbmRlclF1ZXVlTWFwfS5cbiAgICovXG4gIHByaXZhdGUgX3YwUGFyc2VSZW5kZXJRdWV1ZShtYXRlcmlhbFByb3BlcnRpZXM6IFYwTWF0ZXJpYWwpOiBudW1iZXIge1xuICAgIGNvbnN0IGlzVHJhbnNwYXJlbnRaV3JpdGUgPSBtYXRlcmlhbFByb3BlcnRpZXMuc2hhZGVyID09PSAnVlJNL1VubGl0VHJhbnNwYXJlbnRaV3JpdGUnO1xuICAgIGNvbnN0IGlzVHJhbnNwYXJlbnQgPVxuICAgICAgbWF0ZXJpYWxQcm9wZXJ0aWVzLmtleXdvcmRNYXA/LlsnX0FMUEhBQkxFTkRfT04nXSAhPSB1bmRlZmluZWQgfHxcbiAgICAgIG1hdGVyaWFsUHJvcGVydGllcy5zaGFkZXIgPT09ICdWUk0vVW5saXRUcmFuc3BhcmVudCcgfHxcbiAgICAgIGlzVHJhbnNwYXJlbnRaV3JpdGU7XG4gICAgY29uc3QgZW5hYmxlZFpXcml0ZSA9IG1hdGVyaWFsUHJvcGVydGllcy5mbG9hdFByb3BlcnRpZXM/LlsnX1pXcml0ZSddID09PSAxIHx8IGlzVHJhbnNwYXJlbnRaV3JpdGU7XG5cbiAgICBsZXQgb2Zmc2V0ID0gMDtcblxuICAgIGlmIChpc1RyYW5zcGFyZW50KSB7XG4gICAgICBjb25zdCB2MFF1ZXVlID0gbWF0ZXJpYWxQcm9wZXJ0aWVzLnJlbmRlclF1ZXVlO1xuXG4gICAgICBpZiAodjBRdWV1ZSAhPSBudWxsKSB7XG4gICAgICAgIGlmIChlbmFibGVkWldyaXRlKSB7XG4gICAgICAgICAgb2Zmc2V0ID0gdGhpcy5fcmVuZGVyUXVldWVNYXBUcmFuc3BhcmVudFpXcml0ZS5nZXQodjBRdWV1ZSkhO1xuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgIG9mZnNldCA9IHRoaXMuX3JlbmRlclF1ZXVlTWFwVHJhbnNwYXJlbnQuZ2V0KHYwUXVldWUpITtcbiAgICAgICAgfVxuICAgICAgfVxuICAgIH1cblxuICAgIHJldHVybiBvZmZzZXQ7XG4gIH1cblxuICAvKipcbiAgICogQ3JlYXRlIGEgbWFwIHdoaWNoIG1hcHMgdjAgcmVuZGVyIHF1ZXVlIHRvIHYxIGNvbXBsaWFudCByZW5kZXIgcXVldWUgb2Zmc2V0LlxuICAgKiBUaGlzIGxpc3RzIHVwIGFsbCByZW5kZXIgcXVldWVzIHRoZSBtb2RlbCB1c2UgYW5kIGNyZWF0ZXMgYSBtYXAgdG8gbmV3IHJlbmRlciBxdWV1ZSBvZmZzZXRzIGluIHRoZSBzYW1lIG9yZGVyLlxuICAgKi9cbiAgcHJpdmF0ZSBfcG9wdWxhdGVSZW5kZXJRdWV1ZU1hcChtYXRlcmlhbFByb3BlcnRpZXNMaXN0OiBWME1hdGVyaWFsW10pIHtcbiAgICAvKipcbiAgICAgKiBBIHNldCBvZiB1c2VkIHJlbmRlciBxdWV1ZXMgaW4gVHJhbnNwYXJlbnQgbWF0ZXJpYWxzLlxuICAgICAqL1xuICAgIGNvbnN0IHJlbmRlclF1ZXVlc1RyYW5zcGFyZW50ID0gbmV3IFNldDxudW1iZXI+KCk7XG5cbiAgICAvKipcbiAgICAgKiBBIHNldCBvZiB1c2VkIHJlbmRlciBxdWV1ZXMgaW4gVHJhbnNwYXJlbnRaV3JpdGUgbWF0ZXJpYWxzLlxuICAgICAqL1xuICAgIGNvbnN0IHJlbmRlclF1ZXVlc1RyYW5zcGFyZW50WldyaXRlID0gbmV3IFNldDxudW1iZXI+KCk7XG5cbiAgICAvLyBwb3B1bGF0ZSB0aGUgcmVuZGVyIHF1ZXVlIHNldFxuICAgIG1hdGVyaWFsUHJvcGVydGllc0xpc3QuZm9yRWFjaCgobWF0ZXJpYWxQcm9wZXJ0aWVzKSA9PiB7XG4gICAgICBjb25zdCBpc1RyYW5zcGFyZW50WldyaXRlID0gbWF0ZXJpYWxQcm9wZXJ0aWVzLnNoYWRlciA9PT0gJ1ZSTS9VbmxpdFRyYW5zcGFyZW50WldyaXRlJztcbiAgICAgIGNvbnN0IGlzVHJhbnNwYXJlbnQgPVxuICAgICAgICBtYXRlcmlhbFByb3BlcnRpZXMua2V5d29yZE1hcD8uWydfQUxQSEFCTEVORF9PTiddICE9IHVuZGVmaW5lZCB8fFxuICAgICAgICBtYXRlcmlhbFByb3BlcnRpZXMuc2hhZGVyID09PSAnVlJNL1VubGl0VHJhbnNwYXJlbnQnIHx8XG4gICAgICAgIGlzVHJhbnNwYXJlbnRaV3JpdGU7XG4gICAgICBjb25zdCBlbmFibGVkWldyaXRlID0gbWF0ZXJpYWxQcm9wZXJ0aWVzLmZsb2F0UHJvcGVydGllcz8uWydfWldyaXRlJ10gPT09IDEgfHwgaXNUcmFuc3BhcmVudFpXcml0ZTtcblxuICAgICAgaWYgKGlzVHJhbnNwYXJlbnQpIHtcbiAgICAgICAgY29uc3QgdjBRdWV1ZSA9IG1hdGVyaWFsUHJvcGVydGllcy5yZW5kZXJRdWV1ZTtcblxuICAgICAgICBpZiAodjBRdWV1ZSAhPSBudWxsKSB7XG4gICAgICAgICAgaWYgKGVuYWJsZWRaV3JpdGUpIHtcbiAgICAgICAgICAgIHJlbmRlclF1ZXVlc1RyYW5zcGFyZW50WldyaXRlLmFkZCh2MFF1ZXVlKTtcbiAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgcmVuZGVyUXVldWVzVHJhbnNwYXJlbnQuYWRkKHYwUXVldWUpO1xuICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgICAgfVxuICAgIH0pO1xuXG4gICAgLy8gc2hvdyBhIHdhcm5pbmcgaWYgdGhlIG1vZGVsIHVzZXMgdjEgaW5jb21wYXRpYmxlIG51bWJlciBvZiByZW5kZXIgcXVldWVzXG4gICAgaWYgKHJlbmRlclF1ZXVlc1RyYW5zcGFyZW50LnNpemUgPiAxMCkge1xuICAgICAgY29uc29sZS53YXJuKFxuICAgICAgICBgVlJNTWF0ZXJpYWxzVjBDb21wYXRQbHVnaW46IFRoaXMgVlJNIHVzZXMgJHtyZW5kZXJRdWV1ZXNUcmFuc3BhcmVudC5zaXplfSByZW5kZXIgcXVldWVzIGZvciBUcmFuc3BhcmVudCBtYXRlcmlhbHMgd2hpbGUgVlJNIDEuMCBvbmx5IHN1cHBvcnRzIHVwIHRvIDEwIHJlbmRlciBxdWV1ZXMuIFRoZSBtb2RlbCBtaWdodCBub3QgYmUgcmVuZGVyZWQgY29ycmVjdGx5LmAsXG4gICAgICApO1xuICAgIH1cblxuICAgIGlmIChyZW5kZXJRdWV1ZXNUcmFuc3BhcmVudFpXcml0ZS5zaXplID4gMTApIHtcbiAgICAgIGNvbnNvbGUud2FybihcbiAgICAgICAgYFZSTU1hdGVyaWFsc1YwQ29tcGF0UGx1Z2luOiBUaGlzIFZSTSB1c2VzICR7cmVuZGVyUXVldWVzVHJhbnNwYXJlbnRaV3JpdGUuc2l6ZX0gcmVuZGVyIHF1ZXVlcyBmb3IgVHJhbnNwYXJlbnRaV3JpdGUgbWF0ZXJpYWxzIHdoaWxlIFZSTSAxLjAgb25seSBzdXBwb3J0cyB1cCB0byAxMCByZW5kZXIgcXVldWVzLiBUaGUgbW9kZWwgbWlnaHQgbm90IGJlIHJlbmRlcmVkIGNvcnJlY3RseS5gLFxuICAgICAgKTtcbiAgICB9XG5cbiAgICAvLyBjcmVhdGUgYSBtYXAgZnJvbSB2MCByZW5kZXIgcXVldWUgdG8gdjEgcmVuZGVyIHF1ZXVlIG9mZnNldFxuICAgIEFycmF5LmZyb20ocmVuZGVyUXVldWVzVHJhbnNwYXJlbnQpXG4gICAgICAuc29ydCgpXG4gICAgICAuZm9yRWFjaCgocXVldWUsIGkpID0+IHtcbiAgICAgICAgY29uc3QgbmV3UXVldWVPZmZzZXQgPSBNYXRoLm1pbihNYXRoLm1heChpIC0gcmVuZGVyUXVldWVzVHJhbnNwYXJlbnQuc2l6ZSArIDEsIC05KSwgMCk7XG4gICAgICAgIHRoaXMuX3JlbmRlclF1ZXVlTWFwVHJhbnNwYXJlbnQuc2V0KHF1ZXVlLCBuZXdRdWV1ZU9mZnNldCk7XG4gICAgICB9KTtcblxuICAgIEFycmF5LmZyb20ocmVuZGVyUXVldWVzVHJhbnNwYXJlbnRaV3JpdGUpXG4gICAgICAuc29ydCgpXG4gICAgICAuZm9yRWFjaCgocXVldWUsIGkpID0+IHtcbiAgICAgICAgY29uc3QgbmV3UXVldWVPZmZzZXQgPSBNYXRoLm1pbihNYXRoLm1heChpLCAwKSwgOSk7XG4gICAgICAgIHRoaXMuX3JlbmRlclF1ZXVlTWFwVHJhbnNwYXJlbnRaV3JpdGUuc2V0KHF1ZXVlLCBuZXdRdWV1ZU9mZnNldCk7XG4gICAgICB9KTtcbiAgfVxufVxuIiwgImV4cG9ydCBmdW5jdGlvbiBnYW1tYUVPVEYoZTogbnVtYmVyKTogbnVtYmVyIHtcbiAgcmV0dXJuIE1hdGgucG93KGUsIDIuMik7XG59XG4iLCAiaW1wb3J0ICogYXMgVEhSRUUgZnJvbSAndGhyZWUnO1xuaW1wb3J0IHsgVlJNTm9kZUNvbnN0cmFpbnQgfSBmcm9tICcuLi9WUk1Ob2RlQ29uc3RyYWludCc7XG5cbmNvbnN0IF92M0EgPSBuZXcgVEhSRUUuVmVjdG9yMygpO1xuXG5leHBvcnQgY2xhc3MgVlJNTm9kZUNvbnN0cmFpbnRIZWxwZXIgZXh0ZW5kcyBUSFJFRS5Hcm91cCB7XG4gIHB1YmxpYyByZWFkb25seSBjb25zdHJhaW50OiBWUk1Ob2RlQ29uc3RyYWludDtcbiAgcHJpdmF0ZSBfbGluZTogVEhSRUUuTGluZTtcbiAgcHJpdmF0ZSBfYXR0clBvc2l0aW9uOiBUSFJFRS5CdWZmZXJBdHRyaWJ1dGU7XG5cbiAgcHVibGljIGNvbnN0cnVjdG9yKGNvbnN0cmFpbnQ6IFZSTU5vZGVDb25zdHJhaW50KSB7XG4gICAgc3VwZXIoKTtcblxuICAgIHRoaXMuX2F0dHJQb3NpdGlvbiA9IG5ldyBUSFJFRS5CdWZmZXJBdHRyaWJ1dGUobmV3IEZsb2F0MzJBcnJheShbMCwgMCwgMCwgMCwgMCwgMF0pLCAzKTtcbiAgICB0aGlzLl9hdHRyUG9zaXRpb24uc2V0VXNhZ2UoVEhSRUUuRHluYW1pY0RyYXdVc2FnZSk7XG5cbiAgICBjb25zdCBnZW9tZXRyeSA9IG5ldyBUSFJFRS5CdWZmZXJHZW9tZXRyeSgpO1xuICAgIGdlb21ldHJ5LnNldEF0dHJpYnV0ZSgncG9zaXRpb24nLCB0aGlzLl9hdHRyUG9zaXRpb24pO1xuXG4gICAgY29uc3QgbWF0ZXJpYWwgPSBuZXcgVEhSRUUuTGluZUJhc2ljTWF0ZXJpYWwoe1xuICAgICAgY29sb3I6IDB4ZmYwMGZmLFxuICAgICAgZGVwdGhUZXN0OiBmYWxzZSxcbiAgICAgIGRlcHRoV3JpdGU6IGZhbHNlLFxuICAgIH0pO1xuXG4gICAgdGhpcy5fbGluZSA9IG5ldyBUSFJFRS5MaW5lKGdlb21ldHJ5LCBtYXRlcmlhbCk7XG4gICAgdGhpcy5hZGQodGhpcy5fbGluZSk7XG5cbiAgICB0aGlzLmNvbnN0cmFpbnQgPSBjb25zdHJhaW50O1xuICB9XG5cbiAgcHVibGljIHVwZGF0ZU1hdHJpeFdvcmxkKGZvcmNlPzogYm9vbGVhbik6IHZvaWQge1xuICAgIF92M0Euc2V0RnJvbU1hdHJpeFBvc2l0aW9uKHRoaXMuY29uc3RyYWludC5kZXN0aW5hdGlvbi5tYXRyaXhXb3JsZCk7XG4gICAgdGhpcy5fYXR0clBvc2l0aW9uLnNldFhZWigwLCBfdjNBLngsIF92M0EueSwgX3YzQS56KTtcblxuICAgIGlmICh0aGlzLmNvbnN0cmFpbnQuc291cmNlKSB7XG4gICAgICBfdjNBLnNldEZyb21NYXRyaXhQb3NpdGlvbih0aGlzLmNvbnN0cmFpbnQuc291cmNlLm1hdHJpeFdvcmxkKTtcbiAgICB9XG4gICAgdGhpcy5fYXR0clBvc2l0aW9uLnNldFhZWigxLCBfdjNBLngsIF92M0EueSwgX3YzQS56KTtcblxuICAgIHRoaXMuX2F0dHJQb3NpdGlvbi5uZWVkc1VwZGF0ZSA9IHRydWU7XG5cbiAgICBzdXBlci51cGRhdGVNYXRyaXhXb3JsZChmb3JjZSk7XG4gIH1cbn1cbiIsICJpbXBvcnQgKiBhcyBUSFJFRSBmcm9tICd0aHJlZSc7XG5pbXBvcnQgeyBkZWNvbXBvc2VQb3NpdGlvbiB9IGZyb20gJy4vdXRpbHMvZGVjb21wb3NlUG9zaXRpb24nO1xuaW1wb3J0IHsgZGVjb21wb3NlUm90YXRpb24gfSBmcm9tICcuL3V0aWxzL2RlY29tcG9zZVJvdGF0aW9uJztcbmltcG9ydCB7IHF1YXRJbnZlcnRDb21wYXQgfSBmcm9tICcuL3V0aWxzL3F1YXRJbnZlcnRDb21wYXQnO1xuaW1wb3J0IHsgVlJNTm9kZUNvbnN0cmFpbnQgfSBmcm9tICcuL1ZSTU5vZGVDb25zdHJhaW50JztcblxuY29uc3QgX3YzQSA9IG5ldyBUSFJFRS5WZWN0b3IzKCk7XG5jb25zdCBfdjNCID0gbmV3IFRIUkVFLlZlY3RvcjMoKTtcbmNvbnN0IF92M0MgPSBuZXcgVEhSRUUuVmVjdG9yMygpO1xuY29uc3QgX3F1YXRBID0gbmV3IFRIUkVFLlF1YXRlcm5pb24oKTtcbmNvbnN0IF9xdWF0QiA9IG5ldyBUSFJFRS5RdWF0ZXJuaW9uKCk7XG5jb25zdCBfcXVhdEMgPSBuZXcgVEhSRUUuUXVhdGVybmlvbigpO1xuXG4vKipcbiAqIEEgY29uc3RyYWludCB0aGF0IG1ha2VzIGl0IGxvb2sgYXQgYSBzb3VyY2Ugb2JqZWN0LlxuICpcbiAqIFNlZTogaHR0cHM6Ly9naXRodWIuY29tL3ZybS1jL3ZybS1zcGVjaWZpY2F0aW9uL3RyZWUvbWFzdGVyL3NwZWNpZmljYXRpb24vVlJNQ19ub2RlX2NvbnN0cmFpbnQtMS4wX2JldGEjcm9sbC1jb25zdHJhaW50XG4gKi9cbmV4cG9ydCBjbGFzcyBWUk1BaW1Db25zdHJhaW50IGV4dGVuZHMgVlJNTm9kZUNvbnN0cmFpbnQge1xuICAvKipcbiAgICogVGhlIGFpbSBheGlzIG9mIHRoZSBjb25zdHJhaW50LlxuICAgKi9cbiAgcHVibGljIGdldCBhaW1BeGlzKCk6ICdQb3NpdGl2ZVgnIHwgJ05lZ2F0aXZlWCcgfCAnUG9zaXRpdmVZJyB8ICdOZWdhdGl2ZVknIHwgJ1Bvc2l0aXZlWicgfCAnTmVnYXRpdmVaJyB7XG4gICAgcmV0dXJuIHRoaXMuX2FpbUF4aXM7XG4gIH1cblxuICAvKipcbiAgICogVGhlIGFpbSBheGlzIG9mIHRoZSBjb25zdHJhaW50LlxuICAgKi9cbiAgcHVibGljIHNldCBhaW1BeGlzKGFpbUF4aXM6ICdQb3NpdGl2ZVgnIHwgJ05lZ2F0aXZlWCcgfCAnUG9zaXRpdmVZJyB8ICdOZWdhdGl2ZVknIHwgJ1Bvc2l0aXZlWicgfCAnTmVnYXRpdmVaJykge1xuICAgIHRoaXMuX2FpbUF4aXMgPSBhaW1BeGlzO1xuICAgIHRoaXMuX3YzQWltQXhpcy5zZXQoXG4gICAgICBhaW1BeGlzID09PSAnUG9zaXRpdmVYJyA/IDEuMCA6IGFpbUF4aXMgPT09ICdOZWdhdGl2ZVgnID8gLTEuMCA6IDAuMCxcbiAgICAgIGFpbUF4aXMgPT09ICdQb3NpdGl2ZVknID8gMS4wIDogYWltQXhpcyA9PT0gJ05lZ2F0aXZlWScgPyAtMS4wIDogMC4wLFxuICAgICAgYWltQXhpcyA9PT0gJ1Bvc2l0aXZlWicgPyAxLjAgOiBhaW1BeGlzID09PSAnTmVnYXRpdmVaJyA/IC0xLjAgOiAwLjAsXG4gICAgKTtcbiAgfVxuXG4gIC8qKlxuICAgKiBUaGUgYWltIGF4aXMgb2YgdGhlIGNvbnN0cmFpbnQuXG4gICAqL1xuICBwcml2YXRlIF9haW1BeGlzOiAnUG9zaXRpdmVYJyB8ICdOZWdhdGl2ZVgnIHwgJ1Bvc2l0aXZlWScgfCAnTmVnYXRpdmVZJyB8ICdQb3NpdGl2ZVonIHwgJ05lZ2F0aXZlWic7XG5cbiAgLyoqXG4gICAqIFRoZSB7QGxpbmsgX2FpbUF4aXN9IGJ1dCBpbiBhbiBhY3R1YWwgVmVjdG9yMyBmb3JtLlxuICAgKi9cbiAgcHJpdmF0ZSBfdjNBaW1BeGlzOiBUSFJFRS5WZWN0b3IzO1xuXG4gIC8qKlxuICAgKiBUaGUgcmVzdCBxdWF0ZXJuaW9uIG9mIHRoZSB7QGxpbmsgZGVzdGluYXRpb259LlxuICAgKi9cbiAgcHJpdmF0ZSBfZHN0UmVzdFF1YXQ6IFRIUkVFLlF1YXRlcm5pb247XG5cbiAgcHVibGljIGdldCBkZXBlbmRlbmNpZXMoKTogU2V0PFRIUkVFLk9iamVjdDNEPiB7XG4gICAgY29uc3Qgc2V0ID0gbmV3IFNldDxUSFJFRS5PYmplY3QzRD4oW3RoaXMuc291cmNlXSk7XG5cbiAgICBpZiAodGhpcy5kZXN0aW5hdGlvbi5wYXJlbnQpIHtcbiAgICAgIHNldC5hZGQodGhpcy5kZXN0aW5hdGlvbi5wYXJlbnQpO1xuICAgIH1cblxuICAgIHJldHVybiBzZXQ7XG4gIH1cblxuICBwdWJsaWMgY29uc3RydWN0b3IoZGVzdGluYXRpb246IFRIUkVFLk9iamVjdDNELCBzb3VyY2U6IFRIUkVFLk9iamVjdDNEKSB7XG4gICAgc3VwZXIoZGVzdGluYXRpb24sIHNvdXJjZSk7XG5cbiAgICB0aGlzLl9haW1BeGlzID0gJ1Bvc2l0aXZlWCc7XG4gICAgdGhpcy5fdjNBaW1BeGlzID0gbmV3IFRIUkVFLlZlY3RvcjMoMSwgMCwgMCk7XG5cbiAgICB0aGlzLl9kc3RSZXN0UXVhdCA9IG5ldyBUSFJFRS5RdWF0ZXJuaW9uKCk7XG4gIH1cblxuICBwdWJsaWMgc2V0SW5pdFN0YXRlKCk6IHZvaWQge1xuICAgIHRoaXMuX2RzdFJlc3RRdWF0LmNvcHkodGhpcy5kZXN0aW5hdGlvbi5xdWF0ZXJuaW9uKTtcbiAgfVxuXG4gIHB1YmxpYyB1cGRhdGUoKTogdm9pZCB7XG4gICAgLy8gdXBkYXRlIHdvcmxkIG1hdHJpeCBvZiBkZXN0aW5hdGlvbiBhbmQgc291cmNlIG1hbnVhbGx5XG4gICAgdGhpcy5kZXN0aW5hdGlvbi51cGRhdGVXb3JsZE1hdHJpeCh0cnVlLCBmYWxzZSk7XG4gICAgdGhpcy5zb3VyY2UudXBkYXRlV29ybGRNYXRyaXgodHJ1ZSwgZmFsc2UpO1xuXG4gICAgLy8gZ2V0IHdvcmxkIHF1YXRlcm5pb24gb2YgdGhlIHBhcmVudCBvZiB0aGUgZGVzdGluYXRpb25cbiAgICBjb25zdCBkc3RQYXJlbnRXb3JsZFF1YXQgPSBfcXVhdEEuaWRlbnRpdHkoKTtcbiAgICBjb25zdCBpbnZEc3RQYXJlbnRXb3JsZFF1YXQgPSBfcXVhdEIuaWRlbnRpdHkoKTtcbiAgICBpZiAodGhpcy5kZXN0aW5hdGlvbi5wYXJlbnQpIHtcbiAgICAgIGRlY29tcG9zZVJvdGF0aW9uKHRoaXMuZGVzdGluYXRpb24ucGFyZW50Lm1hdHJpeFdvcmxkLCBkc3RQYXJlbnRXb3JsZFF1YXQpO1xuICAgICAgcXVhdEludmVydENvbXBhdChpbnZEc3RQYXJlbnRXb3JsZFF1YXQuY29weShkc3RQYXJlbnRXb3JsZFF1YXQpKTtcbiAgICB9XG5cbiAgICAvLyBjYWxjdWxhdGUgZnJvbS10byB2ZWN0b3JzIGluIHdvcmxkIGNvb3JkXG4gICAgY29uc3QgYTAgPSBfdjNBLmNvcHkodGhpcy5fdjNBaW1BeGlzKS5hcHBseVF1YXRlcm5pb24odGhpcy5fZHN0UmVzdFF1YXQpLmFwcGx5UXVhdGVybmlvbihkc3RQYXJlbnRXb3JsZFF1YXQpO1xuICAgIGNvbnN0IGExID0gZGVjb21wb3NlUG9zaXRpb24odGhpcy5zb3VyY2UubWF0cml4V29ybGQsIF92M0IpXG4gICAgICAuc3ViKGRlY29tcG9zZVBvc2l0aW9uKHRoaXMuZGVzdGluYXRpb24ubWF0cml4V29ybGQsIF92M0MpKVxuICAgICAgLm5vcm1hbGl6ZSgpO1xuXG4gICAgLy8gY3JlYXRlIGEgZnJvbS10byBxdWF0ZXJuaW9uLCBjb252ZXJ0IHRvIGRlc3RpbmF0aW9uIGxvY2FsIGNvb3JkLCB0aGVuIG11bHRpcGx5IHJlc3QgcXVhdGVybmlvblxuICAgIGNvbnN0IHRhcmdldFF1YXQgPSBfcXVhdENcbiAgICAgIC5zZXRGcm9tVW5pdFZlY3RvcnMoYTAsIGExKVxuICAgICAgLnByZW11bHRpcGx5KGludkRzdFBhcmVudFdvcmxkUXVhdClcbiAgICAgIC5tdWx0aXBseShkc3RQYXJlbnRXb3JsZFF1YXQpXG4gICAgICAubXVsdGlwbHkodGhpcy5fZHN0UmVzdFF1YXQpO1xuXG4gICAgLy8gYmxlbmQgd2l0aCB0aGUgcmVzdCBxdWF0ZXJuaW9uIHVzaW5nIHdlaWdodFxuICAgIHRoaXMuZGVzdGluYXRpb24ucXVhdGVybmlvbi5jb3B5KHRoaXMuX2RzdFJlc3RRdWF0KS5zbGVycCh0YXJnZXRRdWF0LCB0aGlzLndlaWdodCk7XG4gIH1cbn1cbiIsICJpbXBvcnQgKiBhcyBUSFJFRSBmcm9tICd0aHJlZSc7XG5cbmV4cG9ydCBmdW5jdGlvbiBkZWNvbXBvc2VQb3NpdGlvbjxUIGV4dGVuZHMgVEhSRUUuVmVjdG9yMz4obWF0cml4OiBUSFJFRS5NYXRyaXg0LCB0YXJnZXQ6IFQpOiBUIHtcbiAgcmV0dXJuIHRhcmdldC5zZXQobWF0cml4LmVsZW1lbnRzWzEyXSwgbWF0cml4LmVsZW1lbnRzWzEzXSwgbWF0cml4LmVsZW1lbnRzWzE0XSk7XG59XG4iLCAiaW1wb3J0ICogYXMgVEhSRUUgZnJvbSAndGhyZWUnO1xuXG5jb25zdCBfdjNBID0gbmV3IFRIUkVFLlZlY3RvcjMoKTtcbmNvbnN0IF92M0IgPSBuZXcgVEhSRUUuVmVjdG9yMygpO1xuXG5leHBvcnQgZnVuY3Rpb24gZGVjb21wb3NlUm90YXRpb248VCBleHRlbmRzIFRIUkVFLlF1YXRlcm5pb24+KG1hdHJpeDogVEhSRUUuTWF0cml4NCwgdGFyZ2V0OiBUKTogVCB7XG4gIG1hdHJpeC5kZWNvbXBvc2UoX3YzQSwgdGFyZ2V0LCBfdjNCKTtcbiAgcmV0dXJuIHRhcmdldDtcbn1cbiIsICJpbXBvcnQgKiBhcyBUSFJFRSBmcm9tICd0aHJlZSc7XG5cbi8qKlxuICogQSBjb21wYXQgZnVuY3Rpb24gZm9yIGBRdWF0ZXJuaW9uLmludmVydCgpYCAvIGBRdWF0ZXJuaW9uLmludmVyc2UoKWAuXG4gKiBgUXVhdGVybmlvbi5pbnZlcnQoKWAgaXMgaW50cm9kdWNlZCBpbiByMTIzIGFuZCBgUXVhdGVybmlvbi5pbnZlcnNlKClgIGVtaXRzIGEgd2FybmluZy5cbiAqIFdlIGFyZSBnb2luZyB0byB1c2UgdGhpcyBjb21wYXQgZm9yIGEgd2hpbGUuXG4gKiBAcGFyYW0gdGFyZ2V0IEEgdGFyZ2V0IHF1YXRlcm5pb25cbiAqL1xuZXhwb3J0IGZ1bmN0aW9uIHF1YXRJbnZlcnRDb21wYXQ8VCBleHRlbmRzIFRIUkVFLlF1YXRlcm5pb24+KHRhcmdldDogVCk6IFQge1xuICBpZiAoKHRhcmdldCBhcyBhbnkpLmludmVydCkge1xuICAgIHRhcmdldC5pbnZlcnQoKTtcbiAgfSBlbHNlIHtcbiAgICAodGFyZ2V0IGFzIGFueSkuaW52ZXJzZSgpO1xuICB9XG5cbiAgcmV0dXJuIHRhcmdldDtcbn1cbiIsICJpbXBvcnQgKiBhcyBUSFJFRSBmcm9tICd0aHJlZSc7XG5cbi8qKlxuICogQSBiYXNlIGNsYXNzIG9mIFZSTSBjb25zdHJhaW50IGNsYXNzZXMuXG4gKi9cbmV4cG9ydCBhYnN0cmFjdCBjbGFzcyBWUk1Ob2RlQ29uc3RyYWludCB7XG4gIC8qKlxuICAgKiBUaGUgb2JqZWN0IGJlaW5nIGNvbnN0cmFpbmVkIGJ5IHRoZSB7QGxpbmsgc291cmNlfS5cbiAgICovXG4gIHB1YmxpYyBkZXN0aW5hdGlvbjogVEhSRUUuT2JqZWN0M0Q7XG5cbiAgLyoqXG4gICAqIFRoZSBvYmplY3QgY29uc3RyYWlucyB0aGUge0BsaW5rIGRlc3RpbmF0aW9ufS5cbiAgICovXG4gIHB1YmxpYyBzb3VyY2U6IFRIUkVFLk9iamVjdDNEO1xuXG4gIC8qKlxuICAgKiBUaGUgd2VpZ2h0IG9mIHRoZSBjb25zdHJhaW50LlxuICAgKi9cbiAgcHVibGljIHdlaWdodDogbnVtYmVyO1xuXG4gIHB1YmxpYyBhYnN0cmFjdCBnZXQgZGVwZW5kZW5jaWVzKCk6IFNldDxUSFJFRS5PYmplY3QzRD47XG5cbiAgLyoqXG4gICAqIEBwYXJhbSBkZXN0aW5hdGlvbiBUaGUgZGVzdGluYXRpb24gb2JqZWN0XG4gICAqIEBwYXJhbSBzb3VyY2UgVGhlIHNvdXJjZSBvYmplY3RcbiAgICovXG4gIHB1YmxpYyBjb25zdHJ1Y3RvcihkZXN0aW5hdGlvbjogVEhSRUUuT2JqZWN0M0QsIHNvdXJjZTogVEhSRUUuT2JqZWN0M0QpIHtcbiAgICB0aGlzLmRlc3RpbmF0aW9uID0gZGVzdGluYXRpb247XG4gICAgdGhpcy5zb3VyY2UgPSBzb3VyY2U7XG5cbiAgICB0aGlzLndlaWdodCA9IDEuMDtcbiAgfVxuXG4gIC8qKlxuICAgKiBTZXQgaW5pdGlhbCBzdGF0ZSBvZiB0aGUgY29uc3RyYWludC5cbiAgICovXG4gIHB1YmxpYyBhYnN0cmFjdCBzZXRJbml0U3RhdGUoKTogdm9pZDtcblxuICAvKipcbiAgICogVXBkYXRlIGFuZCBhcHBseSB0aGUgY29uc3RyYWludC5cbiAgICovXG4gIHB1YmxpYyBhYnN0cmFjdCB1cGRhdGUoKTogdm9pZDtcbn1cbiIsICJpbXBvcnQgdHlwZSAqIGFzIFRIUkVFIGZyb20gJ3RocmVlJztcblxuLyoqXG4gKiBUcmF2ZXJzZSBhbmNlc3RvcnMgb2YgZ2l2ZW4gb2JqZWN0IGFuZCBjYWxsIGdpdmVuIGNhbGxiYWNrIGZyb20gcm9vdCBzaWRlLlxuICogSXQgd2lsbCBpbmNsdWRlIHRoZSBnaXZlbiBvYmplY3QgaXRzZWxmLlxuICpcbiAqIEBwYXJhbSBvYmplY3QgVGhlIG9iamVjdCB5b3Ugd2FudCB0byB0cmF2ZXJzZVxuICogQHBhcmFtIGNhbGxiYWNrIFRoZSBjYWxsIGJhY2sgZnVuY3Rpb24gdGhhdCB3aWxsIGJlIGNhbGxlZCBmb3IgZWFjaCBhbmNlc3RvcnNcbiAqL1xuZXhwb3J0IGZ1bmN0aW9uIHRyYXZlcnNlQW5jZXN0b3JzRnJvbVJvb3Qob2JqZWN0OiBUSFJFRS5PYmplY3QzRCwgY2FsbGJhY2s6IChvYmplY3Q6IFRIUkVFLk9iamVjdDNEKSA9PiB2b2lkKTogdm9pZCB7XG4gIGNvbnN0IGFuY2VzdG9yczogVEhSRUUuT2JqZWN0M0RbXSA9IFtvYmplY3RdO1xuXG4gIGxldCBoZWFkOiBUSFJFRS5PYmplY3QzRCB8IG51bGwgPSBvYmplY3QucGFyZW50O1xuICB3aGlsZSAoaGVhZCAhPT0gbnVsbCkge1xuICAgIGFuY2VzdG9ycy51bnNoaWZ0KGhlYWQpO1xuICAgIGhlYWQgPSBoZWFkLnBhcmVudDtcbiAgfVxuXG4gIGFuY2VzdG9ycy5mb3JFYWNoKChhbmNlc3RvcikgPT4ge1xuICAgIGNhbGxiYWNrKGFuY2VzdG9yKTtcbiAgfSk7XG59XG4iLCAiaW1wb3J0IHR5cGUgKiBhcyBUSFJFRSBmcm9tICd0aHJlZSc7XG5pbXBvcnQgdHlwZSB7IFZSTU5vZGVDb25zdHJhaW50IH0gZnJvbSAnLi9WUk1Ob2RlQ29uc3RyYWludCc7XG5pbXBvcnQgeyB0cmF2ZXJzZUFuY2VzdG9yc0Zyb21Sb290IH0gZnJvbSAnLi91dGlscy90cmF2ZXJzZUFuY2VzdG9yc0Zyb21Sb290JztcblxuZXhwb3J0IGNsYXNzIFZSTU5vZGVDb25zdHJhaW50TWFuYWdlciB7XG4gIHByaXZhdGUgX2NvbnN0cmFpbnRzID0gbmV3IFNldDxWUk1Ob2RlQ29uc3RyYWludD4oKTtcbiAgcHVibGljIGdldCBjb25zdHJhaW50cygpOiBTZXQ8VlJNTm9kZUNvbnN0cmFpbnQ+IHtcbiAgICByZXR1cm4gdGhpcy5fY29uc3RyYWludHM7XG4gIH1cblxuICBwcml2YXRlIF9vYmplY3RDb25zdHJhaW50c01hcCA9IG5ldyBNYXA8VEhSRUUuT2JqZWN0M0QsIFNldDxWUk1Ob2RlQ29uc3RyYWludD4+KCk7XG5cbiAgcHVibGljIGFkZENvbnN0cmFpbnQoY29uc3RyYWludDogVlJNTm9kZUNvbnN0cmFpbnQpOiB2b2lkIHtcbiAgICB0aGlzLl9jb25zdHJhaW50cy5hZGQoY29uc3RyYWludCk7XG5cbiAgICBsZXQgb2JqZWN0U2V0ID0gdGhpcy5fb2JqZWN0Q29uc3RyYWludHNNYXAuZ2V0KGNvbnN0cmFpbnQuZGVzdGluYXRpb24pO1xuICAgIGlmIChvYmplY3RTZXQgPT0gbnVsbCkge1xuICAgICAgb2JqZWN0U2V0ID0gbmV3IFNldDxWUk1Ob2RlQ29uc3RyYWludD4oKTtcbiAgICAgIHRoaXMuX29iamVjdENvbnN0cmFpbnRzTWFwLnNldChjb25zdHJhaW50LmRlc3RpbmF0aW9uLCBvYmplY3RTZXQpO1xuICAgIH1cbiAgICBvYmplY3RTZXQuYWRkKGNvbnN0cmFpbnQpO1xuICB9XG5cbiAgcHVibGljIGRlbGV0ZUNvbnN0cmFpbnQoY29uc3RyYWludDogVlJNTm9kZUNvbnN0cmFpbnQpOiB2b2lkIHtcbiAgICB0aGlzLl9jb25zdHJhaW50cy5kZWxldGUoY29uc3RyYWludCk7XG5cbiAgICBjb25zdCBvYmplY3RTZXQgPSB0aGlzLl9vYmplY3RDb25zdHJhaW50c01hcC5nZXQoY29uc3RyYWludC5kZXN0aW5hdGlvbikhO1xuICAgIG9iamVjdFNldC5kZWxldGUoY29uc3RyYWludCk7XG4gIH1cblxuICBwdWJsaWMgc2V0SW5pdFN0YXRlKCk6IHZvaWQge1xuICAgIGNvbnN0IGNvbnN0cmFpbnRzVHJpZWQgPSBuZXcgU2V0PFZSTU5vZGVDb25zdHJhaW50PigpO1xuICAgIGNvbnN0IGNvbnN0cmFpbnRzRG9uZSA9IG5ldyBTZXQ8VlJNTm9kZUNvbnN0cmFpbnQ+KCk7XG5cbiAgICBmb3IgKGNvbnN0IGNvbnN0cmFpbnQgb2YgdGhpcy5fY29uc3RyYWludHMpIHtcbiAgICAgIHRoaXMuX3Byb2Nlc3NDb25zdHJhaW50KGNvbnN0cmFpbnQsIGNvbnN0cmFpbnRzVHJpZWQsIGNvbnN0cmFpbnRzRG9uZSwgKGNvbnN0cmFpbnQpID0+IGNvbnN0cmFpbnQuc2V0SW5pdFN0YXRlKCkpO1xuICAgIH1cbiAgfVxuXG4gIHB1YmxpYyB1cGRhdGUoKTogdm9pZCB7XG4gICAgY29uc3QgY29uc3RyYWludHNUcmllZCA9IG5ldyBTZXQ8VlJNTm9kZUNvbnN0cmFpbnQ+KCk7XG4gICAgY29uc3QgY29uc3RyYWludHNEb25lID0gbmV3IFNldDxWUk1Ob2RlQ29uc3RyYWludD4oKTtcblxuICAgIGZvciAoY29uc3QgY29uc3RyYWludCBvZiB0aGlzLl9jb25zdHJhaW50cykge1xuICAgICAgdGhpcy5fcHJvY2Vzc0NvbnN0cmFpbnQoY29uc3RyYWludCwgY29uc3RyYWludHNUcmllZCwgY29uc3RyYWludHNEb25lLCAoY29uc3RyYWludCkgPT4gY29uc3RyYWludC51cGRhdGUoKSk7XG4gICAgfVxuICB9XG5cbiAgLyoqXG4gICAqIFVwZGF0ZSBhIGNvbnN0cmFpbnQuXG4gICAqIElmIHRoZXJlIGFyZSBvdGhlciBjb25zdHJhaW50cyB0aGF0IGFyZSBkZXBlbmRhbnQsIGl0IHdpbGwgdHJ5IHRvIHVwZGF0ZSB0aGVtIHJlY3Vyc2l2ZWx5LlxuICAgKiBJdCBtaWdodCB0aHJvdyBhbiBlcnJvciBpZiB0aGVyZSBhcmUgY2lyY3VsYXIgZGVwZW5kZW5jaWVzLlxuICAgKlxuICAgKiBJbnRlbmRlZCB0byBiZSB1c2VkIGluIHtAbGluayB1cGRhdGV9IGFuZCB7QGxpbmsgX3Byb2Nlc3NDb25zdHJhaW50fSBpdHNlbGYgcmVjdXJzaXZlbHkuXG4gICAqXG4gICAqIEBwYXJhbSBjb25zdHJhaW50IEEgY29uc3RyYWludCB5b3Ugd2FudCB0byB1cGRhdGVcbiAgICogQHBhcmFtIGNvbnN0cmFpbnRzVHJpZWQgU2V0IG9mIGNvbnN0cmFpbnRzIHRoYXQgYXJlIGFscmVhZHkgdHJpZWQgdG8gYmUgdXBkYXRlZFxuICAgKiBAcGFyYW0gY29uc3RyYWludHNEb25lIFNldCBvZiBjb25zdHJhaW50cyB0aGF0IGFyZSBhbHJlYWR5IHVwIHRvIGRhdGVcbiAgICovXG4gIHByaXZhdGUgX3Byb2Nlc3NDb25zdHJhaW50KFxuICAgIGNvbnN0cmFpbnQ6IFZSTU5vZGVDb25zdHJhaW50LFxuICAgIGNvbnN0cmFpbnRzVHJpZWQ6IFNldDxWUk1Ob2RlQ29uc3RyYWludD4sXG4gICAgY29uc3RyYWludHNEb25lOiBTZXQ8VlJNTm9kZUNvbnN0cmFpbnQ+LFxuICAgIGNhbGxiYWNrOiAoY29uc3RyYWludDogVlJNTm9kZUNvbnN0cmFpbnQpID0+IHZvaWQsXG4gICk6IHZvaWQge1xuICAgIGlmIChjb25zdHJhaW50c0RvbmUuaGFzKGNvbnN0cmFpbnQpKSB7XG4gICAgICByZXR1cm47XG4gICAgfVxuXG4gICAgaWYgKGNvbnN0cmFpbnRzVHJpZWQuaGFzKGNvbnN0cmFpbnQpKSB7XG4gICAgICB0aHJvdyBuZXcgRXJyb3IoJ1ZSTU5vZGVDb25zdHJhaW50TWFuYWdlcjogQ2lyY3VsYXIgZGVwZW5kZW5jeSBkZXRlY3RlZCB3aGlsZSB1cGRhdGluZyBjb25zdHJhaW50cycpO1xuICAgIH1cbiAgICBjb25zdHJhaW50c1RyaWVkLmFkZChjb25zdHJhaW50KTtcblxuICAgIGNvbnN0IGRlcE9iamVjdHMgPSBjb25zdHJhaW50LmRlcGVuZGVuY2llcztcbiAgICBmb3IgKGNvbnN0IGRlcE9iamVjdCBvZiBkZXBPYmplY3RzKSB7XG4gICAgICB0cmF2ZXJzZUFuY2VzdG9yc0Zyb21Sb290KGRlcE9iamVjdCwgKGRlcE9iamVjdEFuY2VzdG9yKSA9PiB7XG4gICAgICAgIGNvbnN0IG9iamVjdFNldCA9IHRoaXMuX29iamVjdENvbnN0cmFpbnRzTWFwLmdldChkZXBPYmplY3RBbmNlc3Rvcik7XG4gICAgICAgIGlmIChvYmplY3RTZXQpIHtcbiAgICAgICAgICBmb3IgKGNvbnN0IGRlcENvbnN0cmFpbnQgb2Ygb2JqZWN0U2V0KSB7XG4gICAgICAgICAgICB0aGlzLl9wcm9jZXNzQ29uc3RyYWludChkZXBDb25zdHJhaW50LCBjb25zdHJhaW50c1RyaWVkLCBjb25zdHJhaW50c0RvbmUsIGNhbGxiYWNrKTtcbiAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICAgIH0pO1xuICAgIH1cblxuICAgIGNhbGxiYWNrKGNvbnN0cmFpbnQpO1xuXG4gICAgY29uc3RyYWludHNEb25lLmFkZChjb25zdHJhaW50KTtcbiAgfVxufVxuIiwgImltcG9ydCAqIGFzIFRIUkVFIGZyb20gJ3RocmVlJztcbmltcG9ydCB7IHF1YXRJbnZlcnRDb21wYXQgfSBmcm9tICcuL3V0aWxzL3F1YXRJbnZlcnRDb21wYXQnO1xuaW1wb3J0IHsgVlJNTm9kZUNvbnN0cmFpbnQgfSBmcm9tICcuL1ZSTU5vZGVDb25zdHJhaW50JztcblxuY29uc3QgX3F1YXRBID0gbmV3IFRIUkVFLlF1YXRlcm5pb24oKTtcbmNvbnN0IF9xdWF0QiA9IG5ldyBUSFJFRS5RdWF0ZXJuaW9uKCk7XG5cbi8qKlxuICogQSBjb25zdHJhaW50IHRoYXQgdHJhbnNmZXJzIGEgcm90YXRpb24gYXJvdW5kIG9uZSBheGlzIG9mIGEgc291cmNlLlxuICpcbiAqIFNlZTogaHR0cHM6Ly9naXRodWIuY29tL3ZybS1jL3ZybS1zcGVjaWZpY2F0aW9uL3RyZWUvbWFzdGVyL3NwZWNpZmljYXRpb24vVlJNQ19ub2RlX2NvbnN0cmFpbnQtMS4wX2JldGEjcm9sbC1jb25zdHJhaW50XG4gKi9cbmV4cG9ydCBjbGFzcyBWUk1Sb3RhdGlvbkNvbnN0cmFpbnQgZXh0ZW5kcyBWUk1Ob2RlQ29uc3RyYWludCB7XG4gIC8qKlxuICAgKiBUaGUgcmVzdCBxdWF0ZXJuaW9uIG9mIHRoZSB7QGxpbmsgZGVzdGluYXRpb259LlxuICAgKi9cbiAgcHJpdmF0ZSBfZHN0UmVzdFF1YXQ6IFRIUkVFLlF1YXRlcm5pb247XG5cbiAgLyoqXG4gICAqIFRoZSBpbnZlcnNlIG9mIHRoZSByZXN0IHF1YXRlcm5pb24gb2YgdGhlIHtAbGluayBzb3VyY2V9LlxuICAgKi9cbiAgcHJpdmF0ZSBfaW52U3JjUmVzdFF1YXQ6IFRIUkVFLlF1YXRlcm5pb247XG5cbiAgcHVibGljIGdldCBkZXBlbmRlbmNpZXMoKTogU2V0PFRIUkVFLk9iamVjdDNEPiB7XG4gICAgcmV0dXJuIG5ldyBTZXQoW3RoaXMuc291cmNlXSk7XG4gIH1cblxuICBwdWJsaWMgY29uc3RydWN0b3IoZGVzdGluYXRpb246IFRIUkVFLk9iamVjdDNELCBzb3VyY2U6IFRIUkVFLk9iamVjdDNEKSB7XG4gICAgc3VwZXIoZGVzdGluYXRpb24sIHNvdXJjZSk7XG5cbiAgICB0aGlzLl9kc3RSZXN0UXVhdCA9IG5ldyBUSFJFRS5RdWF0ZXJuaW9uKCk7XG4gICAgdGhpcy5faW52U3JjUmVzdFF1YXQgPSBuZXcgVEhSRUUuUXVhdGVybmlvbigpO1xuICB9XG5cbiAgcHVibGljIHNldEluaXRTdGF0ZSgpOiB2b2lkIHtcbiAgICB0aGlzLl9kc3RSZXN0UXVhdC5jb3B5KHRoaXMuZGVzdGluYXRpb24ucXVhdGVybmlvbik7XG4gICAgcXVhdEludmVydENvbXBhdCh0aGlzLl9pbnZTcmNSZXN0UXVhdC5jb3B5KHRoaXMuc291cmNlLnF1YXRlcm5pb24pKTtcbiAgfVxuXG4gIHB1YmxpYyB1cGRhdGUoKTogdm9pZCB7XG4gICAgLy8gY2FsY3VsYXRlIHRoZSBkZWx0YSByb3RhdGlvbiBmcm9tIHRoZSByZXN0IGFib3V0IHRoZSBzb3VyY2VcbiAgICBjb25zdCBzcmNEZWx0YVF1YXQgPSBfcXVhdEEuY29weSh0aGlzLl9pbnZTcmNSZXN0UXVhdCkubXVsdGlwbHkodGhpcy5zb3VyY2UucXVhdGVybmlvbik7XG5cbiAgICAvLyBtdWx0aXBseSB0aGUgZGVsdGEgdG8gdGhlIHJlc3Qgb2YgdGhlIGRlc3RpbmF0aW9uXG4gICAgY29uc3QgdGFyZ2V0UXVhdCA9IF9xdWF0Qi5jb3B5KHRoaXMuX2RzdFJlc3RRdWF0KS5tdWx0aXBseShzcmNEZWx0YVF1YXQpO1xuXG4gICAgLy8gYmxlbmQgd2l0aCB0aGUgcmVzdCBxdWF0ZXJuaW9uIHVzaW5nIHdlaWdodFxuICAgIHRoaXMuZGVzdGluYXRpb24ucXVhdGVybmlvbi5jb3B5KHRoaXMuX2RzdFJlc3RRdWF0KS5zbGVycCh0YXJnZXRRdWF0LCB0aGlzLndlaWdodCk7XG4gIH1cbn1cbiIsICJpbXBvcnQgKiBhcyBUSFJFRSBmcm9tICd0aHJlZSc7XG5pbXBvcnQgeyBxdWF0SW52ZXJ0Q29tcGF0IH0gZnJvbSAnLi91dGlscy9xdWF0SW52ZXJ0Q29tcGF0JztcbmltcG9ydCB7IFZSTU5vZGVDb25zdHJhaW50IH0gZnJvbSAnLi9WUk1Ob2RlQ29uc3RyYWludCc7XG5cbmNvbnN0IF92M0EgPSBuZXcgVEhSRUUuVmVjdG9yMygpO1xuY29uc3QgX3F1YXRBID0gbmV3IFRIUkVFLlF1YXRlcm5pb24oKTtcbmNvbnN0IF9xdWF0QiA9IG5ldyBUSFJFRS5RdWF0ZXJuaW9uKCk7XG5cbi8qKlxuICogQSBjb25zdHJhaW50IHRoYXQgdHJhbnNmZXJzIGEgcm90YXRpb24gYXJvdW5kIG9uZSBheGlzIG9mIGEgc291cmNlLlxuICpcbiAqIFNlZTogaHR0cHM6Ly9naXRodWIuY29tL3ZybS1jL3ZybS1zcGVjaWZpY2F0aW9uL3RyZWUvbWFzdGVyL3NwZWNpZmljYXRpb24vVlJNQ19ub2RlX2NvbnN0cmFpbnQtMS4wX2JldGEjcm9sbC1jb25zdHJhaW50XG4gKi9cbmV4cG9ydCBjbGFzcyBWUk1Sb2xsQ29uc3RyYWludCBleHRlbmRzIFZSTU5vZGVDb25zdHJhaW50IHtcbiAgLyoqXG4gICAqIFRoZSByb2xsIGF4aXMgb2YgdGhlIGNvbnN0cmFpbnQuXG4gICAqL1xuICBwdWJsaWMgZ2V0IHJvbGxBeGlzKCk6ICdYJyB8ICdZJyB8ICdaJyB7XG4gICAgcmV0dXJuIHRoaXMuX3JvbGxBeGlzO1xuICB9XG5cbiAgLyoqXG4gICAqIFRoZSByb2xsIGF4aXMgb2YgdGhlIGNvbnN0cmFpbnQuXG4gICAqL1xuICBwdWJsaWMgc2V0IHJvbGxBeGlzKHJvbGxBeGlzOiAnWCcgfCAnWScgfCAnWicpIHtcbiAgICB0aGlzLl9yb2xsQXhpcyA9IHJvbGxBeGlzO1xuICAgIHRoaXMuX3YzUm9sbEF4aXMuc2V0KHJvbGxBeGlzID09PSAnWCcgPyAxLjAgOiAwLjAsIHJvbGxBeGlzID09PSAnWScgPyAxLjAgOiAwLjAsIHJvbGxBeGlzID09PSAnWicgPyAxLjAgOiAwLjApO1xuICB9XG5cbiAgLyoqXG4gICAqIFRoZSByb2xsIGF4aXMgb2YgdGhlIGNvbnN0cmFpbnQuXG4gICAqL1xuICBwcml2YXRlIF9yb2xsQXhpczogJ1gnIHwgJ1knIHwgJ1onO1xuXG4gIC8qKlxuICAgKiBUaGUge0BsaW5rIF9yb2xsQXhpc30gYnV0IGluIGFuIGFjdHVhbCBWZWN0b3IzIGZvcm0uXG4gICAqL1xuICBwcml2YXRlIF92M1JvbGxBeGlzOiBUSFJFRS5WZWN0b3IzO1xuXG4gIC8qKlxuICAgKiBUaGUgcmVzdCBxdWF0ZXJuaW9uIG9mIHRoZSB7QGxpbmsgZGVzdGluYXRpb259LlxuICAgKi9cbiAgcHJpdmF0ZSBfZHN0UmVzdFF1YXQ6IFRIUkVFLlF1YXRlcm5pb247XG5cbiAgLyoqXG4gICAqIFRoZSBpbnZlcnNlIG9mIHRoZSByZXN0IHF1YXRlcm5pb24gb2YgdGhlIHtAbGluayBkZXN0aW5hdGlvbn0uXG4gICAqL1xuICBwcml2YXRlIF9pbnZEc3RSZXN0UXVhdDogVEhSRUUuUXVhdGVybmlvbjtcblxuICAvKipcbiAgICogYHNyY1Jlc3RRdWF0LmludmVydCgpICogZHN0UmVzdFF1YXRgLlxuICAgKi9cbiAgcHJpdmF0ZSBfaW52U3JjUmVzdFF1YXRNdWxEc3RSZXN0UXVhdDogVEhSRUUuUXVhdGVybmlvbjtcblxuICBwdWJsaWMgZ2V0IGRlcGVuZGVuY2llcygpOiBTZXQ8VEhSRUUuT2JqZWN0M0Q+IHtcbiAgICByZXR1cm4gbmV3IFNldChbdGhpcy5zb3VyY2VdKTtcbiAgfVxuXG4gIHB1YmxpYyBjb25zdHJ1Y3RvcihkZXN0aW5hdGlvbjogVEhSRUUuT2JqZWN0M0QsIHNvdXJjZTogVEhSRUUuT2JqZWN0M0QpIHtcbiAgICBzdXBlcihkZXN0aW5hdGlvbiwgc291cmNlKTtcblxuICAgIHRoaXMuX3JvbGxBeGlzID0gJ1gnO1xuICAgIHRoaXMuX3YzUm9sbEF4aXMgPSBuZXcgVEhSRUUuVmVjdG9yMygxLCAwLCAwKTtcblxuICAgIHRoaXMuX2RzdFJlc3RRdWF0ID0gbmV3IFRIUkVFLlF1YXRlcm5pb24oKTtcbiAgICB0aGlzLl9pbnZEc3RSZXN0UXVhdCA9IG5ldyBUSFJFRS5RdWF0ZXJuaW9uKCk7XG4gICAgdGhpcy5faW52U3JjUmVzdFF1YXRNdWxEc3RSZXN0UXVhdCA9IG5ldyBUSFJFRS5RdWF0ZXJuaW9uKCk7XG4gIH1cblxuICBwdWJsaWMgc2V0SW5pdFN0YXRlKCk6IHZvaWQge1xuICAgIHRoaXMuX2RzdFJlc3RRdWF0LmNvcHkodGhpcy5kZXN0aW5hdGlvbi5xdWF0ZXJuaW9uKTtcbiAgICBxdWF0SW52ZXJ0Q29tcGF0KHRoaXMuX2ludkRzdFJlc3RRdWF0LmNvcHkodGhpcy5fZHN0UmVzdFF1YXQpKTtcbiAgICBxdWF0SW52ZXJ0Q29tcGF0KHRoaXMuX2ludlNyY1Jlc3RRdWF0TXVsRHN0UmVzdFF1YXQuY29weSh0aGlzLnNvdXJjZS5xdWF0ZXJuaW9uKSkubXVsdGlwbHkodGhpcy5fZHN0UmVzdFF1YXQpO1xuICB9XG5cbiAgcHVibGljIHVwZGF0ZSgpOiB2b2lkIHtcbiAgICAvLyBjYWxjdWxhdGUgdGhlIGRlbHRhIHJvdGF0aW9uIGZyb20gdGhlIHJlc3QgYWJvdXQgdGhlIHNvdXJjZSwgdGhlbiBjb252ZXJ0IHRvIHRoZSBkZXN0aW5hdGlvbiBsb2NhbCBjb29yZFxuICAgIC8qKlxuICAgICAqIFdoYXQgdGhlIHF1YXREZWx0YSBpcyBpbnRlbmRlZCB0byBiZTpcbiAgICAgKlxuICAgICAqIGBgYHRzXG4gICAgICogY29uc3QgcXVhdFNyY0RlbHRhID0gX3F1YXRBXG4gICAgICogICAuY29weSggdGhpcy5faW52U3JjUmVzdFF1YXQgKVxuICAgICAqICAgLm11bHRpcGx5KCB0aGlzLnNvdXJjZS5xdWF0ZXJuaW9uICk7XG4gICAgICogY29uc3QgcXVhdFNyY0RlbHRhSW5QYXJlbnQgPSBfcXVhdEJcbiAgICAgKiAgIC5jb3B5KCB0aGlzLl9zcmNSZXN0UXVhdCApXG4gICAgICogICAubXVsdGlwbHkoIHF1YXRTcmNEZWx0YSApXG4gICAgICogICAubXVsdGlwbHkoIHRoaXMuX2ludlNyY1Jlc3RRdWF0ICk7XG4gICAgICogY29uc3QgcXVhdFNyY0RlbHRhSW5Ec3QgPSBfcXVhdEFcbiAgICAgKiAgIC5jb3B5KCB0aGlzLl9pbnZEc3RSZXN0UXVhdCApXG4gICAgICogICAubXVsdGlwbHkoIHF1YXRTcmNEZWx0YUluUGFyZW50IClcbiAgICAgKiAgIC5tdWx0aXBseSggdGhpcy5fZHN0UmVzdFF1YXQgKTtcbiAgICAgKiBgYGBcbiAgICAgKi9cbiAgICBjb25zdCBxdWF0RGVsdGEgPSBfcXVhdEFcbiAgICAgIC5jb3B5KHRoaXMuX2ludkRzdFJlc3RRdWF0KVxuICAgICAgLm11bHRpcGx5KHRoaXMuc291cmNlLnF1YXRlcm5pb24pXG4gICAgICAubXVsdGlwbHkodGhpcy5faW52U3JjUmVzdFF1YXRNdWxEc3RSZXN0UXVhdCk7XG5cbiAgICAvLyBjcmVhdGUgYSBmcm9tLXRvIHF1YXRlcm5pb25cbiAgICBjb25zdCBuMSA9IF92M0EuY29weSh0aGlzLl92M1JvbGxBeGlzKS5hcHBseVF1YXRlcm5pb24ocXVhdERlbHRhKTtcblxuICAgIC8qKlxuICAgICAqIFdoYXQgdGhlIHF1YXRGcm9tVG8gaXMgaW50ZW5kZWQgdG8gYmU6XG4gICAgICpcbiAgICAgKiBgYGB0c1xuICAgICAqIGNvbnN0IHF1YXRGcm9tVG8gPSBfcXVhdEIuc2V0RnJvbVVuaXRWZWN0b3JzKCB0aGlzLl92M1JvbGxBeGlzLCBuMSApLmludmVyc2UoKTtcbiAgICAgKiBgYGBcbiAgICAgKi9cbiAgICBjb25zdCBxdWF0RnJvbVRvID0gX3F1YXRCLnNldEZyb21Vbml0VmVjdG9ycyhuMSwgdGhpcy5fdjNSb2xsQXhpcyk7XG5cbiAgICAvLyBxdWF0RnJvbVRvICogcXVhdERlbHRhID09IHJvbGwgZXh0cmFjdGVkIGZyb20gcXVhdERlbHRhXG4gICAgY29uc3QgdGFyZ2V0UXVhdCA9IHF1YXRGcm9tVG8ucHJlbXVsdGlwbHkodGhpcy5fZHN0UmVzdFF1YXQpLm11bHRpcGx5KHF1YXREZWx0YSk7XG5cbiAgICAvLyBibGVuZCB3aXRoIHRoZSByZXN0IHF1YXRlcm5pb24gdXNpbmcgd2VpZ2h0XG4gICAgdGhpcy5kZXN0aW5hdGlvbi5xdWF0ZXJuaW9uLmNvcHkodGhpcy5fZHN0UmVzdFF1YXQpLnNsZXJwKHRhcmdldFF1YXQsIHRoaXMud2VpZ2h0KTtcbiAgfVxufVxuIiwgImltcG9ydCB0eXBlICogYXMgQ29uc3RyYWludFNjaGVtYSBmcm9tICdAcGl4aXYvdHlwZXMtdnJtYy1ub2RlLWNvbnN0cmFpbnQtMS4wJztcbmltcG9ydCB0eXBlICogYXMgVEhSRUUgZnJvbSAndGhyZWUnO1xuaW1wb3J0IHR5cGUgeyBHTFRGLCBHTFRGTG9hZGVyUGx1Z2luLCBHTFRGUGFyc2VyIH0gZnJvbSAndGhyZWUvZXhhbXBsZXMvanNtL2xvYWRlcnMvR0xURkxvYWRlci5qcyc7XG5pbXBvcnQgeyBWUk1Ob2RlQ29uc3RyYWludEhlbHBlciB9IGZyb20gJy4vaGVscGVycyc7XG5pbXBvcnQgdHlwZSB7IFZSTU5vZGVDb25zdHJhaW50TG9hZGVyUGx1Z2luT3B0aW9ucyB9IGZyb20gJy4vVlJNTm9kZUNvbnN0cmFpbnRMb2FkZXJQbHVnaW5PcHRpb25zJztcbmltcG9ydCB7IFZSTU5vZGVDb25zdHJhaW50TWFuYWdlciB9IGZyb20gJy4vVlJNTm9kZUNvbnN0cmFpbnRNYW5hZ2VyJztcbmltcG9ydCB7IFZSTVJvdGF0aW9uQ29uc3RyYWludCB9IGZyb20gJy4vVlJNUm90YXRpb25Db25zdHJhaW50JztcbmltcG9ydCB7IEdMVEYgYXMgR0xURlNjaGVtYSB9IGZyb20gJ0BnbHRmLXRyYW5zZm9ybS9jb3JlJztcbmltcG9ydCB7IFZSTUFpbUNvbnN0cmFpbnQgfSBmcm9tICcuL1ZSTUFpbUNvbnN0cmFpbnQnO1xuaW1wb3J0IHsgVlJNUm9sbENvbnN0cmFpbnQgfSBmcm9tICcuL1ZSTVJvbGxDb25zdHJhaW50JztcblxuLyoqXG4gKiBQb3NzaWJsZSBzcGVjIHZlcnNpb25zIGl0IHJlY29nbml6ZXMuXG4gKi9cbmNvbnN0IFBPU1NJQkxFX1NQRUNfVkVSU0lPTlMgPSBuZXcgU2V0KFsnMS4wJywgJzEuMC1iZXRhJ10pO1xuXG5leHBvcnQgY2xhc3MgVlJNTm9kZUNvbnN0cmFpbnRMb2FkZXJQbHVnaW4gaW1wbGVtZW50cyBHTFRGTG9hZGVyUGx1Z2luIHtcbiAgcHVibGljIHN0YXRpYyByZWFkb25seSBFWFRFTlNJT05fTkFNRSA9ICdWUk1DX25vZGVfY29uc3RyYWludCc7XG5cbiAgLyoqXG4gICAqIFNwZWNpZnkgYW4gT2JqZWN0M0QgdG8gYWRkIHtAbGluayBWUk1Ob2RlQ29uc3RyYWludEhlbHBlcn0gcy5cbiAgICogSWYgbm90IHNwZWNpZmllZCwgaGVscGVyIHdpbGwgbm90IGJlIGNyZWF0ZWQuXG4gICAqIElmIGByZW5kZXJPcmRlcmAgaXMgc2V0IHRvIHRoZSByb290LCBoZWxwZXJzIHdpbGwgY29weSB0aGUgc2FtZSBgcmVuZGVyT3JkZXJgIC5cbiAgICovXG4gIHB1YmxpYyBoZWxwZXJSb290PzogVEhSRUUuT2JqZWN0M0Q7XG5cbiAgcHVibGljIHJlYWRvbmx5IHBhcnNlcjogR0xURlBhcnNlcjtcblxuICBwdWJsaWMgZ2V0IG5hbWUoKTogc3RyaW5nIHtcbiAgICByZXR1cm4gVlJNTm9kZUNvbnN0cmFpbnRMb2FkZXJQbHVnaW4uRVhURU5TSU9OX05BTUU7XG4gIH1cblxuICBwdWJsaWMgY29uc3RydWN0b3IocGFyc2VyOiBHTFRGUGFyc2VyLCBvcHRpb25zPzogVlJNTm9kZUNvbnN0cmFpbnRMb2FkZXJQbHVnaW5PcHRpb25zKSB7XG4gICAgdGhpcy5wYXJzZXIgPSBwYXJzZXI7XG5cbiAgICB0aGlzLmhlbHBlclJvb3QgPSBvcHRpb25zPy5oZWxwZXJSb290O1xuICB9XG5cbiAgcHVibGljIGFzeW5jIGFmdGVyUm9vdChnbHRmOiBHTFRGKTogUHJvbWlzZTx2b2lkPiB7XG4gICAgZ2x0Zi51c2VyRGF0YS52cm1Ob2RlQ29uc3RyYWludE1hbmFnZXIgPSBhd2FpdCB0aGlzLl9pbXBvcnQoZ2x0Zik7XG4gIH1cblxuICAvKipcbiAgICogSW1wb3J0IGNvbnN0cmFpbnRzIGZyb20gYSBHTFRGIGFuZCByZXR1cm5zIGEge0BsaW5rIFZSTU5vZGVDb25zdHJhaW50TWFuYWdlcn0uXG4gICAqIEl0IG1pZ2h0IHJldHVybiBgbnVsbGAgaW5zdGVhZCB3aGVuIGl0IGRvZXMgbm90IG5lZWQgdG8gYmUgY3JlYXRlZCBvciBzb21ldGhpbmcgZ28gd3JvbmcuXG4gICAqXG4gICAqIEBwYXJhbSBnbHRmIEEgcGFyc2VkIHJlc3VsdCBvZiBHTFRGIHRha2VuIGZyb20gR0xURkxvYWRlclxuICAgKi9cbiAgcHJvdGVjdGVkIGFzeW5jIF9pbXBvcnQoZ2x0ZjogR0xURik6IFByb21pc2U8VlJNTm9kZUNvbnN0cmFpbnRNYW5hZ2VyIHwgbnVsbD4ge1xuICAgIGNvbnN0IGpzb24gPSB0aGlzLnBhcnNlci5qc29uIGFzIEdMVEZTY2hlbWEuSUdMVEY7XG5cbiAgICAvLyBlYXJseSBhYm9ydCBpZiBpdCBkb2Vzbid0IHVzZSBjb25zdHJhaW50c1xuICAgIGNvbnN0IGlzQ29uc3RyYWludHNVc2VkID0ganNvbi5leHRlbnNpb25zVXNlZD8uaW5kZXhPZihWUk1Ob2RlQ29uc3RyYWludExvYWRlclBsdWdpbi5FWFRFTlNJT05fTkFNRSkgIT09IC0xO1xuICAgIGlmICghaXNDb25zdHJhaW50c1VzZWQpIHtcbiAgICAgIHJldHVybiBudWxsO1xuICAgIH1cblxuICAgIGNvbnN0IG1hbmFnZXIgPSBuZXcgVlJNTm9kZUNvbnN0cmFpbnRNYW5hZ2VyKCk7XG4gICAgY29uc3QgdGhyZWVOb2RlczogVEhSRUUuT2JqZWN0M0RbXSA9IGF3YWl0IHRoaXMucGFyc2VyLmdldERlcGVuZGVuY2llcygnbm9kZScpO1xuXG4gICAgLy8gaW1wb3J0IGNvbnN0cmFpbnRzIGZvciBlYWNoIG5vZGVzXG4gICAgdGhyZWVOb2Rlcy5mb3JFYWNoKChub2RlLCBub2RlSW5kZXgpID0+IHtcbiAgICAgIGNvbnN0IHNjaGVtYU5vZGUgPSBqc29uLm5vZGVzIVtub2RlSW5kZXhdO1xuXG4gICAgICAvLyBjaGVjayBpZiB0aGUgZXh0ZW5zaW9uIHVzZXMgdGhlIGV4dGVuc2lvblxuICAgICAgY29uc3QgZXh0ZW5zaW9uID0gc2NoZW1hTm9kZT8uZXh0ZW5zaW9ucz8uW1ZSTU5vZGVDb25zdHJhaW50TG9hZGVyUGx1Z2luLkVYVEVOU0lPTl9OQU1FXSBhc1xuICAgICAgICB8IENvbnN0cmFpbnRTY2hlbWEuVlJNQ05vZGVDb25zdHJhaW50XG4gICAgICAgIHwgdW5kZWZpbmVkO1xuXG4gICAgICBpZiAoZXh0ZW5zaW9uID09IG51bGwpIHtcbiAgICAgICAgcmV0dXJuO1xuICAgICAgfVxuXG4gICAgICBjb25zdCBzcGVjVmVyc2lvbiA9IGV4dGVuc2lvbi5zcGVjVmVyc2lvbjtcbiAgICAgIGlmICghUE9TU0lCTEVfU1BFQ19WRVJTSU9OUy5oYXMoc3BlY1ZlcnNpb24pKSB7XG4gICAgICAgIGNvbnNvbGUud2FybihcbiAgICAgICAgICBgVlJNTm9kZUNvbnN0cmFpbnRMb2FkZXJQbHVnaW46IFVua25vd24gJHtWUk1Ob2RlQ29uc3RyYWludExvYWRlclBsdWdpbi5FWFRFTlNJT05fTkFNRX0gc3BlY1ZlcnNpb24gXCIke3NwZWNWZXJzaW9ufVwiYCxcbiAgICAgICAgKTtcbiAgICAgICAgcmV0dXJuO1xuICAgICAgfVxuXG4gICAgICBjb25zdCBjb25zdHJhaW50RGVmID0gZXh0ZW5zaW9uLmNvbnN0cmFpbnQ7XG5cbiAgICAgIC8vIGltcG9ydCBjb25zdHJhaW50c1xuICAgICAgaWYgKGNvbnN0cmFpbnREZWYucm9sbCAhPSBudWxsKSB7XG4gICAgICAgIGNvbnN0IGNvbnN0cmFpbnQgPSB0aGlzLl9pbXBvcnRSb2xsQ29uc3RyYWludChub2RlLCB0aHJlZU5vZGVzLCBjb25zdHJhaW50RGVmLnJvbGwpO1xuICAgICAgICBtYW5hZ2VyLmFkZENvbnN0cmFpbnQoY29uc3RyYWludCk7XG4gICAgICB9IGVsc2UgaWYgKGNvbnN0cmFpbnREZWYuYWltICE9IG51bGwpIHtcbiAgICAgICAgY29uc3QgY29uc3RyYWludCA9IHRoaXMuX2ltcG9ydEFpbUNvbnN0cmFpbnQobm9kZSwgdGhyZWVOb2RlcywgY29uc3RyYWludERlZi5haW0pO1xuICAgICAgICBtYW5hZ2VyLmFkZENvbnN0cmFpbnQoY29uc3RyYWludCk7XG4gICAgICB9IGVsc2UgaWYgKGNvbnN0cmFpbnREZWYucm90YXRpb24gIT0gbnVsbCkge1xuICAgICAgICBjb25zdCBjb25zdHJhaW50ID0gdGhpcy5faW1wb3J0Um90YXRpb25Db25zdHJhaW50KG5vZGUsIHRocmVlTm9kZXMsIGNvbnN0cmFpbnREZWYucm90YXRpb24pO1xuICAgICAgICBtYW5hZ2VyLmFkZENvbnN0cmFpbnQoY29uc3RyYWludCk7XG4gICAgICB9XG4gICAgfSk7XG5cbiAgICAvLyBpbml0IGNvbnN0cmFpbnRzXG4gICAgZ2x0Zi5zY2VuZS51cGRhdGVNYXRyaXhXb3JsZCgpO1xuICAgIG1hbmFnZXIuc2V0SW5pdFN0YXRlKCk7XG5cbiAgICByZXR1cm4gbWFuYWdlcjtcbiAgfVxuXG4gIHByb3RlY3RlZCBfaW1wb3J0Um9sbENvbnN0cmFpbnQoXG4gICAgZGVzdGluYXRpb246IFRIUkVFLk9iamVjdDNELFxuICAgIG5vZGVzOiBUSFJFRS5PYmplY3QzRFtdLFxuICAgIHJvbGxDb25zdHJhaW50RGVmOiBDb25zdHJhaW50U2NoZW1hLlJvbGxDb25zdHJhaW50LFxuICApOiBWUk1Sb2xsQ29uc3RyYWludCB7XG4gICAgY29uc3QgeyBzb3VyY2U6IHNvdXJjZUluZGV4LCByb2xsQXhpcywgd2VpZ2h0IH0gPSByb2xsQ29uc3RyYWludERlZjtcbiAgICBjb25zdCBzb3VyY2UgPSBub2Rlc1tzb3VyY2VJbmRleF07XG4gICAgY29uc3QgY29uc3RyYWludCA9IG5ldyBWUk1Sb2xsQ29uc3RyYWludChkZXN0aW5hdGlvbiwgc291cmNlKTtcblxuICAgIGlmIChyb2xsQXhpcyAhPSBudWxsKSB7XG4gICAgICBjb25zdHJhaW50LnJvbGxBeGlzID0gcm9sbEF4aXM7XG4gICAgfVxuICAgIGlmICh3ZWlnaHQgIT0gbnVsbCkge1xuICAgICAgY29uc3RyYWludC53ZWlnaHQgPSB3ZWlnaHQ7XG4gICAgfVxuXG4gICAgaWYgKHRoaXMuaGVscGVyUm9vdCkge1xuICAgICAgY29uc3QgaGVscGVyID0gbmV3IFZSTU5vZGVDb25zdHJhaW50SGVscGVyKGNvbnN0cmFpbnQpO1xuICAgICAgdGhpcy5oZWxwZXJSb290LmFkZChoZWxwZXIpO1xuICAgIH1cblxuICAgIHJldHVybiBjb25zdHJhaW50O1xuICB9XG5cbiAgcHJvdGVjdGVkIF9pbXBvcnRBaW1Db25zdHJhaW50KFxuICAgIGRlc3RpbmF0aW9uOiBUSFJFRS5PYmplY3QzRCxcbiAgICBub2RlczogVEhSRUUuT2JqZWN0M0RbXSxcbiAgICBhaW1Db25zdHJhaW50RGVmOiBDb25zdHJhaW50U2NoZW1hLkFpbUNvbnN0cmFpbnQsXG4gICk6IFZSTUFpbUNvbnN0cmFpbnQge1xuICAgIGNvbnN0IHsgc291cmNlOiBzb3VyY2VJbmRleCwgYWltQXhpcywgd2VpZ2h0IH0gPSBhaW1Db25zdHJhaW50RGVmO1xuICAgIGNvbnN0IHNvdXJjZSA9IG5vZGVzW3NvdXJjZUluZGV4XTtcbiAgICBjb25zdCBjb25zdHJhaW50ID0gbmV3IFZSTUFpbUNvbnN0cmFpbnQoZGVzdGluYXRpb24sIHNvdXJjZSk7XG5cbiAgICBpZiAoYWltQXhpcyAhPSBudWxsKSB7XG4gICAgICBjb25zdHJhaW50LmFpbUF4aXMgPSBhaW1BeGlzO1xuICAgIH1cbiAgICBpZiAod2VpZ2h0ICE9IG51bGwpIHtcbiAgICAgIGNvbnN0cmFpbnQud2VpZ2h0ID0gd2VpZ2h0O1xuICAgIH1cblxuICAgIGlmICh0aGlzLmhlbHBlclJvb3QpIHtcbiAgICAgIGNvbnN0IGhlbHBlciA9IG5ldyBWUk1Ob2RlQ29uc3RyYWludEhlbHBlcihjb25zdHJhaW50KTtcbiAgICAgIHRoaXMuaGVscGVyUm9vdC5hZGQoaGVscGVyKTtcbiAgICB9XG5cbiAgICByZXR1cm4gY29uc3RyYWludDtcbiAgfVxuXG4gIHByb3RlY3RlZCBfaW1wb3J0Um90YXRpb25Db25zdHJhaW50KFxuICAgIGRlc3RpbmF0aW9uOiBUSFJFRS5PYmplY3QzRCxcbiAgICBub2RlczogVEhSRUUuT2JqZWN0M0RbXSxcbiAgICByb3RhdGlvbkNvbnN0cmFpbnREZWY6IENvbnN0cmFpbnRTY2hlbWEuUm90YXRpb25Db25zdHJhaW50LFxuICApOiBWUk1Sb3RhdGlvbkNvbnN0cmFpbnQge1xuICAgIGNvbnN0IHsgc291cmNlOiBzb3VyY2VJbmRleCwgd2VpZ2h0IH0gPSByb3RhdGlvbkNvbnN0cmFpbnREZWY7XG4gICAgY29uc3Qgc291cmNlID0gbm9kZXNbc291cmNlSW5kZXhdO1xuICAgIGNvbnN0IGNvbnN0cmFpbnQgPSBuZXcgVlJNUm90YXRpb25Db25zdHJhaW50KGRlc3RpbmF0aW9uLCBzb3VyY2UpO1xuXG4gICAgaWYgKHdlaWdodCAhPSBudWxsKSB7XG4gICAgICBjb25zdHJhaW50LndlaWdodCA9IHdlaWdodDtcbiAgICB9XG5cbiAgICBpZiAodGhpcy5oZWxwZXJSb290KSB7XG4gICAgICBjb25zdCBoZWxwZXIgPSBuZXcgVlJNTm9kZUNvbnN0cmFpbnRIZWxwZXIoY29uc3RyYWludCk7XG4gICAgICB0aGlzLmhlbHBlclJvb3QuYWRkKGhlbHBlcik7XG4gICAgfVxuXG4gICAgcmV0dXJuIGNvbnN0cmFpbnQ7XG4gIH1cbn1cbiIsICJpbXBvcnQgKiBhcyBUSFJFRSBmcm9tICd0aHJlZSc7XG5pbXBvcnQgeyBWUk1TcHJpbmdCb25lQ29sbGlkZXIgfSBmcm9tICcuLi9WUk1TcHJpbmdCb25lQ29sbGlkZXInO1xuaW1wb3J0IHsgVlJNU3ByaW5nQm9uZUNvbGxpZGVyU2hhcGVDYXBzdWxlIH0gZnJvbSAnLi4vVlJNU3ByaW5nQm9uZUNvbGxpZGVyU2hhcGVDYXBzdWxlJztcbmltcG9ydCB7IFZSTVNwcmluZ0JvbmVDb2xsaWRlclNoYXBlUGxhbmUgfSBmcm9tICcuLi9WUk1TcHJpbmdCb25lQ29sbGlkZXJTaGFwZVBsYW5lJztcbmltcG9ydCB7IFZSTVNwcmluZ0JvbmVDb2xsaWRlclNoYXBlU3BoZXJlIH0gZnJvbSAnLi4vVlJNU3ByaW5nQm9uZUNvbGxpZGVyU2hhcGVTcGhlcmUnO1xuaW1wb3J0IHsgQ29sbGlkZXJTaGFwZUJ1ZmZlckdlb21ldHJ5IH0gZnJvbSAnLi91dGlscy9Db2xsaWRlclNoYXBlQnVmZmVyR2VvbWV0cnknO1xuaW1wb3J0IHsgQ29sbGlkZXJTaGFwZUNhcHN1bGVCdWZmZXJHZW9tZXRyeSB9IGZyb20gJy4vdXRpbHMvQ29sbGlkZXJTaGFwZUNhcHN1bGVCdWZmZXJHZW9tZXRyeSc7XG5pbXBvcnQgeyBDb2xsaWRlclNoYXBlUGxhbmVCdWZmZXJHZW9tZXRyeSB9IGZyb20gJy4vdXRpbHMvQ29sbGlkZXJTaGFwZVBsYW5lQnVmZmVyR2VvbWV0cnknO1xuaW1wb3J0IHsgQ29sbGlkZXJTaGFwZVNwaGVyZUJ1ZmZlckdlb21ldHJ5IH0gZnJvbSAnLi91dGlscy9Db2xsaWRlclNoYXBlU3BoZXJlQnVmZmVyR2VvbWV0cnknO1xuXG5jb25zdCBfdjNBID0gbmV3IFRIUkVFLlZlY3RvcjMoKTtcblxuZXhwb3J0IGNsYXNzIFZSTVNwcmluZ0JvbmVDb2xsaWRlckhlbHBlciBleHRlbmRzIFRIUkVFLkdyb3VwIHtcbiAgcHVibGljIHJlYWRvbmx5IGNvbGxpZGVyOiBWUk1TcHJpbmdCb25lQ29sbGlkZXI7XG4gIHByaXZhdGUgcmVhZG9ubHkgX2dlb21ldHJ5OiBDb2xsaWRlclNoYXBlQnVmZmVyR2VvbWV0cnk7XG4gIHByaXZhdGUgcmVhZG9ubHkgX2xpbmU6IFRIUkVFLkxpbmVTZWdtZW50cztcblxuICBwdWJsaWMgY29uc3RydWN0b3IoY29sbGlkZXI6IFZSTVNwcmluZ0JvbmVDb2xsaWRlcikge1xuICAgIHN1cGVyKCk7XG4gICAgdGhpcy5tYXRyaXhBdXRvVXBkYXRlID0gZmFsc2U7XG5cbiAgICB0aGlzLmNvbGxpZGVyID0gY29sbGlkZXI7XG5cbiAgICBpZiAodGhpcy5jb2xsaWRlci5zaGFwZSBpbnN0YW5jZW9mIFZSTVNwcmluZ0JvbmVDb2xsaWRlclNoYXBlU3BoZXJlKSB7XG4gICAgICB0aGlzLl9nZW9tZXRyeSA9IG5ldyBDb2xsaWRlclNoYXBlU3BoZXJlQnVmZmVyR2VvbWV0cnkodGhpcy5jb2xsaWRlci5zaGFwZSk7XG4gICAgfSBlbHNlIGlmICh0aGlzLmNvbGxpZGVyLnNoYXBlIGluc3RhbmNlb2YgVlJNU3ByaW5nQm9uZUNvbGxpZGVyU2hhcGVDYXBzdWxlKSB7XG4gICAgICB0aGlzLl9nZW9tZXRyeSA9IG5ldyBDb2xsaWRlclNoYXBlQ2Fwc3VsZUJ1ZmZlckdlb21ldHJ5KHRoaXMuY29sbGlkZXIuc2hhcGUpO1xuICAgIH0gZWxzZSBpZiAodGhpcy5jb2xsaWRlci5zaGFwZSBpbnN0YW5jZW9mIFZSTVNwcmluZ0JvbmVDb2xsaWRlclNoYXBlUGxhbmUpIHtcbiAgICAgIHRoaXMuX2dlb21ldHJ5ID0gbmV3IENvbGxpZGVyU2hhcGVQbGFuZUJ1ZmZlckdlb21ldHJ5KHRoaXMuY29sbGlkZXIuc2hhcGUpO1xuICAgIH0gZWxzZSB7XG4gICAgICB0aHJvdyBuZXcgRXJyb3IoJ1ZSTVNwcmluZ0JvbmVDb2xsaWRlckhlbHBlcjogVW5rbm93biBjb2xsaWRlciBzaGFwZSB0eXBlIGRldGVjdGVkJyk7XG4gICAgfVxuXG4gICAgY29uc3QgbWF0ZXJpYWwgPSBuZXcgVEhSRUUuTGluZUJhc2ljTWF0ZXJpYWwoe1xuICAgICAgY29sb3I6IDB4ZmYwMGZmLFxuICAgICAgZGVwdGhUZXN0OiBmYWxzZSxcbiAgICAgIGRlcHRoV3JpdGU6IGZhbHNlLFxuICAgIH0pO1xuXG4gICAgdGhpcy5fbGluZSA9IG5ldyBUSFJFRS5MaW5lU2VnbWVudHModGhpcy5fZ2VvbWV0cnksIG1hdGVyaWFsKTtcbiAgICB0aGlzLmFkZCh0aGlzLl9saW5lKTtcbiAgfVxuXG4gIHB1YmxpYyBkaXNwb3NlKCk6IHZvaWQge1xuICAgIHRoaXMuX2dlb21ldHJ5LmRpc3Bvc2UoKTtcbiAgfVxuXG4gIHB1YmxpYyB1cGRhdGVNYXRyaXhXb3JsZChmb3JjZTogYm9vbGVhbik6IHZvaWQge1xuICAgIHRoaXMuY29sbGlkZXIudXBkYXRlV29ybGRNYXRyaXgodHJ1ZSwgZmFsc2UpO1xuXG4gICAgdGhpcy5tYXRyaXguY29weSh0aGlzLmNvbGxpZGVyLm1hdHJpeFdvcmxkKTtcblxuICAgIGNvbnN0IG1hdHJpeFdvcmxkRWxlbWVudHMgPSB0aGlzLm1hdHJpeC5lbGVtZW50cztcbiAgICB0aGlzLl9nZW9tZXRyeS53b3JsZFNjYWxlID0gX3YzQVxuICAgICAgLnNldChtYXRyaXhXb3JsZEVsZW1lbnRzWzBdLCBtYXRyaXhXb3JsZEVsZW1lbnRzWzFdLCBtYXRyaXhXb3JsZEVsZW1lbnRzWzJdKVxuICAgICAgLmxlbmd0aCgpOyAvLyBjYWxjdWxhdGUgc2NhbGUgb2YgeCBjb21wb25lbnRcblxuICAgIHRoaXMuX2dlb21ldHJ5LnVwZGF0ZSgpO1xuXG4gICAgc3VwZXIudXBkYXRlTWF0cml4V29ybGQoZm9yY2UpO1xuICB9XG59XG4iLCAiaW1wb3J0ICogYXMgVEhSRUUgZnJvbSAndGhyZWUnO1xuaW1wb3J0IHsgVlJNU3ByaW5nQm9uZUNvbGxpZGVyU2hhcGUgfSBmcm9tICcuL1ZSTVNwcmluZ0JvbmVDb2xsaWRlclNoYXBlJztcblxuY29uc3QgX3YzQSA9IG5ldyBUSFJFRS5WZWN0b3IzKCk7XG5jb25zdCBfdjNCID0gbmV3IFRIUkVFLlZlY3RvcjMoKTtcblxuZXhwb3J0IGNsYXNzIFZSTVNwcmluZ0JvbmVDb2xsaWRlclNoYXBlQ2Fwc3VsZSBleHRlbmRzIFZSTVNwcmluZ0JvbmVDb2xsaWRlclNoYXBlIHtcbiAgcHVibGljIGdldCB0eXBlKCk6ICdjYXBzdWxlJyB7XG4gICAgcmV0dXJuICdjYXBzdWxlJztcbiAgfVxuXG4gIC8qKlxuICAgKiBUaGUgb2Zmc2V0IG9mIHRoZSBjYXBzdWxlIGhlYWQgZnJvbSB0aGUgb3JpZ2luIGluIGxvY2FsIHNwYWNlLlxuICAgKi9cbiAgcHVibGljIG9mZnNldDogVEhSRUUuVmVjdG9yMztcblxuICAvKipcbiAgICogVGhlIG9mZnNldCBvZiB0aGUgY2Fwc3VsZSB0YWlsIGZyb20gdGhlIG9yaWdpbiBpbiBsb2NhbCBzcGFjZS5cbiAgICovXG4gIHB1YmxpYyB0YWlsOiBUSFJFRS5WZWN0b3IzO1xuXG4gIC8qKlxuICAgKiBUaGUgcmFkaXVzIG9mIHRoZSBjYXBzdWxlLlxuICAgKi9cbiAgcHVibGljIHJhZGl1czogbnVtYmVyO1xuXG4gIC8qKlxuICAgKiBJZiB0cnVlLCB0aGUgY29sbGlkZXIgcHJldmVudHMgc3ByaW5nIGJvbmVzIGZyb20gZ29pbmcgb3V0c2lkZSBvZiB0aGUgY2Fwc3VsZSBpbnN0ZWFkLlxuICAgKi9cbiAgcHVibGljIGluc2lkZTogYm9vbGVhbjtcblxuICBwdWJsaWMgY29uc3RydWN0b3IocGFyYW1zPzogeyByYWRpdXM/OiBudW1iZXI7IG9mZnNldD86IFRIUkVFLlZlY3RvcjM7IHRhaWw/OiBUSFJFRS5WZWN0b3IzOyBpbnNpZGU/OiBib29sZWFuIH0pIHtcbiAgICBzdXBlcigpO1xuXG4gICAgdGhpcy5vZmZzZXQgPSBwYXJhbXM/Lm9mZnNldCA/PyBuZXcgVEhSRUUuVmVjdG9yMygwLjAsIDAuMCwgMC4wKTtcbiAgICB0aGlzLnRhaWwgPSBwYXJhbXM/LnRhaWwgPz8gbmV3IFRIUkVFLlZlY3RvcjMoMC4wLCAwLjAsIDAuMCk7XG4gICAgdGhpcy5yYWRpdXMgPSBwYXJhbXM/LnJhZGl1cyA/PyAwLjA7XG4gICAgdGhpcy5pbnNpZGUgPSBwYXJhbXM/Lmluc2lkZSA/PyBmYWxzZTtcbiAgfVxuXG4gIHB1YmxpYyBjYWxjdWxhdGVDb2xsaXNpb24oXG4gICAgY29sbGlkZXJNYXRyaXg6IFRIUkVFLk1hdHJpeDQsXG4gICAgb2JqZWN0UG9zaXRpb246IFRIUkVFLlZlY3RvcjMsXG4gICAgb2JqZWN0UmFkaXVzOiBudW1iZXIsXG4gICAgdGFyZ2V0OiBUSFJFRS5WZWN0b3IzLFxuICApOiBudW1iZXIge1xuICAgIF92M0EuY29weSh0aGlzLm9mZnNldCkuYXBwbHlNYXRyaXg0KGNvbGxpZGVyTWF0cml4KTsgLy8gdHJhbnNmb3JtZWQgaGVhZFxuICAgIF92M0IuY29weSh0aGlzLnRhaWwpLmFwcGx5TWF0cml4NChjb2xsaWRlck1hdHJpeCk7IC8vIHRyYW5zZm9ybWVkIHRhaWxcbiAgICBfdjNCLnN1YihfdjNBKTsgLy8gZnJvbSBoZWFkIHRvIHRhaWxcbiAgICBjb25zdCBsZW5ndGhTcUNhcHN1bGUgPSBfdjNCLmxlbmd0aFNxKCk7XG5cbiAgICB0YXJnZXQuY29weShvYmplY3RQb3NpdGlvbikuc3ViKF92M0EpOyAvLyBmcm9tIGhlYWQgdG8gb2JqZWN0XG4gICAgY29uc3QgZG90ID0gX3YzQi5kb3QodGFyZ2V0KTsgLy8gZG90IHByb2R1Y3Qgb2Ygb2Zmc2V0VG9UYWlsIGFuZCBvZmZzZXRUb09iamVjdFxuXG4gICAgaWYgKGRvdCA8PSAwLjApIHtcbiAgICAgIC8vIGlmIG9iamVjdCBpcyBuZWFyIGZyb20gdGhlIGhlYWRcbiAgICAgIC8vIGRvIG5vdGhpbmcsIHVzZSB0aGUgY3VycmVudCB2YWx1ZSBkaXJlY3RseVxuICAgIH0gZWxzZSBpZiAobGVuZ3RoU3FDYXBzdWxlIDw9IGRvdCkge1xuICAgICAgLy8gaWYgb2JqZWN0IGlzIG5lYXIgZnJvbSB0aGUgdGFpbFxuICAgICAgdGFyZ2V0LnN1YihfdjNCKTsgLy8gZnJvbSB0YWlsIHRvIG9iamVjdFxuICAgIH0gZWxzZSB7XG4gICAgICAvLyBpZiBvYmplY3QgaXMgYmV0d2VlbiB0d28gZW5kc1xuICAgICAgX3YzQi5tdWx0aXBseVNjYWxhcihkb3QgLyBsZW5ndGhTcUNhcHN1bGUpOyAvLyBmcm9tIGhlYWQgdG8gdGhlIG5lYXJlc3QgcG9pbnQgb2YgdGhlIHNoYWZ0XG4gICAgICB0YXJnZXQuc3ViKF92M0IpOyAvLyBmcm9tIHRoZSBzaGFmdCBwb2ludCB0byBvYmplY3RcbiAgICB9XG5cbiAgICBjb25zdCBkaXN0YW5jZSA9IHRoaXMuaW5zaWRlXG4gICAgICA/IHRoaXMucmFkaXVzIC0gb2JqZWN0UmFkaXVzIC0gdGFyZ2V0Lmxlbmd0aCgpXG4gICAgICA6IHRhcmdldC5sZW5ndGgoKSAtIG9iamVjdFJhZGl1cyAtIHRoaXMucmFkaXVzO1xuXG4gICAgdGFyZ2V0Lm5vcm1hbGl6ZSgpOyAvLyBjb252ZXJ0IHRoZSBkZWx0YSB0byB0aGUgZGlyZWN0aW9uXG4gICAgaWYgKHRoaXMuaW5zaWRlKSB7XG4gICAgICB0YXJnZXQubmVnYXRlKCk7IC8vIGlmIGluc2lkZSwgcmV2ZXJzZSB0aGUgZGlyZWN0aW9uXG4gICAgfVxuXG4gICAgcmV0dXJuIGRpc3RhbmNlO1xuICB9XG59XG4iLCAiaW1wb3J0IHR5cGUgKiBhcyBUSFJFRSBmcm9tICd0aHJlZSc7XG5cbi8qKlxuICogUmVwcmVzZW50cyBhIHNoYXBlIG9mIGEgY29sbGlkZXIuXG4gKi9cbmV4cG9ydCBhYnN0cmFjdCBjbGFzcyBWUk1TcHJpbmdCb25lQ29sbGlkZXJTaGFwZSB7XG4gIC8qKlxuICAgKiBUaGUgdHlwZSBvZiB0aGUgc2hhcGUuXG4gICAqL1xuICBwdWJsaWMgYWJzdHJhY3QgZ2V0IHR5cGUoKTogc3RyaW5nO1xuXG4gIC8qKlxuICAgKiBDYWxjdWxhdGUgYSBkaXN0YW5jZSBhbmQgYSBkaXJlY3Rpb24gZnJvbSB0aGUgY29sbGlkZXIgdG8gYSB0YXJnZXQgb2JqZWN0LlxuICAgKiBJdCdzIGhpdCBpZiB0aGUgZGlzdGFuY2UgaXMgbmVnYXRpdmUuXG4gICAqIFRoZSBkaXJlY3Rpb24gd2lsbCBiZSBjb250YWluZWQgaW4gdGhlIGdpdmVuIHRhcmdldCB2ZWN0b3IuXG4gICAqXG4gICAqIEBwYXJhbSBjb2xsaWRlck1hdHJpeCBBIG1hdHJpeCByZXByZXNlbnRzIHRoZSB0cmFuc2Zvcm0gb2YgdGhlIGNvbGxpZGVyXG4gICAqIEBwYXJhbSBvYmplY3RQb3NpdGlvbiBBIHZlY3RvciByZXByZXNlbnRzIHRoZSBwb3NpdGlvbiBvZiB0aGUgdGFyZ2V0IG9iamVjdFxuICAgKiBAcGFyYW0gb2JqZWN0UmFkaXVzIFRoZSByYWRpdXMgb2YgdGhlIG9iamVjdFxuICAgKiBAcGFyYW0gdGFyZ2V0IFRoZSByZXN1bHQgZGlyZWN0aW9uIHdpbGwgYmUgY29udGFpbmVkIGluIHRoaXMgdmVjdG9yXG4gICAqL1xuICBwdWJsaWMgYWJzdHJhY3QgY2FsY3VsYXRlQ29sbGlzaW9uKFxuICAgIGNvbGxpZGVyTWF0cml4OiBUSFJFRS5NYXRyaXg0LFxuICAgIG9iamVjdFBvc2l0aW9uOiBUSFJFRS5WZWN0b3IzLFxuICAgIG9iamVjdFJhZGl1czogbnVtYmVyLFxuICAgIHRhcmdldDogVEhSRUUuVmVjdG9yMyxcbiAgKTogbnVtYmVyO1xufVxuIiwgImltcG9ydCAqIGFzIFRIUkVFIGZyb20gJ3RocmVlJztcbmltcG9ydCB7IFZSTVNwcmluZ0JvbmVDb2xsaWRlclNoYXBlIH0gZnJvbSAnLi9WUk1TcHJpbmdCb25lQ29sbGlkZXJTaGFwZSc7XG5cbmNvbnN0IF92M0EgPSBuZXcgVEhSRUUuVmVjdG9yMygpO1xuY29uc3QgX21hdDNBID0gbmV3IFRIUkVFLk1hdHJpeDMoKTtcblxuZXhwb3J0IGNsYXNzIFZSTVNwcmluZ0JvbmVDb2xsaWRlclNoYXBlUGxhbmUgZXh0ZW5kcyBWUk1TcHJpbmdCb25lQ29sbGlkZXJTaGFwZSB7XG4gIHB1YmxpYyBnZXQgdHlwZSgpOiAncGxhbmUnIHtcbiAgICByZXR1cm4gJ3BsYW5lJztcbiAgfVxuXG4gIC8qKlxuICAgKiBUaGUgb2Zmc2V0IG9mIHRoZSBwbGFuZSBmcm9tIHRoZSBvcmlnaW4gaW4gbG9jYWwgc3BhY2UuXG4gICAqL1xuICBwdWJsaWMgb2Zmc2V0OiBUSFJFRS5WZWN0b3IzO1xuXG4gIC8qKlxuICAgKiBUaGUgbm9ybWFsIG9mIHRoZSBwbGFuZSBpbiBsb2NhbCBzcGFjZS4gTXVzdCBiZSBub3JtYWxpemVkLlxuICAgKi9cbiAgcHVibGljIG5vcm1hbDogVEhSRUUuVmVjdG9yMztcblxuICBwdWJsaWMgY29uc3RydWN0b3IocGFyYW1zPzogeyBvZmZzZXQ/OiBUSFJFRS5WZWN0b3IzOyBub3JtYWw/OiBUSFJFRS5WZWN0b3IzIH0pIHtcbiAgICBzdXBlcigpO1xuXG4gICAgdGhpcy5vZmZzZXQgPSBwYXJhbXM/Lm9mZnNldCA/PyBuZXcgVEhSRUUuVmVjdG9yMygwLjAsIDAuMCwgMC4wKTtcbiAgICB0aGlzLm5vcm1hbCA9IHBhcmFtcz8ubm9ybWFsID8/IG5ldyBUSFJFRS5WZWN0b3IzKDAuMCwgMC4wLCAxLjApO1xuICB9XG5cbiAgcHVibGljIGNhbGN1bGF0ZUNvbGxpc2lvbihcbiAgICBjb2xsaWRlck1hdHJpeDogVEhSRUUuTWF0cml4NCxcbiAgICBvYmplY3RQb3NpdGlvbjogVEhSRUUuVmVjdG9yMyxcbiAgICBvYmplY3RSYWRpdXM6IG51bWJlcixcbiAgICB0YXJnZXQ6IFRIUkVFLlZlY3RvcjMsXG4gICk6IG51bWJlciB7XG4gICAgdGFyZ2V0LmNvcHkodGhpcy5vZmZzZXQpLmFwcGx5TWF0cml4NChjb2xsaWRlck1hdHJpeCk7IC8vIHRyYW5zZm9ybWVkIG9mZnNldFxuICAgIHRhcmdldC5uZWdhdGUoKS5hZGQob2JqZWN0UG9zaXRpb24pOyAvLyBhIHZlY3RvciBmcm9tIGNvbGxpZGVyIGNlbnRlciB0byBvYmplY3QgcG9zaXRpb25cblxuICAgIF9tYXQzQS5nZXROb3JtYWxNYXRyaXgoY29sbGlkZXJNYXRyaXgpOyAvLyBjb252ZXJ0IHRoZSBjb2xsaWRlciBtYXRyaXggdG8gdGhlIG5vcm1hbCBtYXRyaXhcbiAgICBfdjNBLmNvcHkodGhpcy5ub3JtYWwpLmFwcGx5Tm9ybWFsTWF0cml4KF9tYXQzQSkubm9ybWFsaXplKCk7IC8vIHRyYW5zZm9ybWVkIG5vcm1hbFxuICAgIGNvbnN0IGRpc3RhbmNlID0gdGFyZ2V0LmRvdChfdjNBKSAtIG9iamVjdFJhZGl1cztcblxuICAgIHRhcmdldC5jb3B5KF92M0EpOyAvLyBjb252ZXJ0IHRoZSBkZWx0YSB0byB0aGUgZGlyZWN0aW9uXG5cbiAgICByZXR1cm4gZGlzdGFuY2U7XG4gIH1cbn1cbiIsICJpbXBvcnQgKiBhcyBUSFJFRSBmcm9tICd0aHJlZSc7XG5pbXBvcnQgeyBWUk1TcHJpbmdCb25lQ29sbGlkZXJTaGFwZSB9IGZyb20gJy4vVlJNU3ByaW5nQm9uZUNvbGxpZGVyU2hhcGUnO1xuXG5leHBvcnQgY2xhc3MgVlJNU3ByaW5nQm9uZUNvbGxpZGVyU2hhcGVTcGhlcmUgZXh0ZW5kcyBWUk1TcHJpbmdCb25lQ29sbGlkZXJTaGFwZSB7XG4gIHB1YmxpYyBnZXQgdHlwZSgpOiAnc3BoZXJlJyB7XG4gICAgcmV0dXJuICdzcGhlcmUnO1xuICB9XG5cbiAgLyoqXG4gICAqIFRoZSBvZmZzZXQgb2YgdGhlIHNwaGVyZSBmcm9tIHRoZSBvcmlnaW4gaW4gbG9jYWwgc3BhY2UuXG4gICAqL1xuICBwdWJsaWMgb2Zmc2V0OiBUSFJFRS5WZWN0b3IzO1xuXG4gIC8qKlxuICAgKiBUaGUgcmFkaXVzLlxuICAgKi9cbiAgcHVibGljIHJhZGl1czogbnVtYmVyO1xuXG4gIC8qKlxuICAgKiBJZiB0cnVlLCB0aGUgY29sbGlkZXIgcHJldmVudHMgc3ByaW5nIGJvbmVzIGZyb20gZ29pbmcgb3V0c2lkZSBvZiB0aGUgc3BoZXJlIGluc3RlYWQuXG4gICAqL1xuICBwdWJsaWMgaW5zaWRlOiBib29sZWFuO1xuXG4gIHB1YmxpYyBjb25zdHJ1Y3RvcihwYXJhbXM/OiB7IHJhZGl1cz86IG51bWJlcjsgb2Zmc2V0PzogVEhSRUUuVmVjdG9yMzsgaW5zaWRlPzogYm9vbGVhbiB9KSB7XG4gICAgc3VwZXIoKTtcblxuICAgIHRoaXMub2Zmc2V0ID0gcGFyYW1zPy5vZmZzZXQgPz8gbmV3IFRIUkVFLlZlY3RvcjMoMC4wLCAwLjAsIDAuMCk7XG4gICAgdGhpcy5yYWRpdXMgPSBwYXJhbXM/LnJhZGl1cyA/PyAwLjA7XG4gICAgdGhpcy5pbnNpZGUgPSBwYXJhbXM/Lmluc2lkZSA/PyBmYWxzZTtcbiAgfVxuXG4gIHB1YmxpYyBjYWxjdWxhdGVDb2xsaXNpb24oXG4gICAgY29sbGlkZXJNYXRyaXg6IFRIUkVFLk1hdHJpeDQsXG4gICAgb2JqZWN0UG9zaXRpb246IFRIUkVFLlZlY3RvcjMsXG4gICAgb2JqZWN0UmFkaXVzOiBudW1iZXIsXG4gICAgdGFyZ2V0OiBUSFJFRS5WZWN0b3IzLFxuICApOiBudW1iZXIge1xuICAgIHRhcmdldC5jb3B5KHRoaXMub2Zmc2V0KS5hcHBseU1hdHJpeDQoY29sbGlkZXJNYXRyaXgpOyAvLyB0cmFuc2Zvcm1lZCBvZmZzZXRcbiAgICB0YXJnZXQubmVnYXRlKCkuYWRkKG9iamVjdFBvc2l0aW9uKTsgLy8gYSB2ZWN0b3IgZnJvbSBjb2xsaWRlciBjZW50ZXIgdG8gb2JqZWN0IHBvc2l0aW9uXG5cbiAgICBjb25zdCBkaXN0YW5jZSA9IHRoaXMuaW5zaWRlXG4gICAgICA/IHRoaXMucmFkaXVzIC0gb2JqZWN0UmFkaXVzIC0gdGFyZ2V0Lmxlbmd0aCgpXG4gICAgICA6IHRhcmdldC5sZW5ndGgoKSAtIG9iamVjdFJhZGl1cyAtIHRoaXMucmFkaXVzO1xuXG4gICAgdGFyZ2V0Lm5vcm1hbGl6ZSgpOyAvLyBjb252ZXJ0IHRoZSBkZWx0YSB0byB0aGUgZGlyZWN0aW9uXG4gICAgaWYgKHRoaXMuaW5zaWRlKSB7XG4gICAgICB0YXJnZXQubmVnYXRlKCk7IC8vIGlmIGluc2lkZSwgcmV2ZXJzZSB0aGUgZGlyZWN0aW9uXG4gICAgfVxuXG4gICAgcmV0dXJuIGRpc3RhbmNlO1xuICB9XG59XG4iLCAiaW1wb3J0ICogYXMgVEhSRUUgZnJvbSAndGhyZWUnO1xuaW1wb3J0IHsgVlJNU3ByaW5nQm9uZUNvbGxpZGVyU2hhcGVDYXBzdWxlIH0gZnJvbSAnLi4vLi4vVlJNU3ByaW5nQm9uZUNvbGxpZGVyU2hhcGVDYXBzdWxlJztcbmltcG9ydCB7IENvbGxpZGVyU2hhcGVCdWZmZXJHZW9tZXRyeSB9IGZyb20gJy4vQ29sbGlkZXJTaGFwZUJ1ZmZlckdlb21ldHJ5JztcblxuY29uc3QgX3YzQSA9IG5ldyBUSFJFRS5WZWN0b3IzKCk7XG5cbmV4cG9ydCBjbGFzcyBDb2xsaWRlclNoYXBlQ2Fwc3VsZUJ1ZmZlckdlb21ldHJ5IGV4dGVuZHMgVEhSRUUuQnVmZmVyR2VvbWV0cnkgaW1wbGVtZW50cyBDb2xsaWRlclNoYXBlQnVmZmVyR2VvbWV0cnkge1xuICBwdWJsaWMgd29ybGRTY2FsZSA9IDEuMDtcblxuICBwcml2YXRlIHJlYWRvbmx5IF9hdHRyUG9zOiBUSFJFRS5CdWZmZXJBdHRyaWJ1dGU7XG4gIHByaXZhdGUgcmVhZG9ubHkgX2F0dHJJbmRleDogVEhSRUUuQnVmZmVyQXR0cmlidXRlO1xuICBwcml2YXRlIHJlYWRvbmx5IF9zaGFwZTogVlJNU3ByaW5nQm9uZUNvbGxpZGVyU2hhcGVDYXBzdWxlO1xuICBwcml2YXRlIF9jdXJyZW50UmFkaXVzID0gMDtcbiAgcHJpdmF0ZSByZWFkb25seSBfY3VycmVudE9mZnNldCA9IG5ldyBUSFJFRS5WZWN0b3IzKCk7XG4gIHByaXZhdGUgcmVhZG9ubHkgX2N1cnJlbnRUYWlsID0gbmV3IFRIUkVFLlZlY3RvcjMoKTtcblxuICBwdWJsaWMgY29uc3RydWN0b3Ioc2hhcGU6IFZSTVNwcmluZ0JvbmVDb2xsaWRlclNoYXBlQ2Fwc3VsZSkge1xuICAgIHN1cGVyKCk7XG5cbiAgICB0aGlzLl9zaGFwZSA9IHNoYXBlO1xuXG4gICAgdGhpcy5fYXR0clBvcyA9IG5ldyBUSFJFRS5CdWZmZXJBdHRyaWJ1dGUobmV3IEZsb2F0MzJBcnJheSgzOTYpLCAzKTtcbiAgICB0aGlzLnNldEF0dHJpYnV0ZSgncG9zaXRpb24nLCB0aGlzLl9hdHRyUG9zKTtcblxuICAgIHRoaXMuX2F0dHJJbmRleCA9IG5ldyBUSFJFRS5CdWZmZXJBdHRyaWJ1dGUobmV3IFVpbnQxNkFycmF5KDI2NCksIDEpO1xuICAgIHRoaXMuc2V0SW5kZXgodGhpcy5fYXR0ckluZGV4KTtcblxuICAgIHRoaXMuX2J1aWxkSW5kZXgoKTtcbiAgICB0aGlzLnVwZGF0ZSgpO1xuICB9XG5cbiAgcHVibGljIHVwZGF0ZSgpOiB2b2lkIHtcbiAgICBsZXQgc2hvdWxkVXBkYXRlR2VvbWV0cnkgPSBmYWxzZTtcblxuICAgIGNvbnN0IHJhZGl1cyA9IHRoaXMuX3NoYXBlLnJhZGl1cyAvIHRoaXMud29ybGRTY2FsZTtcbiAgICBpZiAodGhpcy5fY3VycmVudFJhZGl1cyAhPT0gcmFkaXVzKSB7XG4gICAgICB0aGlzLl9jdXJyZW50UmFkaXVzID0gcmFkaXVzO1xuICAgICAgc2hvdWxkVXBkYXRlR2VvbWV0cnkgPSB0cnVlO1xuICAgIH1cblxuICAgIGlmICghdGhpcy5fY3VycmVudE9mZnNldC5lcXVhbHModGhpcy5fc2hhcGUub2Zmc2V0KSkge1xuICAgICAgdGhpcy5fY3VycmVudE9mZnNldC5jb3B5KHRoaXMuX3NoYXBlLm9mZnNldCk7XG4gICAgICBzaG91bGRVcGRhdGVHZW9tZXRyeSA9IHRydWU7XG4gICAgfVxuXG4gICAgY29uc3QgdGFpbCA9IF92M0EuY29weSh0aGlzLl9zaGFwZS50YWlsKS5kaXZpZGVTY2FsYXIodGhpcy53b3JsZFNjYWxlKTtcbiAgICBpZiAodGhpcy5fY3VycmVudFRhaWwuZGlzdGFuY2VUb1NxdWFyZWQodGFpbCkgPiAxZS0xMCkge1xuICAgICAgdGhpcy5fY3VycmVudFRhaWwuY29weSh0YWlsKTtcbiAgICAgIHNob3VsZFVwZGF0ZUdlb21ldHJ5ID0gdHJ1ZTtcbiAgICB9XG5cbiAgICBpZiAoc2hvdWxkVXBkYXRlR2VvbWV0cnkpIHtcbiAgICAgIHRoaXMuX2J1aWxkUG9zaXRpb24oKTtcbiAgICB9XG4gIH1cblxuICBwcml2YXRlIF9idWlsZFBvc2l0aW9uKCk6IHZvaWQge1xuICAgIF92M0EuY29weSh0aGlzLl9jdXJyZW50VGFpbCkuc3ViKHRoaXMuX2N1cnJlbnRPZmZzZXQpO1xuICAgIGNvbnN0IGwgPSBfdjNBLmxlbmd0aCgpIC8gdGhpcy5fY3VycmVudFJhZGl1cztcblxuICAgIGZvciAobGV0IGkgPSAwOyBpIDw9IDE2OyBpKyspIHtcbiAgICAgIGNvbnN0IHQgPSAoaSAvIDE2LjApICogTWF0aC5QSTtcblxuICAgICAgdGhpcy5fYXR0clBvcy5zZXRYWVooaSwgLU1hdGguc2luKHQpLCAtTWF0aC5jb3ModCksIDAuMCk7XG4gICAgICB0aGlzLl9hdHRyUG9zLnNldFhZWigxNyArIGksIGwgKyBNYXRoLnNpbih0KSwgTWF0aC5jb3ModCksIDAuMCk7XG4gICAgICB0aGlzLl9hdHRyUG9zLnNldFhZWigzNCArIGksIC1NYXRoLnNpbih0KSwgMC4wLCAtTWF0aC5jb3ModCkpO1xuICAgICAgdGhpcy5fYXR0clBvcy5zZXRYWVooNTEgKyBpLCBsICsgTWF0aC5zaW4odCksIDAuMCwgTWF0aC5jb3ModCkpO1xuICAgIH1cblxuICAgIGZvciAobGV0IGkgPSAwOyBpIDwgMzI7IGkrKykge1xuICAgICAgY29uc3QgdCA9IChpIC8gMTYuMCkgKiBNYXRoLlBJO1xuICAgICAgdGhpcy5fYXR0clBvcy5zZXRYWVooNjggKyBpLCAwLjAsIE1hdGguc2luKHQpLCBNYXRoLmNvcyh0KSk7XG4gICAgICB0aGlzLl9hdHRyUG9zLnNldFhZWigxMDAgKyBpLCBsLCBNYXRoLnNpbih0KSwgTWF0aC5jb3ModCkpO1xuICAgIH1cblxuICAgIGNvbnN0IHRoZXRhID0gTWF0aC5hdGFuMihfdjNBLnksIE1hdGguc3FydChfdjNBLnggKiBfdjNBLnggKyBfdjNBLnogKiBfdjNBLnopKTtcbiAgICBjb25zdCBwaGkgPSAtTWF0aC5hdGFuMihfdjNBLnosIF92M0EueCk7XG5cbiAgICB0aGlzLnJvdGF0ZVoodGhldGEpO1xuICAgIHRoaXMucm90YXRlWShwaGkpO1xuICAgIHRoaXMuc2NhbGUodGhpcy5fY3VycmVudFJhZGl1cywgdGhpcy5fY3VycmVudFJhZGl1cywgdGhpcy5fY3VycmVudFJhZGl1cyk7XG4gICAgdGhpcy50cmFuc2xhdGUodGhpcy5fY3VycmVudE9mZnNldC54LCB0aGlzLl9jdXJyZW50T2Zmc2V0LnksIHRoaXMuX2N1cnJlbnRPZmZzZXQueik7XG5cbiAgICB0aGlzLl9hdHRyUG9zLm5lZWRzVXBkYXRlID0gdHJ1ZTtcbiAgfVxuXG4gIHByaXZhdGUgX2J1aWxkSW5kZXgoKTogdm9pZCB7XG4gICAgZm9yIChsZXQgaSA9IDA7IGkgPCAzNDsgaSsrKSB7XG4gICAgICBjb25zdCBpMSA9IChpICsgMSkgJSAzNDtcblxuICAgICAgdGhpcy5fYXR0ckluZGV4LnNldFhZKGkgKiAyLCBpLCBpMSk7XG4gICAgICB0aGlzLl9hdHRySW5kZXguc2V0WFkoNjggKyBpICogMiwgMzQgKyBpLCAzNCArIGkxKTtcbiAgICB9XG5cbiAgICBmb3IgKGxldCBpID0gMDsgaSA8IDMyOyBpKyspIHtcbiAgICAgIGNvbnN0IGkxID0gKGkgKyAxKSAlIDMyO1xuXG4gICAgICB0aGlzLl9hdHRySW5kZXguc2V0WFkoMTM2ICsgaSAqIDIsIDY4ICsgaSwgNjggKyBpMSk7XG4gICAgICB0aGlzLl9hdHRySW5kZXguc2V0WFkoMjAwICsgaSAqIDIsIDEwMCArIGksIDEwMCArIGkxKTtcbiAgICB9XG5cbiAgICB0aGlzLl9hdHRySW5kZXgubmVlZHNVcGRhdGUgPSB0cnVlO1xuICB9XG59XG4iLCAiaW1wb3J0ICogYXMgVEhSRUUgZnJvbSAndGhyZWUnO1xuaW1wb3J0IHsgVlJNU3ByaW5nQm9uZUNvbGxpZGVyU2hhcGVQbGFuZSB9IGZyb20gJy4uLy4uL1ZSTVNwcmluZ0JvbmVDb2xsaWRlclNoYXBlUGxhbmUnO1xuaW1wb3J0IHsgQ29sbGlkZXJTaGFwZUJ1ZmZlckdlb21ldHJ5IH0gZnJvbSAnLi9Db2xsaWRlclNoYXBlQnVmZmVyR2VvbWV0cnknO1xuXG5leHBvcnQgY2xhc3MgQ29sbGlkZXJTaGFwZVBsYW5lQnVmZmVyR2VvbWV0cnkgZXh0ZW5kcyBUSFJFRS5CdWZmZXJHZW9tZXRyeSBpbXBsZW1lbnRzIENvbGxpZGVyU2hhcGVCdWZmZXJHZW9tZXRyeSB7XG4gIHB1YmxpYyB3b3JsZFNjYWxlID0gMS4wO1xuXG4gIHByaXZhdGUgcmVhZG9ubHkgX2F0dHJQb3M6IFRIUkVFLkJ1ZmZlckF0dHJpYnV0ZTtcbiAgcHJpdmF0ZSByZWFkb25seSBfYXR0ckluZGV4OiBUSFJFRS5CdWZmZXJBdHRyaWJ1dGU7XG4gIHByaXZhdGUgcmVhZG9ubHkgX3NoYXBlOiBWUk1TcHJpbmdCb25lQ29sbGlkZXJTaGFwZVBsYW5lO1xuICBwcml2YXRlIHJlYWRvbmx5IF9jdXJyZW50T2Zmc2V0ID0gbmV3IFRIUkVFLlZlY3RvcjMoKTtcbiAgcHJpdmF0ZSByZWFkb25seSBfY3VycmVudE5vcm1hbCA9IG5ldyBUSFJFRS5WZWN0b3IzKCk7XG5cbiAgcHVibGljIGNvbnN0cnVjdG9yKHNoYXBlOiBWUk1TcHJpbmdCb25lQ29sbGlkZXJTaGFwZVBsYW5lKSB7XG4gICAgc3VwZXIoKTtcblxuICAgIHRoaXMuX3NoYXBlID0gc2hhcGU7XG5cbiAgICB0aGlzLl9hdHRyUG9zID0gbmV3IFRIUkVFLkJ1ZmZlckF0dHJpYnV0ZShuZXcgRmxvYXQzMkFycmF5KDYgKiAzKSwgMyk7XG4gICAgdGhpcy5zZXRBdHRyaWJ1dGUoJ3Bvc2l0aW9uJywgdGhpcy5fYXR0clBvcyk7XG5cbiAgICB0aGlzLl9hdHRySW5kZXggPSBuZXcgVEhSRUUuQnVmZmVyQXR0cmlidXRlKG5ldyBVaW50MTZBcnJheSgxMCksIDEpO1xuICAgIHRoaXMuc2V0SW5kZXgodGhpcy5fYXR0ckluZGV4KTtcblxuICAgIHRoaXMuX2J1aWxkSW5kZXgoKTtcbiAgICB0aGlzLnVwZGF0ZSgpO1xuICB9XG5cbiAgcHVibGljIHVwZGF0ZSgpOiB2b2lkIHtcbiAgICBsZXQgc2hvdWxkVXBkYXRlR2VvbWV0cnkgPSBmYWxzZTtcblxuICAgIGlmICghdGhpcy5fY3VycmVudE9mZnNldC5lcXVhbHModGhpcy5fc2hhcGUub2Zmc2V0KSkge1xuICAgICAgdGhpcy5fY3VycmVudE9mZnNldC5jb3B5KHRoaXMuX3NoYXBlLm9mZnNldCk7XG4gICAgICBzaG91bGRVcGRhdGVHZW9tZXRyeSA9IHRydWU7XG4gICAgfVxuXG4gICAgaWYgKCF0aGlzLl9jdXJyZW50Tm9ybWFsLmVxdWFscyh0aGlzLl9zaGFwZS5ub3JtYWwpKSB7XG4gICAgICB0aGlzLl9jdXJyZW50Tm9ybWFsLmNvcHkodGhpcy5fc2hhcGUubm9ybWFsKTtcbiAgICAgIHNob3VsZFVwZGF0ZUdlb21ldHJ5ID0gdHJ1ZTtcbiAgICB9XG5cbiAgICBpZiAoc2hvdWxkVXBkYXRlR2VvbWV0cnkpIHtcbiAgICAgIHRoaXMuX2J1aWxkUG9zaXRpb24oKTtcbiAgICB9XG4gIH1cblxuICBwcml2YXRlIF9idWlsZFBvc2l0aW9uKCk6IHZvaWQge1xuICAgIHRoaXMuX2F0dHJQb3Muc2V0WFlaKDAsIC0wLjUsIC0wLjUsIDApO1xuICAgIHRoaXMuX2F0dHJQb3Muc2V0WFlaKDEsIDAuNSwgLTAuNSwgMCk7XG4gICAgdGhpcy5fYXR0clBvcy5zZXRYWVooMiwgMC41LCAwLjUsIDApO1xuICAgIHRoaXMuX2F0dHJQb3Muc2V0WFlaKDMsIC0wLjUsIDAuNSwgMCk7XG4gICAgdGhpcy5fYXR0clBvcy5zZXRYWVooNCwgMCwgMCwgMCk7XG4gICAgdGhpcy5fYXR0clBvcy5zZXRYWVooNSwgMCwgMCwgMC4yNSk7XG5cbiAgICB0aGlzLnRyYW5zbGF0ZSh0aGlzLl9jdXJyZW50T2Zmc2V0LngsIHRoaXMuX2N1cnJlbnRPZmZzZXQueSwgdGhpcy5fY3VycmVudE9mZnNldC56KTtcbiAgICB0aGlzLmxvb2tBdCh0aGlzLl9jdXJyZW50Tm9ybWFsKTtcblxuICAgIHRoaXMuX2F0dHJQb3MubmVlZHNVcGRhdGUgPSB0cnVlO1xuICB9XG5cbiAgcHJpdmF0ZSBfYnVpbGRJbmRleCgpOiB2b2lkIHtcbiAgICB0aGlzLl9hdHRySW5kZXguc2V0WFkoMCwgMCwgMSk7XG4gICAgdGhpcy5fYXR0ckluZGV4LnNldFhZKDIsIDEsIDIpO1xuICAgIHRoaXMuX2F0dHJJbmRleC5zZXRYWSg0LCAyLCAzKTtcbiAgICB0aGlzLl9hdHRySW5kZXguc2V0WFkoNiwgMywgMCk7XG4gICAgdGhpcy5fYXR0ckluZGV4LnNldFhZKDgsIDQsIDUpO1xuXG4gICAgdGhpcy5fYXR0ckluZGV4Lm5lZWRzVXBkYXRlID0gdHJ1ZTtcbiAgfVxufVxuIiwgImltcG9ydCAqIGFzIFRIUkVFIGZyb20gJ3RocmVlJztcbmltcG9ydCB7IFZSTVNwcmluZ0JvbmVDb2xsaWRlclNoYXBlU3BoZXJlIH0gZnJvbSAnLi4vLi4vVlJNU3ByaW5nQm9uZUNvbGxpZGVyU2hhcGVTcGhlcmUnO1xuaW1wb3J0IHsgQ29sbGlkZXJTaGFwZUJ1ZmZlckdlb21ldHJ5IH0gZnJvbSAnLi9Db2xsaWRlclNoYXBlQnVmZmVyR2VvbWV0cnknO1xuXG5leHBvcnQgY2xhc3MgQ29sbGlkZXJTaGFwZVNwaGVyZUJ1ZmZlckdlb21ldHJ5IGV4dGVuZHMgVEhSRUUuQnVmZmVyR2VvbWV0cnkgaW1wbGVtZW50cyBDb2xsaWRlclNoYXBlQnVmZmVyR2VvbWV0cnkge1xuICBwdWJsaWMgd29ybGRTY2FsZSA9IDEuMDtcblxuICBwcml2YXRlIHJlYWRvbmx5IF9hdHRyUG9zOiBUSFJFRS5CdWZmZXJBdHRyaWJ1dGU7XG4gIHByaXZhdGUgcmVhZG9ubHkgX2F0dHJJbmRleDogVEhSRUUuQnVmZmVyQXR0cmlidXRlO1xuICBwcml2YXRlIHJlYWRvbmx5IF9zaGFwZTogVlJNU3ByaW5nQm9uZUNvbGxpZGVyU2hhcGVTcGhlcmU7XG4gIHByaXZhdGUgX2N1cnJlbnRSYWRpdXMgPSAwO1xuICBwcml2YXRlIHJlYWRvbmx5IF9jdXJyZW50T2Zmc2V0ID0gbmV3IFRIUkVFLlZlY3RvcjMoKTtcblxuICBwdWJsaWMgY29uc3RydWN0b3Ioc2hhcGU6IFZSTVNwcmluZ0JvbmVDb2xsaWRlclNoYXBlU3BoZXJlKSB7XG4gICAgc3VwZXIoKTtcblxuICAgIHRoaXMuX3NoYXBlID0gc2hhcGU7XG5cbiAgICB0aGlzLl9hdHRyUG9zID0gbmV3IFRIUkVFLkJ1ZmZlckF0dHJpYnV0ZShuZXcgRmxvYXQzMkFycmF5KDMyICogMyAqIDMpLCAzKTtcbiAgICB0aGlzLnNldEF0dHJpYnV0ZSgncG9zaXRpb24nLCB0aGlzLl9hdHRyUG9zKTtcblxuICAgIHRoaXMuX2F0dHJJbmRleCA9IG5ldyBUSFJFRS5CdWZmZXJBdHRyaWJ1dGUobmV3IFVpbnQxNkFycmF5KDY0ICogMyksIDEpO1xuICAgIHRoaXMuc2V0SW5kZXgodGhpcy5fYXR0ckluZGV4KTtcblxuICAgIHRoaXMuX2J1aWxkSW5kZXgoKTtcbiAgICB0aGlzLnVwZGF0ZSgpO1xuICB9XG5cbiAgcHVibGljIHVwZGF0ZSgpOiB2b2lkIHtcbiAgICBsZXQgc2hvdWxkVXBkYXRlR2VvbWV0cnkgPSBmYWxzZTtcblxuICAgIGNvbnN0IHJhZGl1cyA9IHRoaXMuX3NoYXBlLnJhZGl1cyAvIHRoaXMud29ybGRTY2FsZTtcbiAgICBpZiAodGhpcy5fY3VycmVudFJhZGl1cyAhPT0gcmFkaXVzKSB7XG4gICAgICB0aGlzLl9jdXJyZW50UmFkaXVzID0gcmFkaXVzO1xuICAgICAgc2hvdWxkVXBkYXRlR2VvbWV0cnkgPSB0cnVlO1xuICAgIH1cblxuICAgIGlmICghdGhpcy5fY3VycmVudE9mZnNldC5lcXVhbHModGhpcy5fc2hhcGUub2Zmc2V0KSkge1xuICAgICAgdGhpcy5fY3VycmVudE9mZnNldC5jb3B5KHRoaXMuX3NoYXBlLm9mZnNldCk7XG4gICAgICBzaG91bGRVcGRhdGVHZW9tZXRyeSA9IHRydWU7XG4gICAgfVxuXG4gICAgaWYgKHNob3VsZFVwZGF0ZUdlb21ldHJ5KSB7XG4gICAgICB0aGlzLl9idWlsZFBvc2l0aW9uKCk7XG4gICAgfVxuICB9XG5cbiAgcHJpdmF0ZSBfYnVpbGRQb3NpdGlvbigpOiB2b2lkIHtcbiAgICBmb3IgKGxldCBpID0gMDsgaSA8IDMyOyBpKyspIHtcbiAgICAgIGNvbnN0IHQgPSAoaSAvIDE2LjApICogTWF0aC5QSTtcblxuICAgICAgdGhpcy5fYXR0clBvcy5zZXRYWVooaSwgTWF0aC5jb3ModCksIE1hdGguc2luKHQpLCAwLjApO1xuICAgICAgdGhpcy5fYXR0clBvcy5zZXRYWVooMzIgKyBpLCAwLjAsIE1hdGguY29zKHQpLCBNYXRoLnNpbih0KSk7XG4gICAgICB0aGlzLl9hdHRyUG9zLnNldFhZWig2NCArIGksIE1hdGguc2luKHQpLCAwLjAsIE1hdGguY29zKHQpKTtcbiAgICB9XG5cbiAgICB0aGlzLnNjYWxlKHRoaXMuX2N1cnJlbnRSYWRpdXMsIHRoaXMuX2N1cnJlbnRSYWRpdXMsIHRoaXMuX2N1cnJlbnRSYWRpdXMpO1xuICAgIHRoaXMudHJhbnNsYXRlKHRoaXMuX2N1cnJlbnRPZmZzZXQueCwgdGhpcy5fY3VycmVudE9mZnNldC55LCB0aGlzLl9jdXJyZW50T2Zmc2V0LnopO1xuXG4gICAgdGhpcy5fYXR0clBvcy5uZWVkc1VwZGF0ZSA9IHRydWU7XG4gIH1cblxuICBwcml2YXRlIF9idWlsZEluZGV4KCk6IHZvaWQge1xuICAgIGZvciAobGV0IGkgPSAwOyBpIDwgMzI7IGkrKykge1xuICAgICAgY29uc3QgaTEgPSAoaSArIDEpICUgMzI7XG5cbiAgICAgIHRoaXMuX2F0dHJJbmRleC5zZXRYWShpICogMiwgaSwgaTEpO1xuICAgICAgdGhpcy5fYXR0ckluZGV4LnNldFhZKDY0ICsgaSAqIDIsIDMyICsgaSwgMzIgKyBpMSk7XG4gICAgICB0aGlzLl9hdHRySW5kZXguc2V0WFkoMTI4ICsgaSAqIDIsIDY0ICsgaSwgNjQgKyBpMSk7XG4gICAgfVxuXG4gICAgdGhpcy5fYXR0ckluZGV4Lm5lZWRzVXBkYXRlID0gdHJ1ZTtcbiAgfVxufVxuIiwgImltcG9ydCAqIGFzIFRIUkVFIGZyb20gJ3RocmVlJztcbmltcG9ydCB7IFZSTVNwcmluZ0JvbmVKb2ludCB9IGZyb20gJy4uL1ZSTVNwcmluZ0JvbmVKb2ludCc7XG5pbXBvcnQgeyBTcHJpbmdCb25lQnVmZmVyR2VvbWV0cnkgfSBmcm9tICcuL3V0aWxzL1NwcmluZ0JvbmVCdWZmZXJHZW9tZXRyeSc7XG5cbmNvbnN0IF92M0EgPSBuZXcgVEhSRUUuVmVjdG9yMygpO1xuXG5leHBvcnQgY2xhc3MgVlJNU3ByaW5nQm9uZUpvaW50SGVscGVyIGV4dGVuZHMgVEhSRUUuR3JvdXAge1xuICBwdWJsaWMgcmVhZG9ubHkgc3ByaW5nQm9uZTogVlJNU3ByaW5nQm9uZUpvaW50O1xuICBwcml2YXRlIHJlYWRvbmx5IF9nZW9tZXRyeTogU3ByaW5nQm9uZUJ1ZmZlckdlb21ldHJ5O1xuICBwcml2YXRlIHJlYWRvbmx5IF9saW5lOiBUSFJFRS5MaW5lU2VnbWVudHM7XG5cbiAgcHVibGljIGNvbnN0cnVjdG9yKHNwcmluZ0JvbmU6IFZSTVNwcmluZ0JvbmVKb2ludCkge1xuICAgIHN1cGVyKCk7XG4gICAgdGhpcy5tYXRyaXhBdXRvVXBkYXRlID0gZmFsc2U7XG5cbiAgICB0aGlzLnNwcmluZ0JvbmUgPSBzcHJpbmdCb25lO1xuXG4gICAgdGhpcy5fZ2VvbWV0cnkgPSBuZXcgU3ByaW5nQm9uZUJ1ZmZlckdlb21ldHJ5KHRoaXMuc3ByaW5nQm9uZSk7XG5cbiAgICBjb25zdCBtYXRlcmlhbCA9IG5ldyBUSFJFRS5MaW5lQmFzaWNNYXRlcmlhbCh7XG4gICAgICBjb2xvcjogMHhmZmZmMDAsXG4gICAgICBkZXB0aFRlc3Q6IGZhbHNlLFxuICAgICAgZGVwdGhXcml0ZTogZmFsc2UsXG4gICAgfSk7XG5cbiAgICB0aGlzLl9saW5lID0gbmV3IFRIUkVFLkxpbmVTZWdtZW50cyh0aGlzLl9nZW9tZXRyeSwgbWF0ZXJpYWwpO1xuICAgIHRoaXMuYWRkKHRoaXMuX2xpbmUpO1xuICB9XG5cbiAgcHVibGljIGRpc3Bvc2UoKTogdm9pZCB7XG4gICAgdGhpcy5fZ2VvbWV0cnkuZGlzcG9zZSgpO1xuICB9XG5cbiAgcHVibGljIHVwZGF0ZU1hdHJpeFdvcmxkKGZvcmNlOiBib29sZWFuKTogdm9pZCB7XG4gICAgdGhpcy5zcHJpbmdCb25lLmJvbmUudXBkYXRlV29ybGRNYXRyaXgodHJ1ZSwgZmFsc2UpO1xuXG4gICAgdGhpcy5tYXRyaXguY29weSh0aGlzLnNwcmluZ0JvbmUuYm9uZS5tYXRyaXhXb3JsZCk7XG5cbiAgICBjb25zdCBtYXRyaXhXb3JsZEVsZW1lbnRzID0gdGhpcy5tYXRyaXguZWxlbWVudHM7XG4gICAgdGhpcy5fZ2VvbWV0cnkud29ybGRTY2FsZSA9IF92M0FcbiAgICAgIC5zZXQobWF0cml4V29ybGRFbGVtZW50c1swXSwgbWF0cml4V29ybGRFbGVtZW50c1sxXSwgbWF0cml4V29ybGRFbGVtZW50c1syXSlcbiAgICAgIC5sZW5ndGgoKTsgLy8gY2FsY3VsYXRlIHNjYWxlIG9mIHggY29tcG9uZW50XG5cbiAgICB0aGlzLl9nZW9tZXRyeS51cGRhdGUoKTtcblxuICAgIHN1cGVyLnVwZGF0ZU1hdHJpeFdvcmxkKGZvcmNlKTtcbiAgfVxufVxuIiwgImltcG9ydCAqIGFzIFRIUkVFIGZyb20gJ3RocmVlJztcbmltcG9ydCB7IFZSTVNwcmluZ0JvbmVKb2ludCB9IGZyb20gJy4uLy4uL1ZSTVNwcmluZ0JvbmVKb2ludCc7XG5cbmV4cG9ydCBjbGFzcyBTcHJpbmdCb25lQnVmZmVyR2VvbWV0cnkgZXh0ZW5kcyBUSFJFRS5CdWZmZXJHZW9tZXRyeSB7XG4gIHB1YmxpYyB3b3JsZFNjYWxlID0gMS4wO1xuXG4gIHByaXZhdGUgcmVhZG9ubHkgX2F0dHJQb3M6IFRIUkVFLkJ1ZmZlckF0dHJpYnV0ZTtcbiAgcHJpdmF0ZSByZWFkb25seSBfYXR0ckluZGV4OiBUSFJFRS5CdWZmZXJBdHRyaWJ1dGU7XG4gIHByaXZhdGUgcmVhZG9ubHkgX3NwcmluZ0JvbmU6IFZSTVNwcmluZ0JvbmVKb2ludDtcbiAgcHJpdmF0ZSBfY3VycmVudFJhZGl1cyA9IDA7XG4gIHByaXZhdGUgcmVhZG9ubHkgX2N1cnJlbnRUYWlsID0gbmV3IFRIUkVFLlZlY3RvcjMoKTtcblxuICBwdWJsaWMgY29uc3RydWN0b3Ioc3ByaW5nQm9uZTogVlJNU3ByaW5nQm9uZUpvaW50KSB7XG4gICAgc3VwZXIoKTtcblxuICAgIHRoaXMuX3NwcmluZ0JvbmUgPSBzcHJpbmdCb25lO1xuXG4gICAgdGhpcy5fYXR0clBvcyA9IG5ldyBUSFJFRS5CdWZmZXJBdHRyaWJ1dGUobmV3IEZsb2F0MzJBcnJheSgyOTQpLCAzKTtcbiAgICB0aGlzLnNldEF0dHJpYnV0ZSgncG9zaXRpb24nLCB0aGlzLl9hdHRyUG9zKTtcblxuICAgIHRoaXMuX2F0dHJJbmRleCA9IG5ldyBUSFJFRS5CdWZmZXJBdHRyaWJ1dGUobmV3IFVpbnQxNkFycmF5KDE5NCksIDEpO1xuICAgIHRoaXMuc2V0SW5kZXgodGhpcy5fYXR0ckluZGV4KTtcblxuICAgIHRoaXMuX2J1aWxkSW5kZXgoKTtcbiAgICB0aGlzLnVwZGF0ZSgpO1xuICB9XG5cbiAgcHVibGljIHVwZGF0ZSgpOiB2b2lkIHtcbiAgICBsZXQgc2hvdWxkVXBkYXRlR2VvbWV0cnkgPSBmYWxzZTtcblxuICAgIGNvbnN0IHJhZGl1cyA9IHRoaXMuX3NwcmluZ0JvbmUuc2V0dGluZ3MuaGl0UmFkaXVzIC8gdGhpcy53b3JsZFNjYWxlO1xuICAgIGlmICh0aGlzLl9jdXJyZW50UmFkaXVzICE9PSByYWRpdXMpIHtcbiAgICAgIHRoaXMuX2N1cnJlbnRSYWRpdXMgPSByYWRpdXM7XG4gICAgICBzaG91bGRVcGRhdGVHZW9tZXRyeSA9IHRydWU7XG4gICAgfVxuXG4gICAgaWYgKCF0aGlzLl9jdXJyZW50VGFpbC5lcXVhbHModGhpcy5fc3ByaW5nQm9uZS5pbml0aWFsTG9jYWxDaGlsZFBvc2l0aW9uKSkge1xuICAgICAgdGhpcy5fY3VycmVudFRhaWwuY29weSh0aGlzLl9zcHJpbmdCb25lLmluaXRpYWxMb2NhbENoaWxkUG9zaXRpb24pO1xuICAgICAgc2hvdWxkVXBkYXRlR2VvbWV0cnkgPSB0cnVlO1xuICAgIH1cblxuICAgIGlmIChzaG91bGRVcGRhdGVHZW9tZXRyeSkge1xuICAgICAgdGhpcy5fYnVpbGRQb3NpdGlvbigpO1xuICAgIH1cbiAgfVxuXG4gIHByaXZhdGUgX2J1aWxkUG9zaXRpb24oKTogdm9pZCB7XG4gICAgZm9yIChsZXQgaSA9IDA7IGkgPCAzMjsgaSsrKSB7XG4gICAgICBjb25zdCB0ID0gKGkgLyAxNi4wKSAqIE1hdGguUEk7XG5cbiAgICAgIHRoaXMuX2F0dHJQb3Muc2V0WFlaKGksIE1hdGguY29zKHQpLCBNYXRoLnNpbih0KSwgMC4wKTtcbiAgICAgIHRoaXMuX2F0dHJQb3Muc2V0WFlaKDMyICsgaSwgMC4wLCBNYXRoLmNvcyh0KSwgTWF0aC5zaW4odCkpO1xuICAgICAgdGhpcy5fYXR0clBvcy5zZXRYWVooNjQgKyBpLCBNYXRoLnNpbih0KSwgMC4wLCBNYXRoLmNvcyh0KSk7XG4gICAgfVxuXG4gICAgdGhpcy5zY2FsZSh0aGlzLl9jdXJyZW50UmFkaXVzLCB0aGlzLl9jdXJyZW50UmFkaXVzLCB0aGlzLl9jdXJyZW50UmFkaXVzKTtcbiAgICB0aGlzLnRyYW5zbGF0ZSh0aGlzLl9jdXJyZW50VGFpbC54LCB0aGlzLl9jdXJyZW50VGFpbC55LCB0aGlzLl9jdXJyZW50VGFpbC56KTtcblxuICAgIHRoaXMuX2F0dHJQb3Muc2V0WFlaKDk2LCAwLCAwLCAwKTtcbiAgICB0aGlzLl9hdHRyUG9zLnNldFhZWig5NywgdGhpcy5fY3VycmVudFRhaWwueCwgdGhpcy5fY3VycmVudFRhaWwueSwgdGhpcy5fY3VycmVudFRhaWwueik7XG5cbiAgICB0aGlzLl9hdHRyUG9zLm5lZWRzVXBkYXRlID0gdHJ1ZTtcbiAgfVxuXG4gIHByaXZhdGUgX2J1aWxkSW5kZXgoKTogdm9pZCB7XG4gICAgZm9yIChsZXQgaSA9IDA7IGkgPCAzMjsgaSsrKSB7XG4gICAgICBjb25zdCBpMSA9IChpICsgMSkgJSAzMjtcblxuICAgICAgdGhpcy5fYXR0ckluZGV4LnNldFhZKGkgKiAyLCBpLCBpMSk7XG4gICAgICB0aGlzLl9hdHRySW5kZXguc2V0WFkoNjQgKyBpICogMiwgMzIgKyBpLCAzMiArIGkxKTtcbiAgICAgIHRoaXMuX2F0dHJJbmRleC5zZXRYWSgxMjggKyBpICogMiwgNjQgKyBpLCA2NCArIGkxKTtcbiAgICB9XG4gICAgdGhpcy5fYXR0ckluZGV4LnNldFhZKDE5MiwgOTYsIDk3KTtcblxuICAgIHRoaXMuX2F0dHJJbmRleC5uZWVkc1VwZGF0ZSA9IHRydWU7XG4gIH1cbn1cbiIsICJpbXBvcnQgKiBhcyBUSFJFRSBmcm9tICd0aHJlZSc7XG5pbXBvcnQgdHlwZSB7IFZSTVNwcmluZ0JvbmVDb2xsaWRlclNoYXBlIH0gZnJvbSAnLi9WUk1TcHJpbmdCb25lQ29sbGlkZXJTaGFwZSc7XG5cbi8qKlxuICogUmVwcmVzZW50cyBhIGNvbGxpZGVyIG9mIGEgVlJNLlxuICovXG5leHBvcnQgY2xhc3MgVlJNU3ByaW5nQm9uZUNvbGxpZGVyIGV4dGVuZHMgVEhSRUUuT2JqZWN0M0Qge1xuICAvKipcbiAgICogVGhlIHNoYXBlIG9mIHRoZSBjb2xsaWRlci5cbiAgICovXG4gIHB1YmxpYyByZWFkb25seSBzaGFwZTogVlJNU3ByaW5nQm9uZUNvbGxpZGVyU2hhcGU7XG5cbiAgcHVibGljIGNvbnN0cnVjdG9yKHNoYXBlOiBWUk1TcHJpbmdCb25lQ29sbGlkZXJTaGFwZSkge1xuICAgIHN1cGVyKCk7XG5cbiAgICB0aGlzLnNoYXBlID0gc2hhcGU7XG4gIH1cbn1cbiIsICJpbXBvcnQgKiBhcyBUSFJFRSBmcm9tICd0aHJlZSc7XG5pbXBvcnQgeyBtYXQ0SW52ZXJ0Q29tcGF0IH0gZnJvbSAnLi91dGlscy9tYXQ0SW52ZXJ0Q29tcGF0JztcbmltcG9ydCB7IE1hdHJpeDRJbnZlcnNlQ2FjaGUgfSBmcm9tICcuL3V0aWxzL01hdHJpeDRJbnZlcnNlQ2FjaGUnO1xuaW1wb3J0IHR5cGUgeyBWUk1TcHJpbmdCb25lQ29sbGlkZXJHcm91cCB9IGZyb20gJy4vVlJNU3ByaW5nQm9uZUNvbGxpZGVyR3JvdXAnO1xuaW1wb3J0IHR5cGUgeyBWUk1TcHJpbmdCb25lSm9pbnRTZXR0aW5ncyB9IGZyb20gJy4vVlJNU3ByaW5nQm9uZUpvaW50U2V0dGluZ3MnO1xuXG4vLyBiYXNlZCBvblxuLy8gaHR0cDovL3JvY2tldGp1bXAuc2tyLmpwL3VuaXR5M2QvMTA5L1xuLy8gaHR0cHM6Ly9naXRodWIuY29tL2R3YW5nby9VbmlWUk0vYmxvYi9tYXN0ZXIvU2NyaXB0cy9TcHJpbmdCb25lL1ZSTVNwcmluZ0JvbmUuY3NcblxuY29uc3QgSURFTlRJVFlfTUFUUklYNCA9IG5ldyBUSFJFRS5NYXRyaXg0KCk7XG5cbi8vIFx1OEEwOFx1N0I5N1x1NEUyRFx1MzA2RVx1NEUwMFx1NjY0Mlx1NEZERFx1NUI1OFx1NzUyOFx1NTkwOVx1NjU3MFx1RkYwOFx1NEUwMFx1NUVBNlx1MzBBNFx1MzBGM1x1MzBCOVx1MzBCRlx1MzBGM1x1MzBCOVx1MzA5Mlx1NEY1Q1x1MzA2M1x1MzA1Rlx1MzA4OVx1MzA0Mlx1MzA2OFx1MzA2Rlx1NEY3Rlx1MzA0NFx1NTZERVx1MzA1OVx1RkYwOVxuY29uc3QgX3YzQSA9IG5ldyBUSFJFRS5WZWN0b3IzKCk7XG5jb25zdCBfdjNCID0gbmV3IFRIUkVFLlZlY3RvcjMoKTtcbmNvbnN0IF92M0MgPSBuZXcgVEhSRUUuVmVjdG9yMygpO1xuXG4vKipcbiAqIEEgdGVtcG9yYXJ5IHZhcmlhYmxlIHdoaWNoIGlzIHVzZWQgaW4gYHVwZGF0ZWBcbiAqL1xuY29uc3QgX3dvcmxkU3BhY2VQb3NpdGlvbiA9IG5ldyBUSFJFRS5WZWN0b3IzKCk7XG5cbi8qKlxuICogQSB0ZW1wb3JhcnkgdmFyaWFibGUgd2hpY2ggaXMgdXNlZCBpbiBgdXBkYXRlYFxuICovXG5jb25zdCBfY2VudGVyU3BhY2VQb3NpdGlvbiA9IG5ldyBUSFJFRS5WZWN0b3IzKCk7XG5cbi8qKlxuICogQSB0ZW1wb3JhcnkgdmFyaWFibGUgd2hpY2ggaXMgdXNlZCBpbiBgdXBkYXRlYFxuICovXG5jb25zdCBfbmV4dFRhaWwgPSBuZXcgVEhSRUUuVmVjdG9yMygpO1xuXG5jb25zdCBfcXVhdEEgPSBuZXcgVEhSRUUuUXVhdGVybmlvbigpO1xuY29uc3QgX21hdEEgPSBuZXcgVEhSRUUuTWF0cml4NCgpO1xuY29uc3QgX21hdEIgPSBuZXcgVEhSRUUuTWF0cml4NCgpO1xuXG4vKipcbiAqIEEgY2xhc3MgcmVwcmVzZW50cyBhIHNpbmdsZSBqb2ludCBvZiBhIHNwcmluZyBib25lLlxuICogSXQgc2hvdWxkIGJlIG1hbmFnZWQgYnkgYSBbW1ZSTVNwcmluZ0JvbmVNYW5hZ2VyXV0uXG4gKi9cbmV4cG9ydCBjbGFzcyBWUk1TcHJpbmdCb25lSm9pbnQge1xuICAvKipcbiAgICogU2V0dGluZ3Mgb2YgdGhlIGJvbmUuXG4gICAqL1xuICBwdWJsaWMgc2V0dGluZ3M6IFZSTVNwcmluZ0JvbmVKb2ludFNldHRpbmdzO1xuXG4gIC8qKlxuICAgKiBDb2xsaWRlciBncm91cHMgYXR0YWNoZWQgdG8gdGhpcyBib25lLlxuICAgKi9cbiAgcHVibGljIGNvbGxpZGVyR3JvdXBzOiBWUk1TcHJpbmdCb25lQ29sbGlkZXJHcm91cFtdO1xuXG4gIC8qKlxuICAgKiBBbiBPYmplY3QzRCBhdHRhY2hlZCB0byB0aGlzIGJvbmUuXG4gICAqL1xuICBwdWJsaWMgcmVhZG9ubHkgYm9uZTogVEhSRUUuT2JqZWN0M0Q7XG5cbiAgLyoqXG4gICAqIEFuIE9iamVjdDNEIHRoYXQgd2lsbCBiZSB1c2VkIGFzIGEgdGFpbCBvZiB0aGlzIHNwcmluZyBib25lLlxuICAgKiBJdCBjYW4gYmUgbnVsbCB3aGVuIHRoZSBzcHJpbmcgYm9uZSBpcyBpbXBvcnRlZCBmcm9tIFZSTSAwLjAuXG4gICAqL1xuICBwdWJsaWMgcmVhZG9ubHkgY2hpbGQ6IFRIUkVFLk9iamVjdDNEIHwgbnVsbDtcblxuICAvKipcbiAgICogQ3VycmVudCBwb3NpdGlvbiBvZiBjaGlsZCB0YWlsLCBpbiBjZW50ZXIgdW5pdC4gV2lsbCBiZSB1c2VkIGZvciB2ZXJsZXQgaW50ZWdyYXRpb24uXG4gICAqL1xuICBwcml2YXRlIF9jdXJyZW50VGFpbCA9IG5ldyBUSFJFRS5WZWN0b3IzKCk7XG5cbiAgLyoqXG4gICAqIFByZXZpb3VzIHBvc2l0aW9uIG9mIGNoaWxkIHRhaWwsIGluIGNlbnRlciB1bml0LiBXaWxsIGJlIHVzZWQgZm9yIHZlcmxldCBpbnRlZ3JhdGlvbi5cbiAgICovXG4gIHByaXZhdGUgX3ByZXZUYWlsID0gbmV3IFRIUkVFLlZlY3RvcjMoKTtcblxuICAvKipcbiAgICogSW5pdGlhbCBheGlzIG9mIHRoZSBib25lLCBpbiBsb2NhbCB1bml0LlxuICAgKi9cbiAgcHJpdmF0ZSBfYm9uZUF4aXMgPSBuZXcgVEhSRUUuVmVjdG9yMygpO1xuXG4gIC8qKlxuICAgKiBMZW5ndGggb2YgdGhlIGJvbmUgaW4gd29ybGQgdW5pdC5cbiAgICogV2lsbCBiZSB1c2VkIGZvciBub3JtYWxpemF0aW9uIGluIHVwZGF0ZSBsb29wLCB3aWxsIGJlIHVwZGF0ZWQgYnkge0BsaW5rIF9jYWxjV29ybGRTcGFjZUJvbmVMZW5ndGh9LlxuICAgKlxuICAgKiBJdCdzIHNhbWUgYXMgbG9jYWwgdW5pdCBsZW5ndGggdW5sZXNzIHRoZXJlIGFyZSBzY2FsZSB0cmFuc2Zvcm1hdGlvbnMgaW4gdGhlIHdvcmxkIHNwYWNlLlxuICAgKi9cbiAgcHJpdmF0ZSBfd29ybGRTcGFjZUJvbmVMZW5ndGggPSAwLjA7XG5cbiAgLyoqXG4gICAqIFRoaXMgc3ByaW5nYm9uZSB3aWxsIGJlIGNhbGN1bGF0ZWQgYmFzZWQgb24gdGhlIHNwYWNlIHJlbGF0aXZlIGZyb20gdGhpcyBvYmplY3QuXG4gICAqIElmIHRoaXMgaXMgYG51bGxgLCBzcHJpbmdib25lIHdpbGwgYmUgY2FsY3VsYXRlZCBpbiB3b3JsZCBzcGFjZS5cbiAgICovXG4gIHByaXZhdGUgX2NlbnRlcjogVEhSRUUuT2JqZWN0M0QgfCBudWxsID0gbnVsbDtcbiAgcHVibGljIGdldCBjZW50ZXIoKTogVEhSRUUuT2JqZWN0M0QgfCBudWxsIHtcbiAgICByZXR1cm4gdGhpcy5fY2VudGVyO1xuICB9XG4gIHB1YmxpYyBzZXQgY2VudGVyKGNlbnRlcjogVEhSRUUuT2JqZWN0M0QgfCBudWxsKSB7XG4gICAgLy8gdW5pbnN0YWxsIGludmVyc2UgY2FjaGVcbiAgICBpZiAodGhpcy5fY2VudGVyPy51c2VyRGF0YS5pbnZlcnNlQ2FjaGVQcm94eSkge1xuICAgICAgKHRoaXMuX2NlbnRlci51c2VyRGF0YS5pbnZlcnNlQ2FjaGVQcm94eSBhcyBNYXRyaXg0SW52ZXJzZUNhY2hlKS5yZXZlcnQoKTtcbiAgICAgIGRlbGV0ZSB0aGlzLl9jZW50ZXIudXNlckRhdGEuaW52ZXJzZUNhY2hlUHJveHk7XG4gICAgfVxuXG4gICAgLy8gY2hhbmdlIHRoZSBjZW50ZXJcbiAgICB0aGlzLl9jZW50ZXIgPSBjZW50ZXI7XG5cbiAgICAvLyBpbnN0YWxsIGludmVyc2UgY2FjaGVcbiAgICBpZiAodGhpcy5fY2VudGVyKSB7XG4gICAgICBpZiAoIXRoaXMuX2NlbnRlci51c2VyRGF0YS5pbnZlcnNlQ2FjaGVQcm94eSkge1xuICAgICAgICB0aGlzLl9jZW50ZXIudXNlckRhdGEuaW52ZXJzZUNhY2hlUHJveHkgPSBuZXcgTWF0cml4NEludmVyc2VDYWNoZSh0aGlzLl9jZW50ZXIubWF0cml4V29ybGQpO1xuICAgICAgfVxuICAgIH1cbiAgfVxuXG4gIC8qKlxuICAgKiBJbml0aWFsIHN0YXRlIG9mIHRoZSBsb2NhbCBtYXRyaXggb2YgdGhlIGJvbmUuXG4gICAqL1xuICBwcml2YXRlIF9pbml0aWFsTG9jYWxNYXRyaXggPSBuZXcgVEhSRUUuTWF0cml4NCgpO1xuXG4gIC8qKlxuICAgKiBJbml0aWFsIHN0YXRlIG9mIHRoZSByb3RhdGlvbiBvZiB0aGUgYm9uZS5cbiAgICovXG4gIHByaXZhdGUgX2luaXRpYWxMb2NhbFJvdGF0aW9uID0gbmV3IFRIUkVFLlF1YXRlcm5pb24oKTtcblxuICAvKipcbiAgICogSW5pdGlhbCBzdGF0ZSBvZiB0aGUgcG9zaXRpb24gb2YgaXRzIGNoaWxkLlxuICAgKi9cbiAgcHJpdmF0ZSBfaW5pdGlhbExvY2FsQ2hpbGRQb3NpdGlvbiA9IG5ldyBUSFJFRS5WZWN0b3IzKCk7XG4gIHB1YmxpYyBnZXQgaW5pdGlhbExvY2FsQ2hpbGRQb3NpdGlvbigpOiBUSFJFRS5WZWN0b3IzIHtcbiAgICByZXR1cm4gdGhpcy5faW5pdGlhbExvY2FsQ2hpbGRQb3NpdGlvbjtcbiAgfVxuXG4gIC8qKlxuICAgKiBSZXR1cm5zIHRoZSB3b3JsZCBtYXRyaXggb2YgaXRzIHBhcmVudCBvYmplY3QuXG4gICAqIE5vdGUgdGhhdCBpdCByZXR1cm5zIGEgcmVmZXJlbmNlIHRvIHRoZSBtYXRyaXguIERvbid0IG11dGF0ZSB0aGlzIGRpcmVjdGx5IVxuICAgKi9cbiAgcHJpdmF0ZSBnZXQgX3BhcmVudE1hdHJpeFdvcmxkKCk6IFRIUkVFLk1hdHJpeDQge1xuICAgIHJldHVybiB0aGlzLmJvbmUucGFyZW50ID8gdGhpcy5ib25lLnBhcmVudC5tYXRyaXhXb3JsZCA6IElERU5USVRZX01BVFJJWDQ7XG4gIH1cblxuICAvKipcbiAgICogQ3JlYXRlIGEgbmV3IFZSTVNwcmluZ0JvbmUuXG4gICAqXG4gICAqIEBwYXJhbSBib25lIEFuIE9iamVjdDNEIHRoYXQgd2lsbCBiZSBhdHRhY2hlZCB0byB0aGlzIGJvbmVcbiAgICogQHBhcmFtIGNoaWxkIEFuIE9iamVjdDNEIHRoYXQgd2lsbCBiZSB1c2VkIGFzIGEgdGFpbCBvZiB0aGlzIHNwcmluZyBib25lLiBJdCBjYW4gYmUgbnVsbCB3aGVuIHRoZSBzcHJpbmcgYm9uZSBpcyBpbXBvcnRlZCBmcm9tIFZSTSAwLjBcbiAgICogQHBhcmFtIHNldHRpbmdzIFNldmVyYWwgcGFyYW1ldGVycyByZWxhdGVkIHRvIGJlaGF2aW9yIG9mIHRoZSBzcHJpbmcgYm9uZVxuICAgKiBAcGFyYW0gY29sbGlkZXJHcm91cHMgQ29sbGlkZXIgZ3JvdXBzIHRoYXQgd2lsbCBiZSBjb2xsaWRlZCB3aXRoIHRoaXMgc3ByaW5nIGJvbmVcbiAgICovXG4gIGNvbnN0cnVjdG9yKFxuICAgIGJvbmU6IFRIUkVFLk9iamVjdDNELFxuICAgIGNoaWxkOiBUSFJFRS5PYmplY3QzRCB8IG51bGwsXG4gICAgc2V0dGluZ3M6IFBhcnRpYWw8VlJNU3ByaW5nQm9uZUpvaW50U2V0dGluZ3M+ID0ge30sXG4gICAgY29sbGlkZXJHcm91cHM6IFZSTVNwcmluZ0JvbmVDb2xsaWRlckdyb3VwW10gPSBbXSxcbiAgKSB7XG4gICAgdGhpcy5ib25lID0gYm9uZTsgLy8gdW5pVlJNXHUzMDY3XHUzMDZFIHBhcmVudFxuICAgIHRoaXMuYm9uZS5tYXRyaXhBdXRvVXBkYXRlID0gZmFsc2U7IC8vIHVwZGF0ZVx1MzA2Qlx1MzA4OFx1MzA4QVx1OEEwOFx1N0I5N1x1MzA1NVx1MzA4Q1x1MzA4Qlx1MzA2RVx1MzA2N3RocmVlLmpzXHU1MTg1XHUzMDY3XHUzMDZFXHU4MUVBXHU1MkQ1XHU1MUU2XHU3NDA2XHUzMDZGXHU0RTBEXHU4OTgxXG5cbiAgICB0aGlzLmNoaWxkID0gY2hpbGQ7XG5cbiAgICB0aGlzLnNldHRpbmdzID0ge1xuICAgICAgaGl0UmFkaXVzOiBzZXR0aW5ncy5oaXRSYWRpdXMgPz8gMC4wLFxuICAgICAgc3RpZmZuZXNzOiBzZXR0aW5ncy5zdGlmZm5lc3MgPz8gMS4wLFxuICAgICAgZ3Jhdml0eVBvd2VyOiBzZXR0aW5ncy5ncmF2aXR5UG93ZXIgPz8gMC4wLFxuICAgICAgZ3Jhdml0eURpcjogc2V0dGluZ3MuZ3Jhdml0eURpcj8uY2xvbmUoKSA/PyBuZXcgVEhSRUUuVmVjdG9yMygwLjAsIC0xLjAsIDAuMCksXG4gICAgICBkcmFnRm9yY2U6IHNldHRpbmdzLmRyYWdGb3JjZSA/PyAwLjQsXG4gICAgfTtcblxuICAgIHRoaXMuY29sbGlkZXJHcm91cHMgPSBjb2xsaWRlckdyb3VwcztcbiAgfVxuXG4gIC8qKlxuICAgKiBTZXQgdGhlIGluaXRpYWwgc3RhdGUgb2YgdGhpcyBzcHJpbmcgYm9uZS5cbiAgICogWW91IG1pZ2h0IHdhbnQgdG8gY2FsbCB7QGxpbmsgVlJNU3ByaW5nQm9uZU1hbmFnZXIuc2V0SW5pdFN0YXRlfSBpbnN0ZWFkLlxuICAgKi9cbiAgcHVibGljIHNldEluaXRTdGF0ZSgpOiB2b2lkIHtcbiAgICAvLyByZW1lbWJlciBpbml0aWFsIHBvc2l0aW9uIG9mIGl0c2VsZlxuICAgIHRoaXMuX2luaXRpYWxMb2NhbE1hdHJpeC5jb3B5KHRoaXMuYm9uZS5tYXRyaXgpO1xuICAgIHRoaXMuX2luaXRpYWxMb2NhbFJvdGF0aW9uLmNvcHkodGhpcy5ib25lLnF1YXRlcm5pb24pO1xuXG4gICAgLy8gc2VlIGluaXRpYWwgcG9zaXRpb24gb2YgaXRzIGxvY2FsIGNoaWxkXG4gICAgaWYgKHRoaXMuY2hpbGQpIHtcbiAgICAgIHRoaXMuX2luaXRpYWxMb2NhbENoaWxkUG9zaXRpb24uY29weSh0aGlzLmNoaWxkLnBvc2l0aW9uKTtcbiAgICB9IGVsc2Uge1xuICAgICAgLy8gdnJtMCByZXF1aXJlcyBhIDdjbSBmaXhlZCBib25lIGxlbmd0aCBmb3IgdGhlIGZpbmFsIG5vZGUgaW4gYSBjaGFpblxuICAgICAgLy8gU2VlOiBodHRwczovL2dpdGh1Yi5jb20vdnJtLWMvdnJtLXNwZWNpZmljYXRpb24vdHJlZS9tYXN0ZXIvc3BlY2lmaWNhdGlvbi9WUk1DX3NwcmluZ0JvbmUtMS4wI2Fib3V0LXNwcmluZy1jb25maWd1cmF0aW9uXG4gICAgICB0aGlzLl9pbml0aWFsTG9jYWxDaGlsZFBvc2l0aW9uLmNvcHkodGhpcy5ib25lLnBvc2l0aW9uKS5ub3JtYWxpemUoKS5tdWx0aXBseVNjYWxhcigwLjA3KTtcbiAgICB9XG5cbiAgICAvLyBjb3B5IHRoZSBjaGlsZCBwb3NpdGlvbiB0byB0YWlsc1xuICAgIGNvbnN0IG1hdHJpeFdvcmxkVG9DZW50ZXIgPSB0aGlzLl9nZXRNYXRyaXhXb3JsZFRvQ2VudGVyKF9tYXRBKTtcbiAgICB0aGlzLmJvbmUubG9jYWxUb1dvcmxkKHRoaXMuX2N1cnJlbnRUYWlsLmNvcHkodGhpcy5faW5pdGlhbExvY2FsQ2hpbGRQb3NpdGlvbikpLmFwcGx5TWF0cml4NChtYXRyaXhXb3JsZFRvQ2VudGVyKTtcbiAgICB0aGlzLl9wcmV2VGFpbC5jb3B5KHRoaXMuX2N1cnJlbnRUYWlsKTtcblxuICAgIC8vIHNldCBpbml0aWFsIHN0YXRlcyB0aGF0IGFyZSByZWxhdGVkIHRvIGxvY2FsIGNoaWxkIHBvc2l0aW9uXG4gICAgdGhpcy5fYm9uZUF4aXMuY29weSh0aGlzLl9pbml0aWFsTG9jYWxDaGlsZFBvc2l0aW9uKS5ub3JtYWxpemUoKTtcbiAgfVxuXG4gIC8qKlxuICAgKiBSZXNldCB0aGUgc3RhdGUgb2YgdGhpcyBib25lLlxuICAgKiBZb3UgbWlnaHQgd2FudCB0byBjYWxsIFtbVlJNU3ByaW5nQm9uZU1hbmFnZXIucmVzZXRdXSBpbnN0ZWFkLlxuICAgKi9cbiAgcHVibGljIHJlc2V0KCk6IHZvaWQge1xuICAgIHRoaXMuYm9uZS5xdWF0ZXJuaW9uLmNvcHkodGhpcy5faW5pdGlhbExvY2FsUm90YXRpb24pO1xuXG4gICAgLy8gV2UgbmVlZCB0byB1cGRhdGUgaXRzIG1hdHJpeFdvcmxkIG1hbnVhbGx5LCBzaW5jZSB3ZSB0d2Vha2VkIHRoZSBib25lIGJ5IG91ciBoYW5kXG4gICAgdGhpcy5ib25lLnVwZGF0ZU1hdHJpeCgpO1xuICAgIHRoaXMuYm9uZS5tYXRyaXhXb3JsZC5tdWx0aXBseU1hdHJpY2VzKHRoaXMuX3BhcmVudE1hdHJpeFdvcmxkLCB0aGlzLmJvbmUubWF0cml4KTtcblxuICAgIC8vIEFwcGx5IHVwZGF0ZWQgcG9zaXRpb24gdG8gdGFpbCBzdGF0ZXNcbiAgICBjb25zdCBtYXRyaXhXb3JsZFRvQ2VudGVyID0gdGhpcy5fZ2V0TWF0cml4V29ybGRUb0NlbnRlcihfbWF0QSk7XG4gICAgdGhpcy5ib25lLmxvY2FsVG9Xb3JsZCh0aGlzLl9jdXJyZW50VGFpbC5jb3B5KHRoaXMuX2luaXRpYWxMb2NhbENoaWxkUG9zaXRpb24pKS5hcHBseU1hdHJpeDQobWF0cml4V29ybGRUb0NlbnRlcik7XG4gICAgdGhpcy5fcHJldlRhaWwuY29weSh0aGlzLl9jdXJyZW50VGFpbCk7XG4gIH1cblxuICAvKipcbiAgICogVXBkYXRlIHRoZSBzdGF0ZSBvZiB0aGlzIGJvbmUuXG4gICAqIFlvdSBtaWdodCB3YW50IHRvIGNhbGwgW1tWUk1TcHJpbmdCb25lTWFuYWdlci51cGRhdGVdXSBpbnN0ZWFkLlxuICAgKlxuICAgKiBAcGFyYW0gZGVsdGEgZGVsdGFUaW1lXG4gICAqL1xuICBwdWJsaWMgdXBkYXRlKGRlbHRhOiBudW1iZXIpOiB2b2lkIHtcbiAgICBpZiAoZGVsdGEgPD0gMCkgcmV0dXJuO1xuXG4gICAgLy8gVXBkYXRlIHRoZSBfd29ybGRTcGFjZUJvbmVMZW5ndGhcbiAgICB0aGlzLl9jYWxjV29ybGRTcGFjZUJvbmVMZW5ndGgoKTtcblxuICAgIC8vIEdldCBib25lIHBvc2l0aW9uIGluIGNlbnRlciBzcGFjZVxuICAgIF93b3JsZFNwYWNlUG9zaXRpb24uc2V0RnJvbU1hdHJpeFBvc2l0aW9uKHRoaXMuYm9uZS5tYXRyaXhXb3JsZCk7XG4gICAgbGV0IG1hdHJpeFdvcmxkVG9DZW50ZXIgPSB0aGlzLl9nZXRNYXRyaXhXb3JsZFRvQ2VudGVyKF9tYXRBKTtcbiAgICBfY2VudGVyU3BhY2VQb3NpdGlvbi5jb3B5KF93b3JsZFNwYWNlUG9zaXRpb24pLmFwcGx5TWF0cml4NChtYXRyaXhXb3JsZFRvQ2VudGVyKTtcbiAgICBjb25zdCBxdWF0V29ybGRUb0NlbnRlciA9IF9xdWF0QS5zZXRGcm9tUm90YXRpb25NYXRyaXgobWF0cml4V29ybGRUb0NlbnRlcik7XG5cbiAgICAvLyBHZXQgcGFyZW50IG1hdHJpeCBpbiBjZW50ZXIgc3BhY2VcbiAgICBjb25zdCBjZW50ZXJTcGFjZVBhcmVudE1hdHJpeCA9IF9tYXRCLmNvcHkobWF0cml4V29ybGRUb0NlbnRlcikubXVsdGlwbHkodGhpcy5fcGFyZW50TWF0cml4V29ybGQpO1xuXG4gICAgLy8gR2V0IGJvbmVBeGlzIGluIGNlbnRlciBzcGFjZVxuICAgIGNvbnN0IGNlbnRlclNwYWNlQm9uZUF4aXMgPSBfdjNCXG4gICAgICAuY29weSh0aGlzLl9ib25lQXhpcylcbiAgICAgIC5hcHBseU1hdHJpeDQodGhpcy5faW5pdGlhbExvY2FsTWF0cml4KVxuICAgICAgLmFwcGx5TWF0cml4NChjZW50ZXJTcGFjZVBhcmVudE1hdHJpeClcbiAgICAgIC5zdWIoX2NlbnRlclNwYWNlUG9zaXRpb24pXG4gICAgICAubm9ybWFsaXplKCk7XG5cbiAgICAvLyBncmF2aXR5IGluIGNlbnRlciBzcGFjZVxuICAgIGNvbnN0IGNlbnRlclNwYWNlR3Jhdml0eSA9IF92M0MuY29weSh0aGlzLnNldHRpbmdzLmdyYXZpdHlEaXIpLmFwcGx5UXVhdGVybmlvbihxdWF0V29ybGRUb0NlbnRlcikubm9ybWFsaXplKCk7XG5cbiAgICBjb25zdCBtYXRyaXhDZW50ZXJUb1dvcmxkID0gdGhpcy5fZ2V0TWF0cml4Q2VudGVyVG9Xb3JsZChfbWF0QSk7XG5cbiAgICAvLyB2ZXJsZXRcdTdBNERcdTUyMDZcdTMwNjdcdTZCMjFcdTMwNkVcdTRGNERcdTdGNkVcdTMwOTJcdThBMDhcdTdCOTdcbiAgICBfbmV4dFRhaWxcbiAgICAgIC5jb3B5KHRoaXMuX2N1cnJlbnRUYWlsKVxuICAgICAgLmFkZChcbiAgICAgICAgX3YzQVxuICAgICAgICAgIC5jb3B5KHRoaXMuX2N1cnJlbnRUYWlsKVxuICAgICAgICAgIC5zdWIodGhpcy5fcHJldlRhaWwpXG4gICAgICAgICAgLm11bHRpcGx5U2NhbGFyKDEgLSB0aGlzLnNldHRpbmdzLmRyYWdGb3JjZSksXG4gICAgICApIC8vIFx1NTI0RFx1MzBENVx1MzBFQ1x1MzBGQ1x1MzBFMFx1MzA2RVx1NzlGQlx1NTJENVx1MzA5Mlx1N0Q5OVx1N0Q5QVx1MzA1OVx1MzA4QihcdTZFMUJcdTg4NzBcdTMwODJcdTMwNDJcdTMwOEJcdTMwODgpXG4gICAgICAuYWRkKF92M0EuY29weShjZW50ZXJTcGFjZUJvbmVBeGlzKS5tdWx0aXBseVNjYWxhcih0aGlzLnNldHRpbmdzLnN0aWZmbmVzcyAqIGRlbHRhKSkgLy8gXHU4OUFBXHUzMDZFXHU1NkRFXHU4RUUyXHUzMDZCXHUzMDg4XHUzMDhCXHU1QjUwXHUzMERDXHUzMEZDXHUzMEYzXHUzMDZFXHU3OUZCXHU1MkQ1XHU3NkVFXHU2QTE5XG4gICAgICAuYWRkKF92M0EuY29weShjZW50ZXJTcGFjZUdyYXZpdHkpLm11bHRpcGx5U2NhbGFyKHRoaXMuc2V0dGluZ3MuZ3Jhdml0eVBvd2VyICogZGVsdGEpKSAvLyBcdTU5MTZcdTUyOUJcdTMwNkJcdTMwODhcdTMwOEJcdTc5RkJcdTUyRDVcdTkxQ0ZcbiAgICAgIC5hcHBseU1hdHJpeDQobWF0cml4Q2VudGVyVG9Xb3JsZCk7IC8vIHRhaWxcdTMwOTJ3b3JsZCBzcGFjZVx1MzA2Qlx1NjIzQlx1MzA1OVxuXG4gICAgLy8gbm9ybWFsaXplIGJvbmUgbGVuZ3RoXG4gICAgX25leHRUYWlsLnN1Yihfd29ybGRTcGFjZVBvc2l0aW9uKS5ub3JtYWxpemUoKS5tdWx0aXBseVNjYWxhcih0aGlzLl93b3JsZFNwYWNlQm9uZUxlbmd0aCkuYWRkKF93b3JsZFNwYWNlUG9zaXRpb24pO1xuXG4gICAgLy8gQ29sbGlzaW9uXHUzMDY3XHU3OUZCXHU1MkQ1XG4gICAgdGhpcy5fY29sbGlzaW9uKF9uZXh0VGFpbCk7XG5cbiAgICAvLyB1cGRhdGUgcHJldlRhaWwgYW5kIGN1cnJlbnRUYWlsXG4gICAgbWF0cml4V29ybGRUb0NlbnRlciA9IHRoaXMuX2dldE1hdHJpeFdvcmxkVG9DZW50ZXIoX21hdEEpO1xuXG4gICAgdGhpcy5fcHJldlRhaWwuY29weSh0aGlzLl9jdXJyZW50VGFpbCk7XG4gICAgdGhpcy5fY3VycmVudFRhaWwuY29weShfdjNBLmNvcHkoX25leHRUYWlsKS5hcHBseU1hdHJpeDQobWF0cml4V29ybGRUb0NlbnRlcikpO1xuXG4gICAgLy8gQXBwbHkgcm90YXRpb24sIGNvbnZlcnQgdmVjdG9yMyB0aGluZyBpbnRvIGFjdHVhbCBxdWF0ZXJuaW9uXG4gICAgLy8gT3JpZ2luYWwgVW5pVlJNIGlzIGRvaW5nIGNlbnRlciB1bml0IGNhbGN1bHVzIGF0IGhlcmUgYnV0IHdlJ3JlIGdvbm5hIGRvIHRoaXMgb24gbG9jYWwgdW5pdFxuICAgIGNvbnN0IHdvcmxkU3BhY2VJbml0aWFsTWF0cml4SW52ID0gbWF0NEludmVydENvbXBhdChcbiAgICAgIF9tYXRBLmNvcHkodGhpcy5fcGFyZW50TWF0cml4V29ybGQpLm11bHRpcGx5KHRoaXMuX2luaXRpYWxMb2NhbE1hdHJpeCksXG4gICAgKTtcbiAgICBjb25zdCBhcHBseVJvdGF0aW9uID0gX3F1YXRBLnNldEZyb21Vbml0VmVjdG9ycyhcbiAgICAgIHRoaXMuX2JvbmVBeGlzLFxuICAgICAgX3YzQS5jb3B5KF9uZXh0VGFpbCkuYXBwbHlNYXRyaXg0KHdvcmxkU3BhY2VJbml0aWFsTWF0cml4SW52KS5ub3JtYWxpemUoKSxcbiAgICApO1xuXG4gICAgdGhpcy5ib25lLnF1YXRlcm5pb24uY29weSh0aGlzLl9pbml0aWFsTG9jYWxSb3RhdGlvbikubXVsdGlwbHkoYXBwbHlSb3RhdGlvbik7XG5cbiAgICAvLyBXZSBuZWVkIHRvIHVwZGF0ZSBpdHMgbWF0cml4V29ybGQgbWFudWFsbHksIHNpbmNlIHdlIHR3ZWFrZWQgdGhlIGJvbmUgYnkgb3VyIGhhbmRcbiAgICB0aGlzLmJvbmUudXBkYXRlTWF0cml4KCk7XG4gICAgdGhpcy5ib25lLm1hdHJpeFdvcmxkLm11bHRpcGx5TWF0cmljZXModGhpcy5fcGFyZW50TWF0cml4V29ybGQsIHRoaXMuYm9uZS5tYXRyaXgpO1xuICB9XG5cbiAgLyoqXG4gICAqIERvIGNvbGxpc2lvbiBtYXRoIGFnYWluc3QgZXZlcnkgY29sbGlkZXJzIGF0dGFjaGVkIHRvIHRoaXMgYm9uZS5cbiAgICpcbiAgICogQHBhcmFtIHRhaWwgVGhlIHRhaWwgeW91IHdhbnQgdG8gcHJvY2Vzc1xuICAgKi9cbiAgcHJpdmF0ZSBfY29sbGlzaW9uKHRhaWw6IFRIUkVFLlZlY3RvcjMpOiB2b2lkIHtcbiAgICB0aGlzLmNvbGxpZGVyR3JvdXBzLmZvckVhY2goKGNvbGxpZGVyR3JvdXApID0+IHtcbiAgICAgIGNvbGxpZGVyR3JvdXAuY29sbGlkZXJzLmZvckVhY2goKGNvbGxpZGVyKSA9PiB7XG4gICAgICAgIGNvbnN0IGRpc3QgPSBjb2xsaWRlci5zaGFwZS5jYWxjdWxhdGVDb2xsaXNpb24oY29sbGlkZXIubWF0cml4V29ybGQsIHRhaWwsIHRoaXMuc2V0dGluZ3MuaGl0UmFkaXVzLCBfdjNBKTtcblxuICAgICAgICBpZiAoZGlzdCA8IDAuMCkge1xuICAgICAgICAgIC8vIGhpdFxuICAgICAgICAgIHRhaWwuYWRkKF92M0EubXVsdGlwbHlTY2FsYXIoLWRpc3QpKTtcblxuICAgICAgICAgIC8vIG5vcm1hbGl6ZSBib25lIGxlbmd0aFxuICAgICAgICAgIHRhaWwuc3ViKF93b3JsZFNwYWNlUG9zaXRpb24pLm5vcm1hbGl6ZSgpLm11bHRpcGx5U2NhbGFyKHRoaXMuX3dvcmxkU3BhY2VCb25lTGVuZ3RoKS5hZGQoX3dvcmxkU3BhY2VQb3NpdGlvbik7XG4gICAgICAgIH1cbiAgICAgIH0pO1xuICAgIH0pO1xuICB9XG5cbiAgLyoqXG4gICAqIENhbGN1bGF0ZSB0aGUge0BsaW5rIF93b3JsZFNwYWNlQm9uZUxlbmd0aH0uXG4gICAqIEludGVuZGVkIHRvIGJlIHVzZWQgaW4ge0BsaW5rIHVwZGF0ZX0uXG4gICAqL1xuICBwcml2YXRlIF9jYWxjV29ybGRTcGFjZUJvbmVMZW5ndGgoKTogdm9pZCB7XG4gICAgX3YzQS5zZXRGcm9tTWF0cml4UG9zaXRpb24odGhpcy5ib25lLm1hdHJpeFdvcmxkKTsgLy8gZ2V0IHdvcmxkIHBvc2l0aW9uIG9mIHRoaXMuYm9uZVxuXG4gICAgaWYgKHRoaXMuY2hpbGQpIHtcbiAgICAgIF92M0Iuc2V0RnJvbU1hdHJpeFBvc2l0aW9uKHRoaXMuY2hpbGQubWF0cml4V29ybGQpOyAvLyBnZXQgd29ybGQgcG9zaXRpb24gb2YgdGhpcy5jaGlsZFxuICAgIH0gZWxzZSB7XG4gICAgICBfdjNCLmNvcHkodGhpcy5faW5pdGlhbExvY2FsQ2hpbGRQb3NpdGlvbik7XG4gICAgICBfdjNCLmFwcGx5TWF0cml4NCh0aGlzLmJvbmUubWF0cml4V29ybGQpO1xuICAgIH1cblxuICAgIHRoaXMuX3dvcmxkU3BhY2VCb25lTGVuZ3RoID0gX3YzQS5zdWIoX3YzQikubGVuZ3RoKCk7XG4gIH1cblxuICAvKipcbiAgICogQ3JlYXRlIGEgbWF0cml4IHRoYXQgY29udmVydHMgY2VudGVyIHNwYWNlIGludG8gd29ybGQgc3BhY2UuXG4gICAqIEBwYXJhbSB0YXJnZXQgVGFyZ2V0IG1hdHJpeFxuICAgKi9cbiAgcHJpdmF0ZSBfZ2V0TWF0cml4Q2VudGVyVG9Xb3JsZCh0YXJnZXQ6IFRIUkVFLk1hdHJpeDQpOiBUSFJFRS5NYXRyaXg0IHtcbiAgICBpZiAodGhpcy5fY2VudGVyKSB7XG4gICAgICB0YXJnZXQuY29weSh0aGlzLl9jZW50ZXIubWF0cml4V29ybGQpO1xuICAgIH0gZWxzZSB7XG4gICAgICB0YXJnZXQuaWRlbnRpdHkoKTtcbiAgICB9XG5cbiAgICByZXR1cm4gdGFyZ2V0O1xuICB9XG5cbiAgLyoqXG4gICAqIENyZWF0ZSBhIG1hdHJpeCB0aGF0IGNvbnZlcnRzIHdvcmxkIHNwYWNlIGludG8gY2VudGVyIHNwYWNlLlxuICAgKiBAcGFyYW0gdGFyZ2V0IFRhcmdldCBtYXRyaXhcbiAgICovXG4gIHByaXZhdGUgX2dldE1hdHJpeFdvcmxkVG9DZW50ZXIodGFyZ2V0OiBUSFJFRS5NYXRyaXg0KTogVEhSRUUuTWF0cml4NCB7XG4gICAgaWYgKHRoaXMuX2NlbnRlcikge1xuICAgICAgdGFyZ2V0LmNvcHkoKHRoaXMuX2NlbnRlci51c2VyRGF0YS5pbnZlcnNlQ2FjaGVQcm94eSBhcyBNYXRyaXg0SW52ZXJzZUNhY2hlKS5pbnZlcnNlKTtcbiAgICB9IGVsc2Uge1xuICAgICAgdGFyZ2V0LmlkZW50aXR5KCk7XG4gICAgfVxuXG4gICAgcmV0dXJuIHRhcmdldDtcbiAgfVxufVxuIiwgImltcG9ydCAqIGFzIFRIUkVFIGZyb20gJ3RocmVlJztcblxuY29uc3QgX21hdEEgPSBuZXcgVEhSRUUuTWF0cml4NCgpO1xuXG4vKipcbiAqIEEgY29tcGF0IGZ1bmN0aW9uIGZvciBgTWF0cml4NC5pbnZlcnQoKWAgLyBgTWF0cml4NC5nZXRJbnZlcnNlKClgLlxuICogYE1hdHJpeDQuaW52ZXJ0KClgIGlzIGludHJvZHVjZWQgaW4gcjEyMyBhbmQgYE1hdHJpeDQuZ2V0SW52ZXJzZSgpYCBlbWl0cyBhIHdhcm5pbmcuXG4gKiBXZSBhcmUgZ29pbmcgdG8gdXNlIHRoaXMgY29tcGF0IGZvciBhIHdoaWxlLlxuICogQHBhcmFtIHRhcmdldCBBIHRhcmdldCBtYXRyaXhcbiAqL1xuZXhwb3J0IGZ1bmN0aW9uIG1hdDRJbnZlcnRDb21wYXQ8VCBleHRlbmRzIFRIUkVFLk1hdHJpeDQ+KHRhcmdldDogVCk6IFQge1xuICBpZiAoKHRhcmdldCBhcyBhbnkpLmludmVydCkge1xuICAgIHRhcmdldC5pbnZlcnQoKTtcbiAgfSBlbHNlIHtcbiAgICAodGFyZ2V0IGFzIGFueSkuZ2V0SW52ZXJzZShfbWF0QS5jb3B5KHRhcmdldCkpO1xuICB9XG5cbiAgcmV0dXJuIHRhcmdldDtcbn1cbiIsICJpbXBvcnQgKiBhcyBUSFJFRSBmcm9tICd0aHJlZSc7XG5pbXBvcnQgeyBtYXQ0SW52ZXJ0Q29tcGF0IH0gZnJvbSAnLi9tYXQ0SW52ZXJ0Q29tcGF0JztcblxuZXhwb3J0IGNsYXNzIE1hdHJpeDRJbnZlcnNlQ2FjaGUge1xuICAvKipcbiAgICogVGhlIHRhcmdldCBtYXRyaXguXG4gICAqL1xuICBwdWJsaWMgcmVhZG9ubHkgbWF0cml4OiBUSFJFRS5NYXRyaXg0O1xuXG4gIC8qKlxuICAgKiBBIGNhY2hlIG9mIGludmVyc2Ugb2YgY3VycmVudCBtYXRyaXguXG4gICAqL1xuICBwcml2YXRlIHJlYWRvbmx5IF9pbnZlcnNlQ2FjaGUgPSBuZXcgVEhSRUUuTWF0cml4NCgpO1xuXG4gIC8qKlxuICAgKiBBIGZsYWcgdGhhdCBtYWtlcyBpdCB3YW50IHRvIHJlY2FsY3VsYXRlIGl0cyB7QGxpbmsgX2ludmVyc2VDYWNoZX0uXG4gICAqIFdpbGwgYmUgc2V0IGB0cnVlYCB3aGVuIGBlbGVtZW50c2AgYXJlIG11dGF0ZWQgYW5kIGJlIHVzZWQgaW4gYGdldEludmVyc2VgLlxuICAgKi9cbiAgcHJpdmF0ZSBfc2hvdWxkVXBkYXRlSW52ZXJzZSA9IHRydWU7XG5cbiAgLyoqXG4gICAqIFRoZSBvcmlnaW5hbCBvZiBgbWF0cml4LmVsZW1lbnRzYFxuICAgKi9cbiAgcHJpdmF0ZSByZWFkb25seSBfb3JpZ2luYWxFbGVtZW50czogVEhSRUUuTWF0cml4NFR1cGxlO1xuXG4gIC8qKlxuICAgKiBJbnZlcnNlIG9mIGdpdmVuIG1hdHJpeC5cbiAgICogTm90ZSB0aGF0IGl0IHdpbGwgcmV0dXJuIGl0cyBpbnRlcm5hbCBwcml2YXRlIGluc3RhbmNlLlxuICAgKiBNYWtlIHN1cmUgY29weWluZyB0aGlzIGJlZm9yZSBtdXRhdGUgdGhpcy5cbiAgICovXG4gIHB1YmxpYyBnZXQgaW52ZXJzZSgpOiBUSFJFRS5NYXRyaXg0IHtcbiAgICBpZiAodGhpcy5fc2hvdWxkVXBkYXRlSW52ZXJzZSkge1xuICAgICAgbWF0NEludmVydENvbXBhdCh0aGlzLl9pbnZlcnNlQ2FjaGUuY29weSh0aGlzLm1hdHJpeCkpO1xuICAgICAgdGhpcy5fc2hvdWxkVXBkYXRlSW52ZXJzZSA9IGZhbHNlO1xuICAgIH1cblxuICAgIHJldHVybiB0aGlzLl9pbnZlcnNlQ2FjaGU7XG4gIH1cblxuICBwdWJsaWMgY29uc3RydWN0b3IobWF0cml4OiBUSFJFRS5NYXRyaXg0KSB7XG4gICAgdGhpcy5tYXRyaXggPSBtYXRyaXg7XG5cbiAgICBjb25zdCBoYW5kbGVyOiBQcm94eUhhbmRsZXI8bnVtYmVyW10+ID0ge1xuICAgICAgc2V0OiAob2JqLCBwcm9wOiBhbnksIG5ld1ZhbCkgPT4ge1xuICAgICAgICB0aGlzLl9zaG91bGRVcGRhdGVJbnZlcnNlID0gdHJ1ZTtcbiAgICAgICAgb2JqW3Byb3BdID0gbmV3VmFsO1xuXG4gICAgICAgIHJldHVybiB0cnVlO1xuICAgICAgfSxcbiAgICB9O1xuXG4gICAgdGhpcy5fb3JpZ2luYWxFbGVtZW50cyA9IG1hdHJpeC5lbGVtZW50cztcbiAgICBtYXRyaXguZWxlbWVudHMgPSBuZXcgUHJveHk8VEhSRUUuTWF0cml4NFR1cGxlPihtYXRyaXguZWxlbWVudHMsIGhhbmRsZXIpO1xuICB9XG5cbiAgcHVibGljIHJldmVydCgpOiB2b2lkIHtcbiAgICB0aGlzLm1hdHJpeC5lbGVtZW50cyA9IHRoaXMuX29yaWdpbmFsRWxlbWVudHM7XG4gIH1cbn1cbiIsICJpbXBvcnQgdHlwZSAqIGFzIFYwVlJNIGZyb20gJ0BwaXhpdi90eXBlcy12cm0tMC4wJztcbmltcG9ydCB0eXBlICogYXMgVjFTcHJpbmdCb25lU2NoZW1hIGZyb20gJ0BwaXhpdi90eXBlcy12cm1jLXNwcmluZ2JvbmUtMS4wJztcbmltcG9ydCB0eXBlICogYXMgU3ByaW5nQm9uZUV4dGVuZGVkQ29sbGlkZXJTY2hlbWEgZnJvbSAnQHBpeGl2L3R5cGVzLXZybWMtc3ByaW5nYm9uZS1leHRlbmRlZC1jb2xsaWRlci0xLjAnO1xuaW1wb3J0ICogYXMgVEhSRUUgZnJvbSAndGhyZWUnO1xuaW1wb3J0IHR5cGUgeyBHTFRGLCBHTFRGTG9hZGVyUGx1Z2luLCBHTFRGUGFyc2VyIH0gZnJvbSAndGhyZWUvZXhhbXBsZXMvanNtL2xvYWRlcnMvR0xURkxvYWRlci5qcyc7XG5pbXBvcnQgeyBWUk1TcHJpbmdCb25lQ29sbGlkZXJIZWxwZXIsIFZSTVNwcmluZ0JvbmVKb2ludEhlbHBlciB9IGZyb20gJy4vaGVscGVycyc7XG5pbXBvcnQgeyBWUk1TcHJpbmdCb25lQ29sbGlkZXIgfSBmcm9tICcuL1ZSTVNwcmluZ0JvbmVDb2xsaWRlcic7XG5pbXBvcnQgdHlwZSB7IFZSTVNwcmluZ0JvbmVDb2xsaWRlckdyb3VwIH0gZnJvbSAnLi9WUk1TcHJpbmdCb25lQ29sbGlkZXJHcm91cCc7XG5pbXBvcnQgeyBWUk1TcHJpbmdCb25lQ29sbGlkZXJTaGFwZUNhcHN1bGUgfSBmcm9tICcuL1ZSTVNwcmluZ0JvbmVDb2xsaWRlclNoYXBlQ2Fwc3VsZSc7XG5pbXBvcnQgeyBWUk1TcHJpbmdCb25lQ29sbGlkZXJTaGFwZVNwaGVyZSB9IGZyb20gJy4vVlJNU3ByaW5nQm9uZUNvbGxpZGVyU2hhcGVTcGhlcmUnO1xuaW1wb3J0IHsgVlJNU3ByaW5nQm9uZUpvaW50IH0gZnJvbSAnLi9WUk1TcHJpbmdCb25lSm9pbnQnO1xuaW1wb3J0IHR5cGUgeyBWUk1TcHJpbmdCb25lTG9hZGVyUGx1Z2luT3B0aW9ucyB9IGZyb20gJy4vVlJNU3ByaW5nQm9uZUxvYWRlclBsdWdpbk9wdGlvbnMnO1xuaW1wb3J0IHsgVlJNU3ByaW5nQm9uZU1hbmFnZXIgfSBmcm9tICcuL1ZSTVNwcmluZ0JvbmVNYW5hZ2VyJztcbmltcG9ydCB0eXBlIHsgVlJNU3ByaW5nQm9uZUpvaW50U2V0dGluZ3MgfSBmcm9tICcuL1ZSTVNwcmluZ0JvbmVKb2ludFNldHRpbmdzJztcbmltcG9ydCB7IEdMVEYgYXMgR0xURlNjaGVtYSB9IGZyb20gJ0BnbHRmLXRyYW5zZm9ybS9jb3JlJztcbmltcG9ydCB7IFZSTVNwcmluZ0JvbmVDb2xsaWRlclNoYXBlUGxhbmUgfSBmcm9tICcuL1ZSTVNwcmluZ0JvbmVDb2xsaWRlclNoYXBlUGxhbmUnO1xuXG5jb25zdCBFWFRFTlNJT05fTkFNRV9FWFRFTkRFRF9DT0xMSURFUiA9ICdWUk1DX3NwcmluZ0JvbmVfZXh0ZW5kZWRfY29sbGlkZXInO1xuXG4vKipcbiAqIFBvc3NpYmxlIHNwZWMgdmVyc2lvbnMgaXQgcmVjb2duaXplcy5cbiAqL1xuY29uc3QgUE9TU0lCTEVfU1BFQ19WRVJTSU9OUyA9IG5ldyBTZXQoWycxLjAnLCAnMS4wLWJldGEnXSk7XG5cbi8qKlxuICogUG9zc2libGUgc3BlYyB2ZXJzaW9ucyBvZiBgVlJNQ19zcHJpbmdCb25lX2V4dGVuZGVkX2NvbGxpZGVyYCBpdCByZWNvZ25pemVzLlxuICovXG5jb25zdCBQT1NTSUJMRV9TUEVDX1ZFUlNJT05TX0VYVEVOREVEX0NPTExJREVSUyA9IG5ldyBTZXQoWycxLjAnXSk7XG5cbmV4cG9ydCBjbGFzcyBWUk1TcHJpbmdCb25lTG9hZGVyUGx1Z2luIGltcGxlbWVudHMgR0xURkxvYWRlclBsdWdpbiB7XG4gIHB1YmxpYyBzdGF0aWMgcmVhZG9ubHkgRVhURU5TSU9OX05BTUUgPSAnVlJNQ19zcHJpbmdCb25lJztcblxuICAvKipcbiAgICogU3BlY2lmeSBhbiBPYmplY3QzRCB0byBhZGQge0BsaW5rIFZSTVNwcmluZ0JvbmVKb2ludEhlbHBlcn0gcy5cbiAgICogSWYgbm90IHNwZWNpZmllZCwgaGVscGVyIHdpbGwgbm90IGJlIGNyZWF0ZWQuXG4gICAqIElmIGByZW5kZXJPcmRlcmAgaXMgc2V0IHRvIHRoZSByb290LCBoZWxwZXJzIHdpbGwgY29weSB0aGUgc2FtZSBgcmVuZGVyT3JkZXJgIC5cbiAgICovXG4gIHB1YmxpYyBqb2ludEhlbHBlclJvb3Q/OiBUSFJFRS5PYmplY3QzRDtcblxuICAvKipcbiAgICogU3BlY2lmeSBhbiBPYmplY3QzRCB0byBhZGQge0BsaW5rIFZSTVNwcmluZ0JvbmVKb2ludEhlbHBlcn0gcy5cbiAgICogSWYgbm90IHNwZWNpZmllZCwgaGVscGVyIHdpbGwgbm90IGJlIGNyZWF0ZWQuXG4gICAqIElmIGByZW5kZXJPcmRlcmAgaXMgc2V0IHRvIHRoZSByb290LCBoZWxwZXJzIHdpbGwgY29weSB0aGUgc2FtZSBgcmVuZGVyT3JkZXJgIC5cbiAgICovXG4gIHB1YmxpYyBjb2xsaWRlckhlbHBlclJvb3Q/OiBUSFJFRS5PYmplY3QzRDtcblxuICAvKipcbiAgICogSWYgdHJ1ZSwgbG9hZCBjb2xsaWRlcnMgZGVmaW5lZCBpbiBgVlJNQ19zcHJpbmdCb25lX2V4dGVuZGVkX2NvbGxpZGVyYC5cbiAgICogU2V0IHRvIGBmYWxzZWAgdG8gZGlzYWJsZSBsb2FkaW5nIGV4dGVuZGVkIGNvbGxpZGVycyBhbmQgdXNlIHRoZSBmYWxsYmFjayBiZWhhdmlvci5cbiAgICogYHRydWVgIGJ5IGRlZmF1bHQuXG4gICAqL1xuICBwdWJsaWMgdXNlRXh0ZW5kZWRDb2xsaWRlcnM6IGJvb2xlYW47XG5cbiAgcHVibGljIHJlYWRvbmx5IHBhcnNlcjogR0xURlBhcnNlcjtcblxuICBwdWJsaWMgZ2V0IG5hbWUoKTogc3RyaW5nIHtcbiAgICByZXR1cm4gVlJNU3ByaW5nQm9uZUxvYWRlclBsdWdpbi5FWFRFTlNJT05fTkFNRTtcbiAgfVxuXG4gIHB1YmxpYyBjb25zdHJ1Y3RvcihwYXJzZXI6IEdMVEZQYXJzZXIsIG9wdGlvbnM/OiBWUk1TcHJpbmdCb25lTG9hZGVyUGx1Z2luT3B0aW9ucykge1xuICAgIHRoaXMucGFyc2VyID0gcGFyc2VyO1xuXG4gICAgdGhpcy5qb2ludEhlbHBlclJvb3QgPSBvcHRpb25zPy5qb2ludEhlbHBlclJvb3Q7XG4gICAgdGhpcy5jb2xsaWRlckhlbHBlclJvb3QgPSBvcHRpb25zPy5jb2xsaWRlckhlbHBlclJvb3Q7XG4gICAgdGhpcy51c2VFeHRlbmRlZENvbGxpZGVycyA9IG9wdGlvbnM/LnVzZUV4dGVuZGVkQ29sbGlkZXJzID8/IHRydWU7XG4gIH1cblxuICBwdWJsaWMgYXN5bmMgYWZ0ZXJSb290KGdsdGY6IEdMVEYpOiBQcm9taXNlPHZvaWQ+IHtcbiAgICBnbHRmLnVzZXJEYXRhLnZybVNwcmluZ0JvbmVNYW5hZ2VyID0gYXdhaXQgdGhpcy5faW1wb3J0KGdsdGYpO1xuICB9XG5cbiAgLyoqXG4gICAqIEltcG9ydCBzcHJpbmcgYm9uZXMgZnJvbSBhIEdMVEYgYW5kIHJldHVybiBhIHtAbGluayBWUk1TcHJpbmdCb25lTWFuYWdlcn0uXG4gICAqIEl0IG1pZ2h0IHJldHVybiBgbnVsbGAgaW5zdGVhZCB3aGVuIGl0IGRvZXMgbm90IG5lZWQgdG8gYmUgY3JlYXRlZCBvciBzb21ldGhpbmcgZ28gd3JvbmcuXG4gICAqXG4gICAqIEBwYXJhbSBnbHRmIEEgcGFyc2VkIHJlc3VsdCBvZiBHTFRGIHRha2VuIGZyb20gR0xURkxvYWRlclxuICAgKi9cbiAgcHJpdmF0ZSBhc3luYyBfaW1wb3J0KGdsdGY6IEdMVEYpOiBQcm9taXNlPFZSTVNwcmluZ0JvbmVNYW5hZ2VyIHwgbnVsbD4ge1xuICAgIGNvbnN0IHYxUmVzdWx0ID0gYXdhaXQgdGhpcy5fdjFJbXBvcnQoZ2x0Zik7XG4gICAgaWYgKHYxUmVzdWx0ICE9IG51bGwpIHtcbiAgICAgIHJldHVybiB2MVJlc3VsdDtcbiAgICB9XG5cbiAgICBjb25zdCB2MFJlc3VsdCA9IGF3YWl0IHRoaXMuX3YwSW1wb3J0KGdsdGYpO1xuICAgIGlmICh2MFJlc3VsdCAhPSBudWxsKSB7XG4gICAgICByZXR1cm4gdjBSZXN1bHQ7XG4gICAgfVxuXG4gICAgcmV0dXJuIG51bGw7XG4gIH1cblxuICBwcml2YXRlIGFzeW5jIF92MUltcG9ydChnbHRmOiBHTFRGKTogUHJvbWlzZTxWUk1TcHJpbmdCb25lTWFuYWdlciB8IG51bGw+IHtcbiAgICBjb25zdCBqc29uID0gZ2x0Zi5wYXJzZXIuanNvbiBhcyBHTFRGU2NoZW1hLklHTFRGO1xuXG4gICAgLy8gZWFybHkgYWJvcnQgaWYgaXQgZG9lc24ndCB1c2Ugc3ByaW5nIGJvbmVzXG4gICAgY29uc3QgaXNTcHJpbmdCb25lVXNlZCA9IGpzb24uZXh0ZW5zaW9uc1VzZWQ/LmluZGV4T2YoVlJNU3ByaW5nQm9uZUxvYWRlclBsdWdpbi5FWFRFTlNJT05fTkFNRSkgIT09IC0xO1xuICAgIGlmICghaXNTcHJpbmdCb25lVXNlZCkge1xuICAgICAgcmV0dXJuIG51bGw7XG4gICAgfVxuXG4gICAgY29uc3QgbWFuYWdlciA9IG5ldyBWUk1TcHJpbmdCb25lTWFuYWdlcigpO1xuXG4gICAgY29uc3QgdGhyZWVOb2RlczogVEhSRUUuT2JqZWN0M0RbXSA9IGF3YWl0IGdsdGYucGFyc2VyLmdldERlcGVuZGVuY2llcygnbm9kZScpO1xuXG4gICAgY29uc3QgZXh0ZW5zaW9uID0ganNvbi5leHRlbnNpb25zPy5bVlJNU3ByaW5nQm9uZUxvYWRlclBsdWdpbi5FWFRFTlNJT05fTkFNRV0gYXNcbiAgICAgIHwgVjFTcHJpbmdCb25lU2NoZW1hLlZSTUNTcHJpbmdCb25lXG4gICAgICB8IHVuZGVmaW5lZDtcbiAgICBpZiAoIWV4dGVuc2lvbikge1xuICAgICAgcmV0dXJuIG51bGw7XG4gICAgfVxuXG4gICAgY29uc3Qgc3BlY1ZlcnNpb24gPSBleHRlbnNpb24uc3BlY1ZlcnNpb247XG4gICAgaWYgKCFQT1NTSUJMRV9TUEVDX1ZFUlNJT05TLmhhcyhzcGVjVmVyc2lvbikpIHtcbiAgICAgIGNvbnNvbGUud2FybihcbiAgICAgICAgYFZSTVNwcmluZ0JvbmVMb2FkZXJQbHVnaW46IFVua25vd24gJHtWUk1TcHJpbmdCb25lTG9hZGVyUGx1Z2luLkVYVEVOU0lPTl9OQU1FfSBzcGVjVmVyc2lvbiBcIiR7c3BlY1ZlcnNpb259XCJgLFxuICAgICAgKTtcbiAgICAgIHJldHVybiBudWxsO1xuICAgIH1cblxuICAgIGNvbnN0IGNvbGxpZGVycyA9IGV4dGVuc2lvbi5jb2xsaWRlcnM/Lm1hcCgoc2NoZW1hQ29sbGlkZXIsIGlDb2xsaWRlcikgPT4ge1xuICAgICAgY29uc3Qgbm9kZSA9IHRocmVlTm9kZXNbc2NoZW1hQ29sbGlkZXIubm9kZSFdO1xuICAgICAgY29uc3Qgc2NoZW1hU2hhcGUgPSBzY2hlbWFDb2xsaWRlci5zaGFwZSE7XG5cbiAgICAgIC8vIFRPRE86IHNlcGFyYXRlIGludG8gc2V2ZXJhbCBmdW5jdGlvbnNcblxuICAgICAgY29uc3Qgc2NoZW1hRXhDb2xsaWRlcjogU3ByaW5nQm9uZUV4dGVuZGVkQ29sbGlkZXJTY2hlbWEuVlJNQ1NwcmluZ0JvbmVFeHRlbmRlZENvbGxpZGVyIHwgdW5kZWZpbmVkID1cbiAgICAgICAgc2NoZW1hQ29sbGlkZXIuZXh0ZW5zaW9ucz8uW0VYVEVOU0lPTl9OQU1FX0VYVEVOREVEX0NPTExJREVSXTtcblxuICAgICAgaWYgKHRoaXMudXNlRXh0ZW5kZWRDb2xsaWRlcnMgJiYgc2NoZW1hRXhDb2xsaWRlciAhPSBudWxsKSB7XG4gICAgICAgIGNvbnN0IHNwZWNWZXJzaW9uRXhDb2xsaWRlciA9IHNjaGVtYUV4Q29sbGlkZXIuc3BlY1ZlcnNpb247XG4gICAgICAgIGlmICghUE9TU0lCTEVfU1BFQ19WRVJTSU9OU19FWFRFTkRFRF9DT0xMSURFUlMuaGFzKHNwZWNWZXJzaW9uRXhDb2xsaWRlcikpIHtcbiAgICAgICAgICBjb25zb2xlLndhcm4oXG4gICAgICAgICAgICBgVlJNU3ByaW5nQm9uZUxvYWRlclBsdWdpbjogVW5rbm93biAke0VYVEVOU0lPTl9OQU1FX0VYVEVOREVEX0NPTExJREVSfSBzcGVjVmVyc2lvbiBcIiR7c3BlY1ZlcnNpb25FeENvbGxpZGVyfVwiLiBGYWxsYmFja2luZyB0byB0aGUgJHtWUk1TcHJpbmdCb25lTG9hZGVyUGx1Z2luLkVYVEVOU0lPTl9OQU1FfSBkZWZpbml0aW9uYCxcbiAgICAgICAgICApO1xuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgIGNvbnN0IHNjaGVtYUV4U2hhcGUgPSBzY2hlbWFFeENvbGxpZGVyLnNoYXBlITtcbiAgICAgICAgICBpZiAoc2NoZW1hRXhTaGFwZS5zcGhlcmUpIHtcbiAgICAgICAgICAgIHJldHVybiB0aGlzLl9pbXBvcnRTcGhlcmVDb2xsaWRlcihub2RlLCB7XG4gICAgICAgICAgICAgIG9mZnNldDogbmV3IFRIUkVFLlZlY3RvcjMoKS5mcm9tQXJyYXkoc2NoZW1hRXhTaGFwZS5zcGhlcmUub2Zmc2V0ID8/IFswLjAsIDAuMCwgMC4wXSksXG4gICAgICAgICAgICAgIHJhZGl1czogc2NoZW1hRXhTaGFwZS5zcGhlcmUucmFkaXVzID8/IDAuMCxcbiAgICAgICAgICAgICAgaW5zaWRlOiBzY2hlbWFFeFNoYXBlLnNwaGVyZS5pbnNpZGUgPz8gZmFsc2UsXG4gICAgICAgICAgICB9KTtcbiAgICAgICAgICB9IGVsc2UgaWYgKHNjaGVtYUV4U2hhcGUuY2Fwc3VsZSkge1xuICAgICAgICAgICAgcmV0dXJuIHRoaXMuX2ltcG9ydENhcHN1bGVDb2xsaWRlcihub2RlLCB7XG4gICAgICAgICAgICAgIG9mZnNldDogbmV3IFRIUkVFLlZlY3RvcjMoKS5mcm9tQXJyYXkoc2NoZW1hRXhTaGFwZS5jYXBzdWxlLm9mZnNldCA/PyBbMC4wLCAwLjAsIDAuMF0pLFxuICAgICAgICAgICAgICByYWRpdXM6IHNjaGVtYUV4U2hhcGUuY2Fwc3VsZS5yYWRpdXMgPz8gMC4wLFxuICAgICAgICAgICAgICB0YWlsOiBuZXcgVEhSRUUuVmVjdG9yMygpLmZyb21BcnJheShzY2hlbWFFeFNoYXBlLmNhcHN1bGUudGFpbCA/PyBbMC4wLCAwLjAsIDAuMF0pLFxuICAgICAgICAgICAgICBpbnNpZGU6IHNjaGVtYUV4U2hhcGUuY2Fwc3VsZS5pbnNpZGUgPz8gZmFsc2UsXG4gICAgICAgICAgICB9KTtcbiAgICAgICAgICB9IGVsc2UgaWYgKHNjaGVtYUV4U2hhcGUucGxhbmUpIHtcbiAgICAgICAgICAgIHJldHVybiB0aGlzLl9pbXBvcnRQbGFuZUNvbGxpZGVyKG5vZGUsIHtcbiAgICAgICAgICAgICAgb2Zmc2V0OiBuZXcgVEhSRUUuVmVjdG9yMygpLmZyb21BcnJheShzY2hlbWFFeFNoYXBlLnBsYW5lLm9mZnNldCA/PyBbMC4wLCAwLjAsIDAuMF0pLFxuICAgICAgICAgICAgICBub3JtYWw6IG5ldyBUSFJFRS5WZWN0b3IzKCkuZnJvbUFycmF5KHNjaGVtYUV4U2hhcGUucGxhbmUubm9ybWFsID8/IFswLjAsIDAuMCwgMS4wXSksXG4gICAgICAgICAgICB9KTtcbiAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICAgIH1cblxuICAgICAgaWYgKHNjaGVtYVNoYXBlLnNwaGVyZSkge1xuICAgICAgICByZXR1cm4gdGhpcy5faW1wb3J0U3BoZXJlQ29sbGlkZXIobm9kZSwge1xuICAgICAgICAgIG9mZnNldDogbmV3IFRIUkVFLlZlY3RvcjMoKS5mcm9tQXJyYXkoc2NoZW1hU2hhcGUuc3BoZXJlLm9mZnNldCA/PyBbMC4wLCAwLjAsIDAuMF0pLFxuICAgICAgICAgIHJhZGl1czogc2NoZW1hU2hhcGUuc3BoZXJlLnJhZGl1cyA/PyAwLjAsXG4gICAgICAgICAgaW5zaWRlOiBmYWxzZSxcbiAgICAgICAgfSk7XG4gICAgICB9IGVsc2UgaWYgKHNjaGVtYVNoYXBlLmNhcHN1bGUpIHtcbiAgICAgICAgcmV0dXJuIHRoaXMuX2ltcG9ydENhcHN1bGVDb2xsaWRlcihub2RlLCB7XG4gICAgICAgICAgb2Zmc2V0OiBuZXcgVEhSRUUuVmVjdG9yMygpLmZyb21BcnJheShzY2hlbWFTaGFwZS5jYXBzdWxlLm9mZnNldCA/PyBbMC4wLCAwLjAsIDAuMF0pLFxuICAgICAgICAgIHJhZGl1czogc2NoZW1hU2hhcGUuY2Fwc3VsZS5yYWRpdXMgPz8gMC4wLFxuICAgICAgICAgIHRhaWw6IG5ldyBUSFJFRS5WZWN0b3IzKCkuZnJvbUFycmF5KHNjaGVtYVNoYXBlLmNhcHN1bGUudGFpbCA/PyBbMC4wLCAwLjAsIDAuMF0pLFxuICAgICAgICAgIGluc2lkZTogZmFsc2UsXG4gICAgICAgIH0pO1xuICAgICAgfVxuXG4gICAgICB0aHJvdyBuZXcgRXJyb3IoYFZSTVNwcmluZ0JvbmVMb2FkZXJQbHVnaW46IFRoZSBjb2xsaWRlciAjJHtpQ29sbGlkZXJ9IGhhcyBubyB2YWxpZCBzaGFwZWApO1xuICAgIH0pO1xuXG4gICAgY29uc3QgY29sbGlkZXJHcm91cHMgPSBleHRlbnNpb24uY29sbGlkZXJHcm91cHM/Lm1hcChcbiAgICAgIChzY2hlbWFDb2xsaWRlckdyb3VwLCBpQ29sbGlkZXJHcm91cCk6IFZSTVNwcmluZ0JvbmVDb2xsaWRlckdyb3VwID0+IHtcbiAgICAgICAgY29uc3QgY29scyA9IChzY2hlbWFDb2xsaWRlckdyb3VwLmNvbGxpZGVycyA/PyBbXSkubWFwKChpQ29sbGlkZXIpID0+IHtcbiAgICAgICAgICBjb25zdCBjb2wgPSBjb2xsaWRlcnM/LltpQ29sbGlkZXJdO1xuXG4gICAgICAgICAgaWYgKGNvbCA9PSBudWxsKSB7XG4gICAgICAgICAgICB0aHJvdyBuZXcgRXJyb3IoXG4gICAgICAgICAgICAgIGBWUk1TcHJpbmdCb25lTG9hZGVyUGx1Z2luOiBUaGUgY29sbGlkZXJHcm91cCAjJHtpQ29sbGlkZXJHcm91cH0gYXR0ZW1wdGVkIHRvIHVzZSBhIGNvbGxpZGVyICMke2lDb2xsaWRlcn0gYnV0IG5vdCBmb3VuZGAsXG4gICAgICAgICAgICApO1xuICAgICAgICAgIH1cblxuICAgICAgICAgIHJldHVybiBjb2w7XG4gICAgICAgIH0pO1xuXG4gICAgICAgIHJldHVybiB7XG4gICAgICAgICAgY29sbGlkZXJzOiBjb2xzLFxuICAgICAgICAgIG5hbWU6IHNjaGVtYUNvbGxpZGVyR3JvdXAubmFtZSxcbiAgICAgICAgfTtcbiAgICAgIH0sXG4gICAgKTtcblxuICAgIGV4dGVuc2lvbi5zcHJpbmdzPy5mb3JFYWNoKChzY2hlbWFTcHJpbmcsIGlTcHJpbmcpID0+IHtcbiAgICAgIGNvbnN0IHNjaGVtYUpvaW50cyA9IHNjaGVtYVNwcmluZy5qb2ludHM7XG5cbiAgICAgIC8vIHByZXBhcmUgY29sbGlkZXJzXG4gICAgICBjb25zdCBjb2xsaWRlckdyb3Vwc0ZvclNwcmluZyA9IHNjaGVtYVNwcmluZy5jb2xsaWRlckdyb3Vwcz8ubWFwKChpQ29sbGlkZXJHcm91cCkgPT4ge1xuICAgICAgICBjb25zdCBncm91cCA9IGNvbGxpZGVyR3JvdXBzPy5baUNvbGxpZGVyR3JvdXBdO1xuXG4gICAgICAgIGlmIChncm91cCA9PSBudWxsKSB7XG4gICAgICAgICAgdGhyb3cgbmV3IEVycm9yKFxuICAgICAgICAgICAgYFZSTVNwcmluZ0JvbmVMb2FkZXJQbHVnaW46IFRoZSBzcHJpbmcgIyR7aVNwcmluZ30gYXR0ZW1wdGVkIHRvIHVzZSBhIGNvbGxpZGVyR3JvdXAgJHtpQ29sbGlkZXJHcm91cH0gYnV0IG5vdCBmb3VuZGAsXG4gICAgICAgICAgKTtcbiAgICAgICAgfVxuXG4gICAgICAgIHJldHVybiBncm91cDtcbiAgICAgIH0pO1xuXG4gICAgICBjb25zdCBjZW50ZXIgPSBzY2hlbWFTcHJpbmcuY2VudGVyICE9IG51bGwgPyB0aHJlZU5vZGVzW3NjaGVtYVNwcmluZy5jZW50ZXJdIDogdW5kZWZpbmVkO1xuXG4gICAgICBsZXQgcHJldlNjaGVtYUpvaW50OiBWMVNwcmluZ0JvbmVTY2hlbWEuU3ByaW5nQm9uZUpvaW50IHwgdW5kZWZpbmVkO1xuICAgICAgc2NoZW1hSm9pbnRzLmZvckVhY2goKHNjaGVtYUpvaW50KSA9PiB7XG4gICAgICAgIGlmIChwcmV2U2NoZW1hSm9pbnQpIHtcbiAgICAgICAgICAvLyBwcmVwYXJlIG5vZGVcbiAgICAgICAgICBjb25zdCBub2RlSW5kZXggPSBwcmV2U2NoZW1hSm9pbnQubm9kZTtcbiAgICAgICAgICBjb25zdCBub2RlID0gdGhyZWVOb2Rlc1tub2RlSW5kZXhdO1xuICAgICAgICAgIGNvbnN0IGNoaWxkSW5kZXggPSBzY2hlbWFKb2ludC5ub2RlO1xuICAgICAgICAgIGNvbnN0IGNoaWxkID0gdGhyZWVOb2Rlc1tjaGlsZEluZGV4XTtcblxuICAgICAgICAgIC8vIHByZXBhcmUgc2V0dGluZ1xuICAgICAgICAgIGNvbnN0IHNldHRpbmc6IFBhcnRpYWw8VlJNU3ByaW5nQm9uZUpvaW50U2V0dGluZ3M+ID0ge1xuICAgICAgICAgICAgaGl0UmFkaXVzOiBwcmV2U2NoZW1hSm9pbnQuaGl0UmFkaXVzLFxuICAgICAgICAgICAgZHJhZ0ZvcmNlOiBwcmV2U2NoZW1hSm9pbnQuZHJhZ0ZvcmNlLFxuICAgICAgICAgICAgZ3Jhdml0eVBvd2VyOiBwcmV2U2NoZW1hSm9pbnQuZ3Jhdml0eVBvd2VyLFxuICAgICAgICAgICAgc3RpZmZuZXNzOiBwcmV2U2NoZW1hSm9pbnQuc3RpZmZuZXNzLFxuICAgICAgICAgICAgZ3Jhdml0eURpcjpcbiAgICAgICAgICAgICAgcHJldlNjaGVtYUpvaW50LmdyYXZpdHlEaXIgIT0gbnVsbFxuICAgICAgICAgICAgICAgID8gbmV3IFRIUkVFLlZlY3RvcjMoKS5mcm9tQXJyYXkocHJldlNjaGVtYUpvaW50LmdyYXZpdHlEaXIpXG4gICAgICAgICAgICAgICAgOiB1bmRlZmluZWQsXG4gICAgICAgICAgfTtcblxuICAgICAgICAgIC8vIGNyZWF0ZSBzcHJpbmcgYm9uZXNcbiAgICAgICAgICBjb25zdCBqb2ludCA9IHRoaXMuX2ltcG9ydEpvaW50KG5vZGUsIGNoaWxkLCBzZXR0aW5nLCBjb2xsaWRlckdyb3Vwc0ZvclNwcmluZyk7XG4gICAgICAgICAgaWYgKGNlbnRlcikge1xuICAgICAgICAgICAgam9pbnQuY2VudGVyID0gY2VudGVyO1xuICAgICAgICAgIH1cblxuICAgICAgICAgIG1hbmFnZXIuYWRkSm9pbnQoam9pbnQpO1xuICAgICAgICB9XG5cbiAgICAgICAgcHJldlNjaGVtYUpvaW50ID0gc2NoZW1hSm9pbnQ7XG4gICAgICB9KTtcbiAgICB9KTtcblxuICAgIC8vIGluaXQgc3ByaW5nIGJvbmVzXG4gICAgbWFuYWdlci5zZXRJbml0U3RhdGUoKTtcblxuICAgIHJldHVybiBtYW5hZ2VyO1xuICB9XG5cbiAgcHJpdmF0ZSBhc3luYyBfdjBJbXBvcnQoZ2x0ZjogR0xURik6IFByb21pc2U8VlJNU3ByaW5nQm9uZU1hbmFnZXIgfCBudWxsPiB7XG4gICAgY29uc3QganNvbiA9IGdsdGYucGFyc2VyLmpzb24gYXMgR0xURlNjaGVtYS5JR0xURjtcblxuICAgIC8vIGVhcmx5IGFib3J0IGlmIGl0IGRvZXNuJ3QgdXNlIHZybVxuICAgIGNvbnN0IGlzVlJNVXNlZCA9IGpzb24uZXh0ZW5zaW9uc1VzZWQ/LmluZGV4T2YoJ1ZSTScpICE9PSAtMTtcbiAgICBpZiAoIWlzVlJNVXNlZCkge1xuICAgICAgcmV0dXJuIG51bGw7XG4gICAgfVxuXG4gICAgLy8gZWFybHkgYWJvcnQgaWYgaXQgZG9lc24ndCBoYXZlIGJvbmUgZ3JvdXBzXG4gICAgY29uc3QgZXh0ZW5zaW9uID0ganNvbi5leHRlbnNpb25zPy5bJ1ZSTSddIGFzIFYwVlJNLlZSTSB8IHVuZGVmaW5lZDtcbiAgICBjb25zdCBzY2hlbWFTZWNvbmRhcnlBbmltYXRpb24gPSBleHRlbnNpb24/LnNlY29uZGFyeUFuaW1hdGlvbjtcbiAgICBpZiAoIXNjaGVtYVNlY29uZGFyeUFuaW1hdGlvbikge1xuICAgICAgcmV0dXJuIG51bGw7XG4gICAgfVxuXG4gICAgY29uc3Qgc2NoZW1hQm9uZUdyb3VwcyA9IHNjaGVtYVNlY29uZGFyeUFuaW1hdGlvbj8uYm9uZUdyb3VwcztcbiAgICBpZiAoIXNjaGVtYUJvbmVHcm91cHMpIHtcbiAgICAgIHJldHVybiBudWxsO1xuICAgIH1cblxuICAgIGNvbnN0IG1hbmFnZXIgPSBuZXcgVlJNU3ByaW5nQm9uZU1hbmFnZXIoKTtcblxuICAgIGNvbnN0IHRocmVlTm9kZXM6IFRIUkVFLk9iamVjdDNEW10gPSBhd2FpdCBnbHRmLnBhcnNlci5nZXREZXBlbmRlbmNpZXMoJ25vZGUnKTtcblxuICAgIGNvbnN0IGNvbGxpZGVyR3JvdXBzID0gc2NoZW1hU2Vjb25kYXJ5QW5pbWF0aW9uLmNvbGxpZGVyR3JvdXBzPy5tYXAoXG4gICAgICAoc2NoZW1hQ29sbGlkZXJHcm91cCk6IFZSTVNwcmluZ0JvbmVDb2xsaWRlckdyb3VwID0+IHtcbiAgICAgICAgY29uc3Qgbm9kZSA9IHRocmVlTm9kZXNbc2NoZW1hQ29sbGlkZXJHcm91cC5ub2RlIV07XG4gICAgICAgIGNvbnN0IGNvbGxpZGVycyA9IChzY2hlbWFDb2xsaWRlckdyb3VwLmNvbGxpZGVycyA/PyBbXSkubWFwKChzY2hlbWFDb2xsaWRlciwgaUNvbGxpZGVyKSA9PiB7XG4gICAgICAgICAgY29uc3Qgb2Zmc2V0ID0gbmV3IFRIUkVFLlZlY3RvcjMoMC4wLCAwLjAsIDAuMCk7XG4gICAgICAgICAgaWYgKHNjaGVtYUNvbGxpZGVyLm9mZnNldCkge1xuICAgICAgICAgICAgb2Zmc2V0LnNldChcbiAgICAgICAgICAgICAgc2NoZW1hQ29sbGlkZXIub2Zmc2V0LnggPz8gMC4wLFxuICAgICAgICAgICAgICBzY2hlbWFDb2xsaWRlci5vZmZzZXQueSA/PyAwLjAsXG4gICAgICAgICAgICAgIHNjaGVtYUNvbGxpZGVyLm9mZnNldC56ID8gLXNjaGVtYUNvbGxpZGVyLm9mZnNldC56IDogMC4wLCAvLyB6IGlzIG9wcG9zaXRlIGluIFZSTTAuMFxuICAgICAgICAgICAgKTtcbiAgICAgICAgICB9XG5cbiAgICAgICAgICByZXR1cm4gdGhpcy5faW1wb3J0U3BoZXJlQ29sbGlkZXIobm9kZSwge1xuICAgICAgICAgICAgb2Zmc2V0LFxuICAgICAgICAgICAgcmFkaXVzOiBzY2hlbWFDb2xsaWRlci5yYWRpdXMgPz8gMC4wLFxuICAgICAgICAgICAgaW5zaWRlOiBmYWxzZSxcbiAgICAgICAgICB9KTtcbiAgICAgICAgfSk7XG5cbiAgICAgICAgcmV0dXJuIHsgY29sbGlkZXJzIH07XG4gICAgICB9LFxuICAgICk7XG5cbiAgICAvLyBpbXBvcnQgc3ByaW5nIGJvbmVzIGZvciBlYWNoIHNwcmluZyBib25lIGdyb3Vwc1xuICAgIHNjaGVtYUJvbmVHcm91cHM/LmZvckVhY2goKHNjaGVtYUJvbmVHcm91cCwgaUJvbmVHcm91cCkgPT4ge1xuICAgICAgY29uc3Qgcm9vdEluZGljZXMgPSBzY2hlbWFCb25lR3JvdXAuYm9uZXM7XG4gICAgICBpZiAoIXJvb3RJbmRpY2VzKSB7XG4gICAgICAgIHJldHVybjtcbiAgICAgIH1cblxuICAgICAgcm9vdEluZGljZXMuZm9yRWFjaCgocm9vdEluZGV4KSA9PiB7XG4gICAgICAgIGNvbnN0IHJvb3QgPSB0aHJlZU5vZGVzW3Jvb3RJbmRleF07XG5cbiAgICAgICAgLy8gcHJlcGFyZSBzZXR0aW5nXG4gICAgICAgIGNvbnN0IGdyYXZpdHlEaXIgPSBuZXcgVEhSRUUuVmVjdG9yMygpO1xuICAgICAgICBpZiAoc2NoZW1hQm9uZUdyb3VwLmdyYXZpdHlEaXIpIHtcbiAgICAgICAgICBncmF2aXR5RGlyLnNldChcbiAgICAgICAgICAgIHNjaGVtYUJvbmVHcm91cC5ncmF2aXR5RGlyLnggPz8gMC4wLFxuICAgICAgICAgICAgc2NoZW1hQm9uZUdyb3VwLmdyYXZpdHlEaXIueSA/PyAwLjAsXG4gICAgICAgICAgICBzY2hlbWFCb25lR3JvdXAuZ3Jhdml0eURpci56ID8/IDAuMCxcbiAgICAgICAgICApO1xuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgIGdyYXZpdHlEaXIuc2V0KDAuMCwgLTEuMCwgMC4wKTtcbiAgICAgICAgfVxuXG4gICAgICAgIGNvbnN0IGNlbnRlciA9IHNjaGVtYUJvbmVHcm91cC5jZW50ZXIgIT0gbnVsbCA/IHRocmVlTm9kZXNbc2NoZW1hQm9uZUdyb3VwLmNlbnRlcl0gOiB1bmRlZmluZWQ7XG5cbiAgICAgICAgY29uc3Qgc2V0dGluZzogUGFydGlhbDxWUk1TcHJpbmdCb25lSm9pbnRTZXR0aW5ncz4gPSB7XG4gICAgICAgICAgaGl0UmFkaXVzOiBzY2hlbWFCb25lR3JvdXAuaGl0UmFkaXVzLFxuICAgICAgICAgIGRyYWdGb3JjZTogc2NoZW1hQm9uZUdyb3VwLmRyYWdGb3JjZSxcbiAgICAgICAgICBncmF2aXR5UG93ZXI6IHNjaGVtYUJvbmVHcm91cC5ncmF2aXR5UG93ZXIsXG4gICAgICAgICAgc3RpZmZuZXNzOiBzY2hlbWFCb25lR3JvdXAuc3RpZmZpbmVzcyxcbiAgICAgICAgICBncmF2aXR5RGlyLFxuICAgICAgICB9O1xuXG4gICAgICAgIC8vIHByZXBhcmUgY29sbGlkZXJzXG4gICAgICAgIGNvbnN0IGNvbGxpZGVyR3JvdXBzRm9yU3ByaW5nID0gc2NoZW1hQm9uZUdyb3VwLmNvbGxpZGVyR3JvdXBzPy5tYXAoKGlDb2xsaWRlckdyb3VwKSA9PiB7XG4gICAgICAgICAgY29uc3QgZ3JvdXAgPSBjb2xsaWRlckdyb3Vwcz8uW2lDb2xsaWRlckdyb3VwXTtcblxuICAgICAgICAgIGlmIChncm91cCA9PSBudWxsKSB7XG4gICAgICAgICAgICB0aHJvdyBuZXcgRXJyb3IoXG4gICAgICAgICAgICAgIGBWUk1TcHJpbmdCb25lTG9hZGVyUGx1Z2luOiBUaGUgc3ByaW5nICMke2lCb25lR3JvdXB9IGF0dGVtcHRlZCB0byB1c2UgYSBjb2xsaWRlckdyb3VwICR7aUNvbGxpZGVyR3JvdXB9IGJ1dCBub3QgZm91bmRgLFxuICAgICAgICAgICAgKTtcbiAgICAgICAgICB9XG5cbiAgICAgICAgICByZXR1cm4gZ3JvdXA7XG4gICAgICAgIH0pO1xuXG4gICAgICAgIC8vIGNyZWF0ZSBzcHJpbmcgYm9uZXNcbiAgICAgICAgcm9vdC50cmF2ZXJzZSgobm9kZSkgPT4ge1xuICAgICAgICAgIGNvbnN0IGNoaWxkOiBUSFJFRS5PYmplY3QzRCB8IG51bGwgPSBub2RlLmNoaWxkcmVuWzBdID8/IG51bGw7XG5cbiAgICAgICAgICBjb25zdCBqb2ludCA9IHRoaXMuX2ltcG9ydEpvaW50KG5vZGUsIGNoaWxkLCBzZXR0aW5nLCBjb2xsaWRlckdyb3Vwc0ZvclNwcmluZyk7XG4gICAgICAgICAgaWYgKGNlbnRlcikge1xuICAgICAgICAgICAgam9pbnQuY2VudGVyID0gY2VudGVyO1xuICAgICAgICAgIH1cblxuICAgICAgICAgIG1hbmFnZXIuYWRkSm9pbnQoam9pbnQpO1xuICAgICAgICB9KTtcbiAgICAgIH0pO1xuICAgIH0pO1xuXG4gICAgLy8gaW5pdCBzcHJpbmcgYm9uZXNcbiAgICBnbHRmLnNjZW5lLnVwZGF0ZU1hdHJpeFdvcmxkKCk7XG4gICAgbWFuYWdlci5zZXRJbml0U3RhdGUoKTtcblxuICAgIHJldHVybiBtYW5hZ2VyO1xuICB9XG5cbiAgcHJpdmF0ZSBfaW1wb3J0Sm9pbnQoXG4gICAgbm9kZTogVEhSRUUuT2JqZWN0M0QsXG4gICAgY2hpbGQ6IFRIUkVFLk9iamVjdDNELFxuICAgIHNldHRpbmc/OiBQYXJ0aWFsPFZSTVNwcmluZ0JvbmVKb2ludFNldHRpbmdzPixcbiAgICBjb2xsaWRlckdyb3Vwc0ZvclNwcmluZz86IFZSTVNwcmluZ0JvbmVDb2xsaWRlckdyb3VwW10sXG4gICk6IFZSTVNwcmluZ0JvbmVKb2ludCB7XG4gICAgY29uc3Qgc3ByaW5nQm9uZSA9IG5ldyBWUk1TcHJpbmdCb25lSm9pbnQobm9kZSwgY2hpbGQsIHNldHRpbmcsIGNvbGxpZGVyR3JvdXBzRm9yU3ByaW5nKTtcblxuICAgIGlmICh0aGlzLmpvaW50SGVscGVyUm9vdCkge1xuICAgICAgY29uc3QgaGVscGVyID0gbmV3IFZSTVNwcmluZ0JvbmVKb2ludEhlbHBlcihzcHJpbmdCb25lKTtcbiAgICAgIHRoaXMuam9pbnRIZWxwZXJSb290LmFkZChoZWxwZXIpO1xuICAgICAgaGVscGVyLnJlbmRlck9yZGVyID0gdGhpcy5qb2ludEhlbHBlclJvb3QucmVuZGVyT3JkZXI7XG4gICAgfVxuXG4gICAgcmV0dXJuIHNwcmluZ0JvbmU7XG4gIH1cblxuICBwcml2YXRlIF9pbXBvcnRTcGhlcmVDb2xsaWRlcihcbiAgICBkZXN0aW5hdGlvbjogVEhSRUUuT2JqZWN0M0QsXG4gICAgcGFyYW1zOiB7XG4gICAgICBvZmZzZXQ6IFRIUkVFLlZlY3RvcjM7XG4gICAgICByYWRpdXM6IG51bWJlcjtcbiAgICAgIGluc2lkZTogYm9vbGVhbjtcbiAgICB9LFxuICApOiBWUk1TcHJpbmdCb25lQ29sbGlkZXIge1xuICAgIGNvbnN0IHNoYXBlID0gbmV3IFZSTVNwcmluZ0JvbmVDb2xsaWRlclNoYXBlU3BoZXJlKHBhcmFtcyk7XG5cbiAgICBjb25zdCBjb2xsaWRlciA9IG5ldyBWUk1TcHJpbmdCb25lQ29sbGlkZXIoc2hhcGUpO1xuXG4gICAgZGVzdGluYXRpb24uYWRkKGNvbGxpZGVyKTtcblxuICAgIGlmICh0aGlzLmNvbGxpZGVySGVscGVyUm9vdCkge1xuICAgICAgY29uc3QgaGVscGVyID0gbmV3IFZSTVNwcmluZ0JvbmVDb2xsaWRlckhlbHBlcihjb2xsaWRlcik7XG4gICAgICB0aGlzLmNvbGxpZGVySGVscGVyUm9vdC5hZGQoaGVscGVyKTtcbiAgICAgIGhlbHBlci5yZW5kZXJPcmRlciA9IHRoaXMuY29sbGlkZXJIZWxwZXJSb290LnJlbmRlck9yZGVyO1xuICAgIH1cblxuICAgIHJldHVybiBjb2xsaWRlcjtcbiAgfVxuXG4gIHByaXZhdGUgX2ltcG9ydENhcHN1bGVDb2xsaWRlcihcbiAgICBkZXN0aW5hdGlvbjogVEhSRUUuT2JqZWN0M0QsXG4gICAgcGFyYW1zOiB7XG4gICAgICBvZmZzZXQ6IFRIUkVFLlZlY3RvcjM7XG4gICAgICByYWRpdXM6IG51bWJlcjtcbiAgICAgIHRhaWw6IFRIUkVFLlZlY3RvcjM7XG4gICAgICBpbnNpZGU6IGJvb2xlYW47XG4gICAgfSxcbiAgKTogVlJNU3ByaW5nQm9uZUNvbGxpZGVyIHtcbiAgICBjb25zdCBzaGFwZSA9IG5ldyBWUk1TcHJpbmdCb25lQ29sbGlkZXJTaGFwZUNhcHN1bGUocGFyYW1zKTtcblxuICAgIGNvbnN0IGNvbGxpZGVyID0gbmV3IFZSTVNwcmluZ0JvbmVDb2xsaWRlcihzaGFwZSk7XG5cbiAgICBkZXN0aW5hdGlvbi5hZGQoY29sbGlkZXIpO1xuXG4gICAgaWYgKHRoaXMuY29sbGlkZXJIZWxwZXJSb290KSB7XG4gICAgICBjb25zdCBoZWxwZXIgPSBuZXcgVlJNU3ByaW5nQm9uZUNvbGxpZGVySGVscGVyKGNvbGxpZGVyKTtcbiAgICAgIHRoaXMuY29sbGlkZXJIZWxwZXJSb290LmFkZChoZWxwZXIpO1xuICAgICAgaGVscGVyLnJlbmRlck9yZGVyID0gdGhpcy5jb2xsaWRlckhlbHBlclJvb3QucmVuZGVyT3JkZXI7XG4gICAgfVxuXG4gICAgcmV0dXJuIGNvbGxpZGVyO1xuICB9XG5cbiAgcHJpdmF0ZSBfaW1wb3J0UGxhbmVDb2xsaWRlcihcbiAgICBkZXN0aW5hdGlvbjogVEhSRUUuT2JqZWN0M0QsXG4gICAgcGFyYW1zOiB7XG4gICAgICBvZmZzZXQ6IFRIUkVFLlZlY3RvcjM7XG4gICAgICBub3JtYWw6IFRIUkVFLlZlY3RvcjM7XG4gICAgfSxcbiAgKTogVlJNU3ByaW5nQm9uZUNvbGxpZGVyIHtcbiAgICBjb25zdCBzaGFwZSA9IG5ldyBWUk1TcHJpbmdCb25lQ29sbGlkZXJTaGFwZVBsYW5lKHBhcmFtcyk7XG5cbiAgICBjb25zdCBjb2xsaWRlciA9IG5ldyBWUk1TcHJpbmdCb25lQ29sbGlkZXIoc2hhcGUpO1xuXG4gICAgZGVzdGluYXRpb24uYWRkKGNvbGxpZGVyKTtcblxuICAgIGlmICh0aGlzLmNvbGxpZGVySGVscGVyUm9vdCkge1xuICAgICAgY29uc3QgaGVscGVyID0gbmV3IFZSTVNwcmluZ0JvbmVDb2xsaWRlckhlbHBlcihjb2xsaWRlcik7XG4gICAgICB0aGlzLmNvbGxpZGVySGVscGVyUm9vdC5hZGQoaGVscGVyKTtcbiAgICAgIGhlbHBlci5yZW5kZXJPcmRlciA9IHRoaXMuY29sbGlkZXJIZWxwZXJSb290LnJlbmRlck9yZGVyO1xuICAgIH1cblxuICAgIHJldHVybiBjb2xsaWRlcjtcbiAgfVxufVxuIiwgImltcG9ydCB0eXBlICogYXMgVEhSRUUgZnJvbSAndGhyZWUnO1xuXG5leHBvcnQgZnVuY3Rpb24gdHJhdmVyc2VBbmNlc3RvcnNGcm9tUm9vdChvYmplY3Q6IFRIUkVFLk9iamVjdDNELCBjYWxsYmFjazogKG9iamVjdDogVEhSRUUuT2JqZWN0M0QpID0+IHZvaWQpOiB2b2lkIHtcbiAgY29uc3QgYW5jZXN0b3JzOiBUSFJFRS5PYmplY3QzRFtdID0gW107XG5cbiAgbGV0IGhlYWQ6IFRIUkVFLk9iamVjdDNEIHwgbnVsbCA9IG9iamVjdDtcbiAgd2hpbGUgKGhlYWQgIT09IG51bGwpIHtcbiAgICBhbmNlc3RvcnMudW5zaGlmdChoZWFkKTtcbiAgICBoZWFkID0gaGVhZC5wYXJlbnQ7XG4gIH1cblxuICBhbmNlc3RvcnMuZm9yRWFjaCgoYW5jZXN0b3IpID0+IHtcbiAgICBjYWxsYmFjayhhbmNlc3Rvcik7XG4gIH0pO1xufVxuIiwgImltcG9ydCB0eXBlICogYXMgVEhSRUUgZnJvbSAndGhyZWUnO1xuXG4vKipcbiAqIFRyYXZlcnNlIGNoaWxkcmVuIG9mIGdpdmVuIG9iamVjdCBhbmQgZXhlY3V0ZSBnaXZlbiBjYWxsYmFjay5cbiAqIFRoZSBnaXZlbiBvYmplY3QgaXRzZWxmIHdvbnQgYmUgZ2l2ZW4gdG8gdGhlIGNhbGxiYWNrLlxuICogSWYgdGhlIHJldHVybiB2YWx1ZSBvZiB0aGUgY2FsbGJhY2sgaXMgYHRydWVgLCBpdCB3aWxsIGhhbHQgdGhlIHRyYXZlcnNhbCBvZiBpdHMgY2hpbGRyZW4uXG4gKiBAcGFyYW0gb2JqZWN0IEEgcm9vdCBvYmplY3RcbiAqIEBwYXJhbSBjYWxsYmFjayBBIGNhbGxiYWNrIGZ1bmN0aW9uIGNhbGxlZCBmb3IgZWFjaCBjaGlsZHJlblxuICovXG5leHBvcnQgZnVuY3Rpb24gdHJhdmVyc2VDaGlsZHJlblVudGlsQ29uZGl0aW9uTWV0KFxuICBvYmplY3Q6IFRIUkVFLk9iamVjdDNELFxuICBjYWxsYmFjazogKG9iamVjdDogVEhSRUUuT2JqZWN0M0QpID0+IGJvb2xlYW4sXG4pOiB2b2lkIHtcbiAgb2JqZWN0LmNoaWxkcmVuLmZvckVhY2goKGNoaWxkKSA9PiB7XG4gICAgY29uc3QgcmVzdWx0ID0gY2FsbGJhY2soY2hpbGQpO1xuICAgIGlmICghcmVzdWx0KSB7XG4gICAgICB0cmF2ZXJzZUNoaWxkcmVuVW50aWxDb25kaXRpb25NZXQoY2hpbGQsIGNhbGxiYWNrKTtcbiAgICB9XG4gIH0pO1xufVxuIiwgImltcG9ydCB0eXBlICogYXMgVEhSRUUgZnJvbSAndGhyZWUnO1xuaW1wb3J0IHR5cGUgeyBWUk1TcHJpbmdCb25lSm9pbnQgfSBmcm9tICcuL1ZSTVNwcmluZ0JvbmVKb2ludCc7XG5pbXBvcnQgeyB0cmF2ZXJzZUFuY2VzdG9yc0Zyb21Sb290IH0gZnJvbSAnLi91dGlscy90cmF2ZXJzZUFuY2VzdG9yc0Zyb21Sb290JztcbmltcG9ydCB0eXBlIHsgVlJNU3ByaW5nQm9uZUNvbGxpZGVyIH0gZnJvbSAnLi9WUk1TcHJpbmdCb25lQ29sbGlkZXInO1xuaW1wb3J0IHR5cGUgeyBWUk1TcHJpbmdCb25lQ29sbGlkZXJHcm91cCB9IGZyb20gJy4vVlJNU3ByaW5nQm9uZUNvbGxpZGVyR3JvdXAnO1xuaW1wb3J0IHsgdHJhdmVyc2VDaGlsZHJlblVudGlsQ29uZGl0aW9uTWV0IH0gZnJvbSAnLi91dGlscy90cmF2ZXJzZUNoaWxkcmVuVW50aWxDb25kaXRpb25NZXQnO1xuXG5leHBvcnQgY2xhc3MgVlJNU3ByaW5nQm9uZU1hbmFnZXIge1xuICBwcml2YXRlIF9qb2ludHMgPSBuZXcgU2V0PFZSTVNwcmluZ0JvbmVKb2ludD4oKTtcbiAgcHJpdmF0ZSBfaGFzV2FybmVkQ2lyY3VsYXJEZXBlbmRlbmN5ID0gZmFsc2U7XG5cbiAgcHVibGljIGdldCBqb2ludHMoKTogU2V0PFZSTVNwcmluZ0JvbmVKb2ludD4ge1xuICAgIHJldHVybiB0aGlzLl9qb2ludHM7XG4gIH1cblxuICAvKipcbiAgICogQGRlcHJlY2F0ZWQgVXNlIHtAbGluayBqb2ludHN9IGluc3RlYWQuXG4gICAqL1xuICBwdWJsaWMgZ2V0IHNwcmluZ0JvbmVzKCk6IFNldDxWUk1TcHJpbmdCb25lSm9pbnQ+IHtcbiAgICBjb25zb2xlLndhcm4oJ1ZSTVNwcmluZ0JvbmVNYW5hZ2VyOiBzcHJpbmdCb25lcyBpcyBkZXByZWNhdGVkLiB1c2Ugam9pbnRzIGluc3RlYWQuJyk7XG5cbiAgICByZXR1cm4gdGhpcy5fam9pbnRzO1xuICB9XG5cbiAgcHVibGljIGdldCBjb2xsaWRlckdyb3VwcygpOiBWUk1TcHJpbmdCb25lQ29sbGlkZXJHcm91cFtdIHtcbiAgICBjb25zdCBzZXQgPSBuZXcgU2V0PFZSTVNwcmluZ0JvbmVDb2xsaWRlckdyb3VwPigpO1xuICAgIHRoaXMuX2pvaW50cy5mb3JFYWNoKChzcHJpbmdCb25lKSA9PiB7XG4gICAgICBzcHJpbmdCb25lLmNvbGxpZGVyR3JvdXBzLmZvckVhY2goKGNvbGxpZGVyR3JvdXApID0+IHtcbiAgICAgICAgc2V0LmFkZChjb2xsaWRlckdyb3VwKTtcbiAgICAgIH0pO1xuICAgIH0pO1xuICAgIHJldHVybiBBcnJheS5mcm9tKHNldCk7XG4gIH1cblxuICBwdWJsaWMgZ2V0IGNvbGxpZGVycygpOiBWUk1TcHJpbmdCb25lQ29sbGlkZXJbXSB7XG4gICAgY29uc3Qgc2V0ID0gbmV3IFNldDxWUk1TcHJpbmdCb25lQ29sbGlkZXI+KCk7XG4gICAgdGhpcy5jb2xsaWRlckdyb3Vwcy5mb3JFYWNoKChjb2xsaWRlckdyb3VwKSA9PiB7XG4gICAgICBjb2xsaWRlckdyb3VwLmNvbGxpZGVycy5mb3JFYWNoKChjb2xsaWRlcikgPT4ge1xuICAgICAgICBzZXQuYWRkKGNvbGxpZGVyKTtcbiAgICAgIH0pO1xuICAgIH0pO1xuICAgIHJldHVybiBBcnJheS5mcm9tKHNldCk7XG4gIH1cblxuICBwcml2YXRlIF9vYmplY3RTcHJpbmdCb25lc01hcCA9IG5ldyBNYXA8VEhSRUUuT2JqZWN0M0QsIFNldDxWUk1TcHJpbmdCb25lSm9pbnQ+PigpO1xuXG4gIHB1YmxpYyBhZGRKb2ludChqb2ludDogVlJNU3ByaW5nQm9uZUpvaW50KTogdm9pZCB7XG4gICAgdGhpcy5fam9pbnRzLmFkZChqb2ludCk7XG5cbiAgICBsZXQgb2JqZWN0U2V0ID0gdGhpcy5fb2JqZWN0U3ByaW5nQm9uZXNNYXAuZ2V0KGpvaW50LmJvbmUpO1xuICAgIGlmIChvYmplY3RTZXQgPT0gbnVsbCkge1xuICAgICAgb2JqZWN0U2V0ID0gbmV3IFNldDxWUk1TcHJpbmdCb25lSm9pbnQ+KCk7XG4gICAgICB0aGlzLl9vYmplY3RTcHJpbmdCb25lc01hcC5zZXQoam9pbnQuYm9uZSwgb2JqZWN0U2V0KTtcbiAgICB9XG4gICAgb2JqZWN0U2V0LmFkZChqb2ludCk7XG4gIH1cblxuICAvKipcbiAgICogQGRlcHJlY2F0ZWQgVXNlIHtAbGluayBhZGRKb2ludH0gaW5zdGVhZC5cbiAgICovXG4gIHB1YmxpYyBhZGRTcHJpbmdCb25lKGpvaW50OiBWUk1TcHJpbmdCb25lSm9pbnQpOiB2b2lkIHtcbiAgICBjb25zb2xlLndhcm4oJ1ZSTVNwcmluZ0JvbmVNYW5hZ2VyOiBhZGRTcHJpbmdCb25lKCkgaXMgZGVwcmVjYXRlZC4gdXNlIGFkZEpvaW50KCkgaW5zdGVhZC4nKTtcblxuICAgIHRoaXMuYWRkSm9pbnQoam9pbnQpO1xuICB9XG5cbiAgcHVibGljIGRlbGV0ZUpvaW50KGpvaW50OiBWUk1TcHJpbmdCb25lSm9pbnQpOiB2b2lkIHtcbiAgICB0aGlzLl9qb2ludHMuZGVsZXRlKGpvaW50KTtcblxuICAgIGNvbnN0IG9iamVjdFNldCA9IHRoaXMuX29iamVjdFNwcmluZ0JvbmVzTWFwLmdldChqb2ludC5ib25lKSE7XG4gICAgb2JqZWN0U2V0LmRlbGV0ZShqb2ludCk7XG4gIH1cblxuICAvKipcbiAgICogQGRlcHJlY2F0ZWQgVXNlIHtAbGluayBkZWxldGVKb2ludH0gaW5zdGVhZC5cbiAgICovXG4gIHB1YmxpYyBkZWxldGVTcHJpbmdCb25lKGpvaW50OiBWUk1TcHJpbmdCb25lSm9pbnQpOiB2b2lkIHtcbiAgICBjb25zb2xlLndhcm4oJ1ZSTVNwcmluZ0JvbmVNYW5hZ2VyOiBkZWxldGVTcHJpbmdCb25lKCkgaXMgZGVwcmVjYXRlZC4gdXNlIGRlbGV0ZUpvaW50KCkgaW5zdGVhZC4nKTtcblxuICAgIHRoaXMuZGVsZXRlSm9pbnQoam9pbnQpO1xuICB9XG5cbiAgcHVibGljIHNldEluaXRTdGF0ZSgpOiB2b2lkIHtcbiAgICBjb25zdCBzcHJpbmdCb25lc1RyaWVkID0gbmV3IFNldDxWUk1TcHJpbmdCb25lSm9pbnQ+KCk7XG4gICAgY29uc3Qgc3ByaW5nQm9uZXNEb25lID0gbmV3IFNldDxWUk1TcHJpbmdCb25lSm9pbnQ+KCk7XG4gICAgY29uc3Qgb2JqZWN0VXBkYXRlZCA9IG5ldyBTZXQ8VEhSRUUuT2JqZWN0M0Q+KCk7XG5cbiAgICBmb3IgKGNvbnN0IHNwcmluZ0JvbmUgb2YgdGhpcy5fam9pbnRzKSB7XG4gICAgICB0aGlzLl9wcm9jZXNzU3ByaW5nQm9uZShzcHJpbmdCb25lLCBzcHJpbmdCb25lc1RyaWVkLCBzcHJpbmdCb25lc0RvbmUsIG9iamVjdFVwZGF0ZWQsIChzcHJpbmdCb25lKSA9PlxuICAgICAgICBzcHJpbmdCb25lLnNldEluaXRTdGF0ZSgpLFxuICAgICAgKTtcbiAgICB9XG4gIH1cblxuICBwdWJsaWMgcmVzZXQoKTogdm9pZCB7XG4gICAgY29uc3Qgc3ByaW5nQm9uZXNUcmllZCA9IG5ldyBTZXQ8VlJNU3ByaW5nQm9uZUpvaW50PigpO1xuICAgIGNvbnN0IHNwcmluZ0JvbmVzRG9uZSA9IG5ldyBTZXQ8VlJNU3ByaW5nQm9uZUpvaW50PigpO1xuICAgIGNvbnN0IG9iamVjdFVwZGF0ZWQgPSBuZXcgU2V0PFRIUkVFLk9iamVjdDNEPigpO1xuXG4gICAgZm9yIChjb25zdCBzcHJpbmdCb25lIG9mIHRoaXMuX2pvaW50cykge1xuICAgICAgdGhpcy5fcHJvY2Vzc1NwcmluZ0JvbmUoc3ByaW5nQm9uZSwgc3ByaW5nQm9uZXNUcmllZCwgc3ByaW5nQm9uZXNEb25lLCBvYmplY3RVcGRhdGVkLCAoc3ByaW5nQm9uZSkgPT5cbiAgICAgICAgc3ByaW5nQm9uZS5yZXNldCgpLFxuICAgICAgKTtcbiAgICB9XG4gIH1cblxuICBwdWJsaWMgdXBkYXRlKGRlbHRhOiBudW1iZXIpOiB2b2lkIHtcbiAgICBjb25zdCBzcHJpbmdCb25lc1RyaWVkID0gbmV3IFNldDxWUk1TcHJpbmdCb25lSm9pbnQ+KCk7XG4gICAgY29uc3Qgc3ByaW5nQm9uZXNEb25lID0gbmV3IFNldDxWUk1TcHJpbmdCb25lSm9pbnQ+KCk7XG4gICAgY29uc3Qgb2JqZWN0VXBkYXRlZCA9IG5ldyBTZXQ8VEhSRUUuT2JqZWN0M0Q+KCk7XG5cbiAgICBmb3IgKGNvbnN0IHNwcmluZ0JvbmUgb2YgdGhpcy5fam9pbnRzKSB7XG4gICAgICAvLyB1cGRhdGUgdGhlIHNwcmluZ2JvbmVcbiAgICAgIHRoaXMuX3Byb2Nlc3NTcHJpbmdCb25lKHNwcmluZ0JvbmUsIHNwcmluZ0JvbmVzVHJpZWQsIHNwcmluZ0JvbmVzRG9uZSwgb2JqZWN0VXBkYXRlZCwgKHNwcmluZ0JvbmUpID0+XG4gICAgICAgIHNwcmluZ0JvbmUudXBkYXRlKGRlbHRhKSxcbiAgICAgICk7XG5cbiAgICAgIC8vIHVwZGF0ZSBjaGlsZHJlbiB3b3JsZCBtYXRyaWNlc1xuICAgICAgLy8gaXQgaXMgcmVxdWlyZWQgd2hlbiB0aGUgc3ByaW5nIGJvbmUgY2hhaW4gaXMgc3BhcnNlXG4gICAgICB0cmF2ZXJzZUNoaWxkcmVuVW50aWxDb25kaXRpb25NZXQoc3ByaW5nQm9uZS5ib25lLCAob2JqZWN0KSA9PiB7XG4gICAgICAgIC8vIGlmIHRoZSBvYmplY3QgaGFzIGF0dGFjaGVkIHNwcmluZ2JvbmUsIGhhbHQgdGhlIHRyYXZlcnNhbFxuICAgICAgICBpZiAoKHRoaXMuX29iamVjdFNwcmluZ0JvbmVzTWFwLmdldChvYmplY3QpPy5zaXplID8/IDApID4gMCkge1xuICAgICAgICAgIHJldHVybiB0cnVlO1xuICAgICAgICB9XG5cbiAgICAgICAgLy8gb3RoZXJ3aXNlIHVwZGF0ZSBpdHMgd29ybGQgbWF0cml4XG4gICAgICAgIG9iamVjdC51cGRhdGVXb3JsZE1hdHJpeChmYWxzZSwgZmFsc2UpO1xuICAgICAgICByZXR1cm4gZmFsc2U7XG4gICAgICB9KTtcbiAgICB9XG4gIH1cblxuICAvKipcbiAgICogVXBkYXRlIGEgc3ByaW5nIGJvbmUuXG4gICAqIElmIHRoZXJlIGFyZSBvdGhlciBzcHJpbmcgYm9uZSB0aGF0IGFyZSBkZXBlbmRhbnQsIGl0IHdpbGwgdHJ5IHRvIHVwZGF0ZSB0aGVtIHJlY3Vyc2l2ZWx5LlxuICAgKiBJdCB1cGRhdGVzIG1hdHJpeFdvcmxkIG9mIGFsbCBhbmNlc3RvcnMgYW5kIG15c2VsZi5cbiAgICogSXQgbWlnaHQgbG9nIGFuIHdhcm5pbmcgbWVzc2FnZSBpZiB0aGVyZSBhcmUgYW55IGNpcmN1bGFyIGRlcGVuZGVuY2llcy5cbiAgICpcbiAgICogSW50ZW5kZWQgdG8gYmUgdXNlZCBpbiB7QGxpbmsgdXBkYXRlfSBhbmQge0BsaW5rIF9wcm9jZXNzU3ByaW5nQm9uZX0gaXRzZWxmIHJlY3Vyc2l2ZWx5LlxuICAgKlxuICAgKiBAcGFyYW0gc3ByaW5nQm9uZSBBIHNwcmluZ0JvbmUgeW91IHdhbnQgdG8gdXBkYXRlXG4gICAqIEBwYXJhbSBzcHJpbmdCb25lc1RyaWVkIFNldCBvZiBzcHJpbmdCb25lcyB0aGF0IGFyZSBhbHJlYWR5IHRyaWVkIHRvIGJlIHVwZGF0ZWRcbiAgICogQHBhcmFtIHNwcmluZ0JvbmVzRG9uZSBTZXQgb2Ygc3ByaW5nQm9uZXMgdGhhdCBhcmUgYWxyZWFkeSB1cCB0byBkYXRlXG4gICAqIEBwYXJhbSBvYmplY3RVcGRhdGVkIFNldCBvZiBvYmplY3QzRCB3aG9zZSBtYXRyaXhXb3JsZCBpcyB1cGRhdGVkXG4gICAqL1xuICBwcml2YXRlIF9wcm9jZXNzU3ByaW5nQm9uZShcbiAgICBzcHJpbmdCb25lOiBWUk1TcHJpbmdCb25lSm9pbnQsXG4gICAgc3ByaW5nQm9uZXNUcmllZDogU2V0PFZSTVNwcmluZ0JvbmVKb2ludD4sXG4gICAgc3ByaW5nQm9uZXNEb25lOiBTZXQ8VlJNU3ByaW5nQm9uZUpvaW50PixcbiAgICBvYmplY3RVcGRhdGVkOiBTZXQ8VEhSRUUuT2JqZWN0M0Q+LFxuICAgIGNhbGxiYWNrOiAoc3ByaW5nQm9uZTogVlJNU3ByaW5nQm9uZUpvaW50KSA9PiB2b2lkLFxuICApOiB2b2lkIHtcbiAgICBpZiAoc3ByaW5nQm9uZXNEb25lLmhhcyhzcHJpbmdCb25lKSkge1xuICAgICAgcmV0dXJuO1xuICAgIH1cblxuICAgIGlmIChzcHJpbmdCb25lc1RyaWVkLmhhcyhzcHJpbmdCb25lKSkge1xuICAgICAgaWYgKCF0aGlzLl9oYXNXYXJuZWRDaXJjdWxhckRlcGVuZGVuY3kpIHtcbiAgICAgICAgY29uc29sZS53YXJuKCdWUk1TcHJpbmdCb25lTWFuYWdlcjogQ2lyY3VsYXIgZGVwZW5kZW5jeSBkZXRlY3RlZCB3aGlsZSB1cGRhdGluZyBzcHJpbmdib25lcycpO1xuICAgICAgICB0aGlzLl9oYXNXYXJuZWRDaXJjdWxhckRlcGVuZGVuY3kgPSB0cnVlO1xuICAgICAgfVxuICAgICAgcmV0dXJuO1xuICAgIH1cbiAgICBzcHJpbmdCb25lc1RyaWVkLmFkZChzcHJpbmdCb25lKTtcblxuICAgIGNvbnN0IGRlcE9iamVjdHMgPSB0aGlzLl9nZXREZXBlbmRlbmNpZXMoc3ByaW5nQm9uZSk7XG4gICAgZm9yIChjb25zdCBkZXBPYmplY3Qgb2YgZGVwT2JqZWN0cykge1xuICAgICAgdHJhdmVyc2VBbmNlc3RvcnNGcm9tUm9vdChkZXBPYmplY3QsIChkZXBPYmplY3RBbmNlc3RvcikgPT4ge1xuICAgICAgICBjb25zdCBvYmplY3RTZXQgPSB0aGlzLl9vYmplY3RTcHJpbmdCb25lc01hcC5nZXQoZGVwT2JqZWN0QW5jZXN0b3IpO1xuICAgICAgICBpZiAob2JqZWN0U2V0KSB7XG4gICAgICAgICAgZm9yIChjb25zdCBkZXBTcHJpbmdCb25lIG9mIG9iamVjdFNldCkge1xuICAgICAgICAgICAgdGhpcy5fcHJvY2Vzc1NwcmluZ0JvbmUoZGVwU3ByaW5nQm9uZSwgc3ByaW5nQm9uZXNUcmllZCwgc3ByaW5nQm9uZXNEb25lLCBvYmplY3RVcGRhdGVkLCBjYWxsYmFjayk7XG4gICAgICAgICAgfVxuICAgICAgICB9IGVsc2UgaWYgKCFvYmplY3RVcGRhdGVkLmhhcyhkZXBPYmplY3RBbmNlc3RvcikpIHtcbiAgICAgICAgICAvLyB1cGRhdGUgbWF0cml4IG9mIG5vbi1zcHJpbmdib25lXG4gICAgICAgICAgZGVwT2JqZWN0QW5jZXN0b3IudXBkYXRlV29ybGRNYXRyaXgoZmFsc2UsIGZhbHNlKTtcbiAgICAgICAgICBvYmplY3RVcGRhdGVkLmFkZChkZXBPYmplY3RBbmNlc3Rvcik7XG4gICAgICAgIH1cbiAgICAgIH0pO1xuICAgIH1cblxuICAgIC8vIHVwZGF0ZSBteSBtYXRyaXhcbiAgICBzcHJpbmdCb25lLmJvbmUudXBkYXRlTWF0cml4KCk7XG4gICAgc3ByaW5nQm9uZS5ib25lLnVwZGF0ZVdvcmxkTWF0cml4KGZhbHNlLCBmYWxzZSk7XG5cbiAgICBjYWxsYmFjayhzcHJpbmdCb25lKTtcblxuICAgIG9iamVjdFVwZGF0ZWQuYWRkKHNwcmluZ0JvbmUuYm9uZSk7XG5cbiAgICBzcHJpbmdCb25lc0RvbmUuYWRkKHNwcmluZ0JvbmUpO1xuICB9XG5cbiAgLyoqXG4gICAqIFJldHVybiBhIHNldCBvZiBvYmplY3RzIHRoYXQgYXJlIGRlcGVuZGFudCBvZiBnaXZlbiBzcHJpbmcgYm9uZS5cbiAgICogQHBhcmFtIHNwcmluZ0JvbmUgQSBzcHJpbmcgYm9uZVxuICAgKiBAcmV0dXJuIEEgc2V0IG9mIG9iamVjdHMgdGhhdCBhcmUgZGVwZW5kYW50IG9mIGdpdmVuIHNwcmluZyBib25lXG4gICAqL1xuICBwcml2YXRlIF9nZXREZXBlbmRlbmNpZXMoc3ByaW5nQm9uZTogVlJNU3ByaW5nQm9uZUpvaW50KTogU2V0PFRIUkVFLk9iamVjdDNEPiB7XG4gICAgY29uc3Qgc2V0ID0gbmV3IFNldDxUSFJFRS5PYmplY3QzRD4oKTtcblxuICAgIGNvbnN0IHBhcmVudCA9IHNwcmluZ0JvbmUuYm9uZS5wYXJlbnQ7XG4gICAgaWYgKHBhcmVudCkge1xuICAgICAgc2V0LmFkZChwYXJlbnQpO1xuICAgIH1cblxuICAgIHNwcmluZ0JvbmUuY29sbGlkZXJHcm91cHMuZm9yRWFjaCgoY29sbGlkZXJHcm91cCkgPT4ge1xuICAgICAgY29sbGlkZXJHcm91cC5jb2xsaWRlcnMuZm9yRWFjaCgoY29sbGlkZXIpID0+IHtcbiAgICAgICAgc2V0LmFkZChjb2xsaWRlcik7XG4gICAgICB9KTtcbiAgICB9KTtcblxuICAgIHJldHVybiBzZXQ7XG4gIH1cbn1cbiIsICJpbXBvcnQgKiBhcyBUSFJFRSBmcm9tICd0aHJlZSc7XG5pbXBvcnQgeyBHTFRGLCBHTFRGTG9hZGVyUGx1Z2luLCBHTFRGUGFyc2VyIH0gZnJvbSAndGhyZWUvZXhhbXBsZXMvanNtL2xvYWRlcnMvR0xURkxvYWRlci5qcyc7XG5pbXBvcnQge1xuICBWUk1FeHByZXNzaW9uTG9hZGVyUGx1Z2luLFxuICBWUk1GaXJzdFBlcnNvbkxvYWRlclBsdWdpbixcbiAgVlJNSHVtYW5vaWQsXG4gIFZSTUh1bWFub2lkTG9hZGVyUGx1Z2luLFxuICBWUk1Mb29rQXRMb2FkZXJQbHVnaW4sXG4gIFZSTU1ldGEsXG4gIFZSTU1ldGFMb2FkZXJQbHVnaW4sXG59IGZyb20gJ0BwaXhpdi90aHJlZS12cm0tY29yZSc7XG5pbXBvcnQgeyBNVG9vbk1hdGVyaWFsTG9hZGVyUGx1Z2luIH0gZnJvbSAnQHBpeGl2L3RocmVlLXZybS1tYXRlcmlhbHMtbXRvb24nO1xuaW1wb3J0IHsgVlJNTWF0ZXJpYWxzSERSRW1pc3NpdmVNdWx0aXBsaWVyTG9hZGVyUGx1Z2luIH0gZnJvbSAnQHBpeGl2L3RocmVlLXZybS1tYXRlcmlhbHMtaGRyLWVtaXNzaXZlLW11bHRpcGxpZXInO1xuaW1wb3J0IHsgVlJNTWF0ZXJpYWxzVjBDb21wYXRQbHVnaW4gfSBmcm9tICdAcGl4aXYvdGhyZWUtdnJtLW1hdGVyaWFscy12MGNvbXBhdCc7XG5pbXBvcnQgeyBWUk1Ob2RlQ29uc3RyYWludExvYWRlclBsdWdpbiB9IGZyb20gJ0BwaXhpdi90aHJlZS12cm0tbm9kZS1jb25zdHJhaW50JztcbmltcG9ydCB7IFZSTVNwcmluZ0JvbmVMb2FkZXJQbHVnaW4gfSBmcm9tICdAcGl4aXYvdGhyZWUtdnJtLXNwcmluZ2JvbmUnO1xuaW1wb3J0IHsgVlJNTG9hZGVyUGx1Z2luT3B0aW9ucyB9IGZyb20gJy4vVlJNTG9hZGVyUGx1Z2luT3B0aW9ucyc7XG5pbXBvcnQgeyBWUk0gfSBmcm9tICcuL1ZSTSc7XG5cbmV4cG9ydCBjbGFzcyBWUk1Mb2FkZXJQbHVnaW4gaW1wbGVtZW50cyBHTFRGTG9hZGVyUGx1Z2luIHtcbiAgcHVibGljIHJlYWRvbmx5IHBhcnNlcjogR0xURlBhcnNlcjtcblxuICBwdWJsaWMgcmVhZG9ubHkgZXhwcmVzc2lvblBsdWdpbjogVlJNRXhwcmVzc2lvbkxvYWRlclBsdWdpbjtcbiAgcHVibGljIHJlYWRvbmx5IGZpcnN0UGVyc29uUGx1Z2luOiBWUk1GaXJzdFBlcnNvbkxvYWRlclBsdWdpbjtcbiAgcHVibGljIHJlYWRvbmx5IGh1bWFub2lkUGx1Z2luOiBWUk1IdW1hbm9pZExvYWRlclBsdWdpbjtcbiAgcHVibGljIHJlYWRvbmx5IGxvb2tBdFBsdWdpbjogVlJNTG9va0F0TG9hZGVyUGx1Z2luO1xuICBwdWJsaWMgcmVhZG9ubHkgbWV0YVBsdWdpbjogVlJNTWV0YUxvYWRlclBsdWdpbjtcbiAgcHVibGljIHJlYWRvbmx5IG10b29uTWF0ZXJpYWxQbHVnaW46IE1Ub29uTWF0ZXJpYWxMb2FkZXJQbHVnaW47XG4gIHB1YmxpYyByZWFkb25seSBtYXRlcmlhbHNIRFJFbWlzc2l2ZU11bHRpcGxpZXJQbHVnaW46IFZSTU1hdGVyaWFsc0hEUkVtaXNzaXZlTXVsdGlwbGllckxvYWRlclBsdWdpbjtcbiAgcHVibGljIHJlYWRvbmx5IG1hdGVyaWFsc1YwQ29tcGF0UGx1Z2luOiBWUk1NYXRlcmlhbHNWMENvbXBhdFBsdWdpbjtcbiAgcHVibGljIHJlYWRvbmx5IHNwcmluZ0JvbmVQbHVnaW46IFZSTVNwcmluZ0JvbmVMb2FkZXJQbHVnaW47XG4gIHB1YmxpYyByZWFkb25seSBub2RlQ29uc3RyYWludFBsdWdpbjogVlJNTm9kZUNvbnN0cmFpbnRMb2FkZXJQbHVnaW47XG5cbiAgcHVibGljIGdldCBuYW1lKCk6IHN0cmluZyB7XG4gICAgcmV0dXJuICdWUk1Mb2FkZXJQbHVnaW4nO1xuICB9XG5cbiAgcHVibGljIGNvbnN0cnVjdG9yKHBhcnNlcjogR0xURlBhcnNlciwgb3B0aW9ucz86IFZSTUxvYWRlclBsdWdpbk9wdGlvbnMpIHtcbiAgICB0aGlzLnBhcnNlciA9IHBhcnNlcjtcblxuICAgIGNvbnN0IGhlbHBlclJvb3QgPSBvcHRpb25zPy5oZWxwZXJSb290O1xuICAgIGNvbnN0IGF1dG9VcGRhdGVIdW1hbkJvbmVzID0gb3B0aW9ucz8uYXV0b1VwZGF0ZUh1bWFuQm9uZXM7XG5cbiAgICB0aGlzLmV4cHJlc3Npb25QbHVnaW4gPSBvcHRpb25zPy5leHByZXNzaW9uUGx1Z2luID8/IG5ldyBWUk1FeHByZXNzaW9uTG9hZGVyUGx1Z2luKHBhcnNlcik7XG4gICAgdGhpcy5maXJzdFBlcnNvblBsdWdpbiA9IG9wdGlvbnM/LmZpcnN0UGVyc29uUGx1Z2luID8/IG5ldyBWUk1GaXJzdFBlcnNvbkxvYWRlclBsdWdpbihwYXJzZXIpO1xuICAgIHRoaXMuaHVtYW5vaWRQbHVnaW4gPVxuICAgICAgb3B0aW9ucz8uaHVtYW5vaWRQbHVnaW4gPz9cbiAgICAgIG5ldyBWUk1IdW1hbm9pZExvYWRlclBsdWdpbihwYXJzZXIsIHtcbiAgICAgICAgaGVscGVyUm9vdCxcbiAgICAgICAgYXV0b1VwZGF0ZUh1bWFuQm9uZXMsXG4gICAgICB9KTtcbiAgICB0aGlzLmxvb2tBdFBsdWdpbiA9IG9wdGlvbnM/Lmxvb2tBdFBsdWdpbiA/PyBuZXcgVlJNTG9va0F0TG9hZGVyUGx1Z2luKHBhcnNlciwgeyBoZWxwZXJSb290IH0pO1xuICAgIHRoaXMubWV0YVBsdWdpbiA9IG9wdGlvbnM/Lm1ldGFQbHVnaW4gPz8gbmV3IFZSTU1ldGFMb2FkZXJQbHVnaW4ocGFyc2VyKTtcbiAgICB0aGlzLm10b29uTWF0ZXJpYWxQbHVnaW4gPSBvcHRpb25zPy5tdG9vbk1hdGVyaWFsUGx1Z2luID8/IG5ldyBNVG9vbk1hdGVyaWFsTG9hZGVyUGx1Z2luKHBhcnNlcik7XG4gICAgdGhpcy5tYXRlcmlhbHNIRFJFbWlzc2l2ZU11bHRpcGxpZXJQbHVnaW4gPVxuICAgICAgb3B0aW9ucz8ubWF0ZXJpYWxzSERSRW1pc3NpdmVNdWx0aXBsaWVyUGx1Z2luID8/IG5ldyBWUk1NYXRlcmlhbHNIRFJFbWlzc2l2ZU11bHRpcGxpZXJMb2FkZXJQbHVnaW4ocGFyc2VyKTtcbiAgICB0aGlzLm1hdGVyaWFsc1YwQ29tcGF0UGx1Z2luID0gb3B0aW9ucz8ubWF0ZXJpYWxzVjBDb21wYXRQbHVnaW4gPz8gbmV3IFZSTU1hdGVyaWFsc1YwQ29tcGF0UGx1Z2luKHBhcnNlcik7XG5cbiAgICB0aGlzLnNwcmluZ0JvbmVQbHVnaW4gPVxuICAgICAgb3B0aW9ucz8uc3ByaW5nQm9uZVBsdWdpbiA/P1xuICAgICAgbmV3IFZSTVNwcmluZ0JvbmVMb2FkZXJQbHVnaW4ocGFyc2VyLCB7XG4gICAgICAgIGNvbGxpZGVySGVscGVyUm9vdDogaGVscGVyUm9vdCxcbiAgICAgICAgam9pbnRIZWxwZXJSb290OiBoZWxwZXJSb290LFxuICAgICAgfSk7XG5cbiAgICB0aGlzLm5vZGVDb25zdHJhaW50UGx1Z2luID1cbiAgICAgIG9wdGlvbnM/Lm5vZGVDb25zdHJhaW50UGx1Z2luID8/IG5ldyBWUk1Ob2RlQ29uc3RyYWludExvYWRlclBsdWdpbihwYXJzZXIsIHsgaGVscGVyUm9vdCB9KTtcbiAgfVxuXG4gIHB1YmxpYyBhc3luYyBiZWZvcmVSb290KCk6IFByb21pc2U8dm9pZD4ge1xuICAgIGF3YWl0IHRoaXMubWF0ZXJpYWxzVjBDb21wYXRQbHVnaW4uYmVmb3JlUm9vdCgpO1xuICAgIGF3YWl0IHRoaXMubXRvb25NYXRlcmlhbFBsdWdpbi5iZWZvcmVSb290KCk7XG4gIH1cblxuICBwdWJsaWMgYXN5bmMgbG9hZE1lc2gobWVzaEluZGV4OiBudW1iZXIpOiBQcm9taXNlPFRIUkVFLkdyb3VwIHwgVEhSRUUuTWVzaCB8IFRIUkVFLlNraW5uZWRNZXNoPiB7XG4gICAgcmV0dXJuIGF3YWl0IHRoaXMubXRvb25NYXRlcmlhbFBsdWdpbi5sb2FkTWVzaChtZXNoSW5kZXgpO1xuICB9XG5cbiAgcHVibGljIGdldE1hdGVyaWFsVHlwZShtYXRlcmlhbEluZGV4OiBudW1iZXIpOiB0eXBlb2YgVEhSRUUuTWF0ZXJpYWwgfCBudWxsIHtcbiAgICBjb25zdCBtdG9vblR5cGUgPSB0aGlzLm10b29uTWF0ZXJpYWxQbHVnaW4uZ2V0TWF0ZXJpYWxUeXBlKG1hdGVyaWFsSW5kZXgpO1xuICAgIGlmIChtdG9vblR5cGUgIT0gbnVsbCkge1xuICAgICAgcmV0dXJuIG10b29uVHlwZTtcbiAgICB9XG5cbiAgICByZXR1cm4gbnVsbDtcbiAgfVxuXG4gIHB1YmxpYyBhc3luYyBleHRlbmRNYXRlcmlhbFBhcmFtcyhtYXRlcmlhbEluZGV4OiBudW1iZXIsIG1hdGVyaWFsUGFyYW1zOiB7IFtrZXk6IHN0cmluZ106IGFueSB9KTogUHJvbWlzZTxhbnk+IHtcbiAgICBhd2FpdCB0aGlzLm1hdGVyaWFsc0hEUkVtaXNzaXZlTXVsdGlwbGllclBsdWdpbi5leHRlbmRNYXRlcmlhbFBhcmFtcyhtYXRlcmlhbEluZGV4LCBtYXRlcmlhbFBhcmFtcyk7XG4gICAgYXdhaXQgdGhpcy5tdG9vbk1hdGVyaWFsUGx1Z2luLmV4dGVuZE1hdGVyaWFsUGFyYW1zKG1hdGVyaWFsSW5kZXgsIG1hdGVyaWFsUGFyYW1zKTtcbiAgfVxuXG4gIHB1YmxpYyBhc3luYyBhZnRlclJvb3QoZ2x0ZjogR0xURik6IFByb21pc2U8dm9pZD4ge1xuICAgIGF3YWl0IHRoaXMubWV0YVBsdWdpbi5hZnRlclJvb3QoZ2x0Zik7XG4gICAgYXdhaXQgdGhpcy5odW1hbm9pZFBsdWdpbi5hZnRlclJvb3QoZ2x0Zik7XG4gICAgYXdhaXQgdGhpcy5leHByZXNzaW9uUGx1Z2luLmFmdGVyUm9vdChnbHRmKTtcbiAgICBhd2FpdCB0aGlzLmxvb2tBdFBsdWdpbi5hZnRlclJvb3QoZ2x0Zik7XG4gICAgYXdhaXQgdGhpcy5maXJzdFBlcnNvblBsdWdpbi5hZnRlclJvb3QoZ2x0Zik7XG4gICAgYXdhaXQgdGhpcy5zcHJpbmdCb25lUGx1Z2luLmFmdGVyUm9vdChnbHRmKTtcbiAgICBhd2FpdCB0aGlzLm5vZGVDb25zdHJhaW50UGx1Z2luLmFmdGVyUm9vdChnbHRmKTtcbiAgICBhd2FpdCB0aGlzLm10b29uTWF0ZXJpYWxQbHVnaW4uYWZ0ZXJSb290KGdsdGYpO1xuXG4gICAgY29uc3QgbWV0YSA9IGdsdGYudXNlckRhdGEudnJtTWV0YSBhcyBWUk1NZXRhIHwgbnVsbDtcbiAgICBjb25zdCBodW1hbm9pZCA9IGdsdGYudXNlckRhdGEudnJtSHVtYW5vaWQgYXMgVlJNSHVtYW5vaWQgfCBudWxsO1xuXG4gICAgLy8gbWV0YSBhbmQgaHVtYW5vaWQgYXJlIHJlcXVpcmVkIHRvIGJlIGEgVlJNLlxuICAgIC8vIERvbid0IGNyZWF0ZSBWUk0gaWYgdGhleSBhcmUgbnVsbFxuICAgIGlmIChtZXRhICYmIGh1bWFub2lkKSB7XG4gICAgICBjb25zdCB2cm0gPSBuZXcgVlJNKHtcbiAgICAgICAgc2NlbmU6IGdsdGYuc2NlbmUsXG4gICAgICAgIGV4cHJlc3Npb25NYW5hZ2VyOiBnbHRmLnVzZXJEYXRhLnZybUV4cHJlc3Npb25NYW5hZ2VyLFxuICAgICAgICBmaXJzdFBlcnNvbjogZ2x0Zi51c2VyRGF0YS52cm1GaXJzdFBlcnNvbixcbiAgICAgICAgaHVtYW5vaWQsXG4gICAgICAgIGxvb2tBdDogZ2x0Zi51c2VyRGF0YS52cm1Mb29rQXQsXG4gICAgICAgIG1ldGEsXG4gICAgICAgIG1hdGVyaWFsczogZ2x0Zi51c2VyRGF0YS52cm1NVG9vbk1hdGVyaWFscyxcbiAgICAgICAgc3ByaW5nQm9uZU1hbmFnZXI6IGdsdGYudXNlckRhdGEudnJtU3ByaW5nQm9uZU1hbmFnZXIsXG4gICAgICAgIG5vZGVDb25zdHJhaW50TWFuYWdlcjogZ2x0Zi51c2VyRGF0YS52cm1Ob2RlQ29uc3RyYWludE1hbmFnZXIsXG4gICAgICB9KTtcblxuICAgICAgZ2x0Zi51c2VyRGF0YS52cm0gPSB2cm07XG4gICAgfVxuICB9XG59XG4iLCAiLy8gU2VlOiBodHRwczovL3RocmVlanMub3JnL2RvY3MvI21hbnVhbC9lbi9pbnRyb2R1Y3Rpb24vSG93LXRvLWRpc3Bvc2Utb2Ytb2JqZWN0c1xuXG5pbXBvcnQgKiBhcyBUSFJFRSBmcm9tICd0aHJlZSc7XG5cbmZ1bmN0aW9uIGRpc3Bvc2VNYXRlcmlhbChtYXRlcmlhbDogVEhSRUUuTWF0ZXJpYWwpOiB2b2lkIHtcbiAgT2JqZWN0LnZhbHVlcyhtYXRlcmlhbCkuZm9yRWFjaCgodmFsdWUpID0+IHtcbiAgICBpZiAodmFsdWU/LmlzVGV4dHVyZSkge1xuICAgICAgY29uc3QgdGV4dHVyZSA9IHZhbHVlIGFzIFRIUkVFLlRleHR1cmU7XG4gICAgICB0ZXh0dXJlLmRpc3Bvc2UoKTtcbiAgICB9XG4gIH0pO1xuXG4gIGlmICgobWF0ZXJpYWwgYXMgYW55KS5pc1NoYWRlck1hdGVyaWFsKSB7XG4gICAgY29uc3QgdW5pZm9ybXM6IHsgW3VuaWZvcm06IHN0cmluZ106IFRIUkVFLklVbmlmb3JtPGFueT4gfSA9IChtYXRlcmlhbCBhcyBhbnkpLnVuaWZvcm1zO1xuICAgIGlmICh1bmlmb3Jtcykge1xuICAgICAgT2JqZWN0LnZhbHVlcyh1bmlmb3JtcykuZm9yRWFjaCgodW5pZm9ybSkgPT4ge1xuICAgICAgICBjb25zdCB2YWx1ZSA9IHVuaWZvcm0udmFsdWU7XG4gICAgICAgIGlmICh2YWx1ZT8uaXNUZXh0dXJlKSB7XG4gICAgICAgICAgY29uc3QgdGV4dHVyZSA9IHZhbHVlIGFzIFRIUkVFLlRleHR1cmU7XG4gICAgICAgICAgdGV4dHVyZS5kaXNwb3NlKCk7XG4gICAgICAgIH1cbiAgICAgIH0pO1xuICAgIH1cbiAgfVxuXG4gIG1hdGVyaWFsLmRpc3Bvc2UoKTtcbn1cblxuZnVuY3Rpb24gZGlzcG9zZShvYmplY3QzRDogVEhSRUUuT2JqZWN0M0QpOiB2b2lkIHtcbiAgY29uc3QgZ2VvbWV0cnk6IFRIUkVFLkJ1ZmZlckdlb21ldHJ5IHwgdW5kZWZpbmVkID0gKG9iamVjdDNEIGFzIGFueSkuZ2VvbWV0cnk7XG4gIGlmIChnZW9tZXRyeSkge1xuICAgIGdlb21ldHJ5LmRpc3Bvc2UoKTtcbiAgfVxuXG4gIGNvbnN0IHNrZWxldG9uOiBUSFJFRS5Ta2VsZXRvbiB8IHVuZGVmaW5lZCA9IChvYmplY3QzRCBhcyBhbnkpLnNrZWxldG9uO1xuICBpZiAoc2tlbGV0b24pIHtcbiAgICBza2VsZXRvbi5kaXNwb3NlKCk7XG4gIH1cblxuICBjb25zdCBtYXRlcmlhbDogVEhSRUUuTWF0ZXJpYWwgfCBUSFJFRS5NYXRlcmlhbFtdIHwgdW5kZWZpbmVkID0gKG9iamVjdDNEIGFzIGFueSkubWF0ZXJpYWw7XG4gIGlmIChtYXRlcmlhbCkge1xuICAgIGlmIChBcnJheS5pc0FycmF5KG1hdGVyaWFsKSkge1xuICAgICAgbWF0ZXJpYWwuZm9yRWFjaCgobWF0ZXJpYWw6IFRIUkVFLk1hdGVyaWFsKSA9PiBkaXNwb3NlTWF0ZXJpYWwobWF0ZXJpYWwpKTtcbiAgICB9IGVsc2UgaWYgKG1hdGVyaWFsKSB7XG4gICAgICBkaXNwb3NlTWF0ZXJpYWwobWF0ZXJpYWwpO1xuICAgIH1cbiAgfVxufVxuXG5leHBvcnQgZnVuY3Rpb24gZGVlcERpc3Bvc2Uob2JqZWN0M0Q6IFRIUkVFLk9iamVjdDNEKTogdm9pZCB7XG4gIG9iamVjdDNELnRyYXZlcnNlKGRpc3Bvc2UpO1xufVxuIiwgImltcG9ydCAqIGFzIFRIUkVFIGZyb20gJ3RocmVlJztcblxuLyoqXG4gKiBUcmF2ZXJzZSB0aGUgZ2l2ZW4gb2JqZWN0IGFuZCByZW1vdmUgdW5uZWNlc3NhcmlseSBib3VuZCBqb2ludHMgZnJvbSBldmVyeSBgVEhSRUUuU2tpbm5lZE1lc2hgLlxuICpcbiAqIFNvbWUgZW52aXJvbm1lbnRzIGxpa2UgbW9iaWxlIGRldmljZXMgaGF2ZSBhIGxvd2VyIGxpbWl0IG9mIGJvbmVzXG4gKiBhbmQgbWlnaHQgYmUgdW5hYmxlIHRvIHBlcmZvcm0gbWVzaCBza2lubmluZyB3aXRoIG1hbnkgYm9uZXMuXG4gKiBUaGlzIGZ1bmN0aW9uIG1pZ2h0IHJlc29sdmUgc3VjaCBhbiBpc3N1ZS5cbiAqXG4gKiBBbHNvLCB0aGlzIGZ1bmN0aW9uIG1pZ2h0IHNpZ25pZmljYW50bHkgaW1wcm92ZSB0aGUgcGVyZm9ybWFuY2Ugb2YgbWVzaCBza2lubmluZy5cbiAqXG4gKiBAcGFyYW0gcm9vdCBSb290IG9iamVjdCB0aGF0IHdpbGwgYmUgdHJhdmVyc2VkXG4gKi9cbmV4cG9ydCBmdW5jdGlvbiByZW1vdmVVbm5lY2Vzc2FyeUpvaW50cyhcbiAgcm9vdDogVEhSRUUuT2JqZWN0M0QsXG4gIG9wdGlvbnM/OiB7XG4gICAgLyoqXG4gICAgICogSWYgYHRydWVgLCB0aGlzIGZ1bmN0aW9uIHdpbGwgY29tcGVuc2F0ZSBza2VsZXRvbnMgd2l0aCBkdW1teSBib25lcyB0byBrZWVwIHRoZSBib25lIGNvdW50IHNhbWUgYmV0d2VlbiBza2VsZXRvbnMuXG4gICAgICpcbiAgICAgKiBUaGlzIG9wdGlvbiBtaWdodCBiZSBlZmZlY3RpdmUgZm9yIHRoZSBzaGFkZXIgY29tcGlsYXRpb24gcGVyZm9ybWFuY2UgdGhhdCBtYXR0ZXJzIHRvIHRoZSBpbml0aWFsIHJlbmRlcmluZyB0aW1lIGluIFdlYkdQVVJlbmRlcmVyLFxuICAgICAqIGVzcGVjaWFsbHkgd2hlbiB0aGUgbW9kZWwgbG9hZGVkIGhhcyBtYW55IG1hdGVyaWFscyBhbmQgdGhlIGRlcGVuZGVudCBib25lIGNvdW50IGlzIGRpZmZlcmVudCBiZXR3ZWVuIHRoZW0uXG4gICAgICpcbiAgICAgKiBDb25zaWRlciB0aGlzIHBhcmFtZXRlciBhcyBleHBlcmltZW50YWwuIFdlIG1pZ2h0IG1vZGlmeSBvciBkZWxldGUgdGhpcyBBUEkgd2l0aG91dCBub3RpY2UgaW4gdGhlIGZ1dHVyZS5cbiAgICAgKlxuICAgICAqIGBmYWxzZWAgYnkgZGVmYXVsdC5cbiAgICAgKi9cbiAgICBleHBlcmltZW50YWxTYW1lQm9uZUNvdW50cz86IGJvb2xlYW47XG4gIH0sXG4pOiB2b2lkIHtcbiAgY29uc3QgZXhwZXJpbWVudGFsU2FtZUJvbmVDb3VudHMgPSBvcHRpb25zPy5leHBlcmltZW50YWxTYW1lQm9uZUNvdW50cyA/PyBmYWxzZTtcblxuICAvLyBUcmF2ZXJzZSBhbiBlbnRpcmUgdHJlZSwgYW5kIGNvbGxlY3QgYWxsIHNraW5uZWQgbWVzaGVzXG4gIGNvbnN0IHNraW5uZWRNZXNoZXM6IFRIUkVFLlNraW5uZWRNZXNoW10gPSBbXTtcblxuICByb290LnRyYXZlcnNlKChvYmopID0+IHtcbiAgICBpZiAob2JqLnR5cGUgIT09ICdTa2lubmVkTWVzaCcpIHtcbiAgICAgIHJldHVybjtcbiAgICB9XG5cbiAgICBza2lubmVkTWVzaGVzLnB1c2gob2JqIGFzIFRIUkVFLlNraW5uZWRNZXNoKTtcbiAgfSk7XG5cbiAgLy8gQSBtYXAgZnJvbSBtZXNoZXMgdG8gYm9uZXMgYW5kIGJvbmVJbnZlcnNlc1xuICAvLyBzb21lIG1lc2hlcyBtaWdodCBzaGFyZSBhIHNhbWUgc2tpbkluZGV4IGF0dHJpYnV0ZSwgYW5kIHRoaXMgbWFwIGFsc28gcHJldmVudHMgdG8gY29udmVydCB0aGUgYXR0cmlidXRlIHR3aWNlXG4gIGNvbnN0IGJvbmVzTGlzdDogTWFwPFxuICAgIFRIUkVFLlNraW5uZWRNZXNoLFxuICAgIHtcbiAgICAgIGJvbmVzOiBUSFJFRS5Cb25lW107XG4gICAgICBib25lSW52ZXJzZXM6IFRIUkVFLk1hdHJpeDRbXTtcbiAgICB9XG4gID4gPSBuZXcgTWFwKCk7XG5cbiAgLy8gQSBtYXhpbXVtIG51bWJlciBvZiBib25lc1xuICBsZXQgbWF4Qm9uZXMgPSAwO1xuXG4gIC8vIEl0ZXJhdGUgb3ZlciBhbGwgc2tpbm5lZCBtZXNoZXMgYW5kIGNvbGxlY3QgYm9uZXMgYW5kIGJvbmVJbnZlcnNlc1xuICBmb3IgKGNvbnN0IG1lc2ggb2Ygc2tpbm5lZE1lc2hlcykge1xuICAgIGNvbnN0IGdlb21ldHJ5ID0gbWVzaC5nZW9tZXRyeTtcbiAgICBjb25zdCBhdHRyaWJ1dGUgPSBnZW9tZXRyeS5nZXRBdHRyaWJ1dGUoJ3NraW5JbmRleCcpIGFzIFRIUkVFLkJ1ZmZlckF0dHJpYnV0ZTtcblxuICAgIGNvbnN0IGJvbmVzOiBUSFJFRS5Cb25lW10gPSBbXTsgLy8gbmV3IGxpc3Qgb2YgYm9uZVxuICAgIGNvbnN0IGJvbmVJbnZlcnNlczogVEhSRUUuTWF0cml4NFtdID0gW107IC8vIG5ldyBsaXN0IG9mIGJvbmVJbnZlcnNlXG4gICAgY29uc3QgYm9uZUluZGV4TWFwOiB7IFtpbmRleDogbnVtYmVyXTogbnVtYmVyIH0gPSB7fTsgLy8gbWFwIG9mIG9sZCBib25lIGluZGV4IHZzLiBuZXcgYm9uZSBpbmRleFxuXG4gICAgLy8gY3JlYXRlIGEgbmV3IGJvbmUgbWFwXG4gICAgY29uc3QgYXJyYXkgPSBhdHRyaWJ1dGUuYXJyYXk7XG4gICAgZm9yIChsZXQgaSA9IDA7IGkgPCBhcnJheS5sZW5ndGg7IGkrKykge1xuICAgICAgY29uc3QgaW5kZXggPSBhcnJheVtpXTtcblxuICAgICAgLy8gbmV3IHNraW5JbmRleCBidWZmZXJcbiAgICAgIGlmIChib25lSW5kZXhNYXBbaW5kZXhdID09IG51bGwpIHtcbiAgICAgICAgYm9uZUluZGV4TWFwW2luZGV4XSA9IGJvbmVzLmxlbmd0aDtcbiAgICAgICAgYm9uZXMucHVzaChtZXNoLnNrZWxldG9uLmJvbmVzW2luZGV4XSk7XG4gICAgICAgIGJvbmVJbnZlcnNlcy5wdXNoKG1lc2guc2tlbGV0b24uYm9uZUludmVyc2VzW2luZGV4XSk7XG4gICAgICB9XG5cbiAgICAgIGFycmF5W2ldID0gYm9uZUluZGV4TWFwW2luZGV4XTtcbiAgICB9XG5cbiAgICAvLyByZXBsYWNlIHdpdGggbmV3IGluZGljZXNcbiAgICBhdHRyaWJ1dGUuY29weUFycmF5KGFycmF5KTtcbiAgICBhdHRyaWJ1dGUubmVlZHNVcGRhdGUgPSB0cnVlO1xuXG4gICAgLy8gdXBkYXRlIGJvbmVMaXN0XG4gICAgYm9uZXNMaXN0LnNldChtZXNoLCB7IGJvbmVzLCBib25lSW52ZXJzZXMgfSk7XG5cbiAgICAvLyB1cGRhdGUgbWF4IGJvbmVzIGNvdW50XG4gICAgbWF4Qm9uZXMgPSBNYXRoLm1heChtYXhCb25lcywgYm9uZXMubGVuZ3RoKTtcbiAgfVxuXG4gIC8vIExldCdzIGFjdHVhbGx5IHNldCB0aGUgc2tlbGV0b25zXG4gIGZvciAoY29uc3QgbWVzaCBvZiBza2lubmVkTWVzaGVzKSB7XG4gICAgY29uc3QgeyBib25lcywgYm9uZUludmVyc2VzIH0gPSBib25lc0xpc3QuZ2V0KG1lc2gpITtcblxuICAgIC8vIGlmIGBleHBlcmltZW50YWxTYW1lQm9uZUNvdW50c2AgaXMgYHRydWVgLCBjb21wZW5zYXRlIHNrZWxldG9ucyB3aXRoIGR1bW15IGJvbmVzIHRvIGtlZXAgdGhlIGJvbmUgY291bnQgc2FtZSBiZXR3ZWVuIHNrZWxldG9uc1xuICAgIGlmIChleHBlcmltZW50YWxTYW1lQm9uZUNvdW50cykge1xuICAgICAgZm9yIChsZXQgaSA9IGJvbmVzLmxlbmd0aDsgaSA8IG1heEJvbmVzOyBpKyspIHtcbiAgICAgICAgYm9uZXNbaV0gPSBib25lc1swXTtcbiAgICAgICAgYm9uZUludmVyc2VzW2ldID0gYm9uZUludmVyc2VzWzBdO1xuICAgICAgfVxuICAgIH1cblxuICAgIGNvbnN0IHNrZWxldG9uID0gbmV3IFRIUkVFLlNrZWxldG9uKGJvbmVzLCBib25lSW52ZXJzZXMpO1xuICAgIG1lc2guYmluZChza2VsZXRvbiwgbmV3IFRIUkVFLk1hdHJpeDQoKSk7XG4gICAgLy8gICAgICAgICAgICAgICAgICBeXl5eXl5eXl5eXl5eXl5eXl5eIHRyYW5zZm9ybSBvZiBtZXNoZXMgc2hvdWxkIGJlIGlnbm9yZWRcbiAgICAvLyBTZWU6IGh0dHBzOi8vZ2l0aHViLmNvbS9LaHJvbm9zR3JvdXAvZ2xURi90cmVlL21hc3Rlci9zcGVjaWZpY2F0aW9uLzIuMCNza2luc1xuICB9XG59XG4iLCAiaW1wb3J0ICogYXMgVEhSRUUgZnJvbSAndGhyZWUnO1xuaW1wb3J0IHsgQnVmZmVyQXR0cmlidXRlIH0gZnJvbSAndGhyZWUnO1xuXG4vKipcbiAqIFRyYXZlcnNlIGdpdmVuIG9iamVjdCBhbmQgcmVtb3ZlIHVubmVjZXNzYXJ5IHZlcnRpY2VzIGZyb20gZXZlcnkgQnVmZmVyR2VvbWV0cmllcy5cbiAqIFRoaXMgb25seSBwcm9jZXNzZXMgYnVmZmVyIGdlb21ldHJpZXMgd2l0aCBpbmRleCBidWZmZXIuXG4gKlxuICogVGhyZWUuanMgY3JlYXRlcyBtb3JwaCB0ZXh0dXJlcyBmb3IgZWFjaCBnZW9tZXRyaWVzIGFuZCBpdCBzb21ldGltZXMgY29uc3VtZXMgdW5uZWNlc3NhcnkgYW1vdW50IG9mIFZSQU0gZm9yIGNlcnRhaW4gbW9kZWxzLlxuICogVGhpcyBmdW5jdGlvbiB3aWxsIG9wdGltaXplIGdlb21ldHJpZXMgdG8gcmVkdWNlIHRoZSBzaXplIG9mIG1vcnBoIHRleHR1cmUuXG4gKiBTZWU6IGh0dHBzOi8vZ2l0aHViLmNvbS9tcmRvb2IvdGhyZWUuanMvaXNzdWVzLzIzMDk1XG4gKlxuICogQHBhcmFtIHJvb3QgUm9vdCBvYmplY3QgdGhhdCB3aWxsIGJlIHRyYXZlcnNlZFxuICovXG5leHBvcnQgZnVuY3Rpb24gcmVtb3ZlVW5uZWNlc3NhcnlWZXJ0aWNlcyhyb290OiBUSFJFRS5PYmplY3QzRCk6IHZvaWQge1xuICBjb25zdCBnZW9tZXRyeU1hcCA9IG5ldyBNYXA8VEhSRUUuQnVmZmVyR2VvbWV0cnksIFRIUkVFLkJ1ZmZlckdlb21ldHJ5PigpO1xuXG4gIC8vIFRyYXZlcnNlIGFuIGVudGlyZSB0cmVlXG4gIHJvb3QudHJhdmVyc2UoKG9iaikgPT4ge1xuICAgIGlmICghKG9iaiBhcyBhbnkpLmlzTWVzaCkge1xuICAgICAgcmV0dXJuO1xuICAgIH1cblxuICAgIGNvbnN0IG1lc2ggPSBvYmogYXMgVEhSRUUuTWVzaDtcbiAgICBjb25zdCBnZW9tZXRyeSA9IG1lc2guZ2VvbWV0cnk7XG5cbiAgICAvLyBpZiB0aGUgZ2VvbWV0cnkgZG9lcyBub3QgaGF2ZSBhbiBpbmRleCBidWZmZXIgaXQgZG9lcyBub3QgbmVlZCB0byBwcm9jZXNzXG4gICAgY29uc3Qgb3JpZ2lhbmxJbmRleCA9IGdlb21ldHJ5LmluZGV4O1xuICAgIGlmIChvcmlnaWFubEluZGV4ID09IG51bGwpIHtcbiAgICAgIHJldHVybjtcbiAgICB9XG5cbiAgICAvLyBza2lwIGFscmVhZHkgcHJvY2Vzc2VkIGdlb21ldHJ5XG4gICAgY29uc3QgbmV3R2VvbWV0cnlBbHJlYWR5RXhpc3RlZCA9IGdlb21ldHJ5TWFwLmdldChnZW9tZXRyeSk7XG4gICAgaWYgKG5ld0dlb21ldHJ5QWxyZWFkeUV4aXN0ZWQgIT0gbnVsbCkge1xuICAgICAgbWVzaC5nZW9tZXRyeSA9IG5ld0dlb21ldHJ5QWxyZWFkeUV4aXN0ZWQ7XG4gICAgICByZXR1cm47XG4gICAgfVxuXG4gICAgY29uc3QgbmV3R2VvbWV0cnkgPSBuZXcgVEhSRUUuQnVmZmVyR2VvbWV0cnkoKTtcblxuICAgIC8vIGNvcHkgdmFyaW91cyBwcm9wZXJ0aWVzXG4gICAgLy8gUmVmOiBodHRwczovL2dpdGh1Yi5jb20vbXJkb29iL3RocmVlLmpzL2Jsb2IvMWEyNDFlZjEwMDQ4NzcwZDU2ZTA2ZDZjZDZhNjRjNzZjYzcyMGY5NS9zcmMvY29yZS9CdWZmZXJHZW9tZXRyeS5qcyNMMTAxMVxuICAgIG5ld0dlb21ldHJ5Lm5hbWUgPSBnZW9tZXRyeS5uYW1lO1xuXG4gICAgbmV3R2VvbWV0cnkubW9ycGhUYXJnZXRzUmVsYXRpdmUgPSBnZW9tZXRyeS5tb3JwaFRhcmdldHNSZWxhdGl2ZTtcblxuICAgIGdlb21ldHJ5Lmdyb3Vwcy5mb3JFYWNoKChncm91cCkgPT4ge1xuICAgICAgbmV3R2VvbWV0cnkuYWRkR3JvdXAoZ3JvdXAuc3RhcnQsIGdyb3VwLmNvdW50LCBncm91cC5tYXRlcmlhbEluZGV4KTtcbiAgICB9KTtcblxuICAgIG5ld0dlb21ldHJ5LmJvdW5kaW5nQm94ID0gZ2VvbWV0cnkuYm91bmRpbmdCb3g/LmNsb25lKCkgPz8gbnVsbDtcbiAgICBuZXdHZW9tZXRyeS5ib3VuZGluZ1NwaGVyZSA9IGdlb21ldHJ5LmJvdW5kaW5nU3BoZXJlPy5jbG9uZSgpID8/IG51bGw7XG5cbiAgICBuZXdHZW9tZXRyeS5zZXREcmF3UmFuZ2UoZ2VvbWV0cnkuZHJhd1JhbmdlLnN0YXJ0LCBnZW9tZXRyeS5kcmF3UmFuZ2UuY291bnQpO1xuXG4gICAgbmV3R2VvbWV0cnkudXNlckRhdGEgPSBnZW9tZXRyeS51c2VyRGF0YTtcblxuICAgIC8vIHNldCB0byBnZW9tZXRyeU1hcFxuICAgIGdlb21ldHJ5TWFwLnNldChnZW9tZXRyeSwgbmV3R2VvbWV0cnkpO1xuXG4gICAgLyoqIGZyb20gb3JpZ2luYWwgaW5kZXggdG8gbmV3IGluZGV4ICovXG4gICAgY29uc3Qgb3JpZ2luYWxJbmRleE5ld0luZGV4TWFwOiBudW1iZXJbXSA9IFtdO1xuXG4gICAgLyoqIGZyb20gbmV3IGluZGV4IHRvIG9yaWdpbmFsIGluZGV4ICovXG4gICAgY29uc3QgbmV3SW5kZXhPcmlnaW5hbEluZGV4TWFwOiBudW1iZXJbXSA9IFtdO1xuXG4gICAgLy8gcmVvcmdhbml6ZSBpbmRpY2VzXG4gICAge1xuICAgICAgY29uc3Qgb3JpZ2luYWxJbmRleEFycmF5ID0gb3JpZ2lhbmxJbmRleC5hcnJheTtcbiAgICAgIGNvbnN0IG5ld0luZGV4QXJyYXkgPSBuZXcgKG9yaWdpbmFsSW5kZXhBcnJheS5jb25zdHJ1Y3RvciBhcyBhbnkpKG9yaWdpbmFsSW5kZXhBcnJheS5sZW5ndGgpO1xuXG4gICAgICBsZXQgaW5kZXhIZWFkID0gMDtcblxuICAgICAgZm9yIChsZXQgaSA9IDA7IGkgPCBvcmlnaW5hbEluZGV4QXJyYXkubGVuZ3RoOyBpKyspIHtcbiAgICAgICAgY29uc3Qgb3JpZ2luYWxJbmRleCA9IG9yaWdpbmFsSW5kZXhBcnJheVtpXTtcblxuICAgICAgICBsZXQgbmV3SW5kZXggPSBvcmlnaW5hbEluZGV4TmV3SW5kZXhNYXBbb3JpZ2luYWxJbmRleF07XG4gICAgICAgIGlmIChuZXdJbmRleCA9PSBudWxsKSB7XG4gICAgICAgICAgb3JpZ2luYWxJbmRleE5ld0luZGV4TWFwW29yaWdpbmFsSW5kZXhdID0gaW5kZXhIZWFkO1xuICAgICAgICAgIG5ld0luZGV4T3JpZ2luYWxJbmRleE1hcFtpbmRleEhlYWRdID0gb3JpZ2luYWxJbmRleDtcbiAgICAgICAgICBuZXdJbmRleCA9IGluZGV4SGVhZDtcbiAgICAgICAgICBpbmRleEhlYWQrKztcbiAgICAgICAgfVxuICAgICAgICBuZXdJbmRleEFycmF5W2ldID0gbmV3SW5kZXg7XG4gICAgICB9XG5cbiAgICAgIG5ld0dlb21ldHJ5LnNldEluZGV4KG5ldyBCdWZmZXJBdHRyaWJ1dGUobmV3SW5kZXhBcnJheSwgMSwgZmFsc2UpKTtcbiAgICB9XG5cbiAgICAvLyByZW9yZ2FuaXplIGF0dHJpYnV0ZXNcbiAgICBPYmplY3Qua2V5cyhnZW9tZXRyeS5hdHRyaWJ1dGVzKS5mb3JFYWNoKChhdHRyaWJ1dGVOYW1lKSA9PiB7XG4gICAgICBjb25zdCBvcmlnaW5hbEF0dHJpYnV0ZSA9IGdlb21ldHJ5LmF0dHJpYnV0ZXNbYXR0cmlidXRlTmFtZV0gYXMgVEhSRUUuQnVmZmVyQXR0cmlidXRlO1xuXG4gICAgICBpZiAoKG9yaWdpbmFsQXR0cmlidXRlIGFzIGFueSkuaXNJbnRlcmxlYXZlZEJ1ZmZlckF0dHJpYnV0ZSkge1xuICAgICAgICB0aHJvdyBuZXcgRXJyb3IoJ3JlbW92ZVVubmVjZXNzYXJ5VmVydGljZXM6IEludGVybGVhdmVkQnVmZmVyQXR0cmlidXRlIGlzIG5vdCBzdXBwb3J0ZWQnKTtcbiAgICAgIH1cblxuICAgICAgY29uc3Qgb3JpZ2luYWxBdHRyaWJ1dGVBcnJheSA9IG9yaWdpbmFsQXR0cmlidXRlLmFycmF5O1xuICAgICAgY29uc3QgeyBpdGVtU2l6ZSwgbm9ybWFsaXplZCB9ID0gb3JpZ2luYWxBdHRyaWJ1dGU7XG5cbiAgICAgIGNvbnN0IG5ld0F0dHJpYnV0ZUFycmF5ID0gbmV3IChvcmlnaW5hbEF0dHJpYnV0ZUFycmF5LmNvbnN0cnVjdG9yIGFzIGFueSkoXG4gICAgICAgIG5ld0luZGV4T3JpZ2luYWxJbmRleE1hcC5sZW5ndGggKiBpdGVtU2l6ZSxcbiAgICAgICk7XG5cbiAgICAgIG5ld0luZGV4T3JpZ2luYWxJbmRleE1hcC5mb3JFYWNoKChvcmlnaW5hbEluZGV4LCBpKSA9PiB7XG4gICAgICAgIGZvciAobGV0IGogPSAwOyBqIDwgaXRlbVNpemU7IGorKykge1xuICAgICAgICAgIG5ld0F0dHJpYnV0ZUFycmF5W2kgKiBpdGVtU2l6ZSArIGpdID0gb3JpZ2luYWxBdHRyaWJ1dGVBcnJheVtvcmlnaW5hbEluZGV4ICogaXRlbVNpemUgKyBqXTtcbiAgICAgICAgfVxuICAgICAgfSk7XG5cbiAgICAgIG5ld0dlb21ldHJ5LnNldEF0dHJpYnV0ZShhdHRyaWJ1dGVOYW1lLCBuZXcgQnVmZmVyQXR0cmlidXRlKG5ld0F0dHJpYnV0ZUFycmF5LCBpdGVtU2l6ZSwgbm9ybWFsaXplZCkpO1xuICAgIH0pO1xuXG4gICAgLy8gcmVvcmdhbml6ZSBtb3JwaCBhdHRyaWJ1dGVzXG4gICAgLyoqIFRydWUgaWYgYWxsIG1vcnBocyBhcmUgemVyby4gKi9cbiAgICBsZXQgaXNOdWxsTW9ycGggPSB0cnVlO1xuXG4gICAgT2JqZWN0LmtleXMoZ2VvbWV0cnkubW9ycGhBdHRyaWJ1dGVzKS5mb3JFYWNoKChhdHRyaWJ1dGVOYW1lKSA9PiB7XG4gICAgICBuZXdHZW9tZXRyeS5tb3JwaEF0dHJpYnV0ZXNbYXR0cmlidXRlTmFtZV0gPSBbXTtcblxuICAgICAgY29uc3QgbW9ycGhzID0gZ2VvbWV0cnkubW9ycGhBdHRyaWJ1dGVzW2F0dHJpYnV0ZU5hbWVdO1xuICAgICAgZm9yIChsZXQgaU1vcnBoID0gMDsgaU1vcnBoIDwgbW9ycGhzLmxlbmd0aDsgaU1vcnBoKyspIHtcbiAgICAgICAgY29uc3Qgb3JpZ2luYWxBdHRyaWJ1dGUgPSBtb3JwaHNbaU1vcnBoXSBhcyBUSFJFRS5CdWZmZXJBdHRyaWJ1dGU7XG5cbiAgICAgICAgaWYgKChvcmlnaW5hbEF0dHJpYnV0ZSBhcyBhbnkpLmlzSW50ZXJsZWF2ZWRCdWZmZXJBdHRyaWJ1dGUpIHtcbiAgICAgICAgICB0aHJvdyBuZXcgRXJyb3IoJ3JlbW92ZVVubmVjZXNzYXJ5VmVydGljZXM6IEludGVybGVhdmVkQnVmZmVyQXR0cmlidXRlIGlzIG5vdCBzdXBwb3J0ZWQnKTtcbiAgICAgICAgfVxuXG4gICAgICAgIGNvbnN0IG9yaWdpbmFsQXR0cmlidXRlQXJyYXkgPSBvcmlnaW5hbEF0dHJpYnV0ZS5hcnJheTtcbiAgICAgICAgY29uc3QgeyBpdGVtU2l6ZSwgbm9ybWFsaXplZCB9ID0gb3JpZ2luYWxBdHRyaWJ1dGU7XG5cbiAgICAgICAgY29uc3QgbmV3QXR0cmlidXRlQXJyYXkgPSBuZXcgKG9yaWdpbmFsQXR0cmlidXRlQXJyYXkuY29uc3RydWN0b3IgYXMgYW55KShcbiAgICAgICAgICBuZXdJbmRleE9yaWdpbmFsSW5kZXhNYXAubGVuZ3RoICogaXRlbVNpemUsXG4gICAgICAgICk7XG5cbiAgICAgICAgbmV3SW5kZXhPcmlnaW5hbEluZGV4TWFwLmZvckVhY2goKG9yaWdpbmFsSW5kZXgsIGkpID0+IHtcbiAgICAgICAgICBmb3IgKGxldCBqID0gMDsgaiA8IGl0ZW1TaXplOyBqKyspIHtcbiAgICAgICAgICAgIG5ld0F0dHJpYnV0ZUFycmF5W2kgKiBpdGVtU2l6ZSArIGpdID0gb3JpZ2luYWxBdHRyaWJ1dGVBcnJheVtvcmlnaW5hbEluZGV4ICogaXRlbVNpemUgKyBqXTtcbiAgICAgICAgICB9XG4gICAgICAgIH0pO1xuXG4gICAgICAgIGlzTnVsbE1vcnBoID0gaXNOdWxsTW9ycGggJiYgbmV3QXR0cmlidXRlQXJyYXkuZXZlcnkoKHY6IG51bWJlcikgPT4gdiA9PT0gMCk7XG5cbiAgICAgICAgbmV3R2VvbWV0cnkubW9ycGhBdHRyaWJ1dGVzW2F0dHJpYnV0ZU5hbWVdW2lNb3JwaF0gPSBuZXcgQnVmZmVyQXR0cmlidXRlKFxuICAgICAgICAgIG5ld0F0dHJpYnV0ZUFycmF5LFxuICAgICAgICAgIGl0ZW1TaXplLFxuICAgICAgICAgIG5vcm1hbGl6ZWQsXG4gICAgICAgICk7XG4gICAgICB9XG4gICAgfSk7XG5cbiAgICAvLyBJZiBhbGwgbW9ycGhzIGFyZSB6ZXJvLCBqdXN0IGRpc2NhcmQgdGhlIG1vcnBoIGF0dHJpYnV0ZXMgd2UndmUganVzdCBtYWRlXG4gICAgaWYgKGlzTnVsbE1vcnBoKSB7XG4gICAgICBuZXdHZW9tZXRyeS5tb3JwaEF0dHJpYnV0ZXMgPSB7fTtcbiAgICB9XG5cbiAgICBtZXNoLmdlb21ldHJ5ID0gbmV3R2VvbWV0cnk7XG4gIH0pO1xuXG4gIEFycmF5LmZyb20oZ2VvbWV0cnlNYXAua2V5cygpKS5mb3JFYWNoKChvcmlnaW5hbEdlb21ldHJ5KSA9PiB7XG4gICAgb3JpZ2luYWxHZW9tZXRyeS5kaXNwb3NlKCk7XG4gIH0pO1xufVxuIiwgImltcG9ydCB7IFZSTSB9IGZyb20gJy4uL1ZSTSc7XG5cbi8qKlxuICogSWYgdGhlIGdpdmVuIFZSTSBpcyBWUk0wLjAsIHJvdGF0ZSB0aGUgYHZybS5zY2VuZWAgYnkgMTgwIGRlZ3JlZXMgYXJvdW5kIHRoZSBZIGF4aXMuXG4gKlxuICogQHBhcmFtIHZybSBUaGUgdGFyZ2V0IFZSTVxuICovXG5leHBvcnQgZnVuY3Rpb24gcm90YXRlVlJNMCh2cm06IFZSTSk6IHZvaWQge1xuICBpZiAodnJtLm1ldGE/Lm1ldGFWZXJzaW9uID09PSAnMCcpIHtcbiAgICB2cm0uc2NlbmUucm90YXRpb24ueSA9IE1hdGguUEk7XG4gIH1cbn1cbiIsICJpbXBvcnQgeyBkZWVwRGlzcG9zZSB9IGZyb20gJy4vZGVlcERpc3Bvc2UnO1xuaW1wb3J0IHsgcmVtb3ZlVW5uZWNlc3NhcnlKb2ludHMgfSBmcm9tICcuL3JlbW92ZVVubmVjZXNzYXJ5Sm9pbnRzJztcbmltcG9ydCB7IHJlbW92ZVVubmVjZXNzYXJ5VmVydGljZXMgfSBmcm9tICcuL3JlbW92ZVVubmVjZXNzYXJ5VmVydGljZXMnO1xuaW1wb3J0IHsgcm90YXRlVlJNMCB9IGZyb20gJy4vcm90YXRlVlJNMCc7XG5cbmV4cG9ydCBjbGFzcyBWUk1VdGlscyB7XG4gIHByaXZhdGUgY29uc3RydWN0b3IoKSB7XG4gICAgLy8gdGhpcyBjbGFzcyBpcyBub3QgbWVhbnQgdG8gYmUgaW5zdGFudGlhdGVkXG4gIH1cblxuICBwdWJsaWMgc3RhdGljIGRlZXBEaXNwb3NlID0gZGVlcERpc3Bvc2U7XG4gIHB1YmxpYyBzdGF0aWMgcmVtb3ZlVW5uZWNlc3NhcnlKb2ludHMgPSByZW1vdmVVbm5lY2Vzc2FyeUpvaW50cztcbiAgcHVibGljIHN0YXRpYyByZW1vdmVVbm5lY2Vzc2FyeVZlcnRpY2VzID0gcmVtb3ZlVW5uZWNlc3NhcnlWZXJ0aWNlcztcbiAgcHVibGljIHN0YXRpYyByb3RhdGVWUk0wID0gcm90YXRlVlJNMDtcbn1cbiJdLAogICJtYXBwaW5ncyI6ICI7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtB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Sk8sU0FBUyxXQUFXLEtBQWdCO0FBUDNDO0FBUUUsUUFBSSxTQUFJLFNBQUosbUJBQVUsaUJBQWdCLEtBQUs7QUFDakMsUUFBSSxNQUFNLFNBQVMsSUFBSSxLQUFLO0FBQUEsRUFDOUI7QUFDRjs7O0FDTk8sSUFBTSxXQUFOLE1BQWU7QUFBQSxFQUNaLGNBQWM7QUFBQSxFQUV0QjtBQU1GO0FBVGEsU0FLRyxjQUFjO0FBTGpCLFNBTUcsMEJBQTBCO0FBTjdCLFNBT0csNEJBQTRCO0FBUC9CLFNBUUcsYUFBYTsiLAogICJuYW1lcyI6IFsiX19hc3luYyIsICJfVlJNRXhwcmVzc2lvbk1hdGVyaWFsQ29sb3JCaW5kIiwgIl9WUk1FeHByZXNzaW9uVGV4dHVyZVRyYW5zZm9ybUJpbmQiLCAiX2EiLCAiX1ZSTUV4cHJlc3Npb25Mb2FkZXJQbHVnaW4iLCAiX2IiLCAiX1ZSTUZpcnN0UGVyc29uIiwgIlBPU1NJQkxFX1NQRUNfVkVSU0lPTlMiLCAiX3YzQSIsICJfcXVhdEEiLCAiX3YzQiIsICJfcXVhdEIiLCAiX1ZSTUxvb2tBdCIsICJWRUMzX1BPU0lUSVZFX1oiLCAiX2V1bGVyQSIsICJUSFJFRTUiLCAiVEhSRUUyIiwgIlRIUkVFIiwgIlRIUkVFNCIsICJUSFJFRTMiLCAiX19hc3luYyIsICJtdG9vbl9kZWZhdWx0IiwgIlBPU1NJQkxFX1NQRUNfVkVSU0lPTlMiLCAiX01Ub29uTWF0ZXJpYWxMb2FkZXJQbHVnaW4iLCAiX1ZSTU1hdGVyaWFsc0hEUkVtaXNzaXZlTXVsdGlwbGllckxvYWRlclBsdWdpbiIsICJfX2FzeW5jIiwgIlRIUkVFIiwgIl9fYXN5bmMiLCAiX2EiLCAiX19zcHJlYWRWYWx1ZXMiLCAiVEhSRUUiLCAiVEhSRUUzIiwgIlRIUkVFMiIsICJUSFJFRTQiLCAiVEhSRUU1IiwgIl92M0EiLCAiX3YzQiIsICJxdWF0SW52ZXJ0Q29tcGF0IiwgIl92M0MiLCAiX3F1YXRBIiwgIl9xdWF0QiIsICJfcXVhdEMiLCAiY29uc3RyYWludCIsICJQT1NTSUJMRV9TUEVDX1ZFUlNJT05TIiwgIl9WUk1Ob2RlQ29uc3RyYWludExvYWRlclBsdWdpbiIsICJfX2FzeW5jIiwgIl9hIiwgIlRIUkVFNyIsICJUSFJFRSIsICJUSFJFRTIiLCAiVEhSRUUzIiwgIlRIUkVFNCIsICJUSFJFRTUiLCAiVEhSRUU2IiwgIlRIUkVFOSIsICJUSFJFRTgiLCAiVEhSRUUxMCIsICJUSFJFRTEzIiwgIlRIUkVFMTEiLCAiVEhSRUUxMiIsICJUSFJFRTE0IiwgIl92M0EiLCAiX3YzQiIsICJfdjNDIiwgIl9xdWF0QSIsICJfbWF0QSIsICJ0cmF2ZXJzZUFuY2VzdG9yc0Zyb21Sb290IiwgInNwcmluZ0JvbmUiLCAiUE9TU0lCTEVfU1BFQ19WRVJTSU9OUyIsICJfVlJNU3ByaW5nQm9uZUxvYWRlclBsdWdpbiIsICJfX2FzeW5jIiwgIl9hIiwgIl9iIiwgIl9jIiwgIl9kIiwgIl9lIiwgIm1hdGVyaWFsIiwgIlRIUkVFIiwgIlRIUkVFIl0KfQo=
