const itemsRouter = require('express').Router()
const Item = require('../models/item')

itemsRouter.get('/seeds', async (request, response) => {
    try {
        const seeds = await Item.find({ type: 'Seed' })

        const sortedSeeds = seeds.sort((a, b) => {
            return a.precedence - b.precedence
        })

        response.json(sortedSeeds.map(Item.format))
    } catch (exception) {
        console.log(exception)
        response.status(500).json({ error: 'Something went wrong...' })
    }
})

itemsRouter.get('/clean_herbs', async (request, response) => {
    try {
        const cleanHerbs = await Item.find({ type: 'Clean herb' })

        const sortedCleanHerbs = cleanHerbs.sort((a, b) => {
            return a.precedence - b.precedence
        })

        response.json(sortedCleanHerbs.map(Item.format))
    } catch (exception) {
        console.log(exception)
        response.status(500).json({ error: 'Something went wrong...' })
    }
})

itemsRouter.get('/grimy_herbs', async (request, response) => {
    try {
        const grimyHerbs = await Item.find({ type: 'Grimy herb' })

        const sortedGrimyHerbs = grimyHerbs.sort((a, b) => {
            return a.precedence - b.precedence
        })

        response.json(sortedGrimyHerbs.map(Item.format))
    } catch (exception) {
        console.log(exception)
        response.status(500).json({ error: 'Something went wrong...' })
    }
})

module.exports = itemsRouter