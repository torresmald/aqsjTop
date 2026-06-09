<script setup lang="ts">
import { useRoute } from 'vue-router'

const route = useRoute()

type NavItem =
  | { to: string; icon: string; label: string; external?: false }
  | { href: string; icon: string; label: string; external: true }

const items: NavItem[] = [
  { to: '/', icon: 'mdi-ballot-outline', label: 'Votar' },
  { to: '/resultados', icon: 'mdi-trophy', label: 'Resultados' },
  {
    href: 'https://www.youtube.com/aquesejuega',
    icon: 'mdi-youtube',
    label: 'YouTube',
    external: true,
  },
]

function isActive(item: NavItem) {
  return !item.external && route.path === item.to
}
</script>

<template>
  <nav class="bottom-nav d-md-none">
    <template v-for="item in items" :key="item.label">
      <router-link
        v-if="!item.external"
        :to="item.to"
        class="bottom-nav__item"
        :class="{ 'bottom-nav__item--active': isActive(item) }"
      >
        <v-icon :icon="item.icon" size="24" />
        <span>{{ item.label }}</span>
      </router-link>
      <a
        v-else
        :href="item.href"
        target="_blank"
        rel="noopener noreferrer"
        class="bottom-nav__item"
      >
        <v-icon :icon="item.icon" size="24" />
        <span>{{ item.label }}</span>
      </a>
    </template>
  </nav>
</template>

<style scoped>
.bottom-nav {
  position: fixed;
  bottom: 0;
  left: 0;
  right: 0;
  z-index: 1000;
  display: flex;
  justify-content: space-around;
  align-items: stretch;
  background: rgb(var(--v-theme-surface));
  border-top: 1px solid rgba(var(--v-border-color), var(--v-border-opacity));
  padding-bottom: env(safe-area-inset-bottom, 0);
}

.bottom-nav__item {
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 2px;
  min-height: 56px;
  padding: 6px 4px;
  text-decoration: none;
  color: rgba(var(--v-theme-on-surface), 0.6);
  font-size: 0.7rem;
  font-weight: 500;
  -webkit-tap-highlight-color: transparent;
}

.bottom-nav__item--active {
  color: rgb(var(--v-theme-primary));
}

.bottom-nav__item:active {
  background: rgba(var(--v-theme-on-surface), 0.04);
}
</style>
