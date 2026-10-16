<script setup lang="ts">
import type { CartSummary } from '~/types/cart'

const props = defineProps<{
  summary: CartSummary
  promoCode: string
}>()

const emit = defineEmits<{
  applyCode: [code: string]
  removeCode: []
}>()

const codeInput = ref(props.promoCode)
watch(
  () => props.promoCode,
  (code) => (codeInput.value = code),
)

const discountsTotal = computed(() =>
  props.summary.discounts.reduce((total, discount) => total + discount.amountCents, 0),
)

function onSubmit(): void {
  emit('applyCode', codeInput.value)
}
</script>

<template>
  <aside class="summary" aria-labelledby="summary-title">
    <h2 id="summary-title">Récapitulatif</h2>

    <dl class="rows">
      <div class="row">
        <dt>Sous-total</dt>
        <dd>{{ formatCents(summary.grossCents) }}</dd>
      </div>
      <div v-for="discount in summary.discounts" :key="discount.id" class="row row--discount">
        <dt>{{ discount.label }}</dt>
        <dd>−{{ formatCents(discount.amountCents) }}</dd>
      </div>
      <div class="row">
        <dt>Livraison</dt>
        <dd>{{ summary.shippingCents === 0 ? 'Offerte' : formatCents(summary.shippingCents) }}</dd>
      </div>
      <div class="row row--total">
        <dt>Total</dt>
        <dd>{{ formatCents(summary.totalCents) }}</dd>
      </div>
    </dl>

    <p v-if="discountsTotal > 0" class="savings">
      Vous économisez {{ formatCents(discountsTotal) }}.
    </p>
    <p class="hint">Livraison offerte dès 80,00 € après remises (hors meubles).</p>

    <form class="promo" @submit.prevent="onSubmit">
      <label for="promo-code">Code promo</label>
      <div class="promo-row">
        <input id="promo-code" v-model="codeInput" type="text" autocomplete="off" />
        <button type="submit" class="btn">Appliquer</button>
      </div>
      <button v-if="promoCode" type="button" class="link" @click="emit('removeCode')">
        Retirer le code « {{ promoCode }} »
      </button>
    </form>

    <!-- Explications du moteur de promotions (code refusé, plafond…) -->
    <ul v-if="summary.messages.length > 0" class="messages" role="status">
      <li v-for="message in summary.messages" :key="message">{{ message }}</li>
    </ul>
  </aside>
</template>

<style scoped>
.summary {
  padding: 1.25rem;
  background: var(--color-surface);
  border: 1px solid var(--color-border);
  border-radius: var(--radius);
}

.summary h2 {
  margin-top: 0;
}

.rows {
  margin: 0;
}

.row {
  display: flex;
  justify-content: space-between;
  gap: 1rem;
  padding: 0.4rem 0;
}

.row dd {
  margin: 0;
  white-space: nowrap;
}

.row--discount {
  color: #1e6b34;
}

.row--total {
  margin-top: 0.4rem;
  padding-top: 0.75rem;
  border-top: 1px solid var(--color-border);
  font-size: 1.25rem;
  font-weight: 800;
}

.savings {
  color: #1e6b34;
  font-weight: 600;
}

.hint {
  color: var(--color-muted);
  font-size: 0.9rem;
}

.promo {
  margin-top: 1rem;
}

.promo label {
  font-weight: 600;
}

.promo-row {
  display: flex;
  gap: 0.5rem;
  margin-top: 0.25rem;
}

.promo-row input {
  flex: 1;
  min-width: 0;
  padding: 0.55rem 0.7rem;
  border: 1px solid #b9b0a2;
  border-radius: var(--radius);
  font: inherit;
}

.link {
  margin-top: 0.5rem;
  padding: 0;
  border: 0;
  background: none;
  color: var(--color-primary);
  text-decoration: underline;
  cursor: pointer;
  font: inherit;
}

.messages {
  margin: 1rem 0 0;
  padding: 0.75rem 1rem 0.75rem 2rem;
  background: #fdf3e7;
  border-radius: var(--radius);
  color: #6b3a00;
}
</style>
