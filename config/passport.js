let passport = require(`passport`);
/**
 * strategy들은 거의 대부분이 require다음에 .Strategy가 붙음
 * .Strategy없이 사용해도 되는 것도 있는데, 다들 붙여주니까 같이 붙여줍세
 * 꼭 붙여야 된다거나, 혹은 다른 단어가 붙는 경우도 있는데
 * 이런건 https://www.npmjs.com/에서 해당 package를 검색한 후 해당 package의 공식 문서에서 확인할 수 있음
 */
let LocalStrategy = require(`passport-local`).Strategy;
let User = require(`../models/User`);

/**
 * * passport.serializeUser는  login시 DB에서 발견한 user를 어떻게 session에 저장할지를 정하는 부분. user의 id만 session에 저장
 * * passport.deserializeUser는 request시에 session에서 어떻게 user object를 만들지를 정하는 부분
 * 매번 request마다 user정보를 db에서 새로 읽어오는데, user가 변경되면 바로 변경된 정보가 반영되는 장점
 * 다만 매번 request마다 db를 읽게 되는 단점이 있음
 * 선택은 그때 그때 상황에 맞게 하면 됨
 *
 * * done함수의 첫번째 parameter는 항상 error를 담기 위한 것으로 error가 없다면 null을 담음
 */
// serialize & deserialize User
passport.serializeUser((user, done) => {
  done(null, user.id);
});
passport.deserializeUser((id, done) => {
  User.findOne( {_id: id }, (err, user) => {
    done(err, user);
  });
});

/**
 * local strategy를 설정하는 부분
 * 3-1 : 로그인 form의 username과 password항목의 이름이 다르다면 여기에서 값을 변경해 주면 됨
 *        이 코드에서는 해당 항목 이름이 form과 일치하기 때문에 굳이 쓰지 않아도 됨
 *        로그인 form의 항목이름이 email, pass라면 usernameField : "email", passwordField : "pass"로 해야 함
 * 3-2 : 로그인 시에 이 함수가 호출
 *        user.authenticate 함수를 사용해서 입력받은 password와 저장된 password hash를 비교해서 값이 일치하면 해당 user를 done에 담아서 return
 *        그렇지 않은 경우 username flash와 에러 flash를 생성한 후 done에 false를 담아 return
 *        user가 전달되지 않으면 local-strategy는 실패(failure)로 간주
 * * done함수의 첫번째 parameter는 항상 error를 담기 위한 것으로 error가 없다면null을 담음
 */
// local strategy
passport.use(`local-login`,
  new LocalStrategy({
    usernameField: `username`   // 3-1
    , passwordField: `password` // 3-1
    , passReqToCallback: true
  },
  function(req, username, password, done){  // 3-2
    User.findOne({ username: username })
    .select({ password: 1 })
    .exec(function(err, user){
      if (err) return done(err);

      if (user && user.authenticate(password)) {
        return done(null, user);
      } else {
        req.flash(`username`, username);
        req.flash(`errors`, { login: `Incorrect username or password` });
        return done(null, false);
      }
    });
  })
);

module.exports = passport;
