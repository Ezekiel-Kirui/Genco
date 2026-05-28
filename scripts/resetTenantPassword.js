const bcrypt = require('bcryptjs')
const db = require('../config/firebase')

async function main() {
    const [, , emailArg, passwordArg] = process.argv
    const email = (emailArg || process.env.TENANT_EMAIL || '').toLowerCase().trim()
    const password = passwordArg || process.env.TENANT_PASSWORD || ''

    if (!email || !password) {
        console.error('Usage: node scripts/resetTenantPassword.js <tenant-email> <new-password>')
        process.exit(1)
    }

    if (password.length < 6) {
        console.error('Password must be at least 6 characters.')
        process.exit(1)
    }

    const snap = await db.realtime.ref('tenants')
        .orderByChild('email')
        .equalTo(email)
        .limitToFirst(1)
        .get()

    if (!snap.exists()) {
        console.error(`Tenant not found for email: ${email}`)
        process.exit(1)
    }

    let tenantId = null
    snap.forEach((child) => {
        tenantId = child.key
    })

    const hashedPassword = await bcrypt.hash(password, 10)
    await db.realtime.ref(`tenants/${tenantId}`).update({
        password: hashedPassword,
        password_updated_at: new Date().toISOString()
    })

    console.log(`Password reset for tenant ${tenantId} (${email}).`)
}

main()
    .then(() => process.exit(0))
    .catch((err) => {
        console.error(err.message)
        process.exit(1)
    })
