let mongoose = require(`mongoose`);
let bcrypt = require(`bcrypt-nodejs`);

/**
 * * schema : require 에 true 대신 배열 가능
 * 첫번째는 true/false 값이고, 두번째는 에러메세지
 * 그냥 true/false을 넣을 경우 기본 에러메세지 출력
 * 배열을 사용해서 custom(사용자정의) 에러메세지를 만들 수 있음
 *
 * * select:false가 추가
 * 기본설정은 자동으로 select:true인데, schema항목을 DB에서 읽어옴
 * select:false로 설정하면 DB에서 값을 읽어 올때 해당 값을 읽어오라고 하는 경우에만 값을 읽어옴
 * 비밀번호는 중요하기 때문에 기본적으로 DB에서 값을 읽어오지 않게 설정
 *
 * * match: [/정규표현식/,"에러메세지"]를 사용하면, 해당 표현식에 맞지 않는 값이 오는 경우 에러메세지 출력
 * regex(/^.{4,12}$/)의 해석
 * /^.{4,12}$/ : regex는 / /안에 작성
 * /^.{4,12}$/ : ^는 문자열의 시작을 나타냄
 * /^.{4,12}$/ : .는 어떠한 문자열이라도 상관없음을 나타냄
 * /^.{4,12}$/ : {숫자1,숫자2}는 숫자1 이상, 숫자2 이하의 길이 나타냄
 * /^.{4,12}$/ : $는 문자열의 끝을 나타냄
 * ^과 $가 regex의 시작과 끝에 동시에 있으면 전체 문자열이 조건에 맞아야 성공
 * .{4,12}는 어떠한 문자라도 좋지만 4개 이상 12개 이하여야 한다는 뜻
 * 즉 전체 길이가 4자리 이상 12자리 이하 길이라면 어떠한 문자라도 regex를 통과한다는 의미가 됩
 */
// schema
let userSchema = mongoose.Schema({
  username: {
    type: String
    , required: [true, "Username is required!"]
    , match: [/^.{4,12}$/, "Should be 4~12 characters!"]
    , trim: true
    , unique: true
  }
  , password: {
    type: String
    , required: [true, "Password is required!"]
    , select: false
  }
  , name: {
    type: String
    , required: [true, "Name is required!"]
    , match: [/^.{4,12}$/, "Should be 4~12 characters!"]
    , trim: true
  }
  , email: {
    type: String
    , match: [/^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+.[a-zA-Z]{2,}$/, "Should be a vaild email address!"]
  }
},{
  toObject: { virtuals: true }
});

// virtuals
userSchema.virtual(`passwordConfirmation`)
.get(function(){ return this._passwordConfirmation; })
.set(function(value){ this._passwordConfirmation = value });

userSchema.virtual(`originalPassword`)
.get(function(){ return this._originalPassword; })
.set(function(value){ this._originalPassword = value });

userSchema.virtual(`currentPassword`)
.get(function(){ return this._currentPassword; })
.set(function(value){ this._currentPassword = value });

userSchema.virtual(`newPassword`)
.get(function(){ return this._newPassword; })
.set(function(value){ this._newPassword = value });

/**
 * DB에 정보를 생성, 수정하기 전에 mongoose가 값이 유효(valid)한지 확인(validate)
 * password항목에 custom(사용자정의) validation 함수를 지정할 수 있음
 * virtual들은 직접 validation이 안되기 때문에(DB에 값을 저장하지 않으니까 어찌보면 당연) password에서 값을 확인하도록 했음
 */
// password validation
let passwordRegex = /^(?=.*[A-Za-z])(?=.*\d)[A-Za-z\d]{8,16}$/;
let passwordRegexErrorMessage = `Should be minimum 8 characters of alphabet and number combination!.`
userSchema.path(`password`).validate(function(v){
  let user = this;  // validation callback 함수 속에서 this는 user model임
console.log(`userSchema.path`);
  /**
   * model.invalidate함수. 첫번째는 인자로 항목이름, 두번째 인자로 에러메세지
   */
  // create user
  if (user.isNew) {
    if (!user.passwordConfirmation) {
      user.invalidate(`passwordConfirmation`, `Password Confirmation is required!`);
    }
    /**
     * 정규표현식.test(문자열) 함수는 문자열에 정규표현식을 통과하는 부분이 있다면 true를, 그렇지 않다면 false를 return
     */
    if (!passwordRegex.test(user.password)) {
      user.invalidate(`password`, passwordRegexErrorMessage);
    } else if (user.password !== user.passwordConfirmation) {
      user.invalidate(`passwordConfirmation`, `Password Confirmation does not matched!`);
    }
  }

  /**
   * bcrypt.compareSync(first, second)에서 first는 입력받은 text값이고 second는 hash값
   * hash를 해독해서 text를 비교하는것이 아니라 text값을 hash로 만들고 그 값이 일치하는 지를 확인하는 과정
   */
  // update user
  if (!user.isNew) {
    if (!user.currentPassword) {
      user.invalidate(`currentPassword`, `Current Password is required!`);
    }
    if (user.currentPassword && !bcrypt.compareSync(user.currentPassword, user.originalPassword)) {
      user.invalidate(`currentPassword`, `Current Password is invalid!`);
    }
    if (user.newPassword && !passwordRegex.test(user.newPassword)) {
      user.invalidate(`newPassword`, passwordRegexErrorMessage);
    } else if (user.newPassword !== user.passwordConfirmation) {
      user.invalidate(`passwordConfirmation`, `Password Confirmation does not matched!`);
    }
  }
});

/**
 * * userSchema.pre(`first`, () => {});
 * 첫번째 파라미터로 설정된 event(`first`)가 일어나기 전(pre)에 먼저 callback 함수를 실행
 * isModified함수는 해당 값이 db에 기록된 값과 비교해서 변경된 경우 true를, 그렇지 않은 경우 false를 return하는 함수
 * 생성시는 항상 true, 수정시는 password가 변경되는 경우에만 true를 리턴
 */
// hash password
userSchema.pre(`save`, function(next){
  console.log(`userSchema.pre`);
  let user = this;
  if (!user.isModified(`password`)) {
    return next();
  } else {
    user.password = bcrypt.hashSync(user.password);
    return next();
  }
});

// model methods
userSchema.methods.authenticate = function(password){
  let user = this;
  return bcrypt.compareSync(password, user.password);
};

/*
* mongoose.model함수를 사용하여 contact schema의 model을 생성
* 첫번째 parameter는 mongoDB에서 사용되는 콜렉션의 이름(테이블명(?))이며, 두번째는 mongoose.Schema로 생성된 오브젝트
* DB에 있는 user 데이터 콜렉션을 현재 코드의 User 변수에 연결해 주는 역할
* 생성된 User object는 mongoDB의 user collection의 model이며 DB에 접근하여 data를 변경할 수 있는 함수들을 가지고 있음
* DB에 user 콜렉션이 존재하지 않더라도 괜찮, 없는 콜렉션은 알아서 생성
*/
// model & export
let User = mongoose.model(`user`, userSchema);
module.exports = User;
