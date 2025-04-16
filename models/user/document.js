const mongoose = require('mongoose');

const documentSchema = mongoose.Schema(
    {
        title: {
            type: String,
            required: [true, 'Please enter title'],
        },
        owner: {
            type: mongoose.Schema.ObjectId,
            ref: 'profile',
        },
status:{
type:String,
default:'pending'
},
        file: {
            type: String,
            required: [true, 'Please upload file'],
        },
        note: {
            type: String,
        },
        folder: {
            type: String,
        },
      signers:[
        {
            name:{
                type:String
            },
            email:{
                type:String,
                required:[true,'Please enter your email']
            },
            mobile:{
                type:String
            },
            signed:{
                type:Boolean,
                default:false
            },
            declined:{
              type:Boolean,
              default:false
            },
            role:{
                type:String
            }
        }
      ],
      elements: [
        {
          type: {
            type: String,
            
          },
          x: {
            type: Number,
          
          },
          y: {
            type: Number,
          
          },
          label: {
            type: String,
            
          },
          recipientEmail:{
            type:String
          },
          recipientRole:{
        type:String
          },
          value: String,
          email:String
         
         
        }
      ],
      template:{
        type:Boolean,
        default:false
      },
      draft:{
        type:Boolean,
        default:false
      },
      signTemplate:{
type:Boolean,
default:false
      },
      draftId:{
        type:String
      },
      copyId:{
        type:String
      },
      time_to_complete:{
        type:Number
      }
    },
    {
        timestamps: true,
    }
);

module.exports = mongoose.model('document', documentSchema);
