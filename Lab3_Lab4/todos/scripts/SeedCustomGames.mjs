import { initializeApp } from "firebase/app";
import { getAuth, signInWithEmailAndPassword } from "firebase/auth";
import {
  addDoc,
  collection,
  getDocs,
  getFirestore,
  limit,
  query,
  serverTimestamp,
  where
} from "firebase/firestore";

const FirebaseConfig = {
  apiKey: "AIzaSyA_H97GcyoqeqG6qKP8y7_yG6Xtkve9ERA",
  authDomain: "web-dev-f6c8f.firebaseapp.com",
  projectId: "web-dev-f6c8f",
  storageBucket: "web-dev-f6c8f.firebasestorage.app",
  messagingSenderId: "675561767183",
  appId: "1:675561767183:web:f062acab053d891d6fbe7a"
};

const SeedEmail = "email@example.com";
const SeedPassword = "haslo123456";
const SeedBatch = "custom-board-games-15-v1";

const CustomGames = [
  {
    title: "Mgły nad Brukowanym Portem",
    images: [],
    description: [
      "Detektywistyczna gra planszowa o tropieniu przemytników w starym, mglistym porcie.",
      "Gracze przesłuchują świadków, zbierają poszlaki i próbują odkryć, kto kontroluje nocne dostawy."
    ],
    min_players: 2,
    max_players: 5,
    avg_play_time_minutes: 70,
    publisher: "Latarnia Studio",
    is_expansion: false,
    price_pln: 109.99,
    auction: null,
    type: "dedukcyjna"
  },
  {
    title: "Neonowe Imperium",
    images: [],
    description: [
      "Ekonomiczna gra o budowaniu korporacji w cyberpunkowym mieście.",
      "Kupuj dzielnice, zawieraj układy i uważaj na konkurencję, która może przejąć Twoje kontrakty."
    ],
    min_players: 2,
    max_players: 4,
    avg_play_time_minutes: 120,
    publisher: "Pixel Board Studio",
    is_expansion: false,
    price_pln: 159.99,
    auction: {
      starting_price: 80,
      current_bid: 95,
      highest_bidder_uid: "",
      highest_bidder_email: ""
    },
    type: "ekonomiczna"
  },
  {
    title: "Herbata u Goblinów",
    images: [],
    description: [
      "Szybka karcianka imprezowa o parzeniu najdziwniejszych herbat w goblińskiej gospodzie.",
      "Im bardziej absurdalne składniki, tym większa szansa na zwycięstwo."
    ],
    min_players: 3,
    max_players: 8,
    avg_play_time_minutes: 25,
    publisher: "Kartonowy Kocioł",
    is_expansion: false,
    price_pln: 44.99,
    auction: null,
    type: "karciana"
  },
  {
    title: "Podziemna Poczta",
    images: [],
    description: [
      "Strategiczna gra o krasnoludzkich kurierach dostarczających paczki przez niebezpieczne tunele.",
      "Buduj trasy, omijaj zawaliska i negocjuj przejazdy przez cudze korytarze."
    ],
    min_players: 2,
    max_players: 4,
    avg_play_time_minutes: 75,
    publisher: "Tunel Games",
    is_expansion: false,
    price_pln: 119.99,
    auction: {
      starting_price: 60,
      current_bid: 60,
      highest_bidder_uid: "",
      highest_bidder_email: ""
    },
    type: "strategiczna"
  },
  {
    title: "Kosmiczni Ogrodnicy",
    images: [],
    description: [
      "Familijna gra o sadzeniu roślin na małych asteroidach.",
      "Gracze zarządzają wodą, światłem i miejscem, żeby stworzyć najpiękniejszy kosmiczny ogród."
    ],
    min_players: 2,
    max_players: 4,
    avg_play_time_minutes: 50,
    publisher: "Orbita Planszówek",
    is_expansion: false,
    price_pln: 89.99,
    auction: null,
    type: "familijna"
  },
  {
    title: "Zamek z Papieru",
    images: [],
    description: [
      "Lekka gra logiczna o budowaniu zamku z kart, mostów i ukrytych przejść.",
      "Każdy ruch zmienia układ planszy, więc trzeba planować kilka tur do przodu."
    ],
    min_players: 2,
    max_players: 4,
    avg_play_time_minutes: 40,
    publisher: "Papierowy Smok",
    is_expansion: false,
    price_pln: 69.99,
    auction: null,
    type: "logiczna"
  },
  {
    title: "Pociąg do Księżyca",
    images: [],
    description: [
      "Rodzinna gra o budowie niezwykłej linii kolejowej prowadzącej aż na Księżyc.",
      "Zbieraj zasoby, zatrudniaj załogę i rozbudowuj trasę przed innymi graczami."
    ],
    min_players: 2,
    max_players: 5,
    avg_play_time_minutes: 65,
    publisher: "Stacja Gier",
    is_expansion: false,
    price_pln: 99.99,
    auction: {
      starting_price: 50,
      current_bid: 72,
      highest_bidder_uid: "",
      highest_bidder_email: ""
    },
    type: "rodzinna"
  },
  {
    title: "Smoczy Audyt",
    images: [],
    description: [
      "Półżartobliwa gra ekonomiczna, w której smoki sprawdzają księgowość królestwa.",
      "Ukrywaj koszty, inwestuj w kopalnie i pilnuj, żeby skarbiec nie zaczął świecić pustkami."
    ],
    min_players: 2,
    max_players: 6,
    avg_play_time_minutes: 90,
    publisher: "Złota Kostka",
    is_expansion: false,
    price_pln: 134.99,
    auction: null,
    type: "ekonomiczna"
  },
  {
    title: "Kawiarnia na Końcu Mapy",
    images: [],
    description: [
      "Spokojna gra familijna o prowadzeniu kawiarni dla podróżników, magów i kartografów.",
      "Przyjmuj zamówienia, ulepszaj lokal i odkrywaj nowe fragmenty mapy."
    ],
    min_players: 1,
    max_players: 4,
    avg_play_time_minutes: 55,
    publisher: "Ciepły Kubek Games",
    is_expansion: false,
    price_pln: 84.99,
    auction: null,
    type: "familijna"
  },
  {
    title: "Cienie Akademii",
    images: [],
    description: [
      "Gra przygodowa o uczniach magicznej akademii, którzy rozwiązują tajemnicę znikających zaklęć.",
      "Każdy gracz ma inne zdolności, a scenariusz zmienia się zależnie od decyzji drużyny."
    ],
    min_players: 1,
    max_players: 4,
    avg_play_time_minutes: 100,
    publisher: "Runiczny Stół",
    is_expansion: false,
    price_pln: 149.99,
    auction: {
      starting_price: 100,
      current_bid: 115,
      highest_bidder_uid: "",
      highest_bidder_email: ""
    },
    type: "przygodowa"
  },
  {
    title: "Wyspa Mechanicznych Żółwi",
    images: [],
    description: [
      "Strategiczna gra o eksploracji ruchomej wyspy zbudowanej na grzbietach ogromnych żółwi.",
      "Plansza przesuwa się co rundę, więc bezpieczna trasa może nagle stać się pułapką."
    ],
    min_players: 2,
    max_players: 5,
    avg_play_time_minutes: 85,
    publisher: "Trybik Games",
    is_expansion: false,
    price_pln: 129.99,
    auction: null,
    type: "strategiczna"
  },
  {
    title: "Mikrokrólestwa",
    images: [],
    description: [
      "Mała gra strategiczna o budowaniu królestwa na planszy mieszczącej się na biurku.",
      "Szybkie partie, proste zasady i dużo kombinowania z ograniczoną przestrzenią."
    ],
    min_players: 2,
    max_players: 4,
    avg_play_time_minutes: 35,
    publisher: "Małe Pudełko",
    is_expansion: false,
    price_pln: 54.99,
    auction: null,
    type: "strategiczna"
  },
  {
    title: "Mikrokrólestwa: Kupcy z Północy",
    images: [],
    description: [
      "Dodatek do Mikrokrólestw wprowadzający handel morski, nowe budynki i zimowe wydarzenia.",
      "Najlepiej działa z graczami, którzy znają już podstawową wersję gry."
    ],
    min_players: 2,
    max_players: 4,
    avg_play_time_minutes: 40,
    publisher: "Małe Pudełko",
    is_expansion: true,
    price_pln: 34.99,
    auction: null,
    type: "dodatek"
  },
  {
    title: "Szyfr Alchemika",
    images: [],
    description: [
      "Dedukcyjna gra o odczytywaniu receptur, testowaniu mikstur i blefowaniu przy stole.",
      "Zwycięża gracz, który najlepiej połączy eksperymenty z obserwacją przeciwników."
    ],
    min_players: 2,
    max_players: 5,
    avg_play_time_minutes: 60,
    publisher: "Fiolka Studio",
    is_expansion: false,
    price_pln: 94.99,
    auction: {
      starting_price: 45,
      current_bid: 50,
      highest_bidder_uid: "",
      highest_bidder_email: ""
    },
    type: "dedukcyjna"
  },
  {
    title: "Radiostacja 77",
    images: [],
    description: [
      "Kooperacyjna gra o załodze starej radiostacji, która próbuje nadać sygnał ratunkowy podczas burzy.",
      "Gracze zarządzają energią, naprawiają sprzęt i decydują, które komunikaty są prawdziwe."
    ],
    min_players: 1,
    max_players: 5,
    avg_play_time_minutes: 80,
    publisher: "Burza Games",
    is_expansion: false,
    price_pln: 124.99,
    auction: null,
    type: "kooperacyjna"
  }
];

async function CheckIfSeedAlreadyExists(Db)
{
  const GamesCollection = collection(Db, "games");
  const SeedQuery = query(
    GamesCollection,
    where("seedBatch", "==", SeedBatch),
    limit(1)
  );

  const Snapshot = await getDocs(SeedQuery);

  if (!Snapshot.empty)
  {
    return true;
  }

  return false;
}

async function SeedOnce()
{
  const App = initializeApp(FirebaseConfig);
  const Auth = getAuth(App);
  const Db = getFirestore(App);

  console.log("Logowanie do Firebase...");
  const UserCredential = await signInWithEmailAndPassword(Auth, SeedEmail, SeedPassword);
  const CurrentUser = UserCredential.user;

  console.log(`Zalogowano jako: ${CurrentUser.email}`);

  const AlreadySeeded = await CheckIfSeedAlreadyExists(Db);

  if (AlreadySeeded)
  {
    console.log("Ten seed był już wykonany. Nic nie dodaję drugi raz.");
    process.exit(0);
  }

  const GamesCollection = collection(Db, "games");

  for (const Game of CustomGames)
  {
    await addDoc(GamesCollection, {
      ...Game,
      seedBatch: SeedBatch,
      ownerUid: CurrentUser.uid,
      ownerEmail: CurrentUser.email,
      isAvailable: true,
      buyerUid: "",
      buyerEmail: "",
      soldAt: null,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp()
    });

    console.log(`Dodano: ${Game.title}`);
  }

  console.log("Gotowe. Dodano 15 testowych gier.");
  process.exit(0);
}

SeedOnce().catch(function HandleSeedError(Error)
{
  console.error("Błąd seedowania:");
  console.error(Error.message);
  process.exit(1);
});