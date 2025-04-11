const mongoose=require('mongoose')

const preferenceSchema=mongoose.Schema({
    user:{
type:mongoose.Schema.ObjectId,
ref:'user'
    },
    allowed_signature_types:{
        type:String,
        enum:['signature','type','upload','all'],
        default:'all'
    },
    notify_on_signatures:{
        type:Boolean,
        default:true
    },
timezone:{
    type:String,
    default:''
},
date_format:{
    type:String,
    default:'12 hr'
},
send_in_order:{
    type:Boolean,
    default:false
}
})



const preferenceModel=mongoose.model('preference',preferenceSchema)

module.exports=preferenceModel