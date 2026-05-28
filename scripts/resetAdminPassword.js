const bcrypt = require('bcryptjs')
const db = require('../config/firebase')

function validatePassword(password) {
    const rules = [
        { test: /.{12,}/, msg: 'At least 12 characters' },
        { test: /[A-Z]/, msg: 'At least one uppercase letter' },
        { test: /[a-z]/, msg: 'At least one lowercase letter' },
        { test: /[0-9]/, msg: 'At least one number' },
        { test: /[^A-Za-z0-9]/, msg: 'At least one special character' }
    ]

    return rules.filter((rule) => !rule.test.test(password))
}

async function main() {
    const [, , emailArg, passwordArg] = process.argv
    const email = (emailArg || process.env.ADMIN_EMAIL || '').toLowerCase().trim()
    const password = passwordArg || process.env.ADMIN_PASSWORD || ''

    if (!email || !password) {
        console.error('Usage: node scripts/resetAdminPassword.js <admin-email> <new-password>')
        process.exit(1)
    }

    const errors = validatePassword(password)
    if (errors.length) {
        console.error('Password too weak. Requirements not met:')
        errors.forEach((error) => console.error(`  - ${error.msg}`))
        process.exit(1)
    }

    const snap = await db.realtime.ref('admins')
        .orderByChild('email')
        .equalTo(email)
        .limitToFirst(1)
        .get()

    if (!snap.exists()) {
        console.error(`Admin not found for email: ${email}`)
        process.exit(1)
    }

    let adminId = null
    snap.forEach((child) => {
        adminId = child.key
    })

    const hashedPassword = await bcrypt.hash(password, 12)
    await db.realtime.ref(`admins/${adminId}`).update({
        password: hashedPassword,
        is_active: true,
        password_updated_at: new Date().toISOString()
    })

    console.log(`Password reset for admin ${adminId} (${email}).`)
}

main()
    .then(() => process.exit(0))
    .catch((err) => {
        console.error(err.message)
        process.exit(1)
    })
