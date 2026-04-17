import passport from 'passport';
import { Strategy as GoogleStrategy } from 'passport-google-oauth20';
import User from '../models/User.js';
import { addUserToSheet } from '../utils/googleSheets.js';
import dotenv from 'dotenv';

dotenv.config();

passport.use(
  new GoogleStrategy(
    {
      clientID: process.env.GOOGLE_CLIENT_ID,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET,
      callbackURL: process.env.GOOGLE_CALLBACK_URL || 'http://localhost:5001/api/auth/google/callback',
      scope: ['profile', 'email'],
    },
    async (_accessToken, _refreshToken, profile, done) => {
      try {
        let user = await User.findOne({ googleId: profile.id });
        if (user) return done(null, user);

        const existingEmailUser = await User.findOne({ email: profile.emails[0].value });
        if (existingEmailUser) {
          if (existingEmailUser.authProvider === 'local') {
            existingEmailUser.googleId = profile.id;
            existingEmailUser.authProvider = 'google';
            existingEmailUser.avatar = profile.photos[0]?.value;
            await existingEmailUser.save();
          }
          return done(null, existingEmailUser);
        }

        user = await User.create({
          name: profile.displayName,
          email: profile.emails[0].value,
          googleId: profile.id,
          authProvider: 'google',
          avatar: profile.photos[0]?.value,
          phone: '0000000000',
        });

        addUserToSheet(user).catch(() => {});
        done(null, user);
      } catch (error) {
        done(error, null);
      }
    }
  )
);

passport.serializeUser((user, done) => done(null, user.id));

passport.deserializeUser(async (id, done) => {
  try {
    const user = await User.findById(id);
    done(null, user);
  } catch (error) {
    done(error, null);
  }
});

export default passport;
