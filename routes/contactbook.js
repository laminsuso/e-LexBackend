const router=require('express').Router();
const {createContactBook,updateContactBook,deleteContactBook,fetchContactBooks}=require('../controller/user/contactbook');
const { auth } = require('../middleware/auth');

router.post('/create-contactBook',auth,createContactBook)
router.patch('/updateContactBook',auth,updateContactBook)
router.get('/fetchContactBooks',auth,fetchContactBooks)
router.delete('/deleteContactBook/:id',auth,deleteContactBook)
module.exports=router;