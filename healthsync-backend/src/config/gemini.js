const { GoogleGenerativeAI } = require("@google/generative-ai");

if (!process.env.GEMINI_API_KEY) {
  console.warn("GEMINI_API_KEY missing in .env");
}

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

//vision-enabled model
const model = genAI.getGenerativeModel({
  model: "gemini-2.5-flash",
});

module.exports = model;