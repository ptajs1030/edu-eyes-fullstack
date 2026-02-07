npm install --platform=linux --arch=arm64
npm install @rollup/rollup-linux-arm64-gnu @esbuild/linux-arm64
rm -rf node_modules/.vite
npm run build
exit
