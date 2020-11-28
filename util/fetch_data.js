const axios = require('axios')
const Item = require('../models/item')
const { seedIds, cleanHerbIds, grimyHerbIds } = require('./itemIds')
const { names } = require('./names')

const searchGrimyUrl = 'http://services.runescape.com/m=itemdb_oldschool/api/catalogue/items.json?category=1&alpha=grimy&page='
const baseSearchItemUrl = 'http://services.runescape.com/m=itemdb_oldschool/api/catalogue/items.json?category=1&alpha='

const assignPrecedence = (item) => { 
    // Seeds and clean/grimy herbs are assigned a precedence value
    // so they can be sorted based on their required farming/herblore level in increasing order 
    // (Guam leaf requries the lowest level while Torstol requires the highest)
    switch (item.name) {             
        case 'Guam seed':            
        case 'Guam leaf':
        case 'Grimy guam leaf':
            item.precedence = 1
            break
        case 'Marrentill seed':
        case 'Marrentill':
        case 'Grimy marrentill':
            item.precedence = 2
            break
        case 'Tarromin seed':
        case 'Tarromin':
        case 'Grimy tarromin':
            item.precedence = 3
            break
        case 'Harralander seed':
        case 'Harralander':
        case 'Grimy harralander':
            item.precedence = 4
            break
        case 'Ranarr seed':
        case 'Ranarr weed':
        case 'Grimy ranarr weed':
            item.precedence = 5
            break
        case 'Toadflax seed':
        case 'Toadflax':
        case 'Grimy toadflax':
            item.precedence = 6
            break
        case 'Irit seed':
        case 'Irit leaf':
        case 'Grimy irit leaf':
            item.precedence = 7
            break
        case 'Avantoe seed':
        case 'Avantoe':
        case 'Grimy avantoe':
            item.precedence = 8
            break
        case 'Kwuarm seed':
        case 'Kwuarm':
        case 'Grimy kwuarm':
            item.precedence = 9
            break
        case 'Snapdragon seed':
        case 'Snapdragon':
        case 'Grimy snapdragon':
            item.precedence = 10
            break
        case 'Cadantine seed':
        case 'Cadantine':
        case 'Grimy cadantine':
            item.precedence = 11
            break
        case 'Lantadyme seed':
        case 'Lantadyme':
        case 'Grimy lantadyme':
            item.precedence = 12
            break
        case 'Dwarf weed seed':
        case 'Dwarf weed':
        case 'Grimy dwarf weed':
            item.precedence = 13
            break
        case 'Torstol seed':
        case 'Torstol':
        case 'Grimy torstol':
            item.precedence = 14
            break
        default:
            item.precedence = 99
    }
}

const assignType = (item) => {
    if (seedIds.includes(item.apiId)) {
        item.type = 'Seed'
    } else if (cleanHerbIds.includes(item.apiId)) {
        item.type = 'Clean herb'
    } else if (grimyHerbIds.includes(item.apiId)) {
        item.type = 'Grimy herb'
    } else {
        item.type = 'Unknown'
    }
}

const convertPriceToNumber = (price) => {
    if (price.includes(',')) { // Prices between 1000-9999 are in the form of x,xxx, for example 7,289
        return Number(price.replace(',', ''))
    } else if (price.includes('k')) { // Prices between 10 000-999 999 are rounded to a form of xxx.xk, for example 10.3k 
        return Number(price.replace('k', '')) * 1000
    } else if (price.includes('m')) { // Prices between one million and under one billion are rounded to the form of xxx.xm, for example 265.5m
        return Number(price.replace('m', '')) * 1000000 
    } else if (price.includes('b')) { // Prices starting from one billion are in the form of x.xb, for example 1.2b
        return Number(price.replace('b', '')) * 1000000000 
    } else { // Prices under 1000 are presented as normal, for example 2, 53 or 568
        return Number(price)
    }
    // NOTE: It is extremely unlikely that herb and herb seed prices will ever increase to million price range or above
}

const createItemObject = (data) => {
    return newItem = {
        name: data.name,
        apiId: data.id,
        updatedAt: new Date(),
        // The API returns prices as strings, and prices above 999 are returned in a special format,
        // so prices must be converted to a regular number
        price: convertPriceToNumber(String(data.current.price))  
    }                                                          
}

const convertJSONToItemObjects = (seedData, cleanHerbData, grimyHerbData) => {
    // Convert JSON data into 'Item' objects, which can be saved into our own database
    const seeds = seedData.map(data => createItemObject(data))
    const cleanHerbs = cleanHerbData.map(data => createItemObject(data))
    const grimyHerbs1 = grimyHerbData[0].items.map((data) => createItemObject(data))
    const grimyHerbs2 = grimyHerbData[1].items.map((data) => createItemObject(data))
    
    return seeds.concat(cleanHerbs).concat(grimyHerbs1).concat(grimyHerbs2)
}

const splitSeedAndCleanHerbData = (seedAndCleanHerbData) => {
    const seedData = new Array()
    const cleanHerbData = new Array()

    seedAndCleanHerbData.forEach(dataPair => {
        dataPair.forEach(data => {
            if (seedIds.includes(data.id)) {
                seedData.push(data)
            } else {           
                // There should not be any other types of items besides seeds and clean herbs,
                // since the other items are filtered out of the original JSON             
                cleanHerbData.push(data)   
            }
        })
    })

    return {
        seedData: seedData,
        cleanHerbData: cleanHerbData
    }
}

const getGrimyHerbData = async (page) => {
    const response = await axios.get(`${searchGrimyUrl}${page}`)
    return response.data
}

const getSeedAndCleanHerbData = async (name) => {
    const response = await axios.get(`${baseSearchItemUrl}${name}`)
    
    const data = response.data.items.filter(item => seedIds.includes(item.id) || cleanHerbIds.includes(item.id))

    return data
}


const getDataFromAPI =  async () => {
    try {
        // Grimy herbs do not fit into a single result page JSON so you must make 2 GET requests to get all the grimy herb data.
        const pages = [1, 2] 

        // Because the OSRS Grand Exchange API search is 'beginsWith' and not 'includes', seed and clean herb data must be fetched in pairs,
        // while the grimy herb data can be fetched with 2 GET requests because all of their names start with 'Grimy'
        const seedAndCleanHerbPromiseArray = names.map(name => getSeedAndCleanHerbData(name)) 
        const grimyHerbPromiseArray = pages.map(page => getGrimyHerbData(page)) 
     
        const seedAndCleanHerbData = await Promise.all(seedAndCleanHerbPromiseArray)
        const grimyHerbData = await Promise.all(grimyHerbPromiseArray)

        // seedAndCleanHerbData is an array which contains 14 sub-arrays of length 2 which contain each seed and clean herb pair 
        // (e.g. one subarray contains the data of Guam seed and Guam leaf),
        // so the seed and clean herb data are separated into two arrays.
        const splittedSeedAndCleanHerbData = splitSeedAndCleanHerbData(seedAndCleanHerbData) 
        const seedData = splittedSeedAndCleanHerbData.seedData
        const cleanHerbData = splittedSeedAndCleanHerbData.cleanHerbData

        const data = convertJSONToItemObjects(seedData, cleanHerbData, grimyHerbData)
        console.log('Successfully fetched ', (data.length), 'out of 42 item\'s datafrom the OSRS Grand Exchange API at ', new Date())

        return data
    } catch (exception) {
        console.log('Error while fetching data from the OSRS Grand Exchange API at ', new Date())
        console.log(exception)
        return null
    }
}

const saveDataFromApi = async () => {
    console.log('Fetching data from the OSRS Grand Exchange API...')

    try {
        const items = await getDataFromAPI()

        items.forEach((item) => {
            assignType(item)
            assignPrecedence(item)
        })

        const oldItems = await Item.find({})
        console.log('Amount of items already in database: ', oldItems.length);
     
        const result = oldItems.filter(oldItem => oldItem.apiId == 199)
        console.log('...')
        
        // const itemObjects = items.map(item => new Item(item))
        // const promiseArray = itemObjects.map(item => item.save())
        const promiseArray = items.map(item => {
            if (oldItems.filter(oldItem => oldItem.apiId === item.apiId).length == 1) { // if item has been previously successfully saved into the database
                console.log('Updating ', item.name, ' in the database')
                Item.replaceOne({ apiId: item.apiId }, item) // update item
            } else { // if item has not been previously successfully saved into the database
                console.log('Creating a new entry for ', item.name, ' in the database')
                const newItem = new Item(item)
                newItem.save() // save new item
            }
            
            console.log('...')
        })
 
        // await Item.remove({}) // Clear old data from the database
        await Promise.all(promiseArray)
    } catch (exception) {
        console.log('Error: something went wrong')
        console.log(exception)
    }
}

module.exports = { saveDataFromApi }