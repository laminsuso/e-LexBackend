const jwt=require('jsonwebtoken')

const userModel = require('../../models/user/user');
const nodemailer=require('nodemailer');
const otpModel = require('../../models/user/otp');
const profileModel = require('../../models/user/profile');
const preferenceModel = require('../../models/user/preference');
const  mongoose  = require('mongoose');

module.exports.register=async(req,res)=>{
let {...data}=req.body;

let email=data.email
let password=data.password
    try{
let userFound=await userModel.findOne({email})
if(userFound){
   return res.status(400).json({
    error:"User already exists"
   }) 
}

   
  let userCreated=await userModel.create({email,password})
data={
    ...data,
    user:userCreated._id
}

await profileModel.create(data)
await preferenceModel.create({user:userCreated._id})
return res.status(200).json({
    message:"User registered sucessfully"
})

}catch(e){
 
    return res.status(400).json({
        error:"Something went wrong please try again"
    })
}
}



module.exports.googleLogin=async(req,res)=>{
    let {email}=req.body;
    console.log(email)
        try{
    let emailFound=await userModel.findOne({email})
    console.log('record found')
    console.log(emailFound)
    if(!emailFound){
        console.log('no record')
        return res.status(400).json({
            error:"Invalid email"
        })
    }
    
    
    let profile=await profileModel.findOne({user:emailFound._id})
    let token=await jwt.sign({user:emailFound,profile},'SDAFJFSJFGSJFJSFISDIFSIFIS*$#*@$*@#$@#FDSFSFOSDFOSOFOFOAOFOADPASPCKB')
    return res.status(200).json({
        user:emailFound,
        token
    })
    
    }catch(e){
       console.log(e.message)
        return res.status(400).json({
            error:"Something went wrong please try again"
        })
    }   
    }
    


module.exports.login=async(req,res)=>{
let {email,password}=req.body;
    try{
let emailFound=await userModel.findOne({email})
if(!emailFound){
    return res.status(400).json({
        error:"Invalid email"
    })
}

let passwordMatch=password==emailFound.password
if(passwordMatch){
    let profile=await profileModel.findOne({user:emailFound._id})
let token=await jwt.sign({user:emailFound,profile},process.env.JWT_KEY)
return res.status(200).json({
    user:emailFound,
    token
})
}
return res.status(400).json({
    error:"Invalid password"
})


}catch(e){
    return res.status(400).json({
        error:"Something went wrong please try again"
    })
}   
}


module.exports.resetPassword=async(req,res)=>{
    let {password}=req.body;
    try{

await userModel.findByIdAndUpdate(req.user._id,{
    $set:{
        password
    }
})
return res.status(200).json({
    message:"Password reseted sucessfully"
})
    }catch(e){
        return res.status(400).json({
            error:"Something went wrong please try again"
        })
    }
}

module.exports.sendPasswordResetLinks=async(req,res)=>{
  let {email}=req.body;
  
  let userExists=await userModel.findOne({email})
  if(!userExists){
    return res.status(400).json({
        error:"User does not exist"
    })
  }
    try{

      
        const transporter = nodemailer.createTransport({
            service: "gmail",
            auth: {
              user: "susolamin@gmail.com",
              pass: "rexsrzkvuuntceiq",
            },
          });
        const html = `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Password Reset - E-Lex Signature™</title>
</head>
<body style="margin: 0; padding: 0; font-family: Arial, sans-serif; line-height: 1.6;">
    <table role="presentation" cellspacing="0" cellpadding="0" style="max-width: 600px; width: 100%; margin: 0 auto;">
        <!-- Header -->
        <tr>
            <td style="background-color: #f8f9fa; padding: 25px; text-align: center; border-bottom: 2px solid #e9ecef;">
                <h1 style="color: #2d3436; margin: 0; font-size: 24px;">
                    <span style="color: #2d6cdf;">E-Lex</span><span style="color: #2d3436;">Signature</span>™
                </h1>
            </td>
        </tr>

        <!-- Content -->
        <tr>
            <td style="padding: 40px 30px;">
                <h2 style="color: #2d3436; margin: 0 0 25px 0; font-size: 20px;">Password Reset Request</h2>
                
                <p style="color: #636e72; margin: 0 0 20px 0; line-height: 1.5;">
                    We received a request to reset your E-Lex Signature™ account password. Click the button below to reset your password:
                </p>

                <!-- Reset Button -->
                <div style="text-align: center; margin: 30px 0;">
                    <a href="https://e-lex-frontend.vercel.app/changepassword/${email}" 
                       style="background-color: #2d6cdf; color: #ffffff; padding: 12px 30px; 
                              text-decoration: none; border-radius: 4px; font-weight: bold;
                              display: inline-block; font-size: 16px;">
                        Reset Password
                    </a>
                </div>

              
            </td>
        </tr>

        <!-- Footer -->
        <tr>
            <td style="background-color: #f8f9fa; padding: 25px; text-align: center; border-top: 2px solid #e9ecef;">
                <p style="color: #636e72; margin: 0; font-size: 12px; line-height: 1.6;">
                    Sent by E-Lex signature™ Security Team<br>
                    <a style="color: #2d6cdf; text-decoration: none;">Privacy Policy</a> | 
                    <a  style="color: #2d6cdf; text-decoration: none;">Support</a><br>
                    © ${new Date().getFullYear()} E-Lex Signature™. All rights reserved.
                </p>
            </td>
        </tr>
    </table>
</body>
</html>
`;

const info = await transporter.sendMail({
    from: 'lemightyeagle@gmail.com', 
    to: email,
    subject: "Reset Password Link", 
    html: html, 
  });

  
    }catch(e){
      
        return res.status(400).json({
            error:"Something went wrong please try again"
        })
    }
}
module.exports.updatePassword=async(req,res)=>{
    let {password,current_password}=req.body;
    let matchPasswords=current_password==req.user.password
   if(!matchPasswords){
    return res.status(400).json({
        error:"invalid current password"
    })
   }
    
    try{
await userModel.findByIdAndUpdate(req.user._id,{
$set:{
    password
}
})

return res.status(200).json({
    message:"Password updated sucessfully"
})
    }catch(e){
        return res.status(400).json({
            error:"Something went wrong please try again"
        })
    }
}

module.exports.registerAndLogin=async(req,res)=>{
    let {...data}=req.body;
    let email=data.email
    let password=`${Math.random()*9999}+${email}`
        try{
    let userFound=await userModel.findOne({email})
    
    if(userFound){
        let profile=await profileModel.findOne({user:userFound._id})
        let token=await jwt.sign({user:userFound,profile},process.env.JWT_KEY)
        let preference=await preferenceModel.findOne({user:userFound._id})
        return res.status(200).json({
            user:userFound,
            token,
            preference
        })
      
    }
    
     
      let userCreated=await userModel.create({email,password})
    data={
        ...data,
        job_title:'my job',
        company:'my company',
        phone:'+923105162',
        name:'new user',
        user:userCreated._id
    }
    
   let profile=await profileModel.create(data)
    let token=await jwt.sign({user:userCreated,profile},process.env.JWT_KEY)
    let preference=await preferenceModel.create({user:userCreated._id})
    return res.status(200).json({
        user:userCreated,
        token,
        preference
    })
   
    
    }catch(e){
       
       
        return res.status(400).json({
            error:"Something went wrong please try again"
        })
    }
}

module.exports.sendEmailVerificationLink=async(req,res)=>{
   
    try{
let otp=Math.floor(Math.random()*9999)
await otpModel.create({
    otp,
    email:req.user.email
})

const html=`
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>OTP Verification</title>
</head>
<body style="margin: 0; padding: 0; font-family: Arial, sans-serif; line-height: 1.6;">
    <table role="presentation" cellspacing="0" cellpadding="0" style="max-width: 600px; width: 100%; margin: 0 auto;">
        <!-- Header -->
        <tr>
            <td style="background-color: #f8f9fa; padding: 20px; text-align: center;">
                <h1 style="color: #2d3436; margin: 0;">OTP Verification</h1>
            </td>
        </tr>

        <!-- Content -->
        <tr>
            <td style="padding: 30px 20px;">
                <p style="color: #636e72; margin: 0 0 20px 0;">Your OTP for E-Lex Signature™ verification is:</p>
                
                <!-- OTP Display -->
                <div style="background-color: #f8f9fa; padding: 15px; text-align: center; margin: 20px 0; border-radius: 5px;">
                    <h2 style="color: #e74c3c; margin: 0; font-size: 32px; letter-spacing: 3px;">${otp}</h2>
                </div>

                <p style="color: #636e72; margin: 20px 0; font-size: 14px;">
                    This OTP is valid for 10 minutes. Please do not share this code with anyone.
                </p>
            </td>
        </tr>

        <!-- Footer -->
        <tr>
            <td style="background-color: #f8f9fa; padding: 20px; text-align: center;">
                <p style="color: #636e72; margin: 0; font-size: 12px;">
                    Sent by E-Lex Signature™<br>
                    <a href="#" style="color: #0984e3; text-decoration: none;">Unsubscribe</a> | 
                    <a href="#" style="color: #0984e3; text-decoration: none;">Privacy Policy</a><br>
                    © 2023 Your Company Name. All rights reserved.
                </p>
            </td>
        </tr>
    </table>
</body>
</html>
`
const transporter = nodemailer.createTransport({
    service: "gmail",
    auth: {
      user: "susolamin@gmail.com",
      pass: "rexsrzkvuuntceiq",
    },
  });

  const info = await transporter.sendMail({
    from: 'lemightyeagle@gmail.com', 
    to: req.user.email,
    subject: "Verify email", 
    html: html, 
  });


  return res.status(200).json({
    message:"Verification request sent sucessfully"
  })
    }catch(e){
      
        return res.status(400).json({
            error:"Something went wrong please try again"
        })
    }
}


module.exports.verifyEmail=async(req,res)=>{
    try{
        let {otpSubmitted}=req.body;
    let otp=await otpModel.findOne({email:req.user.email,otp:otpSubmitted,expired:false}).sort({createdAt:-1})

    if(!otp){
        return res.status(400).json({
            error:"Invalid otp"
        })
    }
    await otpModel.findByIdAndUpdate(otp._id,{
        $set:{
            expired:true
        }
    })
    const result = await profileModel.findByIdAndUpdate(req.profile._id,{
        $set:{
            is_email_verified:true
        }
    });
   
       
        let profile=await profileModel.findOne({_id:req.profile._id})
        
        return res.status(200).json({
            message:"Email verified sucessfully"
        })
    }catch(e){
     
        return res.status(400).json({
            error:"Something went wrong please try again"
        })
    }
}



module.exports.getUser=async(req,res)=>{
    try{
let user=await userModel.findById(req.user._id)
let preference=await preferenceModel.findOne({user:req.user._id})
let profile=await profileModel.findOne({user:req.user._id})
return res.status(200).json({
    user,
    preference,
    profile
})
    }catch(e){
        return res.status(400).json({
            error:"Something went wrong please try again"
        })
    }
}