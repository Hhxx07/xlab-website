import { useEffect, useRef, useState } from 'react'
import * as THREE from 'three'
import './GaussianViewer.css'

// ===== i18n =====
const t = (key: string) => {
  const map: Record<string, string> = {
    subtitle: '时空褶皱',
    stat_points: 'Points',
    stat_fps: 'FPS',
    ctrl_scale: '缩放',
    ctrl_opacity: '透明度',
    ctrl_exposure: '曝光',
    ctrl_speed: '速度',
    flow_amp: '强度',
    flow_freq: '频率',
    flow_speed: '流速',
    nav_move: '移动',
    nav_lift: '升降',
    nav_fast: '加速',
    nav_look: '视角',
    loading_init: '系统初始化中',
    tutorial_text: '[ WASD ] 飞行与探索',
    loading_downloading: '正在下载几何数据',
    loading_parsing: '欢迎来到梦境',
    loading_download_general: '你发现了它',
    btn_flow_tooltip: '散开 / 复原 (湍流效果)',
    btn_download_tooltip: '下载模型 (.ply)',
    return_tooltip: 'Esc Return',
  }
  return map[key] ?? key
}

// ===== Types =====
interface GSState {
  splatScale: number
  opacity: number
  brightness: number
  flySpeed: number
  turbulence: number
  flowAmp: number
  flowFreq: number
  flowSpeed: number
}

interface ThreeBridge {
  splatMesh: THREE.Mesh | null
  state: GSState
  updateUniforms: () => void
  autoFocusCamera: () => void
  geometryData: { count: number } | null
  rawPlyData: ArrayBuffer | null
  downloadModel: () => void
}

interface Props {
  plyUrl: string
  houseName: string
  onReturn: () => void
}

// ===== 常量 =====
const SH_C0 = 0.28209479177387814

// ===== 核心组件 =====
export default function GaussianViewer({ plyUrl, houseName, onReturn }: Props) {
  const containerRef = useRef<HTMLDivElement>(null)
  const loadingCanvasRef = useRef<HTMLCanvasElement>(null)

  // React HUD 状态
  const [loading, setLoading] = useState(true)
  const [progress, setProgress] = useState(0)
  const [loadingText, setLoadingText] = useState('梦境成型...')
  const [tutorialText] = useState('You are here')
  const [quote, setQuote] = useState('"梦境属于破碎与纷乱"')
  const [uiHidden, setUiHidden] = useState(false)
  const [stats, setStats] = useState({ points: '--', fps: '--' })

  // 滑块状态 (React 管理)
  const [sliders, setSliders] = useState<GSState>({
    splatScale: 2.5,
    opacity: 1.0,
    brightness: 1.0,
    flySpeed: 10.0,
    turbulence: 0.0,
    flowAmp: 8.0,
    flowFreq: 0.3,
    flowSpeed: 0.6,
  })
  const [, setFlowVisible] = useState(false)

  // Three.js 桥接 ref
  const bridgeRef = useRef<ThreeBridge>({
    splatMesh: null,
    state: { ...sliders },
    updateUniforms: () => {},
    autoFocusCamera: () => {},
    geometryData: null,
    rawPlyData: null,
    downloadModel: () => {},
  })

  // 同步 slider 到 bridge
  useEffect(() => {
    bridgeRef.current.state = { ...sliders }
    bridgeRef.current.updateUniforms()
  }, [sliders])


  // ===== 主 Three.js 生命周期 =====
  useEffect(() => {
    const container = containerRef.current
    if (!container) return

    // ---- 全局变量 (作用域内) ----
    let scene: THREE.Scene
    let camera: THREE.PerspectiveCamera
    let renderer: THREE.WebGLRenderer
    let splatMesh: THREE.Mesh | null = null
    let geometryData: { count: number; pos: Float32Array; rot: Float32Array; scale: Float32Array; col: Float32Array; center?: THREE.Vector3 } | null = null
    let rawPlyData: ArrayBuffer | null = null
    const clock = new THREE.Clock()
    let animFrameId = 0
    let quoteTimer: ReturnType<typeof setInterval>

    // 临时向量 (复用)
    const _vMoveDir = new THREE.Vector3()
    const _vForward = new THREE.Vector3()
    const _vRight = new THREE.Vector3()
    const _vUp = new THREE.Vector3(0, 1, 0)

    // 物理状态
    const physics = {
      velocity: new THREE.Vector3(),
      inputVector: new THREE.Vector3(),
      move: { f: 0, b: 0, l: 0, r: 0, u: 0, d: 0 },
      boost: false,
      mouseDown: false,
      mouseLast: { x: 0, y: 0 },
      targetRot: new THREE.Euler(0, 0, 0, 'YXZ'),
      currRot: new THREE.Euler(0, 0, 0, 'YXZ'),
    }

    let currentTurbulence = 0.0

    // ---- LoadingGameSystem ----
    class LoadingGameSystem {
      canvas: HTMLCanvasElement
      ctx: CanvasRenderingContext2D
      bar: HTMLElement | null
      isActive = true
      quoteEl: HTMLElement | null
      player: { x: number; y: number; vx: number; vy: number; size: number }
      targets: Array<{ x: number; y: number; radius: number; maxRadius: number }> = []
      particles: Array<{ x: number; y: number; vx: number; vy: number; life: number; color: string }> = []
      quotes: string[]
      animId = 0

      constructor(canvas: HTMLCanvasElement) {
        this.canvas = canvas
        this.ctx = canvas.getContext('2d')!
        this.bar = document.getElementById('gs-loading-bar')
        this.quoteEl = document.getElementById('gs-loading-quote')
        this.player = { x: window.innerWidth / 2, y: window.innerHeight / 2, vx: 0, vy: 0, size: 8 }
        this.quotes = [
          '光是绘画的第一要素。 —— 爱默生',
          '正在模拟光子...',
          '艺术不是你所见的，而是你让他人所见的。 —— 德加',
          '正在构建高斯散点...',
          '为了看见，我们必须忘记所视之物的名字。 —— 莫奈',
        ]
        this.resize()
        window.addEventListener('resize', this.resizeBound)
        for (let i = 0; i < 5; i++) this.spawnTarget()
        this.animate()
      }

      resizeBound = () => this.resize()
      resize() {
        this.canvas.width = window.innerWidth
        this.canvas.height = window.innerHeight
      }

      spawnTarget() {
        const pad = 50
        this.targets.push({
          x: pad + Math.random() * (this.canvas.width - pad * 2),
          y: pad + Math.random() * (this.canvas.height - pad * 2),
          radius: 0,
          maxRadius: 6 + Math.random() * 4,
        })
      }

      spawnParticle(x: number, y: number, color: string) {
        for (let i = 0; i < 5; i++) {
          this.particles.push({
            x, y,
            vx: (Math.random() - 0.5) * 4,
            vy: (Math.random() - 0.5) * 4,
            life: 1.0,
            color: color || '#d4af37',
          })
        }
      }

      updatePlayer() {
        const ax = (physics.move.r - physics.move.l) * 0.8
        const ay = (physics.move.b - physics.move.f) * 0.8
        this.player.vx += ax
        this.player.vy += ay
        this.player.vx *= 0.92
        this.player.vy *= 0.92
        this.player.x += this.player.vx
        this.player.y += this.player.vy
        if (this.player.x < 0) { this.player.x = 0; this.player.vx *= -0.5 }
        if (this.player.x > this.canvas.width) { this.player.x = this.canvas.width; this.player.vx *= -0.5 }
        if (this.player.y < 0) { this.player.y = 0; this.player.vy *= -0.5 }
        if (this.player.y > this.canvas.height) { this.player.y = this.canvas.height; this.player.vy *= -0.5 }
      }

      animate() {
        if (!this.isActive) return
        this.animId = requestAnimationFrame(() => this.animate())
        const ctx = this.ctx
        ctx.clearRect(0, 0, this.canvas.width, this.canvas.height)

        this.updatePlayer()

        // 绘制玩家三角
        ctx.save()
        ctx.translate(this.player.x, this.player.y)
        const angle = Math.atan2(this.player.vy, this.player.vx)
        ctx.rotate(angle + Math.PI / 2)
        ctx.beginPath()
        ctx.moveTo(0, -this.player.size * 1.5)
        ctx.lineTo(-this.player.size, this.player.size)
        ctx.lineTo(this.player.size, this.player.size)
        ctx.closePath()
        ctx.fillStyle = '#d4af37'
        ctx.fill()
        if (Math.random() > 0.5 && (Math.abs(this.player.vx) > 0.1 || Math.abs(this.player.vy) > 0.1)) {
          this.particles.push({
            x: this.player.x, y: this.player.y,
            vx: (Math.random() - 0.5), vy: (Math.random() - 0.5),
            life: 0.5, color: 'rgba(255,255,255,0.5)',
          })
        }
        ctx.restore()

        // 绘制目标
        for (let i = this.targets.length - 1; i >= 0; i--) {
          const t = this.targets[i]
          if (t.radius < t.maxRadius) t.radius += 0.2
          const grad = ctx.createRadialGradient(t.x, t.y, 0, t.x, t.y, t.radius * 2)
          grad.addColorStop(0, 'rgba(212, 175, 55, 0.8)')
          grad.addColorStop(1, 'rgba(212, 175, 55, 0)')
          ctx.fillStyle = grad
          ctx.beginPath()
          ctx.arc(t.x, t.y, t.radius * 2, 0, Math.PI * 2)
          ctx.fill()
          ctx.fillStyle = '#fff'
          ctx.beginPath()
          ctx.arc(t.x, t.y, 2, 0, Math.PI * 2)
          ctx.fill()

          const dx = this.player.x - t.x
          const dy = this.player.y - t.y
          const dist = Math.sqrt(dx * dx + dy * dy)
          if (dist < t.radius + 10) {
            this.spawnParticle(t.x, t.y, '#d4af37')
            this.targets.splice(i, 1)
            this.spawnTarget()
          }
        }

        // 粒子
        for (let i = this.particles.length - 1; i >= 0; i--) {
          const p = this.particles[i]
          p.x += p.vx; p.y += p.vy; p.life -= 0.02
          if (p.life <= 0) { this.particles.splice(i, 1); continue }
          ctx.fillStyle = p.color
          ctx.globalAlpha = p.life
          ctx.beginPath()
          ctx.arc(p.x, p.y, 2, 0, Math.PI * 2)
          ctx.fill()
          ctx.globalAlpha = 1.0
        }
      }

      setProgress(percent: number) {
        if (this.bar) this.bar.style.width = (percent * 100) + '%'
        setProgress(percent)
      }

      stop() {
        this.isActive = false
        cancelAnimationFrame(this.animId)
        this.setProgress(1.0)
        setTimeout(() => setLoading(false), 500)
        window.removeEventListener('resize', this.resizeBound)
      }

      start() {
        // handled externally via setLoading(true)
      }
    }

    let loadingSys: LoadingGameSystem | null = null

    // ---- PLY 解析 ----
    function parsePLY(buffer: ArrayBuffer) {
      setLoadingText(t('loading_parsing'))
      const dec = new TextDecoder()
      const headBytes = new Uint8Array(buffer, 0, 4000)
      const headStr = dec.decode(headBytes)
      const endIdx = headStr.indexOf('end_header')
      if (endIdx < 0) throw new Error('Header not found')

      let bodyStart = endIdx + 10
      if (headBytes[bodyStart] === 13) bodyStart++
      if (headBytes[bodyStart] === 10) bodyStart++

      const headerLines = headStr.substring(0, endIdx).split('\n')
      let vertexCount = 0
      const propMap: Record<string, { offset: number }> = {}
      let currentElement = ''
      let currentOffset = 0
      let vertexStride = 0

      headerLines.forEach((line) => {
        const parts = line.trim().split(/\s+/)
        if (parts[0] === 'element') {
          if (currentElement === 'vertex') vertexStride = currentOffset
          currentElement = parts[1]
          currentOffset = 0
          if (parts[1] === 'vertex') vertexCount = parseInt(parts[2])
        } else if (parts[0] === 'property') {
          const type = parts[1]
          const size = type === 'double' ? 8 : type === 'uchar' || type === 'char' ? 1 : 4
          if (currentElement === 'vertex') propMap[parts[parts.length - 1]] = { offset: currentOffset }
          currentOffset += size
        }
      })
      if (currentElement === 'vertex') vertexStride = currentOffset

      const view = new DataView(buffer)
      const posBuffer = new Float32Array(vertexCount * 3)
      const rotBuffer = new Float32Array(vertexCount * 4)
      const scaleBuffer = new Float32Array(vertexCount * 3)
      const colBuffer = new Float32Array(vertexCount * 4)

      let validCount = 0
      let fileOffset = bodyStart

      const off = {
        x: propMap['x']?.offset ?? -1,
        y: propMap['y']?.offset ?? -1,
        z: propMap['z']?.offset ?? -1,
        op: propMap['opacity']?.offset ?? -1,
        dc0: propMap['f_dc_0']?.offset ?? -1,
        rot0: propMap['rot_0']?.offset ?? -1,
        s0: propMap['scale_0']?.offset ?? -1,
      }
      const hasRot = off.rot0 !== -1
      const hasScale = off.s0 !== -1
      const hasColor = off.dc0 !== -1
      const minOpacity = 0.05

      for (let i = 0; i < vertexCount; i++) {
        if (fileOffset + vertexStride > buffer.byteLength) break

        const x = view.getFloat32(fileOffset + off.x, true)
        if (isNaN(x)) { fileOffset += vertexStride; continue }

        let opacity = 1.0
        if (off.op !== -1) {
          opacity = 1.0 / (1.0 + Math.exp(-view.getFloat32(fileOffset + off.op, true)))
        }
        if (opacity < minOpacity) { fileOffset += vertexStride; continue }

        posBuffer[validCount * 3] = x
        posBuffer[validCount * 3 + 1] = view.getFloat32(fileOffset + off.y, true)
        posBuffer[validCount * 3 + 2] = view.getFloat32(fileOffset + off.z, true)

        if (hasRot) {
          rotBuffer[validCount * 4] = view.getFloat32(fileOffset + off.rot0 + 4, true)
          rotBuffer[validCount * 4 + 1] = view.getFloat32(fileOffset + off.rot0 + 8, true)
          rotBuffer[validCount * 4 + 2] = view.getFloat32(fileOffset + off.rot0 + 12, true)
          rotBuffer[validCount * 4 + 3] = view.getFloat32(fileOffset + off.rot0, true)
        } else {
          rotBuffer[validCount * 4 + 3] = 1
        }

        if (hasScale) {
          scaleBuffer[validCount * 3] = Math.exp(view.getFloat32(fileOffset + off.s0, true))
          scaleBuffer[validCount * 3 + 1] = Math.exp(view.getFloat32(fileOffset + off.s0 + 4, true))
          scaleBuffer[validCount * 3 + 2] = Math.exp(view.getFloat32(fileOffset + off.s0 + 8, true))
        } else {
          scaleBuffer.fill(0.1, validCount * 3, validCount * 3 + 3)
        }

        if (hasColor) {
          colBuffer[validCount * 4] = 0.5 + SH_C0 * view.getFloat32(fileOffset + off.dc0, true)
          colBuffer[validCount * 4 + 1] = 0.5 + SH_C0 * view.getFloat32(fileOffset + off.dc0 + 4, true)
          colBuffer[validCount * 4 + 2] = 0.5 + SH_C0 * view.getFloat32(fileOffset + off.dc0 + 8, true)
        } else {
          colBuffer.fill(0.5, validCount * 4, validCount * 4 + 3)
        }
        colBuffer[validCount * 4 + 3] = opacity

        validCount++
        fileOffset += vertexStride
      }

      geometryData = {
        count: validCount,
        pos: posBuffer.slice(0, validCount * 3),
        rot: rotBuffer.slice(0, validCount * 4),
        scale: scaleBuffer.slice(0, validCount * 3),
        col: colBuffer.slice(0, validCount * 4),
      }

      const pointsStr = validCount >= 1e6
        ? (validCount / 1e6).toFixed(2) + 'M'
        : (validCount / 1000).toFixed(1) + 'k'
      setStats((s) => ({ ...s, points: pointsStr }))

      bridgeRef.current.geometryData = geometryData
    }

    // ---- 创建 Splat Mesh ----
    function createSplatMesh(data: NonNullable<typeof geometryData>) {
      if (splatMesh) { scene.remove(splatMesh); splatMesh.geometry.dispose() }

      const baseGeo = new THREE.PlaneGeometry(1, 1)
      const geo = new THREE.InstancedBufferGeometry()
      geo.boundingSphere = new THREE.Sphere(new THREE.Vector3(0, 0, 0), 50)
      geo.index = baseGeo.index
      geo.attributes.position = baseGeo.attributes.position
      geo.attributes.uv = baseGeo.attributes.uv

      geo.setAttribute('instPosition', new THREE.InstancedBufferAttribute(data.pos, 3))
      geo.setAttribute('instRotation', new THREE.InstancedBufferAttribute(data.rot, 4))
      geo.setAttribute('instScale', new THREE.InstancedBufferAttribute(data.scale, 3))
      geo.setAttribute('instColor', new THREE.InstancedBufferAttribute(data.col, 4))

      const st = bridgeRef.current.state

      const mat = new THREE.ShaderMaterial({
        uniforms: {
          uSplatScale: { value: st.splatScale },
          uOpacityMod: { value: st.opacity },
          uBrightness: { value: st.brightness },
          uTime: { value: 0 },
          uTurbulence: { value: 0 },
          uFlowAmp: { value: st.flowAmp },
          uFlowFreq: { value: st.flowFreq },
          uFlowSpeed: { value: st.flowSpeed },
          uModelCenter: { value: data.center ?? new THREE.Vector3() },
        },
        vertexShader: /* glsl */ `
          uniform float uSplatScale;
          uniform float uTime;
          uniform float uTurbulence;
          uniform float uFlowAmp;
          uniform float uFlowFreq;
          uniform float uFlowSpeed;
          uniform vec3 uModelCenter;

          attribute vec3 instPosition;
          attribute vec4 instRotation;
          attribute vec3 instScale;
          attribute vec4 instColor;

          varying vec4 vColor;
          varying vec2 vUv;

          mat3 getRotationMatrix(vec4 q) {
            float x = q.x, y = q.y, z = q.z, w = q.w;
            float x2 = x + x, y2 = y + y, z2 = z + z;
            float xx = x * x2, xy = x * y2, xz = x * z2;
            float yy = y * y2, yz = y * z2, zz = z * z2;
            float wx = w * x2, wy = w * y2, wz = w * z2;
            return mat3(
              1.0 - (yy + zz), xy - wz, xz + wy,
              xy + wz, 1.0 - (xx + zz), yz - wx,
              xz - wy, yz + wx, 1.0 - (xx + yy)
            );
          }

          vec3 curl(vec3 p, float t, float freq) {
            vec3 p_move = p * freq + vec3(t * 0.5, t * 0.3, t * 0.2);
            float x = sin(p_move.y) + cos(p_move.z);
            float y = sin(p_move.z) + cos(p_move.x);
            float z = sin(p_move.x) + cos(p_move.y);
            vec3 p_move2 = p * freq * 2.0 - vec3(t, t, t);
            x += (sin(p_move2.y) + cos(p_move2.z)) * 0.5;
            y += (sin(p_move2.z) + cos(p_move2.x)) * 0.5;
            z += (sin(p_move2.x) + cos(p_move2.y)) * 0.5;
            return vec3(x, y, z);
          }

          void main() {
            vUv = uv;
            vColor = instColor;
            vec3 pos = position * instScale * uSplatScale;
            pos = getRotationMatrix(instRotation) * pos;
            vec3 centerPos = instPosition;
            if (uTurbulence > 0.001) {
              vec3 swimDir = curl(centerPos, uTime * uFlowSpeed, uFlowFreq);
              centerPos += swimDir * uTurbulence * uFlowAmp;
            }
            gl_Position = projectionMatrix * modelViewMatrix * vec4(pos + centerPos, 1.0);
          }
        `,
        fragmentShader: /* glsl */ `
          uniform float uOpacityMod;
          uniform float uBrightness;
          varying vec4 vColor;
          varying vec2 vUv;
          void main() {
            vec2 c = vUv * 2.0 - 1.0;
            if (dot(c, c) > 1.0) discard;
            float a = exp(-dot(c, c) * 2.0) * vColor.a * uOpacityMod;
            if (a < 0.05) discard;
            gl_FragColor = vec4(vColor.rgb * uBrightness, a);
          }
        `,
        side: THREE.DoubleSide,
        depthWrite: true,
        depthTest: true,
      })

      splatMesh = new THREE.Mesh(geo, mat)
      splatMesh.rotation.x = Math.PI
      scene.add(splatMesh)
      bridgeRef.current.splatMesh = splatMesh
    }

    // ---- 自动对焦 ----
    function autoFocusCamera() {
      if (!geometryData || !splatMesh) return
      let d = 0
      const p = geometryData.pos
      const n = Math.min(300, geometryData.count * 3)
      for (let i = 0; i < n; i += 3) {
        d += Math.sqrt(p[i] * p[i] + p[i + 1] * p[i + 1] + p[i + 2] * p[i + 2])
      }
      const radius = (d / 100) || 10
      camera.position.set(0, 0, radius * 3)
      camera.lookAt(0, 0, 0)
      physics.targetRot.setFromQuaternion(camera.quaternion, 'YXZ')
      physics.currRot.copy(physics.targetRot)
      physics.velocity.set(0, 0, 0)
    }

    // ---- 更新 Uniforms ----
    function updateUniforms() {
      if (!splatMesh) return
      const u = (splatMesh.material as THREE.ShaderMaterial).uniforms
      const st = bridgeRef.current.state
      u.uSplatScale.value = st.splatScale
      u.uOpacityMod.value = st.opacity
      u.uBrightness.value = st.brightness
      u.uFlowAmp.value = st.flowAmp
      u.uFlowFreq.value = st.flowFreq
      u.uFlowSpeed.value = st.flowSpeed
    }

    // ---- 下载模型 ----
    function downloadModel() {
      if (rawPlyData) {
        const blob = new Blob([rawPlyData], { type: 'application/octet-stream' })
        const url = URL.createObjectURL(blob)
        const a = document.createElement('a')
        a.href = url
        a.download = 'model.ply'
        a.click()
        URL.revokeObjectURL(url)
      }
    }

    // ---- 更新物理 ----
    function updatePhysics(dt: number) {
      const rotLerp = 10.0 * dt
      physics.currRot.x += (physics.targetRot.x - physics.currRot.x) * Math.min(1, rotLerp)
      physics.currRot.y += (physics.targetRot.y - physics.currRot.y) * Math.min(1, rotLerp)
      camera.quaternion.setFromEuler(physics.currRot)

      const input = physics.inputVector
      input.set(0, 0, 0)
      input.z = physics.move.b - physics.move.f
      input.x = physics.move.r - physics.move.l
      input.y = physics.move.u - physics.move.d
      if (input.lengthSq() > 0) input.normalize()

      _vMoveDir.set(0, 0, 0)
      _vForward.set(0, 0, -1).applyQuaternion(camera.quaternion)
      _vRight.set(1, 0, 0).applyQuaternion(camera.quaternion)

      if (input.z !== 0) _vMoveDir.addScaledVector(_vForward, -input.z)
      if (input.x !== 0) _vMoveDir.addScaledVector(_vRight, input.x)
      if (input.y !== 0) _vMoveDir.addScaledVector(_vUp, input.y)
      if (_vMoveDir.lengthSq() > 0) _vMoveDir.normalize()

      const st = bridgeRef.current.state
      const maxSpeed = st.flySpeed * (physics.boost ? 4.0 : 1.0)
      const acceleration = 100.0
      const friction = 10.0

      if (_vMoveDir.lengthSq() > 0) {
        physics.velocity.addScaledVector(_vMoveDir, acceleration * dt)
      }
      const damping = Math.exp(-friction * dt)
      physics.velocity.multiplyScalar(damping)
      if (physics.velocity.length() > maxSpeed) physics.velocity.setLength(maxSpeed)
      camera.position.addScaledVector(physics.velocity, dt)
    }

    // ---- 键盘事件 ----
    function onKeyDown(e: KeyboardEvent) {
      // 忽略在 input 元素中的输入
      if (e.target instanceof HTMLInputElement) return

      const k = physics.move
      switch (e.code) {
        case 'KeyW': k.f = 1; break
        case 'KeyS': k.b = 1; break
        case 'KeyA': k.l = 1; break
        case 'KeyD': k.r = 1; break
        case 'ShiftLeft': k.d = 1; break
        case 'Space': k.u = 1; break
        case 'KeyQ': physics.boost = true; break
        case 'KeyH': setUiHidden((h) => !h); break
        case 'Escape': onReturn(); break
      }
    }

    function onKeyUp(e: KeyboardEvent) {
      const k = physics.move
      switch (e.code) {
        case 'KeyW': k.f = 0; break
        case 'KeyS': k.b = 0; break
        case 'KeyA': k.l = 0; break
        case 'KeyD': k.r = 0; break
        case 'ShiftLeft': k.d = 0; break
        case 'Space': k.u = 0; break
        case 'KeyQ': physics.boost = false; break
      }
    }

    // ---- 鼠标事件 ----
    function onMouseDown(e: MouseEvent) {
      if (e.button === 0) {
        physics.mouseDown = true
        physics.mouseLast.x = e.clientX
        physics.mouseLast.y = e.clientY
      }
    }

    function onMouseUp() { physics.mouseDown = false }

    function onMouseMove(e: MouseEvent) {
      if (physics.mouseDown) {
        const dx = e.clientX - physics.mouseLast.x
        const dy = e.clientY - physics.mouseLast.y
        physics.mouseLast.x = e.clientX
        physics.mouseLast.y = e.clientY
        const sensitivity = 0.002
        physics.targetRot.y -= dx * sensitivity
        physics.targetRot.x -= dy * sensitivity
        physics.targetRot.x = Math.max(-1.5, Math.min(1.5, physics.targetRot.x))
      }
    }

    function onResize() {
      camera.aspect = window.innerWidth / window.innerHeight
      camera.updateProjectionMatrix()
      renderer.setSize(window.innerWidth, window.innerHeight)
    }

    // ---- 渲染循环 ----
    function animate() {
      animFrameId = requestAnimationFrame(animate)
      const dt = Math.min(clock.getDelta(), 0.1)

      updatePhysics(dt)

      if (splatMesh) {
        const lerpSpeed = 0.5 * dt
        currentTurbulence += (bridgeRef.current.state.turbulence - currentTurbulence) * lerpSpeed
        const u = (splatMesh.material as THREE.ShaderMaterial).uniforms
        u.uTurbulence.value = currentTurbulence
        u.uTime.value = clock.elapsedTime
      }

      // 每 500ms 更新 FPS
      if (Math.floor(clock.elapsedTime * 2) !== Math.floor((clock.elapsedTime - dt) * 2)) {
        setStats((s) => ({ ...s, fps: Math.round(1 / dt).toString() }))
      }

      renderer.render(scene, camera)
    }

    // ---- 加载 PLY ----
    async function loadPly(url: string) {
      setLoading(true)
      setProgress(0)
      setLoadingText(t('loading_download_general'))

      const xhr = new XMLHttpRequest()
      xhr.open('GET', url, true)
      xhr.responseType = 'arraybuffer'

      await new Promise<void>((resolve, reject) => {
        xhr.onprogress = (event) => {
          if (event.lengthComputable) {
            setProgress(event.loaded / event.total)
            if (loadingSys) loadingSys.setProgress(event.loaded / event.total)
          } else {
            const cur = progress
            if (cur < 0.9) {
              setProgress(cur + 0.01)
              if (loadingSys) loadingSys.setProgress(cur + 0.01)
            }
          }
        }

        xhr.onload = () => {
          if (xhr.status === 200) {
            rawPlyData = xhr.response
            bridgeRef.current.rawPlyData = xhr.response
            resolve()
          } else {
            reject(new Error('HTTP ' + xhr.status))
          }
        }

        xhr.onerror = () => reject(new Error('Network Error'))
        xhr.send()
      })

      setLoadingText(t('loading_parsing'))
      // 给 UI 一帧更新时间
      await new Promise((r) => setTimeout(r, 100))

      parsePLY(rawPlyData!)
      if (!geometryData) throw new Error('Parse failed')

      createSplatMesh(geometryData)
      autoFocusCamera()

      if (loadingSys) loadingSys.stop()
    }

    // ---- 初始化 Three.js ----
    function initThree() {
      scene = new THREE.Scene()
      scene.background = new THREE.Color(0x121212)
      scene.fog = new THREE.FogExp2(0x121212, 0.02)

      const grid = new THREE.GridHelper(100, 100, 0x333333, 0x1a1a1a)
      grid.position.y = -5
      grid.material.opacity = 0.3
      grid.material.transparent = true
      scene.add(grid)

      camera = new THREE.PerspectiveCamera(60, window.innerWidth / window.innerHeight, 0.1, 5000)
      camera.position.set(0, 5, 10)
      physics.targetRot.setFromQuaternion(camera.quaternion, 'YXZ')
      physics.currRot.copy(physics.targetRot)

      renderer = new THREE.WebGLRenderer({
        antialias: false,
        powerPreference: 'high-performance',
        stencil: false,
        depth: true,
      })
      renderer.setSize(window.innerWidth, window.innerHeight)
      renderer.setPixelRatio(Math.min(window.devicePixelRatio, 1.0))
      renderer.toneMapping = THREE.ACESFilmicToneMapping
      renderer.toneMappingExposure = 1.0
      containerRef.current?.appendChild(renderer.domElement)

      // 事件绑定
      window.addEventListener('resize', onResize)
      window.addEventListener('contextmenu', (e) => e.preventDefault())
      window.addEventListener('keydown', onKeyDown)
      window.addEventListener('keyup', onKeyUp)
      renderer.domElement.addEventListener('mousedown', onMouseDown)
      window.addEventListener('mouseup', onMouseUp)
      window.addEventListener('mousemove', onMouseMove)

      // 启动 LoadingGameSystem
      if (loadingCanvasRef.current) {
        loadingSys = new LoadingGameSystem(loadingCanvasRef.current)
      }

      // Quote 轮播
      const quotes = [
        'Light is the first of painters. - Emerson',
        'Simulating photons...',
        'Art is not what you see, but what you make others see. - Degas',
        'Constructing Gaussian Splats...',
        'In order to see, we must forget the name of the thing we are looking at. - Monet',
      ]
      let qi = 0
      setQuote(quotes[qi])
      quoteTimer = setInterval(() => {
        qi = (qi + 1) % quotes.length
        setQuote(quotes[qi])
      }, 3000)
    }

    // ---- 更新 bridge 方法 ----
    bridgeRef.current.updateUniforms = updateUniforms
    bridgeRef.current.autoFocusCamera = autoFocusCamera
    bridgeRef.current.downloadModel = downloadModel

    // ---- 启动 ----
    initThree()
    loadPly(plyUrl).catch((err) => {
      console.error('[GaussianViewer] Load failed:', err)
      if (loadingSys) loadingSys.stop()
      setLoading(false)
    })
    animate()

    // ---- 清理 ----
    return () => {
      cancelAnimationFrame(animFrameId)
      clearInterval(quoteTimer)

      if (loadingSys) {
        loadingSys.isActive = false
        cancelAnimationFrame(loadingSys.animId)
        window.removeEventListener('resize', loadingSys.resizeBound)
      }

      window.removeEventListener('resize', onResize)
      window.removeEventListener('keydown', onKeyDown)
      window.removeEventListener('keyup', onKeyUp)
      window.removeEventListener('mouseup', onMouseUp)
      window.removeEventListener('mousemove', onMouseMove)

      if (renderer) {
        renderer.domElement.removeEventListener('mousedown', onMouseDown)
        renderer.dispose()
        if (container.contains(renderer.domElement)) {
          container.removeChild(renderer.domElement)
        }
      }

      if (splatMesh) {
        splatMesh.geometry.dispose()
        ;(splatMesh.material as THREE.Material).dispose()
      }

      if (scene) scene.clear()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [plyUrl])

  // ===== HUD 事件处理 =====
  // const handleSlider = (key: keyof GSState, value: number) => {
  //   setSliders((s) => ({ ...s, [key]: value }))
  // }

  const toggleTurbulence = () => {
    setSliders((s) => ({ ...s, turbulence: s.turbulence > 0.5 ? 0.0 : 1.0 }))
    setFlowVisible((v) => !v)
  }

  const handleAutoFocus = () => bridgeRef.current.autoFocusCamera()
  // const handleDownload = () => bridgeRef.current.downloadModel()

  // ===== JSX =====
  return (
    <div className={`gs-viewer-container${uiHidden ? ' gs-ui-hidden' : ''}`}>
      {/* Three.js 挂载点 */}
      <div ref={containerRef} style={{ width: '100%', height: '100%' }} />

      {/* 返回按钮 */}
      <button className="gs-return-btn" onClick={onReturn} title={t('return_tooltip')}>
        ← esc
      </button>

      {/* 顶部标题 */}
      <div className="gs-hud-panel gs-top-header gs-top-panel">
        <h1>{houseName}</h1>
        <div className="gs-header-row">
          <span className="gs-subtitle">{t('subtitle')}</span>
        </div>
      </div>

      {/* 右上状态 */}
      <div className="gs-hud-panel gs-top-stats gs-top-panel">
        <div className="gs-stat-item">
          <span className="gs-stat-value">{stats.points}</span>
          <span className="gs-stat-label">{t('stat_points')}</span>
        </div>
        <div className="gs-stat-item">
          <span className="gs-stat-value">{stats.fps}</span>
          <span className="gs-stat-label">{t('stat_fps')}</span>
        </div>
      </div>

      {/* 流体面板
      <div className={`gs-hud-panel gs-flow-panel${flowVisible ? ' visible' : ''}`}>
        <div className="gs-slider-group">
          <label>{t('flow_amp')}</label>
          <input
            type="range" min="1.0" max="20.0" step="0.5"
            value={sliders.flowAmp}
            onChange={(e) => handleSlider('flowAmp', parseFloat(e.target.value))}
          />
        </div>
        <div className="gs-deck-divider" />
        <div className="gs-slider-group">
          <label>{t('flow_freq')}</label>
          <input
            type="range" min="0.1" max="1.0" step="0.1"
            value={sliders.flowFreq}
            onChange={(e) => handleSlider('flowFreq', parseFloat(e.target.value))}
          />
        </div>
        <div className="gs-deck-divider" />
        <div className="gs-slider-group">
          <label>{t('flow_speed')}</label>
          <input
            type="range" min="0.1" max="2.0" step="0.1"
            value={sliders.flowSpeed}
            onChange={(e) => handleSlider('flowSpeed', parseFloat(e.target.value))}
          />
        </div>
      </div> */}

      {/* 底部控制台 */}
      <div className="gs-hud-panel gs-control-deck gs-bottom-panel">
        {/* <div className="gs-slider-group">
          <label>{t('ctrl_scale')}</label>
          <input
            type="range" min="0.1" max="3.0" step="0.1"
            value={sliders.splatScale}
            onChange={(e) => handleSlider('splatScale', parseFloat(e.target.value))}
          />
        </div>
        <div className="gs-deck-divider" />
        <div className="gs-slider-group">
          <label>{t('ctrl_opacity')}</label>
          <input
            type="range" min="0.1" max="2.0" step="0.1"
            value={sliders.opacity}
            onChange={(e) => handleSlider('opacity', parseFloat(e.target.value))}
          />
        </div>
        <div className="gs-deck-divider" />
        <div className="gs-slider-group">
          <label>{t('ctrl_exposure')}</label>
          <input
            type="range" min="0.5" max="3.0" step="0.1"
            value={sliders.brightness}
            onChange={(e) => handleSlider('brightness', parseFloat(e.target.value))}
          />
        </div>
        <div className="gs-deck-divider" />
        <div className="gs-slider-group">
          <label>{t('ctrl_speed')}</label>
          <input
            type="range" min="1" max="100" step="1"
            value={sliders.flySpeed}
            onChange={(e) => handleSlider('flySpeed', parseFloat(e.target.value))}
          />
        </div>
        <div className="gs-deck-divider" /> */}
        <button
          className={`gs-icon-btn${sliders.turbulence > 0.5 ? ' active' : ''}`}
          onClick={toggleTurbulence}
          title={t('btn_flow_tooltip')}
        >
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M2 12c.6 0 1.2.4 1.6.9.6.7 1.4 1.1 2.4 1.1 1.9 0 2.4-1.9 4.4-1.9 1 0 1.8.4 2.4 1.1.4.5 1 .9 1.6.9" />
            <path d="M2 8c.6 0 1.2.4 1.6.9.6.7 1.4 1.1 2.4 1.1 1.9 0 2.4-1.9 4.4-1.9 1 0 1.8.4 2.4 1.1.4.5 1 .9 1.6.9" />
            <path d="M2 16c.6 0 1.2.4 1.6.9.6.7 1.4 1.1 2.4 1.1 1.9 0 2.4-1.9 4.4-1.9 1 0 1.8.4 2.4 1.1.4.5 1 .9 1.6.9" />
            <path d="M16 12c.5-.5 1.1-.9 1.6-.9.6 0 1.2.4 1.6.9.6.7 1.4 1.1 2.4 1.1.2 0 .4 0 .6-.1" />
          </svg>
        </button>
        {/* <div className="gs-deck-divider" />
        <button className="gs-icon-btn" onClick={handleDownload} title={t('btn_download_tooltip')}>
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" /><polyline points="7 10 12 15 17 10" /><line x1="12" y1="15" x2="12" y2="3" />
          </svg>
        </button> */}
        <div className="gs-deck-divider" />
        <button className="gs-icon-btn" onClick={handleAutoFocus} title="Reset View">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8" /><path d="M3 3v5h5" />
          </svg>
        </button>
      </div>

      {/* 导航提示 */}
      <div className="gs-hud-panel gs-nav-hint gs-bottom-panel">
        <div className="gs-key-row"><span className="gs-kbd">FPSD</span> {t('nav_move')}</div>
        {/* <div className="gs-key-row"><span className="gs-kbd">Q / E</span> {t('nav_lift')}</div>
        <div className="gs-key-row"><span className="gs-kbd">Shift</span> {t('nav_fast')}</div> */}
        <div className="gs-key-row"><span className="gs-kbd">Mouse</span> {t('nav_look')}</div>
      </div>

      {/* 水印 */}
      <div className="gs-watermark">梦境</div>

      {/* 加载覆盖层 */}
      <div className={`gs-loading-overlay${loading ? ' active' : ''}`}>
        <canvas ref={loadingCanvasRef} className="gs-loading-canvas" />
        <div className="gs-loading-content">
          <div className="gs-loader-spinner" />
          <div className="gs-loading-text">{loadingText}</div>
          <div className="gs-tutorial-text">{tutorialText}</div>
          <div className="gs-progress-container">
            <div id="gs-loading-bar" className="gs-progress-bar" style={{ width: `${progress * 100}%` }} />
          </div>
          <div id="gs-loading-quote" className="gs-loading-quote">{quote}</div>
        </div>
      </div>
    </div>
  )
}
