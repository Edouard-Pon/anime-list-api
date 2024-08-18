const mongoose = require('mongoose')

function validateArray(value, type = 'string') {
    try {
        const parsed = JSON.parse(value)
        if (!Array.isArray(parsed)) {
            throw new Error(`${type.charAt(0).toUpperCase() + type.slice(1)} must be an array`)
        }
        parsed.forEach((item) => {
            if (type === 'string') {
                if (typeof item !== 'string') throw new Error(`Each item in array must be a ${type}`)
            } else if (type === 'objectId' && !mongoose.Types.ObjectId.isValid(item)) {
                throw new Error('Invalid ObjectId in array')
            }
        })
        return true
    } catch (e) {
        throw new Error(`Invalid JSON format for ${type}`)
    }
}

module.exports = {
    validateArray
}
