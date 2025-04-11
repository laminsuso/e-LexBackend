const adminModel=require('../../models/admin/admin')
const plan = require('../../models/user/plan')



module.exports.register=async(req,res)=>{
    const {...data}=req.body
  
    try{
    let alreadyExists=await adminModel.findOne({email:data.email})
    if(alreadyExists){
        return res.status(400).json({
            error:"Admin already exists"
        })
    }
await adminModel.create(data)
return res.status(200).json({
    message:"Admin registered sucessfully"
})
    }catch(e){
        return res.status(400).json({
            error:"Something went wrong please try again"
        })
    }
}


module.exports.login=async(req,res)=>{
    let {...data}=req.body;
    try{
let emailFound=await adminModel.findOne({email:data.email})
if(!emailFound){
return res.status(400).json({
    error:"Invalid email"
})
}
let passwordMatch=await adminModel.findOne({password:data.password})
if(passwordMatch){
    return res.status(200).json({
        token:process.env.JWT_KEY
    })
}else{
    return res.status(400).json({
        error:"Invalid password"
    })
}
    }catch(e){
        return res.status(400).json({
            error:"Something went wrong please try again"
        })
    }
}

module.exports.createPlan=async(req,res)=>{
    let {...data}=req.body;
    try{
await plan.create(data)
return res.status(200).json({
    message:"Plan created sucessfully"
})
    }catch(e){
        return res.status(400).json({
            error:"Something went wrong please try again"
        })
    }
}

module.exports.updatePlan=async(req,res)=>{
    let {...data}=req.body;
    let {planId}=req.params;
    try{
await plan.findByIdAndUpdate(planId,{
    $set:data
})
return res.status(200).json({
    message:"Plan updated sucessfully"
})

    }catch(e){
        return res.status(400).json({
            error:"Something went wrong please try again"
        })
    }
}

module.exports.deletePlan=async(req,res)=>{
    let {planId}=req.params;
    try{
await plan.findByIdAndDelete(planId)
return res.status(200).json({
    message:"Plan removed sucessfully"
})
    }catch(e){
        return res.status(400).json({
            error:"Something went wrong please try again"
        })
    }
}