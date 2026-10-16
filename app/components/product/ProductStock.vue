<script setup lang="ts">
const props = defineProps<{ stock: number }>()

const status = computed(() => getStockStatus(props.stock))
</script>

<template>
  <p v-if="status.kind === 'out-of-stock'" class="stock stock--out">Rupture de stock</p>
  <p v-else-if="status.kind === 'low'" class="stock stock--low">
    Plus que {{ status.remaining }} en stock
  </p>
  <p v-else class="stock stock--ok">En stock</p>
</template>

<style scoped>
.stock {
  margin: 0;
  font-weight: 600;
}

.stock--ok {
  color: #1e6b34;
}

.stock--low {
  color: #8a4b00;
}

.stock--out {
  color: var(--color-danger, #a4161a);
}
</style>
