const { PrismaClient } = require("@prisma/client/extension");

const { Request, Response, NextFunction } = require("express");

const prisma = new PrismaClient();

export const redirectToInstagram = (req, res) => {
  const instagramClientId = process.env.INSTAGRAM_CLIENT_ID;

  const redirectUrl = process.env.INSTGRAM_REDIRECT_URL;

  const authUrl = `https://api.instagram.com/oauth/authorize?client_id=${instagramClientId}&redirect_uri=${redirectUri}&scope=user_profile,user_media&response_type=code`;
  res.redirect(authUrl);
};
