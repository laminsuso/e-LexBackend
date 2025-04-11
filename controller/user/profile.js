
const fs=require('fs')
const path=require('path')
const {cloudinaryUploadPdf}=require('../../utils/cloudinary')
const profileModel=require('../../models/user/profile')
const userModel = require('../../models/user/user')


module.exports.getProfile=async(req,res)=>{
    try{
       
let profile=await profileModel.findOne({user:req.user._id}).populate('user')
return res.status(200).json({
    profile
})
    }catch(e){
      
        return res.status(400).json({
            error:"Something went wrong please try again"
        })
    }
}



module.exports.updateProfile=async(req,res)=>{
   let {...data}=req.body;
   
    try{
      if(req.file){
        const filePath = path.join('/tmp/public/files', "files");
        const fileName = `${Date.now()}-${req.file.originalname}`;
        const combinedPath = path.join(filePath, fileName);
        
        if (!fs.existsSync(filePath)) {
            fs.mkdirSync(filePath, { recursive: true });
        }
  
        
        fs.writeFileSync(combinedPath, req.file.buffer);
  
      
        let cloudFileName = await cloudinaryUploadPdf(combinedPath, data.folder);
  
   
        data = {
            ...data,
            avatar: cloudFileName.url
        };
      }
     
await profileModel.updateOne({_id:req.profile._id},{
    $set:data
})

await userModel.findByIdAndUpdate(req.user._id,{
    $set:data
})

return res.status(200).json({
    message:"Profile updated sucessfully"
})
    }catch(e){
        
        return res.status(400).json({
            error:"Something went wrong please try again"
        })
    }
}