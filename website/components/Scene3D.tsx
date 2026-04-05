'use client'

import { useRef } from 'react'
import { Canvas, useFrame } from '@react-three/fiber'
import { MeshDistortMaterial, Float, Environment } from '@react-three/drei'
import * as THREE from 'three'

function MemoryOrb() {
  const meshRef = useRef<THREE.Mesh>(null!)

  useFrame((state) => {
    if (meshRef.current) {
      meshRef.current.rotation.y = state.clock.elapsedTime * 0.15
      meshRef.current.rotation.x = Math.sin(state.clock.elapsedTime * 0.1) * 0.1
    }
  })

  return (
    <Float speed={1.5} rotationIntensity={0.2} floatIntensity={1.5}>
      <mesh ref={meshRef} scale={1.4}>
        <sphereGeometry args={[1, 64, 64]} />
        <MeshDistortMaterial
          color="#E8A87C"
          emissive="#8B6F47"
          emissiveIntensity={0.3}
          roughness={0.3}
          metalness={0.1}
          distort={0.35}
          speed={1.5}
          transparent
          opacity={0.9}
        />
      </mesh>
      {/* Inner glow orb */}
      <mesh scale={1.1}>
        <sphereGeometry args={[1, 32, 32]} />
        <MeshDistortMaterial
          color="#D4A5A5"
          emissive="#E8A87C"
          emissiveIntensity={0.5}
          roughness={0.5}
          metalness={0}
          distort={0.25}
          speed={2}
          transparent
          opacity={0.4}
        />
      </mesh>
      {/* Small outer particles */}
      <mesh scale={1.8}>
        <sphereGeometry args={[1, 16, 16]} />
        <MeshDistortMaterial
          color="#FFF8F0"
          emissive="#E8A87C"
          emissiveIntensity={0.2}
          roughness={1}
          metalness={0}
          distort={0.5}
          speed={0.8}
          transparent
          opacity={0.12}
          wireframe
        />
      </mesh>
    </Float>
  )
}

export default function Scene3D() {
  return (
    <div className="w-full h-full min-h-[400px]">
      <Canvas
        camera={{ position: [0, 0, 7], fov: 40 }}
        style={{ background: 'transparent' }}
        gl={{ alpha: true, antialias: true }}
      >
        <ambientLight intensity={0.6} color="#FFF8F0" />
        <pointLight position={[5, 5, 5]} intensity={1} color="#E8A87C" />
        <pointLight position={[-5, -3, 3]} intensity={0.5} color="#D4A5A5" />
        <pointLight position={[0, 5, -5]} intensity={0.3} color="#8B6F47" />
        <MemoryOrb />
        <Environment preset="sunset" environmentIntensity={0.3} />
      </Canvas>
    </div>
  )
}
