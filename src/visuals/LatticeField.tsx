import type { ThreeEvent } from "@react-three/fiber";
import { useFrame } from "@react-three/fiber";
import { useMemo, useRef } from "react";
import {
  BufferAttribute,
  BufferGeometry,
  Color,
  DynamicDrawUsage,
  InstancedMesh,
  LineBasicMaterial,
  Matrix4,
  MeshBasicMaterial,
  MeshPhysicalMaterial,
  Vector3,
} from "three";
import { CHAPTERS } from "../chapters/definitions";
import { sampleExperience } from "../chapters/interpolate";
import { useExperienceStore } from "../experience/store";
import {
  createLatticeField,
  deformNode,
  type LatticeField as LatticeFieldData,
} from "../simulation/field";
import { FlowParticles } from "./FlowParticles";

const matrix = new Matrix4();
const hitMatrix = new Matrix4();
const nodeScale = new Vector3();
const hitScale = new Vector3();
const nodeColor = new Color();

export function LatticeField() {
  const profile = useExperienceStore((state) => state.profile);
  const nodeCount = profile?.nodeCount ?? 38;
  const field = useMemo(() => createLatticeField(nodeCount), [nodeCount]);
  const nodesRef = useRef<InstancedMesh>(null);
  const hitRef = useRef<InstancedMesh>(null);
  const currentPositions = useMemo(
    () => field.nodes.map((node) => node.base.clone()),
    [field],
  );
  const edgeGeometry = useMemo(
    () => createEdgeGeometry(field),
    [field],
  );
  const edgeMaterial = useMemo(
    () =>
      new LineBasicMaterial({
        color: "#e9bd72",
        transparent: true,
        opacity: 0.34,
        depthWrite: false,
        toneMapped: false,
      }),
    [],
  );
  const nodeMaterial = useMemo(
    () =>
      new MeshPhysicalMaterial({
        color: "#dce8ff",
        emissive: "#9cb8ff",
        emissiveIntensity: 2.1,
        roughness: 0.12,
        metalness: 0.08,
        transmission: 0.35,
        thickness: 0.25,
        transparent: true,
        opacity: 0.94,
      }),
    [],
  );
  const hitMaterial = useMemo(
    () =>
      new MeshBasicMaterial({
        color: "#ffffff",
        transparent: true,
        opacity: 0,
        depthWrite: false,
      }),
    [],
  );

  useFrame((state) => {
    const mesh = nodesRef.current;
    const hitMesh = hitRef.current;
    if (!mesh || !hitMesh) return;
    const store = useExperienceStore.getState();
    const sample = sampleExperience(store.scrollProgress);
    const time = state.clock.elapsedTime;
    const positions = edgeGeometry.getAttribute("position") as BufferAttribute;

    field.nodes.forEach((node, index) => {
      const position = deformNode(
        node,
        sample.simulation,
        store.pointer,
        store.impulse,
        time,
      );
      const collapseJitter =
        Math.sin(time * 8.8 + node.phase * 3.1) *
        sample.visual.collapseDistortion *
        0.075;
      position.x += collapseJitter;
      position.y -= collapseJitter * 0.55;
      position.z +=
        Math.cos(time * 7.4 + node.phase) *
        sample.visual.collapseDistortion *
        0.06;
      currentPositions[index].copy(position);
      const pulse =
        0.9 +
        Math.sin(time * 1.2 + node.phase) * 0.12 +
        sample.simulation.tension * 0.16;
      const hierarchy = index % 5 === 0 ? 0.9 : 0.22;
      nodeScale.setScalar(
        ((0.02 + sample.visual.stressIntensity * 0.014) * pulse +
          sample.simulation.emergence * 0.008) *
          hierarchy,
      );
      matrix.compose(
        position,
        mesh.quaternion,
        nodeScale,
      );
      mesh.setMatrixAt(index, matrix);
      hitScale.setScalar(index % 5 === 0 ? 0.32 : 0.18);
      hitMatrix.compose(position, hitMesh.quaternion, hitScale);
      hitMesh.setMatrixAt(index, hitMatrix);
      nodeColor
        .set(index % 5 === 0 ? sample.palette.accent : sample.palette.primary)
        .multiplyScalar(0.82 + sample.simulation.tension * 0.18);
      mesh.setColorAt(index, nodeColor);
    });

    field.edges.forEach((edge, edgeIndex) => {
      const from = currentPositions[edge.from];
      const to = currentPositions[edge.to];
      const offset = edgeIndex * 6;
      positions.setXYZ(offset / 3, from.x, from.y, from.z);
      positions.setXYZ(offset / 3 + 1, to.x, to.y, to.z);
    });

    positions.needsUpdate = true;
    mesh.instanceMatrix.needsUpdate = true;
    hitMesh.instanceMatrix.needsUpdate = true;
    if (mesh.instanceColor) mesh.instanceColor.needsUpdate = true;
    edgeMaterial.color.lerp(
      new Color(sample.palette.accent).multiplyScalar(
        1.05 + sample.visual.stressIntensity * 0.45,
      ),
      0.06,
    );
    edgeMaterial.opacity =
      0.035 +
      sample.simulation.birth * 0.065 +
      sample.visual.stressIntensity * 0.31;
    nodeMaterial.emissive.lerp(new Color(sample.palette.primary), 0.05);
    nodeMaterial.emissiveIntensity =
      1 + sample.visual.stressIntensity * 2.4 + sample.simulation.emergence;
    nodeMaterial.opacity =
      0.28 +
      sample.visual.stressIntensity * 0.14 +
      sample.simulation.emergence * 0.08;
  });

  const handleNodeClick = (event: ThreeEvent<MouseEvent>) => {
    event.stopPropagation();
    if (event.instanceId === undefined) return;
    const nodeId = event.instanceId;
    const store = useExperienceStore.getState();
    const chapter = CHAPTERS[
      Math.min(CHAPTERS.length - 1, Math.floor(store.scrollProgress * 6))
    ];
    store.fireImpulse(nodeId);
    store.setSelectedFragment({
      nodeId,
      text: chapter.fragment,
    });
  };

  return (
    <group>
      <lineSegments geometry={edgeGeometry} material={edgeMaterial} />
      <instancedMesh
        ref={nodesRef}
        args={[undefined, nodeMaterial, field.nodes.length]}
        onClick={handleNodeClick}
      >
        <icosahedronGeometry args={[1, 1]} />
      </instancedMesh>
      <instancedMesh
        ref={hitRef}
        args={[undefined, hitMaterial, field.nodes.length]}
        onClick={handleNodeClick}
      >
        <sphereGeometry args={[1, 12, 12]} />
      </instancedMesh>
      <FlowParticles field={field} currentPositions={currentPositions} />
    </group>
  );
}

function createEdgeGeometry(field: LatticeFieldData) {
  const geometry = new BufferGeometry();
  const positions = new Float32Array(field.edges.length * 2 * 3);
  const attribute = new BufferAttribute(positions, 3);
  attribute.setUsage(DynamicDrawUsage);
  geometry.setAttribute("position", attribute);
  return geometry;
}
