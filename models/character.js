const mongoose = require('mongoose')

const characterSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true
    },
    originalName: {
        type: String,
    },
    description: {
        type: String
    },
    coverImageUrl: {
        type: String,
        required: true
    },
    anime: {
        type: [mongoose.Schema.Types.ObjectId],
        ref: 'Anime'
    },
    uploadDate: {
        type: Date,
        required: true,
        default: Date.now
    }
})

module.exports = mongoose.model('Character', characterSchema)
