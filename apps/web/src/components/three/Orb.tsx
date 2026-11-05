"use client";

import { Canvas, useFrame } from "@react-three/fiber";
import { Environment, Lightformer } from "@react-three/drei";
import { useReducedMotion } from "motion/react";
import { useMemo, useRef } from "react";
import * as THREE from "three";
import { mergeVertices } from "three/examples/jsm/utils/BufferGeometryUtils.js";
import { useUI } from "@/stores/ui";

const PETALS = 14;
const TWIST = 0.55;

/** Sphere whose radius is modulated by twisted petals: the fluted "gourd" orb from the reference. */
function makeOrbGeometry() {
  let g: THREE.BufferGeometry = new THREE.SphereGeometry(1, 220, 160);
  g.deleteAttribute("uv");
  g.deleteAttribute("normal");
  g = mergeVertices(g); // weld the seam so normals stay smooth
  const pos = g.attributes.position as THREE.BufferAttribute;
  const v = new THREE.Vector3();
  for (let i = 0; i < pos.count; i++) {
    v.fromBufferAttribute(pos, i);
    const phi = Math.atan2(v.z, v.x);
    const ridge = Math.pow(Math.abs(Math.cos((PETALS / 2) * (phi + TWIST * v.y))), 0.9);
    const pole = 1 - Math.pow(Math.abs(v.y), 6); // flatten flutes near the poles
    v.multiplyScalar(0.84 + 0.16 * ridge * pole + 0.16 * (1 - pole));
    pos.setXYZ(i, v.x, v.y, v.z);
  }
  g.computeVertexNormals();
  return g;
}

function OrbMesh() {
  const ref = useRef<THREE.Mesh>(null);
  const geometry = useMemo(() => makeOrbGeometry(), []);
  const reduce = useReducedMotion();
  const speed = useRef(0.18);
  useFrame((_, dt) => {
    if (!ref.current || reduce) return;
    // Spin faster while a route is being quoted; ease between speeds.
    const target = useUI.getState().quoting ? 1.4 : 0.18;
    speed.current += (target - speed.current) * Math.min(1, dt * 3);
    ref.current.rotation.y += dt * speed.current;
  });
  return (
    <mesh ref={ref} geometry={geometry} position={[0, -0.42, 0]} rotation={[0.8, 0, -0.08]}>
      <meshPhysicalMaterial color="#1d4fe6" roughness={0.28} metalness={0.05} clearcoat={1} clearcoatRoughness={0.25} sheen={0.6} sheenColor="#5b8cff" />
    </mesh>
  );
}

export default function Orb() {
  return (
    <Canvas dpr={[1, 2]} camera={{ position: [0, 0, 3.4], fov: 30 }} gl={{ antialias: true, alpha: true }} aria-hidden>
      <ambientLight intensity={0.12} />
      <directionalLight position={[2, 3, 2]} intensity={1.6} color="#cfe0ff" />
      <OrbMesh />
      <Environment resolution={256}>
        <Lightformer form="rect" intensity={2.4} position={[2.5, 2, 2]} scale={[3, 2, 1]} color="#9ec0ff" />
        <Lightformer form="rect" intensity={1.2} position={[-3, 0.5, 1]} scale={[2, 3, 1]} color="#3a6bff" />
        <Lightformer form="circle" intensity={0.8} position={[0, -2, -2]} scale={2} color="#0a1a4a" />
      </Environment>
    </Canvas>
  );
}
