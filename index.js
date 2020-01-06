var express = require(`express`);
var mongoose = require(`mongoose`);
var bodyParser = require(`body-parser`);
var methodOverride = require(`method-override`);
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
app.set(`view engine`, `ejs`);
// express에서 기본 경로. 별다른 변경이 없을 경우 명시하지 않아도 됨
// app.set('views', __dirname + '/views');
app.use(express.static(__dirname + `/public`));
app.engine('html', require('ejs').renderFile);

/*
* bodyParser로 stream의 form data를 req.body에 옮겨 담습니다.
* 2번은 json data를, 3번은 urlencoded data를 분석해서 req.body를 생성합니다.
* 이 부분이 지금 이해가 안가시면 bodyParser로 이렇게 처리를 해 줘야 form에 입력한 data가 req.body에 object로 생성이 된다는 것만 아셔도 괜찮습니다.
*/
app.use(bodyParser.json()); // 2
app.use(bodyParser.urlencoded({ extended: true })); // 3

/**
 * _method의 query로 들어오는 값으로 HTTP method를 바꿉니다.
 * 예를들어 http://example.com/category/id?_method=delete를 받으면 _method의 값인 delete을 읽어 해당 request의 HTTP method를 delete으로 바꿉니다.
 */
app.use(methodOverride("_method"));

// Routes
/* app.use("route", 콜백_함수)는 해당 route에 요청이 오는 경우에만 콜백 함수를 호출 */
app.use("/", require("./routes/home"));
// app.use("/contacts", require("./routes/contacts"));

// Port setting
var port = 3000;
app.listen(port, () => {
  console.log(`Server On! http://127.0.0.1:`+port);
});
