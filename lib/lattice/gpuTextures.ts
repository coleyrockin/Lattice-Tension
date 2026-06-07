import * as THREE from 'three';

export function buildNodeTexture(nodes: THREE.Vector3[]) {
  const data = new Float32Array(nodes.length * 3);
  for (let i = 0; i < nodes.length; i++) {
    data[i * 3] = nodes[i].x;
    data[i * 3 + 1] = nodes[i].y;
    data[i * 3 + 2] = nodes[i].z;
  }
  const tex = new THREE.DataTexture(data, nodes.length, 1, THREE.RGBFormat, THREE.FloatType);
  tex.needsUpdate = true;
  return tex;
}

export function buildEdgeTexture(edges: number[], edgeCount: number) {
  const data = new Float32Array(edgeCount * 2);
  for (let i = 0; i < edgeCount; i++) {
    data[i * 2] = edges[i * 2];
    data[i * 2 + 1] = edges[i * 2 + 1];
  }
  const tex = new THREE.DataTexture(data, edgeCount, 1, THREE.RGFormat, THREE.FloatType);
  tex.needsUpdate = true;
  return tex;
}