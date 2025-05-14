import CryptoJS from 'crypto-js';
import { v4 as uuidv4 } from 'uuid';

/**
 * Utility functions for implementing secure voting concepts:
 * 1. Individual Verifiability
 * 2. Ballot Secrecy
 * 3. Homomorphic-like Vote Counting
 */

const SECRET_KEY = process.env.VOTE_ENCRYPTION_KEY || 'secure_voting_default_key';

/**
 * Encrypts a vote with a secret key and random salt
 * @param {Object} voteData - Data to encrypt
 * @returns {Object} - Encrypted data with salt
 */
export function encryptVote(voteData) {
  const salt = CryptoJS.lib.WordArray.random(128/8);
  const saltedData = { ...voteData, salt: salt.toString() };
  
  // Encrypt the vote data
  const encrypted = CryptoJS.AES.encrypt(
    JSON.stringify(saltedData), 
    SECRET_KEY
  ).toString();
  
  return {
    encrypted,
    salt: salt.toString()
  };
}

/**
 * Decrypts vote data (only used for verification, not regular counting)
 * @param {string} encryptedData - The encrypted vote data
 * @returns {Object|null} - Decrypted vote data or null if decryption fails
 */
export function decryptVote(encryptedData) {
  try {
    const decrypted = CryptoJS.AES.decrypt(encryptedData, SECRET_KEY);
    return JSON.parse(decrypted.toString(CryptoJS.enc.Utf8));
  } catch (error) {
    console.error('Vote decryption failed:', error);
    return null;
  }
}

/**
 * Generates a verification hash for a vote that can be used by voters
 * to verify their vote was counted correctly
 * @param {Object} voteData - Data to generate verification hash from
 * @param {string} salt - Salt used in encryption
 * @returns {string} - Verification hash
 */
export function generateVerificationHash(voteData, salt) {
  // Create a deterministic representation that excludes any personal identifiers
  const verifiableData = {
    pollId: voteData.pollId,
    optionId: voteData.optionId,
    salt: salt
  };
  
  // Create a hash from the data
  return CryptoJS.SHA256(JSON.stringify(verifiableData)).toString();
}

/**
 * Generates a verification token for a voter to verify their vote later
 * @param {string} voteId - The unique ID of the vote
 * @param {string} hash - The verification hash of the vote
 * @returns {string} - Verification token
 */
export function generateVerificationToken(voteId, hash) {
  // Combine vote ID and hash, then create a verification token
  const tokenData = { voteId, partialHash: hash.substring(0, 16) };
  return CryptoJS.HmacSHA256(JSON.stringify(tokenData), SECRET_KEY).toString();
}

/**
 * Generates a new unique vote ID
 * @returns {string} - UUID for the vote
 */
export function generateVoteId() {
  return uuidv4();
}

/**
 * Updates the homomorphic-like tally for a poll
 * @param {Object} tallyData - Current tally data
 * @param {number} optionId - Option being voted for
 * @returns {Object} - Updated tally data
 */
export function updateEncryptedTally(tallyData, optionId) {
  const newTally = { ...tallyData };
  
  // Initialize if option doesn't exist
  if (!newTally[optionId]) {
    newTally[optionId] = { count: 0, hash: '' };
  }
  
  // Increment the count
  newTally[optionId].count += 1;
  
  // Update the hash - combines the previous hash with new vote
  // This helps verify the integrity of the tally without revealing individual votes
  const newHash = CryptoJS.SHA256(
    `${newTally[optionId].hash || ''}:${optionId}:${Date.now()}`
  ).toString();
  
  newTally[optionId].hash = newHash;
  
  return newTally;
}

/**
 * Verifies a vote using the token provided to the voter
 * @param {string} voteId - UUID of the vote
 * @param {string} verificationToken - Token provided to voter
 * @param {string} voteHash - Hash stored with the vote
 * @returns {boolean} - Whether verification was successful
 */
export function verifyVote(voteId, verificationToken, voteHash) {
  const tokenData = { voteId, partialHash: voteHash.substring(0, 16) };
  const expectedToken = CryptoJS.HmacSHA256(JSON.stringify(tokenData), SECRET_KEY).toString();
  
  return expectedToken === verificationToken;
}

/**
 * Counts all votes for a poll using the homomorphic-like tally
 * @param {Object} tallyData - Encrypted tally data
 * @returns {Object} - Vote counts for each option
 */
export function countVotesFromTally(tallyData) {
  const results = {};
  
  Object.keys(tallyData).forEach(optionId => {
    results[optionId] = tallyData[optionId].count;
  });
  
  return results;
} 