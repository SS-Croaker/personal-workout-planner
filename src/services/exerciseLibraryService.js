import exerciseLibraryRegistry from '../data/exerciseLibraryRegistry.json';

function normalizeText(value) {
  return String(value || '')
    .normalize('NFKD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .trim();
}

function normalizeComparableText(value) {
  return normalizeText(value)
    .replace(/[^a-z0-9]+/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

function tokenizeText(value) {
  return normalizeComparableText(value)
    .split(/\s+/)
    .filter(Boolean);
}

function slugifyExerciseName(name) {
  return normalizeText(name)
    .replace(/&/g, ' and ')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .replace(/-{2,}/g, '-');
}

const ALIAS_PREFIX_PATTERNS = [
  /^barbell\s+/,
  /^dumbbell\s+/,
  /^machine\s+/,
  /^cable\s+/,
  /^smith machine\s+/,
  /^seated cable\s+/,
  /^medicine ball\s+/,
  /^kettlebell\s+/,
  /^bodyweight\s+/,
  /^landmine\s+/,
  /^resistance band\s+/,
  /^ez bar\s+/,
  /^trap bar\s+/,
];

const MIN_CONFIDENCE_TO_MATCH = 0.78;
const MIN_CONFIDENCE_MARGIN = 0.05;
const MOVEMENT_MODIFIER_TOKENS = new Set([
  'seated',
  'standing',
  'incline',
  'decline',
  'flat',
  'single',
  'single-arm',
  'single-leg',
  'one',
  'one-arm',
  'one-leg',
  'alternating',
  'lying',
  'high',
  'low',
  'rear',
  'front',
  'back',
]);
const LIBRARY_EQUIPMENT_TAGS = ['barbell', 'dumbbells', 'machine', 'cables', 'kettlebells', 'bodyweight', 'sandbag', 'plate'];

function normalizeWorkoutEquipment(equipment) {
  switch (normalizeText(equipment)) {
    case 'barbell':
      return 'barbell';
    case 'dumbbells':
    case 'dumbbell':
      return 'dumbbells';
    case 'machine':
      return 'machine';
    case 'cables':
    case 'cable':
      return 'cables';
    case 'kettlebells':
    case 'kettlebell':
      return 'kettlebells';
    case 'bodyweight':
      return 'bodyweight';
    case 'sandbag':
      return 'sandbag';
    case 'plate':
    case 'plates':
      return 'plate';
    default:
      return '';
  }
}

function extractLibraryEquipmentTags(equipmentRequired) {
  const normalizedEquipment = normalizeText(equipmentRequired);
  const tags = new Set();

  if (!normalizedEquipment) {
    return [];
  }

  if (normalizedEquipment.includes('dumbbell')) {
    tags.add('dumbbells');
  }
  if (normalizedEquipment.includes('barbell') || normalizedEquipment.includes('ez bar') || normalizedEquipment.includes('trap bar') || normalizedEquipment.includes('straight bar')) {
    tags.add('barbell');
  }
  if (normalizedEquipment.includes('machine') || normalizedEquipment.includes('smith') || normalizedEquipment.includes('ghd') || normalizedEquipment.includes('deck')) {
    tags.add('machine');
  }
  if (normalizedEquipment.includes('cable') || normalizedEquipment.includes('pulley')) {
    tags.add('cables');
  }
  if (normalizedEquipment.includes('kettlebell')) {
    tags.add('kettlebells');
  }
  if (
    normalizedEquipment.includes('mat') ||
    normalizedEquipment.includes('wall') ||
    normalizedEquipment.includes('pull bar') ||
    normalizedEquipment.includes('parallel bars')
  ) {
    tags.add('bodyweight');
  }
  if (normalizedEquipment.includes('sandbag')) {
    tags.add('sandbag');
  }
  if (normalizedEquipment.includes('plate')) {
    tags.add('plate');
  }

  return Array.from(tags);
}

function getPrimaryEquipmentTag(equipmentTags) {
  return LIBRARY_EQUIPMENT_TAGS.find((tag) => equipmentTags.includes(tag)) || '';
}

function getEquipmentDisplayLabel(equipmentTag) {
  switch (equipmentTag) {
    case 'barbell':
      return 'barbell';
    case 'dumbbells':
      return 'dumbbell';
    case 'machine':
      return 'machine';
    case 'cables':
      return 'cable';
    case 'kettlebells':
      return 'kettlebell';
    case 'bodyweight':
      return 'bodyweight';
    case 'sandbag':
      return 'sandbag';
    case 'plate':
      return 'plate';
    default:
      return '';
  }
}

function buildExerciseAliases(exercise) {
  const aliases = new Set(
    Array.isArray(exercise.aliases)
      ? exercise.aliases.map((alias) => String(alias || '').trim()).filter(Boolean)
      : [],
  );

  const normalizedName = normalizeText(exercise.exercise_name);
  ALIAS_PREFIX_PATTERNS.forEach((pattern) => {
    const alias = normalizedName.replace(pattern, '').trim();
    if (alias && alias !== normalizedName) {
      aliases.add(alias);
    }
  });

  const equipmentTags = extractLibraryEquipmentTags(exercise.equipment_required);
  const primaryEquipmentTag = getPrimaryEquipmentTag(equipmentTags);
  const primaryEquipmentLabel = getEquipmentDisplayLabel(primaryEquipmentTag);

  if (
    exercise.category === 'Shoulders' &&
    (normalizedName.includes('shoulder press') || normalizedName.includes('overhead press')) &&
    primaryEquipmentLabel
  ) {
    aliases.add(`${primaryEquipmentLabel} press`);
    aliases.add(`seated ${primaryEquipmentLabel} press`);
    aliases.add(`standing ${primaryEquipmentLabel} press`);
    aliases.add(`overhead ${primaryEquipmentLabel} press`);
  }

  return Array.from(aliases);
}

const exerciseRegistry = exerciseLibraryRegistry.map((exercise) => ({
  ...exercise,
  aliases: buildExerciseAliases(exercise),
  _normalizedName: normalizeText(exercise.exercise_name),
  _normalizedCategory: normalizeText(exercise.category),
  _comparableCategory: normalizeComparableText(exercise.category),
  _normalizedEquipment: normalizeText(exercise.equipment_required),
  _equipmentTags: extractLibraryEquipmentTags(exercise.equipment_required),
  _normalizedMainMuscles: normalizeText(exercise.main_muscles),
  _normalizedSecondaryMuscles: normalizeText(exercise.secondary_muscles),
  _normalizedAliases: buildExerciseAliases(exercise).map((alias) => normalizeText(alias)),
  _comparableName: normalizeComparableText(exercise.exercise_name),
  _comparableAliases: buildExerciseAliases(exercise).map((alias) => normalizeComparableText(alias)),
  _nameTokens: tokenizeText(exercise.exercise_name),
  _categoryTokens: tokenizeText(exercise.category),
}));

const exercisesById = new Map(exerciseRegistry.map((exercise) => [exercise.id, exercise]));
const exercisesBySlug = new Map(exerciseRegistry.map((exercise) => [exercise.slug, exercise]));
const exercisesByNormalizedName = new Map(
  exerciseRegistry.map((exercise) => [exercise._normalizedName, exercise]),
);
const exercisesByComparableName = new Map(
  exerciseRegistry.map((exercise) => [exercise._comparableName, exercise]),
);
const exercisesByAlias = new Map();

exerciseRegistry.forEach((exercise) => {
  exercise._normalizedAliases.forEach((alias) => {
    if (!exercisesByAlias.has(alias)) {
      exercisesByAlias.set(alias, exercise);
    }
  });
  exercise._comparableAliases.forEach((alias) => {
    if (!exercisesByAlias.has(alias)) {
      exercisesByAlias.set(alias, exercise);
    }
  });
});

function stripInternalFields(exercise) {
  if (!exercise) {
    return null;
  }

  const {
    _normalizedName,
    _normalizedCategory,
    _comparableCategory,
    _normalizedEquipment,
    _equipmentTags,
    _normalizedMainMuscles,
    _normalizedSecondaryMuscles,
    _normalizedAliases,
    _comparableName,
    _comparableAliases,
    _nameTokens,
    _categoryTokens,
    ...publicExercise
  } = exercise;

  return publicExercise;
}

function buildSearchHaystack(exercise) {
  return [
    exercise._normalizedName,
    exercise._normalizedCategory,
    exercise._normalizedEquipment,
    exercise._normalizedMainMuscles,
    exercise._normalizedSecondaryMuscles,
    exercise._normalizedAliases.join(' '),
    normalizeText(exercise.description),
  ]
    .filter(Boolean)
    .join(' ');
}

function buildTokenSet(tokens) {
  return new Set(tokens);
}

function getMeaningfulTokens(tokens) {
  return tokens.filter((token) => !MOVEMENT_MODIFIER_TOKENS.has(token));
}

function getEquipmentAlignment(workoutEquipment, exercise) {
  const normalizedWorkoutEquipment = normalizeWorkoutEquipment(workoutEquipment);

  if (!normalizedWorkoutEquipment) {
    return 'unknown';
  }

  if (exercise._equipmentTags.length === 0) {
    return 'unknown';
  }

  return exercise._equipmentTags.includes(normalizedWorkoutEquipment) ? 'match' : 'mismatch';
}

function scoreFuzzyMatch(exercise, comparableQuery, queryTokens, workoutEquipment = '') {
  if (queryTokens.length < 2) {
    return { confidence: 0, matchType: '' };
  }

  const queryTokenSet = buildTokenSet(queryTokens);
  const meaningfulQueryTokens = getMeaningfulTokens(queryTokens);
  const equipmentAlignment = getEquipmentAlignment(workoutEquipment, exercise);
  const candidateVariants = [
    {
      comparableText: exercise._comparableName,
      tokens: exercise._nameTokens,
      matchType: 'fuzzy-name',
    },
    ...exercise._comparableAliases.map((alias, index) => ({
      comparableText: alias,
      tokens: tokenizeText(exercise.aliases[index]),
      matchType: 'fuzzy-alias',
    })),
  ];

  if (equipmentAlignment === 'match') {
    candidateVariants.push({
      comparableText: `${exercise._comparableCategory} ${exercise._comparableName}`.trim(),
      tokens: [...exercise._categoryTokens, ...exercise._nameTokens],
      matchType: 'fuzzy-category-name',
    });
  }

  let bestMatch = { confidence: 0, matchType: '' };

  candidateVariants.forEach((variant) => {
    const candidateTokens = variant.tokens;
    const candidateTokenSet = buildTokenSet(candidateTokens);
    const sharedTokens = queryTokens.filter((token) => candidateTokenSet.has(token));
    const intersectionCount = sharedTokens.length;

    if (intersectionCount < 2) {
      return;
    }

    const sharedMeaningfulTokens = meaningfulQueryTokens.filter((token) => candidateTokenSet.has(token));
    if (sharedMeaningfulTokens.length === 0) {
      return;
    }

    const queryCoverage = intersectionCount / queryTokenSet.size;
    const unionCount = new Set([...queryTokens, ...candidateTokens]).size;
    const jaccard = unionCount > 0 ? intersectionCount / unionCount : 0;
    const containsFullQuery = variant.comparableText.includes(comparableQuery);

    let confidence = 0;

    if (containsFullQuery && queryCoverage === 1) {
      const extraTokenPenalty = Math.max(0, candidateTokens.length - queryTokens.length) * 0.04;
      confidence = 0.92 - extraTokenPenalty;
    } else if (queryCoverage === 1 && jaccard >= 0.6) {
      confidence = 0.84 + Math.min(0.08, (jaccard - 0.6) * 0.4);
    } else if (queryCoverage === 1 && jaccard >= 0.5) {
      confidence = 0.78;
    }

    if (confidence === 0) {
      return;
    }

    if (equipmentAlignment === 'match') {
      confidence += 0.05;
    }

    if (equipmentAlignment === 'mismatch') {
      confidence -= 0.22;
    }

    confidence = Math.max(0, Math.min(0.99, confidence));

    if (confidence > bestMatch.confidence) {
      bestMatch = {
        confidence,
        matchType: variant.matchType,
      };
    }
  });

  return bestMatch;
}

function matchExerciseByNameDetailed(name, options = {}) {
  const normalizedName = normalizeText(name);
  const comparableName = normalizeComparableText(name);
  const workoutEquipment = options.equipment || '';

  if (!normalizedName) {
    return { exercise: null, confidence: 0, matchType: '' };
  }

  const exactNameMatch = exercisesByNormalizedName.get(normalizedName);
  if (exactNameMatch) {
    return {
      exercise: exactNameMatch,
      confidence: 1,
      matchType: 'exact',
    };
  }

  const comparableNameMatch = exercisesByComparableName.get(comparableName);
  if (comparableNameMatch) {
    return {
      exercise: comparableNameMatch,
      confidence: 0.98,
      matchType: 'normalized',
    };
  }

  const aliasMatch = exercisesByAlias.get(normalizedName);
  if (aliasMatch) {
    return {
      exercise: aliasMatch,
      confidence: 0.97,
      matchType: 'alias',
    };
  }

  const comparableAliasMatch = exercisesByAlias.get(comparableName);
  if (comparableAliasMatch) {
    return {
      exercise: comparableAliasMatch,
      confidence: 0.95,
      matchType: 'normalized-alias',
    };
  }

  const slugMatch = exercisesBySlug.get(slugifyExerciseName(name));
  if (slugMatch) {
    return {
      exercise: slugMatch,
      confidence: 0.98,
      matchType: 'slug',
    };
  }

  const queryTokens = tokenizeText(name);
  const fuzzyMatches = exerciseRegistry
    .map((exercise) => {
      const fuzzyScore = scoreFuzzyMatch(exercise, comparableName, queryTokens, workoutEquipment);
      return {
        exercise,
        confidence: fuzzyScore.confidence,
        matchType: fuzzyScore.matchType,
      };
    })
    .filter((entry) => entry.confidence >= MIN_CONFIDENCE_TO_MATCH)
    .sort(
      (left, right) =>
        right.confidence - left.confidence ||
        left.exercise.exercise_name.localeCompare(right.exercise.exercise_name),
    );

  if (fuzzyMatches.length > 0) {
    const [bestMatch, secondBestMatch] = fuzzyMatches;
    const equipmentAlignment = getEquipmentAlignment(workoutEquipment, bestMatch.exercise);

    if (
      secondBestMatch &&
      bestMatch.confidence - secondBestMatch.confidence < MIN_CONFIDENCE_MARGIN
    ) {
      return { exercise: null, confidence: 0, matchType: '' };
    }

    if (equipmentAlignment === 'mismatch') {
      return { exercise: null, confidence: 0, matchType: '' };
    }

    return bestMatch;
  }

  return { exercise: null, confidence: 0, matchType: '' };
}

export function getExerciseById(id) {
  return stripInternalFields(exercisesById.get(id));
}

export function getExerciseBySlug(slug) {
  return stripInternalFields(exercisesBySlug.get(slug));
}

export function searchExercises(query, options = {}) {
  const normalizedQuery = normalizeText(query);
  const limit = Number.isFinite(options.limit) ? Math.max(1, options.limit) : exerciseRegistry.length;

  if (!normalizedQuery) {
    return exerciseRegistry.slice(0, limit).map(stripInternalFields);
  }

  const matches = exerciseRegistry
    .filter((exercise) => buildSearchHaystack(exercise).includes(normalizedQuery))
    .sort((left, right) => left.exercise_name.localeCompare(right.exercise_name));

  return matches.slice(0, limit).map(stripInternalFields);
}

export function matchExerciseByName(name, options = {}) {
  const match = matchExerciseByNameDetailed(name, options);
  return stripInternalFields(match.exercise);
}

export function resolveExerciseReference(name, equipment = '') {
  const normalizedName = normalizeText(name);

  if (!normalizedName) {
    return {
      exercise_id: '',
      exercise_slug: '',
      library_status: '',
    };
  }

  const match = matchExerciseByNameDetailed(name, { equipment });
  if (match.exercise && match.confidence >= MIN_CONFIDENCE_TO_MATCH) {
    return {
      exercise_id: match.exercise.id,
      exercise_slug: match.exercise.slug,
      library_status: '',
    };
  }

  const pendingSlug = slugifyExerciseName(name);
  return {
    exercise_id: pendingSlug ? `ex-${pendingSlug}` : '',
    exercise_slug: pendingSlug,
    library_status: pendingSlug ? 'pending' : '',
  };
}

export const exerciseLibraryService = {
  getExerciseById,
  getExerciseBySlug,
  searchExercises,
  matchExerciseByName,
  resolveExerciseReference,
};

export const exerciseLibraryRegistryItems = exerciseRegistry.map(stripInternalFields);
export { matchExerciseByNameDetailed, slugifyExerciseName };
