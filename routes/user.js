const secretKey = process.env.SECRET_KEY
const express = require('express')
const router = express.Router()
const User = require('../models/user')
const jwt = require('jsonwebtoken')
const { body, validationResult } = require('express-validator')


router.post('/login',
    body('username').trim().escape(),
    body('password').trim().escape(),
    async (req, res) => {
        const errors = validationResult(req)
        if (!errors.isEmpty()) {
            return res.status(400).json({ errors: errors.array() })
        }

        const { username, password } = req.body

        const user = await User.findOne({ username })
        if (!user) {
            return res.status(401).json({ message: 'Authentication failed.' })
        }

        user.comparePassword(password, (err, isMatch) => {
            if (err) {
                return res.status(500).json({ message: 'Error authenticating user.' })
            }
            if (!isMatch) {
                return res.status(401).json({ message: 'Authentication failed.' })
            }

            const token = jwt.sign({ role: user.role, username: user.username, id: user._id }, secretKey, {
                expiresIn: 10080
            })
            res.status(200).json({ success: true, token: 'JWT ' + token, user: { username: user.username, role: user.role, _id: user._id, created_at: user.createdDate } })
        })
    }
)

router.post('/register',
    body('username').trim().escape(),
    body('password').trim().escape(),
    async (req, res) => {
        if (process.env.REGISTRATION_DISABLED === 'true') return res.status(400).json({ message: 'Registration is disabled.' })
        const errors = validationResult(req)
        if (!errors.isEmpty()) {
            return res.status(400).json({ errors: errors.array() })
        }

        const { username, password } = req.body

        const existingUser = await User.findOne({ username })
        if (existingUser) {
            return res.status(400).json({ message: 'Username already exists.' })
        }

        const user = new User({ username, password })

        try {
            await user.save()

            const token = jwt.sign({ role: user.role, username: user.username, id: user._id }, secretKey, {
                expiresIn: 10080
            })

            res.status(200).json({ message: 'User registered successfully.', token: 'JWT ' + token, user: { username: user.username, role: user.role, id: user._id, created_at: user.createdDate } })
        } catch (err) {
            res.status(500).json({message: 'Error registering new user.'})
        }
    }
)

module.exports = router
