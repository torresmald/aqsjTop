export interface GameAlias {
  canonicalId: number
  canonicalName: string
}

export type GameAliasMap = Record<string, GameAlias>
