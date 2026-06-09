<script setup lang="ts">
import Header from '@/components/Header.vue'
import BottomNav from '@/components/BottomNav.vue'
</script>

<template>
  <v-app>
    <Header />
    <v-main class="app-main">
      <router-view />
    </v-main>
    <BottomNav />
  </v-app>
</template>

<style scoped>
.app-main {
  padding-bottom: calc(56px + env(safe-area-inset-bottom, 0));
}

@media (min-width: 960px) {
  .app-main {
    padding-bottom: 0;
  }
}
</style>
