let mongoose = require(`mongoose`);
// let util = require(`../util`);

// schema
let postSchema = mongoose.Schema({
  title: { type: String, required: [true, `Title is required!`] }
  , body: { type: String, required: [true, `Body is required!`] }
  , createdAt: { type: Date, default: Date.now }
  , updatedAt: { type: Date }
//   ,
// },{
//   // virtual들을 object에서 보여주는 mongoose schema의 option
//   toObject: { virtuals: true }
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
// postSchema.virtual("createdDate")
// .get(function(){
//   return util.getDate(this.createdAt);
// });
//
// postSchema.virtual("createdTime")
// .get(function(){
//   return util.getTime(this.createdAt);
// });
//
// postSchema.virtual("updatedDate")
// .get(function(){
//   return util.getDate(this.updatedAt);
// });
//
// postSchema.virtual("updatedTime")
// .get(function(){
//   return util.getTime(this.updatedAt);
// });

/*
* mongoose.model함수를 사용하여 contact schema의 model을 생성
* 첫번째 parameter는 mongoDB에서 사용되는 콜렉션의 이름(테이블명(?))이며, 두번째는 mongoose.Schema로 생성된 오브젝트
* DB에 있는 post 데이터 콜렉션을 현재 코드의 Post 변수에 연결해 주는 역할
* 생성된 Post object는 mongoDB의 post collection의 model이며 DB에 접근하여 data를 변경할 수 있는 함수들을 가지고 있음
* DB에 post 콜렉션이 존재하지 않더라도 괜찮, 없는 콜렉션은 알아서 생성
*/
// model & export
let Post = mongoose.model(`post`, postSchema);
module.exports = Post;
