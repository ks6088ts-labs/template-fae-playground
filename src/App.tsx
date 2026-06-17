import { Canvas, useFrame } from '@react-three/fiber'
import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import {
  CartesianGrid,
  Legend,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts'
import type { Quaternion as ThreeQuaternion } from 'three'
import { Euler, MathUtils, type Mesh, Quaternion, Vector3 } from 'three'

import './App.css'
import { useTrackEvent } from './telemetry/react/hooks'

type PermissionStatus = 'idle' | 'granted' | 'denied' | 'unsupported'

type OrientationSample = {
  alpha: number | null
  beta: number | null
  gamma: number | null
  heading: number | null
}

type MotionSample = {
  accelerationX: number | null
  accelerationY: number | null
  accelerationZ: number | null
  accelerationGravityX: number | null
  accelerationGravityY: number | null
  accelerationGravityZ: number | null
  rotationAlpha: number | null
  rotationBeta: number | null
  rotationGamma: number | null
}

type SensorSample = MotionSample &
  OrientationSample & {
    timestamp: number
  }

type Capabilities = {
  motionSupported: boolean
  orientationSupported: boolean
  canRequestMotionPermission: boolean
  canRequestOrientationPermission: boolean
}

type DeviceOrientationWithCompass = DeviceOrientationEvent & {
  webkitCompassHeading?: number
}

const CHART_WINDOW_SECONDS = 10
const CHART_SAMPLE_RATE = 30
const MAX_CHART_POINTS = CHART_WINDOW_SECONDS * CHART_SAMPLE_RATE
const CSV_HEADER =
  'timestamp_ms,acc_x,acc_y,acc_z,accg_x,accg_y,accg_z,rot_alpha,rot_beta,rot_gamma,ori_alpha,ori_beta,ori_gamma,heading_deg'

function toNullableNumber(value: number | null | undefined): number | null {
  return typeof value === 'number' && Number.isFinite(value) ? value : null
}

function detectCapabilities(): Capabilities {
  if (typeof window === 'undefined') {
    return {
      motionSupported: false,
      orientationSupported: false,
      canRequestMotionPermission: false,
      canRequestOrientationPermission: false,
    }
  }

  const motionSupported = 'DeviceMotionEvent' in window
  const orientationSupported = 'DeviceOrientationEvent' in window
  const motionConstructor = window.DeviceMotionEvent as
    | (typeof DeviceMotionEvent & { requestPermission?: () => Promise<string> })
    | undefined
  const orientationConstructor = window.DeviceOrientationEvent as
    | (typeof DeviceOrientationEvent & {
        requestPermission?: () => Promise<string>
      })
    | undefined

  return {
    motionSupported,
    orientationSupported,
    canRequestMotionPermission:
      typeof motionConstructor?.requestPermission === 'function',
    canRequestOrientationPermission:
      typeof orientationConstructor?.requestPermission === 'function',
  }
}

function formatValue(value: number | null, digits = 2): string {
  return value === null ? '—' : value.toFixed(digits)
}

function sanitizeCsvValue(value: number | null): string {
  return value === null ? '' : String(value)
}

function orientationToQuaternion(
  orientation: OrientationSample,
  screenOrientationDeg: number,
): ThreeQuaternion {
  const alpha = MathUtils.degToRad(orientation.alpha ?? 0)
  const beta = MathUtils.degToRad(orientation.beta ?? 0)
  const gamma = MathUtils.degToRad(orientation.gamma ?? 0)
  const screen = MathUtils.degToRad(screenOrientationDeg)

  const quaternion = new Quaternion()
  const euler = new Euler(beta, gamma, alpha, 'ZXY')
  const screenQuaternion = new Quaternion().setFromAxisAngle(
    new Vector3(0, 0, 1),
    -screen,
  )

  quaternion.setFromEuler(euler)
  quaternion.multiply(screenQuaternion)

  return quaternion
}

function useSensorPermission() {
  const [permission, setPermission] = useState<PermissionStatus>('idle')
  const capabilities = useMemo(() => detectCapabilities(), [])

  const requestPermission = useCallback(async () => {
    if (!capabilities.motionSupported && !capabilities.orientationSupported) {
      setPermission('unsupported')
      return false
    }

    try {
      let motionGranted = true
      let orientationGranted = true

      if (capabilities.canRequestMotionPermission) {
        const motionRequestPermission = (
          window.DeviceMotionEvent as unknown as {
            requestPermission?: () => Promise<string>
          }
        ).requestPermission
        motionGranted =
          typeof motionRequestPermission === 'function' &&
          (await motionRequestPermission()) === 'granted'
      }

      if (capabilities.canRequestOrientationPermission) {
        const orientationRequestPermission = (
          window.DeviceOrientationEvent as unknown as {
            requestPermission?: () => Promise<string>
          }
        ).requestPermission
        orientationGranted =
          typeof orientationRequestPermission === 'function' &&
          (await orientationRequestPermission()) === 'granted'
      }

      const granted = motionGranted && orientationGranted
      setPermission(granted ? 'granted' : 'denied')

      return granted
    } catch {
      setPermission('denied')
      return false
    }
  }, [capabilities])

  useEffect(() => {
    if (!capabilities.motionSupported && !capabilities.orientationSupported) {
      setPermission('unsupported')
    }
  }, [capabilities])

  return {
    permission,
    capabilities,
    requestPermission,
  }
}

function emptySample(timestamp: number): SensorSample {
  return {
    timestamp,
    accelerationX: null,
    accelerationY: null,
    accelerationZ: null,
    accelerationGravityX: null,
    accelerationGravityY: null,
    accelerationGravityZ: null,
    rotationAlpha: null,
    rotationBeta: null,
    rotationGamma: null,
    alpha: null,
    beta: null,
    gamma: null,
    heading: null,
  }
}

function useSensorStream(enabled: boolean) {
  const [samples, setSamples] = useState<SensorSample[]>([])
  const latestMotionRef = useRef<MotionSample>(emptySample(Date.now()))
  const latestOrientationRef = useRef<OrientationSample>({
    alpha: null,
    beta: null,
    gamma: null,
    heading: null,
  })
  const samplesRef = useRef<SensorSample[]>([])

  useEffect(() => {
    if (!enabled) {
      return
    }

    const onMotion = (event: DeviceMotionEvent) => {
      latestMotionRef.current = {
        accelerationX: toNullableNumber(event.acceleration?.x),
        accelerationY: toNullableNumber(event.acceleration?.y),
        accelerationZ: toNullableNumber(event.acceleration?.z),
        accelerationGravityX: toNullableNumber(
          event.accelerationIncludingGravity?.x,
        ),
        accelerationGravityY: toNullableNumber(
          event.accelerationIncludingGravity?.y,
        ),
        accelerationGravityZ: toNullableNumber(
          event.accelerationIncludingGravity?.z,
        ),
        rotationAlpha: toNullableNumber(event.rotationRate?.alpha),
        rotationBeta: toNullableNumber(event.rotationRate?.beta),
        rotationGamma: toNullableNumber(event.rotationRate?.gamma),
      }
    }

    const onOrientation = (event: DeviceOrientationEvent) => {
      const orientationEvent = event as DeviceOrientationWithCompass
      const alpha = toNullableNumber(event.alpha)
      const heading =
        toNullableNumber(orientationEvent.webkitCompassHeading) ??
        (event.absolute && alpha !== null ? (360 - alpha + 360) % 360 : null)

      latestOrientationRef.current = {
        alpha,
        beta: toNullableNumber(event.beta),
        gamma: toNullableNumber(event.gamma),
        heading,
      }
    }

    window.addEventListener('devicemotion', onMotion)
    window.addEventListener('deviceorientation', onOrientation)

    let rafId = 0
    let lastFrame = 0

    const loop = (now: number) => {
      if (now - lastFrame >= 1000 / CHART_SAMPLE_RATE) {
        const timestamp = Date.now()
        const nextSample: SensorSample = {
          timestamp,
          ...latestMotionRef.current,
          ...latestOrientationRef.current,
        }

        const retained = [...samplesRef.current, nextSample]
          .filter(
            (sample) =>
              timestamp - sample.timestamp <= CHART_WINDOW_SECONDS * 1000,
          )
          .slice(-MAX_CHART_POINTS)

        samplesRef.current = retained
        setSamples(retained)
        lastFrame = now
      }

      rafId = window.requestAnimationFrame(loop)
    }

    rafId = window.requestAnimationFrame(loop)

    return () => {
      window.removeEventListener('devicemotion', onMotion)
      window.removeEventListener('deviceorientation', onOrientation)
      window.cancelAnimationFrame(rafId)
    }
  }, [enabled])

  useEffect(() => {
    if (enabled) {
      return
    }

    samplesRef.current = []
    setSamples([])
  }, [enabled])

  const latest = samples[samples.length - 1] ?? emptySample(Date.now())

  return {
    samples,
    latest,
  }
}

function SensorCard({
  title,
  data,
  lines,
}: {
  title: string
  data: Array<Record<string, number | null>>
  lines: Array<{ key: string; color: string; label: string }>
}) {
  return (
    <article className="card">
      <h2>{title}</h2>
      <div className="chart">
        <ResponsiveContainer
          width="100%"
          height="100%"
          minWidth={260}
          minHeight={220}
        >
          <LineChart data={data}>
            <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
            <XAxis
              dataKey="t"
              tickFormatter={(value) => `${value}s`}
              stroke="var(--text)"
            />
            <YAxis stroke="var(--text)" width={36} />
            <Tooltip
              formatter={(value) =>
                formatValue(typeof value === 'number' ? value : null)
              }
              labelFormatter={(value) => `${value}s`}
            />
            <Legend />
            {lines.map((line) => (
              <Line
                key={line.key}
                type="monotone"
                dataKey={line.key}
                name={line.label}
                stroke={line.color}
                dot={false}
                strokeWidth={2}
                isAnimationActive={false}
                connectNulls
              />
            ))}
          </LineChart>
        </ResponsiveContainer>
      </div>
    </article>
  )
}

function PoseDevice({ orientation }: { orientation: OrientationSample }) {
  const meshRef = useRef<Mesh>(null)

  useFrame(() => {
    if (!meshRef.current) {
      return
    }

    const screenAngle =
      window.screen.orientation?.angle ?? window.orientation ?? 0
    meshRef.current.quaternion.copy(
      orientationToQuaternion(orientation, Number(screenAngle)),
    )
  })

  return (
    <mesh ref={meshRef}>
      <boxGeometry args={[1.8, 0.12, 3.2]} />
      <meshStandardMaterial color="#7c3aed" />
    </mesh>
  )
}

function PoseView({ orientation }: { orientation: OrientationSample }) {
  return (
    <div className="pose-view">
      <Canvas camera={{ position: [0, 0, 4], fov: 45 }}>
        <ambientLight intensity={0.9} />
        <directionalLight position={[4, 4, 3]} intensity={1.1} />
        <PoseDevice orientation={orientation} />
      </Canvas>
    </div>
  )
}

function App() {
  const trackEvent = useTrackEvent()
  const { permission, requestPermission, capabilities } = useSensorPermission()
  const [streamEnabled, setStreamEnabled] = useState(false)
  const [isRecording, setIsRecording] = useState(false)
  const recordsRef = useRef<SensorSample[]>([])
  const { samples, latest } = useSensorStream(streamEnabled)

  useEffect(() => {
    if (!isRecording) {
      return
    }

    recordsRef.current = [...recordsRef.current, latest]
  }, [isRecording, latest])

  const startSensors = useCallback(async () => {
    trackEvent('sensor_session_started', { component: 'App' })
    const granted = await requestPermission()
    if (granted) {
      setStreamEnabled(true)
    }
  }, [requestPermission, trackEvent])

  const stopSensors = useCallback(() => {
    setStreamEnabled(false)
    setIsRecording(false)
    trackEvent('sensor_session_stopped', { component: 'App' })
  }, [trackEvent])

  const startRecording = useCallback(() => {
    recordsRef.current = []
    setIsRecording(true)
    trackEvent('sensor_recording_started', { component: 'App' })
  }, [trackEvent])

  const stopRecording = useCallback(() => {
    setIsRecording(false)
    trackEvent('sensor_recording_stopped', { component: 'App' })
  }, [trackEvent])

  const downloadCsv = useCallback(() => {
    const rows = recordsRef.current.map((sample) => {
      return [
        sample.timestamp,
        sanitizeCsvValue(sample.accelerationX),
        sanitizeCsvValue(sample.accelerationY),
        sanitizeCsvValue(sample.accelerationZ),
        sanitizeCsvValue(sample.accelerationGravityX),
        sanitizeCsvValue(sample.accelerationGravityY),
        sanitizeCsvValue(sample.accelerationGravityZ),
        sanitizeCsvValue(sample.rotationAlpha),
        sanitizeCsvValue(sample.rotationBeta),
        sanitizeCsvValue(sample.rotationGamma),
        sanitizeCsvValue(sample.alpha),
        sanitizeCsvValue(sample.beta),
        sanitizeCsvValue(sample.gamma),
        sanitizeCsvValue(sample.heading),
      ].join(',')
    })
    const csv = `${CSV_HEADER}\n${rows.join('\n')}`

    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8' })
    const url = URL.createObjectURL(blob)
    const anchor = document.createElement('a')
    anchor.href = url
    anchor.download = `sensor-log-${Date.now()}.csv`
    anchor.click()
    URL.revokeObjectURL(url)

    trackEvent('sensor_csv_downloaded', {
      component: 'App',
      sampleCount: String(recordsRef.current.length),
    })
  }, [trackEvent])

  const chartData = useMemo(() => {
    if (samples.length === 0) {
      return []
    }

    const startTime = samples[0].timestamp

    return samples.map((sample) => ({
      t: Number(((sample.timestamp - startTime) / 1000).toFixed(1)),
      accX: sample.accelerationX,
      accY: sample.accelerationY,
      accZ: sample.accelerationZ,
      gyroA: sample.rotationAlpha,
      gyroB: sample.rotationBeta,
      gyroG: sample.rotationGamma,
      oriA: sample.alpha,
      oriB: sample.beta,
      oriG: sample.gamma,
    }))
  }, [samples])

  const statusMessage = useMemo(() => {
    if (permission === 'unsupported') {
      return 'この端末/ブラウザではセンサー API が利用できません（PC等は非対応）。'
    }

    if (permission === 'denied') {
      return 'センサー権限が拒否されました。ブラウザ設定から許可してください。'
    }

    if (permission === 'granted' && streamEnabled) {
      return 'センサー受信中'
    }

    return '「センサー開始」を押して権限を許可してください。'
  }, [permission, streamEnabled])

  return (
    <main className="dashboard">
      <header className="dashboard-header">
        <h1>スマホセンサーダッシュボード</h1>
        <p>
          加速度・角速度・姿勢・方位をリアルタイム表示します（ローリングウィンドウ:
          {CHART_WINDOW_SECONDS}s）。
        </p>
      </header>

      <section className="card controls" aria-label="sensor controls">
        <div className="buttons">
          <button type="button" onClick={startSensors} disabled={streamEnabled}>
            センサー開始
          </button>
          <button type="button" onClick={stopSensors} disabled={!streamEnabled}>
            センサー停止
          </button>
          <button
            type="button"
            onClick={startRecording}
            disabled={!streamEnabled || isRecording}
          >
            記録開始
          </button>
          <button type="button" onClick={stopRecording} disabled={!isRecording}>
            記録停止
          </button>
          <button
            type="button"
            onClick={downloadCsv}
            disabled={recordsRef.current.length === 0}
          >
            CSV ダウンロード
          </button>
        </div>
        <p className="status" role="status">
          {statusMessage}
        </p>
        <dl className="capabilities">
          <div>
            <dt>Motion</dt>
            <dd>{capabilities.motionSupported ? '対応' : '非対応'}</dd>
          </div>
          <div>
            <dt>Orientation</dt>
            <dd>{capabilities.orientationSupported ? '対応' : '非対応'}</dd>
          </div>
        </dl>
      </section>

      <section className="grid">
        <SensorCard
          title="加速度 m/s²"
          data={chartData}
          lines={[
            { key: 'accX', color: '#ef4444', label: 'X' },
            { key: 'accY', color: '#3b82f6', label: 'Y' },
            { key: 'accZ', color: '#22c55e', label: 'Z' },
          ]}
        />
        <SensorCard
          title="角速度 deg/s"
          data={chartData}
          lines={[
            { key: 'gyroA', color: '#f97316', label: 'α' },
            { key: 'gyroB', color: '#06b6d4', label: 'β' },
            { key: 'gyroG', color: '#a855f7', label: 'γ' },
          ]}
        />
        <SensorCard
          title="姿勢 deg"
          data={chartData}
          lines={[
            { key: 'oriA', color: '#f59e0b', label: 'α' },
            { key: 'oriB', color: '#10b981', label: 'β' },
            { key: 'oriG', color: '#6366f1', label: 'γ' },
          ]}
        />

        <article className="card pose-card">
          <h2>3D 姿勢ビュー</h2>
          <PoseView
            orientation={{
              alpha: latest.alpha,
              beta: latest.beta,
              gamma: latest.gamma,
              heading: latest.heading,
            }}
          />
          <p className="pose-values">
            α:{formatValue(latest.alpha)} β:{formatValue(latest.beta)} γ:
            {formatValue(latest.gamma)} heading:{formatValue(latest.heading, 1)}
            °
          </p>
        </article>
      </section>
    </main>
  )
}

export default App
