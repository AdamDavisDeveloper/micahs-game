import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
// ESLint disabled during dev - run `yarn lint` manually if needed
// import eslint from 'vite-plugin-eslint';

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [
    // eslint({
    //   cache: false,
    //   failOnError: false,
    //   failOnWarning: false,
    // }),
    react(),
  ],
});
