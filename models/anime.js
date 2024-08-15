const mongoose = require('mongoose')
const Character = require('./character')

const animeSchema = new mongoose.Schema({
    title: {
        type: String,
        required: true
    },
    type: {
        type: String,
        required: true,
    },
    episodes: {
        type: Number,
        required: true
    },
    status: {
        type: String,
        required: true,
        enum: ['Ongoing', 'Announced', 'Out']
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
    source: {
        type: String
    },
    externalLink: {
        type: String
    },
    coverImageUrl: {
        type: String,
        required: true
    },
    genres: {
        type: [String],
        required: true
    },
    themes: {
        type: [String],
    },
    duration: {
        type: String,
    },
    rating: {
        type: Number,
    },
    character: {
        type: [mongoose.Schema.Types.ObjectId],
        ref: 'Character'
    }
})

animeSchema.pre('remove', function (next) {
    Character.find({ anime: this.id }, (err, characters) => {
        if (err) {
            next(err)
        } else if (characters.length > 0) {
            next(new Error('This anime is pinned to characters'))
        } else {
            next()
        }
    })
})

module.exports = mongoose.model('Anime', animeSchema)
