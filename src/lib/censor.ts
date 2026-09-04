import { PlayerReview, ReviewReply } from '../types';

/** En uzunlar önce; kısa kökler yanlış pozitif üretmesin. */
const PROFANITY = [
  'amına koyayım',
  'amina koyayim',
  'ananı sikeyim',
  'anani sikeyim',
  'orospu çocuğu',
  'orospu cocugu',
  'orospucocugu',
  'orospuevladı',
  'siktirgit',
  'siktir lan',
  'motherfucker',
  'amcık',
  'amcik',
  'amına',
  'amina',
  'sikeyim',
  'sikiş',
  'sikis',
  'siktir',
  'yarrak',
  'yarak',
  'orospu',
  'götveren',
  'gotveren',
  'götlek',
  'gotlek',
  'ibne',
  'pezevenk',
  'pezevenk',
  'kahpe',
  'serefsiz',
  'şerefsiz',
  'piçkurusu',
  'pic kurusu',
  'asshole',
  'fuck',
  'shit',
  'bitch',
  'cunt',
  'whore',
  'slut',
  'dick',
  'pussy',
  'faggot',
  'nigger',
  'amk',
  'amq',
  'aq',
  'oç',
  'piç',
  'göt',
  'sik',
];

function escapeRegExp(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

function letterPattern(char: string): string {
  const lower = char.toLocaleLowerCase('tr-TR');
  if (lower === 'i' || lower === 'ı' || lower === 'İ') return '[iıîIİ1!]';
  if (lower === 'o' || lower === 'ö') return '[oö0]';
  if (lower === 'u' || lower === 'ü') return '[uü]';
  if (lower === 's' || lower === 'ş') return '[sş$5]';
  if (lower === 'c' || lower === 'ç') return '[cç]';
  if (lower === 'g' || lower === 'ğ') return '[gğ]';
  if (lower === 'a') return '[aâ@4]';
  if (lower === 'e') return '[e3]';
  return escapeRegExp(char);
}

function phraseToPattern(phrase: string): string {
  return phrase
    .trim()
    .split(/\s+/)
    .map((word) =>
      [...word]
        .map((ch, index, all) => {
          const piece = `${letterPattern(ch)}+`;
          return index === all.length - 1 ? piece : `${piece}[\\s._\\-*]*`;
        })
        .join(''),
    )
    .join('[\\s._\\-*]+');
}

const PROFANITY_RE = new RegExp(
  `(?<![a-zçğıöşüA-ZÇĞİÖŞÜ0-9])(?:${PROFANITY.map(phraseToPattern).join('|')})(?![a-zçğıöşüA-ZÇĞİÖŞÜ0-9])`,
  'giu',
);

export function censorProfanity(text: string | null | undefined): string {
  if (!text) return text || '';
  return text.replace(PROFANITY_RE, (match) => '*'.repeat(match.length));
}

export function sanitizeReview(review: PlayerReview): PlayerReview {
  return {
    ...review,
    comment: censorProfanity(review.comment || ''),
    authorName: censorProfanity(review.authorName || ''),
    replies: review.replies?.map((reply) => sanitizeReply(reply)),
  };
}

export function sanitizeReply(reply: ReviewReply): ReviewReply {
  return {
    ...reply,
    comment: censorProfanity(reply.comment || ''),
    authorName: censorProfanity(reply.authorName || ''),
  };
}
