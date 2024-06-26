const express = require('express');
const bodyParser = require('body-parser');
const session = require('express-session');
const path = require('path');
const moment = require("moment");

const indexRouter = require('./src/routes/indexRouter');
const authRouter = require('./src/routes/authRouter');
const dashboardRouter = require('./src/routes/dashboardRouter');
const adminRouter = require('./src/routes/adminRouter');
const animeRouter = require('./src/routes/animeRouter');
const healthCheckRouter = require('./src/routes/healthCheckRouter');

const db = require('./src/services/db');

const app = express();

app.use(session({
  secret: 'tu_secreto',
  resave: true,
  saveUninitialized: true
}));

app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'src', 'views'));

app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());

app.use('/src/public/css', express.static('src/public/css', { 'Content-Type': 'text/css' }));
app.use('/src/public/js', express.static('src/public/js', { 'Content-Type': 'text/javascript' }));

app.use((req, res, next) => {
  if (req.path !== "/login" && req.path !== "/check-ban") {
    db.query(
      "SELECT banned, ban_expiration FROM usuarios WHERE id = ?",
      [req.session.userId || 0],
      (err, results) => {
        if (err) {
          console.error("Error al obtener el estado de baneado:", err);
          return res.redirect("/dashboard");
        }

        if (results.length > 0) {
          const { banned, ban_expiration } = results[0];
          if (banned) {
            if (ban_expiration > new Date()) {
              const banExpirationFormatted = moment(ban_expiration).format(
                "DD/MM/YYYY HH:mm:ss"
              );
              return res.render("banned", {
                message: "Has sido baneado temporalmente.",
                banExpirationFormatted,
              });
            } else {
              return res.render("banned", {
                message: "Has sido baneado permanentemente.",
                banExpirationFormatted: null,
              });
            }
          }
        }

        next();
      }
    );
  } else {
    next();
  }
});

app.use('/', indexRouter);
app.use('/', animeRouter);
app.use('/', authRouter);
app.use('/', dashboardRouter);
app.use('/', adminRouter);
app.use('/', healthCheckRouter);

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Servidor iniciado en el puerto http://localhost:${PORT}/`);
});