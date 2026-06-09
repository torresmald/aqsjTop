<script setup lang="ts">
import Header from '@/components/Header.vue'
import BottomNav from '@/components/BottomNav.vue'
</script>

<template>
  <v-app class="app-shell">
    <v-main scrollable class="app-main">
      <Header />
      <router-view />
    </v-main>
    <BottomNav />
  </v-app>
</template>

<style scoped>
.app-main :deep(.v-main__scroller) {
  -webkit-overflow-scrolling: touch;
}
</style>
