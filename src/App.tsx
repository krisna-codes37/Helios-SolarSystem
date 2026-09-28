import { Canvas, useFrame } from '@react-three/fiber'
import { Stars, OrbitControls, Html } from '@react-three/drei'
import { AnimatePresence, motion } from 'framer-motion'
import { ArrowDown, ArrowRight, ArrowUpRight, Check, ChevronDown, CircleHelp, Github, Globe2, Maximize2, Menu, Orbit, Pause, Play, Plus, RotateCcw, Search, Volume2, VolumeX, X, Zap } from 'lucide-react'
import { Suspense, useEffect, useMemo, useRef, useState } from 'react'
import * as THREE from 'three'
import type { OrbitControls as OrbitControlsImpl } from 'three-stdlib'
import { dwarfPlanets, formatDistance, missions, moons, planets, type Planet } from './data'

type View = 'explore' | 'planets' | 'missions' | 'compare'

const explainers = [
  { question:'Why is Venus hotter than Mercury?', answer:'Venus has a dense carbon dioxide atmosphere that traps heat through an intense greenhouse effect. Mercury has almost no atmosphere to hold warmth.' },
  { question:'What makes a planet a gas giant?', answer:'Gas giants are large planets made mostly of hydrogen and helium, with deep atmospheres and no solid surface like Earth’s.' },
  { question:'Why does Saturn have rings?', answer:'Saturn’s rings are countless pieces of ice and rock orbiting the planet. They may be fragments of moons or comets broken apart by gravity.' },
]

const AU_SCENE = 0.3
const J2000_UNIX_MS = new Date('2000-01-01T12:00:00Z').getTime()
function keplerElements(planet: Planet, elapsedDays: number) {
  const centuries = elapsedDays / 36525
  return {
    a: planet.semiMajorAU + planet.elementRates.a * centuries,
    e: planet.eccentricity + planet.elementRates.e * centuries,
    i: THREE.MathUtils.degToRad(planet.inclination + planet.elementRates.i * centuries),
    longitude: planet.meanLongitude + planet.elementRates.L * centuries,
    perihelion: planet.longitudePerihelion + planet.elementRates.perihelion * centuries,
    node: planet.ascendingNode + planet.elementRates.node * centuries,
  }
}
function orbitalPosition(planet: Planet, elapsedDays: number, focusScale = AU_SCENE) {
  const elements = keplerElements(planet, elapsedDays)
  const argument = elements.perihelion - elements.node
  const correction = planet.name === 'Jupiter' ? [-.00012452,.06064060,-.35635438,38.35125]
    : planet.name === 'Saturn' ? [.00025899,-.13434469,.87320147,38.35125]
      : planet.name === 'Uranus' ? [.00058331,-.97731848,.17689245,7.67025]
        : planet.name === 'Neptune' ? [-.00041348,.68346318,-.10162547,7.67025] : [0,0,0,0]
  const meanDegrees = elements.longitude - elements.perihelion + correction[0] * centuriesSquared(elapsedDays) + correction[1] * Math.cos(THREE.MathUtils.degToRad(correction[3] * elapsedDays / 36525)) + correction[2] * Math.sin(THREE.MathUtils.degToRad(correction[3] * elapsedDays / 36525))
  const meanUnwrapped = THREE.MathUtils.degToRad(meanDegrees % 360)
  const mean = Math.atan2(Math.sin(meanUnwrapped), Math.cos(meanUnwrapped))
  let eccentric = mean
  for (let iteration = 0; iteration < 7; iteration++) eccentric -= (eccentric - elements.e * Math.sin(eccentric) - mean) / (1 - elements.e * Math.cos(eccentric))
  const xPrime = elements.a * (Math.cos(eccentric) - elements.e)
  const yPrime = elements.a * Math.sqrt(1 - elements.e ** 2) * Math.sin(eccentric)
  const omega = THREE.MathUtils.degToRad(argument)
  const node = THREE.MathUtils.degToRad(elements.node)
  const { i } = elements
  const x = (Math.cos(omega)*Math.cos(node)-Math.sin(omega)*Math.sin(node)*Math.cos(i))*xPrime + (-Math.sin(omega)*Math.cos(node)-Math.cos(omega)*Math.sin(node)*Math.cos(i))*yPrime
  const y = (Math.cos(omega)*Math.sin(node)+Math.sin(omega)*Math.cos(node)*Math.cos(i))*xPrime + (-Math.sin(omega)*Math.sin(node)+Math.cos(omega)*Math.cos(node)*Math.cos(i))*yPrime
  const z = Math.sin(omega)*Math.sin(i)*xPrime + Math.cos(omega)*Math.sin(i)*yPrime
  return new THREE.Vector3(x * focusScale, z * focusScale, y * focusScale)
}
const centuriesSquared = (elapsedDays: number) => (elapsedDays / 36525) ** 2

function PlanetMesh({ planet, selected, onSelect, showOrbits, showLabels, simulationClock, compareScale }: { planet: Planet; selected: boolean; onSelect: () => void; showOrbits: boolean; showLabels: boolean; simulationClock: { current: number }; compareScale: boolean }) {
  const ref = useRef<THREE.Group>(null)
  const spinRef = useRef<THREE.Mesh>(null)
  const size = compareScale ? Math.max(0.005, planet.radius / 6371 * 0.018) : Math.max(0.04, planet.radius / 6371 * 0.026)
  const orbitGeometry = useMemo(() => {
    const elements = keplerElements(planet, (new Date('2026-09-28T12:00:00Z').getTime() - J2000_UNIX_MS) / 86_400_000)
    const a = elements.a * AU_SCENE
    const e = elements.e
    const b = a * Math.sqrt(1 - e ** 2)
    const omega = THREE.MathUtils.degToRad(elements.perihelion - elements.node)
    const node = THREE.MathUtils.degToRad(elements.node)
    const inclination = elements.i
    const points = Array.from({ length: 181 }, (_, pointIndex) => {
      const eccentric = pointIndex / 180 * Math.PI * 2
      const xPrime = a * (Math.cos(eccentric) - e)
      const yPrime = b * Math.sin(eccentric)
      const x = (Math.cos(omega)*Math.cos(node)-Math.sin(omega)*Math.sin(node)*Math.cos(inclination))*xPrime + (-Math.sin(omega)*Math.cos(node)-Math.cos(omega)*Math.sin(node)*Math.cos(inclination))*yPrime
      const y = (Math.cos(omega)*Math.sin(node)+Math.sin(omega)*Math.cos(node)*Math.cos(inclination))*xPrime + (-Math.sin(omega)*Math.sin(node)+Math.cos(omega)*Math.cos(node)*Math.cos(inclination))*yPrime
      const z = Math.sin(omega)*Math.sin(inclination)*xPrime + Math.cos(omega)*Math.sin(inclination)*yPrime
      return new THREE.Vector3(x, z, y)
    })
    const geometry = new THREE.BufferGeometry().setFromPoints(points)
    return geometry
  }, [planet.semiMajorAU, planet.eccentricity, planet.inclination, planet.meanLongitude, planet.longitudePerihelion, planet.ascendingNode, planet.elementRates])
  useFrame(() => {
    if (ref.current) {
      ref.current.position.copy(orbitalPosition(planet, simulationClock.current))
    }
    if (spinRef.current) spinRef.current.rotation.y = (simulationClock.current * 24 * Math.PI * 2 / planet.rotationHours) % (Math.PI * 2)
  })
  return <>
    {showOrbits && <lineLoop geometry={orbitGeometry}><lineBasicMaterial color={selected ? '#d8b98a' : '#718096'} transparent opacity={selected ? 0.52 : 0.26} /></lineLoop>}
    <group ref={ref}>
      <group rotation-z={THREE.MathUtils.degToRad(planet.axialTilt)}>
        <mesh ref={spinRef} onClick={(e) => { e.stopPropagation(); onSelect() }}>
          <sphereGeometry args={[size, 48, 48]} />
          <meshStandardMaterial color={planet.color} roughness={planet.name === 'Earth' ? 0.58 : 0.84} metalness={0.04} emissive={planet.color} emissiveIntensity={selected ? 0.2 : 0.015} />
          {planet.name === 'Saturn' && <mesh rotation-x={-Math.PI / 2}>
            <ringGeometry args={[size * 1.32, size * 2.2, 72]} />
            <meshStandardMaterial color="#d3bd93" transparent opacity={0.76} side={THREE.DoubleSide} />
          </mesh>}
          {planet.name === 'Earth' && <mesh scale={1.12}>
            <sphereGeometry args={[size, 32, 32]} /><meshBasicMaterial color="#6cbaff" transparent opacity={0.12} side={THREE.BackSide} />
          </mesh>}
        </mesh>
      </group>
      {showLabels && <Html distanceFactor={14} position={[0, size + 0.08, 0]} center>
        <button className={`planet-label ${selected ? 'is-selected' : ''}`} onClick={(e) => { e.stopPropagation(); onSelect() }}>{planet.name}</button>
      </Html>}
    </group>
  </>
}

function CameraFocus({ selected, controls, simulationClock, focusRequest }: { selected: Planet; controls: React.RefObject<OrbitControlsImpl | null>; simulationClock: { current: number }; focusRequest: number }) {
  const previous = useRef(selected.name)
  const previousDate = useRef(focusRequest)
  const moving = useRef(false)
  const focus = useRef(new THREE.Vector3())
  const destination = useRef(new THREE.Vector3())
  const offset = new THREE.Vector3(0, 0.8, 1.25)
  useEffect(() => {
    if (previous.current !== selected.name || previousDate.current !== focusRequest) moving.current = true
    previous.current = selected.name
    previousDate.current = focusRequest
  }, [selected.name, focusRequest])
  useFrame(({ camera }, delta) => {
    if (!moving.current) return
    focus.current.copy(orbitalPosition(selected, simulationClock.current))
    destination.current.copy(focus.current).add(offset)
    const blend = 1 - Math.exp(-3.2 * delta)
    camera.position.lerp(destination.current, blend)
    if (controls.current) {
      controls.current.target.lerp(focus.current, blend)
      controls.current.update()
      if (controls.current.target.distanceTo(focus.current) < 0.025 && camera.position.distanceTo(destination.current) < 0.04) moving.current = false
    }
  })
  return null
}

function SimulationClock({ clock, speed, paused }: { clock: { current: number }; speed: number; paused: boolean }) {
  useFrame((_, delta) => { if (!paused) clock.current += delta * speed * 2 })
  return null
}

function AsteroidBelt({ simulationClock }: { simulationClock: { current: number } }) {
  const mesh = useRef<THREE.InstancedMesh>(null)
  const updateAccumulator = useRef(0)
  const asteroids = useMemo(() => Array.from({ length: 360 }, (_, i) => {
    const random = (seed: number) => {
      const value = Math.sin(seed * 127.1 + 311.7) * 43758.5453
      return value - Math.floor(value)
    }
    const angle = random(i + 1) * Math.PI * 2
    const radius = 0.82 + random(i + 521) * 0.15
    const size = 0.002 + random(i + 1041) * 0.004
    return { angle, radius, y: (random(i + 1561) - 0.5) * 0.008, size }
  }), [])
  useFrame((_, delta) => {
    if (!mesh.current) return
    updateAccumulator.current += delta
    if (updateAccumulator.current < 0.12) return
    updateAccumulator.current = 0
    const dummy = new THREE.Object3D()
    asteroids.forEach((asteroid, index) => {
      const semiMajorAU = asteroid.radius / AU_SCENE
      const meanMotion = Math.PI * 2 / (365.256 * semiMajorAU ** 1.5)
      const angle = asteroid.angle + simulationClock.current * meanMotion
      dummy.position.set(Math.cos(angle) * asteroid.radius, asteroid.y, Math.sin(angle) * asteroid.radius)
      dummy.scale.setScalar(asteroid.size)
      dummy.updateMatrix()
      mesh.current!.setMatrixAt(index, dummy.matrix)
    })
    mesh.current.instanceMatrix.needsUpdate = true
  })
  return <instancedMesh ref={mesh} args={[undefined, undefined, asteroids.length]}>
    <dodecahedronGeometry args={[1, 0]} />
    <meshStandardMaterial color="#9d9182" roughness={1} />
  </instancedMesh>
}

function GravityGrid() {
  const geometry = useMemo(() => {
    const points: THREE.Vector3[] = []
    const size = 3.9
    const sample = 72
    const heightAt = (x: number, z: number) => -0.9 / Math.sqrt(x * x + z * z + 0.12)
    for (let row = 0; row <= 12; row++) {
      const z = -size + row * size * 2 / 12
      for (let column = 0; column <= sample; column++) {
        const x = -size + column * size * 2 / sample
        if (column < sample) {
          const nextX = x + size * 2 / sample
          points.push(new THREE.Vector3(x, heightAt(x, z), z), new THREE.Vector3(nextX, heightAt(nextX, z), z))
        }
      }
    }
    for (let column = 0; column <= 12; column++) {
      const x = -size + column * size * 2 / 12
      for (let row = 0; row <= sample; row++) {
        const z = -size + row * size * 2 / sample
        if (row < sample) {
          const nextZ = z + size * 2 / sample
          points.push(new THREE.Vector3(x, heightAt(x, z), z), new THREE.Vector3(x, heightAt(x, nextZ), nextZ))
        }
      }
    }
    return new THREE.BufferGeometry().setFromPoints(points)
  }, [])
  return <lineSegments geometry={geometry}><lineBasicMaterial color="#84b8cb" transparent opacity={0.34} /></lineSegments>
}

function SolarScene({ selected, setSelected, speed, paused, showOrbits, showAsteroids, showLabels, compareScale, elapsedDays, gravityMode, focusRequest }: { selected: Planet; setSelected: (planet: Planet) => void; speed: number; paused: boolean; showOrbits: boolean; showAsteroids: boolean; showLabels: boolean; compareScale: boolean; elapsedDays: number; gravityMode: boolean; focusRequest: number }) {
  const controls = useRef<OrbitControlsImpl | null>(null)
  const simulationClock = useRef(elapsedDays)
  useEffect(() => { simulationClock.current = elapsedDays }, [elapsedDays])
  return <Canvas camera={{ position: [0, 18, 27], fov: 42 }} dpr={[1, 1.55]} gl={{ antialias: true, alpha: true }}>
    <color attach="background" args={['#080b12']} />
    <fog attach="fog" args={['#080b12', 34, 56]} />
    <ambientLight intensity={0.56} /><pointLight position={[0, 0, 0]} intensity={110} color="#ffbf67" distance={42} decay={1.65} />
    <Stars radius={90} depth={55} count={1500} factor={3.2} saturation={0.1} fade speed={0.25} />
    <mesh>
      <sphereGeometry args={[0.03, 64, 64]} />
      <meshBasicMaterial color="#fff0bd" toneMapped={false} />
    </mesh>
    {[0.042, 0.072, 0.11].map((radius, index) => <mesh key={radius}><sphereGeometry args={[radius, 40, 40]} /><meshBasicMaterial color={index === 0 ? '#ffbc5c' : '#ff9c42'} transparent opacity={[0.24, 0.09, 0.025][index]} side={THREE.BackSide} depthWrite={false} /></mesh>)}
    {gravityMode && <GravityGrid />}
    {showAsteroids && <AsteroidBelt simulationClock={simulationClock} />}
    {planets.map(p => <PlanetMesh key={p.name} planet={p} selected={selected.name === p.name} onSelect={() => setSelected(p)} showOrbits={showOrbits} showLabels={showLabels} compareScale={compareScale} simulationClock={simulationClock} />)}
    <SimulationClock clock={simulationClock} speed={speed} paused={paused} />
    <OrbitControls ref={controls} makeDefault enablePan minDistance={0.65} maxDistance={48} minPolarAngle={0.05} maxPolarAngle={Math.PI - 0.05} rotateSpeed={0.55} zoomSpeed={0.85} />
    <CameraFocus selected={selected} controls={controls} simulationClock={simulationClock} focusRequest={focusRequest} />
  </Canvas>
}

function App() {
  const [view, setView] = useState<View>('explore')
  const [selected, setSelected] = useState<Planet>(planets[2])
  const [paused, setPaused] = useState(false)
  const [speed, setSpeed] = useState(1)
  const [showOrbits, setShowOrbits] = useState(true)
  const [showAsteroids, setShowAsteroids] = useState(true)
  const [showPlanetCard, setShowPlanetCard] = useState(true)
  const [showLabels, setShowLabels] = useState(false)
  const [gravityMode, setGravityMode] = useState(false)
  const [soundEnabled, setSoundEnabled] = useState(false)
  const [isFullscreen, setIsFullscreen] = useState(false)
  const [pseudoFullscreen, setPseudoFullscreen] = useState(false)
  const [focusRequest, setFocusRequest] = useState(0)
  const [compareScale, setCompareScale] = useState(false)
  const [simulationDate, setSimulationDate] = useState('2026-09-28')
  const [query, setQuery] = useState('')
  const [searchOpen, setSearchOpen] = useState(false)
  const [compare, setCompare] = useState<Planet>(planets[3])
  const [selectedMission, setSelectedMission] = useState(missions[0])
  const [activeMoon, setActiveMoon] = useState('Europa')
  const [weight, setWeight] = useState('68')
  const [age, setAge] = useState('20')
  const [quizAnswer, setQuizAnswer] = useState('')
  const [openExplainer, setOpenExplainer] = useState(0)
  const [mobileMenu, setMobileMenu] = useState(false)
  const audioContext = useRef<AudioContext | null>(null)
  const playUiSound = () => {
    const Context = window.AudioContext
    if (!Context || !audioContext.current) return
    if (audioContext.current.state === 'suspended') void audioContext.current.resume()
    const oscillator = audioContext.current.createOscillator()
    const gain = audioContext.current.createGain()
    oscillator.type = 'sine'
    oscillator.frequency.setValueAtTime(720, audioContext.current.currentTime)
    oscillator.frequency.exponentialRampToValueAtTime(480, audioContext.current.currentTime + 0.045)
    gain.gain.setValueAtTime(0.045, audioContext.current.currentTime)
    gain.gain.exponentialRampToValueAtTime(0.001, audioContext.current.currentTime + 0.055)
    oscillator.connect(gain).connect(audioContext.current.destination)
    oscillator.start()
    oscillator.stop(audioContext.current.currentTime + 0.06)
  }
  const toggleSound = () => {
    if (!soundEnabled && typeof window !== 'undefined' && window.AudioContext) {
      audioContext.current ??= new window.AudioContext()
      void audioContext.current.resume()
    }
    setSoundEnabled(enabled => !enabled)
  }
  const toggleFullscreen = async () => {
    const scene = document.querySelector('.explorer-shell')
    if (!scene) return
    if (pseudoFullscreen) { setPseudoFullscreen(false); return }
    if (!document.fullscreenEnabled || !scene.requestFullscreen) { setPseudoFullscreen(true); return }
    try {
      if (document.fullscreenElement) await document.exitFullscreen()
      else await scene.requestFullscreen()
    } catch (error) {
      console.error('Fullscreen request was denied by the browser.', error)
      setPseudoFullscreen(true)
    }
  }
  useEffect(() => {
    const onShortcut = (event: KeyboardEvent) => {
      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === 'k') {
        event.preventDefault()
        setSearchOpen(true)
      }
      if (event.key === 'Escape') {
        setSearchOpen(false)
        setMobileMenu(false)
        setPseudoFullscreen(false)
      }
    }
    document.addEventListener('keydown', onShortcut)
    return () => document.removeEventListener('keydown', onShortcut)
  }, [])
  useEffect(() => {
    const updateFullscreen = () => {
      const active = Boolean(document.fullscreenElement)
      setIsFullscreen(active)
      if (active) setPseudoFullscreen(false)
    }
    document.addEventListener('fullscreenchange', updateFullscreen)
    return () => document.removeEventListener('fullscreenchange', updateFullscreen)
  }, [])
  const visibleResults = [...planets.map(p => ({ name: p.name, kind: 'PLANET', planet: p })), ...moons.map(m => ({ name: m.name, kind: 'MOON', planet: planets.find(p => p.name === m.parent)! })), ...dwarfPlanets.map(p => ({ name: p.name, kind: 'DWARF PLANET', planet: null })), ...missions.map(m => ({ name: m.name, kind: 'MISSION', planet: planets.find(p => p.name === m.target) ?? planets[7] }))].filter(x => x.name.toLowerCase().includes(query.toLowerCase())).slice(0, 5)

  const choosePlanet = (planet: Planet) => { setSelected(planet); setShowPlanetCard(true); setView('explore'); setSearchOpen(false); setQuery('') }
  const chooseSearchResult = (result: (typeof visibleResults)[number]) => {
    setSearchOpen(false)
    setQuery('')
    if (result.kind === 'DWARF PLANET') {
      document.getElementById('dwarf-planets')?.scrollIntoView({ behavior: 'smooth' })
      return
    }
    if (result.kind === 'MOON') {
      const moon = moons.find(item => item.name === result.name)
      if (moon) setActiveMoon(moon.name)
      document.getElementById('moon-explorer')?.scrollIntoView({ behavior: 'smooth' })
      return
    }
    if (result.planet) choosePlanet(result.planet)
    if (result.kind === 'MISSION') {
      const mission = missions.find(item => item.name === result.name)
      if (mission) setSelectedMission(mission)
      setView('missions')
      document.getElementById('mission-route')?.scrollIntoView({ behavior: 'smooth' })
    }
  }
  const moveSimulationDate = (days: number) => setSimulationDate(current => {
    const next = new Date(`${current}T12:00:00`)
    next.setDate(next.getDate() + days)
    return next.toISOString().slice(0, 10)
  })
  const formattedSimulationDate = new Date(`${simulationDate}T12:00:00`).toLocaleDateString('en-US', { month: 'short', day: '2-digit', year: 'numeric' }).toUpperCase()
  const dateOffsetDays = (new Date(`${simulationDate}T12:00:00Z`).getTime() - J2000_UNIX_MS) / 86_400_000
  return <main className="app-shell" onClickCapture={event => { if (soundEnabled && (event.target as HTMLElement).closest('button')) playUiSound() }}>
    <header className="topbar">
      <a className="brand" href="#top" onClick={() => setView('explore')} aria-label="Helios home"><span className="brand-mark"><Orbit size={18} /></span><span>helios<span className="brand-dot">.</span></span></a>
      <nav className={mobileMenu ? 'nav-links nav-open' : 'nav-links'} aria-label="Main navigation">
        {(['explore','planets','missions','compare'] as View[]).map(item => <button key={item} onClick={() => { setView(item); setMobileMenu(false) }} className={view === item ? 'nav-item active' : 'nav-item'}>{item === 'explore' ? 'Explore' : item === 'planets' ? 'Planets' : item === 'missions' ? 'Missions' : 'Compare'}{view === item && <span className="nav-indicator" />}</button>)}
      </nav>
      <div className="top-actions"><button className="icon-btn search-trigger" onClick={() => setSearchOpen(!searchOpen)} aria-label="Search the Solar System"><Search size={16} /><span>Search</span><kbd>⌘ K</kbd></button><button className={soundEnabled?'icon-btn sound-active':'icon-btn'} onClick={toggleSound} aria-label={soundEnabled?'Turn interface sounds off':'Turn interface sounds on'} title={soundEnabled?'Interface sounds on':'Interface sounds off'}>{soundEnabled?<Volume2 size={17}/>:<VolumeX size={17}/>}</button><span className="top-divider" /><button className="icon-btn mobile-menu" onClick={() => setMobileMenu(!mobileMenu)} aria-label="Toggle menu">{mobileMenu ? <X size={19} /> : <Menu size={19} />}</button><a className="github-link" href="https://github.com/krisna-codes37/Helios-SolarSystem" target="_blank" rel="noreferrer" aria-label="GitHub repository"><Github size={17} /></a></div>
    </header>

    <AnimatePresence>{searchOpen && <motion.div className="search-popover" initial={{ opacity: 0, y: -7 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -7 }}>
      <div className="search-input-wrap"><Search size={17} /><input autoFocus value={query} onChange={e => setQuery(e.target.value)} placeholder="Search planets, moons, missions..." onKeyDown={e => { if (e.key === 'Enter' && visibleResults[0]) chooseSearchResult(visibleResults[0]) }} /><kbd>ESC</kbd><button className="bare-icon" onClick={() => setSearchOpen(false)}><X size={16} /></button></div>
      <div className="search-results">{(query ? visibleResults : [{name:'Earth',kind:'PLANET',planet:planets[2]},{name:'Mars',kind:'PLANET',planet:planets[3]},{name:'Europa',kind:'MOON',planet:planets[4]}]).map(result => <button key={result.name} onClick={() => chooseSearchResult(result)}><span className="result-orb" style={{background:result.planet?.color ?? '#b8ac9d'}} /><span>{result.name}<small>{result.planet?.type.toLowerCase() ?? 'dwarf planet'} · {result.kind.toLowerCase()}</small></span><ArrowUpRight size={15} /></button>)}{query && visibleResults.length === 0 && <p className="empty-result">No matches. Try a planet, moon, or mission.</p>}</div>
    </motion.div>}</AnimatePresence>

    <section className="hero" id="top">
      <div className="hero-copy"><div className="eyebrow"><span className="live-dot" /> SOLAR SYSTEM OBSERVATORY <span className="eyebrow-line" /></div><h1>Space,<br /><span>within reach.</span></h1><p>Explore planetary motion, scale, and gravity across our cosmic neighborhood.</p><div className="hero-actions"><button className="primary-button" onClick={() => { setView('explore'); document.getElementById('observatory')?.scrollIntoView({behavior:'smooth'}) }}>Explore the system <ArrowRight size={16} /></button><button className="text-button" onClick={() => setView('planets')}>Meet the planets <ArrowUpRight size={15} /></button></div><div className="hero-note"><span className="note-icon"><Globe2 size={15} /></span><span>Our cosmic neighborhood, <strong>made explorable.</strong></span></div></div>
      <div className="hero-art" aria-hidden="true"><div className="hero-glow" /><div className="hero-planet" /><div className="hero-ring ring-one" /><div className="hero-ring ring-two" /><span className="hero-star s1">✦</span><span className="hero-star s2">·</span><span className="hero-star s3">✧</span><span className="hero-star s4">·</span><span className="hero-star s5">✦</span><span className="hero-label label-one">EARTH<br /><small>149.6M KM</small></span><span className="hero-label label-two">SATURN<br /><small>1.4B KM</small></span><span className="hero-coordinate">SOL / 00:00:01</span></div>
    </section>

    <section className="stat-strip" aria-label="Solar System facts"><div><span className="stat-index">01</span><strong>8</strong><span>planets</span></div><div><span className="stat-index">02</span><strong>1</strong><span>star, our Sun</span></div><div><span className="stat-index">03</span><strong>891+</strong><span>known moons</span></div><div className="stat-caption"><span className="live-dot" /> A LOT TO EXPLORE <ArrowDown size={14} /></div></section>

    <section className="observatory section-wrap" id="observatory">
      <div className="section-heading"><div><div className="eyebrow"><span className="section-number">01</span> YOUR WINDOW TO THE COSMOS</div><h2>The Solar System,<br /><span>in motion.</span></h2></div><p>Pick a world. Follow its orbit.<br />See our neighborhood differently.</p></div>
      <div className={pseudoFullscreen?'explorer-shell pseudo-fullscreen':'explorer-shell'}>
        <div className="explorer-topline"><div className="window-dots"><i /><i /><i /></div><div className="scene-title"><span className="live-dot" /> KEPLERIAN MODEL <span className="scene-separator">/</span> HELIOCENTRIC VIEW</div><div className="scene-top-actions"><button className="scene-expand" aria-label="Reset camera to Earth" title="Reset camera to Earth" onClick={() => { setSelected(planets[2]); setFocusRequest(value => value + 1) }}><RotateCcw size={15} /></button><button className="scene-expand" aria-label={isFullscreen||pseudoFullscreen?'Exit full screen':'Explore in full screen'} title={isFullscreen||pseudoFullscreen?'Exit full screen':'Explore in full screen'} onClick={toggleFullscreen}>{isFullscreen||pseudoFullscreen?<X size={16}/>:<Maximize2 size={15}/>}</button></div></div>
        <div className="scene-content" style={{'--scene-display':showOrbits ? 'block' : 'none'} as React.CSSProperties}>
          <div className="scene-backdrop-grid" /><div className="scene-vignette" />
          <div className="scene-canvas"><Suspense fallback={<div className="canvas-fallback">Preparing the observatory…</div>}><SolarScene selected={selected} setSelected={setSelected} speed={speed} paused={paused} showOrbits={showOrbits} showAsteroids={showAsteroids} showLabels={showLabels} compareScale={compareScale} elapsedDays={dateOffsetDays} gravityMode={gravityMode} focusRequest={focusRequest+dateOffsetDays} /></Suspense></div>
          <div className="scene-axis axis-x" /><div className="scene-axis axis-y" />
          <div className="scene-coordinate"><span>SIMULATION DATE</span><strong>{formattedSimulationDate}</strong><div className="date-controls"><button onClick={() => moveSimulationDate(-1)} aria-label="Previous day">−1 D</button><button onClick={() => { setSimulationDate('2026-09-28'); setFocusRequest(value => value + 1) }}>TODAY</button><button onClick={() => moveSimulationDate(1)} aria-label="Next day">+1 D</button></div><small>JPL APPROX. ELEMENTS · J2000 FRAME</small></div>
          <div className="scene-scale"><span>PLANET SIZE</span><button className={compareScale?'scale-pill':'scale-pill active'} onClick={() => setCompareScale(false)} title="Planet sizes are visible but enlarged relative to the Sun">Visible</button><button className={compareScale?'scale-pill active':'scale-pill'} onClick={() => setCompareScale(true)} title="Planet diameters keep their relative proportions">Relative</button></div>
          {gravityMode&&<div className="gravity-caption"><strong>SPACETIME CURVATURE · ANALOGY</strong><span>The grid is a 2D slice used to picture curvature. Real spacetime is 4D; this fabric is not a literal surface.</span></div>}
          <AnimatePresence mode="wait">{showPlanetCard && <motion.aside className="planet-card" key={selected.name} initial={{opacity:0,x:14}} animate={{opacity:1,x:0}} exit={{opacity:0,x:8}} transition={{duration:.22}}>
            <div className="card-kicker"><span className="live-dot" /> SELECTED WORLD <button className="bare-icon" aria-label="Close details" onClick={() => setShowPlanetCard(false)}><X size={14} /></button></div><div className="planet-card-title"><span className="mini-planet" style={{background:selected.color}} /><div><span className="planet-type">{selected.type}</span><h3>{selected.name}</h3></div><ArrowUpRight size={15} /></div><p className="planet-desc">{selected.description}</p>
            <div className="planet-metrics"><div><span>MEAN DISTANCE</span><strong>{formatDistance(selected.distance)}</strong></div><div><span>SIDEREAL YEAR</span><strong>{selected.period.toLocaleString()} <small>days</small></strong></div><div><span>MEAN RADIUS</span><strong>{selected.radius.toLocaleString()} <small>km</small></strong></div><div><span>KNOWN MOONS</span><strong>{selected.moons}</strong></div><div><span>ORBIT ECCENTRICITY</span><strong>{selected.eccentricity.toFixed(3)}</strong></div><div><span>ORBIT INCLINATION</span><strong>{selected.inclination.toFixed(2)}°</strong></div><div><span>SIDEREAL ROTATION</span><strong>{Math.abs(selected.rotationHours)>=24?`${(Math.abs(selected.rotationHours)/24).toFixed(1)} d`:`${Math.abs(selected.rotationHours).toFixed(1)} h`} {selected.rotationHours<0&&<small>retrograde</small>}</strong></div></div><div className="planet-fact"><span>✳</span><p>{selected.fact}</p></div><button className="card-link" onClick={() => setView('planets')}>Explore {selected.name} <ArrowRight size={14} /></button>
          </motion.aside>}</AnimatePresence>
          <div className="scene-legend"><span><i className="legend-star" /> SUN</span><span><i className="legend-orbit" /> KEPLERIAN ORBIT</span><span><i className="legend-world" /> PLANET</span></div>
        </div>
        <div className="scene-controls"><div className="transport"><button onClick={() => setPaused(value => !value)} aria-label={paused?'Play simulation':'Pause simulation'}>{paused ? <Play size={15} fill="currentColor" /> : <Pause size={15} fill="currentColor" />}</button><span className="control-divider" /><button onClick={() => setSpeed(value => value >= 1000 ? 1 : value * 10)} className="speed-button" title="Simulation rate: simulated days per real second"><Zap size={14} /> {speed}× <ChevronDown size={13} /></button><span className="control-divider" /><span className="simulation-state"><span className={paused?'':'live-dot'} /> {paused ? 'PAUSED' : `${(2*speed).toLocaleString()} SIM DAYS / SEC`}</span></div><div className="scene-toggles"><button className={showOrbits?'toggle active':'toggle'} onClick={() => setShowOrbits(value => !value)} aria-pressed={showOrbits}><span className="toggle-dot" /> Orbits</button><button className={showAsteroids?'toggle active':'toggle'} onClick={() => setShowAsteroids(value => !value)} aria-pressed={showAsteroids}><span className="toggle-dot" /> Asteroids</button><button className={showLabels?'toggle active':'toggle'} onClick={() => setShowLabels(value => !value)} aria-pressed={showLabels}>Tags {showLabels?'On':'Off'}</button><button className={gravityMode?'toggle active':'toggle'} onClick={() => setGravityMode(value => !value)} aria-pressed={gravityMode}>Einstein view</button><button className="toggle" onClick={() => document.getElementById('moon-explorer')?.scrollIntoView({behavior:'smooth'})}><Plus size={14} /> Moons</button><button className="control-reset" onClick={() => { setPaused(false); setSpeed(1); setSelected(planets[2]); setShowPlanetCard(true); setSimulationDate('2026-09-28'); setFocusRequest(value => value + 1) }} aria-label="Reset simulation"><RotateCcw size={15} /></button></div></div>
      </div>
      <div className="explorer-footnote"><span>✳</span> Dates use JPL’s approximate Kepler elements (1800–2050 model); solar-system distances are proportional in AU. Planet and Sun radii are enlarged for visibility. <a href="#about">Model notes <ArrowUpRight size={12} /></a><span className="drag-hint"><span className="drag-icon">✥</span> DRAG TO ORBIT <span className="drag-sep">·</span> SCROLL TO ZOOM</span></div>
    </section>

    <section className="worlds-section section-wrap">
      <div className="section-heading compact"><div><div className="eyebrow"><span className="section-number">02</span> EIGHT DISTINCT WORLDS</div><h2>Find your <span>orbit.</span></h2></div><button className="text-button" onClick={() => setView('planets')}>All planets <ArrowRight size={15} /></button></div>
      <div className="planet-grid">{planets.map((p,i)=><button key={p.name} className={`planet-tile ${selected.name===p.name?'tile-active':''}`} onClick={()=>choosePlanet(p)}><div className="tile-top"><span>0{i+1}</span><ArrowUpRight size={15}/></div><div className={`tile-world world-${i}`} style={{'--planet-color':p.color} as React.CSSProperties}><span /></div><span className="tile-name">{p.name}</span><span className="tile-class">{p.type}</span><span className="tile-distance">{p.distance.toLocaleString()} <small>M KM</small></span></button>)}</div>
      <div className="planet-range"><span>THE INNER WORLDS</span><span className="range-line"><i /></span><span>THE OUTER GIANTS</span></div>
    </section>

    <section className="dwarf-section section-wrap" id="dwarf-planets"><div className="dwarf-heading"><div><div className="eyebrow"><span className="section-number">03</span> SMALL WORLDS, BIG STORIES</div><h2>Beyond the <span>eight.</span></h2></div><span className="dwarf-count">5 OFFICIALLY NAMED DWARF PLANETS</span></div><div className="dwarf-grid">{dwarfPlanets.map((body,index)=><article className="dwarf-card" key={body.name}><div className="dwarf-top"><span>0{index+1} / DWARF PLANET</span><span className="dwarf-region">{body.region}</span></div><div className="dwarf-orb" style={{'--dwarf-color':body.color} as React.CSSProperties}/><h3>{body.name}</h3><p>{body.fact}</p></article>)}</div><div className="belt-note"><span className="belt-dots">···</span><span>Pluto is part of the Kuiper Belt — a broad ring of icy bodies beyond Neptune.</span><a href="https://science.nasa.gov/solar-system/solar-system-facts/" target="_blank" rel="noreferrer">NASA Solar System facts <ArrowUpRight size={12}/></a></div></section>

    <section className="deep-dive section-wrap" id="moon-explorer">
      <div className="deep-copy"><div className="eyebrow"><span className="section-number">04</span> BEYOND THE PLANETS</div><h2>Worlds within<br /><span>worlds.</span></h2><p>Every planet has a story. Some have entire worlds of their own. Meet a few of the Solar System’s most extraordinary moons.</p><div className="moon-selector">{moons.slice(2,8).map(m=><button key={m.name} className={activeMoon===m.name?'moon-chip active':'moon-chip'} onClick={()=>setActiveMoon(m.name)}><span style={{background:m.color}} />{m.name}</button>)}</div><div className="moon-detail"><span className="moon-icon" style={{'--moon-color':moons.find(m=>m.name===activeMoon)?.color} as React.CSSProperties} /><div><span className="planet-type">{moons.find(m=>m.name===activeMoon)?.parent.toUpperCase()} MOON</span><strong>{activeMoon}</strong><small>{moons.find(m=>m.name===activeMoon)?.note}</small></div><ArrowUpRight size={16}/></div></div>
      <div className="moon-visual"><div className="moon-halo"/><div className="moon-orbit orbit-a"/><div className="moon-orbit orbit-b"/><div className="moon-body" style={{'--moon-color':moons.find(m=>m.name===activeMoon)?.color} as React.CSSProperties}/><div className="moon-ring-label"><span>MOON EXPLORER</span><i/> {moons.find(m=>m.name===activeMoon)?.parent.toUpperCase()}</div><span className="moon-coord">SAT / 06:18:42</span><div className="moon-visual-caption"><span>01 / 08</span><span>CURATED DISCOVERIES</span></div></div>
    </section>

    <section className="compare-section section-wrap"><div className="compare-intro"><div className="eyebrow"><span className="section-number">05</span> A DIFFERENT PERSPECTIVE</div><h2>Worlds apart.<br /><span>Side by side.</span></h2><p>How does a day on Mars compare to a day on Earth? Put two planets in perspective.</p><button className="text-button" onClick={()=>setView('compare')}>Open comparison lab <ArrowRight size={15}/></button></div><div className="compare-board"><div className="compare-board-head"><span>PLANETARY COMPARISON</span><span>RADIUS <i>·</i> KM</span></div><div className="compare-planet-head"><div className="compare-planet"><span className="compare-orb earth-orb"/>EARTH</div><span className="versus">VS</span><label className="compare-select"><span className="compare-orb" style={{background:compare.color}} /> <select value={compare.name} onChange={e=>setCompare(planets.find(p=>p.name===e.target.value)!)} aria-label="Choose planet to compare">{planets.filter(p=>p.name!=='Earth').map(p=><option key={p.name}>{p.name}</option>)}</select><ChevronDown size={13}/></label></div><div className="radius-bars"><div className="bar-row"><span>EARTH</span><div className="bar-track"><i style={{width:'100%',background:'#4d9ff5'}}/></div><strong>6,371</strong></div><div className="bar-row"><span>{compare.name.toUpperCase()}</span><div className="bar-track"><i style={{width:`${Math.max(5,Math.min(100,compare.radius/6371*100))}%`,background:compare.color}}/></div><strong>{compare.radius.toLocaleString()}</strong></div></div><div className="comparison-facts"><div><span>GRAVITY</span><strong>9.81 <i>vs</i> {compare.gravity}</strong><small>m/s²</small></div><div><span>DAY LENGTH</span><strong>23.9 <i>vs</i> {compare.day}</strong><small>Earth hours</small></div><div><span>ORBITAL YEAR</span><strong>365 <i>vs</i> {compare.period.toLocaleString()}</strong><small>Earth days</small></div></div><div className="compare-board-foot"><span>Planet sizes scaled by radius</span><button onClick={()=>setView('compare')}>COMPARE WORLDS <ArrowUpRight size={13}/></button></div></div></section>

    <section className="mission-section section-wrap"><div className="mission-heading"><div><div className="eyebrow"><span className="section-number">06</span> HUMANS, GOING PLACES</div><h2>Made of stardust.<br /><span>Built to explore.</span></h2></div><p>Robots have visited every planet. These are a few of the missions that changed how we see our corner of the universe.</p></div><div className="mission-list">{missions.map((m,i)=><button className="mission-row" key={m.name} onClick={()=>{setSelectedMission(m);document.getElementById('mission-route')?.scrollIntoView({behavior:'smooth'})}}><span className="mission-number">0{i+1}</span><span className="mission-name">{m.name}<small>{m.agency} <i>·</i> {m.year}</small></span><span className="mission-target">{m.target}</span><span className={m.status==='ACTIVE'?'mission-status':'mission-status complete'}><i/>{m.status}</span><ArrowUpRight className="mission-arrow" size={17}/></button>)}</div><div className="mission-cta"><span>There’s a whole universe of discovery out there.</span><button className="text-button" onClick={()=>setView('missions')}>Explore the missions <ArrowRight size={15}/></button></div></section>

    <section className="mission-route section-wrap" id="mission-route"><div className="route-copy"><div className="eyebrow"><span className="section-number">07</span> FOLLOW THE JOURNEY</div><h2>Out there,<br /><span>somewhere.</span></h2><p>Select a mission to trace its broad destination through our scaled Solar System view.</p><div className="route-picker">{missions.map(m=><button key={m.name} className={selectedMission.name===m.name?'route-choice active':'route-choice'} onClick={()=>setSelectedMission(m)}><span>{m.name}</span><small>{m.year}</small></button>)}</div></div><div className="trajectory-board"><div className="trajectory-head"><span>MISSION TRAJECTORY / SCHEMATIC</span><span className="mission-status"><i/>{selectedMission.status}</span></div><div className="trajectory-map"><div className="trajectory-glow"/><svg viewBox="0 0 600 230" role="img" aria-label={`${selectedMission.name} mission trajectory schematic`}><path className="trajectory-orbit" d="M36 159 C142 55 183 205 290 121 S446 31 560 80"/><path id="missionPath" className="trajectory-path" d="M36 159 C142 55 183 205 290 121 S446 31 560 80"/><circle className="trajectory-sun" cx="36" cy="159" r="9"/><circle className="route-world" cx="140" cy="96" r="4"/><circle className="route-world" cx="290" cy="121" r="5"/><circle className="route-world" cx="424" cy="48" r="6"/><circle className="route-destination" cx="560" cy="80" r="7"/><circle className="trajectory-craft" r="4"><animateMotion dur="18s" repeatCount="indefinite"><mpath href="#missionPath"/></animateMotion></circle></svg><span className="route-label route-sun">SUN</span><span className="route-label route-earth">EARTH</span><span className="route-label route-mars">MARS</span><span className="route-label route-jupiter">JUPITER</span><span className="route-label route-end">{selectedMission.target.toUpperCase()}</span><span className="route-date">LAUNCHED {selectedMission.year} <i>·</i> PATH NOT TO SCALE</span></div><div className="trajectory-foot"><strong>{selectedMission.name}</strong><span>{selectedMission.detail}</span><ArrowUpRight size={15}/></div></div></section>

    <section className="system-stats section-wrap"><div className="eyebrow"><span className="section-number">08</span> OUR COSMIC NEIGHBORHOOD</div><div className="stats-heading"><h2>Small corner.<br /><span>Big numbers.</span></h2><p>A few facts to help put home in perspective.<br />Counts change as astronomers make new discoveries.</p></div><div className="stats-grid"><div><span>01 / PLANETS</span><strong>8</strong><small>worlds in orbit around our Sun</small></div><div><span>02 / DWARF PLANETS</span><strong>5</strong><small>officially named by the IAU</small></div><div><span>03 / KNOWN MOONS</span><strong>891+</strong><small>NASA baseline published Mar 2025</small></div><div><span>04 / AGE</span><strong>4.6 <i>B</i></strong><small>years since the Solar System formed</small></div></div></section>

    <section className="learn-section section-wrap"><div className="learn-copy"><div className="eyebrow"><span className="section-number">09</span> A LITTLE COSMIC CURIOSITY</div><h2>Quick trip<br />to the <span>quiz.</span></h2><p>One question. One small step for your brain.</p><div className="quiz-question"><span className="planet-type">QUESTION 01 <i>·</i> PLANETARY SCIENCE</span><strong>Which planet has the shortest year?</strong><div className="quiz-options">{['Mercury','Venus','Mars','Earth'].map(letter=><button key={letter} className={`quiz-option ${quizAnswer===letter?(letter==='Mercury'?'correct':'incorrect'):''}`} onClick={()=>setQuizAnswer(letter)}><span>{String.fromCharCode(65+['Mercury','Venus','Mars','Earth'].indexOf(letter))}</span>{letter}{quizAnswer===letter&&(letter==='Mercury'?<Check size={15}/>:<X size={15}/>)}</button>)}</div>{quizAnswer&&<p className={quizAnswer==='Mercury'?'quiz-feedback correct-text':'quiz-feedback'}>{quizAnswer==='Mercury'?'Correct. Mercury completes one orbit in just 88 Earth days.':'Not quite. The answer is Mercury — a year there lasts only 88 Earth days.'}</p>}</div><div className="learn-facts"><span className="planet-type">LEARN MODE / QUICK ANSWERS</span>{explainers.map((item,index)=><div className="learn-fact" key={item.question}><button onClick={()=>setOpenExplainer(openExplainer===index?-1:index)} aria-expanded={openExplainer===index}>{item.question}<ChevronDown size={14}/></button>{openExplainer===index&&<p>{item.answer}</p>}</div>)}</div></div><div className="calculator-card"><div className="calc-head"><span className="planet-type">A CHANGE IN PERSPECTIVE</span><span className="calc-icon"><Zap size={16}/></span></div><h3>What if you lived<br />on another world?</h3><p>Your weight changes with gravity. Your birthday comes around faster — or slower.</p><label className="weight-label" htmlFor="weight">YOUR EARTH WEIGHT <span>KG</span></label><div className="weight-input"><input id="weight" type="number" min="1" max="500" value={weight} onChange={e=>setWeight(e.target.value)}/><span>KG</span></div><div className="weight-results">{[planets[3],planets[4],planets[1]].map(p=><div key={p.name}><span className="result-dot" style={{background:p.color}}/>{p.name}<strong>{((Number(weight)||0)*p.gravity/9.81).toFixed(1)} <small>kg</small></strong></div>)}</div><label className="weight-label age-label" htmlFor="age">YOUR EARTH AGE <span>YEARS</span></label><div className="weight-input"><input id="age" type="number" min="1" max="120" value={age} onChange={e=>setAge(e.target.value)}/><span>YEARS</span></div><div className="age-result"><span>MARS YEARS</span><strong>{((Number(age)||0)*365/planets[3].period).toFixed(1)}</strong><small>A Mars year is 687 Earth days</small></div><span className="calc-footnote">ESTIMATES USE MEAN SURFACE GRAVITY AND ORBITAL PERIOD</span></div></section>

    <section className="closing section-wrap"><div className="closing-orbit"/><span className="closing-star">✦</span><div className="eyebrow"><span className="live-dot"/> YOUR UNIVERSE IS READY</div><h2>Curiosity looks<br /><span>good on you.</span></h2><p>Start with a planet. Stay for the perspective.</p><button className="primary-button" onClick={()=>{setView('explore');document.getElementById('observatory')?.scrollIntoView({behavior:'smooth'})}}>Back to the observatory <ArrowUpRight size={16}/></button><span className="closing-coordinate">40° 43' 55.3&quot; N &nbsp; 73° 59' 11.4&quot; W &nbsp; / &nbsp; PLANET EARTH</span></section>

    {view!=='explore'&&<div className="view-drawer"><div className="drawer-head"><div><span className="planet-type">HELIOS / FIELD NOTES</span><h2>{view==='planets'?'Planet index':view==='missions'?'Mission archive':'Comparison lab'}</h2></div><button className="icon-btn" onClick={()=>setView('explore')} aria-label="Close"><X size={18}/></button></div>{view==='planets'?<div className="drawer-planet-list">{planets.map(p=><button key={p.name} onClick={()=>choosePlanet(p)}><span className="drawer-orb" style={{background:p.color}}/><span><strong>{p.name}</strong><small>{p.type} · {formatDistance(p.distance)}</small></span><ArrowUpRight size={15}/></button>)}</div>:view==='missions'?<div className="drawer-missions">{missions.map(m=><article key={m.name}><span className="planet-type">{m.year} / {m.agency}</span><h3>{m.name}</h3><p>{m.detail}</p><div><span>TARGET</span><strong>{m.target}</strong><span className="mission-status"><i/>{m.status}</span></div></article>)}</div>:<div className="drawer-compare"><p>Choose two worlds to compare their size, gravity, day length, and orbit.</p><div className="drawer-pickers"><label>WORLD A<select value={selected.name} onChange={e=>setSelected(planets.find(p=>p.name===e.target.value)!)}>{planets.map(p=><option key={p.name}>{p.name}</option>)}</select></label><span>VS</span><label>WORLD B<select value={compare.name} onChange={e=>setCompare(planets.find(p=>p.name===e.target.value)!)}>{planets.map(p=><option key={p.name}>{p.name}</option>)}</select></label></div><div className="drawer-stat-grid">{[['Radius',`${selected.radius.toLocaleString()} km`,`${compare.radius.toLocaleString()} km`],['Gravity',`${selected.gravity} m/s²`,`${compare.gravity} m/s²`],['Day',selected.day,compare.day],['Year',`${selected.period.toLocaleString()} d`,`${compare.period.toLocaleString()} d`],['Moons',String(selected.moons),String(compare.moons)]].map(row=><div key={row[0]}><span>{row[0]}</span><strong>{row[1]}</strong><strong>{row[2]}</strong></div>)}</div></div>}</div>}

    <footer id="about"><div className="footer-main"><a className="brand" href="#top"><span className="brand-mark"><Orbit size={17}/></span><span>helios<span className="brand-dot">.</span></span></a><p>A small observatory for our<br />remarkable cosmic neighborhood.</p><a className="source-link" href="https://science.nasa.gov/solar-system/" target="_blank" rel="noreferrer">Built with NASA Solar System data <ArrowUpRight size={13}/></a></div><div className="footer-meta"><span>PLANETARY FACTS SOURCED FROM NASA / JPL <CircleHelp size={12}/></span><span>JPL APPROXIMATE PLANETARY POSITIONS / KEPLER SOLVER</span><span>DESIGNED ON PLANET EARTH <span className="earth-symbol">◉</span></span></div><div className="footer-bottom"><span>© 2026 HELIOS OBSERVATORY</span><span>DEVELOPED BY KRISHNA MANDAL</span><button onClick={()=>window.scrollTo({top:0,behavior:'smooth'})}>BACK TO TOP <ArrowUpRight size={12}/></button></div></footer>
  </main>
}

export default App
