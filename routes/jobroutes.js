//api/routes/jobroutes.js
const express = require('express');
const router = express.Router();
const verifyToken = require('../middleware/auth');
const Job = require('../models/job.model.js');  // Make sure Job model is imported
const mongoose = require('mongoose');
const { Parser } = require('json2csv');
const User = require('../models/user.model.js');  // Adjust the path if necessary
const { Notification, TransactionNotification } = require('../models/notification.model');
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


router.get('/api/user/:userId/jobs/all', async (req, res) => {
    try {
        const userId = req.params.userId;
        
        // Fetch all jobs for the user
        const jobs = await Job.find({ poster: userId })
            .populate('poster', 'name')
            .sort({ datePosted: -1 });

        if (!jobs || jobs.length === 0) {
            return res.status(200).json({ current: [], completed: [], requested: [], rejected: [] });
        }

        // Group jobs by status
        const currentJobs = jobs.filter(job => job.workers.some(worker => worker.status === 'working on'));
        const completedJobs = jobs.filter(job => job.workers.some(worker => worker.status === 'done'));
        const requestedJobs = jobs.filter(job => job.requests.some(req => req.status === 'requested'));
        const rejectedJobs = jobs.filter(job => job.requests.some(req => req.status === 'rejected'));

        res.status(200).json({
            current: currentJobs,
            completed: completedJobs,
            requested: requestedJobs,
            rejected: rejectedJobs
        });
    } catch (e) {
        console.error(e.message);
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

//notif ni lana
// Post job request
router.post('/api/jobs/:jobId/request', verifyToken, async (req, res) => {
    try {
        const job = await Job.findById(req.params.jobId);
        if (!job) return res.status(404).json({ message: "Job not found" });

        // Prevent user from applying to their own job
        if (job.poster.toString() === req.user.userId) {
            return res.status(400).json({ message: "You cannot apply to your own job post" });
        }

        // Check if user has already applied
        const existingRequest = job.requests.find(req => req.user.toString() === req.user.userId);
        if (existingRequest) return res.status(400).json({ message: "You have already requested this job" });

        // Add the user's request to the job
        job.requests.push({ user: req.user.userId });
        await job.save();

        // Create a notification for the job poster
        const notification = new Notification({
            user: job.poster, // The job poster
            message: `${req.user.name} has applied to your job post: ${job.title}`, // Custom message
            job: job._id
        });
        await notification.save(); // Save notification

        res.status(200).json({ message: "Job request submitted" });
    } catch (e) {
        res.status(500).json({ message: e.message });
    }
});

//di nagamit
// Post a notification
router.post('/api/notifications', verifyToken, async (req, res) => {
/**
 * Posts a new notification to the database.
 *
 * @function
 * @param {object} req - The request object containing the notification data.
 * @param {object} res - The response object to send back to the client.
 * @param {string} req.body.user - The ID of the user to receive the notification.
 * @param {string} req.body.message - The content of the notification.
 * @param {string} req.body.job - The ID of the associated job.
 * @returns {object} - A JSON object containing a success message or an error message.
 */
router.post('/api/notifications', verifyToken, async (req, res) => {
    try {
        const { user, message, job } = req.body;

        // Validate the request body
        if (!user || !message || !job) {
            return res.status(400).json({ message: "Missing required fields." });
        }

        const notification = new Notification({
            user, // The user ID of the notification recipient
            message,
            job, // The associated job ID
        });
        await notification.save(); // Save notification

        res.status(201).json({ message: "Notification created successfully." });
    } catch (e) {
        res.status(500).json({ message: e.message });
    }
});
    try {
        const { user, message, job } = req.body;

        // Validate the request body
        if (!user || !message || !job) {
            return res.status(400).json({ message: "Missing required fields." });
        }

        const notification = new Notification({
            user, // The user ID of the notification recipient
            message,
            job, // The associated job ID
        });
        await notification.save(); // Save notification

        res.status(201).json({ message: "Notification created successfully." });
    } catch (e) {
        res.status(500).json({ message: e.message });
    }
});

// Fetch notifications for the authenticated user
router.get('/api/notifications', verifyToken, async (req, res) => {
    try {
        // Fetch all notifications for the logged-in user, sort by most recent
        const notifications = await Notification.find({ user: req.user.userId })
            .sort({ createdAt: -1 });

        res.status(200).json(notifications);
    } catch (e) {
        res.status(500).json({ message: e.message });
    }
});

// Mark a notification as read 
router.put('/api/notifications/:notificationId/read', verifyToken, async (req, res) => {
    try {
        const notification = await Notification.findById(req.params.notificationId);

        if (!notification || notification.user.toString() !== req.user.userId) {
            return res.status(404).json({ message: "Notification not found" });
        }

        notification.isRead = true;
        await notification.save();

        res.status(200).json({ message: "Notification marked as read" });
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

// Get Jobs Posted by User (Sorted by Latest)
router.get('/api/user/:userId/jobs', async (req, res) => {
    try {
        const jobs = await Job.find({ poster: req.params.userId })
            .populate('poster', 'name')
            .sort({ datePosted: -1 }); // Sort jobs by creation date, descending
        
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
        const requestIndex = job.requests.findIndex(r => r.user.toString() === req.params.userId);

        if (requestIndex === -1) return res.status(404).json({ message: "Request not found" });

        const request = job.requests[requestIndex];

        if (action === 'accept') {
            // Add user to workers and remove from requests
            job.workers.push({ user: request.user, status: 'working on' });
            job.requests.splice(requestIndex, 1); // Remove the request from the array
            
            // Update user's job list (assuming User model is imported)
            const user = await User.findById(request.user); // Replace with your User model
            if (!user.jobs) {
                user.jobs = []; // Initialize jobs array if it doesn't exist
            }
            user.jobs.push({ job: job._id, status: 'working on' });
            await user.save();
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
        const workerIndex = job.workers.findIndex(w => w.user.toString() === req.params.userId);

        if (workerIndex === -1) return res.status(404).json({ message: "Worker not found" });

        if (action === 'done' || action === 'canceled') {
            // Update status instead of removing the worker
            job.workers[workerIndex].status = action;
        } else {
            job.workers[workerIndex].status = action; // This covers other status updates
        }

        await job.save();

        res.status(200).json(job);
    } catch (e) {
        res.status(500).json({ message: e.message });
    }
});


// Get Jobs Based on Status (Sorted by Latest)
router.get('/api/user/jobs/status/:status', verifyToken, async (req, res) => {
    try {
        console.log('User ID:', req.user.userId);
        console.log('Status:', req.params.status);

        let jobs = [];

        // Check if status is 'requested', search the requests array
        if (req.params.status.toLowerCase() === 'requested') {
            jobs = await Job.find({
                requests: {
                    $elemMatch: {
                        user: req.user.userId,
                        status: { $regex: new RegExp(`^${req.params.status}$`, 'i') } // Case-insensitive
                    }
                }
            })
            .populate('poster', 'name')
            .sort({ datePosted: -1 });
        } else {
            // For 'working on', 'done', or other statuses, search in the workers array
            jobs = await Job.find({
                workers: {
                    $elemMatch: {
                        user: req.user.userId,
                        status: { $regex: new RegExp(`^${req.params.status}$`, 'i') } // Case-insensitive match
                    }
                }
            })
            .populate('poster', 'name')
            .sort({ datePosted: -1 });
        }

        if (!jobs || jobs.length === 0) {
            return res.status(200).json([]); // Return an empty array if no jobs are found
        }

        res.status(200).json(jobs);
    } catch (e) {
        console.error('Error fetching jobs:', e.message);
        res.status(500).json({ message: e.message });
    }
});

router.get('/api/jobs/search', async (req, res) => {
    try {
        const { query } = req.query;

        // Define the search criteria
        const searchCriteria = {
            $or: [
                { title: { $regex: query, $options: 'i' } },  // Search by job title
                { location: { $regex: query, $options: 'i' } },  // Search by location
                { professions: { $regex: query, $options: 'i' } },  // Search by profession
            ]
        };

        // Fetch jobs matching the search criteria
        const jobs = await Job.find(searchCriteria)
            .sort({ datePosted: -1 })  // Sort by latest jobs
            .populate('poster', 'name');

        // If no jobs found, return an empty array
        if (!jobs || jobs.length === 0) {
            return res.status(200).json([]);
        }

        // Return the matching jobs
        res.status(200).json(jobs);
    } catch (e) {
        res.status(500).json({ message: e.message });
    }
});

router.get('/api/jobs/export', async (req, res) => {
    try {
        // Fetch jobs and populate poster field
        const jobs = await Job.find().populate('poster', 'name');

        // Check if jobs are retrieved successfully
        if (!jobs || jobs.length === 0) {
            return res.status(404).json({ message: 'No jobs found.' });
        }

        // Define the fields for the CSV
        const fields = ['title', 'wageRange', 'isCrypto', 'location', 'professions', 'categories', 'description', 'poster.name'];
        const json2csvParser = new Parser({ fields });
        const csv = json2csvParser.parse(jobs);

        // Set CSV headers and attachment for download
        res.header('Content-Type', 'text/csv');
        res.attachment('jobs.csv');

        // Send CSV content
        return res.status(200).send(csv);
    } catch (e) {
        // Log error to the console and send error response
        console.error('Error exporting jobs to CSV:', e);
        return res.status(500).json({ message: 'Server error while generating CSV.', error: e.message });
    }
});   
//kunin muna user id 
// Get user by wallet address
router.get('/users/wallet/:walletAddress', async (req, res) => {
    const { walletAddress } = req.params;

    try {
        const user = await User.findOne({ walletAddress: walletAddress });

        if (!user) {
            return res.status(404).json({ error: 'User not found' });
        }

        res.status(200).json({ userId: user._id });
    } catch (error) {
        res.status(400).json({ error: error.message });
    }
});

// //MARVIN ITO
// router.post('/transaction-notifications', async (req, res) => {
//     const { walletAddress, message } = req.body; // Changed user to walletAddress

//     try {
//         const notification = new TransactionNotification({
//             walletAddress, // Use walletAddress instead of user
//             message,
//         });

//         await notification.save();
//         res.status(201).json(notification);
//     } catch (error) {
//         res.status(400).json({ error: error.message });
//     }
// });

// router.get('/transaction-notifications/:walletAddress', async (req, res) => {
//     const { walletAddress } = req.params; // Changed userId to walletAddress

//     try {
//         const notifications = await TransactionNotification.find({ walletAddress }).sort({ createdAt: -1 });
//         res.status(200).json(notifications);
//     } catch (error) {
//         res.status(400).json({ error: error.message });
//     }
// });

// router.patch('/transaction-notifications/:id/read', async (req, res) => {
//     const { id } = req.params;

//     try {
//         const notification = await TransactionNotification.findByIdAndUpdate(
//             id,
//             { isRead: true },
//             { new: true }
//         );

//         if (!notification) {
//             return res.status(404).json({ error: 'Notification not found' });
//         }

//         res.status(200).json(notification);
//     } catch (error) {
//         res.status(400).json({ error: error.message });
//     }
// });

//lana
router.post('/transaction-notifications', async (req, res) => {
    const { user, message } = req.body; // Removed transactionHash from here

    try {
        const notification = new TransactionNotification({
            user,
            message,
            // No need to include transactionHash
        });

        await notification.save();
        res.status(201).json(notification);
    } catch (error) {
        res.status(400).json({ error: error.message });
    }
});


// Get all transaction notifications for a user
router.get('/transaction-notifications/:userId', async (req, res) => {
    const { userId } = req.params;

    try {
        const notifications = await TransactionNotification.find({ user: userId }).sort({ createdAt: -1 });
        res.status(200).json(notifications);
    } catch (error) {
        res.status(400).json({ error: error.message });
    }
});

// Mark a notification as read
router.patch('/transaction-notifications/:id/read', async (req, res) => {
    const { id } = req.params;

    try {
        const notification = await TransactionNotification.findByIdAndUpdate(
            id,
            { isRead: true },
            { new: true }
        );

        if (!notification) {
            return res.status(404).json({ error: 'Notification not found' });
        }

        res.status(200).json(notification);
    } catch (error) {
        res.status(400).json({ error: error.message });
    }
});


module.exports = router;
