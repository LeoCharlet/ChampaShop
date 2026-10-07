<script setup lang="ts">
const props = defineProps<{
  images: string[]
  title: string
}>()

const selectedIndex = ref(0)
const selectedImage = computed(() => props.images[selectedIndex.value] ?? props.images[0])
</script>

<template>
  <div class="gallery">
    <div class="gallery-main">
      <img
        v-if="selectedImage"
        :src="selectedImage"
        :alt="`${title} – image ${selectedIndex + 1} sur ${images.length}`"
        width="600"
        height="600"
      />
    </div>

    <ul v-if="images.length > 1" class="gallery-thumbs" aria-label="Choisir une image">
      <li v-for="(image, index) in images" :key="image">
        <button
          type="button"
          class="thumb"
          :class="{ 'is-selected': index === selectedIndex }"
          :aria-pressed="index === selectedIndex"
          :aria-label="`Afficher l'image ${index + 1} sur ${images.length}`"
          @click="selectedIndex = index"
        >
          <img :src="image" alt="" width="80" height="80" loading="lazy" />
        </button>
      </li>
    </ul>
  </div>
</template>

<style scoped>
.gallery-main {
  aspect-ratio: 1;
  background: #f1ede6;
  border-radius: var(--radius, 10px);
  overflow: hidden;
}

.gallery-main img {
  width: 100%;
  height: 100%;
  object-fit: contain;
}

.gallery-thumbs {
  display: flex;
  flex-wrap: wrap;
  gap: 0.5rem;
  margin: 0.75rem 0 0;
  padding: 0;
  list-style: none;
}

.thumb {
  padding: 0;
  border: 2px solid transparent;
  border-radius: 8px;
  background: #f1ede6;
  cursor: pointer;
  overflow: hidden;
}

.thumb.is-selected {
  border-color: var(--color-primary, #6b1d38);
}

.thumb img {
  width: 4.5rem;
  height: 4.5rem;
  object-fit: contain;
}
</style>
