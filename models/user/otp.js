const mongoose=require('mongoose')

const otpSchema=mongoose.Schema({
    otp:{
        type:String,
        required:true
    },
    email:{
        type:String,
        required:true
    },
   expired:{
    type:Boolean,
    default:false
   }
},{
    timestamps:true
})


const otpModel=mongoose.model('otp',otpSchema)


module.exports=otpModel