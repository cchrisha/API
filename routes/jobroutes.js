//api/routes/jobroutes.js
const express = require('express');
const router = express.Router();
const verifyToken = require('../middleware/auth');
const Job = require('../models/job.model.js');  // Make sure Job model is imported
const mongoose = require('mongoose');
const { Parser } = require('json2csv');
const User = require('../models/user.model.js');  // Adjust the path if necessary
const { Notification, TransactionNotification, VerificationNotification } = require('../models/notification.model');
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

//try verify --chrisha(huwag po burahin)
// router.post('/api/jobs', verifyToken, async (req, res) => {
//     try {

//         const user = await User.findById(req.user.userId);
//         if (!user) {
//             return res.status(404).json({ message: "User not found" });
//         }

//         if (user.isVerify === 0) {
//             return res.status(400).json({ message: "You must be verified to post a job" });
//         }
//         const { title, wageRange, isCrypto, location, professions, categories, description } = req.body;

//         // Create the job
//         const job = await Job.create({
//             title,
//             wageRange,
//             isCrypto,
//             location,
//             professions,
//             categories,
//             description,
//             poster: req.user.userId
//         });

//         console.log("Job created successfully:", job); // Log the created job
//         res.status(201).json(job);
//     } catch (e) {
//         console.error("Error creating job:", e); // Log the error
//         res.status(500).json({ message: e.message });
//     }
// });


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
        // if (job.poster.toString() !== req.user.userId) {
        //     return res.status(403).json({ message: "You are not authorized to delete this job" });
        // }

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

        const profession = req.user.profession ? req.user.profession : ''; // Get user profession without lowercasing
        console.log('User Profession:', profession); // Debugging log

        const jobs = await Job.find({ 
            professions: { $elemMatch: { $regex: new RegExp(`^${profession}$`, 'i') } } // Case-insensitive match
        })
            .sort({ datePosted: -1 }) // Sort from latest to oldest
            .limit(10)
            .populate('poster', 'name');
        
        res.status(200).json(jobs);
    } catch (e) {
        res.status(500).json({ message: e.message });
    }
});

// router.get('/api/jobs/profession', verifyToken, async (req, res) => {
//     try {
//         console.log(req.user); // Print user profession

//         const profession = req.user.profession ? req.user.profession.toLowerCase() : ''; // Ensure profession is in lowercase
//         console.log('User Profession:', profession); // Debugging log

//         const jobs = await Job.find({ 
//             professions: { $elemMatch: { $eq: profession } } // Exact match on profession
//         })
//             .sort({ datePosted: -1 }) // Sort from latest to oldest
//             .limit(10)
//             .populate('poster', 'name');
//         res.status(200).json(jobs);
//     } catch (e) {
//         res.status(500).json({ message: e.message });
//     }
// });

// Get Most Recent Jobs (Limit 10)
router.get('/api/jobs/recent', async (req, res) => {
    try {
        const jobs = await Job.find({})
            .sort({ datePosted: -1 }) // Sort from latest to oldest
            .limit(10)
            .populate('poster', 'name');
        
        res.status(200).json(jobs);
    } catch (e) {
        res.status(500).json({ message: e.message });
    }
});

// Get Most Recent Jobs (Posted in the Last Week)
// router.get('/api/jobs/recent', async (req, res) => {
//     try {
//         const oneWeekAgo = new Date();
//         oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);
//         const jobs = await Job.find({ datePosted: { $gte: oneWeekAgo } })
//             .sort({ datePosted: -1 }) // Sort from latest to oldest
//             .limit(10)
//             .populate('poster', 'name');
//         res.status(200).json(jobs);
//     } catch (e) {
//         res.status(500).json({ message: e.message });
//     }
// });

//get user jobs all
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
// // Post job request
// router.post('/api/jobs/:jobId/request', verifyToken, async (req, res) => {
//     try {
//         const job = await Job.findById(req.params.jobId);
//         if (!job) return res.status(404).json({ message: "Job not found" });

//         // Prevent user from applying to their own job
//         if (job.poster.toString() === req.user.userId) {
//             return res.status(400).json({ message: "You cannot apply to your own job post" });
//         }

//         // Check if user has already applied
//         const existingRequest = job.requests.find(req => req.user.toString() === req.user.userId);
//         if (existingRequest) return res.status(400).json({ message: "You have already requested this job" });

//         // Add the user's request to the job
//         job.requests.push({ user: req.user.userId });
//         await job.save();

//         // Create a notification for the job poster
//         const notification = new Notification({
//             user: job.poster, // The job poster
//             message: `${req.user.name} has applied to your job post: ${job.title}`, // Custom message
//             job: job._id
//         });
//         await notification.save(); // Save notification

//         res.status(200).json({ message: "Job request submitted" });
//     } catch (e) {
//         res.status(500).json({ message: e.message });
//     }
// });

// Post job request Legit
router.post('/api/jobs/:jobId/request', verifyToken, async (req, res) => {
    try {
        const job = await Job.findById(req.params.jobId);
        if (!job) return res.status(404).json({ message: "Job not found" });

        // Prevent user from applying to their own job
        if (job.poster.toString() === req.user.userId) {
            return res.status(400).json({ message: "You cannot apply to your own job post" });
        }

        // Check if user has already applied
        const alreadyApplied = job.requests.some(req => req.user.toString() === req.user.userId);
        if (alreadyApplied) {
            return res.status(400).json({ message: "You have already requested this job" });
        }

        // Add the user's request to the job
        job.requests.push({ user: req.user.userId, status: 'requested' });
        await job.save();

        // Create a notification for the job poster
        const notification = new Notification({
            user: job.poster,
            message: `${req.user.name} has applied to your job post: ${job.title}`,
            job: job._id
        });
        await notification.save();

        res.status(200).json({ message: "Job request submitted" });
    } catch (e) {
        res.status(500).json({ message: e.message });
    }
});

// router.post('/api/jobs/:jobId/request', verifyToken, async (req, res) => {
//     try {
//         const job = await Job.findById(req.params.jobId);
//         if (!job) return res.status(404).json({ message: "Job not found" });

//         // Prevent user from applying to their own job
//         if (job.poster.toString() === req.user.userId) {
//             return res.status(400).json({ message: "You cannot apply to your own job post" });
//         }

//         // Check if user has already applied
//         const existingRequest = job.requests.find(req => req.user.toString() === req.user.userId);
//         if (existingRequest) return res.status(400).json({ message: "You have already requested this job" });

//         // Add the user's request to the job
//         job.requests.push({ user: req.user.userId, status: 'requested' });
//         await job.save();

//         // Create a notification for the job poster
//         const notification = new Notification({
//             user: job.poster, // The job poster
//             message: `${req.user.name} has applied to your job post: ${job.title}`, // Custom message
//             job: job._id
//         });
//         await notification.save(); // Save notification

//         res.status(200).json({ message: "Job request submitted" });
//     } catch (e) {
//         res.status(500).json({ message: e.message });
//     }
// });


//tryy uli verify --chrisha(huwag po burahin)
// router.post('/api/jobs/:jobId/request', verifyToken, async (req, res) => {
//     try {
//         const job = await Job.findById(req.params.jobId);
//         if (!job) return res.status(404).json({ message: "Job not found" });

//         // Check if the user is verified (isVerify should not be 0)
//         if (req.user.isVerify === 0) {
//             return res.status(403).json({ message: "You must be verified to apply for this job" });
//         }

//         // Prevent user from applying to their own job
//         if (job.poster.toString() === req.user.userId) {
//             return res.status(400).json({ message: "You cannot apply to your own job post" });
//         }

//         // Check if the user has already applied
//         const existingRequest = job.requests.find(request => request.user.toString() === req.user.userId);
//         if (existingRequest) return res.status(400).json({ message: "You have already requested this job" });

//         // Add the user's request to the job
//         job.requests.push({ user: req.user.userId, status: 'requested' });
//         await job.save();

//         // Create a notification for the job poster
//         const notification = new Notification({
//             user: job.poster, // The job poster
//             message: `${req.user.name} has applied to your job post: ${job.title}`, // Custom message
//             job: job._id
//         });
//         await notification.save(); // Save notification

//         res.status(200).json({ message: "Job request submitted" });
//     } catch (e) {
//         res.status(500).json({ message: e.message });
//     }
// });


//di nagamit
// Post a notification
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

// Fetch notifications for the authenticated user
router.get('/api/notifications', verifyToken, async (req, res) => {
    try {
        // Fetch the logged-in user from the database
        const user = await User.findById(req.user.userId);
        if (!user) {
            return res.status(404).json({ message: "User not found" });
        }

        // Fetch all notifications where the logged-in user is the recipient
        const notifications = await Notification.find({ user: user._id }) // Change to fetch notifications for this user
            .sort({ createdAt: -1 }); // Sort notifications by creation date in descending order

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

// Mark a notification as read
router.put('/api/notifications/:notificationId/read', verifyToken, async (req, res) => {
    try {
        // Find the notification by ID
        const notification = await Notification.findById(req.params.notificationId);

        // Check if the notification exists and if the logged-in user is the recipient
        if (!notification || notification.user.toString() !== req.user.userId) {
            return res.status(404).json({ message: "Notification not found or you don't have permission to mark it as read" });
        }

        // Mark the notification as read
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
        const job = await Job.findById(req.params.jobId).populate('poster', 'name'); // Get poster name
        const requestIndex = job.requests.findIndex(r => r.user.toString() === req.params.userId);

        if (requestIndex === -1) return res.status(404).json({ message: "Request not found" });

        const request = job.requests[requestIndex];

        if (action === 'accept') {
            // Add user to workers and remove from requests
            job.workers.push({ user: request.user, status: 'working on' });
            job.requests.splice(requestIndex, 1); // Remove the request from the array
            
            // Update user's job list
            const user = await User.findById(request.user);
            if (!user.jobs) {
                user.jobs = []; // Initialize jobs array if it doesn't exist
            }
            user.jobs.push({ job: job._id, status: 'working on' });
            await user.save();

            // Create notification for the applicant
            const notification = new Notification({
                user: request.user, // The applicant
                message: `Job poster ${job.poster.name} accepted your application for the job: ${job.title}`,
                job: job._id
            });
            await notification.save();
        } else if (action === 'reject') {
            request.status = 'rejected';
            
            // Create notification for the applicant
            const notification = new Notification({
                user: request.user, // The applicant
                message: `Job poster ${job.poster.name} rejected your application for the job: ${job.title}`,
                job: job._id
            });
            await notification.save();
        }
        
        await job.save();
        res.status(200).json(job);
    } catch (e) {
        res.status(500).json({ message: e.message });
    }
});

// Update Applicant Status (Accept or Reject)
// router.put('/api/jobs/:jobId/request/:userId', verifyToken, async (req, res) => {
//     try {
//         const { action } = req.body; // 'accepted' or 'rejected'
//         const job = await Job.findById(req.params.jobId).populate('poster', 'name');
//         if (!job) return res.status(404).json({ message: 'Job not found' });

//         // Ensure only the latest status for this applicant by filtering out any existing entries for the user
//         job.requests = job.requests.filter(request => request.user.toString() !== req.params.userId);

//         // Add the new status if accepting the applicant
//         if (action === 'accepted') {
//             job.workers.push({ user: req.params.userId, status: 'working on' });
//         } else if (action === 'rejected') {
//             job.requests.push({ user: req.params.userId, status: 'rejected' });
//         }

//         // Create notification for the applicant
//         const notification = new Notification({
//             user: req.params.userId,
//             message: `Your application status for job "${job.title}" was updated to "${action}" by ${job.poster.name}.`,
//             job: job._id
//         });
//         await notification.save();

//         await job.save();
//         res.status(200).json(job);
//     } catch (e) {
//         res.status(500).json({ message: e.message });
//     }
// });

// Update Worker Status (Mark as Done or Cancelled)
router.put('/api/jobs/:jobId/workers/:userId', verifyToken, async (req, res) => {
    try {
        const { action } = req.body; // 'done' or 'canceled'
        const job = await Job.findById(req.params.jobId).populate('poster', 'name'); // Get poster name
        const workerIndex = job.workers.findIndex(w => w.user.toString() === req.params.userId);

        if (workerIndex === -1) return res.status(404).json({ message: "Worker not found" });

        if (action === 'done' || action === 'canceled') {
            // Update worker status
            job.workers[workerIndex].status = action;

            // Create notification for the worker
            const notification = new Notification({
                user: job.workers[workerIndex].user, // The worker
                message: `Job poster ${job.poster.name} has marked you "${action}" for the job: ${job.title}`,
                job: job._id
            });
            await notification.save();
        }

        await job.save();
        res.status(200).json(job);
    } catch (e) {
        res.status(500).json({ message: e.message });
    }
});

// Update Worker Status (Mark as Done or Cancelled)
// router.put('/api/jobs/:jobId/workers/:userId', verifyToken, async (req, res) => {
//     try {
//         const { action } = req.body; // 'done' or 'canceled'
//         const job = await Job.findById(req.params.jobId).populate('poster', 'name');
//         if (!job) return res.status(404).json({ message: 'Job not found' });

//         // Ensure only the latest status for this worker by filtering out any existing entries for the user
//         job.workers = job.workers.filter(worker => worker.user.toString() !== req.params.userId);

//         if (action === 'done' || action === 'canceled') {
//             // Update worker status
//             job.workers.push({ user: req.params.userId, status: action });

//             // Create notification for the worker
//             const notification = new Notification({
//                 user: req.params.userId,
//                 message: `Job poster ${job.poster.name} has marked you "${action}" for the job: ${job.title}`,
//                 job: job._id
//             });
//             await notification.save();
//         }

//         await job.save();
//         res.status(200).json(job);
//     } catch (e) {
//         res.status(500).json({ message: e.message });
//     }
// });

// Get Jobs Based on Status (Sorted by Latest)
router.get('/api/user/jobs/status/:status', verifyToken, async (req, res) => {
    try {
        console.log('User ID:', req.user.userId);
        console.log('Status:', req.params.status);

        let jobs = [];
        const status = req.params.status.toLowerCase();

        if (status === 'requested' || status === 'rejected') {
            // Search in the requests array for 'requested' or 'rejected' statuses
            jobs = await Job.find({
                requests: {
                    $elemMatch: {
                        user: req.user.userId,
                        status: status // Direct match without regex
                    }
                }
            })
            .populate('poster', 'name')
            .sort({ datePosted: -1 });
        } else if (status === 'working on' || status === 'done' || status === 'canceled') {
            // Search in the workers array for 'working on', 'done', or 'canceled' statuses
            jobs = await Job.find({
                workers: {
                    $elemMatch: {
                        user: req.user.userId,
                        status: status // Direct match without regex
                    }
                }
            })
            .populate('poster', 'name')
            .sort({ datePosted: -1 });
        } else {
            return res.status(400).json({ message: 'Invalid status parameter' });
        }

        res.status(200).json(jobs.length ? jobs : []); // Return jobs or an empty array if none are found
    } catch (e) {
        console.error('Error fetching jobs:', e.message);
        res.status(500).json({ message: e.message });
    }
});

// Get Jobs Based on Status (Sorted by Latest)
// router.get('/api/user/jobs/status/:status', verifyToken, async (req, res) => {
//     try {
//         const status = req.params.status.toLowerCase();
//         let jobs = [];

//         if (['requested', 'rejected'].includes(status)) {
//             jobs = await Job.find({
//                 requests: {
//                     $elemMatch: { user: req.user.userId, status }
//                 }
//             })
//             .populate('poster', 'name')
//             .sort({ datePosted: -1 });
//         } else if (['working on', 'done', 'canceled'].includes(status)) {
//             jobs = await Job.find({
//                 workers: {
//                     $elemMatch: { user: req.user.userId, status }
//                 }
//             })
//             .populate('poster', 'name')
//             .sort({ datePosted: -1 });
//         } else {
//             return res.status(400).json({ message: 'Invalid status parameter' });
//         }

//         res.status(200).json(jobs);
//     } catch (e) {
//         res.status(500).json({ message: e.message });
//     }
// });

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








//Chrisha
// Fetch notifications for the admin
router.get('/api/verification/notifications', verifyToken, async (req, res) => {
    try {
    // Check if the logged-in user is an admin
    const user = await User.findById(req.user.userId);
    if (!user || user.isAdmin !== 1) {
        return res.status(403).json({ message: "Access denied" });
    }

    // Fetch all verification notifications for the admin
    const notifications = await VerificationNotification.find({ user: user._id })
        // .populate('requestedBy', 'name email contact location')    
        .sort({ createdAt: -1 });

    res.status(200).json(notifications);
    } catch (e) {
        res.status(500).json({ message: e.message });
    }
});

// Mark a verification notification as read by the admin
router.put('/api/verification/notifications/:notificationId/read', verifyToken, async (req, res) => {
    try {
    // Find the notification by ID and ensure the admin owns it
    const notification = await VerificationNotification.findById(req.params.notificationId);
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
    
// Verify user in admin
router.patch('/api/user/:userId/verify', verifyToken, async (req, res) => {
    try {
        // Fetch the requesting user from the database
        const requester = await User.findById(req.user.userId);

        // Check if the requesting user is an admin
        if (!requester || requester.isAdmin !== 1) {
            return res.status(403).json({ message: "Access denied. You do not have permission to perform this action." });
        }

        // Fetch the user to be verified
        const user = await User.findById(req.params.userId);
        if (!user) return res.status(404).json({ message: "User not found" });

        // Update verification status
        user.isVerify = req.body.isVerify ? 1 : 0; // 1 for verified, 0 for unverified
        await user.save();

        // Create a notification for the user
        const notification = new VerificationNotification({
            user: user._id, // The user being verified
            requestedBy: requester._id, // The admin who requested the verification
            message: `Your verification status has been approved. Account ${user.isVerify ? 'verified' : 'unverified'}.`,
            isRead: false, // New notification, marked as unread
        });
        await notification.save(); // Save the notification

        res.status(200).json({ message: `User verification status updated to ${user.isVerify ? 'verified' : 'unverified'}` });
    } catch (e) {
        res.status(500).json({ message: e.message });
    }
});

// Post a verification request to the admin
router.post('/api/verification/request', verifyToken, async (req, res) => {
    try {
    // Fetch the user
    const user = await User.findById(req.user.userId);
    if (!user) {
        return res.status(404).json({ message: "User not found" });
    }

    // Debug: Check the value of user.isVerified
    console.log(`User verification status: ${user.isVerified}`);

    // Ensure that isVerified field is Boolean and check if the user is already verified
    if (user.isVerify === 1) {
        return res.status(400).json({ message: "User is already verified" });
    }

    // Fetch the admin
    const admin = await User.findOne({ isAdmin: 1 });
    if (!admin) {
        return res.status(404).json({ message: "Admin not found" });
    }

    // Check if the user has already sent a verification request
    const existingRequest = await VerificationNotification.findOne({
        requestedBy: req.user.userId,
        message: "Verification request pending"
    });
    if (existingRequest) {
        return res.status(400).json({ message: "Verification request already submitted" });
    }

    // Create a new verification notification for the admin
    const notification = new VerificationNotification({
        user: admin._id, // Set the admin as the recipient
        message: `${req.user.name} has requested verification.`,
        requestedBy: req.user.userId,
        isRead: false, // Mark as unread by default
    });
    await notification.save(); // Save the notification

    res.status(200).json({ message: "Verification request submitted to admin" });
    } catch (e) {
        console.error("Error submitting verification request:", e);
        res.status(500).json({ message: e.message });
    }
});

// Fetch notifications for a user
router.get('/api/user/notifications', verifyToken, async (req, res) => {
    try {
        // Fetch the logged-in user from the database
        const user = await User.findById(req.user.userId);
        if (!user) {
            return res.status(404).json({ message: "User not found" });
        }

        // Fetch all verification notifications where the logged-in user is the recipient
        const notifications = await VerificationNotification.find({ user: user._id }) // Fetch notifications for this user
            .sort({ createdAt: -1 }); // Sort notifications by creation date in descending order

        res.status(200).json(notifications);
    } catch (e) {
        res.status(500).json({ message: e.message });
    }
});

// Mark a verification notification as read by the user
router.put('/api/user/notifications/:notificationId/read', verifyToken, async (req, res) => {
    try {
        // Find the notification by ID
        const notification = await VerificationNotification.findById(req.params.notificationId);
        
        // Check if the notification exists and if the logged-in user is the recipient
        if (!notification || notification.user.toString() !== req.user.userId) {
            return res.status(404).json({ message: "Notification not found or you don't have permission to mark it as read" });
        }

        // Mark the notification as read
        notification.isRead = true;
        await notification.save();

        res.status(200).json({ message: "Notification marked as read" });
    } catch (e) {
        res.status(500).json({ message: e.message });
    }
});
    