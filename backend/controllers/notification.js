const Notification = require("../models/notification");

exports.getNotification = async (req, res) => {
  try {
    const userId = req.user.id;

    const notifications = await Notification.find({ user: userId }).sort({
      created_at: -1,
    });

    res.status(200).json({
      success: true,
      data: notifications,
    });
  } catch (error) {
    res
      .status(500)
      .json({ message: "Error fetching library", error: error.message });
  }
};

exports.deleteNotification = async (req, res) => {
  try {
    await Notification.findByIdAndDelete(req.params.id);
    res.status(200).json({ message: "Notification deleted successfully" });
  } catch (error) {
    res.status(500).json({ message: "Error deleting Notification" });
  }
};

exports.updateNotification = async (req, res) => {
  try {
    console.log(
      req.params.read,
      "Updating notification",
      req.params.id,
      req.user.id
    );
    let updatedNotification = {};

    if (req.params.read === "all") {
      updatedNotification = await Notification.updateMany(
        { user: req.user.id },
        { $set: { read: true } }
      );
    } else if (req.params.read === "single") {
      updatedNotification = await Notification.findByIdAndUpdate(
        req.params.id,
        {
          read: true,
        },
        { new: true }
      );
    }

    res.status(200).json(updatedNotification);
  } catch (error) {
    console.error("Error updating notification:", error);
    res.status(500).json({ message: "Error updating book" });
  }
};
