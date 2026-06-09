export const POSITIONS = 10

export function pointsForPosition(position: number): number {
  return POSITIONS + 1 - position
}
