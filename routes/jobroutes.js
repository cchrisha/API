const express = require('express');
const router = express.Router();
const { verifyToken } = require('../middleware/auth');
const Job = require('../models/job.model.js');  // Make sure Job model is imported

// Post a Job
router.post('/api/jobs', verifyToken, async (req, res) => {
    try {
        const { title, wageRange, isCrypto, location, professions, categories } = req.body;
        const job = await Job.create({
            title, wageRange, isCrypto, location, professions, categories, poster: req.user.userId
        });
        res.status(201).json(job);
    } catch (e) {
        res.status(500).json({ message: e.message });
    }
});

// Get Jobs Based on Profession
router.get('/api/jobs/profession', verifyToken, async (req, res) => {
    try {
        const jobs = await Job.find({ professions: req.user.profession })
            .limit(10)
            .populate('poster', 'name');
        res.status(200).json(jobs);
    } catch (e) {
        res.status(500).json({ message: e.message });
    }
});

// Get Most Recent Jobs (Posted in the Last Week)
router.get('/api/jobs/recent', async (req, res) => {
    try {
        const oneWeekAgo = new Date();
        oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);
        const jobs = await Job.find({ datePosted: { $gte: oneWeekAgo } })
            .limit(10)
            .populate('poster', 'name');
        res.status(200).json(jobs);
    } catch (e) {
        res.status(500).json({ message: e.message });
    }
});

// Get All Jobs
router.get('/api/jobs', async (req, res) => {
    try {
        const jobs = await Job.find().populate('poster', 'name');
        res.status(200).json(jobs);
    } catch (e) {
        res.status(500).json({ message: e.message });
    }
});

// Post Job Request
router.post('/api/jobs/:jobId/request', verifyToken, async (req, res) => {
    try {
        const job = await Job.findById(req.params.jobId);
        if (!job) return res.status(404).json({ message: "Job not found" });

        const existingRequest = job.requests.find(req => req.user.toString() === req.user.userId);
        if (existingRequest) return res.status(400).json({ message: "You have already requested this job" });

        job.requests.push({ user: req.user.userId });
        await job.save();

        res.status(200).json({ message: "Job request submitted" });
    } catch (e) {
        res.status(500).json({ message: e.message });
    }
});

// Cancel Job Request
router.delete('/api/jobs/:jobId/request', verifyToken, async (req, res) => {
    try {
        const job = await Job.findById(req.params.jobId);
        if (!job) return res.status(404).json({ message: "Job not found" });

        // Find the index of the request made by the user
        const requestIndex = job.requests.findIndex(req => req.user.toString() === req.user.userId);
        if (requestIndex === -1) return res.status(400).json({ message: "You have not requested this job" });

        // Remove the request from the array
        job.requests.splice(requestIndex, 1);
        await job.save();

        res.status(200).json({ message: "Job request canceled" });
    } catch (e) {
        res.status(500).json({ message: e.message });
    }
});

// Get Jobs Posted by User
router.get('/api/user/:userId/jobs', async (req, res) => {
    try {
        const jobs = await Job.find({ poster: req.params.userId }).populate('poster', 'name');
        res.status(200).json(jobs);
    } catch (e) {
        res.status(500).json({ message: e.message });
    }
});

// Get Job Requests
router.get('/api/jobs/:jobId/requests', async (req, res) => {
    try {
        const job = await Job.findById(req.params.jobId).populate('requests.user', 'name');
        res.status(200).json(job.requests);
    } catch (e) {
        res.status(500).json({ message: e.message });
    }
});

// Accept/Reject Job Request
router.put('/api/jobs/:jobId/request/:userId', verifyToken, async (req, res) => {
    try {
        const { action } = req.body; // 'accept' or 'reject'
        const job = await Job.findById(req.params.jobId);
        const request = job.requests.find(r => r.user.toString() === req.params.userId);
        if (!request) return res.status(404).json({ message: "Request not found" });

        if (action === 'accept') {
            job.workers.push({ user: request.user, status: 'working on' });
            request.status = 'working on';
        } else if (action === 'reject') {
            request.status = 'rejected';
        }
        await job.save();

        res.status(200).json(job);
    } catch (e) {
        res.status(500).json({ message: e.message });
    }
});

// Update Worker Status (Mark as Done or Cancelled)
router.put('/api/jobs/:jobId/workers/:userId', verifyToken, async (req, res) => {
    try {
        const { action } = req.body; // 'done' or 'canceled'
        const job = await Job.findById(req.params.jobId);
        const worker = job.workers.find(w => w.user.toString() === req.params.userId);
        if (!worker) return res.status(404).json({ message: "Worker not found" });

        worker.status = action;
        await job.save();

        res.status(200).json(job);
    } catch (e) {
        res.status(500).json({ message: e.message });
    }
});

// Get Jobs Based on Status (Rejected, Requested, Working On, etc.)
router.get('/api/user/jobs/status/:status', verifyToken, async (req, res) => {
    try {
        const jobs = await Job.find({
            'requests.user': req.user.userId,
            'requests.status': req.params.status
        }).populate('poster', 'name');

        res.status(200).json(jobs);
    } catch (e) {
        res.status(500).json({ message: e.message });
    }
});

module.exports = router;
