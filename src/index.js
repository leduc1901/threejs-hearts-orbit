import * as THREE from 'three'
import ReactDOM from 'react-dom'
import React, { useEffect, useRef, useMemo } from 'react'
import { Canvas, extend, useFrame, useThree } from '@react-three/fiber'
import { EffectComposer } from 'three/examples/jsm/postprocessing/EffectComposer'
import { ShaderPass } from 'three/examples/jsm/postprocessing/ShaderPass'
import { RenderPass } from 'three/examples/jsm/postprocessing/RenderPass'
import { UnrealBloomPass } from 'three/examples/jsm/postprocessing/UnrealBloomPass'
import { FilmPass } from 'three/examples/jsm/postprocessing/FilmPass'
import { WaterPass } from './Waterpass'
import './styles.css'

const heartShape = new THREE.Shape()

heartShape.moveTo(25, 25)
heartShape.bezierCurveTo(25, 25, 20, 0, 0, 0)
heartShape.bezierCurveTo(-30, 0, -30, 35, -30, 35)
heartShape.bezierCurveTo(-30, 55, -10, 77, 25, 95)
heartShape.bezierCurveTo(60, 77, 80, 55, 80, 35)
heartShape.bezierCurveTo(80, 35, 80, 0, 50, 0)
heartShape.bezierCurveTo(35, 0, 25, 25, 25, 25)

const extrudeSettings = {
  depth: 8,
  bevelEnabled: true,
  bevelSegments: 2,
  steps: 2,
  bevelSize: 1,
  bevelThickness: 1
}

const heartGeometry = new THREE.ExtrudeGeometry(heartShape, extrudeSettings)
const heartMesh = new THREE.MeshStandardMaterial({ roughness: 0 })
const heartGroup = new THREE.Mesh(heartGeometry, heartMesh)
const heart3D = new THREE.Object3D()
heart3D.add(heartGroup)
// Makes these prototypes available as "native" jsx-string elements
extend({ EffectComposer, ShaderPass, RenderPass, WaterPass, UnrealBloomPass, FilmPass })

function Swarm({ count }) {
  const mesh = useRef()
  const light = useRef()
  const { size, viewport } = useThree()
  const aspect = size.width / viewport.width

  const dummy = useMemo(() => new THREE.Object3D(), [])

  // Generate some random positions, speed factors and timings
  const particles = useMemo(() => {
    const temp = []
    for (let i = 0; i < count; i++) {
      const t = Math.random() * 100
      const factor = 20 + Math.random() * 100
      const speed = 0.01 + Math.random() / 20
      const xFactor = -50 + Math.random() * 100
      const yFactor = -50 + Math.random() * 100
      const zFactor = -50 + Math.random() * 100
      temp.push({ t, factor, speed, xFactor, yFactor, zFactor, mx: 0, my: 0 })
    }
    return temp
  }, [count])
  console.log(dummy)
  // The innards of this hook will run every frame
  useFrame((state) => {
    // Makes the light follow the mouse
    light.current.position.set(-state.mouse.x * aspect, -state.mouse.y * aspect, 0)
    // Run through the randomized data to calculate some movement
    particles.forEach((particle, i) => {
      let { t, factor, speed, xFactor, yFactor, zFactor } = particle
      // There is no sense or reason to any of this, just messing around with trigonometric functions
      t = particle.t += speed / 10
      const a = Math.cos(t) + Math.sin(t * 2) / 10
      const b = Math.sin(t) + Math.cos(t * 2) / 10
      const s = Math.cos(t)
      particle.mx += (state.mouse.x * 1000 - particle.mx) * 0.01
      particle.my += (state.mouse.y * 1000 - 1 - particle.my) * 0.01

      dummy.position.set(
        (particle.mx / 0.5) * a + xFactor + Math.cos((t / 0.5) * factor) + (Math.sin(t * 1) * factor) / 0.5,
        (particle.my / 0.5) * b + yFactor + Math.sin((t / 0.5) * factor) + (Math.cos(t * 2) * factor) / 0.5,
        (particle.my / 0.5) * b + zFactor + Math.cos((t / 0.5) * factor) + (Math.sin(t * 3) * factor) / 0.5
      )
      dummy.scale.set(s, s, s)
      dummy.rotation.set(s * 5, s * 5, s * 5)
      dummy.updateMatrix()
      // And apply the matrix to the instanced item
      mesh.current.setMatrixAt(i, dummy.matrix)
    })
    mesh.current.instanceMatrix.needsUpdate = true
  })
  return (
    <>
      <pointLight ref={light} distance={1000} intensity={4} color="lightblue">
        <mesh scale={[1, 1, 2]}>
          <dodecahedronBufferGeometry args={[4, 0]} />
          <meshBasicMaterial color="lightblue" transparent />
        </mesh>
      </pointLight>
      <instancedMesh rotation={[0, 0, 3]} position={[0, 20, -10]} castShadow receiveShadow scale={0.04} ref={mesh} args={[null, null, count]}>
        <extrudeGeometry args={[heartShape, extrudeSettings]} />
        <meshStandardMaterial roughness={0} color="#ff0022" />
      </instancedMesh>
    </>
  )
}

function Effect({ down }) {
  const composer = useRef()
  const { scene, gl, size, camera } = useThree()
  const aspect = useMemo(() => new THREE.Vector2(size.width, size.height), [size])
  useEffect(() => void composer.current.setSize(size.width, size.height), [size])
  useFrame(() => composer.current.render(), 1)
  return (
    <effectComposer ref={composer} args={[gl]}>
      <renderPass attachArray="passes" scene={scene} camera={camera} />
      <unrealBloomPass attachArray="passes" args={[aspect, 1.5, 1, 0]} />
      <filmPass attachArray="passes" args={[0.5, 0.4, 1500, false]} />
    </effectComposer>
  )
}

function App() {
  return (
    <Canvas linear camera={{ fov: 100, position: [0, 0, 30] }}>
      <pointLight distance={60} intensity={2} color="lightblue" />
      <spotLight intensity={2} position={[0, 0, 70]} penumbra={1} color="red" />
      <mesh>
        <planeGeometry args={[10000, 10000]} />
        <meshStandardMaterial color="#00ffff" depthTest={false} />
      </mesh>
      <Swarm count={3000} />
      <Effect />
    </Canvas>
  )
}

ReactDOM.render(<App />, document.getElementById('root'))
