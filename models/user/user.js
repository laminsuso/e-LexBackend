const mongoose=require('mongoose')

const userSchema=mongoose.Schema({
    email:{
        type:String,
        required:[true,"Please enter email"],
        unique:true
    },
    password:{
        type:String,
        required:[true,"Please enter password"]
    }
},{timestamps:true})

const userModel=mongoose.model('user',userSchema)
module.exports=userModel;