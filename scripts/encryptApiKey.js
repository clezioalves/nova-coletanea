#!/usr/bin/env node
const { scryptSync, randomBytes, createCipheriv } = require('crypto');
const argv = require('minimist')(process.argv.slice(2));

function usage() {
  console.log('Usage: node scripts/encryptApiKey.js --key <API_KEY> --pass <PASSPHRASE>');
  console.log('Outputs a base64 token that you can put in ENCRYPTED_DRIVE_API_KEY');
}

if (!argv.key || !argv.pass) {
  usage();
  process.exit(1);
}

const apiKey = String(argv.key);
const pass = String(argv.pass);

// Generate random salt and iv
const salt = randomBytes(16);
const iv = randomBytes(12);

// derive key
const key = scryptSync(pass, salt, 32);

const cipher = createCipheriv('aes-256-gcm', key, iv);
const ciphertext = Buffer.concat([cipher.update(apiKey, 'utf8'), cipher.final()]);
const tag = cipher.getAuthTag();

// output format: base64(salt||iv||tag||ciphertext)
const out = Buffer.concat([salt, iv, tag, ciphertext]).toString('base64');
console.log(out);
