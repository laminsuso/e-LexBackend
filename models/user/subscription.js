const mongoose=require('mongoose')

const subscriptionSchema=mongoose.Schema({
    user:{
        type:mongoose.Schema.ObjectId,
        ref:'profile'
    },
    numberOfAvaiableSigns:{
        type:Number,
        default:0
    },
    numberOfAvaiableEmails:{
        type:Number,
        default:0
    },
    plan:{
type:mongoose.Schema.ObjectId,
ref:'plan'
    },
last4digits:{
    type:String,
    required:true
},
expiresAt:{
    type:Date,
    required:true
},
stripeSubId:{
    type:String,
    
},
paypalSubId:{
type:String
},
paypalPlanId:{
type:String
},
status:{
    type:String,
    default:'active'
}

},{timestamps:true})

const subscriptionModel=mongoose.model('subscription',subscriptionSchema)

module.exports=subscriptionModel