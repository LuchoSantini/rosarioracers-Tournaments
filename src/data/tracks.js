import { countryByCode } from './countries';

// Catálogo de pistas. `groups` define en qué filtros aparece (una pista puede estar en varios).
//   AR = Argentina · US = EEUU · F1 = calendario/histórico de F1 · WORLD = resto del mundo
const raw = [
  // Argentina
  ['galvez','Autódromo Oscar y Juan Gálvez', 'Buenos Aires', 'AR', ['AR']],
  ['rosario', 'Autódromo Ciudad de Rosario', 'Rosario', 'AR', ['AR']],
  ['balcarce', 'Autódromo Juan Manuel Fangio', 'Balcarce', 'AR', ['AR']],
  ['termas', 'Autódromo Termas de Río Hondo', 'Santiago del Estero', 'AR', ['AR']],
  ['riocuarto', 'Autódromo Parque Ciudad de Río Cuarto', 'Río Cuarto', 'AR', ['AR']],
  ['zonda', 'Autódromo Eduardo Copello', 'Zonda, San Juan', 'AR', ['AR']],
  ['sanmartin', 'Autódromo Jorge Ángel Pena', 'San Martín, Mendoza', 'AR', ['AR']],
  ['laplata', 'Autódromo Roberto Mouras', 'La Plata', 'AR', ['AR']],
  ['rafaela', 'Autódromo Ciudad de Rafaela', 'Rafaela', 'AR', ['AR']],
  ['sanluis', 'Autódromo Rosendo Hernández', 'San Luis', 'AR', ['AR']],
  ['parana', 'Autódromo Ciudad de Paraná', 'Paraná', 'AR', ['AR']],
  ['concordia', 'Autódromo Ciudad de Concordia', 'Concordia', 'AR', ['AR']],
  ['obera', 'Autódromo Ciudad de Oberá', 'Oberá', 'AR', ['AR']],
  ['toay', 'Autódromo Provincia de La Pampa', 'Toay', 'AR', ['AR']],
  ['trelew', 'Autódromo Mar y Valle', 'Trelew', 'AR', ['AR']],
  ['resistencia', 'Autódromo Santiago Yaco Guarnieri', 'Resistencia', 'AR', ['AR']],

  // Estados Unidos
  ['daytona', 'Daytona International Speedway', 'Daytona Beach, FL', 'US', ['US']],
  ['indianapolis', 'Indianapolis Motor Speedway', 'Indianápolis, IN', 'US', ['US']],
  ['lagunaseca', 'WeatherTech Raceway Laguna Seca', 'Monterey, CA', 'US', ['US']],
  ['roadamerica', 'Road America', 'Elkhart Lake, WI', 'US', ['US']],
  ['watkinsglen', 'Watkins Glen International', 'Watkins Glen, NY', 'US', ['US']],
  ['sebring', 'Sebring International Raceway', 'Sebring, FL', 'US', ['US']],
  ['roadatlanta', 'Road Atlanta', 'Braselton, GA', 'US', ['US']],
  ['talladega', 'Talladega Superspeedway', 'Talladega, AL', 'US', ['US']],
  ['charlotte', 'Charlotte Motor Speedway', 'Concord, NC', 'US', ['US']],
  ['bristol', 'Bristol Motor Speedway', 'Bristol, TN', 'US', ['US']],
  ['limerock', 'Lime Rock Park', 'Lakeville, CT', 'US', ['US']],
  ['midohio', 'Mid-Ohio Sports Car Course', 'Lexington, OH', 'US', ['US']],
  ['cota', 'Circuit of the Americas', 'Austin, TX', 'US', ['US', 'F1']],
  ['miami', 'Miami International Autodrome', 'Miami Gardens, FL', 'US', ['US', 'F1']],
  ['lasvegas', 'Las Vegas Strip Circuit', 'Las Vegas, NV', 'US', ['US', 'F1']],

  // Fórmula 1
  ['albertpark', 'Albert Park Circuit', 'Melbourne', 'AU', ['F1']],
  ['shanghai', 'Shanghai International Circuit', 'Shanghái', 'CN', ['F1']],
  ['suzuka', 'Suzuka International Racing Course', 'Suzuka', 'JP', ['F1']],
  ['bahrain', 'Bahrain International Circuit', 'Sakhir', 'BH', ['F1']],
  ['jeddah', 'Jeddah Corniche Circuit', 'Yeda', 'SA', ['F1']],
  ['imola', 'Autodromo Enzo e Dino Ferrari', 'Imola', 'IT', ['F1']],
  ['monaco', 'Circuit de Monaco', 'Montecarlo', 'MC', ['F1']],
  ['barcelona', 'Circuit de Barcelona-Catalunya', 'Montmeló', 'ES', ['F1']],
  ['montreal', 'Circuit Gilles Villeneuve', 'Montreal', 'CA', ['F1']],
  ['redbullring', 'Red Bull Ring', 'Spielberg', 'AT', ['F1']],
  ['silverstone', 'Silverstone Circuit', 'Silverstone', 'GB', ['F1']],
  ['spa', 'Circuit de Spa-Francorchamps', 'Stavelot', 'BE', ['F1']],
  ['hungaroring', 'Hungaroring', 'Budapest', 'HU', ['F1']],
  ['zandvoort', 'Circuit Zandvoort', 'Zandvoort', 'NL', ['F1']],
  ['monza', 'Autodromo Nazionale Monza', 'Monza', 'IT', ['F1']],
  ['baku', 'Baku City Circuit', 'Bakú', 'AZ', ['F1']],
  ['marinabay', 'Marina Bay Street Circuit', 'Singapur', 'SG', ['F1']],
  ['hermanosrodriguez', 'Autódromo Hermanos Rodríguez', 'Ciudad de México', 'MX', ['F1']],
  ['interlagos', 'Autódromo José Carlos Pace (Interlagos)', 'San Pablo', 'BR', ['F1']],
  ['lusail', 'Lusail International Circuit', 'Lusail', 'QA', ['F1']],
  ['yasmarina', 'Yas Marina Circuit', 'Abu Dabi', 'AE', ['F1']],
  ['paulricard', 'Circuit Paul Ricard', 'Le Castellet', 'FR', ['F1']],
  ['hockenheim', 'Hockenheimring', 'Hockenheim', 'DE', ['F1']],
  ['nurburgring', 'Nürburgring Grand Prix', 'Nürburg', 'DE', ['F1']],
  ['portimao', 'Autódromo Internacional do Algarve', 'Portimão', 'PT', ['F1']],
  ['mugello', 'Autodromo del Mugello', 'Scarperia', 'IT', ['F1']],
  ['madring', 'Madring', 'Madrid', 'ES', ['F1']],

  // Resto del mundo
  ['nordschleife', 'Nürburgring Nordschleife', 'Nürburg', 'DE', ['WORLD']],
  ['lemans', 'Circuit de la Sarthe (Le Mans)', 'Le Mans', 'FR', ['WORLD']],
  ['bathurst', 'Mount Panorama Circuit', 'Bathurst', 'AU', ['WORLD']],
  ['brandshatch', 'Brands Hatch', 'Kent', 'GB', ['WORLD']],
  ['fuji', 'Fuji Speedway', 'Oyama', 'JP', ['WORLD']],
  ['sepang', 'Sepang International Circuit', 'Sepang', 'MY', ['F1', 'WORLD']],
  ['kyalami', 'Kyalami Grand Prix Circuit', 'Johannesburgo', 'ZA', ['WORLD']],
];

export const TRACK_CATALOG = raw.map(([id, name, location, countryCode, groups]) => ({
  id,
  name,
  location,
  countryCode,
  countryName: countryByCode(countryCode)?.name ?? countryCode,
  groups,
}));

export const TRACK_FILTERS = [
  { id: 'ALL', label: 'Todas' },
  { id: 'AR', label: 'Argentina' },
  { id: 'US', label: 'EEUU' },
  { id: 'F1', label: 'Fórmula 1' },
  { id: 'WORLD', label: 'Resto del mundo' },
];
