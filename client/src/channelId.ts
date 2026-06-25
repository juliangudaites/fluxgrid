const ID_CHARSET = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
const FREE_RANDOM_PATTERN = /^[A-HJ-NP-Z2-9]{4}-[A-HJ-NP-Z2-9]{4}$/;

const DICTIONARY_WORDS = new Set([
  'LOVE', 'LIFE', 'HOME', 'WORK', 'TEAM', 'COOL', 'NICE', 'GOOD', 'BEST', 'REAL',
  'TRUE', 'OPEN', 'CHAT', 'TALK', 'MEET', 'DATE', 'GIRL', 'BOYS', 'GUYS', 'BABY',
  'DEAR', 'HONEY', 'MOM', 'DAD', 'SON', 'SUN', 'MOON', 'STAR', 'FIRE', 'RAIN',
  'SNOW', 'WIND', 'WAVE', 'BLUE', 'REDS', 'PINK', 'GOLD', 'DARK', 'LIGHT', 'NIGHT',
  'VOID', 'NEON', 'ECHO', 'PULSE', 'DRIFT', 'FLUX', 'GHOST', 'SHADOW', 'SIGNAL', 'FLUXGRID',
  'CRYPTO', 'ZERO', 'TRACE', 'DREAM', 'ROOM', 'LINE', 'CORE', 'NET', 'CALL',
  'SECRET', 'HIDDEN', 'PRIVATE', 'PUBLIC', 'HELLO', 'WORLD', 'TEST', 'DEMO', 'FREE',
  'PAID', 'VIP', 'BOSS', 'KING', 'QUEEN', 'LORD', 'GOD', 'HELL', 'LUCK', 'HOPE',
  'FEAR', 'DEAD', 'ALIVE', 'SOUL', 'MIND', 'HEART', 'PARTY', 'CLUB', 'BEACH', 'CITY',
  'NYC', 'CAFE', 'BAR', 'GYM', 'YOGA', 'GAME', 'PLAY', 'WIN', 'LOSE', 'HELP', 'SOS',
  'STOP', 'WAIT', 'BACK', 'SOON', 'LATER', 'TODAY', 'MORN', 'NOON', 'WEEK', 'YEAR',
  'JOHN', 'MIKE', 'DAVE', 'ALEX', 'SAM', 'MAX', 'LEO', 'KAI', 'ZOE', 'AMY', 'KATE',
  'ANNA', 'MARY', 'LISA', 'JANE', 'EMMA', 'LUKE', 'RYAN', 'ERIC', 'PAUL', 'MARK',
  'MATT', 'JOSH', 'NOAH', 'LIAM', 'JAKE', 'CHAD', 'KYLE', 'COLE', 'DEAN', 'ROSE',
  'LILY', 'JADE', 'RUBY', 'JUNE', 'JULY', 'APRIL', 'ANGEL', 'DEMON', 'MAGIC', 'WITCH',
  'FAIRY', 'ALIEN', 'ROBOT', 'CYBER', 'HACK', 'CODE', 'DATA', 'BYTE', 'LINK', 'NODE',
  'GRID', 'ZONE', 'AREA',
]);

const VANITY_BLOCKLIST = new Set([
  'NEON-DREAM', 'GHOST-LINE', 'SIGNAL-7', 'CRYPTO-WAVE', 'ECHO-ROOM', 'ZERO-TRACE',
  'PULSE-9', 'DRIFT-CORE', 'FLUX-88', 'SHADOW-NET', 'MIDNIGHT-PULSE', 'FLUXGRID-2026',
  'NIGHT-CALL', 'STATIC-42', 'LOVE-YOU', 'MISS-YOU', 'TEXT-ME', 'CALL-ME', 'HMU-NOW',
  'NYC-NIGHT', 'LA-VIBES', 'MIAMI-HEAT', 'PARIS-LUV', 'TOKYO-DRIFT', 'CAFE-CHAT',
  'SECRET-1', 'PRIVATE-1', 'OUR-ROOM', 'OUR-CHAT', 'JUST-US', 'FOR-YOU', 'FOR-ME',
]);

function segmentHasDigit(segment: string) {
  return /\d/.test(segment);
}

function isDictionarySegment(segment: string) {
  if (DICTIONARY_WORDS.has(segment)) return true;
  if (segment.length >= 3 && DICTIONARY_WORDS.has(segment.slice(0, 3))) return true;
  return false;
}

function segmentEntropy(segment: string) {
  return new Set(segment).size;
}

export function isFreeRandomChannelId(threadId: string): boolean {
  const id = threadId.trim().toUpperCase();
  if (!FREE_RANDOM_PATTERN.test(id)) return false;
  if (VANITY_BLOCKLIST.has(id)) return false;

  const [left, right] = id.split('-');
  if (!segmentHasDigit(left) || !segmentHasDigit(right)) return false;
  if (isDictionarySegment(left) || isDictionarySegment(right)) return false;
  if (segmentEntropy(left) < 3 || segmentEntropy(right) < 3) return false;

  const lettersOnly = /^[A-Z]+$/;
  if (lettersOnly.test(left) || lettersOnly.test(right)) return false;

  return true;
}

export function isVanityChannelId(threadId: string): boolean {
  return !isFreeRandomChannelId(threadId.trim().toUpperCase());
}

export function generateThreadId(): string {
  const pick = () => ID_CHARSET[Math.floor(Math.random() * ID_CHARSET.length)];
  const segment = () => {
    let s = '';
    do {
      s = Array.from({ length: 4 }, pick).join('');
    } while (!segmentHasDigit(s) || segmentEntropy(s) < 3 || /^[A-Z]+$/.test(s));
    return s;
  };
  return `${segment()}-${segment()}`;
}