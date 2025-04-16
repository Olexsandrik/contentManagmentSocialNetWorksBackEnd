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
      const content = posts.map((post) => {
        const comments =
          post.comments.length > 0
            ? post.comments.map((c) => `- ${c.username}: ${c.text}`).join("\n")
            : "Немає";

        return `
        ${post.caption ?? "Опис відсутній"}
          ${post.platform}
          кількість лайків та коментарів ${post.likeCount}, ${post.commentsCount}
          Коментарі:
          ${comments || "Немає коментраів"}
          тип контенту: ${post.mediaType}
          зображення aбо відео користувача: ${post.mediaUrl}} зроби опис по url
          `;
      });

      const basePrompt = `
      Користувач публікує наступний контент: ${content} 
      На основі цих даних, запропонуй поради як покращити залучення аудиторії та якість контенту. 
      Для тесту скажи які дані ти бачиш і опиши фото чи відео яке надано в стилі посилання яке там є.
      `;

      const prompt = customPrompt
        ? `${basePrompt}\n\nДодаткові вказівки користувача: ${customPrompt} твоя ціль ще відпрвідати користувачеві на повідомлення які він додатково задає`
        : basePrompt;

      const response = await openai.chat.completions.create({
        model: "gpt-3.5-turbo",

        messages: [
          {
            role: "system",
            content: "Ти — професіональний аналітик соціальних мереж.",
          },
          { role: "user", content: prompt },
        ],
        temperature: 0.8,
      });

      const result = response.choices[0].message.content;

      await prisma.analyticsAI.create({
        data: {
          userId: userIdInt,
          dataType: "content_advice",
          prompt,
          customPrompt,
          inputData: posts,
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
