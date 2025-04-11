const mongoose=require('mongoose')

const contactBookSchema=mongoose.Schema({
    name:{
        type:String,
        required:[true,"Please enter name"]
    },
    email:{
        type:String,
        required:[true,'Please enter email']
    },
    phone:{
        type:String,
        required:[true,"Please enter phone"]
    },
    user:{
        type:mongoose.Schema.ObjectId,
        ref:'user'
    }
})


const contactmodel=mongoose.model('contactbook',contactBookSchema)

module.exports=contactmodel

