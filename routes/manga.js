const express = require('express')
const router = express.Router()
const Manga = require('../models/manga')
const { authenticateAdmin } = require('../middleware/auth')
const { body, validationResult } = require('express-validator')
const { uploadImageToGoogleDrive, deleteImageFromGoogleDrive } = require('../utils/googleDrive')


// Get all manga's /manga - no auth required
router.get('/', async (req, res) => {
    try {
        const { type } = req.query

        const manga = await Manga.find({
            uploadDate: 'desc',
            type: type ? type : { $ne: null }
        }).exec()

        res.json(manga)
    } catch (e) {
        res.status(500).json({ message: 'An error occurred while retrieving the data.' })
    }
})

// Get Manga by ID /manga/:id - no auth required
router.get('/:id', async (req, res) => {
    try {
        const manga = await Manga.findById(req.params.id).exec()

        res.json(manga)
    } catch {
        res.status(500).json({ message: 'An error occurred while retrieving the data.' })
    }
})

// Create Manga /manga/create - admin required
router.post('/create',
    authenticateAdmin,
    body('type').optional().trim().escape(),
    body('title').optional().trim().escape(),
    body('description').optional().trim().escape(),
    body('releaseDate').optional().toDate(),
    body('status').optional().trim().escape(),
    body('rating').optional().toInt(),
    body('chapters').optional().toInt(),
    async (req, res) => {
        const errors = validationResult(req)
        if (!errors.isEmpty()) {
            return res.status(400).json({ errors: errors.array() })
        }

        const manga = new Manga()

        if (req.body.type) manga.type = req.body.type
        if (req.body.title) manga.title = req.body.title
        if (req.body.description) manga.description = req.body.description
        if (req.body.releaseDate) manga.releaseDate = req.body.releaseDate
        if (req.body.status) manga.status = req.body.status
        if (req.body.rating) manga.rating = req.body.rating
        if (req.body.chapters) manga.chapters = req.body.chapters

        try {
            if (req.file) {
                req.file.originalname = 'cover'
                manga.coverImageUrl = await uploadImageToGoogleDrive(req.file, 'manga', manga._id)
            }
            const newManga = await manga.save()
            res.status(201).json(newManga)
        } catch (e) {
            res.status(500).json({ message: `Error creating new title` })
        }
    }
)

// Update Manga /manga/update/:id - admin required
router.put('/update/:id',
    authenticateAdmin,
    body('type').optional().trim().escape(),
    body('title').optional().trim().escape(),
    body('description').optional().trim().escape(),
    body('releaseDate').optional().toDate(),
    body('status').optional().trim().escape(),
    body('rating').optional().toInt(),
    body('chapters').optional().toInt(),
    async (req, res) => {
        const errors = validationResult(req)
        if (!errors.isEmpty()) {
            return res.status(400).json({ errors: errors.array() })
        }

        try {
            const manga = await Manga.findById(req.params.id).exec()

            if (req.body.type) manga.type = req.body.type
            if (req.body.title) manga.title = req.body.title
            if (req.body.description) manga.description = req.body.description
            if (req.body.releaseDate) manga.releaseDate = req.body.releaseDate
            if (req.body.status) manga.status = req.body.status
            if (req.body.rating) manga.rating = req.body.rating
            if (req.body.chapters) manga.chapters = req.body.chapters

            if (req.file) {
                req.file.originalname = 'cover'
                manga.coverImageUrl = await uploadImageToGoogleDrive(req.file, 'manga', manga._id)
            }

            const updatedManga = await manga.save()
            res.status(200).json(updatedManga)
        } catch (e) {
            res.status(500).json({ message: `Error updating title` })
        }
    }
)

// Delete Manga /manga/delete/:id - admin required
router.delete('/delete/:id', authenticateAdmin, async (req, res) => {
    try {
        const manga = await Manga.findById(req.params.id).exec()
        if (!manga) {
            return res.status(404).json({ message: 'Title not found' })
        }

        const parentFolderName = manga._id.toString()
        await deleteImageFromGoogleDrive(manga.coverImageUrl, parentFolderName)

        await Manga.deleteOne({ _id: req.params.id })

        res.status(200).json({ message: 'Title successfully deleted' })
    } catch (e) {
        res.status(500).json({ message: 'Error deleting title' })
    }
})

module.exports = router
