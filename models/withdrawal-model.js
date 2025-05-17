const mongoose = require('mongoose');
const mongoosePaginate = require('mongoose-paginate-v2');

const withdrawalSchema = new mongoose.Schema(
  {
    seller: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Seller',
      required: true
    },
    amount: {
      type: Number,
      required: true,
      min: 0
    },
    paymentMethod: {
      type: String,
      enum: ['bank_transfer', 'upi'],
      required: true
    },
    status: {
      type: String,
      enum: ['Pending', 'Completed', 'Cancelled', 'Rejected'],
      default: 'Pending'
    },
    transactionId: {
      type: String,
      default: null
    },
    processedAt: {
      type: Date,
      default: null
    },
    processedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Admin',
      default: null
    },
    notes: {
      type: String,
      default: ''
    }
  },
  {
    timestamps: true
  }
);

// Add pagination plugin
withdrawalSchema.plugin(mongoosePaginate);

const Withdrawal = mongoose.model('Withdrawal', withdrawalSchema);

module.exports = Withdrawal; 