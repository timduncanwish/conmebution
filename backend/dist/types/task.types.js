"use strict";
/**
 * Task System Type Definitions
 * Defines types and interfaces for Bull queue task management
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.TaskType = exports.TaskStatus = void 0;
/**
 * Task status enum
 */
var TaskStatus;
(function (TaskStatus) {
    TaskStatus["PENDING"] = "pending";
    TaskStatus["PROCESSING"] = "processing";
    TaskStatus["COMPLETED"] = "completed";
    TaskStatus["FAILED"] = "failed";
})(TaskStatus || (exports.TaskStatus = TaskStatus = {}));
/**
 * Task type enum
 */
var TaskType;
(function (TaskType) {
    TaskType["GENERATE_TEXT"] = "generate-text";
    TaskType["GENERATE_IMAGE"] = "generate-image";
    TaskType["GENERATE_VIDEO"] = "generate-video";
    TaskType["GENERATE_ALL"] = "generate-all";
    TaskType["YOUTUBE_UPLOAD"] = "youtube-upload";
})(TaskType || (exports.TaskType = TaskType = {}));
