/**
 * Lista scenariuszy awaryjnych dla aplikacji konwersacyjnej
 * Każdy scenariusz ma tytuł i opis
 */
const emergencyScenarios = [
  {
    id: 1,
    title: "Wypadek samochodowy",
    description: "Zgłoś wypadek samochodowy na ulicy Głównej. Są dwie osoby ranne, a ruch drogowy jest zablokowany."
  },
  {
    id: 2,
    title: "Pożar domu",
    description: "Zgłoś pożar domu. Dym widoczny jest z drugiego piętra i możliwe, że w środku są uwięzieni ludzie."
  },
  {
    id: 3,
    title: "Nagły przypadek medyczny",
    description: "Zgłoś osobę, która zasłabła w parku . Osoba jest nieprzytomna, ale oddycha."
  },
  {
    id: 4,
    title: "Wyciek gazu",
    description: "Zgłoś silny zapach gazu w swoim budynku mieszkalnym. Kilku mieszkańców odczuwa zawroty głowy."
  },
  {
    id: 5,
    title: "Powódź",
    description: "Zgłoś zalanie w swojej okolicy po intensywnych opadach deszczu. Woda wdziera się do domów, a niektóre ulice są nieprzejezdne."
  },
  {
    id: 6,
    title: "Zaginiona osoba",
    description: "Zgłoś zaginięcie dziecka, które ostatnio widziano w lokalnym centrum handlowym. 8-letnie dziecko miało na sobie czerwoną koszulkę i niebieskie dżinsy."
  },
  {
    id: 7,
    title: "Napad",
    description: "Zgłoś napad, który właśnie miał miejsce w sklepie spożywczym. Podejrzany uciekł pieszo w kierunku centrum."
  },
  {
    id: 8,
    title: "Awaria prądu",
    description: "Zgłoś rozległą awarię zasilania, która dotknęła całą okolicę podczas ekstremalnych warunków pogodowych."
  }
];

/**
 * Zwraca losowy scenariusz z listy scenariuszy awaryjnych
 * @returns {Object} Losowo wybrany obiekt scenariusza
 */
function getRandomScenario() {
  const randomIndex = Math.floor(Math.random() * emergencyScenarios.length);
  return emergencyScenarios[randomIndex];
}

/**
 * Zwraca wszystkie dostępne scenariusze
 * @returns {Array} Wszystkie scenariusze awaryjne
 */
function getAllScenarios() {
  return emergencyScenarios;
}

/**
 * Zwraca scenariusz według jego ID
 * @param {number} id - ID scenariusza do pobrania
 * @returns {Object|null} Obiekt scenariusza lub null, jeśli nie znaleziono
 */
function getScenarioById(id) {
  return emergencyScenarios.find(scenario => scenario.id === id) || null;
}

export { getRandomScenario, getAllScenarios, getScenarioById };
