var mongoose = require('mongoose')
var pizzaSchema = mongoose.Schema({
    
    pizzaname: {
        type: String,
      
    },
    pizzasize: {
        type: String,
      
    },
    pizzaprice: {
        type: Number,
      
    },
    pizzaimage: {
        type: String,
    },
    createdAt: {type: Date, default: Date.now}
})
module.exports = mongoose.model('pizza',pizzaSchema)

