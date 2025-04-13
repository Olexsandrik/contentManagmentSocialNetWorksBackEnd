const axios = require("axios");
const { prisma } = require("../prisma/prisma-client");

const fetchInstagramDataAfterLogin = async (userId, accessToken) => {
  try {
    // Отримуємо список сторінок Facebook
    const pagesRes = await axios.get(
      `${process.env.FACEBOOK_BASE_URL}/me/accounts?access_token=${accessToken}`
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
      `${process.env.FACEBOOK_BASE_URL}/${pageId}?fields=instagram_business_account&access_token=${pageAccessToken}`
    );

    const igUserId = pageInfoRes.data.instagram_business_account?.id;

    if (!igUserId) {
      console.log("Instagram Business Account not linked to Page.");
      return;
    }

    // Отримуємо список постів з Instagram
    const mediaRes = await axios.get(
      `${process.env.FACEBOOK_BASE_URL}/${igUserId}/media`,
      {
        params: {
          fields:
            "id,caption,media_type,media_url,permalink,timestamp,like_count,comments_count",
          access_token: pageAccessToken,
        },
      }
    );

    const posts = mediaRes.data.data;
    console.log(posts);
    if (!posts || posts.length === 0) {
      return;
    }

    for (const post of posts) {
      await prisma.socialMediaPost.upsert({
        where: { postId: post.id },
        update: {
          caption: post.caption,
          mediaType: post.media_type,
          mediaUrl: post.media_url,
          permalink: post.permalink,
          timestamp: new Date(post.timestamp),
          likeCount: post.like_count,
          commentsCount: post.comments_count,
          platform: "Instagram",
        },
        create: {
          userId,
          postId: post.id,
          caption: post.caption,
          mediaType: post.media_type,
          mediaUrl: post.media_url,
          permalink: post.permalink,
          timestamp: new Date(post.timestamp),
          likeCount: post.like_count,
          commentsCount: post.comments_count,
          platform: "Instagram",
        },
      });

    
      const commentsRes = await axios.get(
        `${process.env.FACEBOOK_BASE_URL}/${post.id}/comments`,
        {
          params: {
            fields: "id,text,username,timestamp",
            access_token: pageAccessToken,
          },
        }
      );

      const comments = commentsRes.data.data;

      if (comments && comments.length > 0) {
        for (const comment of comments) {
          await prisma.socialMediaComment.upsert({
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
      }
    }
  } catch (error) {
    console.error("Error fetching Instagram data:", error.message);
  }
};

module.exports = { fetchInstagramDataAfterLogin };
