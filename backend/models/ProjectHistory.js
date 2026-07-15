// backend/models/ProjectHistory.js

const { Schema, model, Types } = require('mongoose');

const projectHistorySchema = new Schema({
    
    projectId: { type: Types.ObjectId, ref: 'Project', required: true, index: true },
    userId:    { type: Types.ObjectId, ref: 'User', required: true },
    viewedAt:  { type: Date, default: Date.now },

    }
);

projectHistorySchema.index({ userId: 1, viewedAt: -1 })

module.exports = model('ProjectHistory', projectHistorySchema);