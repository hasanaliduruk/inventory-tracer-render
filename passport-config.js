const LocalStrategy = require("passport-local").Strategy;
const bcrypt = require("bcrypt");
const pool = require("./db");

function initialize(passport) {
    const authenticateUser = async (email, password, done) => {
        try {
            const result = await pool.query("SELECT * FROM users WHERE email = $1", [email]);
            const user = result.rows[0];

            if (!user) {
                return done(null, false, { message: "No user with that email" });
            }

            if (await bcrypt.compare(password, user.password)) {
                return done(null, user);
            } else {
                return done(null, false, { message: "Password incorrect" });
            }
        } catch (error) {
            return done(error);
        }
    };

    passport.use(new LocalStrategy({ usernameField: "email" }, authenticateUser));

    passport.serializeUser((user, done) => {
        done(null, user.id);
    });

    passport.deserializeUser(async (id, done) => {
        try {
            const result = await pool.query("SELECT * FROM users WHERE id = $1", [id]);
            const user = result.rows[0];
            return done(null, user);
        } catch (error) {
            return done(error);
        }
    });
}

module.exports = initialize;
