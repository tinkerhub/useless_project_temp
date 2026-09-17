import {defineConfig} from '@playwright/test';
export default defineConfig({
  testDir:'./tests', testMatch:'hosted.spec.js', timeout:120000, workers:1,
  use:{baseURL:'http://127.0.0.1:4173', channel:'chrome', headless:true},
  webServer:{command:'npm run preview',url:'http://127.0.0.1:4173',reuseExistingServer:!process.env.CI}
});
