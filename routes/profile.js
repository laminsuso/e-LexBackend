const router=require('express').Router();
const {getProfile,updateProfile}=require('../controller/user/profile')
const {cloudinaryUploadPdf}=require('../utils/cloudinary')
const uploadMulter=require('../middleware/file')
const {auth}=require('../middleware/auth')
router.get('/getProfile',auth,getProfile)
router.patch('/updateProfile',auth,uploadMulter.single('avatar'),updateProfile)

module.exports=router;