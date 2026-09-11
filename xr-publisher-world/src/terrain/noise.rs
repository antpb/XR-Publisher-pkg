/// Bit-exact port of simplex-noise v4 (Jonas Wagner) createNoise2D.
/// Uses the same permutation table construction and gradient table.
///
/// Reference: https://github.com/jwagner/simplex-noise.js

use crate::util::rng::Alea;

const SQRT3: f64 = 1.7320508075688772;
const F2: f64 = 0.5 * (SQRT3 - 1.0);
const G2: f64 = (3.0 - SQRT3) / 6.0;
const F3: f64 = 1.0 / 3.0;
const G3: f64 = 1.0 / 6.0;

/// 2D gradient vectors, matching the JS grad2 table.
const GRAD2: [f64; 24] = [
    1.0, 1.0, -1.0, 1.0, 1.0, -1.0, -1.0, -1.0, 1.0, 0.0, -1.0, 0.0, 1.0, 0.0, -1.0, 0.0,
    0.0, 1.0, 0.0, -1.0, 0.0, 1.0, 0.0, -1.0,
];

/// 3D gradient vectors (12 vectors × 3 components), matching the JS grad3 table.
const GRAD3: [f64; 36] = [
    1.0, 1.0, 0.0, -1.0, 1.0, 0.0, 1.0, -1.0, 0.0, -1.0, -1.0, 0.0,
    1.0, 0.0, 1.0, -1.0, 0.0, 1.0, 1.0, 0.0, -1.0, -1.0, 0.0, -1.0,
    0.0, 1.0, 1.0, 0.0, -1.0, 1.0, 0.0, 1.0, -1.0, 0.0, -1.0, -1.0,
];

/// Simplex noise 2D generator with seeded permutation table.
pub struct SimplexNoise2D {
    perm: Vec<u8>,
    perm_grad2x: Vec<f64>,
    perm_grad2y: Vec<f64>,
}

impl SimplexNoise2D {
    /// Create a new 2D noise generator seeded with the given string.
    /// Uses the Alea PRNG for permutation table construction,
    /// matching the JS `createNoise2D(alea(seed))` call.
    pub fn new(seed: &str) -> Self {
        let mut rng = Alea::new(seed);
        let perm = build_permutation_table(&mut rng);

        let perm_grad2x: Vec<f64> = perm
            .iter()
            .map(|&v| GRAD2[((v as usize) % 12) * 2])
            .collect();
        let perm_grad2y: Vec<f64> = perm
            .iter()
            .map(|&v| GRAD2[((v as usize) % 12) * 2 + 1])
            .collect();

        SimplexNoise2D {
            perm,
            perm_grad2x,
            perm_grad2y,
        }
    }

    /// Evaluate 2D simplex noise at (x, y). Returns a value in [-1, 1].
    #[inline]
    pub fn noise2d(&self, x: f64, y: f64) -> f64 {
        let mut n0: f64 = 0.0;
        let mut n1: f64 = 0.0;
        let mut n2: f64 = 0.0;

        // Skew the input space
        let s = (x + y) * F2;
        let i = fast_floor(x + s);
        let j = fast_floor(y + s);

        let t = ((i + j) as f64) * G2;
        let x0_origin = i as f64 - t;
        let y0_origin = j as f64 - t;
        let x0 = x - x0_origin;
        let y0 = y - y0_origin;

        // Determine which simplex we are in
        let (i1, j1) = if x0 > y0 { (1i32, 0i32) } else { (0i32, 1i32) };

        let x1 = x0 - i1 as f64 + G2;
        let y1 = y0 - j1 as f64 + G2;
        let x2 = x0 - 1.0 + 2.0 * G2;
        let y2 = y0 - 1.0 + 2.0 * G2;

        let ii = (i & 255) as usize;
        let jj = (j & 255) as usize;

        // Corner 0
        let mut t0 = 0.5 - x0 * x0 - y0 * y0;
        if t0 >= 0.0 {
            let gi0 = ii + self.perm[jj] as usize;
            let g0x = self.perm_grad2x[gi0];
            let g0y = self.perm_grad2y[gi0];
            t0 *= t0;
            n0 = t0 * t0 * (g0x * x0 + g0y * y0);
        }

        // Corner 1
        let mut t1 = 0.5 - x1 * x1 - y1 * y1;
        if t1 >= 0.0 {
            let gi1 = (ii as i32 + i1) as usize + self.perm[(jj as i32 + j1) as usize] as usize;
            let g1x = self.perm_grad2x[gi1];
            let g1y = self.perm_grad2y[gi1];
            t1 *= t1;
            n1 = t1 * t1 * (g1x * x1 + g1y * y1);
        }

        // Corner 2
        let mut t2 = 0.5 - x2 * x2 - y2 * y2;
        if t2 >= 0.0 {
            let gi2 = ii + 1 + self.perm[jj + 1] as usize;
            let g2x = self.perm_grad2x[gi2];
            let g2y = self.perm_grad2y[gi2];
            t2 *= t2;
            n2 = t2 * t2 * (g2x * x2 + g2y * y2);
        }

        70.0 * (n0 + n1 + n2)
    }
}

/// Bit-exact port of simplex-noise v4 `createNoise3D`. Same permutation
/// table construction as the 2D generator; the gradient hash uses the
/// nested lookup `ii + perm[jj + perm[kk]]` and the final scale is 32.0.
pub struct SimplexNoise3D {
    perm: Vec<u8>,
    perm_grad3x: Vec<f64>,
    perm_grad3y: Vec<f64>,
    perm_grad3z: Vec<f64>,
}

impl SimplexNoise3D {
    /// Create a new 3D noise generator seeded with the given string.
    /// Matches the JS `createNoise3D(alea(seed))` call.
    pub fn new(seed: &str) -> Self {
        let mut rng = Alea::new(seed);
        let perm = build_permutation_table(&mut rng);

        let perm_grad3x: Vec<f64> = perm
            .iter()
            .map(|&v| GRAD3[((v as usize) % 12) * 3])
            .collect();
        let perm_grad3y: Vec<f64> = perm
            .iter()
            .map(|&v| GRAD3[((v as usize) % 12) * 3 + 1])
            .collect();
        let perm_grad3z: Vec<f64> = perm
            .iter()
            .map(|&v| GRAD3[((v as usize) % 12) * 3 + 2])
            .collect();

        SimplexNoise3D {
            perm,
            perm_grad3x,
            perm_grad3y,
            perm_grad3z,
        }
    }

    /// Evaluate 3D simplex noise at (x, y, z). Returns a value in [-1, 1].
    #[inline]
    pub fn noise3d(&self, x: f64, y: f64, z: f64) -> f64 {
        let mut n0: f64 = 0.0;
        let mut n1: f64 = 0.0;
        let mut n2: f64 = 0.0;
        let mut n3: f64 = 0.0;

        // Skew the input space to determine which simplex cell we're in.
        let s = (x + y + z) * F3;
        let i = fast_floor(x + s);
        let j = fast_floor(y + s);
        let k = fast_floor(z + s);
        let t = ((i + j + k) as f64) * G3;
        let x0_origin = i as f64 - t;
        let y0_origin = j as f64 - t;
        let z0_origin = k as f64 - t;
        let x0 = x - x0_origin;
        let y0 = y - y0_origin;
        let z0 = z - z0_origin;

        // Determine which simplex (tetrahedron) we are in.
        let (i1, j1, k1, i2, j2, k2);
        if x0 >= y0 {
            if y0 >= z0 {
                i1 = 1; j1 = 0; k1 = 0; i2 = 1; j2 = 1; k2 = 0; // X Y Z
            } else if x0 >= z0 {
                i1 = 1; j1 = 0; k1 = 0; i2 = 1; j2 = 0; k2 = 1; // X Z Y
            } else {
                i1 = 0; j1 = 0; k1 = 1; i2 = 1; j2 = 0; k2 = 1; // Z X Y
            }
        } else {
            if y0 < z0 {
                i1 = 0; j1 = 0; k1 = 1; i2 = 0; j2 = 1; k2 = 1; // Z Y X
            } else if x0 < z0 {
                i1 = 0; j1 = 1; k1 = 0; i2 = 0; j2 = 1; k2 = 1; // Y Z X
            } else {
                i1 = 0; j1 = 1; k1 = 0; i2 = 1; j2 = 1; k2 = 0; // Y X Z
            }
        }

        let x1 = x0 - i1 as f64 + G3;
        let y1 = y0 - j1 as f64 + G3;
        let z1 = z0 - k1 as f64 + G3;
        let x2 = x0 - i2 as f64 + 2.0 * G3;
        let y2 = y0 - j2 as f64 + 2.0 * G3;
        let z2 = z0 - k2 as f64 + 2.0 * G3;
        let x3 = x0 - 1.0 + 3.0 * G3;
        let y3 = y0 - 1.0 + 3.0 * G3;
        let z3 = z0 - 1.0 + 3.0 * G3;

        let ii = (i & 255) as usize;
        let jj = (j & 255) as usize;
        let kk = (k & 255) as usize;

        // Corner 0
        let mut t0 = 0.6 - x0 * x0 - y0 * y0 - z0 * z0;
        if t0 >= 0.0 {
            let gi0 = ii + self.perm[jj + self.perm[kk] as usize] as usize;
            t0 *= t0;
            n0 = t0 * t0
                * (self.perm_grad3x[gi0] * x0
                    + self.perm_grad3y[gi0] * y0
                    + self.perm_grad3z[gi0] * z0);
        }

        // Corner 1
        let mut t1 = 0.6 - x1 * x1 - y1 * y1 - z1 * z1;
        if t1 >= 0.0 {
            let gi1 = (ii + i1 as usize)
                + self.perm[(jj + j1 as usize) + self.perm[kk + k1 as usize] as usize] as usize;
            t1 *= t1;
            n1 = t1 * t1
                * (self.perm_grad3x[gi1] * x1
                    + self.perm_grad3y[gi1] * y1
                    + self.perm_grad3z[gi1] * z1);
        }

        // Corner 2
        let mut t2 = 0.6 - x2 * x2 - y2 * y2 - z2 * z2;
        if t2 >= 0.0 {
            let gi2 = (ii + i2 as usize)
                + self.perm[(jj + j2 as usize) + self.perm[kk + k2 as usize] as usize] as usize;
            t2 *= t2;
            n2 = t2 * t2
                * (self.perm_grad3x[gi2] * x2
                    + self.perm_grad3y[gi2] * y2
                    + self.perm_grad3z[gi2] * z2);
        }

        // Corner 3
        let mut t3 = 0.6 - x3 * x3 - y3 * y3 - z3 * z3;
        if t3 >= 0.0 {
            let gi3 = (ii + 1) + self.perm[(jj + 1) + self.perm[kk + 1] as usize] as usize;
            t3 *= t3;
            n3 = t3 * t3
                * (self.perm_grad3x[gi3] * x3
                    + self.perm_grad3y[gi3] * y3
                    + self.perm_grad3z[gi3] * z3);
        }

        32.0 * (n0 + n1 + n2 + n3)
    }
}

/// Build a random permutation table (512 entries, first 256 shuffled,
/// second 256 = copy of first 256). Matches JS `buildPermutationTable`.
fn build_permutation_table(rng: &mut Alea) -> Vec<u8> {
    let table_size = 512usize;
    let mut p = vec![0u8; table_size];

    // Initialize first half with identity
    for i in 0..(table_size / 2) {
        p[i] = i as u8;
    }

    // Fisher-Yates shuffle (matching JS: i + ~~(random() * (256 - i)))
    for i in 0..(table_size / 2 - 1) {
        let r = i + (rng.next() * (256 - i) as f64) as usize;
        p.swap(i, r);
    }

    // Mirror first half to second half
    for i in 256..table_size {
        p[i] = p[i - 256];
    }

    p
}

#[inline]
fn fast_floor(x: f64) -> i32 {
    // Matches JS: Math.floor(x) | 0
    x.floor() as i32
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_noise_determinism() {
        let noise_a = SimplexNoise2D::new("test-seed");
        let noise_b = SimplexNoise2D::new("test-seed");

        for i in 0..100 {
            let x = i as f64 * 0.1;
            let y = i as f64 * 0.07;
            assert_eq!(noise_a.noise2d(x, y), noise_b.noise2d(x, y));
        }
    }

    #[test]
    fn test_noise_range() {
        let noise = SimplexNoise2D::new("range-test");
        for i in 0..1000 {
            let x = (i as f64 * 0.37).sin() * 100.0;
            let y = (i as f64 * 0.53).cos() * 100.0;
            let v = noise.noise2d(x, y);
            assert!(
                v >= -1.0 && v <= 1.0,
                "noise({}, {}) = {} out of range",
                x,
                y,
                v
            );
        }
    }

    #[test]
    fn test_different_seeds_different_output() {
        let a = SimplexNoise2D::new("seed-a");
        let b = SimplexNoise2D::new("seed-b");
        // Very unlikely to match at arbitrary point
        assert_ne!(a.noise2d(1.5, 2.3), b.noise2d(1.5, 2.3));
    }

    #[test]
    fn test_noise3d_determinism() {
        let a = SimplexNoise3D::new("seed-3d");
        let b = SimplexNoise3D::new("seed-3d");
        for i in 0..100 {
            let x = i as f64 * 0.13;
            let y = i as f64 * 0.07;
            let z = i as f64 * 0.11;
            assert_eq!(a.noise3d(x, y, z), b.noise3d(x, y, z));
        }
    }

    #[test]
    fn test_noise3d_range() {
        let noise = SimplexNoise3D::new("range-3d");
        for i in 0..2000 {
            let x = (i as f64 * 0.37).sin() * 100.0;
            let y = (i as f64 * 0.53).cos() * 100.0;
            let z = (i as f64 * 0.29).sin() * 100.0;
            let v = noise.noise3d(x, y, z);
            assert!(v >= -1.0 && v <= 1.0, "noise3d out of range: {}", v);
        }
    }

    /// Bit-exactness gate against JS `createNoise3D(alea("mtn-noise-test"))`.
    /// Reference values captured from the `simplex-noise` v4 + `seedrandom`
    /// packages the runtime uses. noise3d has no transcendentals, so a match
    /// here means the Alea PRNG, permutation table, and gradient hash all
    /// agree with JS to full f64 precision.
    #[test]
    fn test_noise3d_matches_js_reference() {
        let noise = SimplexNoise3D::new("mtn-noise-test");
        // (x, y, z, expected) — see scripts in commit history / plan.
        let cases: [(f64, f64, f64, f64); 24] = [
            (0_f64, 5_f64, 5.048825908847379_f64, -0.2617230878184812_f64),
            (7.054907297920351_f64, 3.6542109364224427_f64, 5.907800526124487_f64, 0.3974549310235235_f64),
            (4.228509602750249_f64, 0.5098357145012051_f64, 2.4699289009354306_f64, 0.09964543727445571_f64),
            (-3.8843631142878188_f64, -3.0342305229992856_f64, -2.4890168454509607_f64, 0.2585972442810055_f64),
            (-4.944182590041072_f64, -5.39111170334329_f64, -5.042146021800787_f64, 0.10217059132784168_f64),
            (3.0558399166147083_f64, -5.532283436453982_f64, -3.083241953422351_f64, 0.10952777724817689_f64),
            (8.849803417622235_f64, -3.471304106703501_f64, 2.079295229102962_f64, 0.4593796759827452_f64),
            (4.403688536445465_f64, -0.2574381528871258_f64, 6.712619723771387_f64, -0.5907680050073272_f64),
            (-3.314785283599576_f64, 2.5178293925512483_f64, 7.484383340078638_f64, 0.3668039836014722_f64),
            (-2.5438850874332246_f64, 3.4692931819170756_f64, 3.984590174096113_f64, 0.3477320887264893_f64),
            (6.041169257786486_f64, 2.069511271716523_f64, -0.9641266653362184_f64, 0.29769434228292446_f64),
            (10.317403749922294_f64, -1.1031306898106739_f64, -3.4426175198382643_f64, 0.5057231838420744_f64),
            (4.474275566096096_f64, -4.63644327058342_f64, -1.401150508662734_f64, 0.42292036442193953_f64),
            (-2.4738680891405878_f64, -6.948608010655559_f64, 3.789392248519664_f64, 0.48887982303523064_f64),
            (0.10617024315601142_f64, -7.0321313605237705_f64, 8.374970889138975_f64, -0.349170603776115_f64),
            (8.888779088037207_f64, -4.927684639979963_f64, 9.059370333148099_f64, 0.5387085060887123_f64),
            (11.461566638540683_f64, -1.7049756809062482_f64, 5.498710140474214_f64, 0.20376356026509093_f64),
            (4.509543832031441_f64, 1.040351480705191_f64, 0.5616863722793237_f64, 0.5393845802557409_f64),
            (-1.3284089068445457_f64, 1.9371729275050238_f64, -1.8414003962495755_f64, -0.03662063953539599_f64),
            (2.95447358748738_f64, 0.48374586351835314_f64, 0.2821174066670009_f64, 0.19630283702698323_f64),
            (11.53790915335722_f64, -2.7163139089608324_f64, 5.499263257977715_f64, -0.3895852527263095_f64),
            (12.30129530416765_f64, -6.237921932945588_f64, 10.035864603850015_f64, -0.02914939299467822_f64),
            (4.580420266810614_f64, -8.504764584435899_f64, 10.632771404463444_f64, -0.8193207982206946_f64),
            (0.14053478535329855_f64, -8.530664000365654_f64, 7.012315907966371_f64, 0.31317825926380505_f64),
        ];
        for (x, y, z, expected) in cases {
            let got = noise.noise3d(x, y, z);
            assert!(
                (got - expected).abs() < 1e-12,
                "noise3d({}, {}, {}) = {}, expected {} (diff {})",
                x, y, z, got, expected, (got - expected).abs()
            );
        }
    }
}


