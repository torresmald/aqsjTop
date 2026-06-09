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

onMounted(() => {
  votesStore.loadVotingConfig()
})
</script>

<template>
  <v-container class="py-6" max-width="800">
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
        <v-btn color="primary" variant="flat" to="/resultados">Ver resultados</v-btn>
      </v-card>
    </template>

    <template v-else>
      <div class="mb-6">
        <h1 class="text-h4 font-weight-bold mb-2">Tu Top 10</h1>
        <p class="text-medium-emphasis">
          Elige 10 juegos distintos. El 1.º puesto vale 10 puntos y el 10.º vale 1 punto.
        </p>
      </div>

      <v-stepper :model-value="step === 'vote' ? 1 : step === 'confirm' ? 2 : 3" class="mb-6">
        <v-stepper-header>
          <v-stepper-item :value="1" title="Elegir juegos" />
          <v-divider />
          <v-stepper-item :value="2" title="Confirmar" />
          <v-divider />
          <v-stepper-item :value="3" title="Telegram" />
        </v-stepper-header>
      </v-stepper>

      <v-card v-if="step === 'vote'" class="pa-4">
        <v-alert
          v-if="hasDuplicates"
          type="error"
          variant="tonal"
          class="mb-4"
          title="Juegos repetidos"
          text="Cada juego solo puede aparecer una vez en tu Top 10."
        />

        <div class="d-flex flex-column ga-3">
          <div
            v-for="(position, index) in positions"
            :key="position"
            class="d-flex align-center ga-3"
          >
            <div class="text-no-wrap" style="min-width: 110px">
              <span class="font-weight-bold">{{ position }}º</span>
              <span class="text-medium-emphasis"> · {{ pointsForPosition(position) }} pts</span>
            </div>

            <v-autocomplete
              v-model="rankings[index]"
              :items="gamesForPosition(index)"
              :item-title="gameLabel"
              item-value="id"
              return-object
              label="Buscar juego"
              placeholder="Escribe para buscar..."
              clearable
              hide-details
              :error="rankings[index] !== null && duplicateGameIds.has(rankings[index]!.id)"
            />
          </div>
        </div>

        <div class="d-flex justify-end mt-6">
          <v-btn
            color="primary"
            variant="flat"
            :disabled="!canContinueToConfirm"
            @click="goToConfirm"
          >
            Continuar
          </v-btn>
        </div>
      </v-card>

      <v-card v-else-if="step === 'confirm'" class="pa-4">
        <h2 class="text-h6 font-weight-bold mb-4">Revisa tu Top 10</h2>

        <v-list lines="two" class="mb-4">
          <v-list-item
            v-for="ranking in voteRankings"
            :key="ranking.position"
            :title="`${ranking.position}º · ${ranking.gameName}`"
            :subtitle="`${ranking.points} puntos`"
          />
        </v-list>

        <div class="d-flex justify-space-between">
          <v-btn variant="text" @click="step = 'vote'">Volver</v-btn>
          <v-btn color="primary" variant="flat" @click="goToTelegram">Confirmar</v-btn>
        </div>
      </v-card>

      <v-card v-else class="pa-4">
        <h2 class="text-h6 font-weight-bold mb-2">Usuario de Telegram</h2>
        <p class="text-medium-emphasis mb-4">
          Introduce tu usuario de Telegram con la @ incluida. Solo se permite un voto por usuario.
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
          @keyup.enter="submitVote"
        />

        <div class="d-flex justify-space-between">
          <v-btn variant="text" :disabled="submitting" @click="step = 'confirm'">Volver</v-btn>
          <v-btn
            color="primary"
            variant="flat"
            :loading="submitting"
            :disabled="!isValidTelegram(telegram)"
            @click="submitVote"
          >
            Enviar voto
          </v-btn>
        </div>
      </v-card>
    </template>
  </v-container>
</template>
