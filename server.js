if (process.env.NODE_ENV !== "production") {
    require("dotenv").config();
}

const express = require("express");
const app = express();
const path = require("path");
const bcrypt = require("bcrypt");
const passport = require("passport");
const flash = require("express-flash");
const session = require("express-session");
const methodOverride = require("method-override");
const pool = require("./db");
const PORT = process.env.PORT || 5000; 

const initializePassport = require("./passport-config");
initializePassport(passport);

app.set("view-engine", "ejs");
app.use(express.static(path.join(__dirname, "public")));
app.use(express.static(path.join(__dirname, "images")));
app.use(express.urlencoded({ extended: false }));
app.use(flash());
app.use(session({
    secret: process.env.SESSION_SECRET,
    resave: false,
    saveUninitialized: false,
}));
app.use(passport.initialize());
app.use(passport.session());
app.use(methodOverride("_method"));

// Çıkış işlemi
app.delete("/logout", (req, res, next) => {
    req.logout(function(err) {
        if (err) { return next(err); }
        res.redirect("/login");
    });
});

// Ana sayfa (giriş yapmış kullanıcılar için)
app.get("/", checkAuthenticated, (req, res) => {
    res.render("index.ejs", { user: req.user });
});

// Giriş sayfası
app.get("/login", checkNotAuthenticated, (req, res) => {
    res.render("login.ejs");
});

// Giriş yapma işlemi
app.post("/login", checkNotAuthenticated, passport.authenticate("local", {
    successRedirect: "/",
    failureRedirect: "/login",
    failureFlash: true,
}));

// Kayıt sayfası
app.get("/register", checkNotAuthenticated, (req, res) => {
    res.render("register.ejs");
});

// Kullanıcı kayıt işlemi
app.post("/register", checkNotAuthenticated, async (req, res) => {
    try {
        const hashedPassword = await bcrypt.hash(req.body.password, 10);
        await pool.query(
            "INSERT INTO users (email, password) VALUES ($1, $2)",
            [req.body.email, hashedPassword]
        );
        res.redirect("/login");
    } catch (error) {
        console.error("Kayıt hatası:", error);
        res.redirect("/register");
    }
});

// Middleware: Kullanıcı giriş yapmış mı?
function checkAuthenticated(req, res, next) {
    if (req.isAuthenticated()) {
        return next();
    }
    res.redirect("/login");
}

// Middleware: Kullanıcı giriş yapmamışsa devam et
function checkNotAuthenticated(req, res, next) {
    if (req.isAuthenticated()) {
        return res.redirect("/");
    }
    next();
}

app.listen(PORT, () => {
    console.log(`Server ${PORT} portunda çalışıyor...`);
});
