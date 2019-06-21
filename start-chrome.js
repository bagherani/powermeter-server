const { exec } = require('child_process');
exec('chromium-browser --kiosk http://localhost:3000', (err, stdout, stderr) => {
  if (err) {
    return;
  }
});

