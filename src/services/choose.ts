export const CHOOSE_CODE = {
  OK: 0,
  NO_OPTIONS: 1,
  INVALID_COUNT: 2,
  COUNT_TOO_LARGE: 3,
  TOO_MANY_OPTIONS: 4,
} as const;

export type ChooseErrorType = Exclude<keyof typeof CHOOSE_CODE, 'OK'>;

export type ChooseErrorCode = (typeof CHOOSE_CODE)[ChooseErrorType];

export const CHOOSE_LIMITS = {
  optionsMax: 100,
} as const;

export type ChooseSuccess = {
  code: typeof CHOOSE_CODE.OK;
  msg: string;
  picked: string[];
  options: string[];
  count: number;
};

export type ChooseFailure = {
  code: ChooseErrorCode;
  msg: ChooseErrorType;
  picked: [];
  count?: number;
};

export type ChooseResult = ChooseSuccess | ChooseFailure;

type ParseSuccess = {
  ok: true;
  count: number;
  options: string[];
};

type ParseFailure = {
  ok: false;
  error: ChooseErrorType;
  count?: number;
};

type ParseResult = ParseSuccess | ParseFailure;

function fail(error: ChooseErrorType, count?: number): ChooseFailure {
  return { code: CHOOSE_CODE[error], msg: error, picked: [], count };
}

function ok(picked: string[], options: string[], count: number): ChooseSuccess {
  return { code: CHOOSE_CODE.OK, msg: picked.join('、'), picked, options, count };
}

export function parseChooseArgs(args: string[]): ParseResult {
  if (args.length === 0) {
    return { ok: false, error: 'NO_OPTIONS' };
  }

  let count = 1;
  let options: string[];

  if (/^\d+$/.test(args[0])) {
    count = Number(args[0]);
    if (count < 1) {
      return { ok: false, error: 'INVALID_COUNT', count };
    }
    options = args.slice(1);
  } else {
    options = args;
  }

  if (options.length === 0) {
    return { ok: false, error: 'NO_OPTIONS' };
  }

  if (options.length > CHOOSE_LIMITS.optionsMax) {
    return { ok: false, error: 'TOO_MANY_OPTIONS' };
  }

  if (count > options.length) {
    return { ok: false, error: 'COUNT_TOO_LARGE', count };
  }

  return { ok: true, count, options };
}

export function pickOptions(options: string[], count: number): string[] {
  const indices = Array.from({ length: options.length }, (_, i) => i);
  for (let i = indices.length - 1; i > indices.length - 1 - count; i -= 1) {
    const j = Math.floor(Math.random() * (i + 1));
    [indices[i], indices[j]] = [indices[j], indices[i]];
  }
  return indices
    .slice(indices.length - count)
    .sort((a, b) => a - b)
    .map((i) => options[i]);
}

export function chooseFromArgs(args: string[]): ChooseResult {
  const parsed = parseChooseArgs(args);
  if (!parsed.ok) {
    return fail(parsed.error, parsed.count);
  }

  const picked = pickOptions(parsed.options, parsed.count);
  return ok(picked, parsed.options, parsed.count);
}
