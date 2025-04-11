const cloudinary = require('cloudinary').v2;
const path=require('path')
const fs=require('fs')

cloudinary.config({
  cloud_name:"dbjwbveqn",
  api_key: "774241215571685",
  api_secret: "ysIyik3gF03KPDecu-lOHtBYLf8"
});



module.exports.cloudinaryUploadPdf=async(filetoUpload,folder)=>{
  
  try{
   const data=await cloudinary.uploader.upload(filetoUpload,{
       resource_type:'auto',
       folder
   })
   
    return {
      url:data.secure_url
    }
}catch(e){
return e
}
}