const express = require('express')
const { addCredential, getAllCredentials, decryptKeyAndSend, deleteKey } = require('../controller/credential')
const { verifyToken } = require('../middleware/Auth')
const { credentailValidation } = require('../middleware/credentialValidation')
const credentialRouter = express.Router()

credentialRouter.get('/get-all', verifyToken, getAllCredentials)

credentialRouter.post('/add', [verifyToken, credentailValidation], addCredential)


credentialRouter.post('/decrypt-key', verifyToken, decryptKeyAndSend)
// credentialRouter.post('/add', credentailValidation, addCredential)


credentialRouter.delete('/delete-api-key/:id', /* verifyToken, */ deleteKey)

module.exports = credentialRouter