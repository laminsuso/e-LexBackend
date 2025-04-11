const plan = require("../../models/user/plan")
const paypal = require('paypal-rest-sdk');

paypal.configure({
    mode: 'sandbox', 
    client_id: 'AcYiLPKPYNvfFYG3EP4DrqF7mNI0q_iMwP1XlUw1n9MqwITgUarWSTJacSLKpEN7HH78LcyZBqFloR7v', 
    client_secret: 'EF2Da5Qp3T1Fg_mIGjyI7Hi0OQGAOzp41-Q8LmrCgSD0bqWi1BcZC2pF3OSyUCkUyRZly-Rr91vcteZZ'
  });


module.exports.createPlan = async (req, res) => {
    let { ...data } = req.body;

    try {
        let alreadyMonthly = await plan.find({ billingCycle: 'monthly' });
        let alreadyYearly = await plan.find({ billingCycle: 'yearly' });

       
        if (data.billingCycle === "monthly" && alreadyMonthly.length === 3) {
            return res.status(400).json({
                error: "Already have 3 monthly plans created"
            });
        }

        if (data.billingCycle === "yearly" && alreadyYearly.length === 3) {
            return res.status(400).json({
                error: "Already have 3 yearly plans created"
            });
        }

    
        
        const newPlan = await plan.create(data);

        return res.status(200).json({
            message: "Plan created successfully",
          
        });
    } catch (e) {
        console.error("Error in creating plan:", e);
        return res.status(400).json({
            error: "Something went wrong, please try again"
        });
    }
};



  

  module.exports.getPlans=async(req,res)=>{
try{
let plans=await plan.find({})
return res.status(200).json({
    plans
})
}catch(e){
 
    return res.status(400).json({
        error:"Something went wrong please try again"
    })
}
}

module.exports.getSinglePlan=async(req,res)=>{
let {id}=req.params;
    try{
    let singlePlan=await plan.findById(id)
    if(!singlePlan){
        return res.status(400).json({
            error:"Incorrect plan id"
        })
    }
    return res.status(200).json({
        singlePlan
    })
    }catch(e){
        return res.status(400).json({
            error:"Something went wrong please try again"
        })
    }
    }
    module.exports.deleteSinglePlan=async(req,res)=>{
        let {id}=req.params;
            try{
            let singlePlan=await plan.findByIdAndDelete(id)
            return res.status(200).json({
                singlePlan,
                message:"Plan deleted sucessfully"
            })
            }catch(e){
                return res.status(400).json({
                    error:"Something went wrong please try again"
                })
            }
            }


    module.exports.updatePlan=async(req,res)=>{
        let {id}=req.params;
        let {...data}=req.body;
        try{
        let updatedPlan=await plan.findByIdAndUpdate(id,{
            $set:data
        },{new:true})
        return res.status(200).json({
            updatedPlan,
            message:"Plan updated sucessfully"
        })
        }catch(e){
            return res.status(400).json({
                error:"Something went wrong please try again"
            })
        }
        }