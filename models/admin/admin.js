const mongoose=require('mongoose')

const adminSchema=mongoose.Schema({
    email:{
        type:String,
        required:[true,"Please enter email"]
    },
    password:{
        type:String,
        required:[true,"Please enter password"]
    }
})


const adminModel=mongoose.model('admin',adminSchema)

module.exports=adminModel;