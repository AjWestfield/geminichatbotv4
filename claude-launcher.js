#!/usr/bin/env /Users/andersonwestfield/.nvm/versions/node/v18.20.5/bin/node
// Claude Code launcher script
const { spawn } = require('child_process');
const path = require('path');

const claudePath = '/Users/andersonwestfield/.nvm/versions/node/v18.20.5/bin/claude';
const args = process.argv.slice(2);

const claude = spawn(claudePath, args, {
  stdio: 'inherit',
  env: process.env
});

claude.on('close', (code) => {
  process.exit(code);
});
