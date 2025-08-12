const express = require('express')
const app = express()
require('dotenv').config()
const port = process.env.PORT || 5000
const cors = require('cors')
const upload = require('express-fileupload')
const db = require('./config/db')
const superRouter = require('./router/adminSuper')
const vendorRouter = require('./router/vendor')
const planRouter = require('./router/plan')
const empRouter = require('./router/employee')
const path = require('path')
const jobRouter = require('./router/job')
const trackRouter = require('./router/tracking')
const credentialRouter = require('./router/credential')
const feedRouter = require('./router/feedBack')
const shiftRouter = require('./router/shift')
const stateRouter = require('./router/state')


db()

app.use(cors({ origin: '*', methods: '*' }))
app.use(express.json())
app.use(upload())

app.use(express.static(__dirname + 'assets'));
app.use('/images', express.static(__dirname + '/assets'));

app.use('/v1/admin', superRouter)

app.use('/v1/plan', planRouter)

app.use('/v1/emp', empRouter)

app.use('/v1/vendor', vendorRouter)

app.use('/v1/job', jobRouter)

app.use('/v1/tracking', trackRouter)

app.use('/v1/credentials', credentialRouter)

app.use('/v1/feed', feedRouter)

app.use('/v1/shift', shiftRouter)

app.use('/v1/state', stateRouter)

app.use(express.static(path.join(__dirname, 'build')));

/* app.get('/', (req, res) => {
    return res.status(200).json({ msg: 'Ok ', success: true })
}) */

// app.get('*', (req, res) => {
//     return res.sendFile(path.join(__dirname, "build", "index.html"))
// })


app.listen(port, () => console.log(`Example app listening on port ${port}!`))