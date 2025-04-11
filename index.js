const express=require('express')
const app=express();
const connect=require('./connection/connection')
const cors=require('cors')
const authRoutes=require('./routes/auth')
const documentRoutes=require('./routes/document')
const profileRoutes=require('./routes/profile')
const subscriptionRoutes=require('./routes/subscription')
const cron = require('node-cron');
const contactBookRoutes=require('./routes/contactbook')
const preferenceRoutes=require('./routes/preferences')
const adminRoutes=require('./routes/adminAuth')
const planRoutes=require('./routes/plan');
const plan = require('./models/user/plan');
const subscriptionModel = require('./models/user/subscription');
require('dotenv').config()
app.use(express.json({ limit: '10mb' }));
app.use(cors({origin: true, credentials: true}));
app.use(authRoutes)
app.use(documentRoutes)
app.use(preferenceRoutes)
app.use(adminRoutes)
app.use(profileRoutes)
app.use(subscriptionRoutes)
app.use(contactBookRoutes)
app.use(planRoutes)




connect

cron.schedule('0 0 1 * *', async () => {
    try {
      console.log('Running monthly resource refresh...');
      
     
      const subscriptions = await subscriptionModel.find({status:'active'})
        .populate('plan');
  
      for (const sub of subscriptions) {
        try {
          if (!sub.plan) {
            console.log(`Skipping subscription ${sub._id} - no associated plan`);
            continue;
          }
  
          
          await subscriptionModel.findByIdAndUpdate(
            sub._id,
            {
              $inc: {
                numberOfAvaiableSigns: sub.plan.numberOfSigns,
                numberOfAvaiableEmails: sub.plan.numberOfEmails
              }
            }
          );
  
  
        } catch (error) {
          console.error(`Error processing subscription ${sub._id}:`, error);
        }
      }
  
      console.log('Monthly resource refresh completed');
      
    } catch (err) {
      console.error('Error in monthly resource refresh:', err);
    }
  });


app.listen(process.env.PORT,()=>{
    console.log(`App listening to PORT ${process.env.PORT}`)
})
