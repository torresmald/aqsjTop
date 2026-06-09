export interface VoteRanking {
  gameId: number
  gameName: string
  position: number
  points: number
}

export interface Vote {
  telegram: string
  rankings: VoteRanking[]
  createdAt: ReturnType<typeof import('firebase/firestore').serverTimestamp>
}

export interface VotingConfig {
  open: boolean
}
