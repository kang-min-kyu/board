let express = require(`express`);
let router = express.Router();
let Post = require(`../models/Post`);

// index
/**
 * method 원형 : Post.find({}).exec(function(err, posts){ ... })
 * method 간략형 : Post.find({}, function(err, posts){ ... })
 * .exec함수 앞에 DB에서 데이터를 어떻게 찾을지, 어떻게 정렬할지 등등을 함수로 표현하고, exec안의 함수에서 해당 data를 받아와서 할일을 정하는 구조
 * .sort()함수는 string이나 object를 받아서 데이터 정렬방법을 정의
 * 문자열로 표현하는 경우 정렬할 항목명을 문자열로 넣으면 오름차순으로 정렬하고, 내림차순인 경우 -를 앞에 붙여줌
 * 두가지 이상으로 정렬하는 경우 빈칸을 넣고 각각의 항목을 적어주면 됨
 */
router.get(`/`, (req, res) => {
  Post.find({});
  .sort(`-createdAt`)
  .exec((err, posts) => {
    if (err) return res.json(err);
    res.render(`posts/index`, { posts: posts });
  });
});

// new
router.get(`/new`, (req, res) => {
  res.render(`posts/new`);
});

// create
router.post(`/`, (req, res) => {
  Post.create(req.body, (err, post) => {
    if (err) return res.json(err);
    res.redirect(`/posts`);
  });
});

// show
router.get(`/:id`, (req, res) => {
  Post.findOne({ _id: req.params.id }, (err, post) => {
    if (err) return res.json(err);
    res.render(`posts/show`, { post: post });
  });
});

// edit
router.get(`/:id/edit`, (req, res) => {
  Post.findOne({ _id: req.params.id }, (err, post) => {
    if (err) return res.json(err);
    res.render(`posts/edit`, { post: post });
  });
});

// update
router.put(`/:id`, (req, res) => {
  req.body.updatedAt = Date.now();  // data의 수정이 있는 경우 수정된 날짜를 업데이트
  Post.findOneAndUpdate({ _id: req.params.id }, req.body, (err, post) => {
    if (err) return res.json(err);
    res.redirect(`/posts/`+req.params.id);
  });
});

// destory
router.delete(`/:id`, (req, res) => {
  Post.deleteOne({ _id: req.params.id }, req.body, (err, post) => {
    if (err) return res.json(err);
    res.redirect(`/posts`);
  });
});

module.export = reuter;
