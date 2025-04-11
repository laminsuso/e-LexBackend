const fs = require("fs");
const cloudinary = require("cloudinary").v2;
const moment=require('moment')
const { PDFDocument, rgb } = require("pdf-lib");
const path = require("path");
const { cloudinaryUploadPdf } = require("../../utils/cloudinary");
const documentModel = require("../../models/user/document");
const nodemailer = require("nodemailer");
const axios = require("axios");
const contactmodel = require("../../models/user/contactbook");
const preferenceModel = require("../../models/user/preference");
const profileModel = require("../../models/user/profile");
const subscriptionModel = require("../../models/user/subscription");
const SIGNATURE_WIDTH = 200;  
const SIGNATURE_HEIGHT = 80;  
const TEXT_FIELD_WIDTH = 200;
const TEXT_FIELD_HEIGHT = 30;
const DATE_FIELD_WIDTH = 120;
const DATE_FIELD_HEIGHT = 30;

module.exports.saveDocument = async (req, res) => {
  let combinedPath;
  try {
    let { ...data } = req.body;

    if(typeof data?.signers=="string"){
      data={
        ...data,
        signers:JSON.parse(data.signers)
      }
      let haveSignedLeft=await subscriptionModel.findOne({user:req.profile._id})
      if(!haveSignedLeft){
return res.status(400).json({
  error:"You need to subscribe to sign"
})
      }
      if(haveSignedLeft.numberOfAvaiableSigns==0){
        return res.status(400).json({
          error:"Number of signs reached please upgrade your plan"
        })
      }
      await subscriptionModel.updateOne(
        {
          user: req.profile._id
        },
        {
          $inc: {
            numberOfAvaiableSigns: -1
          }
        }
      );
      
    }
  
    let elements;
    try {
      elements =
        typeof data.elements === "string"
          ? JSON.parse(data.elements)
          : data.elements;
    } catch (err) {
      console.error("Error parsing elements:", err.message);
      return res.status(400).json({ error: "Invalid elements JSON" });
    }

   
    const normalizedElements = elements.map((el) => ({
      ...el,
      value: el.value || el.text || el.data || "", 
      label: el.label || el.type,
    }));

    data.elements = normalizedElements;

   
    const originalPdfDoc = await PDFDocument.load(req.file.buffer);
    const pages = originalPdfDoc.getPages();
    const scaleFactor = pages[0].getWidth() / 800;

    for (const element of normalizedElements) {
      const pageIndex = element.pageNumber ? element.pageNumber - 1 : 0;
      const page = pages[pageIndex];
      if (!page) continue;

      const x = element.x * scaleFactor;
      const y = page.getHeight() - element.y * scaleFactor;
      const width = (element.width || 100) * scaleFactor;
      const height = (element.height || 40) * scaleFactor;

      switch (element.type) {
        case "signature":
          if (element.value?.startsWith("data:image")) {
            const base64Data = element.value.split(",")[1];
            const image = await originalPdfDoc.embedPng(
              Buffer.from(base64Data, "base64")
            );
            page.drawImage(image, {
              x,
              y: y - height * 0.5,
              width: SIGNATURE_WIDTH,
              height: SIGNATURE_HEIGHT,
            });
          } else {
            page.drawText(element.value || "", {
              x,
              y: y - height,
              size: 14,
              color: rgb(0, 0, 0),
            });
          }
          break;

        case "date":
          page.drawText(new Date(element.value).toLocaleDateString(), {
            x,
            y: y - height,
            size: 14,
            color: rgb(0, 0, 0),
          });
          break;

        case "text":
        case "name":
        case "email":
        case "jobTitle":
        case "company":
          page.drawText(element.value || "", {
            x,
            y: y - height,
            size: 14,
            color: rgb(0, 0, 0),
          });
          break;

        default:
          break;
      }
    }

  
    const embeddedPdfBytes = await originalPdfDoc.save();
    const filePath = path.join('/tmp/public/files', "files");
    const fileName = `${Date.now()}-${req.file.originalname}`;
    const combinedPath = path.join(filePath, fileName);

    if (!fs.existsSync(filePath)) {
      fs.mkdirSync(filePath, { recursive: true });
    }

    fs.writeFileSync(combinedPath, Buffer.from(embeddedPdfBytes));

  
    const cloudFile = await cloudinaryUploadPdf(
      combinedPath,
      `user_${req.profile._id}/${data.folder || "default"}`
    );

   
    let docData = {
      ...data,
      file: cloudFile.url,
      owner: req.profile._id,
    };
    if(docData.draftId){
      await documentModel.deleteMany({ draftId: data.draftId });
      delete docData.draftId;
    }

   

    const doc = await documentModel.create(docData);

   
    if (fs.existsSync(combinedPath)) {
      fs.unlinkSync(combinedPath);
    }


    return res.status(200).json({
      message: "Document created successfully",
      doc,
    });
  } catch (e) {
    console.error("saveDocument error:", e.message);
   
    return res.status(400).json({
      error: "Something went wrong, please try again",
    });
  }
};

module.exports.recentSignatureRequest = async (req, res) => {
  try {
    let docs = await documentModel.find({
      owner: req.profile._id,
      status: "pending",
      draft:false,

    }).populate('owner');

    return res.status(200).json({
      docs,
    });
  } catch (e) {
    return res.status(400).json({
      error: "Something went wrong please try again",
    });
  }
};

module.exports.recentSentRequest = async (req, res) => {
  try {
    let docs = await documentModel.find({
      status: "sent",
      draft:false
    }).populate('owner');

    return res.status(200).json({
      docs,
    });
  } catch (e) {
    return res.status(400).json({
      error: "Something went wrong please try again",
    });
  }
};


module.exports.deleteTemplate=async(req,res)=>{
  let {id}=req.params
  try{
await documentModel.findByIdAndDelete(id)
return res.status(200).json({
  message:"Template deleted sucessfully"
})
  }catch(e){
    return res.status(400).json({
      error:"Something went wrong please try again"
    })
  }
}

module.exports.getAllTemplates=async(req,res)=>{
  try {
    let docs = await documentModel.find({
      owner: req.profile._id,
      template:true,
      signTemplate:false,
      draft:false
    }).populate('owner');

    return res.status(200).json({
      docs,
    });
  } catch (e) {
    return res.status(400).json({
      error: "Something went wrong please try again",
    });
  }
}
module.exports.getUserDocuments = async (req, res) => {
  try {
    let docs = await documentModel.find({
      owner: req.profile._id,
      draft:false
    });

    return res.status(200).json({
      docs,
    });
  } catch (e) {
    return res.status(400).json({
      error: "Something went wrong please try again",
    });
  }
};

module.exports.editDocument = async (req, res) => {
  let { docId } = req.params;
  let { ...data } = req.body;
 
  try {
    if (req.file) {
      const filePath = path.join('/tmp/public/files', "files");
      const fileName = `${Date.now()}-${req.file.originalname}`;
      const combinedPath = path.join(filePath, fileName);

      if (!fs.existsSync(filePath)) {
        fs.mkdirSync(filePath, { recursive: true });
      }

      fs.writeFileSync(combinedPath, req.file.buffer);

      let cloudFileName = await cloudinaryUploadPdf(combinedPath, data.folder);

      data = {
        ...data,
        file: cloudFileName.url,
      };
    }

   
    await documentModel.findByIdAndUpdate(docId, {
      $set: data,
    });
    return res.status(200).json({
      message: "Document updated sucessfully",
    });
  } catch (e) {
    
    return res.status(400).json({
      error: "Something went wrong please try again",
    });
  }
};

module.exports.deleteDocument = async (req, res) => {
  try {
    
    let { id } = req.params;
    
    await documentModel.findByIdAndDelete(id);
    return res.status(200).json({
      message: "document deleted sucessfully",
    });
  } catch (e) {
    return res.status(400).json({
      error: "Something went wrong please try again",
    });
  }
};

module.exports.sendSignRequest = async (req, res) => {
  try {
    const { documentId, ...data } = req.body;

   
    const subscription = await subscriptionModel.findOne({ user: req.profile._id });
    if (!subscription) {
      return res.status(400).json({
        error: "You need to subscribe to send email"
      });
    }


    if (subscription.numberOfAvaiableEmails <= 0 || subscription.numberOfAvaiableEmails==0 || subscription.numberOfAvaiableEmails<0) {
      return res.status(400).json({
        error: "Max number of monthly emails reached please upgrade your plan"
      });
    }

   
    const doc = await documentModel.findOne({ _id: documentId }).populate('owner');
    const preference = await preferenceModel.findOne({ user: req.user._id });
    const transporter = nodemailer.createTransport({
      service: "gmail",
      auth: {
        user: "susolamin@gmail.com",
        pass: "rexsrzkvuuntceiq",
      },
    });

   
    for (const val of data.recipients) {
    
      let recipient = { ...val };
      
      if (!recipient?.name) {
        const contact = await contactmodel.findOne({ email: recipient.email });
        if (contact) recipient = { ...contact };
      } else {
        const contactFound = await contactmodel.findOne({ email: recipient.email });
        if (!contactFound) {
          recipient.user = req.user._id;
          await contactmodel.create(recipient);
        }
      }

      if(!recipient?.email){
        recipient=recipient._doc
      }
   
     
      const html = `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Document Signature Request - E-Lex Signature™</title>
</head>
<body style="margin: 0; padding: 0; font-family: 'Segoe UI', Arial, sans-serif; line-height: 1.6; color: #2D3748;">
    <table role="presentation" cellspacing="0" cellpadding="0" style="max-width: 680px; width: 100%; margin: 0 auto; background: #FFFFFF;">
        <!-- Unified Header -->
        <tr>
            <td style="background-color: #f8f9fa; padding: 25px; text-align: center; border-bottom: 2px solid #e9ecef;">
                <h1 style="color: #2d3436; margin: 0; font-size: 24px;">
                    <span style="color: #2d6cdf;">E-Lex</span><span style="color: #2d3436;">Signature</span>™
                </h1>
            </td>
        </tr>

        <!-- Signature Request Body -->
        <tr>
            <td style="padding: 30px 20px;">
                <p style="color: #636e72; margin: 0 0 20px 0;">${doc.owner.name} has invited you to sign: ${doc.title}</p>
                
                <!-- OTP Display -->
                <div style="background-color: #f8f9fa; padding: 15px; text-align: center; margin: 20px 0; border-radius: 5px;">
                    <h2 style="color: #e74c3c; margin: 0; font-size: 32px; letter-spacing: 3px;">
                      <a href="https://e-lex-frontend.vercel.app/admin/request-signatures/sign-document/${documentId}?email=${recipient.email}" 
                           style="background-color: #2d6cdf; color: #FFFFFF; padding: 12px 24px; 
                                  text-decoration: none; border-radius: 6px; font-weight: 600;
                                  display: inline-block; font-size: 16px; transition: background-color 0.3s;">
                            Review & Sign Document
                        </a>
                    </h2>
                </div>

            </td>
        </tr>

       

        <!-- Unified Footer -->
        <tr>
            <td style="background-color: #f8f9fa; padding: 25px; text-align: center; border-top: 2px solid #e9ecef;">
                <p style="color: #636e72; margin: 0; font-size: 12px; line-height: 1.6;">
                    Sent by E-Lex Signature™ Security Team<br>
                    <a href="https://www.opensign.com/privacy" style="color: #2d6cdf; text-decoration: none;">Privacy Policy</a> | 
                    <a href="https://www.opensign.com/support" style="color: #2d6cdf; text-decoration: none;">Support</a><br>
                    © ${new Date().getFullYear()} E-Lex Signature™. All rights reserved.
                </p>
            </td>
        </tr>
    </table>
</body>
</html>`;
    
 
      let subscriptionNew=await subscriptionModel.findOne({user:req.profile._id})
      if (subscriptionNew.numberOfAvaiableEmails <= 0 || subscriptionNew.numberOfAvaiableEmails==0 || subscriptionNew.numberOfAvaiableEmails<0) {
        return res.status(400).json({
          error: "Max number of monthly emails reached please upgrade your plan"
        });
      }
      await transporter.sendMail({
        from: "susolamin@gmail.com",
        to: recipient.email,
        subject: "Signature Request - E-Lex Signature™",
        html: html,
      });

      
      await subscriptionModel.updateOne({user:req.profile._id},{
        $inc: {  numberOfAvaiableEmails: -1 }
      });

     

   
      await documentModel.updateOne(
        { _id: documentId },
        {
          $push: { signers: { email: recipient.email, name: recipient.name} },
          $set: { status: "sent" }
        }
      );
    }

    
    return res.status(200).json({
      message: "Sign requests sent successfully",
    });

  } catch (e) {
    console.error("sendSignRequest error:", e.message);
    
   
    if (!res.headersSent) {
      return res.status(400).json({
        error: "Something went wrong. Please try again."
      });
    }
    
  
    console.error("Could not send error response - headers already sent");
  }
};


module.exports.getSpecificDoc = async (req, res) => {
  const { docId } = req.params;

  try {
    let doc = await documentModel.findById(docId);
    return res.status(200).json({
      doc,
    });
  } catch (e) {
    return res.status(400).json({
      error: "Something went wrong please try again",
    });
  }
};

module.exports.signDocument = async (req, res) => {
  let { email, documentId } = req.body;

  try {
   let subscription=await subscriptionModel.findOne({user:req.profile._id})
   if(!subscription){
    return res.status(400).json({
      error:"You need to subscribe to sign the document"
    })
   }
   if(subscription.numberOfAvaiableSigns==0){
    return res.status(400).json({
      error:"Monthly limit of avaiable sign reached please upgrade your plan"
    })
   }
 
  await subscriptionModel.findByIdAndUpdate(subscription._id, {
    $inc: { numberOfAvaiableSigns: -1 }
  });
  
  
  

    let doc = await documentModel.findById(documentId).populate({
      path:'owner',
      populate:{
        path:'user',
        model:'user'
      }
    });
    doc = doc.toObject();
    let handled = doc.signers.find(u => u.email === email && (u.signed === true || u.declined === true));
if(handled){
  return res.status(400).json({
    error:"Already completed"
  })
}
await documentModel.updateOne(
  {
    _id: documentId,
    "signers.email": email,
  },
  {
    $set: {
      "signers.$.signed": true,
      status:'completed'
    },
    new: true,
  }
  
);
    let preferences=await preferenceModel.findOne({user:doc.owner.user._id})
    let allSigned = doc.signers.every((u) => u.signed == true);
    if (allSigned) {
      await documentModel.updateOne(
        {
          _id: documentId,
          "signers.email": email,
        },
        {
          $set: {
            "signers.$.signed": true,
            status:'completed'
          },
          new: true,
        }
      );
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
    <title>Document Signature Request - E-Lex Signature™</title>
</head>
<body style="margin: 0; padding: 0; font-family: 'Segoe UI', Arial, sans-serif; line-height: 1.6; color: #2D3748;">
    <table role="presentation" cellspacing="0" cellpadding="0" style="max-width: 680px; width: 100%; margin: 0 auto; background: #FFFFFF;">
        <!-- Unified Header -->
        <tr>
            <td style="background-color: #f8f9fa; padding: 25px; text-align: center; border-bottom: 2px solid #e9ecef;">
                <h1 style="color: #2d3436; margin: 0; font-size: 24px;">
                    <span style="color: #2d6cdf;">E-Lex</span><span style="color: #2d3436;">Signature</span>™
                </h1>
            </td>
        </tr>

        <!-- Signature Request Body -->
        <tr>
            <td style="padding: 30px 20px;">
                <p style="color: #636e72; margin: 0 0 20px 0;">${doc.title} has been signed by all parties</p>
                
                <!-- OTP Display -->
                <div style="background-color: #f8f9fa; padding: 15px; text-align: center; margin: 20px 0; border-radius: 5px;">
                    <h2 style="color: #e74c3c; margin: 0; font-size: 32px; letter-spacing: 3px;">
                      Please download the document below
                    </h2>
                </div>

            </td>
        </tr>

       

        <!-- Unified Footer -->
        <tr>
            <td style="background-color: #f8f9fa; padding: 25px; text-align: center; border-top: 2px solid #e9ecef;">
                <p style="color: #636e72; margin: 0; font-size: 12px; line-height: 1.6;">
                    Sent by E-Lex Signature™ Security Team<br>
                    <a href="https://www.opensign.com/privacy" style="color: #2d6cdf; text-decoration: none;">Privacy Policy</a> | 
                    <a href="https://www.opensign.com/support" style="color: #2d6cdf; text-decoration: none;">Support</a><br>
                    © ${new Date().getFullYear()} E-Lex Signature™. All rights reserved.
                </p>
            </td>
        </tr>
    </table>
</body>
</html>
      `;

      const info = await transporter.sendMail({
        from: "susolamin@gmail.com",
        to: req.user.email,
        subject: `Document "${doc.title}" has been signed by all parties`,
        html: html,
        attachments: [
          {
            filename: `${doc.title}`,
            path: doc.file,
            contentType: "application/pdf",
          },
        ],
      });


  if(preferences.notify_on_signatures){
    await transporter.sendMail({
      from: "susolamin@gmail.com",
      to: doc.owner.user.email,
      subject: `Document "${doc.title}" has been signed by all parties`,
      html: html,
      attachments: [
        {
          filename: `${doc.title}`,
          path: doc.file,
          contentType: "application/pdf",
        },
      ],
    });
  }
    }
    return res.status(200).json({
      message: "Document signed sucessfully",
    });
  } catch (e) {
   
    return res.status(400).json({
      error: "Something went wrong please try again",
    });
  }
};

module.exports.getUserFiles = async (req, res) => {
  try {
    

    const result = await cloudinary.search
      .sort_by("created_at", "desc")
      .execute();

   

    if (!result.resources.length) {
      return res.status(404).json({ error: "No files found" });
    }

    const folders = new Set();
    const files = result.resources.map((file) => {
      const publicId = file.public_id;
      const url = file.secure_url;

      const pathSegments = publicId.split("/");
      const fileName = pathSegments.pop();
      const folderPath = pathSegments.join("/");

      if (pathSegments.length > 0) {
        let currentPath = "";
        for (const segment of pathSegments) {
          currentPath = currentPath ? `${currentPath}/${segment}` : segment;
          folders.add(currentPath);
        }
      }

      return {
        name: fileName,
        url: url,
        folder: folderPath || "/",
      };
    });

    const folderList = Array.from(folders).map((path) => ({
      name: path.split("/").pop(),
      path: path,
    }));

    return res.status(200).json({ files, folders: folderList });
  } catch (error) {
    return res.status(500).json({ error: "Failed to fetch data" });
  }
};

module.exports.assignEmailToRole = async (req, res) => {
  let { ...data } = req.body;
  let { documentId,recipients } = data;
  try {
   recipients.map(async(recipient,i)=>{
    await documentModel.updateOne(
      { _id: documentId, "elements.recipientRole": recipient.role },
      {
        $set: {
          "elements.$.recipientEmail": recipient.email,
          
        },
      }
    );
   })

    return res.status(200).json({
      message: "Email assigned to role sucessfully",
    });
  } catch (e) {
    return res.status(400).json({
      error: "Something went wrong please try again",
    });
  }
};
module.exports.embedElementsInPDF = async (req, res) => {
  try {
    const { documentId, elements } = req.body;

    if (!documentId || !elements) {
      return res.status(400).json({ message: "Missing documentId or elements" });
    }

    const doc = await documentModel.findById(documentId);
    if (!doc || !doc.file) {
      return res.status(404).json({ message: "Document not found" });
    }

    const response = await axios.get(doc.file, { responseType: "arraybuffer" });
    const pdfDoc = await PDFDocument.load(response.data);
    const pages = pdfDoc.getPages();

   
    const SIGNATURE_WIDTH = 200;  
    const SIGNATURE_HEIGHT = 80;  
    const TEXT_FIELD_WIDTH = 200;
    const TEXT_FIELD_HEIGHT = 30;
    const DATE_FIELD_WIDTH = 120;
    const DATE_FIELD_HEIGHT = 30;

    for (const element of elements) {
      const pageIndex = element.pageNumber ? element.pageNumber - 1 : 0;
      const page = pages[pageIndex];
      if (!page) continue;

      const pdfWidth = page.getWidth();
      const pdfHeight = page.getHeight();
      const scaleFactor = pdfWidth / 800;

      const x = element.x * scaleFactor;
      const y = pdfHeight - element.y * scaleFactor;

      let width, height, fontSize;

      switch (element.type) {
        case "signature":
          width = (element.width || SIGNATURE_WIDTH) * scaleFactor;
          height = (element.height || SIGNATURE_HEIGHT) * scaleFactor;
          fontSize = 16; 

          if (typeof element.value === "string" && element.value.startsWith("data:image/")) {
            const mimeMatch = element.value.match(/^data:image\/(png|jpe?g);/i);
            if (mimeMatch) {
              try {
                const imageType = mimeMatch[1].toLowerCase();
                const imageData = element.value.split(',')[1];
                const buffer = Buffer.from(imageData, "base64");
                const image = imageType === 'png' 
                  ? await pdfDoc.embedPng(buffer)
                  : await pdfDoc.embedJpg(buffer);

                page.drawImage(image, {
                  x,
                  y: y - height, 
                  width,
                  height,
                });
              } catch (error) {
                console.error("Error embedding signature image:", error);
              }
            }
          } else {
            page.drawText(element.value || "", {
              x,
              y: y - height,
              size: fontSize,
              color: rgb(0, 0, 0),
            });
          }
          break;

        case "date":
          width = (element.width || DATE_FIELD_WIDTH) * scaleFactor;
          height = (element.height || DATE_FIELD_HEIGHT) * scaleFactor;
          page.drawText(new Date(element.value).toLocaleDateString(), {
            x,
            y: y - height,
            size: 14,
            color: rgb(0, 0, 0),
          });
          break;

        default: 
          width = (element.width || TEXT_FIELD_WIDTH) * scaleFactor;
          height = (element.height || TEXT_FIELD_HEIGHT) * scaleFactor;
          page.drawText(element.value || "", {
            x,
            y: y - height,
            size: 14,
            color: rgb(0, 0, 0),
          });
          break;
      }
    }

    const pdfBytes = await pdfDoc.save();
    res.setHeader("Content-Type", "application/pdf");
    res.send(Buffer.from(pdfBytes));
  } catch (error) {
    console.error("PDF embedding error:", error);
    res.status(500).json({ message: "Error embedding elements into PDF" });
  }
};

module.exports.getExpiredDocs = async (req, res) => {
  try {
    
    const documents = await documentModel.find({
      time_to_complete: { $ne: null }, 
      owner: req.profile._id, 
      createdAt: { 
        $lte: moment().subtract('$time_to_complete', 'days')  
      }
    }).populate({
      path: 'owner',
      populate: {
        path: 'user',
        model: 'user'
      }
    });

    return res.status(200).json({ documents });
  } catch (e) {
    console.error(e);
    return res.status(400).json({
      error: "Something went wrong, please try again"
    });
  }
};


module.exports.declineDocs=async(req,res)=>{
  let {email,docId}=req.body;
  let alreadyHandled=await documentModel.findById(docId).populate({
    path:'owner',
    populate:{
      path:'user',
      model:'user'
    }
  })
  let handled = alreadyHandled.signers.find(u => u.email === email && (u.signed === true || u.declined === true));
if(handled){
  return res.status(400).json({
    error:"Already completed"
  })
}

  try{
    let updatedDoc = await documentModel.updateOne(
      { 
        _id: docId, 
        'signers.email': email 
      },
      {
        $set: {
          'signers.$.declined': true,
          status:'declined'
        }
      }
    );

    const transporter = nodemailer.createTransport({
      service: "gmail",
      auth: {
        user: "susolamin@gmail.com",
        pass: "rexsrzkvuuntceiq",
      },
    });


    
    const html = `<!DOCTYPE html>
    <html lang="en">
    <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Document Signature Request - E-Lex Signature™</title>
    </head>
    <body style="margin: 0; padding: 0; font-family: 'Segoe UI', Arial, sans-serif; line-height: 1.6; color: #2D3748;">
        <table role="presentation" cellspacing="0" cellpadding="0" style="max-width: 680px; width: 100%; margin: 0 auto; background: #FFFFFF;">
            <!-- Unified Header -->
            <tr>
                <td style="background-color: #f8f9fa; padding: 25px; text-align: center; border-bottom: 2px solid #e9ecef;">
                    <h1 style="color: #2d3436; margin: 0; font-size: 24px;">
                        <span style="color: #2d6cdf;">E-Lex</span><span style="color: #2d3436;">Signature</span>™
                    </h1>
                </td>
            </tr>
    
            <!-- Signature Request Body -->
            <tr>
                <td style="padding: 30px 20px;">
                    <p style="color: #636e72; margin: 0 0 20px 0;">${email} has declined your request to sign: ${alreadyHandled.title}</p>
                    
                
    
                </td>
            </tr>
    
           
    
            <!-- Unified Footer -->
            <tr>
                <td style="background-color: #f8f9fa; padding: 25px; text-align: center; border-top: 2px solid #e9ecef;">
                    <p style="color: #636e72; margin: 0; font-size: 12px; line-height: 1.6;">
                        Sent by E-Lex Signature™ Security Team<br>
                        <a href="https://www.opensign.com/privacy" style="color: #2d6cdf; text-decoration: none;">Privacy Policy</a> | 
                        <a href="https://www.opensign.com/support" style="color: #2d6cdf; text-decoration: none;">Support</a><br>
                        © ${new Date().getFullYear()} E-Lex Signature™. All rights reserved.
                    </p>
                </td>
            </tr>
        </table>
    </body>
    </html>`;

    await transporter.sendMail({
      from: "lemightyeagle@gmail.com",
      to: alreadyHandled.owner.user.email,
      subject: "Signature Declined - E-Lex Signature™",
      html: html,
    });

return res.status(200).json({
  message:"Sucessfully declined"
})
  }catch(e){
    
    return res.status(400).json({
      error:"Something went wrong please try again"
    })
  }
}


module.exports.getDeclinedDocs=async(req,res)=>{
  try{
    let documents = await documentModel.find({
      "signers.declined": true,  
      owner:req.profile._id
    }).populate({
      path: 'owner',
      populate: {
        path: 'user',
        model: 'user'
      }
    });
  
return res.status(200).json({
  documents
})
  }catch(e){
    return res.status(400).json({
      error:"Something went wrong please try again"
    })
  }
}

module.exports.getCompletedDocs=async(req,res)=>{
  try{
    let documents = await documentModel.find({
      status:'completed'
    }).populate({
      path: 'owner',
      populate: {
        path: 'user',
        model: 'user'
      }
    });
return res.status(200).json({
  documents
})
  }catch(e){
   
    return res.status(400).json({
      error:"Something went wrong please try again"
    })
  }
}

module.exports.getInProgressDocs=async(req,res)=>{
  try{
    let documents = await documentModel.find({
      "signers.signed": false, 
       owner:req.profile._id
    
    }).populate({
      path: 'owner',
      populate: {
        path: 'user',
        model: 'user'
      }
    });
return res.status(200).json({
  documents
})
  }catch(e){
    return res.status(400).json({
      error:"Something went wrong please try again"
    })
  }
}



module.exports.getNeedSignDocs=async(req,res)=>{
 
  try{
let documents=await documentModel.find({
  'signers.email':req.user.email,
  'signers.signed':false,
  
}).populate({
  path:'owner',
  populate:{
    path:'user',
    model:'user'
  }
})

return res.status(200).json({
  documents
})

}catch(e){
 
    return res.status(400).json({
      error:"Something went wrong please try again"
    })
  }
}



module.exports.getDocsAndProfile=async()=>{
  try{
    let profile=await profileModel.findOne({user:req.user._id})
    let docs=await documentModel.find({owner:profile._id})
    return res.status(200).json({
      profile,
      docs
    })
  }catch(e){
    return res.status(400).json({
      error:"Something went wrong please try again"
    })
  }
}

module.exports.createYourselfdraft=async(req,res)=>{
  let {...data}=req.body;

  data={
    ...data,
    elements:JSON.parse(data.elements),
    recipients:req.user.email
  }
 let alreadyExists=await documentModel.findOne({draftId:data.draftId})
 
 if(alreadyExists){
  await documentModel.updateOne({draftId:alreadyExists.draftId},{
    $set:data
  })
 

  return res.status(200).json({
    message:"Draft updated"
  })
 }

try{
  if (req.file) {
    const filePath = path.join('/tmp/public/files', "files");
    const fileName = `${Date.now()}-${req.file.originalname}`;
    const combinedPath = path.join(filePath, fileName);

    if (!fs.existsSync(filePath)) {
      fs.mkdirSync(filePath, { recursive: true });
    }

    fs.writeFileSync(combinedPath, req.file.buffer);

    let cloudFileName = await cloudinaryUploadPdf(combinedPath, data.folder);

    data = {
      ...data,
      file: cloudFileName.url,
    };
  }


data={
  ...data,
 
  owner:req.profile._id,
  draft:true
}
await documentModel.create(data)
}catch(e){

  return res.status(400).json({
    error:"Something went wrong please try again"
  })
}
}


module.exports.createDraft=async(req,res)=>{
  let {...data}=req.body;

  data={
    ...data,
    elements:JSON.parse(data.elements),
    recipients:JSON.parse(data.recipients)
  }
 
 let alreadyExists=await documentModel.findOne({draftId:data.draftId})

 if(alreadyExists){
  await documentModel.updateOne({draftId:alreadyExists.draftId},{
    $set:data
  })
 

  return res.status(200).json({
    message:"Draft updated"
  })
 }

try{
  if (req.file) {
    const filePath = path.join('/tmp/public/files', "files");
    const fileName = `${Date.now()}-${req.file.originalname}`;
    const combinedPath = path.join(filePath, fileName);

    if (!fs.existsSync(filePath)) {
      fs.mkdirSync(filePath, { recursive: true });
    }

    fs.writeFileSync(combinedPath, req.file.buffer);

    let cloudFileName = await cloudinaryUploadPdf(combinedPath, data.folder);

    data = {
      ...data,
      file: cloudFileName.url,
    };
  }

  const signers = await Promise.all(data.recipients.map(async (val) => {
    let recipient = { ...val };
  
    if (!recipient?.name) {
      const contact = await contactmodel.findOne({ email: recipient.email });
      if (contact) recipient = { ...contact };
    } else {
      const contactFound = await contactmodel.findOne({ email: recipient.email });
      if (!contactFound) {
        recipient.user = req.user._id;
        await contactmodel.create(recipient);
      }
    }
  
    if (!recipient?.email) {
      recipient = recipient._doc;
    }
  
    return recipient; 
  }));
data={
  ...data,
  signers,
  owner:req.profile._id,
  draft:true
}
await documentModel.create(data)
}catch(e){
 
  return res.status(400).json({
    error:"Something went wrong please try again"
  })
}
}



module.exports.getDrafts=async(req,res)=>{
  
try{
let drafts=await documentModel.find({owner:req.profile._id,draft:true}).populate('owner')
return res.status(200).json({
  drafts
})
}catch(e){
  return res.status(400).json({
    error:"Something went wrong please try again"
  })
}
}


module.exports.deleteDraft=async(req,res)=>{
 let {docId}=req.params;
  try{
await documentModel.findByIdAndDelete(docId)
return res.status(200).json({
  message:"Doc deleted sucessfully"
})
  }catch(e){
    return res.status(400).json({
      message:"Something went wrong please try again"
    })
  }
}

module.exports.duplicateTemplate=async(req,res)=>{
  let {...data}=req.body;
  delete data._id
  try{
await documentModel.create(data)
return res.status(200).json({
  message:"template duplicated sucessfully"
})
  }catch(e){
   
    return res.status(400).json({
      error:"Something went wrong please try again"
    })
  }
}





module.exports.saveTemplate = async (req, res) => {
  let combinedPath;
  try {
    let { ...data } = req.body;
   

    data.recipients.map(async(val,i)=>{
     
      val=JSON.parse(val)
      const contact = await contactmodel.findOne({ email:val.email });
      if(!contact){
        val.user = req.user._id;
        await contactmodel.create(val);
      }
    
    })

    
   
    let elements;
    try {
      elements =
        typeof data.elements === "string"
          ? JSON.parse(data.elements)
          : data.elements;
    } catch (err) {
      console.error("Error parsing elements:", err.message);
      return res.status(400).json({ error: "Invalid elements JSON" });
    }

   
    const normalizedElements = elements.map((el) => ({
      ...el,
      value: el.value || el.text || el.data || "", 
      label: el.label || el.type,
    }));

    data.elements = normalizedElements;

 
    const originalPdfDoc = await PDFDocument.load(req.file.buffer);
    const pages = originalPdfDoc.getPages();
    const scaleFactor = pages[0].getWidth() / 800;

    for (const element of normalizedElements) {
      const pageIndex = element.pageNumber ? element.pageNumber - 1 : 0;
      const page = pages[pageIndex];
      if (!page) continue;

      const x = element.x * scaleFactor;
      const y = page.getHeight() - element.y * scaleFactor;
      const width = (element.width || 100) * scaleFactor;
      const height = (element.height || 40) * scaleFactor;

      switch (element.type) {
        case "signature":
          if (element.value?.startsWith("data:image")) {
            const base64Data = element.value.split(",")[1];
            const image = await originalPdfDoc.embedPng(
              Buffer.from(base64Data, "base64")
            );
            page.drawImage(image, {
              x,
              y: y - height * 0.5,
              width: SIGNATURE_WIDTH,
              height: SIGNATURE_HEIGHT,
            });
          } else {
            page.drawText(element.value || "", {
              x,
              y: y - height,
              size: 14,
              color: rgb(0, 0, 0),
            });
          }
          break;

        case "date":
          page.drawText(new Date(element.value).toLocaleDateString(), {
            x,
            y: y - height,
            size: 14,
            color: rgb(0, 0, 0),
          });
          break;

        case "text":
        case "name":
        case "email":
        case "jobTitle":
        case "company":
          page.drawText(element.value || "", {
            x,
            y: y - height,
            size: 14,
            color: rgb(0, 0, 0),
          });
          break;

        default:
          break;
      }
    }

   
    const embeddedPdfBytes = await originalPdfDoc.save();
    const filePath = path.join('/tmp/public/files', "files");
    const fileName = `${Date.now()}-${req.file.originalname}`;
    const combinedPath = path.join(filePath, fileName);

    if (!fs.existsSync(filePath)) {
      fs.mkdirSync(filePath, { recursive: true });
    }

    fs.writeFileSync(combinedPath, Buffer.from(embeddedPdfBytes));

    
    const cloudFile = await cloudinaryUploadPdf(
      combinedPath,
      `user_${req.profile._id}/${data.folder || "default"}`
    );

   
    let docData = {
      ...data,
      file: cloudFile.url,
      owner: req.profile._id,
    };
    if(docData.draftId){
      await documentModel.deleteMany({ draftId: data.draftId });
      delete docData.draftId;
    }

   

    const doc = await documentModel.create(docData);

   
    if (fs.existsSync(combinedPath)) {
      fs.unlinkSync(combinedPath);
    }


    return res.status(200).json({
      message: "Document created successfully",
      doc,
    });
  } catch (e) {
    console.error("saveDocument error:", e.message);
    return res.status(400).json({
      error: "Something went wrong, please try again",
    });
  }
};


module.exports.createSignTemplate=async(req,res)=>{
  let {...data}=req.body;
  delete data._id
  try{
let doc=await documentModel.create(data)
return res.status(200).json({
  message:"sucess",
doc
})
  }catch(e){
return res.status(400).json({
  error:"Something went wrong please try again"
})
  }
}


module.exports.handleSaveAsTemplate=async(req,res)=>{
 let {id}=req.params;
  try{
await documentModel.findByIdAndUpdate(id,{
  $set:{
    draft:false,
    draftId:'',
    template:true
  }
})
return res.status(200).json({
  message:"Draft updated to template sucessfully"
})
 }catch(e){

  return res.status(400).json({
    error:"Something went wrong please try again"
  })
 } 
}