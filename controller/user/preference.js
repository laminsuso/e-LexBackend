const preferenceModel=require('../../models/user/preference')


module.exports.preferenceUpdate=async(req,res)=>{
    let {...data}=req.body;
    try{
await preferenceModel.updateOne({user:req.user._id},{
    $set:data
})
return res.status(200).json({
message:"Preferences updated sucessfully"
})
    }catch(e){
        return res.status(400).json({
            error:"Something went wrong please try again"
        })
    }
}

module.exports.preferenceCreate=async(req,res)=>{
  
    try{
        
await preferenceModel.create({user:req.user._id})
return res.status(200).json({
message:"Preferences created sucessfully"
})
    }catch(e){
       
        return res.status(400).json({
            error:"Something went wrong please try again"
        })
    }
}

module.exports.getPreferences=async(req,res)=>{
    try{
let preferences=await preferenceModel.findOne({user:req.user._id})
return res.status(200).json({
    preferences
})
    }catch(e){
        return res.status(400).json({
            error:"Something went wrong please try again"
        })
    }
}