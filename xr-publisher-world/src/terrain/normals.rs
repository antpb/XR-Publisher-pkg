/// Compute vertex normals for a terrain grid mesh.
/// Port of Three.js computeVertexNormals() for a grid topology.

/// Compute vertex normals from positions using grid topology.
/// The grid has (segments+1) x (segments+1) vertices.
/// Returns a Vec<f32> of interleaved (nx, ny, nz) per vertex.
pub fn compute_vertex_normals(positions: &[f32], segments: usize) -> Vec<f32> {
    let vertices_per_side = segments + 1;
    let total_verts = vertices_per_side * vertices_per_side;
    let mut normals = vec![0.0f32; total_verts * 3];

    // For each quad in the grid, compute face normals for 2 triangles
    // and accumulate them at each vertex.
    for j in 0..segments {
        for i in 0..segments {
            // Vertex indices for the quad
            let a = j * vertices_per_side + i;
            let b = (j + 1) * vertices_per_side + i;
            let c = (j + 1) * vertices_per_side + (i + 1);
            let d = j * vertices_per_side + (i + 1);

            // Triangle 1: a, b, d (matching PlaneGeometry index order)
            accumulate_face_normal(positions, &mut normals, a, b, d);

            // Triangle 2: b, c, d
            accumulate_face_normal(positions, &mut normals, b, c, d);
        }
    }

    // Normalize all vertex normals
    for i in 0..total_verts {
        let idx = i * 3;
        let nx = normals[idx];
        let ny = normals[idx + 1];
        let nz = normals[idx + 2];
        let len = (nx * nx + ny * ny + nz * nz).sqrt();
        if len > 0.0 {
            normals[idx] /= len;
            normals[idx + 1] /= len;
            normals[idx + 2] /= len;
        }
    }

    normals
}

/// Compute vertex normals for an arbitrary indexed mesh (triangle soup),
/// replicating THREE.js `BufferGeometry.computeVertexNormals`. THREE uses
/// area-weighted (un-normalised) face normals computed as
/// `(pC - pB) × (pA - pB)`, accumulated per vertex, then normalised once.
/// Used for the marching-cubes mountain mesh (the grid-topology
/// `compute_vertex_normals` above does not apply to a welded soup).
pub fn compute_indexed_vertex_normals(positions: &[f32], indices: &[u32]) -> Vec<f32> {
    let mut normals = vec![0f64; positions.len()];

    let mut t = 0;
    while t + 2 < indices.len() {
        let ia = indices[t] as usize * 3;
        let ib = indices[t + 1] as usize * 3;
        let ic = indices[t + 2] as usize * 3;

        let (ax, ay, az) = (positions[ia] as f64, positions[ia + 1] as f64, positions[ia + 2] as f64);
        let (bx, by, bz) = (positions[ib] as f64, positions[ib + 1] as f64, positions[ib + 2] as f64);
        let (cx, cy, cz) = (positions[ic] as f64, positions[ic + 1] as f64, positions[ic + 2] as f64);

        // cb = C - B, ab = A - B, faceNormal = cb × ab  (THREE order).
        let cbx = cx - bx;
        let cby = cy - by;
        let cbz = cz - bz;
        let abx = ax - bx;
        let aby = ay - by;
        let abz = az - bz;
        let nx = cby * abz - cbz * aby;
        let ny = cbz * abx - cbx * abz;
        let nz = cbx * aby - cby * abx;

        for &idx in &[ia, ib, ic] {
            normals[idx] += nx;
            normals[idx + 1] += ny;
            normals[idx + 2] += nz;
        }
        t += 3;
    }

    let mut out = vec![0f32; positions.len()];
    let vert_count = positions.len() / 3;
    for v in 0..vert_count {
        let i = v * 3;
        let nx = normals[i];
        let ny = normals[i + 1];
        let nz = normals[i + 2];
        let len = (nx * nx + ny * ny + nz * nz).sqrt();
        if len > 0.0 {
            out[i] = (nx / len) as f32;
            out[i + 1] = (ny / len) as f32;
            out[i + 2] = (nz / len) as f32;
        }
    }
    out
}

/// Compute the face normal for triangle (a, b, c) and add it to each vertex.
#[inline]
fn accumulate_face_normal(positions: &[f32], normals: &mut [f32], a: usize, b: usize, c: usize) {
    let ax = positions[a * 3];
    let ay = positions[a * 3 + 1];
    let az = positions[a * 3 + 2];
    let bx = positions[b * 3];
    let by = positions[b * 3 + 1];
    let bz = positions[b * 3 + 2];
    let cx = positions[c * 3];
    let cy = positions[c * 3 + 1];
    let cz = positions[c * 3 + 2];

    // Edge vectors
    let e1x = bx - ax;
    let e1y = by - ay;
    let e1z = bz - az;
    let e2x = cx - ax;
    let e2y = cy - ay;
    let e2z = cz - az;

    // Cross product
    let nx = e1y * e2z - e1z * e2y;
    let ny = e1z * e2x - e1x * e2z;
    let nz = e1x * e2y - e1y * e2x;

    // Accumulate at each vertex
    for &idx in &[a, b, c] {
        normals[idx * 3] += nx;
        normals[idx * 3 + 1] += ny;
        normals[idx * 3 + 2] += nz;
    }
}
