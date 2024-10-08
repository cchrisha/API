//api/models.job.models.js
const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const JobSchema = new Schema({
    title: { type: String, required: true },
    wageRange: { type: String, required: true },
    isCrypto: { type: Boolean, default: false },
    location: { type: String, required: true },
    datePosted: { type: Date, default: Date.now },
    description: { type: String, required: true }, //add description
    professions: [{ type: String, required: true }],
    categories: [{ type: String, required: true }],
    poster: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    requests: [
        {
            user: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
            status: { type: String, enum: ['requested', 'rejected', 'working on', 'done', 'canceled'], default: 'requested' }
        }
    ],
    workers: [
        {
            user: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
            status: { type: String, enum: ['working on', 'done', 'canceled'], default: 'working on' }
        }
    ]
});

const Job = mongoose.model('Job', JobSchema);
module.exports = Job;
