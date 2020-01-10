var express = require('express');
var router = express.Router();
var passport = require(`../config/passport`);

// home
router.get("/", (req, res) => {
  res.render("home/welcome", {});
});

router.get("/about", (req, res) => {
  res.render("home/about", {});
});

/**
 * login form에서 보내진 post request를 처리해 주는 route
 * 두개의 callback
 * 첫번째 callback은 보내진 form의 validation을 위한 것으로 에러가 있으면 flash를 만들고 login view로 redirect
 * 두번째 callback은 passport local strategy를 호출해서 authentication(로그인)을 진행
 */
// Login
router.route(`/login`).get((req, res) => {
  let username = req.flash(`username`)[0];
  let errors = req.flash(`errors`)[0] || {};
  res.render("home/login", {
    username: username
    , errors: errors
  });
}).post((req, res, next) => {
    let errors = {};
    let isValid = true;

    if (!req.body.username) {
      isValid = false;
      errors.username =  `Username is required!`;
    }
    if (!req.body.password) {
      isValid = false;
      errors.password =  `Password is required!`;
    }

    if (isValid) {
      next();
    } else {
      req.flash(`errors`, errors);
      res.redirect('/login');
    }
  },
  passport.authenticate(`local-login`, {
    successRedirect : `/`
    , failureRedirect: `/login`
  })
);

/**
 * passport에서 제공된 req.logout 함수를 사용하여 로그아웃하고 "/"로 redirect
 */
// Logout
router.get(`/logout`, (req, res) => {
  req.logout();
  res.redirect(`/`);
});

module.exports = router;
