#!/usr/bin/env node
// ==============================================================================
// KEKEGO — Production Cryptographic Secret Generator
// Generates high-entropy random keys suitable for production environment secrets
// ==============================================================================

import crypto from "node:crypto";

function generateSecret(bytes = 64) {
  return crypto.randomBytes(bytes).toString("hex");
}

console.log("==================================================================");
console.log("KEKEGO PRODUCTION SECRET GENERATOR");
console.log("Copy and assign these values into your secure production vault / .env.production");
console.log("==================================================================\n");

console.log(`JWT_ACCESS_SECRET=${generateSecret(64)}`);
console.log(`JWT_REFRESH_SECRET=${generateSecret(64)}`);
console.log(`POSTGRES_PASSWORD=${generateSecret(32)}`);
console.log(`REDIS_PASSWORD=${generateSecret(32)}`);
console.log(`BOOTSTRAP_ADMIN_SECRET=${generateSecret(32)}`);
console.log(`SESSION_SECRET=${generateSecret(48)}`);

console.log("\n==================================================================");
console.log("IMPORTANT: Never commit these generated secrets to version control.");
console.log("==================================================================");
