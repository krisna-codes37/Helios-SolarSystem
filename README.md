# Helios — Solar System Observatory

Explore our cosmic neighborhood through a responsive, interactive 3D solar system. Select planets, watch their orbits, compare planetary facts, browse notable moons and missions, and try a short science quiz.

## Run locally

```bash
npm install
npm run dev
```

Create and preview a production build with:

```bash
npm run build
npm run preview
```

## Features

- React, TypeScript, Vite, Three.js, React Three Fiber, and Drei
- Interactive Sun, eight planets, orbit paths, starfield, Saturn's rings, and Earth's atmospheric glow
- JPL approximate planetary positions from date-dependent Keplerian elements: elliptical paths, changing orbital speed, eccentricity, inclination, AU-based semimajor axes, and sidereal spin rates (including retrograde rotation)
- Full-screen 3D controls, optional planet tags, synthesized interface sounds, and a spacetime-curvature teaching view
- An instanced asteroid belt, five named dwarf planets, and a selected-world focus transition
- Orbit controls, simulation pause, speed controls, date stepping, and visual size comparison
- Searchable planet, moon, dwarf planet, and mission index
- Planet facts, side-by-side comparison, and gravity-based weight calculator
- Curated moon explorer, mission archive, schematic trajectories, and an interactive quiz
- Short explainers for common Solar System questions and an orbital-age calculator
- Solar System statistics with a dated moon-count baseline
- Responsive mobile layouts, reduced-motion support, and keyboard-accessible controls
- No API key or backend required; astronomy facts are bundled as static data

## Visualization notes

Planet distances use AU-based semimajor axes and are kept in the correct relative proportions. Planet and Sun radii are enlarged so they remain visible at system scale; the “Relative” size option preserves planet-to-planet radius ratios. Positions use JPL's approximate Keplerian elements and corrections, which are useful within their published date range but are less accurate than a full JPL Horizons ephemeris. The asteroid belt is an illustrative, simplified population. The Einstein view bends a 2D grid as a teaching analogy; it is not a literal model of four-dimensional spacetime. Mission trajectories remain schematic. Moon counts change as discoveries are confirmed. The 891+ system-wide count is NASA's baseline published March 25, 2025; per-planet giant-moon counts reflect NASA pages updated in August 2026.

## Sources

- [NASA Solar System facts](https://science.nasa.gov/solar-system/solar-system-facts/)
- [NASA moons: facts](https://science.nasa.gov/solar-system/moons/facts/)
- [NASA Jupiter moons](https://science.nasa.gov/jupiter/moons/)
- [NASA Saturn moons](https://science.nasa.gov/saturn/moons/)
- [NASA Uranus moons](https://science.nasa.gov/uranus/moons/)
- [NASA Neptune moons](https://science.nasa.gov/neptune/moons/)
- [JPL approximate positions of the planets](https://ssd.jpl.nasa.gov/planets/approx_pos.html)
- [JPL Horizons ephemerides](https://ssd.jpl.nasa.gov/horizons/)
- [NASA: Orbits and Kepler's laws](https://science.nasa.gov/solar-system/orbits-and-keplers-laws/)
- [NASA Goddard planetary fact sheet](https://nssdc.gsfc.nasa.gov/planetary/factsheet/)

## Deploy

Import this repository into Vercel and use the default Vite settings. The production output is generated in `dist/`.
