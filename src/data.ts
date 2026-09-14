export type Genre =
  | 'Rock' | 'Jazz' | 'Electronic' | 'Classical' | 'Folk'
  | 'Pop' | 'Hip-Hop' | 'Latin' | 'Blues' | 'Reggae' | 'Acoustic';

export type Artist = {
  id: string;
  name: string;
  genre: Genre;
  city: string;
  bio: string;
  photo: string;
  priceFrom: number;
  pricePer: 'hour' | 'event';
  rating: number;
  reviews: number;
  verified: boolean;
  proTier: boolean;
  members: number;
  travelRadiusKm: number;
  topTrack: { title: string; plays: number };
  spotifyMonthly: number;
  soundCloudPlays: number;
  activePledges: number;
  endorsements: string[];
  tags: string[];
};

export const ARTISTS: Artist[] = [
  {
    id: 'a1',
    name: 'The Midnight Set',
    genre: 'Rock',
    city: 'Austin, TX',
    bio: 'Four-piece indie rock band blending garage energy with melodic hooks. We have played 200+ weddings, corporate events, and festival slots across Texas.',
    photo: 'https://images.pexels.com/photos/27773472/pexels-photo-27773472.jpeg?auto=compress&cs=tinysrgb&h=650&w=940',
    priceFrom: 1200,
    pricePer: 'event',
    rating: 4.9,
    reviews: 87,
    verified: true,
    proTier: true,
    members: 4,
    travelRadiusKm: 150,
    topTrack: { title: 'Neon Dawn', plays: 142000 },
    spotifyMonthly: 28000,
    soundCloudPlays: 51000,
    activePledges: 3,
    endorsements: ['Fender', 'Vox'],
    tags: ['Weddings', 'Festivals', 'Corporate'],
  },
  {
    id: 'a2',
    name: 'Lila Vance',
    genre: 'Jazz',
    city: 'New Orleans, LA',
    bio: 'Jazz vocalist with a velvet tone and a 300-song repertoire. Solo, duo, or trio setups available. Specialize in cocktail hours and intimate venues.',
    photo: 'https://images.pexels.com/photos/9002796/pexels-photo-9002796.jpeg?auto=compress&cs=tinysrgb&h=650&w=940',
    priceFrom: 350,
    pricePer: 'hour',
    rating: 5.0,
    reviews: 62,
    verified: true,
    proTier: true,
    members: 1,
    travelRadiusKm: 80,
    topTrack: { title: 'Blue Moon Lullaby', plays: 89000 },
    spotifyMonthly: 15000,
    soundCloudPlays: 32000,
    activePledges: 1,
    endorsements: ['Shure'],
    tags: ['Cocktail Hour', 'Private Events', 'Restaurants'],
  },
  {
    id: 'a3',
    name: 'PULSE',
    genre: 'Electronic',
    city: 'Los Angeles, CA',
    bio: 'DJ and producer spinning house, tech, and disco edits. Full sound and lighting rig included. Resident at three LA clubs and available for private parties.',
    photo: 'https://images.pexels.com/photos/3903095/pexels-photo-3903095.jpeg?auto=compress&cs=tinysrgb&h=650&w=940',
    priceFrom: 800,
    pricePer: 'event',
    rating: 4.8,
    reviews: 134,
    verified: true,
    proTier: false,
    members: 1,
    travelRadiusKm: 200,
    topTrack: { title: 'Afterglow Mix', plays: 410000 },
    spotifyMonthly: 52000,
    soundCloudPlays: 220000,
    activePledges: 0,
    endorsements: ['Pioneer DJ'],
    tags: ['Clubs', 'Private Parties', 'Festivals'],
  },
  {
    id: 'a4',
    name: 'Elena Costa',
    genre: 'Classical',
    city: 'San Francisco, CA',
    bio: 'Conservatory-trained violinist performing classical, baroque, and contemporary film scores. Available for weddings, galleries, and formal dinners.',
    photo: 'https://images.pexels.com/photos/7097470/pexels-photo-7097470.jpeg?auto=compress&cs=tinysrgb&h=650&w=940',
    priceFrom: 400,
    pricePer: 'hour',
    rating: 4.9,
    reviews: 41,
    verified: true,
    proTier: true,
    members: 1,
    travelRadiusKm: 60,
    topTrack: { title: 'Bach Partita No.2', plays: 23000 },
    spotifyMonthly: 4000,
    soundCloudPlays: 12000,
    activePledges: 2,
    endorsements: ['Stradivarius Trust'],
    tags: ['Weddings', 'Ceremonies', 'Galleries'],
  },
  {
    id: 'a5',
    name: 'Marcus Reed',
    genre: 'Jazz',
    city: 'Chicago, IL',
    bio: 'Saxophonist fluent in jazz, funk, and R&B. Solo or with a trio. 15 years of gigging experience at clubs, weddings, and corporate galas.',
    photo: 'https://images.pexels.com/photos/3984790/pexels-photo-3984790.jpeg?auto=compress&cs=tinysrgb&h=650&w=940',
    priceFrom: 450,
    pricePer: 'hour',
    rating: 4.7,
    reviews: 56,
    verified: true,
    proTier: false,
    members: 1,
    travelRadiusKm: 100,
    topTrack: { title: 'Southside Groove', plays: 67000 },
    spotifyMonthly: 9000,
    soundCloudPlays: 28000,
    activePledges: 0,
    endorsements: ['Selmer'],
    tags: ['Cocktail Hour', 'Galas', 'Clubs'],
  },
  {
    id: 'a6',
    name: 'Salt & Cedar',
    genre: 'Folk',
    city: 'Portland, OR',
    bio: 'Americana duo with harmonies and acoustic warmth. Perfect for barn weddings, breweries, and listening rooms. We bring our own PA.',
    photo: 'https://images.pexels.com/photos/26986907/pexels-photo-26986907.jpeg?auto=compress&cs=tinysrgb&h=650&w=940',
    priceFrom: 600,
    pricePer: 'event',
    rating: 4.8,
    reviews: 29,
    verified: false,
    proTier: false,
    members: 2,
    travelRadiusKm: 120,
    topTrack: { title: 'Riverbend', plays: 31000 },
    spotifyMonthly: 7000,
    soundCloudPlays: 18000,
    activePledges: 1,
    endorsements: [],
    tags: ['Weddings', 'Breweries', 'Listening Rooms'],
  },
  {
    id: 'a7',
    name: 'KOBE',
    genre: 'Hip-Hop',
    city: 'Atlanta, GA',
    bio: 'MC and producer bringing high-energy sets and freestyle skills. Opened for national tours. Available for parties, brand events, and showcases.',
    photo: 'https://images.pexels.com/photos/27290241/pexels-photo-27290241.jpeg?auto=compress&cs=tinysrgb&h=650&w=940',
    priceFrom: 700,
    pricePer: 'event',
    rating: 4.6,
    reviews: 78,
    verified: true,
    proTier: true,
    members: 1,
    travelRadiusKm: 250,
    topTrack: { title: 'Gold Standard', plays: 320000 },
    spotifyMonthly: 41000,
    soundCloudPlays: 180000,
    activePledges: 2,
    endorsements: ['AKG'],
    tags: ['Parties', 'Brand Events', 'Showcases'],
  },
  {
    id: 'a8',
    name: 'Sofia Reyes',
    genre: 'Acoustic',
    city: 'Nashville, TN',
    bio: 'Singer-songwriter with a warm, soulful voice. Covers and originals for coffee shops, private dinners, and intimate ceremonies.',
    photo: 'https://images.pexels.com/photos/28278006/pexels-photo-28278006.jpeg?auto=compress&cs=tinysrgb&h=650&w=940',
    priceFrom: 250,
    pricePer: 'hour',
    rating: 4.9,
    reviews: 34,
    verified: true,
    proTier: false,
    members: 1,
    travelRadiusKm: 70,
    topTrack: { title: 'Paper Planes', plays: 19000 },
    spotifyMonthly: 5000,
    soundCloudPlays: 9000,
    activePledges: 0,
    endorsements: [],
    tags: ['Coffee Shops', 'Private Dinners', 'Ceremonies'],
  },
  {
    id: 'a9',
    name: 'The Vinyl Hours',
    genre: 'Pop',
    city: 'Denver, CO',
    bio: 'Five-piece cover band playing hits from every decade. We read the room and keep the dance floor full. Full lighting and PA included.',
    photo: 'https://images.pexels.com/photos/19262062/pexels-photo-19262062.jpeg?auto=compress&cs=tinysrgb&h=650&w=940',
    priceFrom: 1800,
    pricePer: 'event',
    rating: 4.7,
    reviews: 112,
    verified: true,
    proTier: true,
    members: 5,
    travelRadiusKm: 180,
    topTrack: { title: 'Dance All Night', plays: 78000 },
    spotifyMonthly: 12000,
    soundCloudPlays: 24000,
    activePledges: 3,
    endorsements: ['Yamaha'],
    tags: ['Weddings', 'Corporate', 'Festivals'],
  },
  {
    id: 'a10',
    name: 'Mateo Silva',
    genre: 'Latin',
    city: 'Miami, FL',
    bio: 'Guitarist and vocalist specializing in bossa nova, boleros, and Latin jazz. Perfect for rooftop cocktail hours, wineries, and private dining.',
    photo: 'https://images.pexels.com/photos/27638361/pexels-photo-27638361.jpeg?auto=compress&cs=tinysrgb&h=650&w=940',
    priceFrom: 300,
    pricePer: 'hour',
    rating: 4.8,
    reviews: 47,
    verified: true,
    proTier: false,
    members: 1,
    travelRadiusKm: 90,
    topTrack: { title: 'Costa Azul', plays: 42000 },
    spotifyMonthly: 8000,
    soundCloudPlays: 15000,
    activePledges: 1,
    endorsements: ['Gibson'],
    tags: ['Cocktail Hour', 'Wineries', 'Private Dining'],
  },
  {
    id: 'a11',
    name: 'Clara Bishop',
    genre: 'Blues',
    city: 'Memphis, TN',
    bio: 'Blues guitarist and vocalist with a raw, soulful sound. Solo, duo, or full band. We have held residencies at three Beale Street venues.',
    photo: 'https://images.pexels.com/photos/8043896/pexels-photo-8043896.jpeg?auto=compress&cs=tinysrgb&h=650&w=940',
    priceFrom: 500,
    pricePer: 'event',
    rating: 4.6,
    reviews: 38,
    verified: false,
    proTier: false,
    members: 1,
    travelRadiusKm: 110,
    topTrack: { title: 'Delta Bound', plays: 25000 },
    spotifyMonthly: 6000,
    soundCloudPlays: 11000,
    activePledges: 0,
    endorsements: [],
    tags: ['Clubs', 'Festivals', 'Private Events'],
  },
  {
    id: 'a12',
    name: 'Echo Park',
    genre: 'Electronic',
    city: 'Brooklyn, NY',
    bio: 'Live electronic duo blending synth textures with live percussion. We bring a full visual rig and tailor every set to the room.',
    photo: 'https://images.pexels.com/photos/5203816/pexels-photo-5203816.jpeg?auto=compress&cs=tinysrgb&h=650&w=940',
    priceFrom: 950,
    pricePer: 'event',
    rating: 4.8,
    reviews: 64,
    verified: true,
    proTier: true,
    members: 2,
    travelRadiusKm: 160,
    topTrack: { title: 'Parallel', plays: 190000 },
    spotifyMonthly: 31000,
    soundCloudPlays: 95000,
    activePledges: 2,
    endorsements: ['Roland', 'Native Instruments'],
    tags: ['Clubs', 'Galleries', 'Private Parties'],
  },
];

export const GENRES: Genre[] = [
  'Rock', 'Jazz', 'Electronic', 'Classical', 'Folk',
  'Pop', 'Hip-Hop', 'Latin', 'Blues', 'Reggae', 'Acoustic',
];

export const CITIES = [
  'Austin, TX', 'New Orleans, LA', 'Los Angeles, CA', 'San Francisco, CA',
  'Chicago, IL', 'Portland, OR', 'Atlanta, GA', 'Nashville, TN',
  'Denver, CO', 'Miami, FL', 'Memphis, TN', 'Brooklyn, NY',
];

export type Conversation = {
  id: string;
  artistId: string;
  lastMessage: string;
  timestamp: string;
  unread: boolean;
  messages: { from: 'me' | 'artist'; text: string; time: string }[];
};

export const CONVERSATIONS: Conversation[] = [
  {
    id: 'c1',
    artistId: 'a1',
    lastMessage: 'Sounds great — we can do both ceremony and reception.',
    timestamp: '2h ago',
    unread: true,
    messages: [
      { from: 'me', text: 'Hi! Are you available October 12 for a wedding in Austin?', time: '10:14 AM' },
      { from: 'artist', text: 'Yes, that date works. What time is the ceremony?', time: '10:31 AM' },
      { from: 'me', text: '3pm ceremony, 6pm reception. Can you do both?', time: '10:33 AM' },
      { from: 'artist', text: 'Sounds great — we can do both ceremony and reception.', time: '10:45 AM' },
    ],
  },
  {
    id: 'c2',
    artistId: 'a2',
    lastMessage: 'I have a trio available that evening. Shall I send the setlist?',
    timestamp: '1d ago',
    unread: false,
    messages: [
      { from: 'me', text: 'Do you have a trio setup for a cocktail hour?', time: 'Yesterday' },
      { from: 'artist', text: 'I have a trio available that evening. Shall I send the setlist?', time: 'Yesterday' },
    ],
  },
  {
    id: 'c3',
    artistId: 'a4',
    lastMessage: 'I can play the Bach and a contemporary piece for the processional.',
    timestamp: '3d ago',
    unread: false,
    messages: [
      { from: 'me', text: 'Can you play during the ceremony and cocktail hour?', time: 'Mon' },
      { from: 'artist', text: 'I can play the Bach and a contemporary piece for the processional.', time: 'Mon' },
    ],
  },
];

export type Booking = {
  id: string;
  artistId: string;
  event: string;
  date: string;
  status: 'Confirmed' | 'In Escrow' | 'Pending' | 'Completed';
  total: number;
};

export const BOOKINGS: Booking[] = [
  { id: 'b1', artistId: 'a1', event: 'Wedding — Austin', date: 'Oct 12, 2026', status: 'In Escrow', total: 2400 },
  { id: 'b2', artistId: 'a2', event: 'Cocktail Hour — NOLA', date: 'Nov 5, 2026', status: 'Confirmed', total: 1050 },
  { id: 'b3', artistId: 'a4', event: 'Gallery Opening — SF', date: 'Sep 28, 2026', status: 'Pending', total: 800 },
  { id: 'b4', artistId: 'a9', event: 'Corporate Gala — Denver', date: 'Aug 15, 2026', status: 'Completed', total: 1800 },
];

export type Referral = {
  id: string;
  name: string;
  email: string;
  date: string;
  status: 'Registrado' | 'Primer booking' | 'Crédito ganado';
  amount: number;
};

export const REFERRALS: Referral[] = [
  { id: 'r1', name: 'Carla M.', email: 'carla.m@gmail.com', date: 'Ago 12, 2026', status: 'Crédito ganado', amount: 10 },
  { id: 'r2', name: 'Diego R.', email: 'diego.r@gmail.com', date: 'Ago 20, 2026', status: 'Primer booking', amount: 0 },
  { id: 'r3', name: 'Sofía P.', email: 'sofia.p@gmail.com', date: 'Sep 2, 2026', status: 'Registrado', amount: 0 },
];

export const REFERRAL_STATS = {
  totalInvited: 14,
  totalRegistered: 8,
  totalEarned: 30,
  pendingCredit: 20,
};

export const ACTIVITY_TICKER_MESSAGES = [
  '🔴 En vivo: 3 personas están viendo a DJ Mateo Rivera ahora',
  '✅ Laura G. acaba de reservar a Chef Ana Torrico',
  '⭐ Roberto S. dejó una reseña de 5 estrellas a Banda Los Ceibos',
  '🎉 23 eventos reservados esta semana en Santa Cruz',
];

export const REVIEW_TAGS = [
  'Puntual', 'Profesional', 'Recomendaría', 'Superó expectativas', 'Volvería a contratar',
] as const;

export type ReviewTag = typeof REVIEW_TAGS[number];

export const PLEDGE_TIERS = [
  { amount: 5, perks: 'Early access to new tracks + monthly mixtape', backers: 142 },
  { amount: 15, perks: 'Above + exclusive acoustic sessions + merch discount', backers: 68 },
  { amount: 50, perks: 'Above + private livestream concert + meet & greet', backers: 19 },
];

export type ComboCategory = 'musica' | 'fotografia' | 'gastronomia' | 'entretenimiento';

export const COMBO_CATEGORIES: { id: ComboCategory; label: string; emoji: string; required: boolean; genres: Genre[] }[] = [
  { id: 'musica', label: 'Música / DJ', emoji: '🎧', required: true, genres: ['Rock', 'Jazz', 'Electronic', 'Classical', 'Folk', 'Pop', 'Hip-Hop', 'Latin', 'Blues', 'Reggae', 'Acoustic'] },
  { id: 'fotografia', label: 'Fotografía', emoji: '📷', required: false, genres: ['Acoustic'] },
  { id: 'gastronomia', label: 'Gastronomía', emoji: '👨‍🍳', required: false, genres: ['Acoustic'] },
  { id: 'entretenimiento', label: 'Entretenimiento', emoji: '🎉', required: false, genres: ['Hip-Hop', 'Pop', 'Electronic'] },
];

export type ComboSuggestion = {
  id: string;
  name: string;
  emoji: string;
  description: string;
  artistIds: string[];
};

export const POPULAR_COMBOS: ComboSuggestion[] = [
  {
    id: 'combo-boda',
    name: 'Boda completa',
    emoji: '🥂',
    description: 'DJ + Banda + Fotografía + Chef para el día más especial',
    artistIds: ['a3', 'a1', 'a8', 'a2'],
  },
  {
    id: 'combo-corporativo',
    name: 'Corporativo premium',
    emoji: '🏢',
    description: 'Orquesta + Fotografía + Entretenimiento para tu evento empresarial',
    artistIds: ['a9', 'a8', 'a7'],
  },
  {
    id: 'combo-fiesta',
    name: 'Fiesta privada',
    emoji: '🥳',
    description: 'DJ + Animación para una noche inolvidable',
    artistIds: ['a12', 'a7'],
  },
];

export const ARTIST_CATEGORIES = [
  'DJ', 'Músico', 'Chef', 'Fotógrafo', 'Animador', 'Bailarín',
] as const;

export type ArtistCategory = typeof ARTIST_CATEGORIES[number];

export function getComboDiscount(count: number): number {
  if (count >= 4) return 0.2;
  if (count >= 3) return 0.15;
  if (count >= 2) return 0.1;
  return 0;
}

export function getArtistForCategory(id: ComboCategory): Artist[] {
  const cat = COMBO_CATEGORIES.find((c) => c.id === id);
  if (!cat) return ARTISTS;
  if (id === 'musica') return ARTISTS.filter((a) => cat.genres.includes(a.genre));
  if (id === 'entretenimiento') return ARTISTS.filter((a) => a.genre === 'Hip-Hop' || a.genre === 'Pop' || a.genre === 'Electronic');
  return ARTISTS.filter((a) => a.priceFrom <= 500);
}

export function getArtist(id: string): Artist | undefined {
  return ARTISTS.find((a) => a.id === id);
}
