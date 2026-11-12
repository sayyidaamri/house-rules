/* House Rules — all copy & data in one place.
   Games, players and nights are fictional. Edit freely; every page renders from here. */
(function () {
  const BRAND = {
    name: "House Rules",
    short: "HR",
    studio: "KITE.STUDIO",
    studioUrl: "#",
    email: "hello@kite.studio",
    tagline: "Every table keeps a story, and every story waits for a move",
    socials: [
      { label: "Instagram", href: "https://www.instagram.com/" },
      { label: "LinkedIn", href: "https://www.linkedin.com/" },
      { label: "X", href: "https://x.com/" },
    ],
  };

  const GAMES = [
    { id: "lantern-harbor", name: "Lantern Harbor", img: "g01", players: "2-5 Players", genres: ["Strategy", "Family"], maker: "Northwind Press, 2023", desc: "Steer your fleet through the fog, trade lamplight for silk, and be the harbor everyone sails home to.", featured: true },
    { id: "ember-court", name: "Ember Court", img: "g02", players: "2-8+ Players", genres: ["Party", "Family"], maker: "Copper Fox, 2024", desc: "Shout your claim, call the bluff, and keep the fire lit for one more round before the court falls quiet." , featured: true },
    { id: "tilefolk", name: "Tilefolk", img: "g03", players: "3-4 Players", genres: ["Strategy", "Family"], maker: "Pinecone Games, 2021", desc: "Lay the tiles, settle the valley, and argue gently over who gets the river this time.", featured: true },
    { id: "ravine-run", name: "Ravine Run", img: "g04", players: "2-5 Players", genres: ["Cooperative", "Card Game", "Puzzle"], maker: "Stellar Hollow, 2024", desc: "Work together to cross the ravine card by card: few words, no peeking, and one slip ends the climb for all.", featured: true },
    { id: "moonlit-dungeon", name: "Moonlit Dungeon", img: "g05", players: "2-6 Players", genres: ["Party", "Family", "Dice"], maker: "Lowtide Studio, 2023", desc: "Roll into the dark, bargain with the moon, and carry out more treasure than your nerve should allow.", featured: true },
    { id: "ink-and-dice", name: "Ink & Dice", img: "g06", players: "2-8+ Players", genres: ["Party"], maker: "Paper Wren, 2020", desc: "Draw what you rolled, guess what they drew, and laugh at how far apart two minds can be.", featured: true },
    { id: "fortunes-parade", name: "Fortune's Parade", img: "g07", players: "2-5 Players", genres: ["Strategy", "Family"], maker: "Velvet Ring, 2022", desc: "March the cards through town, read the omens out loud, and hope the crowd cheers for you last.", featured: true, big: true },
    { id: "petal-arcana", name: "Petal Arcana", img: "g08", players: "1-5 Players", genres: ["Strategy", "Card Game", "Family"], maker: "Bloomhouse, 2019", desc: "Gather the suits of a quiet garden and arrange a spread that tells the gentlest fortune at the table." },
    { id: "quiet-kingdom", name: "Quiet Kingdom", img: "g09", players: "2 Players", genres: ["Family"], maker: "Oakline, 2018", desc: "Two crowns, one board, and a long silence before somebody finally commits to the move." },
    { id: "red-ledger", name: "Red Ledger", img: "g10", players: "2-8+ Players", genres: ["Card Game", "Party"], maker: "Crimson Desk, 2021", desc: "Every card is a debt, every trick a payment, and the ledger always remembers who still owes the house." },
    { id: "checkered-sun", name: "Checkered Sun", img: "g11", players: "2-6 Players", genres: ["Family", "Dice", "Party"], maker: "Sunday Table, 2022", desc: "Race across a sunlit board on borrowed luck, and gamble a lead you only half deserve." },
  ];

  const PLAYERS = ["Mara", "Theo", "Iris", "Bram", "Nico", "Lena", "Otto", "Juno", "Sasha", "Ruben"];

  // ---- seeded generator so the log is stable on every load ----
  let s = 20260117;
  const rnd = () => { s |= 0; s = (s + 0x6d2b79f5) | 0; let t = Math.imul(s ^ (s >>> 15), 1 | s); t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t; return ((t ^ (t >>> 14)) >>> 0) / 4294967296; };
  const pick = (arr) => arr[Math.floor(rnd() * arr.length)];
  const weights = { "fortunes-parade": 10, "lantern-harbor": 4, "tilefolk": 3, "ember-court": 3, "moonlit-dungeon": 3, "ink-and-dice": 3, "ravine-run": 2, "petal-arcana": 2, "red-ledger": 2, "checkered-sun": 2, "quiet-kingdom": 1 };
  const bag = []; Object.entries(weights).forEach(([k, w]) => { for (let i = 0; i < w; i++) bag.push(k); });

  const NIGHTS = [];
  // 80 distinct evenings between 3 Jan and 18 Oct 2026, weekends favoured
  const first = new Date(2026, 0, 3), span = 288, picked = new Set([0, span]);
  while (picked.size < 80) { const k = Math.floor(rnd() * span); const wd = new Date(2026, 0, 3 + k).getDay(); if (wd === 6 || wd === 5 || rnd() < 0.35) picked.add(k); }
  const dayList = [...picked].sort((a, b) => a - b);
  for (let i = 0; i < 80; i++) {
    const d = new Date(first.getFullYear(), first.getMonth(), first.getDate() + dayList[i]);
    const nGames = rnd() < 0.35 ? 1 : rnd() < 0.75 ? 2 : 3;
    const seat = ["Mara"]; const others = PLAYERS.slice(1).sort(() => rnd() - 0.5);
    const count = 2 + Math.floor(rnd() * 5);
    for (let k = 0; k < count; k++) seat.push(others[k]);
    const games = [];
    for (let g = 0; g < nGames; g++) {
      const id = pick(bag);
      const mins = (3 + Math.floor(rnd() * 16)) * 5;
      const winners = rnd() < 0.08 ? [] : [rnd() < 0.62 ? "Mara" : pick(seat)];
      games.push({ id, mins, winners });
    }
    NIGHTS.push({ date: new Date(d), games, players: seat });
  }

  NIGHTS.forEach((n, i) => (n.no = i + 1));

  // ---- helpers ----
  const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sept", "Oct", "Nov", "Dec"];
  const MONTHS_LONG = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
  const fmtDate = (dt) => `${String(dt.getDate()).padStart(2, "0")} ${MONTHS[dt.getMonth()]} ${dt.getFullYear()}`;
  const fmtShort = (dt) => `${String(dt.getDate()).padStart(2, "0")} ${MONTHS[dt.getMonth()]}`;
  const fmtLong = (dt) => `${MONTHS_LONG[dt.getMonth()]} ${dt.getDate()}, ${dt.getFullYear()}`;
  const fmtMins = (m) => { const h = Math.floor(m / 60), r = m % 60; return h ? (r ? `${h}h ${r}m` : `${h}h`) : `${r}m`; };
  const game = (id) => GAMES.find((g) => g.id === id);
  const nightMins = (n) => n.games.reduce((a, g) => a + g.mins, 0);
  const nightWinners = (n) => [...new Set(n.games.flatMap((g) => g.winners))];

  // ---- derived stats ----
  const totalMins = NIGHTS.reduce((a, n) => a + nightMins(n), 0);
  const longest = NIGHTS.reduce((a, n) => (nightMins(n) > nightMins(a) ? n : a), NIGHTS[0]);
  const plays = {}; const wins = {}; const genre = {}; const seats = {}; const days = {};
  NIGHTS.forEach((n) => {
    n.games.forEach((g) => { plays[g.id] = (plays[g.id] || 0) + 1; g.winners.forEach((w) => (wins[w] = (wins[w] || 0) + 1)); game(g.id).genres.forEach((x) => (genre[x] = (genre[x] || 0) + 1)); });
    n.players.forEach((p) => (seats[p] = (seats[p] || 0) + 1));
    const dn = n.date.toLocaleDateString("en-US", { weekday: "long" }); days[dn] = (days[dn] || 0) + 1;
  });
  const top = (o) => Object.entries(o).sort((a, b) => b[1] - a[1])[0];
  const gamesPlayed = NIGHTS.reduce((a, n) => a + n.games.length, 0);
  const [mostPlayedId, mostPlayedCount] = top(plays);
  const [champ, champWins] = top(wins);
  const [favGenre, favGenreCount] = top(genre);
  const [busyDay, busyCount] = top(days);
  const STATS = {
    nights: NIGHTS.length, totalMins, longest, gamesPlayed,
    avg: Math.round(totalMins / NIGHTS.length),
    mostPlayed: game(mostPlayedId), mostPlayedCount,
    champ, champWins, champRate: Math.round((champWins / gamesPlayed) * 100),
    regulars: PLAYERS.length, seats, plays, wins,
    favGenre, favGenreCount, busyDay: busyDay + "s", busyCount,
  };
  const genreCounts = {}; GAMES.forEach((g) => g.genres.forEach((x) => (genreCounts[x] = (genreCounts[x] || 0) + 1)));
  const GENRES = Object.entries(genreCounts).sort((a, b) => b[1] - a[1]);

  // About page copy
  const CRAFTS = [
    { name: "Illustration", body: "Before anyone pulled up a chair, someone painted the world. The lid, the board and every card face are drawn to be read across a table, under a warm lamp, upside down." },
    { name: "Sculpture", body: "A crown you can turn between two fingers. Every piece is shaped to be known at a glance, lifted without looking and held for a whole evening." },
    { name: "Writing", body: "The rulebook is a short story told in steps. It has to teach, end arguments and set a mood, and the whole world lives between its lines." },
    { name: "Systems", body: "Luck and choice, weighed by hand. A good system makes each decision feel like yours and gives everyone a reason to stay seated." },
  ];
  const PROFILES = [
    { name: "The keeper", body: "You read the rules aloud and nobody minds. Tonight the table runs on your patience." },
    { name: "The talker", body: "Every deal goes through you. Tonight the loudest promise wins the room." },
    { name: "The planner", body: "Six turns ahead and still counting. Tonight the slow road pays the most." },
    { name: "The gambler", body: "The careful move can wait. Tonight the story is worth more than the score." },
    { name: "The ally", body: "You win when the table wins. Tonight nobody gets left behind." },
    { name: "The legend", body: "Somebody will retell this night for years. Tonight the dice remember you." },
  ];
  const STEPS = [
    { title: "Start with the point of view.", body: "Every project begins with what it has to say: its character, its audience, its reason to exist. Here that meant treating each game as a small work of art." },
    { title: "Leave room for discovery.", body: "Type, image, material and motion are tried side by side, and every experiment has to make the idea clearer. Here, an engraved and gilded world you can step into." },
    { title: "Build the feeling.", body: "Design and code stay in one conversation, down to the timing of a reveal and the weight of a gesture. Here, cards that deal and paint that opens a room." },
    { title: "Care all the way through.", body: "The finish lives where it is least likely to be noticed: a line break on a phone, a keyboard path, a gentler motion setting. Here, from the first screen to the last." },
  ];

  window.HR = { BRAND, GAMES, PLAYERS, NIGHTS, STATS, GENRES, CRAFTS, PROFILES, STEPS, fmtDate, fmtShort, fmtLong, fmtMins, game, nightMins, nightWinners, MONTHS };
})();
