let mongoose = require(`mongoose`);

// schema
let postSchema = mongoose.Schema({
  title: { type: String, required: true }
  , body: { type: String}
  , createdAt: { type: Date, default: Date.now }
  , updatedAt: { type: Date }
},{
  // virtual들을 object에서 보여주는 mongoose schema의 option
  toBoejct: { virtuals: true}
});

// virtuals
/**
 * postSchema.virtual함수를 이용해서 createdDate, createdTime, updatedDate, updatedTime의 virtuals(가상 항목들)을 설정했다
 * virtuals은 실제 DB에 저장되진 않지만 model에서는 db에 있는 다른 항목들과 동일하게 사용할 수 있는데,
 * get, set함수를 설정해서 어떻게 해당 virtual 값을 설정하고 불러올지를 정할 수 있다
 * createdAt, updatedAt은 Data 타입으로 설정되어 있는데
 * javascript은 Data 타입에 formatting 기능(시간을 어떠한 형식으로 보여줄지 정하는 것, 예를 들어 2017-01-02로 할지, 01-02-2017로 할지 등등)을
 * 따로 설정해 주어야 하기 때문에 이와 같은 방식을 택했다
 * 이해불가 ㅠ.ㅠ
 */
postSchema.virtual("createdDate")
.get(() => {
  return getDate(this.createdAt);
});

postSchema.virtual("createdTime")
.get(() => {
  return getTime(this.createdAt);
});

postSchema.virtual("updatedDate")
.get(() => {
  return getDate(this.updatedAt);
});

postSchema.virtual("updatedTime")
.get(() => {
  return getTime(this.updatedAt);
});

// model & export
let Post = mongoose.model(`post`, postSchema);
module.exports = Post;

// functions
function getDate(dateObj){
  if (dateObj instanceof Date) {
    return dateObj.getFullYear() + `-` + get2digits(dateObj.getMonth() + 1) + `-` + get2digits(dateObj.getDate());
  }
}

function getTime(dateObj){
  if (dateObj instanceof Date) {
    return get2digits(dateobj.getHours()) + `:` + get2digits(dateObj.getMinutes()) + `:` + get2digits(dateObj.getSeconds());
  }
}

function get2digits(num){
  return (`0` + num).slice(-2);
}
