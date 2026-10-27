import { Router } from 'express';
import asyncHandler from '../middleware/asyncHandler.js';
import { requireAdmin, requireAuth } from '../middleware/auth.js';
import { validate } from '../middleware/validate.js';
import { commentRules, createIssueRules, idParam, listRules, priorityRules, rejectUnknownBody, statusRules, updateIssueRules } from '../middleware/validators.js';
import * as issueController from '../controllers/issueController.js';

const router = Router();
router.use(requireAuth);
router.get('/', listRules, validate, asyncHandler(issueController.listIssues));
router.post('/', rejectUnknownBody(createIssueRules), validate, asyncHandler(issueController.createIssue));
router.get('/:id', idParam, validate, asyncHandler(issueController.getIssue));
router.put('/:id', idParam, rejectUnknownBody(updateIssueRules), validate, asyncHandler(issueController.updateIssue));
router.patch('/:id/status', requireAdmin, idParam, rejectUnknownBody(statusRules), validate, asyncHandler(issueController.updateIssueStatus));
router.patch('/:id/priority', requireAdmin, idParam, rejectUnknownBody(priorityRules), validate, asyncHandler(issueController.updateIssuePriority));
router.delete('/:id', idParam, validate, asyncHandler(issueController.deleteIssue));
router.post('/:id/comments', idParam, rejectUnknownBody(commentRules), validate, asyncHandler(issueController.createComment));
router.get('/:id/comments', idParam, validate, asyncHandler(issueController.listComments));

export default router;