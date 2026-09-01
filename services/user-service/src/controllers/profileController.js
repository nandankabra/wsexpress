const profileService = require('../services/profileService');

async function getMe(req, res, next) {
  try {
    const profile = await profileService.getProfile(req.user.sub);
    res.status(200).json(profile);
  } catch (err) {
    next(err);
  }
}

async function putMe(req, res, next) {
  try {
    const profile = await profileService.upsertProfile(req.user.sub, req.body);
    res.status(200).json(profile);
  } catch (err) {
    next(err);
  }
}

async function getById(req, res, next) {
  try {
    const profile = await profileService.getProfile(req.params.userId);
    res.status(200).json(profile);
  } catch (err) {
    next(err);
  }
}

async function list(req, res, next) {
  try {
    const limit = Math.min(Number(req.query.limit) || 20, 100);
    const result = await profileService.listProfiles({ cursor: req.query.cursor, limit });
    res.status(200).json(result);
  } catch (err) {
    next(err);
  }
}

module.exports = { getMe, putMe, getById, list };
