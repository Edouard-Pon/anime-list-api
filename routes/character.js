const express = require('express')
const router = express.Router()
const Character = require('../models/character')
const Anime = require('../models/anime')
const { body, validationResult } = require('express-validator')
const { authenticateAdmin } = require('../middleware/auth')
const { uploadImageToGoogleDrive, deleteImageFromGoogleDrive } = require('../utils/googleDrive')
const {validateArray} = require("../utils/validators");


// Get all characters /characters TODO - Add pagination
router.get('/', async (req, res) => {
    try {
        let character =  await Character.find()
        res.json({
            character: character,
        })
    } catch {
        res.status(500).json({ message: 'An error occurred while retrieving the data.' })
    }
})

// Get Character by ID /characters/:id
router.get('/:id', async (req, res) => {
    try {
        let character = await Character.findById(req.params.id)
            .populate('anime')
            .exec()

        res.json({
            character: character,
        })
    } catch {
        res.status(500).json({ message: 'An error occurred while retrieving the data.' })
    }
})

// Search Characters /characters/search
router.post('/search',
    body('name').trim().escape(),
    async (req, res) => {
        const errors = validationResult(req)
        if (!errors.isEmpty()) {
            return res.status(400).json({ errors: errors.array() })
        }

        let searchOptions = {}
        if (req.body.name != null && req.body.name !== '') {
            searchOptions.name = new RegExp(req.body.name, 'i')
        }
        try {
            let character =  await Character.find(searchOptions)
            res.json({
                character: character,
                searchOptions: req.body
            })
        } catch {
            res.status(500).json({ message: 'An error occurred while retrieving the data.' })
        }
    }
)

// Create Character Route - admin only
router.post('/create',
    authenticateAdmin,
    [
        body('name').optional().trim().escape(),
        body('originalName').optional().trim().escape(),
        body('description').optional().trim().escape(),
        body('anime').optional().custom(value => validateArray(value, 'objectId')),
    ],
    async (req, res) => {
        const character = new Character()
        if (req.body.name) character.name = req.body.name
        if (req.body.originalName) character.originalName = req.body.originalName
        if (req.body.description) character.description = req.body.description
        if (character.anime) character.anime = JSON.parse(req.body.anime)
        try {
            if (req.file) {
                req.file.originalname = 'cover'
                character.coverImageUrl = await uploadImageToGoogleDrive(req.file, 'characters', character._id)
            }
            let newCharacter = await character.save()
            res.status(200).json({ message: 'Character created successfully', character: newCharacter })
        } catch (err) {
            res.status(500).json({ message: 'Error creating Character', error: err.message })
        }
    }
)

// Update Character Route - admin only
router.put('/:id',
    authenticateAdmin,
    [
        body('name').trim().escape(),
        body('originalName').trim().escape(),
        body('description').trim().escape(),
        body('anime').optional().custom(value => validateArray(value, 'objectId')),
    ],
    async (req, res) => {
        const errors = validationResult(req)
        if (!errors.isEmpty()) {
            return res.status(400).json({ errors: errors.array() })
        }
        let character
        try {
            character = await Character.findById(req.params.id)
            if (character.name) character.name = req.body.name
            if (character.originalName) character.originalName = req.body.originalName
            if (character.description) character.description = req.body.description
            if (character.anime) character.anime = JSON.parse(req.body.anime)
            if (req.file) {
                req.file.originalname = 'cover'
                character.coverImageUrl = await uploadImageToGoogleDrive(req.file, 'characters', character._id)
            }
            await character.save()

            character = await Character.findById(req.params.id)
                .populate('anime')
                .exec()

            res.json({ message: 'Character updated successfully', character: character })
        } catch {
            if (character == null) {
                res.status(404).json({ message: 'Character not found' })
            } else {
                res.status(500).json({ message: 'Error updating Character' })
            }
        }
    }
)

// Delete Character Route - admin only
router.delete('/:id', authenticateAdmin, async (req, res) => {
    try {
        const character = await Character.findById(req.params.id)
        if (character == null) {
            return res.status(404).json({ message: 'Character not found' })
        }

        const parentFolderName = character._id.toString()
        await deleteImageFromGoogleDrive(character.coverImageUrl, parentFolderName)

        await Character.deleteOne({ _id: req.params.id })

        res.json({ message: 'Character deleted successfully' })
    } catch (err) {
        res.status(500).json({ message: 'Error deleting Character', error: err.message })
    }
})

module.exports = router
