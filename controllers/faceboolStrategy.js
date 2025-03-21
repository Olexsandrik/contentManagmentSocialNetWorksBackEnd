const passport = require("passport");
const FacebookStrategy = require("passport-facebook").Strategy;
const { prisma } = require("../prisma/prisma-client");
const {
  handleInstagramInfoAfterAuth,
} = require("../controllers/facebook-controller");

require("dotenv").config();

passport.use(
  new FacebookStrategy(
    {
      clientID: process.env.FACEBOOK_CLIENT_ID,
      clientSecret: process.env.FACEBOOK_SECRET_KEY,
      callbackURL: `${process.env.SERVER_URL}/server/login/facebook/callback`,
      profileFields: ["id", "displayName", "photos", "email"],
    },
    async (accessToken, refreshToken, profile, done) => {
      try {
        const existingUser = await prisma.user.findFirst({
          where: {
            accountId: profile.id,
            provider: "facebook",
          },
        });

        if (existingUser) return done(null, existingUser);

        const newUser = await prisma.user.create({
          data: {
            accountId: profile.id,
            name: profile.displayName,
            email: profile.emails?.[0]?.value || "",
            avatarUrl: profile.photos?.[0]?.value || "",
            provider: "facebook",
          },
        });
        await handleInstagramInfoAfterAuth(newUser.id, accessToken);
        return done(null, newUser);
      } catch (err) {
        console.error("Facebook auth error:", err);
        return done(err, null);
      }
    }
  )
);
