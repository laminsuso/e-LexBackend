let contactmodel=require('../../models/user/contactbook')

module.exports.createContactBook=async(req,res)=>{
    let {...data}=req.body;
    try{
        data={
            ...data,
            user:req.user._id
        }


        let contact=await contactmodel.create(data)

return res.status(200).json({
    message:"Contact created sucessfully",
contact
})
    }catch(e){
        return res.status(400).json({
            error:"Something went wrong please try again"
        })
    }
}

module.exports.fetchContactBooks=async(req,res)=>{
    try{
let contactBooks=await contactmodel.find({user:req.user._id})
return res.status(200).json({
    contactBooks
})
    }catch(e){
        return res.status(400).json({
            error:"Something went wrong please try again"
        })
    }
}

module.exports.deleteContactBook=async(req,res)=>{
    try{
        let {id}=req.params;
      
        let contact=await contactmodel.findByIdAndDelete(id)
        return res.status(200).json({
            message:"Contact deleted sucessfully",
        contact
        })
            }catch(e){
                return res.status(400).json({
                    error:"Something went wrong please try again"
                })
            }
}

module.exports.updateContactBook=async(req,res)=>{
    let {...data}=req.body;
    try{
      
let contact=await contactmodel.findByIdAndUpdate(data.contact_id,{
    $set:data
})
return res.status(200).json({
    message:"Contact updated sucessfully",
contact
})
    }catch(e){
        return res.status(400).json({
            error:"Something went wrong please try again"
        })
    }
}