const axios = require("axios");
const { prisma } = require("../prisma/prisma-client");

const fetchInstagramDataAfterLogin = async (userId, accessToken) => {
  try {
    console.log("Fetching Facebook pages...");
    const pagesRes = await axios.get(
      `https://graph.facebook.com/v22.0/me/accounts?access_token=${accessToken}`
    );

    const pages = pagesRes.data.data;
    if (!pages || pages.length === 0) {
      console.log("No Facebook Pages found — possible reasons:");
      console.log("- You did not create a Page on Facebook");
      console.log("- You did not grant 'pages_show_list' permission");
      console.log("- User access token expired or invalid");
      return;
    }

    const page = pages[0];
    const pageAccessToken = page.access_token;
    const pageId = page.id;

    const pageInfoRes = await axios.get(
      `https://graph.facebook.com/v22.0/${pageId}?fields=instagram_business_account&access_token=${pageAccessToken}`
    );

    const igUserId = pageInfoRes.data.instagram_business_account.id;
    if (!igUserId) {
      console.log("Instagram Business Account not linked to Page.");
      return;
    }

    const mediaRes = await axios.get(
      `https://graph.facebook.com/v22.0/${igUserId}/media`,
      {
        params: {
          access_token: pageAccessToken,
          fields:
            "id,caption,media_type,media_url,permalink,timestamp,like_count,comments_count",
        },
      }
    );

    const posts = mediaRes.data.data;

    for (const post of posts) {
      await prisma.instagramPost.upsert({
        where: { postId: post.id },
        update: {
          caption: post.caption,
          mediaType: post.media_type,
          mediaUrl: post.media_url,
          permalink: post.permalink,
          timestamp: new Date(post.timestamp),
          likeCount: post.like_count,
          commentsCount: post.comments_count,
        },
        create: {
          userId: userId,
          platform: "instagram",
          postId: post.id,
          caption: post.caption,
          mediaType: post.media_type,
          mediaUrl: post.media_url,
          permalink: post.permalink,
          timestamp: new Date(post.timestamp),
          likeCount: post.like_count,
          commentsCount: post.comments_count,
        },
      });

      const commentsRes = await axios.get(
        `https://graph.facebook.com/v22.0/${post.id}/comments`,
        {
          params: {
            access_token: pageAccessToken,
            limit: 3,
          },
        }
      );

      const comments = commentsRes.data.data;

      console.log(comments);
      for (const comment of comments) {
        await prisma.instagramComment.upsert({
          where: { commentId: comment.id },
          update: {
            text: comment.text,
            username: comment.username,
            timestamp: new Date(comment.timestamp),
          },
          create: {
            postId: post.id,
            commentId: comment.id,
            text: comment.text,
            username: comment.username,
            timestamp: new Date(comment.timestamp),
          },
        });
      }
      console.log(
        "Instagram Business Account:",
        pageInfoRes.data.instagram_business_account
      );
    }

    console.log("Instagram posts and comments saved successfully.");
  } catch (error) {
    console.error("Error fetching Instagram data:", error);
  }
};

module.exports = { fetchInstagramDataAfterLogin };
