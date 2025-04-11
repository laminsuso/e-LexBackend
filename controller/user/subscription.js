const plan = require("../../models/user/plan");
const subscriptionModel = require("../../models/user/subscription")
const stripe = require('stripe')('sk_test_51OwuO4LcfLzcwwOYsXYljgE1gUyGnLFvjewSf1NG9CsrSqTsxm7n7ppmZ2ZIFL01ptVDhuW7LixPggik41wWmOyE00RjWnYxUA');
// pb_key="pk_test_51OwuO4LcfLzcwwOYdssgGfUSfOgWT1LwO6ewi3CEPewY7WEL9ATqH6WJm3oAcLDA3IgUvVYLVEBMIEu0d8fUwhlw009JwzEYmV"
module.exports.createSubscription = async (req, res) => {
    const { planId, paymentMethodId } = req.body; 
    const userEmail = req.user.email;

    try {
        let alreadySubscribed=await subscriptionModel.findOne({user:req.user._id,status:'active'})
        if(alreadySubscribed){
            return res.status(400).json({
                error:"User already subscribed"
            })
        }
     
        const planData = await plan.findById(planId).lean();
        if (!planData) {
            return res.status(404).json({ error: "Plan not found" });
        }

       
        const priceAmount = planData.price?.$numberDecimal 
            ? parseFloat(planData.price.$numberDecimal) * 100
            : planData.price * 100;

       
        const customer = await stripe.customers.create({
            email: userEmail,
            description: `Customer for ${userEmail}`,
        });

       
        await stripe.paymentMethods.attach(paymentMethodId, {
            customer: customer.id,
        });

       
        await stripe.customers.update(customer.id, {
            invoice_settings: { default_payment_method: paymentMethodId },
        });

       
        const billingCycleMap = {
            'monthly': 'month',
            'yearly': 'year',
            'weekly': 'week',
            'daily': 'day'
        };
        
        const stripePrice = await stripe.prices.create({
            unit_amount: priceAmount,
            currency: 'usd',
            recurring: { interval: billingCycleMap[planData.billingCycle.toLowerCase()] || 'month' },
            product_data: {
                name: planData.name,
             
            },
        });

       
        const subscription = await stripe.subscriptions.create({
            customer: customer.id,
            items: [{ price: stripePrice.id }],
            payment_settings: {
                payment_method_types: ['card'],
                save_default_payment_method: 'on_subscription',
            },
            expand: ['latest_invoice.payment_intent'],
        });

       
        const paymentMethod = await stripe.paymentMethods.retrieve(paymentMethodId);
        const newSubscription = new subscriptionModel({
            user: req.profile._id,
            plan: planData._id,
            last4digits: paymentMethod.card.last4,
            numberOfAvaiableSigns:planData.numberOfSigns,
            numberOfAvaiableEmails:planData.numberOfEmails,
            stripeSubId: subscription.id,
            status: subscription.status,
            expiresAt: new Date(subscription.current_period_end * 1000),
        });

        await newSubscription.save();

        return res.status(200).json({
            message: "Subscription created successfully",
            subscriptionId: subscription.id,
        });

    } catch (e) {
        console.error("Error creating subscription:", e);
        return res.status(400).json({
            error: e.message || "Something went wrong, please try again",
        });
    }
};


module.exports.cancelSubscription=async(req,res)=>{
    let {subscriptionId}=req.params;
    try{
let subscription=await subscriptionModel.findByIdAndUpdate(subscriptionId,{
    $set:{
        status:'cancelled'
    },
  
},{
    new:true,
    upsert:true
})


await stripe.subscriptions.cancel(
    subscription.stripeSubId
  );

  return res.status(200).json({
    message:"subscription cancelled sucessfully"
  })
    }catch(e){
        console.error("Error creating subscription:", e);
        return res.status(400).json({
            error: "Something went wrong, please try again",
        });
    }
}



module.exports.updateSubscription = async (req, res) => {
    const billingCycleMap = {
        'monthly': 'month',
        'yearly': 'year',
        'weekly': 'week',
        'daily': 'day'
    };
    
   
    const { newPlanId,subscriptionId  } = req.body; 

    try {
        
        const subscription = await subscriptionModel.findOne({_id:subscriptionId,status:'active'});
        if (!subscription) {
            return res.status(400).json({ error: "Subscription not found" });
        }

        if(subscription.plan==newPlanId){
            return res.status(400).json({ error: "Already subscribed to this plan" });
        }

      
        const newPlan = await plan.findById(newPlanId).lean();
        if (!newPlan) {
            return res.status(404).json({ error: "New plan not found" });
        }

      
        const priceAmount = newPlan.price?.$numberDecimal 
            ? parseFloat(newPlan.price.$numberDecimal) * 100
            : newPlan.price * 100;

   
        const newPrice = await stripe.prices.create({
            unit_amount: priceAmount,
            currency: 'usd',
            recurring: { 
                interval: billingCycleMap[newPlan.billingCycle.toLowerCase()] || 'month'
            },
            product_data: {
                name: newPlan.name
            }
        });

      
        const currentSubscription = await stripe.subscriptions.retrieve(
            subscription.stripeSubId
        );

        const updatedSubscription = await stripe.subscriptions.update(
            subscription.stripeSubId,
            {
                items: [{
                    id: currentSubscription.items.data[0].id,
                    price: newPrice.id,
                }],
                proration_behavior: "always_invoice"
            }
        );

       
        const updatedSubscriptionDB = await subscriptionModel.findByIdAndUpdate(
            subscriptionId,
            {
                plan: newPlan._id,
                status: updatedSubscription.status,
                numberOfAvaiableSigns:newPlan.numberOfSigns,
                numberOfAvaiableEmails:newPlan.numberOfEmails,
                expiresAt: new Date(updatedSubscription.current_period_end * 1000),
            },
            { new: true }
        );

        return res.status(200).json({
            message: "Subscription updated successfully",
            subscription: updatedSubscriptionDB
        });

    } catch (e) {
        console.error("Error updating subscription:", e);
        return res.status(400).json({
            error: e.message || "Failed to update subscription"
        });
    }
};



module.exports.getSubscriptionInfo=async(req,res)=>{
    try{
        
let subscription=await subscriptionModel.findOne({user:req.profile._id})

return res.status(200).json({
    subscription
})
    }catch(e){
        return res.status(400).json({
            error: "Something went wrong, please try again"
        });
    }
}