export type Planet = {
  name: string; type: string; color: string; radius: number; distance: number; period: number;
  day: string; gravity: number; temperature: string; moons: number; description: string; fact: string;
  eccentricity: number; inclination: number; semiMajorAU: number; meanLongitude: number; longitudePerihelion: number; ascendingNode: number;
  rotationHours: number; axialTilt: number;
  elementRates: { a: number; e: number; i: number; L: number; perihelion: number; node: number };
}

export const planets: Planet[] = [
  { name:'Mercury', type:'TERRESTRIAL', color:'#b7a795', radius:2439.7, distance:57.9, period:87.97, day:'58.6 d', gravity:3.7, temperature:'167°C', moons:0, eccentricity:.20563593, inclination:7.00497902, semiMajorAU:.38709927, meanLongitude:252.2503235, longitudePerihelion:77.45779628, ascendingNode:48.33076593, rotationHours:1407.6, axialTilt:.034, elementRates:{a:.00000037,e:.00001906,i:-.00594749,L:149472.67411175,perihelion:.16047689,node:-.12534081}, description:'A small, cratered world racing around the Sun every 88 Earth days.', fact:'Mercury has ice inside permanently shadowed craters near its poles.' },
  { name:'Venus', type:'TERRESTRIAL', color:'#dfaa73', radius:6051.8, distance:108.2, period:224.7, day:'243 d', gravity:8.87, temperature:'464°C', moons:0, eccentricity:.00677672, inclination:3.39467605, semiMajorAU:.72333566, meanLongitude:181.9790995, longitudePerihelion:131.60246718, ascendingNode:76.67984255, rotationHours:-5832.5, axialTilt:177.4, elementRates:{a:.0000039,e:-.00004107,i:-.0007889,L:58517.81538729,perihelion:.00268329,node:-.27769418}, description:'A volcanic world wrapped in a dense atmosphere of carbon dioxide.', fact:'Venus rotates in the opposite direction to most planets.' },
  { name:'Earth', type:'TERRESTRIAL', color:'#4d9ff5', radius:6371, distance:149.6, period:365.256, day:'23.9 h', gravity:9.81, temperature:'15°C', moons:1, eccentricity:.01671123, inclination:-.00001531, semiMajorAU:1.00000261, meanLongitude:100.46457166, longitudePerihelion:102.93768193, ascendingNode:0, rotationHours:23.9345, axialTilt:23.44, elementRates:{a:.00000562,e:-.00004392,i:-.01294668,L:35999.37244981,perihelion:.32327364,node:0}, description:'Our pale blue home: the only world we know to harbor life.', fact:'Earth is the only planet not named after a Roman or Greek deity.' },
  { name:'Mars', type:'TERRESTRIAL', color:'#d56d4d', radius:3389.5, distance:227.9, period:686.98, day:'24.6 h', gravity:3.71, temperature:'−65°C', moons:2, eccentricity:.0933941, inclination:1.84969142, semiMajorAU:1.52371034, meanLongitude:-4.55343205, longitudePerihelion:-23.94362959, ascendingNode:49.55953891, rotationHours:24.6229, axialTilt:25.19, elementRates:{a:.00001847,e:.00007882,i:-.00813131,L:19140.30268499,perihelion:.44441088,node:-.29257343}, description:'A cold desert with ancient river valleys, towering volcanoes, and two tiny moons.', fact:'Olympus Mons is nearly three times taller than Mount Everest.' },
  { name:'Jupiter', type:'GAS GIANT', color:'#d5a77d', radius:69911, distance:778.6, period:4332.6, day:'9.9 h', gravity:24.79, temperature:'−110°C', moons:115, eccentricity:.04838624, inclination:1.30439695, semiMajorAU:5.202887, meanLongitude:34.39644051, longitudePerihelion:14.72847983, ascendingNode:100.47390909, rotationHours:9.925, axialTilt:3.13, elementRates:{a:-.00011607,e:-.00013253,i:-.00183714,L:3034.74612775,perihelion:.21252668,node:.20469106}, description:'A giant world of cloud bands, powerful storms, and a family of remarkable moons.', fact:'The Great Red Spot is a storm that has raged for centuries.' },
  { name:'Saturn', type:'GAS GIANT', color:'#e5c987', radius:58232, distance:1433.5, period:10759, day:'10.7 h', gravity:10.44, temperature:'−140°C', moons:293, eccentricity:.05386179, inclination:2.48599187, semiMajorAU:9.53667594, meanLongitude:49.95424423, longitudePerihelion:92.59887831, ascendingNode:113.66242448, rotationHours:10.656, axialTilt:26.73, elementRates:{a:-.0012506,e:-.00050991,i:.00193609,L:1222.49362201,perihelion:-.41897216,node:-.28867794}, description:'A gas giant surrounded by a spectacular system of icy rings.', fact:'Saturn’s rings are mostly water ice, from tiny grains to house-sized chunks.' },
  { name:'Uranus', type:'ICE GIANT', color:'#83c9d0', radius:25362, distance:2872.5, period:30687, day:'17.2 h', gravity:8.69, temperature:'−195°C', moons:29, eccentricity:.04725744, inclination:.77263783, semiMajorAU:19.18916464, meanLongitude:313.23810451, longitudePerihelion:170.9542763, ascendingNode:74.01692503, rotationHours:-17.24, axialTilt:97.77, elementRates:{a:-.00196176,e:-.00004397,i:-.00242939,L:428.48202785,perihelion:.40805281,node:.04240589}, description:'An ice giant that rolls around the Sun on its side.', fact:'Uranus has an axial tilt of about 98 degrees.' },
  { name:'Neptune', type:'ICE GIANT', color:'#5478dc', radius:24622, distance:4495.1, period:60190, day:'16.1 h', gravity:11.15, temperature:'−200°C', moons:16, eccentricity:.00859048, inclination:1.77004347, semiMajorAU:30.06992276, meanLongitude:-55.12002969, longitudePerihelion:44.96476227, ascendingNode:131.78422574, rotationHours:16.11, axialTilt:28.32, elementRates:{a:.00026291,e:.00005105,i:.00035372,L:218.45945325,perihelion:-.32241464,node:-.00508664}, description:'A distant blue world swept by supersonic winds.', fact:'Neptune was the first planet located through mathematical prediction.' },
]

export const moons = [
  { name:'Moon', parent:'Earth', color:'#aaa9b1', note:'Our nearest celestial neighbor' },
  { name:'Phobos', parent:'Mars', color:'#9e7969', note:'A small, irregular moon spiraling inward' },
  { name:'Deimos', parent:'Mars', color:'#b49c8d', note:'Mars’ outer, quieter moon' },
  { name:'Io', parent:'Jupiter', color:'#d7b75c', note:'The most volcanically active world' },
  { name:'Europa', parent:'Jupiter', color:'#bba88b', note:'An icy shell above a global ocean' },
  { name:'Ganymede', parent:'Jupiter', color:'#9e9082', note:'The largest moon in the Solar System' },
  { name:'Titan', parent:'Saturn', color:'#d8a360', note:'A hazy moon with lakes of methane' },
  { name:'Enceladus', parent:'Saturn', color:'#e2e6df', note:'An ocean moon with icy plumes' },
]

export const dwarfPlanets = [
  { name:'Ceres', region:'Asteroid belt', color:'#b6ad9f', fact:'The only dwarf planet in the inner Solar System.' },
  { name:'Pluto', region:'Kuiper Belt', color:'#c99d80', fact:'A complex world with mountains of water ice and a thin atmosphere.' },
  { name:'Haumea', region:'Kuiper Belt', color:'#b2c4c5', fact:'A rapidly spinning world with an elongated shape.' },
  { name:'Makemake', region:'Kuiper Belt', color:'#c9a58e', fact:'A distant icy world with a reddish surface.' },
  { name:'Eris', region:'Scattered disc', color:'#d0c6b8', fact:'A distant dwarf planet that helped prompt the modern planet definition.' },
]

export const missions = [
  { name:'Voyager 1', agency:'NASA', year:1977, target:'Interstellar space', status:'ACTIVE', detail:'The most distant human-made object, carrying a message from Earth.' },
  { name:'Cassini–Huygens', agency:'NASA / ESA / ASI', year:1997, target:'Saturn', status:'COMPLETE', detail:'Revealed Saturn’s rings and explored the moons Titan and Enceladus.' },
  { name:'Juno', agency:'NASA', year:2011, target:'Jupiter', status:'ACTIVE', detail:'Mapping Jupiter’s gravity, magnetic field, and deep atmosphere.' },
  { name:'Perseverance', agency:'NASA', year:2020, target:'Mars', status:'ACTIVE', detail:'Searching for ancient signs of life and collecting samples on Mars.' },
]

export const formatDistance = (distance: number) => `${distance.toLocaleString('en-US')} million km`
