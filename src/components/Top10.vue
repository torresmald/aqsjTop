<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import { useGamesStore } from '@/stores/games'
import { VoteError, useVotesStore } from '@/stores/votes'
import type { Game } from '@/interfaces/game'
import type { VoteRanking } from '@/interfaces/vote'
import { pointsForPosition, POSITIONS } from '@/utils/scoring'
import { formatTelegram, isValidTelegram } from '@/utils/telegram'

type Step = 'vote' | 'confirm' | 'telegram' | 'success'

const gamesStore = useGamesStore()
const votesStore = useVotesStore()

const step = ref<Step>('vote')
const rankings = ref<(Game | null)[]>(Array(POSITIONS).fill(null))
const telegram = ref('')
const submitting = ref(false)
const errorMessage = ref('')

const positions = Array.from({ length: POSITIONS }, (_, index) => index + 1)

const selectedGameIds = computed(() =>
  rankings.value.filter((game): game is Game => game !== null).map((game) => game.id),
)

const isRankingComplete = computed(() => rankings.value.every((game) => game !== null))

const duplicateGameIds = computed(() => {
  const counts = new Map<number, number>()
  for (const id of selectedGameIds.value) {
    counts.set(id, (counts.get(id) ?? 0) + 1)
  }
  return new Set([...counts.entries()].filter(([, count]) => count > 1).map(([id]) => id))
})

const hasDuplicates = computed(() => duplicateGameIds.value.size > 0)

const canContinueToConfirm = computed(() => isRankingComplete.value && !hasDuplicates.value)

const filledCount = computed(() => rankings.value.filter((game) => game !== null).length)

const voteRankings = computed<VoteRanking[]>(() =>
  rankings.value
    .map((game, index) => {
      if (!game) return null
      const position = index + 1
      return {
        gameId: game.id,
        gameName: game.name,
        position,
        points: pointsForPosition(position),
      }
    })
    .filter((ranking): ranking is VoteRanking => ranking !== null),
)

const telegramError = computed(() => {
  if (!telegram.value.trim()) return ''
  if (!isValidTelegram(telegram.value)) {
    return 'Introduce un usuario válido, por ejemplo @tu_usuario'
  }
  return ''
})

function gamesForPosition(index: number) {
  const currentGame = rankings.value[index]
  const otherSelectedIds = new Set(
    rankings.value
      .filter((game, gameIndex) => game !== null && gameIndex !== index)
      .map((game) => game!.id),
  )

  return gamesStore.games.filter(
    (game) => game.id === currentGame?.id || !otherSelectedIds.has(game.id),
  )
}

function gameLabel(game: Game) {
  return `${game.name} (${game.year})`
}

function goToConfirm() {
  if (!canContinueToConfirm.value) return
  errorMessage.value = ''
  step.value = 'confirm'
}

function goToTelegram() {
  errorMessage.value = ''
  step.value = 'telegram'
}

async function submitVote() {
  if (!isValidTelegram(telegram.value)) return

  submitting.value = true
  errorMessage.value = ''

  try {
    await votesStore.submitVote(telegram.value, voteRankings.value)
    step.value = 'success'
  } catch (error) {
    if (error instanceof VoteError) {
      errorMessage.value = error.message
    } else {
      errorMessage.value = 'Ha ocurrido un error inesperado.'
    }
  } finally {
    submitting.value = false
  }
}

const stepProgress = computed(() => {
  if (step.value === 'vote') return 33
  if (step.value === 'confirm') return 66
  return 100
})

const stepLabel = computed(() => {
  if (step.value === 'vote') return 'Elegir juegos'
  if (step.value === 'confirm') return 'Confirmar'
  return 'Telegram'
})

onMounted(() => {
  votesStore.loadVotingConfig()
})
</script>

<template>
  <v-container
    class="page-container"
    :class="{
      'page-container--with-footer':
        step !== 'success' && votesStore.configLoaded && votesStore.votingOpen,
    }"
    max-width="800"
  >
    <v-card v-if="!votesStore.configLoaded" class="pa-6">
      <v-progress-linear indeterminate color="primary" />
      <p class="text-center mt-4 text-medium-emphasis">Cargando votación...</p>
    </v-card>

    <template v-else-if="!votesStore.votingOpen">
      <v-alert type="warning" variant="tonal" title="Votación cerrada">
        La votación no está abierta en este momento.
      </v-alert>
    </template>

    <template v-else-if="step === 'success'">
      <v-card class="pa-6 text-center">
        <v-icon icon="mdi-check-circle" color="success" size="64" class="mb-4" />
        <h2 class="text-h5 font-weight-bold mb-2">¡Voto registrado!</h2>
        <p class="text-medium-emphasis mb-4">
          Gracias por participar con {{ formatTelegram(telegram) }}.
        </p>
        <v-btn color="primary" variant="flat" block class="d-sm-inline-flex" to="/resultados">
          Ver resultados
        </v-btn>
      </v-card>
    </template>

    <template v-else>
      <div class="page-header">
        <h1 class="page-title">Tu Top 10</h1>
        <p class="page-subtitle">
          Elige 10 juegos distintos. El 1.º puesto vale 10 puntos y el 10.º vale 1 punto.
        </p>
      </div>

      <div class="step-progress mb-4">
        <div class="step-progress__labels">
          <span class="step-progress__current"
            >Paso {{ step === 'vote' ? 1 : step === 'confirm' ? 2 : 3 }} de 3</span
          >
          <span class="step-progress__name">{{ stepLabel }}</span>
        </div>
        <v-progress-linear :model-value="stepProgress" color="primary" rounded height="6" />
        <div class="step-progress__dots d-none d-sm-flex">
          <span :class="{ active: step === 'vote' }">Juegos</span>
          <span :class="{ active: step === 'confirm' }">Confirmar</span>
          <span :class="{ active: step === 'telegram' }">Telegram</span>
        </div>
      </div>

      <v-card v-if="step === 'vote'" class="page-card">
        <v-alert
          v-if="hasDuplicates"
          type="error"
          variant="tonal"
          class="mb-4"
          title="Juegos repetidos"
          text="Cada juego solo puede aparecer una vez en tu Top 10."
        />

        <div class="vote-rows">
          <div v-for="(position, index) in positions" :key="position" class="vote-row">
            <div class="vote-row__badge">
              <span class="vote-row__position">{{ position }}º</span>
              <span class="vote-row__points">{{ pointsForPosition(position) }} pts</span>
            </div>

            <v-autocomplete
              v-model="rankings[index]"
              :items="gamesForPosition(index)"
              :item-title="gameLabel"
              item-value="id"
              return-object
              :label="`Puesto ${position}`"
              placeholder="Buscar juego..."
              clearable
              hide-details
              density="comfortable"
              class="vote-row__input"
              :error="rankings[index] !== null && duplicateGameIds.has(rankings[index]!.id)"
            />
          </div>
        </div>
      </v-card>

      <v-card v-else-if="step === 'confirm'" class="page-card">
        <h2 class="section-title">Revisa tu Top 10</h2>

        <v-list lines="two" class="confirm-list mb-4">
          <v-list-item
            v-for="ranking in voteRankings"
            :key="ranking.position"
            class="confirm-list__item"
          >
            <template #prepend>
              <div class="confirm-list__rank">{{ ranking.position }}</div>
            </template>
            <v-list-item-title class="confirm-list__name">{{ ranking.gameName }}</v-list-item-title>
            <v-list-item-subtitle>{{ ranking.points }} puntos</v-list-item-subtitle>
          </v-list-item>
        </v-list>
      </v-card>

      <v-card v-else class="page-card">
        <h2 class="section-title">Usuario de Telegram</h2>
        <p class="page-subtitle mb-4">
          Introduce tu usuario con la @ incluida. Solo se permite un voto por usuario.
        </p>

        <v-alert
          v-if="errorMessage"
          type="error"
          variant="tonal"
          class="mb-4"
          :text="errorMessage"
        />

        <v-text-field
          v-model="telegram"
          label="Usuario de Telegram"
          placeholder="@tu_usuario"
          prepend-inner-icon="mdi-at"
          :error-messages="telegramError"
          :disabled="submitting"
          autocomplete="username"
          inputmode="text"
          density="comfortable"
          @keyup.enter="submitVote"
        />
      </v-card>

      <div v-if="step === 'vote'" class="page-footer">
        <p class="page-footer__hint">
          <template v-if="hasDuplicates">Hay juegos repetidos</template>
          <template v-else>{{ filledCount }}/10 puestos completados</template>
        </p>
        <v-btn
          color="primary"
          variant="flat"
          size="large"
          block
          class="page-footer__btn"
          :disabled="!canContinueToConfirm"
          @click="goToConfirm"
        >
          Continuar
        </v-btn>
      </div>

      <div v-else-if="step === 'confirm'" class="page-footer page-footer--split">
        <v-btn
          variant="outlined"
          size="large"
          class="page-footer__btn-secondary"
          @click="step = 'vote'"
        >
          Volver
        </v-btn>
        <v-btn
          color="primary"
          variant="flat"
          size="large"
          class="page-footer__btn-primary"
          @click="goToTelegram"
        >
          Confirmar
        </v-btn>
      </div>

      <div v-else-if="step === 'telegram'" class="page-footer page-footer--split">
        <v-btn
          variant="outlined"
          size="large"
          class="page-footer__btn-secondary"
          :disabled="submitting"
          @click="step = 'confirm'"
        >
          Volver
        </v-btn>
        <v-btn
          color="primary"
          variant="flat"
          size="large"
          class="page-footer__btn-primary"
          :loading="submitting"
          :disabled="!isValidTelegram(telegram)"
          @click="submitVote"
        >
          Enviar voto
        </v-btn>
      </div>
    </template>
  </v-container>
</template>

<style scoped>
.page-container {
  padding: 16px 12px 24px;
}

.page-container--with-footer {
  padding-bottom: calc(120px + 56px + env(safe-area-inset-bottom, 0));
}

@media (min-width: 960px) {
  .page-container--with-footer {
    padding-bottom: 100px;
  }
}

@media (min-width: 600px) {
  .page-container {
    padding: 24px 16px 32px;
  }

  .page-container--with-footer {
    padding-bottom: 100px;
  }
}

.page-header {
  margin-bottom: 20px;
}

.page-title {
  font-size: 1.5rem;
  font-weight: 700;
  line-height: 1.2;
  margin-bottom: 8px;
}

.section-title {
  font-size: 1.125rem;
  font-weight: 700;
  margin-bottom: 16px;
}

.page-subtitle {
  color: rgba(var(--v-theme-on-surface), 0.6);
  font-size: 0.9rem;
  line-height: 1.5;
}

@media (min-width: 600px) {
  .page-title {
    font-size: 2rem;
  }
}

.page-card {
  padding: 16px;
}

@media (min-width: 600px) {
  .page-card {
    padding: 24px;
  }
}

.step-progress__labels {
  display: flex;
  justify-content: space-between;
  align-items: baseline;
  gap: 8px;
  margin-bottom: 8px;
  font-size: 0.8rem;
}

.step-progress__current {
  font-weight: 600;
  white-space: nowrap;
}

.step-progress__name {
  color: rgba(var(--v-theme-on-surface), 0.6);
  text-align: right;
}

.step-progress__dots {
  justify-content: space-between;
  margin-top: 8px;
  font-size: 0.75rem;
  color: rgba(var(--v-theme-on-surface), 0.45);
}

.step-progress__dots .active {
  color: rgb(var(--v-theme-primary));
  font-weight: 600;
}

.vote-rows {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.vote-row {
  display: flex;
  flex-direction: column;
  gap: 6px;
  padding: 12px;
  border-radius: 12px;
  background: rgba(var(--v-theme-on-surface), 0.03);
}

@media (min-width: 600px) {
  .vote-row {
    flex-direction: row;
    align-items: center;
    gap: 12px;
    padding: 8px 12px;
  }
}

.vote-row__badge {
  display: flex;
  align-items: center;
  gap: 8px;
  flex-shrink: 0;
}

.vote-row__position {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  min-width: 36px;
  height: 36px;
  border-radius: 8px;
  background: rgb(var(--v-theme-primary));
  color: rgb(var(--v-theme-on-primary));
  font-weight: 700;
  font-size: 0.875rem;
}

.vote-row__points {
  font-size: 0.8rem;
  color: rgba(var(--v-theme-on-surface), 0.6);
  white-space: nowrap;
}

.vote-row__input {
  flex: 1;
  min-width: 0;
}

.confirm-list__item {
  padding-inline: 0 !important;
}

.confirm-list__rank {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 32px;
  height: 32px;
  border-radius: 50%;
  background: rgba(var(--v-theme-primary), 0.12);
  color: rgb(var(--v-theme-primary));
  font-weight: 700;
  font-size: 0.875rem;
  margin-right: 12px;
}

.confirm-list__name {
  white-space: normal !important;
  word-break: break-word;
  line-height: 1.3 !important;
}

.page-footer {
  position: fixed;
  left: 0;
  right: 0;
  bottom: calc(56px + env(safe-area-inset-bottom, 0));
  z-index: 900;
  display: flex;
  flex-direction: column;
  gap: 8px;
  padding: 12px 16px;
  background: rgb(var(--v-theme-surface));
  border-top: 1px solid rgba(var(--v-border-color), var(--v-border-opacity));
  box-shadow: 0 -4px 16px rgba(0, 0, 0, 0.08);
}

.page-footer--split {
  flex-direction: row;
  align-items: center;
  gap: 10px;
}

.page-footer__hint {
  margin: 0;
  text-align: center;
  font-size: 0.8rem;
  font-weight: 500;
  color: rgba(var(--v-theme-on-surface), 0.65);
}

.page-footer__btn {
  font-weight: 700;
  min-height: 48px !important;
  letter-spacing: 0.02em;
}

.page-footer__btn.v-btn--disabled {
  opacity: 1 !important;
  background: rgba(var(--v-theme-primary), 0.38) !important;
  color: rgba(var(--v-theme-on-primary), 0.85) !important;
}

.page-footer__btn-primary {
  flex: 1;
  font-weight: 700;
  min-height: 48px !important;
}

.page-footer__btn-secondary {
  flex: 0 0 auto;
  min-height: 48px !important;
  min-width: 96px;
}

@media (min-width: 960px) {
  .page-footer {
    bottom: 0;
    left: 50%;
    right: auto;
    transform: translateX(-50%);
    width: min(800px, 100%);
    padding: 16px 24px;
    border-radius: 16px 16px 0 0;
  }
}
</style>
