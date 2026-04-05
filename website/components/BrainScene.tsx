'use client'

/**
 * 3D Brain visualization using React Three Fiber v9.
 * A distorted sphere with brain-like surface, warm Memoria colors,
 * neural particle system, and soft rotation.
 */

import { useRef, useMemo } from 'react'
import { Canvas, useFrame } from '@react-three/fiber'
import { MeshDistortMaterial, Float, Sparkles, Environment } from '@react-three/drei'
import * as THREE from 'three'

// ── Brain mesh ──
function Brain() {
  const meshRef = useRef<THREE.Mesh>(null!)
  const innerRef = useRef<THREE.Mesh>(null!)

  useFrame((state) => {
    if (meshRef.current) {
      meshRef.current.rotation.y = state.clock.elapsedTime * 0.12
      meshRef.current.rotation.x = Math.sin(state.clock.elapsedTime * 0.08) * 0.15
      meshRef.current.rotation.z = Math.cos(state.clock.elapsedTime * 0.06) * 0.05
    }
    if (innerRef.current) {
      innerRef.current.rotation.y = -state.clock.elapsedTime * 0.08
      innerRef.current.rotation.x = Math.cos(state.clock.elapsedTime * 0.1) * 0.1
    }
  })

  return (
    <Float speed={1.2} rotationIntensity={0.15} floatIntensity={1}>
      <group>
        {/* Main brain — distorted sphere with sulci-like ridges */}
        <mesh ref={meshRef} scale={1.6}>
          <sphereGeometry args={[1, 128, 128]} />
          <MeshDistortMaterial
            color="#E8A87C"
            emissive="#6B5235"
            emissiveIntensity={0.25}
            roughness={0.55}
            metalness={0.05}
            distort={0.45}
            speed={1.2}
          />
        </mesh>

        {/* Inner glow — slightly smaller, more translucent */}
        <mesh ref={innerRef} scale={1.35}>
          <sphereGeometry args={[1, 64, 64]} />
          <MeshDistortMaterial
            color="#D4A5A5"
            emissive="#E8A87C"
            emissiveIntensity={0.4}
            roughness={0.7}
            metalness={0}
            distort={0.3}
            speed={1.8}
            transparent
            opacity={0.35}
          />
        </mesh>

        {/* Wireframe shell — neural network pattern */}
        <mesh scale={2.0}>
          <icosahedronGeometry args={[1, 3]} />
          <meshBasicMaterial
            color="#8B6F47"
            wireframe
            transparent
            opacity={0.06}
          />
        </mesh>

        {/* Neural sparkles */}
        <Sparkles
          count={40}
          scale={4}
          size={2.5}
          speed={0.4}
          color="#E8A87C"
          opacity={0.5}
        />
        <Sparkles
          count={20}
          scale={3.5}
          size={1.5}
          speed={0.3}
          color="#D4A5A5"
          opacity={0.3}
        />
      </group>
    </Float>
  )
}

// ── Canvas wrapper ──
export default function BrainScene() {
  return (
    <div className="w-full h-full min-h-[220px]">
      <Canvas
        camera={{ position: [0, 0, 5.5], fov: 38 }}
        style={{ background: 'transparent' }}
        gl={{ alpha: true, antialias: true }}
      >
        {/* Warm Memoria lighting */}
        <ambientLight intensity={0.5} color="#FFF8F0" />
        <pointLight position={[4, 4, 5]} intensity={1.2} color="#E8A87C" />
        <pointLight position={[-4, -2, 3]} intensity={0.6} color="#D4A5A5" />
        <pointLight position={[0, 5, -4]} intensity={0.4} color="#7D6340" />
        <spotLight
          position={[0, 8, 0]}
          angle={0.5}
          penumbra={0.8}
          intensity={0.3}
          color="#FFF8F0"
        />

        <Brain />
        <Environment preset="sunset" environmentIntensity={0.2} />
      </Canvas>
    </div>
  )
}
