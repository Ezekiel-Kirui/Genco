const PLACEHOLDER_PATTERNS = [
    /^mock_/i,
    /replace_me/i,
    /change_me/i,
    /your_/i
]

function isPlaceholder(value) {
    return PLACEHOLDER_PATTERNS.some((pattern) => pattern.test(value || ''))
}

function requireSecret(name) {
    const value = process.env[name]

    if (!value) {
        throw new Error(`${name} is required`)
    }

    if (value.length < 32) {
        throw new Error(`${name} must be at least 32 characters`)
    }

    if (process.env.NODE_ENV === 'production' && isPlaceholder(value)) {
        throw new Error(`${name} must not use a placeholder value in production`)
    }

    return value
}

function validateEnv() {
    requireSecret('JWT_SECRET')
    requireSecret('ADMIN_JWT_SECRET')
}

function getConfigStatus() {
    return {
        nodeEnv: process.env.NODE_ENV || 'development',
        firebaseDatabaseUrlSet: Boolean(process.env.FIREBASE_DATABASE_URL),
        firebaseServiceAccountJsonSet: Boolean(process.env.FIREBASE_SERVICE_ACCOUNT_JSON),
        jwtSecretSet: Boolean(process.env.JWT_SECRET),
        adminJwtSecretSet: Boolean(process.env.ADMIN_JWT_SECRET)
    }
}

module.exports = {
    getConfigStatus,
    validateEnv
}
