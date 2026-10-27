import mongoose from 'mongoose';

export const ISSUE_CATEGORIES = ['Electrical', 'Plumbing', 'Network', 'Furniture', 'Cleanliness', 'Other'];
export const ISSUE_PRIORITIES = ['Low', 'Medium', 'High'];
export const ISSUE_STATUSES = ['Open', 'In Progress', 'Resolved'];

const issueSchema = new mongoose.Schema({
  title: { type: String, required: true, trim: true, minlength: 5, maxlength: 100 },
  description: { type: String, required: true, trim: true, maxlength: 1000 },
  category: { type: String, required: true, enum: ISSUE_CATEGORIES },
  location: { type: String, required: true, trim: true, maxlength: 160 },
  priority: { type: String, required: true, enum: ISSUE_PRIORITIES, default: 'Medium' },
  status: { type: String, enum: ISSUE_STATUSES, default: 'Open' },
  reportedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
}, { timestamps: true });

issueSchema.index({ status: 1, category: 1, priority: 1, createdAt: -1 });

export default mongoose.model('Issue', issueSchema);