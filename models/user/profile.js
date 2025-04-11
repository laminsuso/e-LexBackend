const mongoose=require('mongoose')
const profileSchema=mongoose.Schema({
    user:{
        type:mongoose.Schema.ObjectId,
        ref:'user'
    },
    avatar:{
type:String,
default:'https://app.opensignlabs.com/static/media/dp.30e53f135742466a2060.png'
    },
    name:{
        type:String,
        required:true
    },
    phone:{
        type:String,
        required:true
    },
    company:{
        type:String,
        required:true
    },
    job_title:{
        type:String,
        required:true
    },
    is_email_verified:{
        type:Boolean,
        default:false
    },
    public_profile:{
        type:String
    },
    tagline:{
        type:String
    },
    language:{
        type:String,
        default:'English'
    },
    signature:{
        type:String
    },
    initial:{
        type:String
    }
},{timestamps:true})

const profileModel=mongoose.model('profile',profileSchema)

module.exports=profileModel;