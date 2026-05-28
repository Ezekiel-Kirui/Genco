const crypto = require('crypto')

function secret() {
    return crypto.randomBytes(48).toString('base64url')
}

console.log(`JWT_SECRET=${secret()}`)
console.log(`ADMIN_JWT_SECRET=${secret()}`)
