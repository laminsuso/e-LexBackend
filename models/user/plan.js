const mongoose = require('mongoose');

const planSchema = mongoose.Schema({
    name: {
        type: String,
    },
    price: {
        type: mongoose.Schema.Types.Decimal128, 
    },
    numberOfSigns: {
        type: Number,
    },
    numberOfEmails: {
        type: Number,
    },
    billingCycle:{
        type:String,
        enum:['monthly','yearly'],
        required:true
    }

},{
    timestamps:true
});

module.exports = mongoose.model('plan', planSchema);
