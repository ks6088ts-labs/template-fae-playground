import { Canvas, useFrame } from '@react-three/fiber'
import { OrbitControls } from '@react-three/drei'
import { useEffect, useMemo, useRef, useState } from 'react'
import { Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts'
import { QRCodeSVG } from 'qrcode.react'
import Peer, { type DataConnection } from 'peerjs'
import { Euler, MathUtils, type Mesh } from 'three'
import heroImg from './assets/hero.png'
import reactLogo from './assets/react.svg'
import viteLogo from './assets/vite.svg'
import { useTrackEvent } from './telemetry/react/hooks'
import './App.css'

type Role = 'host' | 'sensor'

type Vector3 = {
  x: number
  y: number
  z: number
}

type Orientation = {
  alpha: number
  beta: number
  gamma: number
}

type SensorSample = {
  timestamp: number
  accel: Vector3
  gyro: Vector3
  orientation: Orientation
}

const SEND_INTERVAL_MS = 33
const BUFFER_WINDOW_MS = 10_000

const zeroVector: Vector3 = {
  x: 0,
  y: 0,
  z: 0,
}

const zeroOrientation: Orientation = {
  alpha: 0,
  beta: 0,
  gamma: 0,
}

function getRole(): Role {
  const role = new URLSearchParams(window.location.search).get('role')
  return role === 'sensor' ? 'sensor' : 'host'
}

function getSensorUrl(peerId: string): string {
  const baseUrl = new URL(import.meta.env.BASE_URL, window.location.origin)
  baseUrl.searchParams.set('role', 'sensor')
  baseUrl.searchParams.set('peer', peerId)
  return baseUrl.toString()
}

function toFiniteNumber(value: unknown): number {
  const numberValue = typeof value === 'number' ? value : Number(value)
  return Number.isFinite(numberValue) ? numberValue : 0
}

function toSample(payload: unknown): SensorSample | null {
  if (!payload || typeof payload !== 'object') {
    return null
  }

  const source = payload as Partial<SensorSample>
  const timestamp = toFiniteNumber(source.timestamp ?? Date.now())
  return {
    timestamp,
    accel: {
      x: toFiniteNumber(source.accel?.x),
      y: toFiniteNumber(source.accel?.y),
      z: toFiniteNumber(source.accel?.z),
    },
    gyro: {
      x: toFiniteNumber(source.gyro?.x),
      y: toFiniteNumber(source.gyro?.y),
      z: toFiniteNumber(source.gyro?.z),
    },
    orientation: {
      alpha: toFiniteNumber(source.orientation?.alpha),
      beta: toFiniteNumber(source.orientation?.beta),
      gamma: toFiniteNumber(source.orientation?.gamma),
    },
  }
}

function toDeltaDegrees(value: number, origin: number): number {
  let delta = value - origin
  while (delta > 180) {
    delta -= 360
  }
  while (delta < -180) {
    delta += 360
  }
  return delta
}

function DeviceModel({
  orientation,
  calibration,
}: {
  orientation: Orientation
  calibration: Orientation | null
}) {
  const meshRef = useRef<Mesh>(null)

  useFrame(() => {
    if (!meshRef.current) {
      return
    }

    const calibrated = calibration ?? zeroOrientation
    const alpha = toDeltaDegrees(orientation.alpha, calibrated.alpha)
    const beta = toDeltaDegrees(orientation.beta, calibrated.beta)
    const gamma = toDeltaDegrees(orientation.gamma, calibrated.gamma)

    const euler = new Euler(
      MathUtils.degToRad(beta),
      MathUtils.degToRad(alpha),
      MathUtils.degToRad(-gamma),
      'YXZ',
    )
    meshRef.current.quaternion.setFromEuler(euler)
  })

  return (
    <mesh ref={meshRef}>
      <boxGeometry args={[1, 1.8, 0.08]} />
      <meshStandardMaterial color="#5a67d8" metalness={0.15} roughness={0.35} />
    </mesh>
  )
}

function HostView() {
  const [peerId, setPeerId] = useState<string | null>(null)
  const [status, setStatus] = useState('初期化中…')
  const [latestSample, setLatestSample] = useState<SensorSample | null>(null)
  const [samples, setSamples] = useState<SensorSample[]>([])
  const [calibration, setCalibration] = useState<Orientation | null>(null)
  const trackEvent = useTrackEvent()

  useEffect(() => {
    const peer = new Peer()
    let activeConnection: DataConnection | null = null

    peer.on('open', (id) => {
      setPeerId(id)
      setStatus('接続待機中')
      trackEvent('sensor_host_opened', { component: 'HostView', peerId: id })
    })

    peer.on('connection', (connection) => {
      activeConnection?.close()
      activeConnection = connection
      setStatus('接続中')
      trackEvent('sensor_connected', { component: 'HostView' })

      connection.on('data', (payload) => {
        const nextSample = toSample(payload)
        if (!nextSample) {
          return
        }

        setLatestSample(nextSample)
        setSamples((previous) => {
          const next = [...previous, nextSample]
          const threshold = nextSample.timestamp - BUFFER_WINDOW_MS
          return next.filter((item) => item.timestamp >= threshold)
        })
      })

      const onDisconnected = () => {
        setStatus('切断されました')
        trackEvent('sensor_disconnected', { component: 'HostView' })
      }

      connection.on('close', onDisconnected)
      connection.on('error', onDisconnected)
    })

    peer.on('error', () => {
      setStatus('接続エラー')
    })

    return () => {
      activeConnection?.close()
      peer.destroy()
    }
  }, [trackEvent])

  const qrValue = peerId ? getSensorUrl(peerId) : null

  const chartData = useMemo(() => {
    if (samples.length === 0) {
      return []
    }

    const latestTimestamp = samples[samples.length - 1]?.timestamp ?? Date.now()
    return samples.map((sample) => ({
      t: Number(((sample.timestamp - latestTimestamp) / 1000).toFixed(2)),
      ax: sample.accel.x,
      ay: sample.accel.y,
      az: sample.accel.z,
      gx: sample.gyro.x,
      gy: sample.gyro.y,
      gz: sample.gyro.z,
    }))
  }, [samples])

  return (
    <section className="demo-panel" aria-label="host-panel">
      <h2>Sensor Host</h2>
      <p className="status-line">状態: {status}</p>
      <div className="host-layout">
        <div className="qr-area">
          {qrValue ? (
            <>
              <QRCodeSVG value={qrValue} size={220} />
              <p className="pairing-url">{qrValue}</p>
            </>
          ) : (
            <p>QR を生成中です…</p>
          )}
        </div>
        <div className="telemetry-area">
          <p>
            最新値: accel({latestSample?.accel.x.toFixed(2) ?? '0.00'},{' '}
            {latestSample?.accel.y.toFixed(2) ?? '0.00'}, {latestSample?.accel.z.toFixed(2) ?? '0.00'})
          </p>
          <p>
            gyro({latestSample?.gyro.x.toFixed(2) ?? '0.00'}, {latestSample?.gyro.y.toFixed(2) ?? '0.00'},{' '}
            {latestSample?.gyro.z.toFixed(2) ?? '0.00'})
          </p>
          <p>
            orientation({latestSample?.orientation.alpha.toFixed(2) ?? '0.00'},{' '}
            {latestSample?.orientation.beta.toFixed(2) ?? '0.00'},{' '}
            {latestSample?.orientation.gamma.toFixed(2) ?? '0.00'})
          </p>

          <div className="chart-wrap" data-testid="accel-chart">
            <ResponsiveContainer width="100%" height={190}>
              <LineChart data={chartData}>
                <XAxis dataKey="t" unit="s" />
                <YAxis domain={[-20, 20]} />
                <Tooltip />
                <Line dataKey="ax" stroke="#ef4444" dot={false} isAnimationActive={false} />
                <Line dataKey="ay" stroke="#10b981" dot={false} isAnimationActive={false} />
                <Line dataKey="az" stroke="#3b82f6" dot={false} isAnimationActive={false} />
              </LineChart>
            </ResponsiveContainer>
          </div>

          <div className="chart-wrap" data-testid="gyro-chart">
            <ResponsiveContainer width="100%" height={190}>
              <LineChart data={chartData}>
                <XAxis dataKey="t" unit="s" />
                <YAxis domain={[-180, 180]} />
                <Tooltip />
                <Line dataKey="gx" stroke="#f59e0b" dot={false} isAnimationActive={false} />
                <Line dataKey="gy" stroke="#8b5cf6" dot={false} isAnimationActive={false} />
                <Line dataKey="gz" stroke="#06b6d4" dot={false} isAnimationActive={false} />
              </LineChart>
            </ResponsiveContainer>
          </div>

          <button
            type="button"
            className="counter"
            onClick={() => {
              if (!latestSample) {
                return
              }
              setCalibration(latestSample.orientation)
            }}
          >
            ゼロ点キャリブレーション
          </button>

          <div className="device-canvas" data-testid="orientation-canvas">
            <Canvas camera={{ position: [0, 0, 3] }}>
              <ambientLight intensity={0.6} />
              <directionalLight position={[1, 2, 3]} intensity={1.1} />
              <DeviceModel
                orientation={latestSample?.orientation ?? zeroOrientation}
                calibration={calibration}
              />
              <OrbitControls enablePan={false} enableZoom={false} />
            </Canvas>
          </div>
        </div>
      </div>
    </section>
  )
}

function SensorView() {
  const [status, setStatus] = useState('未接続')
  const [error, setError] = useState<string | null>(null)
  const [isStreaming, setIsStreaming] = useState(false)
  const hostPeerId = new URLSearchParams(window.location.search).get('peer')
  const trackEvent = useTrackEvent()

  const latestRef = useRef<SensorSample>({
    timestamp: Date.now(),
    accel: zeroVector,
    gyro: zeroVector,
    orientation: zeroOrientation,
  })

  useEffect(() => {
    if (!isStreaming || !hostPeerId) {
      return
    }

    let motionActive = true
    const peer = new Peer()
    let connection: DataConnection | null = null

    const onMotion = (event: DeviceMotionEvent) => {
      const current = latestRef.current
      latestRef.current = {
        ...current,
        timestamp: Date.now(),
        accel: {
          x: toFiniteNumber(event.accelerationIncludingGravity?.x),
          y: toFiniteNumber(event.accelerationIncludingGravity?.y),
          z: toFiniteNumber(event.accelerationIncludingGravity?.z),
        },
        gyro: {
          x: toFiniteNumber(event.rotationRate?.alpha),
          y: toFiniteNumber(event.rotationRate?.beta),
          z: toFiniteNumber(event.rotationRate?.gamma),
        },
      }
    }

    const onOrientation = (event: DeviceOrientationEvent) => {
      const current = latestRef.current
      latestRef.current = {
        ...current,
        timestamp: Date.now(),
        orientation: {
          alpha: toFiniteNumber(event.alpha),
          beta: toFiniteNumber(event.beta),
          gamma: toFiniteNumber(event.gamma),
        },
      }
    }

    window.addEventListener('devicemotion', onMotion)
    window.addEventListener('deviceorientation', onOrientation)

    const timer = window.setInterval(() => {
      if (!connection?.open || !motionActive) {
        return
      }
      connection.send(latestRef.current)
    }, SEND_INTERVAL_MS)

    peer.on('open', () => {
      connection = peer.connect(hostPeerId)
      connection.on('open', () => {
        setStatus('送信中')
        trackEvent('sensor_stream_started', { component: 'SensorView', hostPeerId })
      })
      connection.on('close', () => {
        setStatus('切断されました')
      })
      connection.on('error', () => {
        setStatus('接続エラー')
      })
    })

    peer.on('error', () => {
      setStatus('接続エラー')
    })

    return () => {
      motionActive = false
      window.clearInterval(timer)
      window.removeEventListener('devicemotion', onMotion)
      window.removeEventListener('deviceorientation', onOrientation)
      connection?.close()
      peer.destroy()
    }
  }, [hostPeerId, isStreaming, trackEvent])

  const isSupported =
    typeof window.DeviceMotionEvent !== 'undefined' ||
    typeof window.DeviceOrientationEvent !== 'undefined'

  const requestPermission = async () => {
    const motionType = DeviceMotionEvent as unknown as {
      requestPermission?: () => Promise<'granted' | 'denied'>
    }
    const orientationType = DeviceOrientationEvent as unknown as {
      requestPermission?: () => Promise<'granted' | 'denied'>
    }

    if (typeof motionType.requestPermission === 'function') {
      const result = await motionType.requestPermission()
      if (result !== 'granted') {
        return false
      }
    }

    if (typeof orientationType.requestPermission === 'function') {
      const result = await orientationType.requestPermission()
      if (result !== 'granted') {
        return false
      }
    }

    return true
  }

  return (
    <section className="sensor-panel">
      <h1>Sensor client</h1>
      {!hostPeerId ? <p>接続先 peer ID がありません。QR から開いてください。</p> : null}
      {!isSupported ? (
        <p>この端末では DeviceMotion / DeviceOrientation が利用できません。</p>
      ) : null}
      {error ? <p className="status-line">{error}</p> : null}
      <p className="status-line">状態: {status}</p>
      <button
        type="button"
        className="counter"
        disabled={!hostPeerId || !isSupported || isStreaming}
        onClick={async () => {
          setError(null)
          try {
            const granted = await requestPermission()
            if (!granted) {
              setError('権限が拒否されました。ブラウザ設定をご確認ください。')
              return
            }
            setStatus('接続中…')
            setIsStreaming(true)
          } catch {
            setError('権限要求に失敗しました。')
          }
        }}
      >
        接続を開始
      </button>
    </section>
  )
}

function LandingView() {
  const [count, setCount] = useState(0)
  const trackEvent = useTrackEvent()

  return (
    <>
      <section id="center">
        <div className="hero">
          <img src={heroImg} className="base" width="170" height="179" alt="" />
          <img src={reactLogo} className="framework" alt="React logo" />
          <img src={viteLogo} className="vite" alt="Vite logo" />
        </div>
        <div>
          <h1>Get started</h1>
          <p>
            Edit <code>src/App.tsx</code> and save to test <code>HMR</code>
          </p>
        </div>
        <button
          type="button"
          className="counter"
          onClick={() => {
            const nextCount = count + 1
            setCount(nextCount)
            trackEvent(
              'counter_button_clicked',
              {
                component: 'App',
              },
              {
                nextCount,
              },
            )
          }}
        >
          Count is {count}
        </button>
      </section>

      <div className="ticks"></div>

      <section id="next-steps">
        <div id="docs">
          <svg className="icon" role="presentation" aria-hidden="true">
            <use href="/icons.svg#documentation-icon"></use>
          </svg>
          <h2>Documentation</h2>
          <p>Your questions, answered</p>
          <ul>
            <li>
              <a href="https://vite.dev/" target="_blank" rel="noopener">
                <img className="logo" src={viteLogo} alt="" />
                Explore Vite
              </a>
            </li>
            <li>
              <a
                href="https://react.dev/"
                target="_blank"
                rel="noopener"
                aria-label="Learn more about React"
              >
                <img className="button-icon" src={reactLogo} alt="" />
                Learn more
              </a>
            </li>
          </ul>
        </div>
        <div id="social">
          <svg className="icon" role="presentation" aria-hidden="true">
            <use href="/icons.svg#social-icon"></use>
          </svg>
          <h2>Connect with us</h2>
          <p>Join the Vite community</p>
          <ul>
            <li>
              <a href="https://github.com/vitejs/vite" target="_blank" rel="noopener">
                <svg className="button-icon" role="presentation" aria-hidden="true">
                  <use href="/icons.svg#github-icon"></use>
                </svg>
                GitHub
              </a>
            </li>
            <li>
              <a href="https://chat.vite.dev/" target="_blank" rel="noopener">
                <svg className="button-icon" role="presentation" aria-hidden="true">
                  <use href="/icons.svg#discord-icon"></use>
                </svg>
                Discord
              </a>
            </li>
            <li>
              <a href="https://x.com/vite_js" target="_blank" rel="noopener">
                <svg className="button-icon" role="presentation" aria-hidden="true">
                  <use href="/icons.svg#x-icon"></use>
                </svg>
                X.com
              </a>
            </li>
            <li>
              <a href="https://bsky.app/profile/vite.dev" target="_blank" rel="noopener">
                <svg className="button-icon" role="presentation" aria-hidden="true">
                  <use href="/icons.svg#bluesky-icon"></use>
                </svg>
                Bluesky
              </a>
            </li>
          </ul>
        </div>
      </section>

      <div className="ticks"></div>
      <section id="spacer"></section>
    </>
  )
}

function App() {
  const role = getRole()

  if (role === 'sensor') {
    return <SensorView />
  }

  return (
    <>
      <HostView />
      <LandingView />
    </>
  )
}

export default App
