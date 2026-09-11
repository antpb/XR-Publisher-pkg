//! Marching cubes mesh generation — bit-exact port of
//! `src/components/core/front/marchingCubes.ts::generateMeshFromSDF`.
//!
//! Determinism notes (load-bearing — must match the JS path so meshes are
//! identical across the WASM↔JS-fallback boundary and across peers):
//!   * The scalar field is stored as `f32` (JS uses `Float32Array`). The
//!     SDF is computed in f64 then truncated to f32 before storage, so the
//!     edge-interpolation `t = f0/(f0-f1)` divides f32-precision operands —
//!     matching JS exactly. Sign tests near zero therefore agree.
//!   * Edge-vertex positions are stored f32 (JS `ev = new Float32Array(36)`).
//!   * The vertex weld key uses `floor(coord/tol + 0.5)` to replicate JS
//!     `Math.round` (round-half-up), not Rust's round-half-away-from-zero.
//!
//! Tables (EDGE_TABLE / TRI_TABLE) are auto-extracted from the TS source.

// Auto-extracted from marchingCubes.ts — DO NOT hand-edit.
pub const EDGE_TABLE: [i32; 256] = [
    0, 265, 515, 778, 1030, 1295, 1541, 1804, 2060, 2309, 2575, 2822, 3082, 3331, 3593, 3840,
    400, 153, 915, 666, 1430, 1183, 1941, 1692, 2460, 2197, 2975, 2710, 3482, 3219, 3993, 3728,
    560, 825, 51, 314, 1590, 1855, 1077, 1340, 2620, 2869, 2111, 2358, 3642, 3891, 3129, 3376,
    928, 681, 419, 170, 1958, 1711, 1445, 1196, 2988, 2725, 2479, 2214, 4010, 3747, 3497, 3232,
    1120, 1385, 1635, 1898, 102, 367, 613, 876, 3180, 3429, 3695, 3942, 2154, 2403, 2665, 2912,
    1520, 1273, 2035, 1786, 502, 255, 1013, 764, 3580, 3317, 4095, 3830, 2554, 2291, 3065, 2800,
    1616, 1881, 1107, 1370, 598, 863, 85, 348, 3676, 3925, 3167, 3414, 2650, 2899, 2137, 2384,
    1984, 1737, 1475, 1226, 966, 719, 453, 204, 4044, 3781, 3535, 3270, 3018, 2755, 2505, 2240,
    2240, 2505, 2755, 3018, 3270, 3535, 3781, 4044, 204, 453, 719, 966, 1226, 1475, 1737, 1984,
    2384, 2137, 2899, 2650, 3414, 3167, 3925, 3676, 348, 85, 863, 598, 1370, 1107, 1881, 1616,
    2800, 3065, 2291, 2554, 3830, 4095, 3317, 3580, 764, 1013, 255, 502, 1786, 2035, 1273, 1520,
    2912, 2665, 2403, 2154, 3942, 3695, 3429, 3180, 876, 613, 367, 102, 1898, 1635, 1385, 1120,
    3232, 3497, 3747, 4010, 2214, 2479, 2725, 2988, 1196, 1445, 1711, 1958, 170, 419, 681, 928,
    3376, 3129, 3891, 3642, 2358, 2111, 2869, 2620, 1340, 1077, 1855, 1590, 314, 51, 825, 560,
    3728, 3993, 3219, 3482, 2710, 2975, 2197, 2460, 1692, 1941, 1183, 1430, 666, 915, 153, 400,
    3840, 3593, 3331, 3082, 2822, 2575, 2309, 2060, 1804, 1541, 1295, 1030, 778, 515, 265, 0,
];

pub const TRI_TABLE: [i32; 4096] = [
    -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1,
    0, 8, 3, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1,
    0, 1, 9, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1,
    1, 8, 3, 9, 8, 1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1,
    1, 2, 10, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1,
    0, 8, 3, 1, 2, 10, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1,
    9, 2, 10, 0, 2, 9, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1,
    2, 8, 3, 2, 10, 8, 10, 9, 8, -1, -1, -1, -1, -1, -1, -1,
    3, 11, 2, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1,
    0, 11, 2, 8, 11, 0, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1,
    1, 9, 0, 2, 3, 11, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1,
    1, 11, 2, 1, 9, 11, 9, 8, 11, -1, -1, -1, -1, -1, -1, -1,
    3, 10, 1, 11, 10, 3, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1,
    0, 10, 1, 0, 8, 10, 8, 11, 10, -1, -1, -1, -1, -1, -1, -1,
    3, 9, 0, 3, 11, 9, 11, 10, 9, -1, -1, -1, -1, -1, -1, -1,
    9, 8, 10, 10, 8, 11, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1,
    4, 7, 8, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1,
    4, 3, 0, 7, 3, 4, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1,
    0, 1, 9, 8, 4, 7, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1,
    4, 1, 9, 4, 7, 1, 7, 3, 1, -1, -1, -1, -1, -1, -1, -1,
    1, 2, 10, 8, 4, 7, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1,
    3, 4, 7, 3, 0, 4, 1, 2, 10, -1, -1, -1, -1, -1, -1, -1,
    9, 2, 10, 9, 0, 2, 8, 4, 7, -1, -1, -1, -1, -1, -1, -1,
    2, 10, 9, 2, 9, 7, 2, 7, 3, 7, 9, 4, -1, -1, -1, -1,
    8, 4, 7, 3, 11, 2, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1,
    11, 4, 7, 11, 2, 4, 2, 0, 4, -1, -1, -1, -1, -1, -1, -1,
    9, 0, 1, 8, 4, 7, 2, 3, 11, -1, -1, -1, -1, -1, -1, -1,
    4, 7, 11, 9, 4, 11, 9, 11, 2, 9, 2, 1, -1, -1, -1, -1,
    3, 10, 1, 3, 11, 10, 7, 8, 4, -1, -1, -1, -1, -1, -1, -1,
    1, 11, 10, 1, 4, 11, 1, 0, 4, 7, 11, 4, -1, -1, -1, -1,
    4, 7, 8, 9, 0, 11, 9, 11, 10, 11, 0, 3, -1, -1, -1, -1,
    4, 7, 11, 4, 11, 9, 9, 11, 10, -1, -1, -1, -1, -1, -1, -1,
    9, 5, 4, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1,
    9, 5, 4, 0, 8, 3, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1,
    0, 5, 4, 1, 5, 0, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1,
    8, 5, 4, 8, 3, 5, 3, 1, 5, -1, -1, -1, -1, -1, -1, -1,
    1, 2, 10, 9, 5, 4, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1,
    3, 0, 8, 1, 2, 10, 4, 9, 5, -1, -1, -1, -1, -1, -1, -1,
    5, 2, 10, 5, 4, 2, 4, 0, 2, -1, -1, -1, -1, -1, -1, -1,
    2, 10, 5, 3, 2, 5, 3, 5, 4, 3, 4, 8, -1, -1, -1, -1,
    9, 5, 4, 2, 3, 11, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1,
    0, 11, 2, 0, 8, 11, 4, 9, 5, -1, -1, -1, -1, -1, -1, -1,
    0, 5, 4, 0, 1, 5, 2, 3, 11, -1, -1, -1, -1, -1, -1, -1,
    2, 1, 5, 2, 5, 8, 2, 8, 11, 4, 8, 5, -1, -1, -1, -1,
    10, 3, 11, 10, 1, 3, 9, 5, 4, -1, -1, -1, -1, -1, -1, -1,
    4, 9, 5, 0, 8, 1, 8, 10, 1, 8, 11, 10, -1, -1, -1, -1,
    5, 4, 0, 5, 0, 11, 5, 11, 10, 11, 0, 3, -1, -1, -1, -1,
    5, 4, 8, 5, 8, 10, 10, 8, 11, -1, -1, -1, -1, -1, -1, -1,
    9, 7, 8, 5, 7, 9, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1,
    9, 3, 0, 9, 5, 3, 5, 7, 3, -1, -1, -1, -1, -1, -1, -1,
    0, 7, 8, 0, 1, 7, 1, 5, 7, -1, -1, -1, -1, -1, -1, -1,
    1, 5, 3, 3, 5, 7, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1,
    9, 7, 8, 9, 5, 7, 10, 1, 2, -1, -1, -1, -1, -1, -1, -1,
    10, 1, 2, 9, 5, 0, 5, 3, 0, 5, 7, 3, -1, -1, -1, -1,
    8, 0, 2, 8, 2, 5, 8, 5, 7, 10, 5, 2, -1, -1, -1, -1,
    2, 10, 5, 2, 5, 3, 3, 5, 7, -1, -1, -1, -1, -1, -1, -1,
    7, 9, 5, 7, 8, 9, 3, 11, 2, -1, -1, -1, -1, -1, -1, -1,
    9, 5, 7, 9, 7, 2, 9, 2, 0, 2, 7, 11, -1, -1, -1, -1,
    2, 3, 11, 0, 1, 8, 1, 7, 8, 1, 5, 7, -1, -1, -1, -1,
    11, 2, 1, 11, 1, 7, 7, 1, 5, -1, -1, -1, -1, -1, -1, -1,
    9, 5, 8, 8, 5, 7, 10, 1, 3, 10, 3, 11, -1, -1, -1, -1,
    5, 7, 0, 5, 0, 9, 7, 11, 0, 1, 0, 10, 11, 10, 0, -1,
    11, 10, 0, 11, 0, 3, 10, 5, 0, 8, 0, 7, 5, 7, 0, -1,
    11, 10, 5, 7, 11, 5, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1,
    10, 6, 5, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1,
    0, 8, 3, 5, 10, 6, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1,
    9, 0, 1, 5, 10, 6, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1,
    1, 8, 3, 1, 9, 8, 5, 10, 6, -1, -1, -1, -1, -1, -1, -1,
    1, 6, 5, 2, 6, 1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1,
    1, 6, 5, 1, 2, 6, 3, 0, 8, -1, -1, -1, -1, -1, -1, -1,
    9, 6, 5, 9, 0, 6, 0, 2, 6, -1, -1, -1, -1, -1, -1, -1,
    5, 9, 8, 5, 8, 2, 5, 2, 6, 3, 2, 8, -1, -1, -1, -1,
    2, 3, 11, 10, 6, 5, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1,
    11, 0, 8, 11, 2, 0, 10, 6, 5, -1, -1, -1, -1, -1, -1, -1,
    0, 1, 9, 2, 3, 11, 5, 10, 6, -1, -1, -1, -1, -1, -1, -1,
    5, 10, 6, 1, 9, 2, 9, 11, 2, 9, 8, 11, -1, -1, -1, -1,
    6, 3, 11, 6, 5, 3, 5, 1, 3, -1, -1, -1, -1, -1, -1, -1,
    0, 8, 11, 0, 11, 5, 0, 5, 1, 5, 11, 6, -1, -1, -1, -1,
    3, 11, 6, 0, 3, 6, 0, 6, 5, 0, 5, 9, -1, -1, -1, -1,
    6, 5, 9, 6, 9, 11, 11, 9, 8, -1, -1, -1, -1, -1, -1, -1,
    5, 10, 6, 4, 7, 8, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1,
    4, 3, 0, 4, 7, 3, 6, 5, 10, -1, -1, -1, -1, -1, -1, -1,
    1, 9, 0, 5, 10, 6, 8, 4, 7, -1, -1, -1, -1, -1, -1, -1,
    10, 6, 5, 1, 9, 7, 1, 7, 3, 7, 9, 4, -1, -1, -1, -1,
    6, 1, 2, 6, 5, 1, 4, 7, 8, -1, -1, -1, -1, -1, -1, -1,
    1, 2, 5, 5, 2, 6, 3, 0, 4, 3, 4, 7, -1, -1, -1, -1,
    8, 4, 7, 9, 0, 5, 0, 6, 5, 0, 2, 6, -1, -1, -1, -1,
    7, 3, 9, 7, 9, 4, 3, 2, 9, 5, 9, 6, 2, 6, 9, -1,
    3, 11, 2, 7, 8, 4, 10, 6, 5, -1, -1, -1, -1, -1, -1, -1,
    5, 10, 6, 4, 7, 2, 4, 2, 0, 2, 7, 11, -1, -1, -1, -1,
    0, 1, 9, 4, 7, 8, 2, 3, 11, 5, 10, 6, -1, -1, -1, -1,
    9, 2, 1, 9, 11, 2, 9, 4, 11, 7, 11, 4, 5, 10, 6, -1,
    8, 4, 7, 3, 11, 5, 3, 5, 1, 5, 11, 6, -1, -1, -1, -1,
    5, 1, 11, 5, 11, 6, 1, 0, 11, 7, 11, 4, 0, 4, 11, -1,
    0, 5, 9, 0, 6, 5, 0, 3, 6, 11, 6, 3, 8, 4, 7, -1,
    6, 5, 9, 6, 9, 11, 4, 7, 9, 7, 11, 9, -1, -1, -1, -1,
    10, 4, 9, 6, 4, 10, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1,
    4, 10, 6, 4, 9, 10, 0, 8, 3, -1, -1, -1, -1, -1, -1, -1,
    10, 0, 1, 10, 6, 0, 6, 4, 0, -1, -1, -1, -1, -1, -1, -1,
    8, 3, 1, 8, 1, 6, 8, 6, 4, 6, 1, 10, -1, -1, -1, -1,
    1, 4, 9, 1, 2, 4, 2, 6, 4, -1, -1, -1, -1, -1, -1, -1,
    3, 0, 8, 1, 2, 9, 2, 4, 9, 2, 6, 4, -1, -1, -1, -1,
    0, 2, 4, 4, 2, 6, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1,
    8, 3, 2, 8, 2, 4, 4, 2, 6, -1, -1, -1, -1, -1, -1, -1,
    10, 4, 9, 10, 6, 4, 11, 2, 3, -1, -1, -1, -1, -1, -1, -1,
    0, 8, 2, 2, 8, 11, 4, 9, 10, 4, 10, 6, -1, -1, -1, -1,
    3, 11, 2, 0, 1, 6, 0, 6, 4, 6, 1, 10, -1, -1, -1, -1,
    6, 4, 1, 6, 1, 10, 4, 8, 1, 2, 1, 11, 8, 11, 1, -1,
    9, 6, 4, 9, 3, 6, 9, 1, 3, 11, 6, 3, -1, -1, -1, -1,
    8, 11, 1, 8, 1, 0, 11, 6, 1, 9, 1, 4, 6, 4, 1, -1,
    3, 11, 6, 3, 6, 0, 0, 6, 4, -1, -1, -1, -1, -1, -1, -1,
    6, 4, 8, 11, 6, 8, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1,
    7, 10, 6, 7, 8, 10, 8, 9, 10, -1, -1, -1, -1, -1, -1, -1,
    0, 7, 3, 0, 10, 7, 0, 9, 10, 6, 7, 10, -1, -1, -1, -1,
    10, 6, 7, 1, 10, 7, 1, 7, 8, 1, 8, 0, -1, -1, -1, -1,
    10, 6, 7, 10, 7, 1, 1, 7, 3, -1, -1, -1, -1, -1, -1, -1,
    1, 2, 6, 1, 6, 8, 1, 8, 9, 8, 6, 7, -1, -1, -1, -1,
    2, 6, 9, 2, 9, 1, 6, 7, 9, 0, 9, 3, 7, 3, 9, -1,
    7, 8, 0, 7, 0, 6, 6, 0, 2, -1, -1, -1, -1, -1, -1, -1,
    7, 3, 2, 6, 7, 2, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1,
    2, 3, 11, 10, 6, 8, 10, 8, 9, 8, 6, 7, -1, -1, -1, -1,
    2, 0, 7, 2, 7, 11, 0, 9, 7, 6, 7, 10, 9, 10, 7, -1,
    1, 8, 0, 1, 7, 8, 1, 10, 7, 6, 7, 10, 2, 3, 11, -1,
    11, 2, 1, 11, 1, 7, 10, 6, 1, 6, 7, 1, -1, -1, -1, -1,
    8, 9, 6, 8, 6, 7, 9, 1, 6, 11, 6, 3, 1, 3, 6, -1,
    0, 9, 1, 11, 6, 7, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1,
    7, 8, 0, 7, 0, 6, 3, 11, 0, 11, 6, 0, -1, -1, -1, -1,
    7, 11, 6, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1,
    7, 6, 11, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1,
    3, 0, 8, 11, 7, 6, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1,
    0, 1, 9, 11, 7, 6, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1,
    8, 1, 9, 8, 3, 1, 11, 7, 6, -1, -1, -1, -1, -1, -1, -1,
    10, 1, 2, 6, 11, 7, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1,
    1, 2, 10, 3, 0, 8, 6, 11, 7, -1, -1, -1, -1, -1, -1, -1,
    2, 9, 0, 2, 10, 9, 6, 11, 7, -1, -1, -1, -1, -1, -1, -1,
    6, 11, 7, 2, 10, 3, 10, 8, 3, 10, 9, 8, -1, -1, -1, -1,
    7, 2, 3, 6, 2, 7, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1,
    7, 0, 8, 7, 6, 0, 6, 2, 0, -1, -1, -1, -1, -1, -1, -1,
    2, 7, 6, 2, 3, 7, 0, 1, 9, -1, -1, -1, -1, -1, -1, -1,
    1, 6, 2, 1, 8, 6, 1, 9, 8, 8, 7, 6, -1, -1, -1, -1,
    10, 7, 6, 10, 1, 7, 1, 3, 7, -1, -1, -1, -1, -1, -1, -1,
    10, 7, 6, 1, 7, 10, 1, 8, 7, 1, 0, 8, -1, -1, -1, -1,
    0, 3, 7, 0, 7, 10, 0, 10, 9, 6, 10, 7, -1, -1, -1, -1,
    7, 6, 10, 7, 10, 8, 8, 10, 9, -1, -1, -1, -1, -1, -1, -1,
    6, 8, 4, 11, 8, 6, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1,
    3, 6, 11, 3, 0, 6, 0, 4, 6, -1, -1, -1, -1, -1, -1, -1,
    8, 6, 11, 8, 4, 6, 9, 0, 1, -1, -1, -1, -1, -1, -1, -1,
    9, 4, 6, 9, 6, 3, 9, 3, 1, 11, 3, 6, -1, -1, -1, -1,
    6, 8, 4, 6, 11, 8, 2, 10, 1, -1, -1, -1, -1, -1, -1, -1,
    1, 2, 10, 3, 0, 11, 0, 6, 11, 0, 4, 6, -1, -1, -1, -1,
    4, 11, 8, 4, 6, 11, 0, 2, 9, 2, 10, 9, -1, -1, -1, -1,
    10, 9, 3, 10, 3, 2, 9, 4, 3, 11, 3, 6, 4, 6, 3, -1,
    8, 2, 3, 8, 4, 2, 4, 6, 2, -1, -1, -1, -1, -1, -1, -1,
    0, 4, 2, 4, 6, 2, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1,
    1, 9, 0, 2, 3, 4, 2, 4, 6, 4, 3, 8, -1, -1, -1, -1,
    1, 9, 4, 1, 4, 2, 2, 4, 6, -1, -1, -1, -1, -1, -1, -1,
    8, 1, 3, 8, 6, 1, 8, 4, 6, 6, 10, 1, -1, -1, -1, -1,
    10, 1, 0, 10, 0, 6, 6, 0, 4, -1, -1, -1, -1, -1, -1, -1,
    4, 6, 3, 4, 3, 8, 6, 10, 3, 0, 3, 9, 10, 9, 3, -1,
    10, 9, 4, 6, 10, 4, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1,
    4, 9, 5, 7, 6, 11, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1,
    0, 8, 3, 4, 9, 5, 11, 7, 6, -1, -1, -1, -1, -1, -1, -1,
    5, 0, 1, 5, 4, 0, 7, 6, 11, -1, -1, -1, -1, -1, -1, -1,
    11, 7, 6, 8, 3, 4, 3, 5, 4, 3, 1, 5, -1, -1, -1, -1,
    9, 5, 4, 10, 1, 2, 7, 6, 11, -1, -1, -1, -1, -1, -1, -1,
    6, 11, 7, 1, 2, 10, 0, 8, 3, 4, 9, 5, -1, -1, -1, -1,
    7, 6, 11, 5, 4, 10, 4, 2, 10, 4, 0, 2, -1, -1, -1, -1,
    3, 4, 8, 3, 5, 4, 3, 2, 5, 10, 5, 2, 11, 7, 6, -1,
    7, 2, 3, 7, 6, 2, 5, 4, 9, -1, -1, -1, -1, -1, -1, -1,
    9, 5, 4, 0, 8, 6, 0, 6, 2, 6, 8, 7, -1, -1, -1, -1,
    3, 6, 2, 3, 7, 6, 1, 5, 0, 5, 4, 0, -1, -1, -1, -1,
    6, 2, 8, 6, 8, 7, 2, 1, 8, 4, 8, 5, 1, 5, 8, -1,
    9, 5, 4, 10, 1, 6, 1, 7, 6, 1, 3, 7, -1, -1, -1, -1,
    1, 6, 10, 1, 7, 6, 1, 0, 7, 8, 7, 0, 9, 5, 4, -1,
    4, 0, 10, 4, 10, 5, 0, 3, 10, 6, 10, 7, 3, 7, 10, -1,
    7, 6, 10, 7, 10, 8, 5, 4, 10, 4, 8, 10, -1, -1, -1, -1,
    6, 9, 5, 6, 11, 9, 11, 8, 9, -1, -1, -1, -1, -1, -1, -1,
    3, 6, 11, 0, 6, 3, 0, 5, 6, 0, 9, 5, -1, -1, -1, -1,
    0, 11, 8, 0, 5, 11, 0, 1, 5, 5, 6, 11, -1, -1, -1, -1,
    6, 11, 3, 6, 3, 5, 5, 3, 1, -1, -1, -1, -1, -1, -1, -1,
    1, 2, 10, 9, 5, 11, 9, 11, 8, 11, 5, 6, -1, -1, -1, -1,
    0, 11, 3, 0, 6, 11, 0, 9, 6, 5, 6, 9, 1, 2, 10, -1,
    11, 8, 5, 11, 5, 6, 8, 0, 5, 10, 5, 2, 0, 2, 5, -1,
    6, 11, 3, 6, 3, 5, 2, 10, 3, 10, 5, 3, -1, -1, -1, -1,
    5, 8, 9, 5, 2, 8, 5, 6, 2, 3, 8, 2, -1, -1, -1, -1,
    9, 5, 6, 9, 6, 0, 0, 6, 2, -1, -1, -1, -1, -1, -1, -1,
    1, 5, 8, 1, 8, 0, 5, 6, 8, 3, 8, 2, 6, 2, 8, -1,
    1, 5, 6, 2, 1, 6, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1,
    1, 3, 6, 1, 6, 10, 3, 8, 6, 5, 6, 9, 8, 9, 6, -1,
    10, 1, 0, 10, 0, 6, 9, 5, 0, 5, 6, 0, -1, -1, -1, -1,
    0, 3, 8, 5, 6, 10, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1,
    10, 5, 6, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1,
    11, 5, 10, 7, 5, 11, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1,
    11, 5, 10, 11, 7, 5, 8, 3, 0, -1, -1, -1, -1, -1, -1, -1,
    5, 11, 7, 5, 10, 11, 1, 9, 0, -1, -1, -1, -1, -1, -1, -1,
    10, 7, 5, 10, 11, 7, 9, 8, 1, 8, 3, 1, -1, -1, -1, -1,
    11, 1, 2, 11, 7, 1, 7, 5, 1, -1, -1, -1, -1, -1, -1, -1,
    0, 8, 3, 1, 2, 7, 1, 7, 5, 7, 2, 11, -1, -1, -1, -1,
    9, 7, 5, 9, 2, 7, 9, 0, 2, 2, 11, 7, -1, -1, -1, -1,
    7, 5, 2, 7, 2, 11, 5, 9, 2, 3, 2, 8, 9, 8, 2, -1,
    2, 5, 10, 2, 3, 5, 3, 7, 5, -1, -1, -1, -1, -1, -1, -1,
    8, 2, 0, 8, 5, 2, 8, 7, 5, 10, 2, 5, -1, -1, -1, -1,
    9, 0, 1, 5, 10, 3, 5, 3, 7, 3, 10, 2, -1, -1, -1, -1,
    9, 8, 2, 9, 2, 1, 8, 7, 2, 10, 2, 5, 7, 5, 2, -1,
    1, 3, 5, 3, 7, 5, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1,
    0, 8, 7, 0, 7, 1, 1, 7, 5, -1, -1, -1, -1, -1, -1, -1,
    9, 0, 3, 9, 3, 5, 5, 3, 7, -1, -1, -1, -1, -1, -1, -1,
    9, 8, 7, 5, 9, 7, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1,
    5, 8, 4, 5, 10, 8, 10, 11, 8, -1, -1, -1, -1, -1, -1, -1,
    5, 0, 4, 5, 11, 0, 5, 10, 11, 11, 3, 0, -1, -1, -1, -1,
    0, 1, 9, 8, 4, 10, 8, 10, 11, 10, 4, 5, -1, -1, -1, -1,
    10, 11, 4, 10, 4, 5, 11, 3, 4, 9, 4, 1, 3, 1, 4, -1,
    2, 5, 1, 2, 8, 5, 2, 11, 8, 4, 5, 8, -1, -1, -1, -1,
    0, 4, 11, 0, 11, 3, 4, 5, 11, 2, 11, 1, 5, 1, 11, -1,
    0, 2, 5, 0, 5, 9, 2, 11, 5, 4, 5, 8, 11, 8, 5, -1,
    9, 4, 5, 2, 11, 3, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1,
    2, 5, 10, 3, 5, 2, 3, 4, 5, 3, 8, 4, -1, -1, -1, -1,
    5, 10, 2, 5, 2, 4, 4, 2, 0, -1, -1, -1, -1, -1, -1, -1,
    3, 10, 2, 3, 5, 10, 3, 8, 5, 4, 5, 8, 0, 1, 9, -1,
    5, 10, 2, 5, 2, 4, 1, 9, 2, 9, 4, 2, -1, -1, -1, -1,
    8, 4, 5, 8, 5, 3, 3, 5, 1, -1, -1, -1, -1, -1, -1, -1,
    0, 4, 5, 1, 0, 5, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1,
    8, 4, 5, 8, 5, 3, 9, 0, 5, 0, 3, 5, -1, -1, -1, -1,
    9, 4, 5, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1,
    4, 11, 7, 4, 9, 11, 9, 10, 11, -1, -1, -1, -1, -1, -1, -1,
    0, 8, 3, 4, 9, 7, 9, 11, 7, 9, 10, 11, -1, -1, -1, -1,
    1, 10, 11, 1, 11, 4, 1, 4, 0, 7, 4, 11, -1, -1, -1, -1,
    3, 1, 4, 3, 4, 8, 1, 10, 4, 7, 4, 11, 10, 11, 4, -1,
    4, 11, 7, 9, 11, 4, 9, 2, 11, 9, 1, 2, -1, -1, -1, -1,
    9, 7, 4, 9, 11, 7, 9, 1, 11, 2, 11, 1, 0, 8, 3, -1,
    11, 7, 4, 11, 4, 2, 2, 4, 0, -1, -1, -1, -1, -1, -1, -1,
    11, 7, 4, 11, 4, 2, 8, 3, 4, 3, 2, 4, -1, -1, -1, -1,
    2, 9, 10, 2, 7, 9, 2, 3, 7, 7, 4, 9, -1, -1, -1, -1,
    9, 10, 7, 9, 7, 4, 10, 2, 7, 8, 7, 0, 2, 0, 7, -1,
    3, 7, 10, 3, 10, 2, 7, 4, 10, 1, 10, 0, 4, 0, 10, -1,
    1, 10, 2, 8, 7, 4, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1,
    4, 9, 1, 4, 1, 7, 7, 1, 3, -1, -1, -1, -1, -1, -1, -1,
    4, 9, 1, 4, 1, 7, 0, 8, 1, 8, 7, 1, -1, -1, -1, -1,
    4, 0, 3, 7, 4, 3, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1,
    4, 8, 7, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1,
    9, 10, 8, 10, 11, 8, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1,
    3, 0, 9, 3, 9, 11, 11, 9, 10, -1, -1, -1, -1, -1, -1, -1,
    0, 1, 10, 0, 10, 8, 8, 10, 11, -1, -1, -1, -1, -1, -1, -1,
    3, 1, 10, 11, 3, 10, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1,
    1, 2, 11, 1, 11, 9, 9, 11, 8, -1, -1, -1, -1, -1, -1, -1,
    3, 0, 9, 3, 9, 11, 1, 2, 9, 2, 11, 9, -1, -1, -1, -1,
    0, 2, 11, 8, 0, 11, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1,
    3, 2, 11, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1,
    2, 3, 8, 2, 8, 10, 10, 8, 9, -1, -1, -1, -1, -1, -1, -1,
    9, 10, 2, 0, 9, 2, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1,
    2, 3, 8, 2, 8, 10, 0, 1, 8, 1, 10, 8, -1, -1, -1, -1,
    1, 10, 2, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1,
    1, 3, 8, 9, 1, 8, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1,
    0, 9, 1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1,
    0, 3, 8, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1,
    -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1,
];

use std::collections::HashMap;

/// Welded, indexed mesh buffers produced by marching cubes.
pub struct MeshBuffers {
    pub positions: Vec<f32>,
    pub colors: Vec<f32>,
    pub depths: Vec<f32>,
    pub indices: Vec<u32>,
}

/// Replicates JS `Math.round` (round half toward +infinity).
#[inline]
fn js_round(x: f64) -> f64 {
    (x + 0.5).floor()
}

/// Port of `generateMeshFromSDF`. `sdf` returns the signed distance,
/// `color_fn` returns linear RGB in [0,1], `depth_fn` returns the interior
/// depth scalar. Returns `None` when fewer than 3 triangles are produced
/// (matches the JS `positions.length < 9` guard).
pub fn generate_mesh_from_sdf<F, C, D>(
    bounds_min: [f64; 3],
    bounds_max: [f64; 3],
    cell_size: f64,
    sdf: F,
    color_fn: C,
    depth_fn: D,
) -> Option<MeshBuffers>
where
    F: Fn(f64, f64, f64) -> f64,
    C: Fn(f64, f64, f64) -> [f64; 3],
    D: Fn(f64, f64, f64) -> f64,
{
    let nx = ((bounds_max[0] - bounds_min[0]) / cell_size).ceil() as i64;
    let ny = ((bounds_max[1] - bounds_min[1]) / cell_size).ceil() as i64;
    let nz = ((bounds_max[2] - bounds_min[2]) / cell_size).ceil() as i64;
    if nx < 1 || ny < 1 || nz < 1 {
        return None;
    }
    let nx = nx as usize;
    let ny = ny as usize;
    let nz = nz as usize;

    let gx = nx + 1;
    let gy = ny + 1;

    // Scalar field — stored f32 to match JS Float32Array quantization.
    let mut field = vec![0f32; gx * gy * (nz + 1)];
    for k in 0..=nz {
        let wz = bounds_min[2] + k as f64 * cell_size;
        for j in 0..=ny {
            let wy = bounds_min[1] + j as f64 * cell_size;
            for i in 0..=nx {
                let wx = bounds_min[0] + i as f64 * cell_size;
                field[i + gx * (j + gy * k)] = sdf(wx, wy, wz) as f32;
            }
        }
    }

    // ── Streaming weld ──
    // The weld used to be a second pass over an intermediate triangle soup:
    // unwelded `positions` (f32) plus per-soup-vertex `colors`/`depths`
    // (f64) all lived simultaneously with the weld tables — typically ~6×
    // the welded vertex count, and the single largest transient of a
    // mountain build (the iOS Safari memory-watchdog trigger). Folding the
    // weld into the march loop emits soup vertices in EXACTLY the same
    // order, so the tolerance-key lookups and the f64 color/depth
    // accumulation happen with identical operands in identical order —
    // bit-identical output (asserted against the two-pass reference in the
    // tests below).
    let tolerance = cell_size * 0.01;
    let mut vertex_map: HashMap<(i64, i64, i64), u32> = HashMap::new();
    let mut merged_positions: Vec<f32> = Vec::new();
    let mut merged_indices: Vec<u32> = Vec::new();
    // [r, g, b, count]
    let mut color_accum: Vec<[f64; 4]> = Vec::new();
    // [depth, count]
    let mut depth_accum: Vec<[f64; 2]> = Vec::new();
    let mut soup_vertex_count: usize = 0;

    let cs = cell_size;
    let mut ev = [0f32; 36];

    for k in 0..nz {
        for j in 0..ny {
            for i in 0..nx {
                let idx00 = i + gx * (j + gy * k);
                let f0 = field[idx00] as f64;
                let f1 = field[idx00 + 1] as f64;
                let f2 = field[idx00 + 1 + gx] as f64;
                let f3 = field[idx00 + gx] as f64;
                let f4 = field[idx00 + gx * gy] as f64;
                let f5 = field[idx00 + 1 + gx * gy] as f64;
                let f6 = field[idx00 + 1 + gx + gx * gy] as f64;
                let f7 = field[idx00 + gx + gx * gy] as f64;

                let mut ci = 0usize;
                if f0 < 0.0 { ci |= 1; }
                if f1 < 0.0 { ci |= 2; }
                if f2 < 0.0 { ci |= 4; }
                if f3 < 0.0 { ci |= 8; }
                if f4 < 0.0 { ci |= 16; }
                if f5 < 0.0 { ci |= 32; }
                if f6 < 0.0 { ci |= 64; }
                if f7 < 0.0 { ci |= 128; }

                let bits = EDGE_TABLE[ci];
                if bits == 0 {
                    continue;
                }

                let x0 = bounds_min[0] + i as f64 * cs;
                let y0 = bounds_min[1] + j as f64 * cs;
                let z0 = bounds_min[2] + k as f64 * cs;

                if bits & 1 != 0    { let t = f0 / (f0 - f1); ev[0]  = (x0 + t * cs) as f32; ev[1]  = y0 as f32;          ev[2]  = z0 as f32; }
                if bits & 2 != 0    { let t = f1 / (f1 - f2); ev[3]  = (x0 + cs) as f32;     ev[4]  = (y0 + t * cs) as f32; ev[5]  = z0 as f32; }
                if bits & 4 != 0    { let t = f3 / (f3 - f2); ev[6]  = (x0 + t * cs) as f32; ev[7]  = (y0 + cs) as f32;     ev[8]  = z0 as f32; }
                if bits & 8 != 0    { let t = f0 / (f0 - f3); ev[9]  = x0 as f32;            ev[10] = (y0 + t * cs) as f32; ev[11] = z0 as f32; }
                if bits & 16 != 0   { let t = f4 / (f4 - f5); ev[12] = (x0 + t * cs) as f32; ev[13] = y0 as f32;           ev[14] = (z0 + cs) as f32; }
                if bits & 32 != 0   { let t = f5 / (f5 - f6); ev[15] = (x0 + cs) as f32;     ev[16] = (y0 + t * cs) as f32; ev[17] = (z0 + cs) as f32; }
                if bits & 64 != 0   { let t = f7 / (f7 - f6); ev[18] = (x0 + t * cs) as f32; ev[19] = (y0 + cs) as f32;     ev[20] = (z0 + cs) as f32; }
                if bits & 128 != 0  { let t = f4 / (f4 - f7); ev[21] = x0 as f32;            ev[22] = (y0 + t * cs) as f32; ev[23] = (z0 + cs) as f32; }
                if bits & 256 != 0  { let t = f0 / (f0 - f4); ev[24] = x0 as f32;            ev[25] = y0 as f32;           ev[26] = (z0 + t * cs) as f32; }
                if bits & 512 != 0  { let t = f1 / (f1 - f5); ev[27] = (x0 + cs) as f32;     ev[28] = y0 as f32;           ev[29] = (z0 + t * cs) as f32; }
                if bits & 1024 != 0 { let t = f2 / (f2 - f6); ev[30] = (x0 + cs) as f32;     ev[31] = (y0 + cs) as f32;     ev[32] = (z0 + t * cs) as f32; }
                if bits & 2048 != 0 { let t = f3 / (f3 - f7); ev[33] = x0 as f32;            ev[34] = (y0 + cs) as f32;     ev[35] = (z0 + t * cs) as f32; }

                let tb = ci << 4;
                let mut n = 0usize;
                while TRI_TABLE[tb + n] != -1 {
                    let e0 = (TRI_TABLE[tb + n] * 3) as usize;
                    let e1 = (TRI_TABLE[tb + n + 1] * 3) as usize;
                    let e2 = (TRI_TABLE[tb + n + 2] * 3) as usize;

                    for &e in &[e0, e1, e2] {
                        let px = ev[e];
                        let py = ev[e + 1];
                        let pz = ev[e + 2];
                        soup_vertex_count += 1;

                        let kx = js_round(px as f64 / tolerance) as i64;
                        let ky = js_round(py as f64 / tolerance) as i64;
                        let kz = js_round(pz as f64 / tolerance) as i64;
                        let key = (kx, ky, kz);

                        let c = color_fn(px as f64, py as f64, pz as f64);
                        let depth = depth_fn(px as f64, py as f64, pz as f64);

                        if let Some(&vi) = vertex_map.get(&key) {
                            let a = &mut color_accum[vi as usize];
                            a[0] += c[0];
                            a[1] += c[1];
                            a[2] += c[2];
                            a[3] += 1.0;
                            let d = &mut depth_accum[vi as usize];
                            d[0] += depth;
                            d[1] += 1.0;
                            merged_indices.push(vi);
                        } else {
                            let vi = (merged_positions.len() / 3) as u32;
                            vertex_map.insert(key, vi);
                            merged_positions.push(px);
                            merged_positions.push(py);
                            merged_positions.push(pz);
                            color_accum.push([c[0], c[1], c[2], 1.0]);
                            depth_accum.push([depth, 1.0]);
                            merged_indices.push(vi);
                        }
                    }
                    n += 3;
                }
            }
        }
    }

    // Same guard as the two-pass version: fewer than 3 soup triangles → no
    // mesh (matches the JS `positions.length < 9` check on UNWELDED verts).
    if soup_vertex_count * 3 < 9 {
        return None;
    }

    let mut merged_colors: Vec<f32> = Vec::with_capacity(color_accum.len() * 3);
    let mut merged_depths: Vec<f32> = Vec::with_capacity(depth_accum.len());
    for i in 0..color_accum.len() {
        let count = color_accum[i][3];
        merged_colors.push((color_accum[i][0] / count) as f32);
        merged_colors.push((color_accum[i][1] / count) as f32);
        merged_colors.push((color_accum[i][2] / count) as f32);
        merged_depths.push((depth_accum[i][0] / depth_accum[i][1]) as f32);
    }

    Some(MeshBuffers {
        positions: merged_positions,
        colors: merged_colors,
        depths: merged_depths,
        indices: merged_indices,
    })
}

#[cfg(test)]
mod tests {
    use super::*;

    /// The original two-pass implementation (march to a triangle soup, then
    /// weld in a second pass) — kept verbatim as the bit-parity reference
    /// for the streaming weld above. Bit-parity here is load-bearing: the
    /// JS twin of this file must produce identical meshes for multiplayer
    /// coherence, and the streaming version must not drift from either.
    fn generate_mesh_from_sdf_reference<F, C, D>(
        bounds_min: [f64; 3],
        bounds_max: [f64; 3],
        cell_size: f64,
        sdf: F,
        color_fn: C,
        depth_fn: D,
    ) -> Option<MeshBuffers>
    where
        F: Fn(f64, f64, f64) -> f64,
        C: Fn(f64, f64, f64) -> [f64; 3],
        D: Fn(f64, f64, f64) -> f64,
    {
        let nx = ((bounds_max[0] - bounds_min[0]) / cell_size).ceil() as i64;
        let ny = ((bounds_max[1] - bounds_min[1]) / cell_size).ceil() as i64;
        let nz = ((bounds_max[2] - bounds_min[2]) / cell_size).ceil() as i64;
        if nx < 1 || ny < 1 || nz < 1 {
            return None;
        }
        let nx = nx as usize;
        let ny = ny as usize;
        let nz = nz as usize;

        let gx = nx + 1;
        let gy = ny + 1;

        let mut field = vec![0f32; gx * gy * (nz + 1)];
        for k in 0..=nz {
            let wz = bounds_min[2] + k as f64 * cell_size;
            for j in 0..=ny {
                let wy = bounds_min[1] + j as f64 * cell_size;
                for i in 0..=nx {
                    let wx = bounds_min[0] + i as f64 * cell_size;
                    field[i + gx * (j + gy * k)] = sdf(wx, wy, wz) as f32;
                }
            }
        }

        let mut positions: Vec<f32> = Vec::new();
        let mut colors: Vec<f64> = Vec::new();
        let mut depths: Vec<f64> = Vec::new();

        let cs = cell_size;
        let mut ev = [0f32; 36];

        for k in 0..nz {
            for j in 0..ny {
                for i in 0..nx {
                    let idx00 = i + gx * (j + gy * k);
                    let f0 = field[idx00] as f64;
                    let f1 = field[idx00 + 1] as f64;
                    let f2 = field[idx00 + 1 + gx] as f64;
                    let f3 = field[idx00 + gx] as f64;
                    let f4 = field[idx00 + gx * gy] as f64;
                    let f5 = field[idx00 + 1 + gx * gy] as f64;
                    let f6 = field[idx00 + 1 + gx + gx * gy] as f64;
                    let f7 = field[idx00 + gx + gx * gy] as f64;

                    let mut ci = 0usize;
                    if f0 < 0.0 { ci |= 1; }
                    if f1 < 0.0 { ci |= 2; }
                    if f2 < 0.0 { ci |= 4; }
                    if f3 < 0.0 { ci |= 8; }
                    if f4 < 0.0 { ci |= 16; }
                    if f5 < 0.0 { ci |= 32; }
                    if f6 < 0.0 { ci |= 64; }
                    if f7 < 0.0 { ci |= 128; }

                    let bits = EDGE_TABLE[ci];
                    if bits == 0 {
                        continue;
                    }

                    let x0 = bounds_min[0] + i as f64 * cs;
                    let y0 = bounds_min[1] + j as f64 * cs;
                    let z0 = bounds_min[2] + k as f64 * cs;

                    if bits & 1 != 0    { let t = f0 / (f0 - f1); ev[0]  = (x0 + t * cs) as f32; ev[1]  = y0 as f32;          ev[2]  = z0 as f32; }
                    if bits & 2 != 0    { let t = f1 / (f1 - f2); ev[3]  = (x0 + cs) as f32;     ev[4]  = (y0 + t * cs) as f32; ev[5]  = z0 as f32; }
                    if bits & 4 != 0    { let t = f3 / (f3 - f2); ev[6]  = (x0 + t * cs) as f32; ev[7]  = (y0 + cs) as f32;     ev[8]  = z0 as f32; }
                    if bits & 8 != 0    { let t = f0 / (f0 - f3); ev[9]  = x0 as f32;            ev[10] = (y0 + t * cs) as f32; ev[11] = z0 as f32; }
                    if bits & 16 != 0   { let t = f4 / (f4 - f5); ev[12] = (x0 + t * cs) as f32; ev[13] = y0 as f32;           ev[14] = (z0 + cs) as f32; }
                    if bits & 32 != 0   { let t = f5 / (f5 - f6); ev[15] = (x0 + cs) as f32;     ev[16] = (y0 + t * cs) as f32; ev[17] = (z0 + cs) as f32; }
                    if bits & 64 != 0   { let t = f7 / (f7 - f6); ev[18] = (x0 + t * cs) as f32; ev[19] = (y0 + cs) as f32;     ev[20] = (z0 + cs) as f32; }
                    if bits & 128 != 0  { let t = f4 / (f4 - f7); ev[21] = x0 as f32;            ev[22] = (y0 + t * cs) as f32; ev[23] = (z0 + cs) as f32; }
                    if bits & 256 != 0  { let t = f0 / (f0 - f4); ev[24] = x0 as f32;            ev[25] = y0 as f32;           ev[26] = (z0 + t * cs) as f32; }
                    if bits & 512 != 0  { let t = f1 / (f1 - f5); ev[27] = (x0 + cs) as f32;     ev[28] = y0 as f32;           ev[29] = (z0 + t * cs) as f32; }
                    if bits & 1024 != 0 { let t = f2 / (f2 - f6); ev[30] = (x0 + cs) as f32;     ev[31] = (y0 + cs) as f32;     ev[32] = (z0 + t * cs) as f32; }
                    if bits & 2048 != 0 { let t = f3 / (f3 - f7); ev[33] = x0 as f32;            ev[34] = (y0 + cs) as f32;     ev[35] = (z0 + t * cs) as f32; }

                    let tb = ci << 4;
                    let mut n = 0usize;
                    while TRI_TABLE[tb + n] != -1 {
                        let e0 = (TRI_TABLE[tb + n] * 3) as usize;
                        let e1 = (TRI_TABLE[tb + n + 1] * 3) as usize;
                        let e2 = (TRI_TABLE[tb + n + 2] * 3) as usize;

                        for &e in &[e0, e1, e2] {
                            let px = ev[e];
                            let py = ev[e + 1];
                            let pz = ev[e + 2];
                            positions.push(px);
                            positions.push(py);
                            positions.push(pz);
                            let c = color_fn(px as f64, py as f64, pz as f64);
                            colors.push(c[0]);
                            colors.push(c[1]);
                            colors.push(c[2]);
                            depths.push(depth_fn(px as f64, py as f64, pz as f64));
                        }
                        n += 3;
                    }
                }
            }
        }

        if positions.len() < 9 {
            return None;
        }

        let tolerance = cell_size * 0.01;
        let mut vertex_map: HashMap<(i64, i64, i64), u32> = HashMap::new();
        let mut merged_positions: Vec<f32> = Vec::new();
        let mut merged_indices: Vec<u32> = Vec::new();
        let mut color_accum: Vec<[f64; 4]> = Vec::new();
        let mut depth_accum: Vec<[f64; 2]> = Vec::new();

        let vert_count = positions.len() / 3;
        for v in 0..vert_count {
            let x = positions[v * 3];
            let y = positions[v * 3 + 1];
            let z = positions[v * 3 + 2];

            let kx = js_round(x as f64 / tolerance) as i64;
            let ky = js_round(y as f64 / tolerance) as i64;
            let kz = js_round(z as f64 / tolerance) as i64;
            let key = (kx, ky, kz);

            let cr = colors[v * 3];
            let cg = colors[v * 3 + 1];
            let cb = colors[v * 3 + 2];

            if let Some(&vi) = vertex_map.get(&key) {
                let a = &mut color_accum[vi as usize];
                a[0] += cr;
                a[1] += cg;
                a[2] += cb;
                a[3] += 1.0;
                let d = &mut depth_accum[vi as usize];
                d[0] += depths[v];
                d[1] += 1.0;
                merged_indices.push(vi);
            } else {
                let vi = (merged_positions.len() / 3) as u32;
                vertex_map.insert(key, vi);
                merged_positions.push(x);
                merged_positions.push(y);
                merged_positions.push(z);
                color_accum.push([cr, cg, cb, 1.0]);
                depth_accum.push([depths[v], 1.0]);
                merged_indices.push(vi);
            }
        }

        let mut merged_colors: Vec<f32> = Vec::with_capacity(color_accum.len() * 3);
        let mut merged_depths: Vec<f32> = Vec::with_capacity(depth_accum.len());
        for i in 0..color_accum.len() {
            let count = color_accum[i][3];
            merged_colors.push((color_accum[i][0] / count) as f32);
            merged_colors.push((color_accum[i][1] / count) as f32);
            merged_colors.push((color_accum[i][2] / count) as f32);
            merged_depths.push((depth_accum[i][0] / depth_accum[i][1]) as f32);
        }

        Some(MeshBuffers {
            positions: merged_positions,
            colors: merged_colors,
            depths: merged_depths,
            indices: merged_indices,
        })
    }

    fn assert_bit_identical(a: &MeshBuffers, b: &MeshBuffers, label: &str) {
        assert_eq!(a.positions.len(), b.positions.len(), "{label}: position count");
        assert_eq!(a.indices, b.indices, "{label}: indices");
        for (i, (x, y)) in a.positions.iter().zip(b.positions.iter()).enumerate() {
            assert_eq!(x.to_bits(), y.to_bits(), "{label}: position[{i}] {x} vs {y}");
        }
        for (i, (x, y)) in a.colors.iter().zip(b.colors.iter()).enumerate() {
            assert_eq!(x.to_bits(), y.to_bits(), "{label}: color[{i}] {x} vs {y}");
        }
        for (i, (x, y)) in a.depths.iter().zip(b.depths.iter()).enumerate() {
            assert_eq!(x.to_bits(), y.to_bits(), "{label}: depth[{i}] {x} vs {y}");
        }
    }

    /// Deterministic pseudo-color from position — exercises f64 accumulation
    /// with varied operands (constant colors would hide ordering bugs).
    fn color_of(x: f64, y: f64, z: f64) -> [f64; 3] {
        [
            (x * 12.9898 + z * 78.233).sin().abs().fract(),
            (y * 39.425 + x * 11.135).sin().abs().fract(),
            (z * 27.156 + y * 51.731).sin().abs().fract(),
        ]
    }

    #[test]
    fn streaming_weld_matches_reference_sphere() {
        let sdf = |x: f64, y: f64, z: f64| (x * x + y * y + z * z).sqrt() - 9.0;
        let depth = |x: f64, y: f64, z: f64| -((x * x + y * y + z * z).sqrt() - 9.0);
        for &cell in &[2.5, 1.7, 0.9] {
            let a = generate_mesh_from_sdf([-12.0, -12.0, -12.0], [12.0, 12.0, 12.0], cell, sdf, color_of, depth)
                .expect("streaming produced a mesh");
            let b = generate_mesh_from_sdf_reference([-12.0, -12.0, -12.0], [12.0, 12.0, 12.0], cell, sdf, color_of, depth)
                .expect("reference produced a mesh");
            assert_bit_identical(&a, &b, &format!("sphere cell={cell}"));
        }
    }

    #[test]
    fn streaming_weld_matches_reference_blended_lobes() {
        // Two blended lobes + a ground plane cut — irregular topology with
        // lots of shared edges (heavy weld traffic) and off-center bounds.
        let sdf = |x: f64, y: f64, z: f64| {
            let a = ((x - 3.0).powi(2) + y.powi(2) + z.powi(2)).sqrt() - 6.0;
            let b = ((x + 4.0).powi(2) + (y - 2.0).powi(2) + (z + 1.0).powi(2)).sqrt() - 5.0;
            let blend = a.min(b) - 0.6 * (1.0 - ((a - b).abs() / 4.0).min(1.0));
            blend.max(-(y + 4.5))
        };
        let depth = |x: f64, y: f64, z: f64| (x * 0.3 + y * 0.7 - z * 0.2).max(0.0);
        let a = generate_mesh_from_sdf([-11.3, -5.1, -9.7], [10.9, 9.2, 8.8], 1.3, sdf, color_of, depth)
            .expect("streaming produced a mesh");
        let b = generate_mesh_from_sdf_reference([-11.3, -5.1, -9.7], [10.9, 9.2, 8.8], 1.3, sdf, color_of, depth)
            .expect("reference produced a mesh");
        assert_bit_identical(&a, &b, "blended lobes");
        // Sanity: the weld actually merged something (soup >> welded).
        assert!(a.indices.len() > a.positions.len() / 3, "weld produced shared vertices");
    }

    #[test]
    fn streaming_weld_matches_reference_empty_and_tiny() {
        // Entirely-outside SDF → both return None.
        let far = |_x: f64, _y: f64, _z: f64| 100.0;
        let depth = |_x: f64, _y: f64, _z: f64| 0.0;
        assert!(generate_mesh_from_sdf([-2.0; 3], [2.0; 3], 1.0, far, color_of, depth).is_none());
        assert!(generate_mesh_from_sdf_reference([-2.0; 3], [2.0; 3], 1.0, far, color_of, depth).is_none());

        // Tiny sphere clipped by coarse cells — near the <3-triangle guard.
        let tiny = |x: f64, y: f64, z: f64| (x * x + y * y + z * z).sqrt() - 0.6;
        let a = generate_mesh_from_sdf([-1.0; 3], [1.0; 3], 0.5, tiny, color_of, depth);
        let b = generate_mesh_from_sdf_reference([-1.0; 3], [1.0; 3], 0.5, tiny, color_of, depth);
        match (a, b) {
            (Some(a), Some(b)) => assert_bit_identical(&a, &b, "tiny sphere"),
            (None, None) => {}
            _ => panic!("streaming and reference disagreed on mesh existence"),
        }
    }
}
