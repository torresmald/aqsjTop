import type { GameAliasMap } from '@/interfaces/gameAlias'
import type { Vote, VoteRanking } from '@/interfaces/vote'

export function resolveGameId(gameId: number, aliases: GameAliasMap): number {
  return aliases[String(gameId)]?.canonicalId ?? gameId
}

export function resolveRanking(ranking: VoteRanking, aliases: GameAliasMap): VoteRanking {
  const alias = aliases[String(ranking.gameId)]
  if (!alias) return ranking

  return {
    ...ranking,
    gameId: alias.canonicalId,
    gameName: alias.canonicalName,
  }
}

export function normalizeRankings(rankings: VoteRanking[], aliases: GameAliasMap): VoteRanking[] {
  return rankings.map((ranking) => resolveRanking(ranking, aliases))
}

export function getAliasGameIds(aliases: GameAliasMap): Set<number> {
  return new Set(Object.keys(aliases).map((id) => Number(id)))
}

export interface GameScore {
  gameId: number
  gameName: string
  totalPoints: number
  votes: number
}

export function aggregateVotes(votes: Vote[], aliases: GameAliasMap): GameScore[] {
  const totals = new Map<number, GameScore>()

  for (const vote of votes) {
    for (const ranking of vote.rankings) {
      const resolved = resolveRanking(ranking, aliases)
      const current = totals.get(resolved.gameId)

      if (current) {
        current.totalPoints += resolved.points
        current.votes += 1
      } else {
        totals.set(resolved.gameId, {
          gameId: resolved.gameId,
          gameName: resolved.gameName,
          totalPoints: resolved.points,
          votes: 1,
        })
      }
    }
  }

  return [...totals.values()].sort((a, b) => {
    if (b.totalPoints !== a.totalPoints) return b.totalPoints - a.totalPoints
    return a.gameName.localeCompare(b.gameName, 'es')
  })
}
