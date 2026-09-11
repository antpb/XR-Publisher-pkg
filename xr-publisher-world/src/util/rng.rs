/// Bit-exact port of the JavaScript `alea` PRNG from seedrandom.
/// This matches the output of `require('seedrandom').alea(seed)`.
///
/// Reference: https://github.com/davidbau/seedrandom (alea algorithm)
/// Original: Johannes Baagøe <baagoe@baagoe.com>, 2010

pub struct Alea {
    s0: f64,
    s1: f64,
    s2: f64,
    c: f64,
}

impl Alea {
    /// Create a new Alea PRNG seeded with the given string.
    pub fn new(seed: &str) -> Self {
        let mut mash = Mash::new();

        let mut s0 = mash.hash(" ");
        let mut s1 = mash.hash(" ");
        let mut s2 = mash.hash(" ");

        s0 -= mash.hash(seed);
        if s0 < 0.0 {
            s0 += 1.0;
        }
        s1 -= mash.hash(seed);
        if s1 < 0.0 {
            s1 += 1.0;
        }
        s2 -= mash.hash(seed);
        if s2 < 0.0 {
            s2 += 1.0;
        }

        Alea {
            s0,
            s1,
            s2,
            c: 1.0,
        }
    }

    /// Clone the current state (for branching RNG streams).
    pub fn clone_state(&self) -> Self {
        Alea {
            s0: self.s0,
            s1: self.s1,
            s2: self.s2,
            c: self.c,
        }
    }

    /// Generate the next random number in [0, 1).
    #[inline]
    pub fn next(&mut self) -> f64 {
        let t = 2091639.0 * self.s0 + self.c * 2.3283064365386963e-10;
        self.s0 = self.s1;
        self.s1 = self.s2;
        self.c = f64::floor(t);
        self.s2 = t - self.c;
        self.s2
    }
}

/// The Mash function used by Alea for seeding.
/// Converts string data into a numeric hash in [0, 1).
///
/// CRITICAL bit-exactness detail: in the JS original, `n` is a Number —
/// after `n += h * 0x100000000` it carries a FRACTIONAL part into the
/// next iteration (and across hash() calls), and `>>> 0` (ToUint32)
/// wraps mod 2^32. An earlier port stored `n` as u32, truncating that
/// fractional carry each round — inert for some seed strings, divergent
/// for others (e.g. "demo-biome-elev"), which silently broke WASM↔JS
/// noise parity for affected seeds.
struct Mash {
    n: f64,
}

impl Mash {
    fn new() -> Self {
        Mash {
            n: 0xefc8249d_u32 as f64,
        }
    }

    /// JS `x >>> 0` (ToUint32) for non-negative finite x, kept as f64 so
    /// subsequent float math matches JS exactly.
    #[inline]
    fn to_uint32(x: f64) -> f64 {
        let m = x.trunc() % 4294967296.0;
        if m < 0.0 {
            m + 4294967296.0
        } else {
            m
        }
    }

    fn hash(&mut self, data: &str) -> f64 {
        // JS iterates UTF-16 code units (charCodeAt).
        for cu in data.encode_utf16() {
            self.n += cu as f64;
            let mut h = 0.02519603282416938 * self.n;
            let n1 = Self::to_uint32(h);
            h -= n1;
            h *= n1;
            let n2 = Self::to_uint32(h);
            h -= n2;
            self.n = n2 + h * 4294967296.0; // h * 2^32 — keeps the fraction
        }
        Self::to_uint32(self.n) * 2.3283064365386963e-10 // (n >>> 0) * 2^-32
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    /// Reference values from `require('seedrandom').alea(seed)` — the exact
    /// package the JS runtime uses. Guards the fractional-carry Mash
    /// behavior (see Mash docs); the seed below is one that diverged
    /// under the old u32-truncating port.
    #[test]
    fn test_alea_matches_js_reference() {
        let mut rng = Alea::new("demo-biome-elev");
        let expected = [
            0.5849198987707496,
            0.8021977469325066,
            0.5644188784062862,
            0.2722756881266832,
            0.0934810156468302,
            0.5388015145435929,
        ];
        for (i, e) in expected.iter().enumerate() {
            let got = rng.next();
            assert!(
                (got - e).abs() < 1e-15,
                "alea draw {} mismatch: got {}, expected {}",
                i, got, e
            );
        }
    }

    #[test]
    fn test_alea_determinism() {
        // Same seed must produce same sequence.
        let mut a = Alea::new("test-seed-42");
        let mut b = Alea::new("test-seed-42");
        for _ in 0..100 {
            assert_eq!(a.next(), b.next());
        }
    }

    #[test]
    fn test_alea_different_seeds() {
        let mut a = Alea::new("seed-a");
        let mut b = Alea::new("seed-b");
        // Very unlikely to match
        assert_ne!(a.next(), b.next());
    }

    #[test]
    fn test_alea_range() {
        let mut rng = Alea::new("range-test");
        for _ in 0..1000 {
            let v = rng.next();
            assert!(v >= 0.0 && v < 1.0, "value {} out of range", v);
        }
    }
}
