// @ts-check
import withNuxt from './.nuxt/eslint.config.mjs'

export default withNuxt({
  rules: {
    '@typescript-eslint/no-explicit-any': 'error',
    // La mise en forme est gérée par Prettier (qui écrit <img />)
    'vue/html-self-closing': 'off',
  },
})
