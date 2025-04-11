const router=require('express').Router();
const {register,login,googleLogin,getUser,registerAndLogin,updatePassword,sendEmailVerificationLink,verifyEmail,resetPassword,sendPasswordResetLinks}=require('../controller/user/auth')
const {auth}=require('../middleware/auth')

router.post('/register',register)
router.post('/login',login)
router.post('/googleLogin',googleLogin)
router.patch('/updatePassword',auth,updatePassword)
router.post('/resetPassword',auth,resetPassword)
router.post('/sendPasswordResetLinks',auth,sendPasswordResetLinks)
router.post('/sendEmailVerificationLink',auth,sendEmailVerificationLink)
router.post('/verifyEmail',auth,verifyEmail)
router.post('/registerAndLogin',registerAndLogin)
router.get('/getUser',auth,getUser)
module.exports=router;