export const DICE_ROLL_CODE = {
  OK: 0,
  INVALID_CHARS: 1,
  UNMATCHED_PARENS: 2,
  NESTED_DICE: 3,
  INVALID_SYNTAX: 4,
  DICE_COUNT_OUT_OF_RANGE: 5,
  DICE_SIDES_OUT_OF_RANGE: 6,
  DIVISION_BY_ZERO: 7,
} as const;

export type DiceRollErrorType = Exclude<keyof typeof DICE_ROLL_CODE, 'OK'>;

export type DiceRollErrorCode = (typeof DICE_ROLL_CODE)[DiceRollErrorType];

export const DICE_ROLL_LIMITS = {
  countMin: 1,
  countMax: 32,
  sidesMin: 1,
  sidesMax: 512,
} as const;

export type DiceRollDetail = [value: number, sides: number];

export type DiceRollSuccess = {
  code: typeof DICE_ROLL_CODE.OK;
  msg: string;
  rolls: DiceRollDetail[];
};

export type DiceRollFailure = {
  code: DiceRollErrorCode;
  msg: DiceRollErrorType;
  rolls: [];
};

export type DiceRollResult = DiceRollSuccess | DiceRollFailure;

type DiceNode = {
  type: 'dice';
  count: number;
  sides: number;
  rolls: number[];
};

type NumberNode = {
  type: 'number';
  value: number;
};

type GroupNode = {
  type: 'group';
  inner: AstNode;
};

type BinaryNode = {
  type: 'binary';
  op: '+' | '-' | '*' | '/';
  left: AstNode;
  right: AstNode;
};

type UnaryNode = {
  type: 'unary';
  op: '-';
  operand: AstNode;
};

type AstNode = DiceNode | NumberNode | GroupNode | BinaryNode | UnaryNode;

type ParseSuccess = {
  ok: true;
  node: AstNode;
};

type ParseFailure = {
  ok: false;
  error: DiceRollErrorType;
};

type ParseResult = ParseSuccess | ParseFailure;

const ALLOWED_CHARS = /^[0-9+\-*/dD()]+$/;
const NESTED_DICE = /\d*d\d+(?=d\d+)/;

function fail(error: DiceRollErrorType): DiceRollFailure {
  return { code: DICE_ROLL_CODE[error], msg: error, rolls: [] };
}

function ok(msg: string, rolls: DiceRollDetail[]): DiceRollSuccess {
  return { code: DICE_ROLL_CODE.OK, msg, rolls };
}

function rollDie(sides: number): number {
  return Math.floor(Math.random() * sides) + 1;
}

function checkParentheses(expr: string): boolean {
  let depth = 0;
  for (const ch of expr) {
    if (ch === '(') {
      depth += 1;
    } else if (ch === ')') {
      depth -= 1;
      if (depth < 0) {
        return false;
      }
    }
  }
  return depth === 0;
}

function parseDiceToken(raw: string): ParseResult {
  const match = /^(\d*)d(\d+)$/.exec(raw);
  if (!match) {
    return { ok: false, error: 'INVALID_SYNTAX' };
  }

  const count = match[1] === '' ? 1 : Number(match[1]);
  const sides = Number(match[2]);
  const { countMin, countMax, sidesMin, sidesMax } = DICE_ROLL_LIMITS;

  if (!Number.isInteger(count) || count < countMin || count > countMax) {
    return { ok: false, error: 'DICE_COUNT_OUT_OF_RANGE' };
  }

  if (!Number.isInteger(sides) || sides < sidesMin || sides > sidesMax) {
    return { ok: false, error: 'DICE_SIDES_OUT_OF_RANGE' };
  }

  const rolls = Array.from({ length: count }, () => rollDie(sides));
  return {
    ok: true,
    node: { type: 'dice', count, sides, rolls },
  };
}

class Parser {
  private pos = 0;

  constructor(private readonly input: string) {}

  parseExpression(): ParseResult {
    const result = this.parseAddSub();
    if (!result.ok) {
      return result;
    }

    if (this.pos !== this.input.length) {
      return { ok: false, error: 'INVALID_SYNTAX' };
    }

    return result;
  }

  private parseAddSub(): ParseResult {
    let left = this.parseMulDiv();
    if (!left.ok) {
      return left;
    }

    while (this.pos < this.input.length) {
      const op = this.input[this.pos];
      if (op !== '+' && op !== '-') {
        break;
      }
      this.pos += 1;
      const right = this.parseMulDiv();
      if (!right.ok) {
        return right;
      }
      left = {
        ok: true,
        node: { type: 'binary', op, left: left.node, right: right.node },
      };
    }

    return left;
  }

  private parseMulDiv(): ParseResult {
    let left = this.parseUnary();
    if (!left.ok) {
      return left;
    }

    while (this.pos < this.input.length) {
      const op = this.input[this.pos];
      if (op !== '*' && op !== '/') {
        break;
      }
      this.pos += 1;
      const right = this.parseUnary();
      if (!right.ok) {
        return right;
      }
      left = {
        ok: true,
        node: { type: 'binary', op, left: left.node, right: right.node },
      };
    }

    return left;
  }

  private parseUnary(): ParseResult {
    if (this.input[this.pos] === '-') {
      this.pos += 1;
      const operand = this.parsePrimary();
      if (!operand.ok) {
        return operand;
      }
      return {
        ok: true,
        node: { type: 'unary', op: '-', operand: operand.node },
      };
    }

    return this.parsePrimary();
  }

  private parsePrimary(): ParseResult {
    if (this.input[this.pos] === '(') {
      this.pos += 1;
      const inner = this.parseAddSub();
      if (!inner.ok) {
        return inner;
      }
      if (this.input[this.pos] !== ')') {
        return { ok: false, error: 'INVALID_SYNTAX' };
      }
      this.pos += 1;
      return {
        ok: true,
        node: { type: 'group', inner: inner.node },
      };
    }

    return this.parseAtom();
  }

  private parseAtom(): ParseResult {
    const start = this.pos;

    while (this.pos < this.input.length && /[0-9]/.test(this.input[this.pos]!)) {
      this.pos += 1;
    }

    if (this.pos < this.input.length && this.input[this.pos] === 'd') {
      this.pos += 1;
      while (this.pos < this.input.length && /[0-9]/.test(this.input[this.pos]!)) {
        this.pos += 1;
      }
      const token = this.input.slice(start, this.pos);
      return parseDiceToken(token);
    }

    if (start === this.pos) {
      return { ok: false, error: 'INVALID_SYNTAX' };
    }

    const value = Number(this.input.slice(start, this.pos));
    if (!Number.isInteger(value)) {
      return { ok: false, error: 'INVALID_SYNTAX' };
    }

    return {
      ok: true,
      node: { type: 'number', value },
    };
  }
}

function formatNode(node: AstNode, parent?: BinaryNode): string {
  const formatted = formatNodeInner(node);

  if (!parent || node.type !== 'binary') {
    return formatted;
  }

  const precedence = (op: BinaryNode['op']): number => {
    if (op === '+' || op === '-') {
      return 1;
    }
    return 2;
  };

  const nodePrecedence = precedence(node.op);
  const parentPrecedence = precedence(parent.op);

  if (nodePrecedence < parentPrecedence) {
    return `(${formatted})`;
  }

  if (
    nodePrecedence === parentPrecedence &&
    parent.op === '-' &&
    node === parent.right
  ) {
    return `(${formatted})`;
  }

  if (
    nodePrecedence === parentPrecedence &&
    parent.op === '/' &&
    node === parent.right
  ) {
    return `(${formatted})`;
  }

  return formatted;
}

function formatNodeInner(node: AstNode): string {
  switch (node.type) {
    case 'number':
      return String(node.value);
    case 'dice':
      return `[${node.rolls.join('+')}]`;
    case 'group':
      return `(${formatNode(node.inner)})`;
    case 'unary':
      return `-${formatNode(node.operand)}`;
    case 'binary':
      return `${formatNode(node.left, node)}${node.op}${formatNode(node.right, node)}`;
  }
}

type EvalSuccess = {
  ok: true;
  value: number;
};

type EvalResult = EvalSuccess | ParseFailure;

function collectDiceRolls(node: AstNode): DiceRollDetail[] {
  switch (node.type) {
    case 'number':
      return [];
    case 'dice':
      return node.rolls.map((value) => [value, node.sides]);
    case 'group':
      return collectDiceRolls(node.inner);
    case 'unary':
      return collectDiceRolls(node.operand);
    case 'binary':
      return [...collectDiceRolls(node.left), ...collectDiceRolls(node.right)];
  }
}

function evaluateNode(node: AstNode): EvalResult {
  switch (node.type) {
    case 'number':
      return { ok: true, value: node.value };
    case 'dice':
      return {
        ok: true,
        value: node.rolls.reduce((sum, roll) => sum + roll, 0),
      };
    case 'group':
      return evaluateNode(node.inner);
    case 'unary': {
      const operand = evaluateNode(node.operand);
      if (!operand.ok) {
        return operand;
      }
      return { ok: true, value: -operand.value };
    }
    case 'binary': {
      const left = evaluateNode(node.left);
      if (!left.ok) {
        return left;
      }
      const right = evaluateNode(node.right);
      if (!right.ok) {
        return right;
      }

      switch (node.op) {
        case '+':
          return { ok: true, value: left.value + right.value };
        case '-':
          return { ok: true, value: left.value - right.value };
        case '*':
          return { ok: true, value: left.value * right.value };
        case '/':
          if (right.value === 0) {
            return { ok: false, error: 'DIVISION_BY_ZERO' };
          }
          return {
            ok: true,
            value: Math.floor(left.value / right.value),
          };
      }
    }
  }
}

export function rollDiceExpression(raw: string): DiceRollResult {
  let expr = raw.trim();
  if (expr === '') {
    expr = '1d100';
  }

  if (!ALLOWED_CHARS.test(expr)) {
    return fail('INVALID_CHARS');
  }

  expr = expr.replace(/D/g, 'd');

  if (!checkParentheses(expr)) {
    return fail('UNMATCHED_PARENS');
  }

  if (NESTED_DICE.test(expr)) {
    return fail('NESTED_DICE');
  }

  const parsed = new Parser(expr).parseExpression();
  if (!parsed.ok) {
    return fail(parsed.error);
  }

  const evaluated = evaluateNode(parsed.node);
  if (!evaluated.ok) {
    return fail(evaluated.error);
  }

  const expanded = formatNode(parsed.node);
  return ok(`${expanded} = ${evaluated.value}`, collectDiceRolls(parsed.node));
}
