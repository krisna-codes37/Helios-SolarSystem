import { Canvas, useFrame } from '@react-three/fiber'
import { Stars, OrbitControls, Html } from '@react-three/drei'
import { AnimatePresence, motion } from 'framer-motion'
import { ArrowDown, ArrowRight, ArrowUpRight, Check, ChevronDown, CircleHelp, Github, Globe2, Menu, Pause, Play, Plus, RotateCcw, Search, Sun, X, Zap } from 'lucide-react'
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

function PlanetMesh({ planet, index, selected, onSelect, speed, paused, showOrbits, compareScale, dateOffsetDays }: { planet: Planet; index: number; selected: boolean; onSelect: () => void; speed: number; paused: boolean; showOrbits: boolean; compareScale: boolean; dateOffsetDays: number }) {
  const ref = useRef<THREE.Mesh>(null)
  const angle = useRef(index * 0.75)
  const orbit = 1.45 + index * 0.59
  const size = compareScale
    ? Math.cbrt(planet.radius / 6371) * 0.16
    : [0.105, 0.15, 0.16, 0.13, 0.47, 0.39, 0.29, 0.27][index]
  useEffect(() => {
    angle.current = index * 0.75 + (dateOffsetDays / planet.period) * Math.PI * 2
  }, [dateOffsetDays, index, planet.period])
  useFrame((_, delta) => {
    if (!paused) angle.current += delta * speed * (0.16 / (1 + index * 0.37))
    if (ref.current) {
      ref.current.position.set(Math.cos(angle.current) * orbit, 0, Math.sin(angle.current) * orbit)
      ref.current.rotation.y += delta * 0.12
    }
  })
  return <>
    {showOrbits && <mesh rotation-x={-Math.PI / 2} position={[0, -0.06, 0]}>
      <ringGeometry args={[orbit - 0.003, orbit + 0.003, 160]} />
      <meshBasicMaterial color={selected ? '#d8b98a' : '#536174'} transparent opacity={selected ? 0.37 : 0.19} side={THREE.DoubleSide} />
    </mesh>}
    <mesh ref={ref} onClick={(e) => { e.stopPropagation(); onSelect() }}>
      <sphereGeometry args={[size, 40, 40]} />
      <meshStandardMaterial color={planet.color} roughness={planet.name === 'Earth' ? 0.58 : 0.84} metalness={0.04} emissive={planet.color} emissiveIntensity={selected ? 0.25 : 0.035} />
      {planet.name === 'Saturn' && <mesh rotation-x={-Math.PI / 2.5}>
        <ringGeometry args={[size * 1.32, size * 2.2, 72]} />
        <meshStandardMaterial color="#d3bd93" transparent opacity={0.76} side={THREE.DoubleSide} />
      </mesh>}
      {planet.name === 'Earth' && <mesh scale={1.12}>
        <sphereGeometry args={[size, 32, 32]} /><meshBasicMaterial color="#6cbaff" transparent opacity={0.12} side={THREE.BackSide} />
      </mesh>}
      <Html distanceFactor={12} position={[0, size + 0.12, 0]} center>
        <button className={`planet-label ${selected ? 'is-selected' : ''}`} onClick={(e) => { e.stopPropagation(); onSelect() }}>{planet.name}</button>
      </Html>
    </mesh>
  </>
}

function CameraFocus({ selected, speed, paused, controls, dateOffsetDays }: { selected: Planet; speed: number; paused: boolean; controls: React.RefObject<OrbitControlsImpl | null>; dateOffsetDays: number }) {
  const elapsed = useRef(0)
  const previous = useRef(selected.name)
  const previousDate = useRef(dateOffsetDays)
  const moving = useRef(false)
  const focus = useRef(new THREE.Vector3())
  const destination = useRef(new THREE.Vector3())
  const offset = new THREE.Vector3(0, 2.7, 3.2)
  useEffect(() => {
    if (previous.current !== selected.name || previousDate.current !== dateOffsetDays) moving.current = true
    previous.current = selected.name
    previousDate.current = dateOffsetDays
  }, [selected.name, dateOffsetDays])
  useFrame(({ camera }, delta) => {
    if (!moving.current) return
    if (!paused) elapsed.current += delta * speed
    const index = planets.findIndex((planet) => planet.name === selected.name)
    const radius = 1.45 + index * 0.59
    const angle = index * 0.75 + (dateOffsetDays / selected.period) * Math.PI * 2 + elapsed.current * (0.16 / (1 + index * 0.37))
    focus.current.set(Math.cos(angle) * radius, 0, Math.sin(angle) * radius)
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

function AsteroidBelt() {
  const mesh = useRef<THREE.InstancedMesh>(null)
  const asteroids = useMemo(() => Array.from({ length: 520 }, (_, i) => {
    const random = (seed: number) => {
      const value = Math.sin(seed * 127.1 + 311.7) * 43758.5453
      return value - Math.floor(value)
    }
    const angle = random(i + 1) * Math.PI * 2
    const radius = 3.38 + random(i + 521) * 0.31
    const size = 0.009 + random(i + 1041) * 0.021
    return { x: Math.cos(angle) * radius, y: (random(i + 1561) - 0.5) * 0.16, z: Math.sin(angle) * radius, size }
  }), [])
  useEffect(() => {
    if (!mesh.current) return
    const dummy = new THREE.Object3D()
    asteroids.forEach((asteroid, index) => {
      dummy.position.set(asteroid.x, asteroid.y, asteroid.z)
      dummy.scale.setScalar(asteroid.size)
      dummy.updateMatrix()
      mesh.current!.setMatrixAt(index, dummy.matrix)
    })
    mesh.current.instanceMatrix.needsUpdate = true
  }, [asteroids])
  return <instancedMesh ref={mesh} args={[undefined, undefined, asteroids.length]}>
    <dodecahedronGeometry args={[1, 0]} />
    <meshStandardMaterial color="#9d9182" roughness={1} />
  </instancedMesh>
}

function SolarScene({ selected, setSelected, speed, paused, showOrbits, showAsteroids, compareScale, dateOffsetDays }: { selected: Planet; setSelected: (planet: Planet) => void; speed: number; paused: boolean; showOrbits: boolean; showAsteroids: boolean; compareScale: boolean; dateOffsetDays: number }) {
  const controls = useRef<OrbitControlsImpl | null>(null)
  return <Canvas camera={{ position: [0, 12, 19], fov: 38 }} dpr={[1, 1.55]} gl={{ antialias: true, alpha: true }}>
    <color attach="background" args={['#080b12']} />
    <fog attach="fog" args={['#080b12', 22, 42]} />
    <ambientLight intensity={0.3} /><pointLight position={[0, 0, 0]} intensity={150} color="#ffbf67" distance={23} decay={1.65} />
    <Stars radius={90} depth={55} count={2100} factor={3.2} saturation={0.1} fade speed={0.25} />
    <mesh>
      <sphereGeometry args={[0.49, 48, 48]} />
      <meshBasicMaterial color="#ffc977" />
    </mesh>
    <mesh><sphereGeometry args={[0.64, 32, 32]} /><meshBasicMaterial color="#ffac49" transparent opacity={0.08} side={THREE.BackSide} /></mesh>
    {showAsteroids && <AsteroidBelt />}
    {planets.map((p, i) => <PlanetMesh key={p.name} planet={p} index={i} selected={selected.name === p.name} onSelect={() => setSelected(p)} speed={speed} paused={paused} showOrbits={showOrbits} compareScale={compareScale} dateOffsetDays={dateOffsetDays} />)}
    <OrbitControls ref={controls} makeDefault enablePan={false} minDistance={2.5} maxDistance={30} minPolarAngle={0.45} maxPolarAngle={1.47} rotateSpeed={0.38} zoomSpeed={0.75} />
    <CameraFocus selected={selected} speed={speed} paused={paused} controls={controls} dateOffsetDays={dateOffsetDays} />
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
  useEffect(() => {
    const onShortcut = (event: KeyboardEvent) => {
      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === 'k') {
        event.preventDefault()
        setSearchOpen(true)
      }
      if (event.key === 'Escape') {
        setSearchOpen(false)
        setMobileMenu(false)
      }
    }
    document.addEventListener('keydown', onShortcut)
    return () => document.removeEventListener('keydown', onShortcut)
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
    if (result.planet) choosePlanet(result.planet)
    if (result.kind === 'MISSION') setView('missions')
  }
  const moveSimulationDate = (days: number) => setSimulationDate(current => {
    const next = new Date(`${current}T12:00:00`)
    next.setDate(next.getDate() + days)
    return next.toISOString().slice(0, 10)
  })
  const formattedSimulationDate = new Date(`${simulationDate}T12:00:00`).toLocaleDateString('en-US', { month: 'short', day: '2-digit', year: 'numeric' }).toUpperCase()
  const dateOffsetDays = (new Date(`${simulationDate}T12:00:00`).getTime() - new Date('2026-09-28T12:00:00').getTime()) / 86_400_000
  return <main className="app-shell">
    <header className="topbar">
      <a className="brand" href="#top" onClick={() => setView('explore')} aria-label="Helios home"><span className="brand-mark"><Sun size={18} /></span><span>helios<span className="brand-dot">.</span></span></a>
      <nav className={mobileMenu ? 'nav-links nav-open' : 'nav-links'} aria-label="Main navigation">
        {(['explore','planets','missions','compare'] as View[]).map(item => <button key={item} onClick={() => { setView(item); setMobileMenu(false) }} className={view === item ? 'nav-item active' : 'nav-item'}>{item === 'explore' ? 'Explore' : item === 'planets' ? 'Planets' : item === 'missions' ? 'Missions' : 'Compare'}{view === item && <span className="nav-indicator" />}</button>)}
      </nav>
      <div className="top-actions"><button className="icon-btn search-trigger" onClick={() => setSearchOpen(!searchOpen)} aria-label="Search the Solar System"><Search size={16} /><span>Search</span><kbd>⌘ K</kbd></button><span className="top-divider" /><button className="icon-btn mobile-menu" onClick={() => setMobileMenu(!mobileMenu)} aria-label="Toggle menu">{mobileMenu ? <X size={19} /> : <Menu size={19} />}</button><a className="github-link" href="https://github.com/krisna-codes37/Helios-SolarSystem" target="_blank" rel="noreferrer" aria-label="GitHub repository"><Github size={17} /></a></div>
    </header>

    <AnimatePresence>{searchOpen && <motion.div className="search-popover" initial={{ opacity: 0, y: -7 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -7 }}>
      <div className="search-input-wrap"><Search size={17} /><input autoFocus value={query} onChange={e => setQuery(e.target.value)} placeholder="Search planets, moons, missions..." onKeyDown={e => { if (e.key === 'Enter' && visibleResults[0]) chooseSearchResult(visibleResults[0]) }} /><kbd>ESC</kbd><button className="bare-icon" onClick={() => setSearchOpen(false)}><X size={16} /></button></div>
      <div className="search-results">{(query ? visibleResults : [{name:'Earth',kind:'PLANET',planet:planets[2]},{name:'Mars',kind:'PLANET',planet:planets[3]},{name:'Europa',kind:'MOON',planet:planets[4]}]).map(result => <button key={result.name} onClick={() => chooseSearchResult(result)}><span className="result-orb" style={{background:result.planet?.color ?? '#b8ac9d'}} /><span>{result.name}<small>{result.planet?.type.toLowerCase() ?? 'dwarf planet'} · {result.kind.toLowerCase()}</small></span><ArrowUpRight size={15} /></button>)}{query && visibleResults.length === 0 && <p className="empty-result">No matches. Try a planet, moon, or mission.</p>}</div>
    </motion.div>}</AnimatePresence>

    <section className="hero" id="top">
      <div className="hero-copy"><div className="eyebrow"><span className="live-dot" /> SOLAR SYSTEM OBSERVATORY <span className="eyebrow-line" /></div><h1>Space,<br /><span>within reach.</span></h1><p>Eight planets. One star. Countless stories.<br className="desktop-break" /> Your front-row seat to the Solar System.</p><div className="hero-actions"><button className="primary-button" onClick={() => { setView('explore'); document.getElementById('observatory')?.scrollIntoView({behavior:'smooth'}) }}>Explore the system <ArrowRight size={16} /></button><button className="text-button" onClick={() => setView('planets')}>Meet the planets <ArrowUpRight size={15} /></button></div><div className="hero-note"><span className="note-icon"><Globe2 size={15} /></span><span>Our cosmic neighborhood, <strong>made explorable.</strong></span></div></div>
      <div className="hero-art" aria-hidden="true"><div className="hero-glow" /><div className="hero-planet" /><div className="hero-ring ring-one" /><div className="hero-ring ring-two" /><span className="hero-star s1">✦</span><span className="hero-star s2">·</span><span className="hero-star s3">✧</span><span className="hero-star s4">·</span><span className="hero-star s5">✦</span><span className="hero-label label-one">EARTH<br /><small>149.6M KM</small></span><span className="hero-label label-two">SATURN<br /><small>1.4B KM</small></span><span className="hero-coordinate">SOL / 00:00:01</span></div>
    </section>

    <section className="stat-strip" aria-label="Solar System facts"><div><span className="stat-index">01</span><strong>8</strong><span>planets</span></div><div><span className="stat-index">02</span><strong>1</strong><span>star, our Sun</span></div><div><span className="stat-index">03</span><strong>891+</strong><span>known moons</span></div><div className="stat-caption"><span className="live-dot" /> A LOT TO EXPLORE <ArrowDown size={14} /></div></section>

    <section className="observatory section-wrap" id="observatory">
      <div className="section-heading"><div><div className="eyebrow"><span className="section-number">01</span> YOUR WINDOW TO THE COSMOS</div><h2>The Solar System,<br /><span>in motion.</span></h2></div><p>Pick a world. Follow its orbit.<br />See our neighborhood differently.</p></div>
      <div className="explorer-shell">
        <div className="explorer-topline"><div className="window-dots"><i /><i /><i /></div><div className="scene-title"><span className="live-dot" /> LIVE SIMULATION <span className="scene-separator">/</span> HELIOCENTRIC VIEW</div><button className="scene-expand" aria-label="Reset camera" onClick={() => setSelected(planets[2])}><RotateCcw size={15} /></button></div>
        <div className="scene-content" style={{'--scene-display':showOrbits ? 'block' : 'none'} as React.CSSProperties}>
          <div className="scene-backdrop-grid" /><div className="scene-vignette" />
          <div className="scene-canvas"><Suspense fallback={<div className="canvas-fallback">Preparing the observatory…</div>}><SolarScene selected={selected} setSelected={setSelected} speed={speed} paused={paused} showOrbits={showOrbits} showAsteroids={showAsteroids} compareScale={compareScale} dateOffsetDays={dateOffsetDays} /></Suspense></div>
          <div className="scene-axis axis-x" /><div className="scene-axis axis-y" />
          <div className="scene-coordinate"><span>SIMULATION DATE</span><strong>{formattedSimulationDate}</strong><div className="date-controls"><button onClick={() => moveSimulationDate(-1)} aria-label="Previous day">−1 D</button><button onClick={() => setSimulationDate('2026-09-28')}>TODAY</button><button onClick={() => moveSimulationDate(1)} aria-label="Next day">+1 D</button></div><small>J2000 · HELIOCENTRIC</small></div>
          <div className="scene-scale"><span>SCENE SCALE</span><button className={compareScale?'scale-pill':'scale-pill active'} onClick={() => setCompareScale(false)} title="Distances are compressed for readability">Explore</button><button className={compareScale?'scale-pill active':'scale-pill'} onClick={() => setCompareScale(true)} title="Planet sizes are adjusted to be easier to compare">Compare sizes</button></div>
          <AnimatePresence mode="wait">{showPlanetCard && <motion.aside className="planet-card" key={selected.name} initial={{opacity:0,x:14}} animate={{opacity:1,x:0}} exit={{opacity:0,x:8}} transition={{duration:.22}}>
            <div className="card-kicker"><span className="live-dot" /> SELECTED WORLD <button className="bare-icon" aria-label="Close details" onClick={() => setShowPlanetCard(false)}><X size={14} /></button></div><div className="planet-card-title"><span className="mini-planet" style={{background:selected.color}} /><div><span className="planet-type">{selected.type}</span><h3>{selected.name}</h3></div><ArrowUpRight size={15} /></div><p className="planet-desc">{selected.description}</p>
            <div className="planet-metrics"><div><span>FROM THE SUN</span><strong>{formatDistance(selected.distance)}</strong></div><div><span>ORBITAL PERIOD</span><strong>{selected.period.toLocaleString()} <small>days</small></strong></div><div><span>RADIUS</span><strong>{selected.radius.toLocaleString()} <small>km</small></strong></div><div><span>KNOWN MOONS</span><strong>{selected.moons}</strong></div></div><div className="planet-fact"><span>✳</span><p>{selected.fact}</p></div><button className="card-link" onClick={() => setView('planets')}>Explore {selected.name} <ArrowRight size={14} /></button>
          </motion.aside>}</AnimatePresence>
          <div className="scene-legend"><span><i className="legend-star" /> STAR</span><span><i className="legend-orbit" /> ORBIT</span><span><i className="legend-world" /> PLANET</span></div>
        </div>
        <div className="scene-controls"><div className="transport"><button onClick={() => setPaused(!paused)} aria-label={paused?'Play simulation':'Pause simulation'}>{paused ? <Play size={15} fill="currentColor" /> : <Pause size={15} fill="currentColor" />}</button><span className="control-divider" /><button onClick={() => setSpeed(speed >= 10 ? 1 : speed * 2)} className="speed-button"><Zap size={14} /> {speed}× <ChevronDown size={13} /></button><span className="control-divider" /><span className="simulation-state"><span className="live-dot" /> {paused ? 'PAUSED' : 'RUNNING'}</span></div><div className="scene-toggles"><button className={showOrbits?'toggle active':'toggle'} onClick={() => setShowOrbits(!showOrbits)}><span className="toggle-dot" /> Orbits</button><button className={showAsteroids?'toggle active':'toggle'} onClick={() => setShowAsteroids(!showAsteroids)}><span className="toggle-dot" /> Asteroids</button><button className="toggle" onClick={() => document.getElementById('moon-explorer')?.scrollIntoView({behavior:'smooth'})}><Plus size={14} /> Moons</button><button className="control-reset" onClick={() => { setPaused(false); setSpeed(1); setSelected(planets[2]); setShowPlanetCard(true); setSimulationDate('2026-09-28') }} aria-label="Reset simulation"><RotateCcw size={15} /></button></div></div>
      </div>
      <div className="explorer-footnote"><span>✳</span> Distances and sizes are scaled for exploration. <a href="#about">Learn about our scale <ArrowUpRight size={12} /></a><span className="drag-hint"><span className="drag-icon">✥</span> DRAG TO ORBIT <span className="drag-sep">·</span> SCROLL TO ZOOM</span></div>
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

    <footer id="about"><div className="footer-main"><a className="brand" href="#top"><span className="brand-mark"><Sun size={17}/></span><span>helios<span className="brand-dot">.</span></span></a><p>A small observatory for our<br />remarkable cosmic neighborhood.</p><a className="source-link" href="https://science.nasa.gov/solar-system/" target="_blank" rel="noreferrer">Built with NASA Solar System data <ArrowUpRight size={13}/></a></div><div className="footer-meta"><span>PLANETARY FACTS SOURCED FROM NASA / JPL <CircleHelp size={12}/></span><span>VISUAL SCALE IS APPROXIMATED FOR CLARITY</span><span>DESIGNED ON PLANET EARTH <span className="earth-symbol">◉</span></span></div><div className="footer-bottom"><span>© 2026 HELIOS OBSERVATORY</span><span>MADE FOR THE CURIOUS <span className="footer-spark">✳</span></span><button onClick={()=>window.scrollTo({top:0,behavior:'smooth'})}>BACK TO TOP <ArrowUpRight size={12}/></button></div></footer>
  </main>
}

export default App
