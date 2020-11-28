const mongoose = require('mongoose')

const itemSchema = new mongoose.Schema({
    name: String,
    apiId: Number,
    price: Number,
    updatedAt: Date,
    type: String,
    precedence: Number
})

itemSchema.statics.format = (item) => {
    return {
        id: item.id,
        name: item.name,
        apiId: item.apiId,
        price: item.price,
        updatedAt: item.updatedAt,
        type: item.type,
        precedence: item.precedence
    }
}

const Item = mongoose.model('Item', itemSchema)

module.exports = Item