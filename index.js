var express = require(`express`);
var mongoose = require(`mongoose`);
var bodyParser = require(`body-parser`);
var methodOverride = require(`method-override`);
var flash = require("connect-flash");
var session = require("express-session");
var passport = require("./config/passport");
var app = express();

// DB setting
/*
* mongoose에서 내는 몇가지 경고를 안나게 하는 코드. 이 부분이 없어도 실행에는 아무런 문제가 없음
* https://mongoosejs.com/docs/deprecations.html
*/
mongoose.set(`useNewUrlParser`, true);
mongoose.set(`useFindAndModify`, false);
mongoose.set(`useCreateIndex`, true);
mongoose.set(`useUnifiedTopology`, true);

/*
* node.js에서 기본으로 제공되는 process.env 오브젝트는 환경변수들을 가지고 있는 객체
* DB connection string을 MONGO_DB라는 이름의 환경변수에 저장하였기 때문에 node.js코드상에서 process.env.MONGO_DB로 해당 값을 불러올 수 있는것임
* mongoose.connect("CONNECTION_STRING")함수를 사용해서 DB를 연결할 수 있음
* ex) mongoose.connect("mongodb+srv://root:kang3593@cluster0-chyyt.mongodb.net/test?retryWrites=true&w=majority")
*/
mongoose.connect(process.env.MONGO_DB);

/*
* mongoose의 db object를 가져와 db변수에 넣는 과정
* 이 db변수에는 DB와 관련된 이벤트 리스너 함수들이 있음
*/
var db = mongoose.connection;

// db가 성공적으로 연결된 경우
/*
* DB연결은 앱이 실행되면 단 한번만 일어나는 이벤트 이기에 [db.once("이벤트_이름",콜백_함수)] 함수를 사용
* 그러므로 db.once() 함수 사용
*/
db.once(`open`, () => {
  console.log(`DB Connected`);
});

// db연결중 에러가 있는 경우
/*
* error는 DB접속시 뿐만 아니라, 다양한 경우에 발생할 수 있으며,
* DB 연결 후 다른 DB 에러들이 또 다시 발생할 수도 있기에 [db.on("이벤트_이름",콜백_함수)] 함수를 사용
*/
db.on(`error`, (error) => {
  console.log(`DB ERROR : `, error);
});


// Other settings
app.set("view engine", "ejs");
// express에서 기본 경로. 별다른 변경이 없을 경우 명시하지 않아도 됨
// app.set('views', __dirname + '/views');
app.use(express.static(__dirname+"/public"));
// app.engine('html', require('ejs').renderFile);

/*
* bodyParser로 stream의 form data를 req.body에 옮겨 담습니다.
* 2번은 json data를, 3번은 urlencoded data를 분석해서 req.body를 생성합니다.
* 이 부분이 지금 이해가 안가시면 bodyParser로 이렇게 처리를 해 줘야 form에 입력한 data가 req.body에 object로 생성이 된다는 것만 아셔도 괜찮습니다.
*/
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({extended:true}));

/**
 * _method의 query로 들어오는 값으로 HTTP method를 바꿉니다.
 * 예를들어 http://example.com/category/id?_method=delete를 받으면 _method의 값인 delete을 읽어 해당 request의 HTTP method를 delete으로 바꿉니다.
 */
app.use(methodOverride("_method"));

/**
 * flash는 변수처럼 이름을 정하고 값(문자열, 숫자, 배열, 객체 등등 어떠한 형태의 값이라도 사용 가능)을 저장할 수 있는데,
 * 한번 생성 되면 사용될 때까지 서버에 저장이 되어 있다가 한번 사용되면 사라지는 형태의 data
 *
 * flash를 초기화 이제부터 req.flash라는 함수를 사용할 수 있음
 * req.flash(key, value) 의 형태로 value(숫자, 문자열, 오브젝트등 어떠한 값이라도 가능)를 해당 key에 저장
 * flash는 배열로 저장되기 때문에 같은 key를 중복해서 사용하면 순서대로 배열로 저장
 * req.flash(key) 인 경우 해당 key에 저장된 value들을 배열로 불러옴. 저장된 값이 없다면 빈 배열([])을 return
 */
app.use(flash());
app.use(session({ secret: "MySecret", resave: true, saveUninitialized: true} ));

/**
 * passport.initialize()는 passport를 초기화 시켜주는 함수
 * passport.session()는 passport를 session과 연결해 주는 함수
 * @type {Boolean}
 */
// Passport
app.use(passport.initialize());
app.use(passport.session());

/**
 * * 로그인시에 DB로 부터 user를 찾아 session에 user 정보의 일부(간혹 전부)를 등록하는 것을 serialize라고 함
 * 반대로 session에 등록된 user 정보로부터 해당 user를 object로 만드는 과정을 deserialize라고 함
 * server에 요청이 올때마다 deserialize를 거치게 됨
 *
 * * app.use에 함수를 넣은 것을 middleware라고 함
 * app.use에 있는 함수는 request가 올때마다 route에 상관없이 무조건 해당 함수가 실행
 * app.use는 위에 있는 것 부터 순서대로 실행되기 때문에 위치가 중요
 * route과도 마찬가지로 반드시 route 위에 위치해야 함 (무슨 말인지 모르겠음. 2020-01-09)
 *
 * * 함수안에 반드시 next()를 넣어줘야 다음으로 진행
 * req.isAuthenticated()는 passport에서 제공하는 함수로, 현재 로그인이 되어있는지 아닌지를 true,false로 return
 * req.user는 passport에서 추가하는 항목으로 로그인이 되면 session으로 부터 user를 deserialize하여 생성
 * res.locals에 담겨진 변수는 ejs에서 바로 사용가능
 */
// Custom Middlewares
app.use((req, res, next) => {
  res.locals.isAuthenticated = req.isAuthenticated();
  res.locals.currentUser = req.user;
  next();
})

// Routes
/* app.use("route", 콜백_함수)는 해당 route에 요청이 오는 경우에만 콜백 함수를 호출 */
app.use("/", require("./routes/home"));
app.use("/posts", require("./routes/posts"));
app.use("/users", require("./routes/users"));

// Port setting
var port = 3000
app.listen(port, function(){
  console.log("server on! http://localhost:"+port);
});
