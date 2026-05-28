const bcrypt = require('bcryptjs')
const db = require('../config/firebase')

function mask(value) {
    if (!value) return 'not set'
    if (value.length <= 12) return 'set'
    return `${value.slice(0, 6)}...${value.slice(-6)}`
}

async function main() {
    const [, , emailArg, passwordArg] = process.argv
    const email = (emailArg || process.env.ADMIN_EMAIL || '').toLowerCase().trim()
    const password = passwordArg || process.env.ADMIN_PASSWORD || ''

    if (!email) {
        console.error('Usage: node scripts/diagnoseAdminLogin.js <admin-email> [password]')
        process.exit(1)
    }

    console.log('Firebase database URL:', mask(process.env.FIREBASE_DATABASE_URL || ''))
    console.log('Firebase service account JSON:', process.env.FIREBASE_SERVICE_ACCOUNT_JSON ? 'set' : 'not set')
    console.log('Admin JWT secret:', process.env.ADMIN_JWT_SECRET ? 'set' : 'not set')

    const snap = await db.realtime.ref('admins')
        .orderByChild('email')
        .equalTo(email)
        .limitToFirst(1)
        .get()

    if (!snap.exists()) {
        console.log(`Admin found for ${email}: no`)
        process.exit(0)
    }

    let adminId = null
    let adminData = null
    snap.forEach((child) => {
        adminId = child.key
        adminData = child.val()
    })

    const storedPassword = String(adminData.password || '')
    console.log(`Admin found for ${email}: yes`)
    console.log('Admin ID:', adminId)
    console.log('Admin active:', adminData.is_active === true)
    console.log('Password is bcrypt hash:', /^\$2[aby]\$\d{2}\$/.test(storedPassword))
    console.log('Password hash length:', storedPassword.length)
    console.log('Password updated at:', adminData.password_updated_at || 'not set')
    console.log('Last login:', adminData.last_login || 'not set')
    console.log('Login count:', adminData.login_count || 0)

    if (password) {
        const valid = await bcrypt.compare(password, storedPassword)
        console.log('Provided password matches:', valid)
    } else {
        console.log('Provided password matches: skipped, no password argument')
    }
}

main()
    .then(() => process.exit(0))
    .catch((err) => {
        console.error(err.message)
        process.exit(1)
    })
