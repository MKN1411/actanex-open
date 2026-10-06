const {defineConfig,devices} = require('@playwright/test');
module.exports=defineConfig({
  testDir:'tests/ui',
  use:{baseURL:'http://127.0.0.1:3197'},
  projects:[{name:'desktop',use:{...devices['Desktop Chrome'],channel:'msedge'}},{name:'mobile',use:{...devices['iPhone 13'],defaultBrowserType:'chromium',channel:'msedge'}}],
  webServer:{command:'node installer/server.js',url:'http://127.0.0.1:3197/api/health',env:{PORT:'3197',NO_BROWSER:'1'},reuseExistingServer:false}
});
