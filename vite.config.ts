import { defineConfig } from 'vite'
import { reffect } from './vite-plugin-reffect'

export default defineConfig({
  plugins: [
    reffect()
  ]
})