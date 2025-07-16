const Activity = require('../models/Activity');
const User = require('../models/User');

// Create a new activity record
const createActivity = async (req, res) => {
  try {
    const activity = new Activity({
      ...req.body,
      user: req.user._id // Assuming user is attached by auth middleware
    });

    await activity.save();
    res.status(201).json(activity);
  } catch (error) {
    console.error('Error creating activity:', error);
    res.status(500).json({ message: 'Error creating activity record' });
  }
};

// Get recent activities
const getRecentActivities = async (req, res) => {
  try {
    const limit = parseInt(req.query.limit) || 10;
    const activities = await Activity.find()
      .populate('user', 'name avatar')
      .sort({ timestamp: -1 })
      .limit(limit);

    res.json({
      activities: activities.map(activity => ({
        id: activity._id,
        type: activity.type,
        title: activity.title,
        description: activity.description,
        timestamp: activity.timestamp,
        link: activity.link,
        user: {
          name: activity.user?.name || 'Unknown',
          avatar: activity.user?.avatar || null
        },
        project: activity.project // Include project field
      }))
    });
  } catch (error) {
    console.error('Error fetching recent activities:', error);
    res.status(500).json({ message: 'Error fetching recent activities' });
  }
};

// Get activities for a specific entity
const getEntityActivities = async (req, res) => {
  try {
    const { entityType, entityId } = req.params;
    let activities;
    if (entityType === 'project') {
      // Fetch project activities and all task activities for this project
      activities = await Activity.find({
        $or: [
          { entityType: 'project', entityId },
          { entityType: 'task', project: entityId }
        ]
      })
        .populate('user', 'name avatar')
        .sort({ timestamp: -1 });
    } else {
      // Default: fetch activities for the given entity
      activities = await Activity.find({ entityType, entityId })
        .populate('user', 'name avatar')
        .sort({ timestamp: -1 });
    }
    res.json({ activities });
  } catch (error) {
    console.error('Error fetching entity activities:', error);
    res.status(500).json({ message: 'Error fetching entity activities' });
  }
};

module.exports = {
  createActivity,
  getRecentActivities,
  getEntityActivities
};