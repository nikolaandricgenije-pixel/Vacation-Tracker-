const passport = require('passport');
const DiscordStrategy = require('passport-discord').Strategy;
const GoogleStrategy = require('passport-google-oauth20').Strategy;

const users = new Map();

passport.serializeUser((user, done) => {
  done(null, user.id);
});

passport.deserializeUser((id, done) => {
  const user = users.get(id);
  done(null, user);
});

passport.use(
  new GoogleStrategy(
    {
      clientID: process.env.GOOGLE_CLIENT_ID || 'demo-client-id',
      clientSecret: process.env.GOOGLE_CLIENT_SECRET || 'demo-client-secret',
      callbackURL: process.env.GOOGLE_CALLBACK_URL || 'http://localhost:3001/api/auth/google/callback',
    },
    async (accessToken, refreshToken, profile, done) => {
      try {
        let user = Array.from(users.values()).find(u => u.googleId === profile.id);

        if (!user) {
          user = {
            id: Date.now().toString(),
            googleId: profile.id,
            email: profile.emails[0].value,
            name: profile.displayName,
            picture: profile.photos[0]?.value,
            roles: ['Employee'],
            vacationDays: 20,
            paidLeaveDays: 7
          };

          if (user.email === 'nikola@valens.dev') {
            user.roles = ['Admin', 'Employee'];
            user.vacationDays = 25;
          }

          users.set(user.id, user);
        }

        return done(null, user);
      } catch (error) {
        return done(error, null);
      }
    }
  )
);

passport.use(
 new DiscordStrategy(
   {
     clientID: process.env.DISCORD_CLIENT_ID || 'demo-client-id',
     clientSecret: process.env.DISCORD_CLIENT_SECRET || 'demo-client-secret',
     callbackURL: process.env.DISCORD_CALLBACK_URL || 'http://localhost:3001/api/auth/discord/callback',
     scope: ['identify', 'email']
   },
   async (accessToken, refreshToken, profile, done) => {
     try {
       let user = Array.from(users.values()).find(u => u.discordId === profile.id);

       if (!user) {
         user = {
           id: Date.now().toString(),
           discordId: profile.id,
           email: profile.email,
           name: profile.username,
           picture: profile.avatar ? `https://cdn.discordapp.com/avatars/${profile.id}/${profile.avatar}.png` : null,
           roles: ['Employee'],
           vacationDays: 20,
           paidLeaveDays: 7
         };

         if (user.email === 'nikola@valens.dev') {
           user.roles = ['Admin', 'Employee'];
           user.vacationDays = 25;
         }

         users.set(user.id, user);
       }

       return done(null, user);
     } catch (error) {
       return done(error, null);
     }
   }
 )
);

module.exports = passport;
