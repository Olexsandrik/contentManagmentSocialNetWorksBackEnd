const OpenAI = require("openai").default;

const openai = new OpenAI({
  apiKey: process.env.OPEN_AI_KEY,
});

module.exports = openai;
