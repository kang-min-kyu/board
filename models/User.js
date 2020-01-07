let mongoose = require(`mongoose`);
let bcrypt = require(`bcrypt-nodejs`);

/**
 * * schema : require 에 true 대신 배열
 * 첫번째는 true/false 값이고, 두번째는 에러메세지
 * 그냥 true/false을 넣을 경우 기본 에러메세지 출력
 * 배열을 사용해서 custom(사용자정의) 에러메세지를 만들 수 있음
 *
 * * select:false가 추가
 * 기본설정은 자동으로 select:true인데, schema항목을 DB에서 읽어옴
 * select:false로 설정하면 DB에서 값을 읽어 올때 해당 값을 읽어오라고 하는 경우에만 값을 읽어옴
 * 비밀번호는 중요하기 때문에 기본적으로 DB에서 값을 읽어오지 않게 설정
 */
// schema
let userSchema = mongoose.Schema({
  username: { type: String, required:[true, `Username is required!`], unique: true }
  , password: { type: String, required:[true, `Password is required!`], select: false }
  , name: { type: String, required:[true, "Name is required!"] }
  , email: { type:String }
},{
  toObject: { virtuals: true }
});

/**
 * DB에 정보를 생성, 수정하기 전에 mongoose가 값이 유효(valid)한지 확인(validate)
 * password항목에 custom(사용자정의) validation 함수를 지정할 수 있음
 * virtual들은 직접 validation이 안되기 때문에(DB에 값을 저장하지 않으니까 어찌보면 당연) password에서 값을 확인하도록 했음
 */
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

// password validation
userSchema.path(`password`).validate(function(v){
  let user = this;  // validation callback 함수 속에서 this는 user model임

  /**
   * model.invalidate함수. 첫번째는 인자로 항목이름, 두번째 인자로 에러메세지
   */
  // create user
  if (user.isNew) {
    if (!user.passwordConfirmation) {
      user.invalidate(`passwordConfirmation`, 'Password Confirmation is required!');
    }
    if (user.password !== user.passwordConfirmation) {
      user.invalidate(`passwordConfirmation`, 'Password Confirmation does not matched!');
    }
  }

  /**
   * bcrypt.compareSync(first, second)에서 first는 입력받은 text값이고 second는 hash값
   * hash를 해독해서 text를 비교하는것이 아니라 text값을 hash로 만들고 그 값이 일치하는 지를 확인하는 과정
   */
  // update user
  if (!user.isNew) {
    if (!user.currentPassword) {
      user.invalidate(`currentPassword`, 'Current Password is required!');
    }
    if (user.currentPassword && !bcrypt.compareSync(user.currentPassword, user.originalPassword)) {
      user.invalidate(`currentPassword`, 'Current Password is invalid!');
    }
    if (user.newPassword !== user.passwordConfirmation) {
      user.invalidate(`passwordConfirmation`, 'Password Confirmation does not matched!');
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
  let user = this;
  console.log(`user:`, user);
  if (!user.isModified(`password`)) {
    return next();
  } else {
    user.password = bcrypt.hashSync(user.password);
    return next();
  }
});

// model methods
userSchema.methods.authenticate = (password) => {
  let user = this;
  return bcypt.compareSync(password, user.password);
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
