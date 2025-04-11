const router=require('express').Router();
const {createPlan,getPlans,getSinglePlan,deleteSinglePlan,updatePlan}=require('../controller/common/plan')
router.post('/create-plan',createPlan)
router.get('/get-plans',getPlans)
router.patch('/update-plan/:id',updatePlan)
router.delete('/delete-plan/:id',deleteSinglePlan)
router.get('/get-plan/:id',getSinglePlan)




module.exports=router;