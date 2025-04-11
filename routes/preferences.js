const router=require('express').Router();
const {auth}=require('../middleware/auth')
const {getPreferences,preferenceUpdate,preferenceCreate}=require('../controller/user/preference')
router.patch('/update-preferences',auth,preferenceUpdate)
router.post('/preferenceCreate',auth,preferenceCreate)
router.get('/get-preferences',auth,getPreferences)

module.exports=router;