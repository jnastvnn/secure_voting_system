import express from 'express';
import pollController from '../controllers/pollController.js';
import authMiddleware from '../middleware/authMiddleware.js';

const router = express.Router();

/**
 * Unified routes for both standard and secure polls
 * The type of poll is determined by a query parameter: ?secure=true|false
 */

// All poll routes require authentication
router.use(authMiddleware);

// Get all polls
router.get('/', pollController.getAllPolls);

// Create a new poll
router.post('/create', pollController.createPoll);

// Submit a vote
router.post('/vote', pollController.submitVote);

// Get vote counts for a poll
router.get('/:pollId/counts', pollController.getVoteCounts);

// Secure poll specific endpoints
router.post('/verify', pollController.verifyVote);
router.get('/:pollId/user-voted', pollController.hasUserVoted);

export default router; 