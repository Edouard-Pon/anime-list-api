const { google } = require('googleapis')
const stream = require('stream')

const serviceAccount = Buffer.from(process.env.GOOGLE_SERVICE_ACCOUNT_BASE64, 'base64').toString('utf-8')

const auth = new google.auth.GoogleAuth({
    credentials: JSON.parse(serviceAccount),
    scopes: [process.env.GOOGLE_DRIVE_SCOPES],
})

const drive = google.drive({ version: 'v3', auth })

const folderMap = {
    'anime': process.env.GOOGLE_DRIVE_FOLDER_ANIME_ID,
    'characters': process.env.GOOGLE_DRIVE_FOLDER_CHARACTERS_ID,
}

async function uploadImageToGoogleDrive(file, type, id) {
    const folderId = folderMap[type]

    try {
        const subFolderId = await getOrCreateFolder(folderId, id, drive)

        const bufferStream = new stream.PassThrough()
        bufferStream.end(file.buffer)

        const response = await drive.files.create({
            requestBody: {
                name: file.originalname,
                parents: [subFolderId],
            },
            media: {
                mimeType: file.mimetype,
                body: bufferStream,
            },
            fields: 'id',
        })

        const fileId = response.data.id

        await drive.permissions.create({
            fileId: fileId,
            requestBody: {
                role: 'reader',
                type: 'anyone',
            },
        })

        return `${process.env.GOOGLE_DRIVE_FILE_URL_PREFIX}${fileId}`
    } catch (error) {
        throw new Error('Failed to upload image to Google Drive')
    }
}

async function deleteImageFromGoogleDrive(imageUrl, parentFolderName) {
    const fileId = imageUrl.split('/').pop()

    try {
        const parentFolderId = await getFolderIdByName(parentFolderName)

        await drive.files.delete({
            fileId: fileId,
        })

        await drive.files.delete({
            fileId: parentFolderId,
        })
    } catch (error) {
        throw new Error('Failed to delete image or parent folder from Google Drive')
    }
}

async function getFolderIdByName(folderName) {
    const response = await drive.files.list({
        q: `name='${folderName}' and mimeType='application/vnd.google-apps.folder' and trashed=false`,
        fields: 'files(id, name)',
    })

    if (response.data.files.length) {
        return response.data.files[0].id
    } else {
        throw new Error('Folder not found')
    }
}

async function getOrCreateFolder(parentFolderId, folderName, drive) {
    const response = await drive.files.list({
        q: `'${parentFolderId}' in parents and name='${folderName}' and mimeType='application/vnd.google-apps.folder' and trashed=false`,
        fields: 'files(id, name)',
    })

    if (response.data.files.length) {
        return response.data.files[0].id
    }

    const folder = await drive.files.create({
        resource: {
            name: folderName,
            mimeType: 'application/vnd.google-apps.folder',
            parents: [parentFolderId],
        },
        fields: 'id',
    })

    return folder.data.id
}

module.exports = {
    uploadImageToGoogleDrive,
    deleteImageFromGoogleDrive,
}
