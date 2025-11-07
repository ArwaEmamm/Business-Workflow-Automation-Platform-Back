// Simple settings controller — returns feature flags read from environment

exports.getSettings = (req, res) => {
  try {
    const enableClaudeSonnet = (process.env.ENABLE_CLAUDE_SONNET || 'false').toLowerCase() === 'true';

    res.json({
      success: true,
      settings: {
        enableClaudeSonnet
      }
    });
  } catch (error) {
    console.error('Error fetching settings:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};
