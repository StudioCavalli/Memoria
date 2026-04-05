'use client'

/**
 * 3D Brain — React Three Fiber v9.
 * Distorted sphere with brain-like surface, warm Memoria palette.
 */

import { useRef } from 'react'
import { Canvas, useFrame } from '@react-three/fiber'
import { Float } from '@react-three/drei'
import type { Mesh } from 'three'

function Brain() {
  const outerRef = useRef<Mesh>(null!)
  const innerRef = useRef<Mesh>(null!)
  const wireRef = useRef<Mesh>(null!)

  useFrame((state) => {
    const t = state.clock.elapsedTime
    if (outerRef.current) {
      outerRef.current.rotation.y = t * 0.12
      outerRef.current.rotation.x = Math.sin(t * 0.08) * 0.15
    }
    if (innerRef.current) {
      innerRef.current.rotation.y = -t * 0.08
    }
    if (wireRef.current) {
      wireRef.current.rotation.y = t * 0.05
      wireRef.current.rotation.z = t * 0.03
    }
  })

  return (
    <Float speed={1.2} rotationIntensity={0.15} floatIntensity={1}>
      <group>
        {/* Main brain surface */}
        <mesh ref={outerRef} scale={1.6}>
          <sphereGeometry args={[1, 128, 128]} />
          <meshStandardMaterial
            color="#E8A87C"
            emissive="#6B5235"
            emissiveIntensity={0.25}
            roughness={0.55}
            metalness={0.05}
          />
        </mesh>

        {/* Inner glow */}
        <mesh ref={innerRef} scale={1.35}>
          <sphereGeometry args={[1, 64, 64]} />
          <meshStandardMaterial
            color="#D4A5A5"
            emissive="#E8A87C"
            emissiveIntensity={0.4}
            roughness={0.7}
            metalness={0}
            transparent
            opacity={0.35}
          />
        </mesh>

        {/* Neural wireframe shell */}
        <mesh ref={wireRef} scale={2.0}>
          <icosahedronGeometry args={[1, 2]} />
          <meshBasicMaterial
            color="#8B6F47"
            wireframe
            transparent
            opacity={0.08}
          />
        </mesh>
      </group>
    </Float>
  )
}

export default function BrainScene() {
  return (
    <div className="w-full h-full min-h-[220px]">
      <Canvas
        camera={{ position: [0, 0, 5.5], fov: 38 }}
        style={{ background: 'transparent' }}
        gl={{ alpha: true, antialias: true }}
      >
        <ambientLight intensity={0.5} color="#FFF8F0" />
        <pointLight position={[4, 4, 5]} intensity={1.2} color="#E8A87C" />
        <pointLight position={[-4, -2, 3]} intensity={0.6} color="#D4A5A5" />
        <pointLight position={[0, 5, -4]} intensity={0.4} color="#7D6340" />
        <Brain />
      </Canvas>
    </div>
  )
}
