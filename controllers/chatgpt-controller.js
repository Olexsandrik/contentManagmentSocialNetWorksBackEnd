const { prisma } = require("../prisma/prisma-client");
const openai = require("../libs/openia");

const getAdviceFromChatGPT = {
  adviceChatGpt: async (req, res) => {
    try {
      const { userId, customPrompt } = req.body;

      const userIdInt = isNaN(Number(userId)) ? null : Number(userId);

      if (userIdInt === null) {
        return res.status(400).json({ error: "Невірний формат userId" });
      }
      const posts = await prisma.socialMediaPost.findMany({
        where: {
          userId: userIdInt,
        },
        include: {
          comments: true,
        },
      });
      if (!posts.length) {
        return res
          .status(404)
          .json({ error: "Користувач не має постів та коментарів" });
      }
      const content = posts.map((post, index) => {
        const comments =
          post.comments.length > 0
            ? post.comments.map((c) => `  - ${c.username}: ${c.text}`).join("\n")
            : "No comments";

        return `
POST #${index + 1}:
Caption: ${post.caption || "No caption"}
Platform: ${post.platform}
Media Type: ${post.mediaType}
Media URL: ${post.mediaUrl}
Engagement: ${post.likeCount} likes, ${post.commentsCount} comments
Posted: ${post.timestamp}
Comments:
${comments}
---`;
      });

      const basePrompt = `
You are analyzing social media content performance for a Ukrainian user. Here is their content data:

${content.join("\n")}

ANALYSIS REQUIREMENTS:
1. Analyze engagement patterns (likes, comments, content types)
2. Identify top-performing content characteristics
3. Provide specific improvement recommendations
4. Suggest optimal posting strategies
5. Analyze audience interaction from comments
6. Recommend content themes and formats
7. Provide hashtag and caption optimization tips

IMPORTANT: 
- Respond ONLY in Ukrainian language
- Be specific and actionable in recommendations
- Focus on Instagram best practices
- Consider current social media trends
- Provide measurable goals where possible
`;

      const prompt = customPrompt
        ? `${basePrompt}\n\nADDITIONAL USER REQUEST: ${customPrompt}\n\nPlease address this specific request while maintaining the comprehensive analysis above. Respond in Ukrainian.`
        : basePrompt;

      const response = await openai.chat.completions.create({
        model: "gpt-3.5-turbo",
        messages: [
          {
            role: "system",
            content: `You are an expert social media analyst and Instagram marketing strategist with 10+ years of experience. You specialize in:
- Content performance analysis
- Audience engagement optimization
- Instagram algorithm understanding
- Social media growth strategies
- Data-driven marketing recommendations

You analyze user data comprehensively and provide actionable insights. Always respond in fluent Ukrainian language with professional marketing terminology. Focus on measurable improvements and current Instagram best practices.`,
          },
          { role: "user", content: prompt },
        ],
        temperature: 0.7,
      });

      const result = response.choices[0].message.content;

      await prisma.analyticsAI.create({
        data: {
          userId: userIdInt,
          dataType: "social_media_analysis",
          prompt: basePrompt,
          customPrompt: customPrompt || "Standard analysis",
          inputData: {
            totalPosts: posts.length,
            totalEngagement: posts.reduce((sum, post) => sum + post.likeCount + post.commentsCount, 0),
            contentTypes: [...new Set(posts.map(post => post.mediaType))],
            analysisDate: new Date().toISOString(),
            posts: posts.map(post => ({
              id: post.id,
              caption: post.caption,
              mediaType: post.mediaType,
              engagement: post.likeCount + post.commentsCount,
              platform: post.platform
            }))
          },
          result,
        },
      });

      res.json({ role: "assistant", content: result });
    } catch (error) {
      console.error(error);
      res
        .status(500)
        .json({ message: "помилка аналізу через штучний інтелект" });
    }
  },
};
module.exports = getAdviceFromChatGPT;
