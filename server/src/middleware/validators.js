import { body, checkExact, param, query } from 'express-validator';
import { ISSUE_CATEGORIES, ISSUE_PRIORITIES, ISSUE_STATUSES } from '../models/Issue.js';

const title = body('title').isString().withMessage('Title is required').bail().trim().isLength({ min: 5, max: 100 }).withMessage('Title must be 5 to 100 characters');
const description = body('description').isString().withMessage('Description is required').bail().trim().isLength({ min: 1, max: 1000 }).withMessage('Description must be at most 1000 characters');
const category = body('category').isString().isIn(ISSUE_CATEGORIES).withMessage('Choose a valid category');
const location = body('location').isString().bail().trim().isLength({ min: 1, max: 160 }).withMessage('Location is required');
const priority = body('priority').isString().isIn(ISSUE_PRIORITIES).withMessage('Choose a valid priority');

export const idParam = [param('id').isMongoId().withMessage('Invalid issue id')];
export const createIssueRules = [title, description, category, location, priority];
export const updateIssueRules = [
  body('title').optional().isString().bail().trim().isLength({ min: 5, max: 100 }),
  body('description').optional().isString().bail().trim().isLength({ min: 1, max: 1000 }),
  body('category').optional().isString().isIn(ISSUE_CATEGORIES),
  body('location').optional().isString().bail().trim().isLength({ min: 1, max: 160 }),
  body('priority').optional().isString().isIn(ISSUE_PRIORITIES),
  body().custom((_value, { req }) => Object.keys(req.body).length > 0).withMessage('Provide at least one field to update'),
];
export const statusRules = [body('status').isString().isIn(ISSUE_STATUSES).withMessage('Choose a valid status')];
const listQueryRules = [
  query('page').optional().isInt({ min: 1 }).toInt(),
  query('limit').optional().isInt({ min: 1, max: 50 }).toInt(),
  query('status').optional().isString().isIn(ISSUE_STATUSES),
  query('category').optional().isString().isIn(ISSUE_CATEGORIES),
  query('priority').optional().isString().isIn(ISSUE_PRIORITIES),
  query('search').optional().isString().trim().isLength({ max: 100 }),
];
export const listRules = [...listQueryRules, checkExact(listQueryRules, { locations: ['query'], message: 'Unexpected query parameters' })];
export const commentRules = [body('text').isString().bail().trim().isLength({ min: 1, max: 1000 }).withMessage('Comment must be 1 to 1000 characters')];

export const rejectUnknownBody = (rules) => [...rules, checkExact(rules, { locations: ['body'], message: 'Unexpected fields in request' })];