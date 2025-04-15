const cloudinary = require('cloudinary').v2;
const path=require('path')
const fs=require('fs')

// cloudinary.config({
//   cloud_name:"dlzmtart8",
//   api_key: "925537284573512",
//   api_secret: "1QY5eDgKNnt3Woh194nu2bfBS3s"
// });


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