const jwt=require('jsonwebtoken')

module.exports.auth=async(req,res,next)=>{
    
    try{
if(req?.headers?.authorization?.startsWith('Bearer')){
   
    let token=req?.headers?.authorization?.split(' ')[1]
    let user=jwt.verify(token,process.env.JWT_KEY)
    req.user=user.user
    req.profile=user.profile

    next()
}else{
    let token=req?.headers?.authorization?.split(' ')[1]
    let user=jwt.verify(token,process.env.JWT_KEY)
    req.user=user.user
    req.profile=user.profile

  
}
    }catch(e){
   
return res.status(400).json({
    error:"Something went wrong please try again"
})
    }
}