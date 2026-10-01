<template>
  <div class="skeleton" aria-hidden="true">
    <div class="skeleton-media" />
    <div class="skeleton-line" />
    <div class="skeleton-line skeleton-line--short" />
  </div>
</template>

<style scoped>
.skeleton {
  height: 100%;
  background: var(--color-surface);
  border: 1px solid var(--color-border);
  border-radius: var(--radius);
  padding-bottom: 1rem;
  overflow: hidden;
}

.skeleton-media,
.skeleton-line {
  background: linear-gradient(90deg, #eee9e0 0%, #f7f4ee 50%, #eee9e0 100%);
  background-size: 200% 100%;
  animation: shimmer 1.2s ease-in-out infinite;
}

.skeleton-media {
  aspect-ratio: 1;
}

.skeleton-line {
  height: 1rem;
  margin: 0.9rem 1rem 0;
  border-radius: 4px;
}

.skeleton-line--short {
  width: 40%;
}

@keyframes shimmer {
  to {
    background-position: -200% 0;
  }
}

@media (prefers-reduced-motion: reduce) {
  .skeleton-media,
  .skeleton-line {
    animation: none;
  }
}
</style>
