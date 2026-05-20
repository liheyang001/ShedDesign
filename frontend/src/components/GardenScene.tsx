import { useMemo, useEffect, useRef, useCallback, useState } from 'react'
import * as THREE from 'three'
import { Canvas, useThree, ThreeEvent } from '@react-three/fiber'
import { OrbitControls } from '@react-three/drei'
import type { OrbitControls as OrbitControlsImpl } from 'three-stdlib'
import type { GardenAnalysis, DesignRecommendation } from '../types/garden'
import '../styles/GardenScene.css'

interface GardenSceneProps {
  analysis: GardenAnalysis
  recommendation: DesignRecommendation
  onPositionChange?: (x: number, z: number) => void
  onRotationChange?: (degrees: number) => void
  onScaleChange?: (scale: number) => void
}

interface ShedPos {
  x: number
  z: number
}

interface DraggableShedProps {
  shedPos: ShedPos
  setShedPos: (pos: ShedPos) => void
  isDragging: boolean
  setIsDragging: (val: boolean) => void
  onPositionChange?: (x: number, z: number) => void
  shedWidth: number
  shedDepth: number
  shedHeight: number
  shedRotation: number
  shedScale: number
  gardenWidth: number
  gardenDepth: number
}

function DraggableShed({
  shedPos,
  setShedPos,
  isDragging,
  setIsDragging,
  onPositionChange,
  shedWidth,
  shedDepth,
  shedHeight,
  shedRotation,
  shedScale,
  gardenWidth,
  gardenDepth,
}: DraggableShedProps) {
  const { raycaster } = useThree()

  const groundPlane = useMemo(
    () => new THREE.Plane(new THREE.Vector3(0, 1, 0), 0),
    []
  )

  // FIX_2: useRef to track latest position, avoiding stale closure in handlePointerUp
  const shedPosRef = useRef(shedPos)

  const updatePos = useCallback((x: number, z: number) => {
    shedPosRef.current = { x, z }
    setShedPos({ x, z })
  }, [setShedPos])

  // FIX_1: cleanup cursor/dragging state when pointer is released outside Canvas
  useEffect(() => {
    if (!isDragging) return
    const cleanup = () => {
      setIsDragging(false)
      document.body.style.cursor = ''
    }
    window.addEventListener('pointerup', cleanup)
    return () => window.removeEventListener('pointerup', cleanup)
  }, [isDragging, setIsDragging])

  const rotationRad = -(shedRotation * Math.PI) / 180
  const scaledDepth = shedDepth * shedScale
  const doorOffset = scaledDepth / 2 + 0.5
  const doorX = shedPos.x + Math.sin(rotationRad) * doorOffset
  const doorZ = shedPos.z + Math.cos(rotationRad) * doorOffset

  const scaledWidth = shedWidth * shedScale
  const scaledHeight = shedHeight * shedScale

  const handlePointerDown = useCallback(
    (e: ThreeEvent<PointerEvent>) => {
      e.stopPropagation()
      setIsDragging(true)
      document.body.style.cursor = 'grabbing'
    },
    [setIsDragging]
  )

  const handlePointerMove = useCallback(
    (e: ThreeEvent<PointerEvent>) => {
      if (!isDragging) return
      e.stopPropagation()

      // FIX_3: create intersectPoint locally each call to avoid shared mutable object risk
      const intersectPoint = new THREE.Vector3()
      const hit = raycaster.ray.intersectPlane(groundPlane, intersectPoint)
      if (!hit) return

      const clampedX = Math.max(
        -gardenWidth / 2,
        Math.min(gardenWidth / 2, intersectPoint.x)
      )
      const clampedZ = Math.max(
        -gardenDepth / 2,
        Math.min(gardenDepth / 2, intersectPoint.z)
      )

      updatePos(clampedX, clampedZ)
    },
    [isDragging, raycaster, groundPlane, gardenWidth, gardenDepth, updatePos]
  )

  const handlePointerUp = useCallback(
    (e: ThreeEvent<PointerEvent>) => {
      e.stopPropagation()
      setIsDragging(false)
      document.body.style.cursor = ''
      // FIX_2: read latest position from ref to avoid stale closure
      onPositionChange?.(shedPosRef.current.x, shedPosRef.current.z)
    },
    [setIsDragging, onPositionChange]
  )

  return (
    <>
      {/* Shed main body */}
      <mesh
        position={[shedPos.x, scaledHeight / 2, shedPos.z]}
        rotation={[0, -(shedRotation * Math.PI) / 180, 0]}
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
      >
        <boxGeometry args={[scaledWidth, scaledHeight, scaledDepth]} />
        <meshStandardMaterial color={isDragging ? '#a0714f' : '#8b5e3c'} />
      </mesh>

      {/* Shed roof (pyramid/cone approximation, 4 segments = square base) */}
      <mesh
        position={[shedPos.x, scaledHeight + scaledHeight * 0.25, shedPos.z]}
        rotation={[0, Math.PI / 4 - (shedRotation * Math.PI) / 180, 0]}
      >
        <coneGeometry args={[Math.max(scaledWidth, scaledDepth) * 0.6, scaledHeight * 0.5, 4]} />
        <meshStandardMaterial color="#5d4037" />
      </mesh>

      {/* Door direction indicator (flat yellow cylinder in front of shed) */}
      <mesh position={[doorX, 0.05, doorZ]}>
        <cylinderGeometry args={[0.2, 0.2, 0.1, 8]} />
        <meshStandardMaterial color="#ffc107" />
      </mesh>
    </>
  )
}

export function GardenScene({
  analysis,
  recommendation,
  onPositionChange,
  onRotationChange,
  onScaleChange,
}: GardenSceneProps) {
  const gardenWidth = analysis.estimatedSize.width || 1
  const gardenDepth = analysis.estimatedSize.height || 1

  const { position, size, orientation } = recommendation.primaryRecommendation
  const shedWidth = size.width || 1
  const shedDepth = size.depth || 1
  const shedHeight = size.height || 1

  const [shedPos, setShedPos] = useState<ShedPos>({ x: position.x, z: position.y })
  const [isDragging, setIsDragging] = useState(false)
  const [shedRotation, setShedRotation] = useState(((orientation % 360) + 360) % 360)
  const [shedScale, setShedScale] = useState(1)

  // OrbitControls ref for programmatic reset
  const controlsRef = useRef<OrbitControlsImpl | null>(null)

  // Garden boundary wireframe geometry — memoized to avoid GPU object creation on every render
  const boundaryEdges = useMemo(
    () => new THREE.EdgesGeometry(new THREE.BoxGeometry(gardenWidth, 0.01, gardenDepth)),
    [gardenWidth, gardenDepth]
  )

  useEffect(() => () => { boundaryEdges.dispose() }, [boundaryEdges])

  const handleReset = useCallback(() => {
    if (controlsRef.current) {
      controlsRef.current.reset()
    }
  }, [])

  return (
    <div className="garden-scene-container">
      <Canvas
        camera={{ position: [0, 8, 12], fov: 45 }}
        style={{ height: '400px', background: '#e8f4fd' }}
      >
        {/* Lighting */}
        <ambientLight intensity={0.6} />
        <directionalLight position={[5, 10, 5]} />

        {/* Ground plane */}
        <mesh rotation={[-Math.PI / 2, 0, 0]}>
          <planeGeometry args={[gardenWidth, gardenDepth]} />
          <meshStandardMaterial color="#4caf50" />
        </mesh>

        {/* Garden boundary wireframe */}
        <lineSegments position={[0, 0, 0]}>
          <primitive object={boundaryEdges} attach="geometry" />
          <lineBasicMaterial color="#ffffff" />
        </lineSegments>

        {/* Available placement area highlights */}
        {analysis.availableSpaces.map((space, idx) => (
          <mesh
            key={idx}
            position={[space.x, 0.01, space.y]}
            rotation={[-Math.PI / 2, 0, 0]}
          >
            <planeGeometry args={[space.width, space.height]} />
            <meshStandardMaterial color="#00ff88" transparent opacity={0.35} />
          </mesh>
        ))}

        {/* Draggable shed (body + roof + door indicator) */}
        <DraggableShed
          shedPos={shedPos}
          setShedPos={setShedPos}
          isDragging={isDragging}
          setIsDragging={setIsDragging}
          onPositionChange={onPositionChange}
          shedWidth={shedWidth}
          shedDepth={shedDepth}
          shedHeight={shedHeight}
          shedRotation={shedRotation}
          shedScale={shedScale}
          gardenWidth={gardenWidth}
          gardenDepth={gardenDepth}
        />

        <OrbitControls
          ref={controlsRef}
          enabled={!isDragging}
          minPolarAngle={Math.PI / 6}
          maxPolarAngle={Math.PI / 2.2}
          enableDamping={true}
          dampingFactor={0.08}
          minDistance={3}
          maxDistance={30}
        />
      </Canvas>

      {/* Reset camera button — outside Canvas, overlaid bottom-right */}
      <button className="scene-reset-btn" onClick={handleReset}>
        ↺ 重置视角
      </button>

      {/* Rotation and scale controls — outside Canvas */}
      <div className="scene-controls">
        <div className="scene-control-row">
          <label className="scene-control-label">旋转角度</label>
          <input
            type="range"
            min={0}
            max={360}
            step={1}
            value={shedRotation}
            onChange={(e) => {
              const deg = Number(e.target.value)
              setShedRotation(deg)
              onRotationChange?.(deg)
            }}
            className="scene-slider"
          />
          <span className="scene-control-value">{shedRotation}°</span>
        </div>
        <div className="scene-control-row">
          <label className="scene-control-label">尺寸缩放</label>
          <input
            type="range"
            min={0.5}
            max={2}
            step={0.1}
            value={shedScale}
            onChange={(e) => {
              const scale = Number(e.target.value)
              setShedScale(scale)
              onScaleChange?.(scale)
            }}
            className="scene-slider"
          />
          <span className="scene-control-value">{shedScale.toFixed(1)}×</span>
        </div>
      </div>
    </div>
  )
}
