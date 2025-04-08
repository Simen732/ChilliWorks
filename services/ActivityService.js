const Activity = require('../models/Activity');

class ActivityService {
  /**
   * Log a system activity
   */
  async logActivity(description, entityType, entityId, userId = null) {
    try {
      const activity = new Activity({
        action: description,
        category: entityType,
        user: userId,
        ticket: entityType === 'ticket' ? entityId : null,
        details: {
          entityId: entityId
        }
      });
      
      await activity.save();
      return activity;
    } catch (error) {
      console.error('Activity logging error:', error);
      throw error;
    }
  }
  
  /**
   * Get recent activities with populated references
   */
  async getRecentActivities(limit = 10) {
    try {
      const activities = await Activity.find()
        .sort({ createdAt: -1 })
        .limit(limit)
        .populate('user', 'name role')
        .populate('ticket', 'title status');
        
      return activities;
    } catch (error) {
      console.error('Error getting recent activities:', error);
      return [];
    }
  }
}

module.exports = new ActivityService();