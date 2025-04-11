const router=require('express').Router();
const {auth}=require('../middleware/auth')
const {cancelSubscription,updateSubscription,getSubscriptionInfo,createSubscription}=require('../controller/user/subscription')

router.post('/createSubscription',auth,createSubscription)
router.patch('/cancelSubscription',auth,cancelSubscription)
router.patch('/updateSubscription',auth,updateSubscription)
router.get('/getSubscriptionInfo',auth,getSubscriptionInfo)
module.exports=router;