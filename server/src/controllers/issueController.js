import mongoose from 'mongoose';
import Comment from '../models/Comment.js';
import Issue, { ISSUE_STATUSES } from '../models/Issue.js';
import { AppError } from '../middleware/errors.js';

const userId = (user) => new mongoose.Types.ObjectId(user.id);

export async function createIssue(req, res) {
  const issue = await Issue.create({ ...req.body, reportedBy: userId(req.user) });
  return res.status(201).json({ success: true, data: issue });
}

export async function listIssues(req, res) {
  const page = Number(req.query.page) || 1;
  const limit = Number(req.query.limit) || 10;
  const filter = {};
  if (req.user.role !== 'admin') filter.reportedBy = userId(req.user);
  for (const field of ['status', 'category', 'priority']) {
    if (typeof req.query[field] === 'string') filter[field] = req.query[field];
  }
  if (typeof req.query.search === 'string' && req.query.search) {
    filter.title = { $regex: req.query.search.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), $options: 'i' };
  }
  const [issues, total] = await Promise.all([
    Issue.find(filter).sort({ createdAt: -1 }).skip((page - 1) * limit).limit(limit).populate('reportedBy', 'name email'),
    Issue.countDocuments(filter),
  ]);
  return res.status(200).json({ success: true, data: issues, pagination: { page, limit, total, pages: Math.ceil(total / limit) } });
}

export async function getIssue(req, res) {
  const filter = { _id: req.params.id };
  if (req.user.role !== 'admin') filter.reportedBy = userId(req.user);
  const issue = await Issue.findOne(filter).populate('reportedBy', 'name email');
  if (!issue) throw new AppError(404, 'Issue not found');
  return res.status(200).json({ success: true, data: issue });
}

export async function updateIssue(req, res) {
  const issue = await Issue.findOne({ _id: req.params.id, reportedBy: userId(req.user) });
  if (!issue) throw new AppError(404, 'Issue not found');
  if (issue.status !== 'Open') throw new AppError(409, 'Only open issues can be edited');
  Object.assign(issue, req.body);
  await issue.save();
  return res.status(200).json({ success: true, data: issue });
}

export async function updateIssueStatus(req, res) {
  const issue = await Issue.findById(req.params.id);
  if (!issue) throw new AppError(404, 'Issue not found');
  const nextStatus = req.body.status;
  const currentIndex = ISSUE_STATUSES.indexOf(issue.status);
  if (ISSUE_STATUSES[currentIndex + 1] !== nextStatus) {
    throw new AppError(409, 'Status must move from Open to In Progress to Resolved');
  }
  issue.status = nextStatus;
  await issue.save();
  return res.status(200).json({ success: true, data: issue });
}

export async function updateIssuePriority(req, res) {
  const issue = await Issue.findById(req.params.id);
  if (!issue) throw new AppError(404, 'Issue not found');
  issue.priority = req.body.priority;
  await issue.save();
  return res.status(200).json({ success: true, data: issue });
}

export async function deleteIssue(req, res) {
  const filter = { _id: req.params.id };
  if (req.user.role !== 'admin') filter.reportedBy = userId(req.user);
  const issue = await Issue.findOneAndDelete(filter);
  if (!issue) throw new AppError(404, 'Issue not found');
  await Comment.deleteMany({ issue: issue._id });
  return res.status(200).json({ success: true, message: 'Issue deleted' });
}

export async function createComment(req, res) {
  const filter = { _id: req.params.id };
  if (req.user.role !== 'admin') filter.reportedBy = userId(req.user);
  const issue = await Issue.exists(filter);
  if (!issue) throw new AppError(404, 'Issue not found');
  const comment = await Comment.create({ issue: req.params.id, author: userId(req.user), text: req.body.text });
  await comment.populate('author', 'name');
  return res.status(201).json({ success: true, data: comment });
}

export async function listComments(req, res) {
  const filter = { _id: req.params.id };
  if (req.user.role !== 'admin') filter.reportedBy = userId(req.user);
  if (!await Issue.exists(filter)) throw new AppError(404, 'Issue not found');
  const comments = await Comment.find({ issue: req.params.id }).sort({ createdAt: 1 }).populate('author', 'name');
  return res.status(200).json({ success: true, data: comments });
}