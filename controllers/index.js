const { ToDoController } = require("./taskmanager-controller.js");
const { UserController } = require("./user-controller.js");
const { reviewsController } = require("./reviews-controller.js");
const { instagramDataController } = require("./instagramData-controller.js");
const { getAdviceFromChatGPT } = require("./chatgpt-controller.js");

module.exports = {
	ToDoController,
	UserController,
	reviewsController,
	instagramDataController,
	getAdviceFromChatGPT,
};
