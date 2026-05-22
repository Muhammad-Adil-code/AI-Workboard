import mongoose, { Schema } from 'mongoose'

const SubtaskSchema = new Schema({
  id: String,
  title: String,
  done: { type: Boolean, default: false },
})

const TaskSchema = new Schema({
  title: { type: String, required: true },
  description: String,
  status: {
    type: String,
    enum: ['todo', 'in-progress', 'review', 'done'],
    default: 'todo',
  },
  priority: {
    type: String,
    enum: ['low', 'medium', 'high', 'urgent'],
    default: 'medium',
  },
  clientId: { type: Schema.Types.ObjectId, ref: 'Client' },
  dueDate: Date,
  estimatedHours: Number,
  actualHours: Number,
  tags: [String],
  subtasks: [SubtaskSchema],
  boardId: { type: String, default: 'default' },
  order: { type: Number, default: 0 },
}, { timestamps: true })

export default mongoose.models.Task || mongoose.model('Task', TaskSchema)
