import { getThreadMessages } from '../db/store.js';

const ID_CHARSET = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
const FREE_RANDOM_PATTERN = /^[A-HJ-NP-Z2-9]{4}-[A-HJ-NP-Z2-9]{4}$/;

const DICTIONARY_WORDS = new Set([
  'LOVE', 'LIFE', 'HOME', 'WORK', 'TEAM', 'COOL', 'NICE', 'GOOD', 'BEST', 'REAL',
  'TRUE', 'OPEN', 'CHAT', 'TALK', 'MEET', 'DATE', 'GIRL', 'BOYS', 'GUYS', 'BABY',
  'DEAR', 'HONEY', 'MOM', 'DAD', 'SON', 'SUN', 'MOON', 'STAR', 'FIRE', 'RAIN',
  'SNOW', 'WIND', 'WAVE', 'BLUE', 'REDS', 'PINK', 'GOLD', 'DARK', 'LIGHT', 'NIGHT',
  'VOID', 'NEON', 'ECHO', 'PULSE', 'DRIFT', 'FLUX', 'GHOST', 'SHADOW', 'SIGNAL',
  'CRYPTO', 'ZERO', 'TRACE', 'DREAM', 'ROOM', 'LINE', 'WAVE', 'CORE', 'NET', 'CALL',
  'SECRET', 'HIDDEN', 'PRIVATE', 'PUBLIC', 'HELLO', 'WORLD', 'TEST', 'DEMO', 'FREE',
  'PAID', 'VIP', 'BOSS', 'KING', 'QUEEN', 'LORD', 'GOD', 'HELL', 'LUCK', 'HOPE',
  'FEAR', 'DEAD', 'ALIVE', 'SOUL', 'MIND', 'HEART', 'PARTY', 'CLUB', 'BEACH', 'CITY',
  'NYC', 'LA', 'MIAMI', 'PARIS', 'TOKYO', 'CAFE', 'BAR', 'GYM', 'YOGA', 'GAME',
  'PLAY', 'WIN', 'LOSE', 'HELP', 'SOS', 'STOP', 'WAIT', 'BACK', 'SOON', 'LATER',
  'TODAY', 'NIGHT', 'MORN', 'NOON', 'WEEK', 'YEAR', 'JOHN', 'MIKE', 'DAVE', 'ALEX',
  'SAM', 'MAX', 'LEO', 'KAI', 'ZOE', 'AMY', 'KATE', 'ANNA', 'MARY', 'LISA', 'JANE',
  'EMMA', 'LUKE', 'RYAN', 'ERIC', 'PAUL', 'MARK', 'MATT', 'JOSH', 'NOAH', 'LIAM',
  'JAKE', 'CHAD', 'KYLE', 'COLE', 'DEAN', 'ROSE', 'LILY', 'JADE', 'RUBY', 'JUNE',
  'JULY', 'APRIL', 'MAY', 'AUG', 'SEPT', 'OCT', 'NOV', 'DEC', 'MON', 'TUE', 'WED',
  'THU', 'FRI', 'SAT', 'ANGEL', 'DEMON', 'MAGIC', 'WITCH', 'FAIRY', 'ALIEN', 'ROBOT',
  'CYBER', 'HACK', 'CODE', 'DATA', 'BYTE', 'LINK', 'NODE', 'GRID', 'ZONE', 'AREA',
]);

const VANITY_BLOCKLIST = new Set([
  'NEON-DREAM', 'GHOST-LINE', 'SIGNAL-7', 'CRYPTO-WAVE', 'ECHO-ROOM', 'ZERO-TRACE',
  'PULSE-9', 'DRIFT-CORE', 'FLUX-88', 'SHADOW-NET', 'MIDNIGHT-PULSE', 'VOID-2026',
  'NIGHT-CALL', 'STATIC-42', 'LOVE-YOU', 'MISS-YOU', 'TEXT-ME', 'CALL-ME', 'HMU-NOW',
  'NYC-NIGHT', 'LA-VIBES', 'MIAMI-HEAT', 'PARIS-LUV', 'TOKYO-DRIFT', 'CAFE-CHAT',
  'SECRET-1', 'PRIVATE-1', 'OUR-ROOM', 'OUR-CHAT', 'JUST-US', 'FOR-YOU', 'FOR-ME',
]);

function segmentHasDigit(segment) {
  return /\d/.test(segment);
}

function isDictionarySegment(segment) {
  if (DICTIONARY_WORDS.has(segment)) return true;
  if (segment.length >= 3 && DICTIONARY_WORDS.has(segment.slice(0, 3))) return true;
  return false;
}

function segmentEntropy(segment) {
  return new Set(segment).size;
}

export function isFreeRandomChannelId(threadId) {
  if (!FREE_RANDOM_PATTERN.test(threadId)) return false;
  if (VANITY_BLOCKLIST.has(threadId)) return false;

  const [left, right] = threadId.split('-');
  if (!segmentHasDigit(left) || !segmentHasDigit(right)) return false;
  if (isDictionarySegment(left) || isDictionarySegment(right)) return false;
  if (segmentEntropy(left) < 3 || segmentEntropy(right) < 3) return false;

  const lettersOnly = /^[A-Z]+$/;
  if (lettersOnly.test(left) || lettersOnly.test(right)) return false;

  return true;
}

export function isVanityChannelId(threadId) {
  return !isFreeRandomChannelId(threadId);
}

export function validateFreeTierChannelId(threadId) {
  if (isFreeRandomChannelId(threadId)) {
    return { allowed: true };
  }

  const existing = getThreadMessages(threadId, 1);
  if (existing.count > 0) {
    return { allowed: true, joiningExisting: true };
  }

  return {
    allowed: false,
    reason: 'Custom channel IDs require a paid tier. Use a random ID or upgrade your plan.',
    code: 'VANITY_ID_REQUIRES_TIER',
  };
}

export function generateRandomChannelId() {
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