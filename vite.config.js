import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { viteSingleFile } from 'vite-plugin-singlefile';
export default defineConfig(({mode})=>({base:'./',plugins:[react(),...(mode==='single'?[viteSingleFile()]:[])],build:{outDir:mode==='single'?'dist-single':'dist',target:'chrome108',assetsInlineLimit:mode==='single'?50000000:4096}}));
