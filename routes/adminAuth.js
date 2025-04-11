const router=require('express').Router();
const {register,login}=require('../controller/admin/auth')

router.post('/admin/register',register)
router.post('/admin/login',login)

module.exports=router;