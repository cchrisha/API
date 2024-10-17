//api/routes/jobroutes.js
const express = require('express');
const router = express.Router();
const verifyToken = require('../middleware/auth');
const Job = require('../models/job.model.js');  // Make sure Job model is imported
const mongoose = require('mongoose');

// Post a Job
router.post('/api/jobs', verifyToken, async (req, res) => {
    try {
        const { title, wageRange, isCrypto, location, professions, categories, description } = req.body;
        const job = await Job.create({
            title, wageRange, isCrypto, location, professions, categories,description, poster: req.user.userId
        });
        res.status(201).json(job);
    } catch (e) {
        res.status(500).json({ message: e.message });
    }
    
});

//Edit job
router.put('/api/jobs/:jobId', verifyToken, async (req, res) => {
    try {
        const { title, wageRange, isCrypto, location, professions, categories, description } = req.body;
        const job = await Job.findByIdAndUpdate(req.params.jobId, {
            title,
            wageRange,
            isCrypto,
            location,
            professions,
            categories,
            description  // Update description here
        }, { new: true });

        if (!job) return res.status(404).json({ message: "Job not found" });

        res.status(200).json(job);
    } catch (e) {
        res.status(500).json({ message: e.message });
    }
});

// Delete a Job
router.delete('/api/jobs/:jobId', verifyToken, async (req, res) => {
    try {
        const job = await Job.findById(req.params.jobId);

        if (!job) {
            return res.status(404).json({ message: "Job not found" });
        }

        // Ensure that the job can only be deleted by the user who posted it
        if (job.poster.toString() !== req.user.userId) {
            return res.status(403).json({ message: "You are not authorized to delete this job" });
        }

        await job.deleteOne();  // Use deleteOne instead of remove
        res.status(200).json({ message: "Job deleted successfully" });
    } catch (e) {
        res.status(500).json({ message: e.message });
    }
});


// // Get Jobs Based on Profession
// router.get('/api/jobs/profession', verifyToken, async (req, res) => {
//     try {
//         console.log(req.user); //print user profession

//         const profession = req.user.profession ? req.user.profession.toLowerCase() : ''; //this first
//         console.log('User Profession:', profession); // Debugging log

//         //const jobs = await Job.find({ professions: req.user.profession })
//         //const jobs = await Job.find({ professions: { $regex: profession, $options: 'i' } }) // Use regex for case-insensitive matching
//         const jobs = await Job.find({ 
//             professions: { $elemMatch: { $eq: profession } } // Exact match
//         })
//             .limit(10)
//             .populate('poster', 'name');
//         res.status(200).json(jobs);
//     } catch (e) {
//         res.status(500).json({ message: e.message });
//     }
// });

// // Get Most Recent Jobs (Posted in the Last Week)
// router.get('/api/jobs/recent', async (req, res) => {
//     try {
//         const oneWeekAgo = new Date();
//         oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);
//         const jobs = await Job.find({ datePosted: { $gte: oneWeekAgo } })
//             .limit(10)
//             .populate('poster', 'name');
//         res.status(200).json(jobs);
//     } catch (e) {
//         res.status(500).json({ message: e.message });
//     }
// });

// Get Jobs Based on Profession
router.get('/api/jobs/profession', verifyToken, async (req, res) => {
    try {
        console.log(req.user); // Print user profession

        const profession = req.user.profession ? req.user.profession.toLowerCase() : ''; // Ensure profession is in lowercase
        console.log('User Profession:', profession); // Debugging log

        const jobs = await Job.find({ 
            professions: { $elemMatch: { $eq: profession } } // Exact match on profession
        })
            .sort({ datePosted: -1 }) // Sort from latest to oldest
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
            .sort({ datePosted: -1 }) // Sort from latest to oldest
            .limit(10)
            .populate('poster', 'name');
        res.status(200).json(jobs);
    } catch (e) {
        res.status(500).json({ message: e.message });
    }
});


// Get All Jobs
router.get('/api/alljobs', async (req, res) => {
    try {
        const jobs = await Job.find().populate('poster', 'name');
        res.status(200).json(jobs);
    } catch (e) {
        res.status(500).json({ message: e.message });
    }
});

// Post Job Request
// router.post('/api/jobs/:jobId/request', verifyToken, async (req, res) => {
//     try {
//         const job = await Job.findById(req.params.jobId);
//         if (!job) return res.status(404).json({ message: "Job not found" });

//         const existingRequest = job.requests.find(req => req.user.toString() === req.user.userId);
//         //const existingRequest = job.requests.find(request => request.user.toString() === req.user.userId);
//         //req refers to the job request object inside the find function
//         if (existingRequest) return res.status(400).json({ message: "You have already requested this job" });

//         job.requests.push({ user: req.user.userId });
//         await job.save();

//         res.status(200).json({ message: "Job request submitted" });
//     } catch (e) {
//         res.status(500).json({ message: e.message });
//     }
// });

router.post('/api/jobs/:jobId/request', verifyToken, async (req, res) => {
    try {
        const job = await Job.findById(req.params.jobId);
        if (!job) return res.status(404).json({ message: "Job not found" });

        // Check if the user is trying to apply to their own job
        if (job.poster.toString() === req.user.userId) {
            return res.status(400).json({ message: "You cannot apply to your own job post" });
        }

        // Check if the user has already requested this job
        const existingRequest = job.requests.find(req => req.user.toString() === req.user.userId);
        if (existingRequest) return res.status(400).json({ message: "You have already requested this job" });

        // If not the poster, allow them to request the job
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

        // Logging the requests array and the user making the request
        console.log('Job Requests:', job.requests);
        console.log('Authenticated User:', req.user.userId);

        // Find the request made by the user using 'equals' for ObjectId comparison
        const existingRequest = job.requests.find(request => request.user.equals(req.user.userId));
        
        if (!existingRequest) return res.status(400).json({ message: "You have not requested this job" });

        // Remove the request from the array
        job.requests = job.requests.filter(request => !request.user.equals(req.user.userId));
        await job.save();

        res.status(200).json({ message: "Job request canceled" });
    } catch (e) {
        console.error(e);  // Log any error to debug more easily
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

// Get Job Requests (Filter by status "requested")
router.get('/api/jobs/:jobId/requests', async (req, res) => {
    try {
        const job = await Job.findById(req.params.jobId).populate('requests.user', 'name');
        if (!job) {
            return res.status(404).json({ message: "Job not found" });
        }

        // Filter requests with status "requested"
        const requestedJobs = job.requests.filter(req => req.status === 'requested');

        res.status(200).json(requestedJobs);
    } catch (e) {
        res.status(500).json({ message: e.message });
    }
});

// Get Job Workers (Filter by status "working on")
router.get('/api/jobs/:jobId/workers', async (req, res) => {
    try {
        const job = await Job.findById(req.params.jobId).populate('workers.user', 'name');
        if (!job) {
            return res.status(404).json({ message: "Job not found" });
        }

        // Filter workers with status "working on"
        const workingWorkers = job.workers.filter(worker => worker.status === 'working on');

        res.status(200).json(workingWorkers);
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
// router.get('/api/user/jobs/status/:status', verifyToken, async (req, res) => {
//     try {
//         const jobs = await Job.find({
//             'requests.user': req.user.userId,
//             'requests.status': req.params.status
//         }).populate('poster', 'name');

//         res.status(200).json(jobs);
//     } catch (e) {
//         res.status(500).json({ message: e.message });
//     }
// });

// Get Jobs Based on Status (Rejected, Requested, Working On, etc.)
router.get('/api/user/jobs/status/:status', verifyToken, async (req, res) => {
    try {
        console.log('User ID:', req.user.userId);
        console.log('Status:', req.params.status);

        const jobs = await Job.find({
            requests: {
                $elemMatch: {
                    user: new mongoose.Types.ObjectId(req.user.userId), // Use 'new' with ObjectId
                    status: { $regex: new RegExp(`^${req.params.status}$`, 'i') } // Case-insensitive
                }
            }
        }).populate('poster', 'name'); // Populate the poster field with the name

        if (!jobs || jobs.length === 0) {
            return res.status(200).json([]); // Return an empty array if no jobs are found
        }

        res.status(200).json(jobs);
    } catch (e) {
        console.error('Error fetching jobs:', e.message);
        res.status(500).json({ message: e.message });
    }
});

router.get('/api/jobs/export', async (req, res) => {
    try {
        const jobs = await Job.find().populate('poster', 'name');

        // Prepare fields for the CSV
        const fields = ['title', 'wageRange', 'isCrypto', 'location', 'professions', 'categories', 'description', 'poster.name'];
        const json2csvParser = new Parser({ fields });
        const csv = json2csvParser.parse(jobs);

        // Set the content type and attachment header
        res.header('Content-Type', 'text/csv');
        res.attachment('jobs.csv');

        return res.status(200).send(csv);
    } catch (e) {
        res.status(500).json({ message: e.message });
    }
});

module.exports = router;
