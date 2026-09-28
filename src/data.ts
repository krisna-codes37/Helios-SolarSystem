export type Planet = {
  name: string; type: string; color: string; radius: number; distance: number; period: number;
  day: string; gravity: number; temperature: string; moons: number; description: string; fact: string;
}

export const planets: Planet[] = [
  { name:'Mercury', type:'TERRESTRIAL', color:'#b7a795', radius:2439.7, distance:57.9, period:88, day:'58.6 d', gravity:3.7, temperature:'167°C', moons:0, description:'A small, cratered world racing around the Sun every 88 Earth days.', fact:'Mercury has ice inside permanently shadowed craters near its poles.' },
  { name:'Venus', type:'TERRESTRIAL', color:'#dfaa73', radius:6051.8, distance:108.2, period:225, day:'243 d', gravity:8.87, temperature:'464°C', moons:0, description:'A volcanic world wrapped in a dense atmosphere of carbon dioxide.', fact:'Venus rotates in the opposite direction to most planets.' },
  { name:'Earth', type:'TERRESTRIAL', color:'#4d9ff5', radius:6371, distance:149.6, period:365, day:'23.9 h', gravity:9.81, temperature:'15°C', moons:1, description:'Our pale blue home: the only world we know to harbor life.', fact:'Earth is the only planet not named after a Roman or Greek deity.' },
  { name:'Mars', type:'TERRESTRIAL', color:'#d56d4d', radius:3389.5, distance:227.9, period:687, day:'24.6 h', gravity:3.71, temperature:'−65°C', moons:2, description:'A cold desert with ancient river valleys, towering volcanoes, and two tiny moons.', fact:'Olympus Mons is nearly three times taller than Mount Everest.' },
  { name:'Jupiter', type:'GAS GIANT', color:'#d5a77d', radius:69911, distance:778.6, period:4333, day:'9.9 h', gravity:24.79, temperature:'−110°C', moons:115, description:'A giant world of cloud bands, powerful storms, and a family of remarkable moons.', fact:'The Great Red Spot is a storm that has raged for centuries.' },
  { name:'Saturn', type:'GAS GIANT', color:'#e5c987', radius:58232, distance:1433.5, period:10759, day:'10.7 h', gravity:10.44, temperature:'−140°C', moons:293, description:'A gas giant surrounded by a spectacular system of icy rings.', fact:'Saturn’s rings are mostly water ice, from tiny grains to house-sized chunks.' },
  { name:'Uranus', type:'ICE GIANT', color:'#83c9d0', radius:25362, distance:2872.5, period:30687, day:'17.2 h', gravity:8.69, temperature:'−195°C', moons:29, description:'An ice giant that rolls around the Sun on its side.', fact:'Uranus has an axial tilt of about 98 degrees.' },
  { name:'Neptune', type:'ICE GIANT', color:'#5478dc', radius:24622, distance:4495.1, period:60190, day:'16.1 h', gravity:11.15, temperature:'−200°C', moons:16, description:'A distant blue world swept by supersonic winds.', fact:'Neptune was the first planet located through mathematical prediction.' },
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

export const missions = [
  { name:'Voyager 1', agency:'NASA', year:1977, target:'Interstellar space', status:'ACTIVE', detail:'The most distant human-made object, carrying a message from Earth.' },
  { name:'Cassini–Huygens', agency:'NASA / ESA / ASI', year:1997, target:'Saturn', status:'COMPLETE', detail:'Revealed Saturn’s rings and explored the moons Titan and Enceladus.' },
  { name:'Juno', agency:'NASA', year:2011, target:'Jupiter', status:'ACTIVE', detail:'Mapping Jupiter’s gravity, magnetic field, and deep atmosphere.' },
  { name:'Perseverance', agency:'NASA', year:2020, target:'Mars', status:'ACTIVE', detail:'Searching for ancient signs of life and collecting samples on Mars.' },
]

export const formatDistance = (distance: number) => `${distance.toLocaleString('en-US')} million km`
