import mongoose, { Schema } from 'mongoose'

const ClientSchema = new Schema({
  name: { type: String, required: true },
  email: { type: String, required: true },
  company: String,
  color: { type: String, default: '#6366f1' },
  invoiceStatus: {
    type: String,
    enum: ['unpaid', 'sent', 'paid', 'overdue'],
    default: 'unpaid',
  },
  totalEarned: { type: Number, default: 0 },
}, { timestamps: true })

export default mongoose.models.Client || mongoose.model('Client', ClientSchema)
