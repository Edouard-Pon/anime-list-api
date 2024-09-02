const mongoose = require('mongoose')

const mangaSchema = new mongoose.Schema({
    type: {
        type: String,
        required: true,
        enum: ['Manga', 'Manhwa', 'Manhua']
    },
    title: {
        type: String,
        required: true
    },
    description: {
        type: String,
    },
    releaseDate: {
        type: Date,
    },
    uploadDate: {
        type: Date,
        required: true,
        default: Date.now
    },
    status: {
        type: String,
        required: true,
        enum: ['Ongoing', 'Announced', 'Out']
    },
    rating: {
        type: Number,
    },
    chapters: {
        type: Number,
        required: true
    },
    coverImageUrl: {
        type: String,
        required: true
    },
})

module.exports = mongoose.model('Manga', mangaSchema)
