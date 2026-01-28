// backend/src/models/PresetProject.js
const mongoose = require("mongoose");

const presetTaskSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: true,
      trim: true,
    },

    description: {
      type: String,
      trim: true,
    },

    priority: {
      type: String,
      enum: ["low", "medium", "high"],
      default: "medium",
    },

    levelIndex: {
      type: Number,
      required: true,
    },

    order: {
      type: Number,
      default: 0,
    },
  },
  { _id: false }
);

const presetProjectSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
      unique: true,
    },

    description: {
      type: String,
      trim: true,
    },

    // Only department structure (no users here)
    levels: [
      {
        levelIndex: {
          type: Number,
          required: true,
        },
        department: {
          type: String,
          required: true,
          trim: true,
        },
      },
    ],

    tasks: [presetTaskSchema],

    isActive: {
      type: Boolean,
      default: true,
    },

    isDeleted: {
      type: Boolean,
      default: false,
    },

    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model("PresetProject", presetProjectSchema);