let express = require(`express`);
let router = express.Router();
let User = require(`../models/User`);

/**
 * method 원형 : User.find({}).exec(function(err, posts){ ... })
 * method 간략형 : User.find({}, function(err, posts){ ... })
 * .exec함수 앞에 DB에서 데이터를 어떻게 찾을지, 어떻게 정렬할지 등등을 함수로 표현하고, exec안의 함수에서 해당 data를 받아와서 할일을 정하는 구조
 * .sort()함수는 string이나 object를 받아서 데이터 정렬방법을 정의
 * 문자열로 표현하는 경우 정렬할 항목명을 문자열로 넣으면 오름차순으로 정렬하고, 내림차순인 경우 -를 앞에 붙여줌
 * 두가지 이상으로 정렬하는 경우 빈칸을 넣고 각각의 항목을 적어주면 됨
 */
/**
 * find 기본형 : User.find({}, (err, users) => {})
 * sort(정렬) 함수를 넣어주기 위해 아래 형태로 변경 <sort말고도 다양한 함수들이 끼어들 수 있음. 이러한 경우에 exec를 사용>
 * User.find({}).sort().exec((err, users) => {})
 * callback 함수가 find 함수 밖으로 나오게 되면, exec(callback_함수)를 사용
 */
// index
router.get(`/`, (req, res) => {
  User.find({})
  .sort({ username: 1 })
  .exec((err, users) => {
    if (err) return res.json(err);
    res.render(`users/index`, { users: users });
  });
});

/**
 * flash는 array가 오게 되는데
 * 이 프로그램에서는 하나 이상의 값이 저장되는 경우가 없고, 있더라도 오류이므로 무조건 [0]의 값을 읽어 오게 했음
 */
// new
router.get(`/new`, (req, res) => {
  let user = req.flash(`user`)[0] || {};
  let errors = req.flash(`errors`)[0] || {};
  res.render(`users/new`, { user: user, errors: errors });
});

// create
router.post(`/`, (req, res) => {
  User.create(req.body, (err, user) => {
    console.log(`User.create`);
    if (err) {
      req.flash(`user`, req.body);
      req.flash(`errors`, parseError(err));
      return res.redirect(`/users/new`);
    }
    res.redirect(`/users`);
  });
});

// show
router.get(`/:username`, (req, res) => {
  User.findOne({ username: req.params.username }, (err, user) => {
    if (err) return res.json(err);
    res.render(`users/show`, { user: user });
  });
});

// edit
router.get(`/:username/edit`, (req, res) => {
  let user = req.flash(`user`)[0];
  let errors = req.flash(`errors`)[0] || {};
  if (!user) {
    User.findOne({ username: req.params.username }, (err, user) => {
      if (err) return res.json(err);
    });
  }

  res.render(`users/edit`, { username: req.params.username, user: user, errors: errors });
});

/**
 * * findOneAndUpdate대신에 findOne으로 값을 찾은 후에 값을 수정하고 user.save함수로 값을 저장
 * user.password를 조건에 맞게 바꿔주어야 하기 때문
 * * select 함수
 * DB에서 어떤 항목을 선택할지, 안할지를 정할 수 있음
 * user schema에서 password의 select을 false로 설정했으니 DB에 password가 있더라도 기본적으로 password를 읽어오지 않음
 * 기본적으로 읽어오게 되어 있는 항목을 안 읽어오게 할 수도 있는데 이때는 항목이름 앞에 -를 붙이면 됨
 * 하나의 select함수로 여러 항목을 동시에 정할 수도 있음
 * password를 읽어오고, name을 안 읽어오게 하고 싶다면 .select("password -name")를 입력
 * select("password"), select({password: 1}) : password 항목을 가져옴
 * select("-password"), select({password: 0}) : password 항목을 숨김
 */
// update
router.put(`/:username`, (req, res, next) => {
  User.findOne({ username: req.params.username })
  .select(`password`)
  .exec((err, user) => {
    if (err) return res.json(err);

    // update user object
    user.originalPassword = user.password;
    user.password = req.body.newPassword ? req.body.newPassword : user.password;
    for (var p in req.body) {
      user[p] = req.body[p];
    }

    // user는 DB에서 읽어온 data이고, req.body가 실제 form으로 입력된 값이므로 각 항목을 덮어 쓰는 부분
    user.save((err, user) => {
      if (err) {
        req.flash(`user`, req.body);
        req.flash(`errors`, parseError(err));
        return res.redirect(`/users/`+req.params.username+`/edit`);
      }
      res.redirect(`/users/`+user.username);
    });
  });
});

module.exports = router;

// Functions
let parseError = function(errors){
  // console.log(`1errors: `, errors);
  let parsed = {};
  if (errors.name == `ValidationError`) {
    for (var name in errors.errors) {
      let validationError = errors.errors[name];
      parsed[name] = { message: validationError.message };
    }
  } else if (errors.code == `11000` && errors.errmsg.indexOf(`username`) > 0) {
    parsed.username = { message: `This username already exists!` };
  } else {
    parsed.unhandled = JSON.stringify(errors);
  }
  // console.log(`parsed:`, parsed);
  return parsed;
}
