const express = require('express')
const router = express.Router()
const Anime = require('../models/anime')
const Character = require('../models/character')
const { authenticateToken, authenticateAdmin } = require('../middleware/auth')
const { body, validationResult } = require('express-validator')
const { uploadImageToGoogleDrive, deleteImageFromGoogleDrive } = require('../utils/googleDrive')
const { validateArray } = require('../utils/validators')
const { sanitizeString } = require('../utils/sanitizers')


// Get all anime's /anime - no auth required TODO - Add pagination
router.get('/', async (req, res) => {
    let query = Anime.find()
    try {
        let anime = await query.sort({ createdAt: 'desc' }).exec()
        res.json({
            anime: anime,
        })
    } catch {
        res.status(500).json({ message: 'An error occurred while retrieving the data.' })
    }
})

// Get Anime by ID /anime/:id - no auth required
router.get('/:id', async (req, res) => {
    try {
        let anime = await Anime.findById(req.params.id)
            .populate('characters')
            .exec()

        res.json(anime)
    } catch {
        res.status(500).json({ message: 'An error occurred while retrieving the data.' })
    }
})

// Search Anime's /anime/search - no auth required
router.post('/search',
    body('title').trim().escape(),
    body('publishedBefore').toDate(),
    body('publishedAfter').toDate(),
    async (req, res) => {
        const errors = validationResult(req)
        if (!errors.isEmpty()) {
            return res.status(400).json({ errors: errors.array() })
        }

        let query = Anime.find()
        if (req.body.title != null && req.body.title !== '') {
            try {
                query = query.regex('title', new RegExp(req.body.title, 'i'))
            } catch (e) {
                return res.status(400).json({ message: 'Invalid title format' })
            }
        }
        if (req.body.releasedBefore != null && req.body.releasedBefore !== '') {
            query = query.lte('releaseDate', req.body.releasedBefore)
        }
        if (req.body.releasedAfter != null && req.body.releasedAfter !== '') {
            query = query.gte('releaseDate', req.body.releasedAfter)
        }
        try {
            let anime = await query.sort({ createdAt: 'desc' }).exec()
            res.json({
                anime: anime,
                searchOptions: req.body
            })
        } catch {
            res.status(500).json({ message: 'An error occurred while retrieving the data.' })
        }
    }
)

// Create Anime Route - admin auth required
router.post('/create',
    authenticateAdmin,
    [
        body('title').optional().trim().escape(),
        body('type').optional().trim().escape(),
        body('episodes').optional().toInt(),
        body('status').optional().trim().escape(),
        body('description').optional().trim().escape(),
        body('releaseDate').optional().toDate(),
        body('source').optional().trim().escape(),
        body('externalLink').optional().trim().escape(),
        body('genres').optional().custom(value => validateArray(value, 'string')),
        body('themes').optional().custom(value => validateArray(value, 'string')),
        body('duration').optional().trim().escape(),
        body('rating').optional().isNumeric().toInt(),
        body('characters').optional().custom(value => validateArray(value, 'objectId')),
    ],
    async (req, res) => {
        const errors = validationResult(req)
        if (!errors.isEmpty()) {
            return res.status(400).json({ errors: errors.array() })
        }
        const anime = new Anime()
        if (req.body.title) anime.title = req.body.title
        if (req.body.type) anime.type = req.body.type
        if (req.body.episodes) anime.episodes = req.body.episodes
        if (req.body.status) anime.status = req.body.status
        if (req.body.description) anime.description = req.body.description
        if (req.body.releaseDate) anime.releaseDate = req.body.releaseDate
        if (req.body.source) anime.source = req.body.source
        if (req.body.externalLink) anime.externalLink = req.body.externalLink
        if (req.body.genres) anime.genres = JSON.parse(req.body.genres).map(item => sanitizeString(item.trim()))
        if (req.body.themes) anime.themes = JSON.parse(req.body.themes).map(item => sanitizeString(item.trim()))
        if (req.body.duration) anime.duration = req.body.duration
        if (req.body.rating) anime.rating = req.body.rating
        if (req.body.characters) anime.characters = JSON.parse(req.body.characters)
        try {
            if (req.file) {
                req.file.originalname = 'cover'
                anime.coverImageUrl = await uploadImageToGoogleDrive(req.file, 'anime', anime._id)
            }
            let newAnime = await anime.save()
            res.json({ message: 'Anime created successfully', anime: newAnime })
        } catch (err) {
            res.status(500).json({ message: 'Error creating new anime', error: err.message })
        }
    }
)

// Update Anime Route - admin auth required
router.put('/:id',
    authenticateAdmin,
    [
        body('title').optional().trim().escape(),
        body('type').optional().trim().escape(),
        body('episodes').optional().toInt(),
        body('status').optional().trim().escape(),
        body('description').optional().trim().escape(),
        body('releaseDate').optional().toDate(),
        body('source').optional().trim().escape(),
        body('externalLink').optional().trim().escape(),
        body('genres').optional().custom(value => validateArray(value, 'string')),
        body('themes').optional().custom(value => validateArray(value, 'string')),
        body('duration').optional().trim().escape(),
        body('rating').optional().isNumeric().toInt(),
        body('characters').optional().custom(value => validateArray(value, 'objectId')),
    ],
    async (req, res) => {
        const errors = validationResult(req)
        if (!errors.isEmpty()) {
            return res.status(400).json({ errors: errors.array() })
        }
        try {
            let anime = await Anime.findById(req.params.id)

            if (!anime) {
                return res.status(404).json({ message: 'Anime not found' })
            }

            if (req.body.title) anime.title = req.body.title
            if (req.body.type) anime.type = req.body.type
            if (req.body.episodes) anime.episodes = req.body.episodes
            if (req.body.status) anime.status = req.body.status
            if (req.body.description) anime.description = req.body.description
            if (req.body.releaseDate) anime.releaseDate = req.body.releaseDate
            if (req.body.source) anime.source = req.body.source
            if (req.body.externalLink) anime.externalLink = req.body.externalLink
            if (req.body.genres) anime.genres = JSON.parse(req.body.genres).map(item => sanitizeString(item.trim()))
            if (req.body.themes) anime.themes = JSON.parse(req.body.themes).map(item => sanitizeString(item.trim()))
            if (req.body.duration) anime.duration = req.body.duration
            if (req.body.rating) anime.rating = req.body.rating
            if (req.body.characters) anime.characters = JSON.parse(req.body.characters)

            if (req.file) {
                req.file.originalname = 'cover'
                anime.coverImageUrl = await uploadImageToGoogleDrive(req.file, 'anime', anime._id)
            }

            await anime.save()
            res.json({ message: 'Anime updated successfully', anime: anime })
        } catch (e) {
            res.status(400).json({ message: 'Error updating Anime' })
        }
    }
)

// Delete Anime Page - admin auth required
router.delete('/:id', authenticateAdmin, async (req, res) => {
    try {
        const anime = await Anime.findById(req.params.id)
        if (anime == null) {
            return res.status(404).json({ message: 'Anime not found' })
        }

        const characters = await Character.find({ anime: anime._id })
        if (characters.length > 0) {
            return res.status(400).json({ message: 'This anime is pinned to characters' })
        }

        const parentFolderName = anime._id.toString()
        await deleteImageFromGoogleDrive(anime.coverImageUrl, parentFolderName)

        await Anime.deleteOne({ _id: req.params.id })

        res.json({ message: 'Anime successfully deleted' })
    } catch (err) {
        res.status(500).json({ message: 'Error deleting anime', error: err.message })
    }
})

module.exports = router
