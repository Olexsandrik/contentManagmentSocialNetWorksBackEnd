const axios = require("axios");
const { prisma } = require("../prisma/prisma-client");

const fetchInstagramData = async (accessToken) => {
  try {
    // Крок 1: Отримати сторінки користувача
    const pagesRes = await axios.get(
      `https://graph.facebook.com/v19.0/me/accounts?access_token=${accessToken}`
    );
    const page = pagesRes.data.data[0];
    if (!page) throw new Error("No Facebook Page found");

    // Крок 2: Отримати Instagram Business Account
    const pageDetails = await axios.get(
      `https://graph.facebook.com/v19.0/${page.id}?fields=instagram_business_account&access_token=${accessToken}`
    );

    const instagramBusinessId = pageDetails.data.instagram_business_account?.id;
    if (!instagramBusinessId)
      throw new Error("Instagram account not linked to Facebook Page");

    // Крок 3: Отримати Instagram профіль
    const igProfileRes = await axios.get(
      `https://graph.facebook.com/v19.0/${instagramBusinessId}?fields=id,username,profile_picture_url,followers_count,media_count&access_token=${accessToken}`
    );

    return igProfileRes.data;
  } catch (error) {
    console.error("Error fetching Instagram data:", error.message);
    return null;
  }
};

const handleInstagramInfoAfterAuth = async (userId, accessToken) => {
  try {
    const instagramData = await fetchInstagramData(accessToken);

    if (!instagramData) return;

    // Записуємо Instagram-дані в infoDataSocial
    await prisma.infoDataSocial.create({
      data: {
        userId: userId,
        platform: "instagram",
        profileUsername: instagramData.username,
        profilePictureUrl: instagramData.profile_picture_url || "",
        followersCount: instagramData.followers_count || 0,
        mediaCount: instagramData.media_count || 0,
        likesCount: 0,
      },
    });

    console.log("Instagram data saved to infoDataSocial");
  } catch (err) {
    console.error("Failed to save Instagram info:", err.message);
  }
};

module.exports = {
  handleInstagramInfoAfterAuth,
};
