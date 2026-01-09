const TURKISH_CHAR_MAP = {
  "ç": "c",
  "Ç": "c",
  "ğ": "g",
  "Ğ": "g",
  "ı": "i",
  "I": "i",
  "İ": "i",
  "ö": "o",
  "Ö": "o",
  "ş": "s",
  "Ş": "s",
  "ü": "u",
  "Ü": "u",
};

const ABBREVIATIONS = {
  "mah": "mahallesi",
  "mahalle": "mahallesi",
  "mh": "mahallesi",
  "cad": "cadde",
  "cd": "cadde",
  "cadde": "cadde",
  "sok": "sokak",
  "sk": "sokak",
  "sokak": "sokak",
  "bulv": "bulvar",
  "blv": "bulvar",
  "bulvar": "bulvar",
  "no": "no",
  "no.": "no",
  "num": "no",
  "numara": "no",
  "apt": "apartman",
  "apartman": "apartman",
  "d": "daire",
  "daire": "daire",
  "kat": "kat",
  "blok": "blok",
  "site": "site",
};

const STOPWORDS = new Set([
  "apt",
  "apartman",
  "blok",
  "no",
  "daire",
  "kat",
  "site",
]);

const normalizeTurkishChars = (value) =>
  value.replace(/[çÇğĞıIİöÖşŞüÜ]/g, (char) => TURKISH_CHAR_MAP[char] || char);

const normalizeAddress = (input) => {
  if (!input) {
    return "";
  }

  const lower = normalizeTurkishChars(input)
    .toLocaleLowerCase("tr-TR")
    .replace(/[^\w\s]/g, " ")
    .replace(/\s+/g, " ")
    .trim();

  const tokens = lower.split(" ").map((token) => {
    if (!token) {
      return "";
    }

    const normalized = ABBREVIATIONS[token] || token;
    return normalized;
  });

  return tokens.filter(Boolean).join(" ");
};

const toTokenSet = (input) => {
  const normalized = normalizeAddress(input);
  if (!normalized) {
    return new Set();
  }

  return new Set(
    normalized
      .split(" ")
      .filter(Boolean)
      .filter((token) => !STOPWORDS.has(token))
  );
};

const getNumberTokens = (input) => {
  const normalized = normalizeAddress(input);
  if (!normalized) {
    return new Set();
  }

  return new Set(
    normalized
      .split(" ")
      .filter(Boolean)
      .filter((token) => /\d/.test(token))
  );
};

const hasMatchingNumberToken = (a, b) => {
  const numbersA = getNumberTokens(a);
  const numbersB = getNumberTokens(b);

  if (!numbersA.size || !numbersB.size) {
    return false;
  }

  for (const token of numbersA) {
    if (numbersB.has(token)) {
      return true;
    }
  }

  return false;
};

const jaccardSimilarity = (a, b) => {
  const setA = toTokenSet(a);
  const setB = toTokenSet(b);

  if (!setA.size && !setB.size) {
    return 1;
  }

  let intersection = 0;
  for (const token of setA) {
    if (setB.has(token)) {
      intersection += 1;
    }
  }

  const union = setA.size + setB.size - intersection;
  return union === 0 ? 0 : intersection / union;
};

const jaroWinklerSimilarity = (a, b) => {
  const s1 = normalizeAddress(a);
  const s2 = normalizeAddress(b);

  if (!s1 && !s2) {
    return 1;
  }

  if (!s1 || !s2) {
    return 0;
  }

  const len1 = s1.length;
  const len2 = s2.length;
  const matchDistance = Math.max(Math.floor(Math.max(len1, len2) / 2) - 1, 0);

  const s1Matches = new Array(len1).fill(false);
  const s2Matches = new Array(len2).fill(false);

  let matches = 0;
  for (let i = 0; i < len1; i += 1) {
    const start = Math.max(0, i - matchDistance);
    const end = Math.min(i + matchDistance + 1, len2);

    for (let j = start; j < end; j += 1) {
      if (s2Matches[j]) {
        continue;
      }

      if (s1[i] !== s2[j]) {
        continue;
      }

      s1Matches[i] = true;
      s2Matches[j] = true;
      matches += 1;
      break;
    }
  }

  if (matches === 0) {
    return 0;
  }

  let transpositions = 0;
  let k = 0;
  for (let i = 0; i < len1; i += 1) {
    if (!s1Matches[i]) {
      continue;
    }

    while (!s2Matches[k]) {
      k += 1;
    }

    if (s1[i] !== s2[k]) {
      transpositions += 1;
    }

    k += 1;
  }

  const m = matches;
  const jaro =
    (m / len1 + m / len2 + (m - transpositions / 2) / m) / 3;

  let prefix = 0;
  const maxPrefix = 4;
  while (prefix < maxPrefix && prefix < len1 && prefix < len2) {
    if (s1[prefix] !== s2[prefix]) {
      break;
    }
    prefix += 1;
  }

  const scaling = 0.1;
  return jaro + prefix * scaling * (1 - jaro);
};

const addressSimilarity = (a, b) => {
  const jaro = jaroWinklerSimilarity(a, b);
  const jaccard = jaccardSimilarity(a, b);
  return 0.6 * jaro + 0.4 * jaccard;
};

const maskToken = (token) => {
  if (!token) {
    return "";
  }

  const len = token.length;
  if (len <= 3) {
    return token;
  }

  const keepStart = len >= 8 ? 1 : 2;
  const keepEnd = len >= 8 ? 2 : 1;
  const maskedLength = len - keepStart - keepEnd;

  if (maskedLength <= 0) {
    return token;
  }

  return (
    token.slice(0, keepStart) +
    "*".repeat(maskedLength) +
    token.slice(len - keepEnd)
  );
};

const maskAddress = (input) => {
  const normalized = normalizeAddress(input);
  if (!normalized) {
    return "";
  }

  const tokens = normalized.split(" ");
  const maskedTokens = [];

  for (const token of tokens) {
    if (!token) {
      continue;
    }
    if (STOPWORDS.has(token)) {
      continue;
    }
    if (/\d/.test(token)) {
      continue;
    }

    maskedTokens.push(maskToken(token));
    if (maskedTokens.length >= 3) {
      break;
    }
  }

  return maskedTokens.join(" ");
};

module.exports = {
  normalizeAddress,
  addressSimilarity,
  maskAddress,
  hasMatchingNumberToken,
};
