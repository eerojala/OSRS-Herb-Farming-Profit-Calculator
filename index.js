const http = require('http')
const express = require('express')
const bodyParser = require('body-parser')
const cors = require('cors')
const mongoose = require('mongoose')
const cron = require('node-cron')

const itemsRouter = require('./controllers/items')

const app = express()
const config = require('./util/config')
const fetchData = require('./util/fetch_data')

mongoose
    .connect(config.mongoUrl, { useNewUrlParser: true })
    .then(() => {
        console.log('Connected to database')
    })
    .catch (error => {
        console.log(error)
    })

mongoose.Promise = global.Promise

app.use(cors())
app.use(bodyParser.json())
app.use(express.static('build'))

app.use('/api/items', itemsRouter)

fetchData.saveDataFromApi() // Fetch data when the server is started
cron.schedule('5 0 * * *', fetchData.saveDataFromApi) // And then fetch the data every day at 00:05 (five minutes over midnight)

const server = http.createServer(app)

server.listen(config.port, () => {
    console.log(`Server running of port ${config.port}`)
})

server.on('close', () => {
    mongoose.connection.close()
})

module.exports = { app, server }