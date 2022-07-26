const express = require("express");
// express 는 모듈이기에 express를 가져오는 것
const app = express();
//express 호출 , aplication이라는 객체가 담기고 이를 return해준다.
const port = 3000;
var fs = require("fs");
var path = require("path");
var qs = require("querystring");
var sanitizeHtml = require("sanitize-html");
var template = require("./lib/template.js");
var topicRouter = require("./routes/topic");

app.use(express.static("public"));
//12. 정적인 파일의 서비스
// public folder 아래 있는 파일을 url을 통해 접근 가능
var bodyParser = require("body-parser");
var compression = require("compression");
app.use(bodyParser.urlencoded({ extended: false }));

app.use(compression());
//data 가 클경우 사용해서 data를 zip속에 넣어 둔다.
app.get("*", (request, response, next) => {
  //app.use 라고하면 middle ware 로 등록
  // res, response를 받아서 변형할수 있다.
  // *는 모든 요청이라는 뜻
  // get 방식으로 들어오는 code만 이용된다 / post 는 해당 안된
  fs.readdir("./data", function (error, filelist) {
    request.list = filelist;
    next();
    //다음에 호출해야할 middle ware 실행할지 않할지를
    // 그 미들웨어의 전 미들 웨어가 결정한다.
  });
});
// form data use liek this
//bodyParser가 만든 미들웨어를 표현하는 표현식
//main.js 실행 될때 'bodyParser.urlencoded({ extended: false })'실행됨

app.use("/topic", topicRouter);
///topic으로 시작하는 주소 들에게 topicRouter라는 middle ware 를 적용한다.
// '/topic'을 담 았을 경우 topic.js에서는 이를 호출할 필요가 없음

app.get("/", function (request, response) {
  // fs.readdir("./data", function (error, filelist) {
  //"/" 경로를 통해 특정 경로 에서만 미들웨어가 동작
  // get방식인 경우에만 middle ware 동작
  var title = "Welcome";
  var description = "Hello, Node.js";
  var list = template.list(request.list);
  var html = template.HTML(
    title,
    list,
    `<h2>${title}</h2>${description}
    <img src='/images/hello.jpg' style='width:300px; display:block;'/>
    
    `,
    //12. 정적인 파일의 서비스
    `<a href="/topic/create">create</a>`
  );
  response.send(html);
});

app.use(function (req, res, next) {
  res.status(404).send("Sorry cant find that!!");
});
//13. 에러처리
// midware 는 순차적으로 실행이 된다.
// 모든 midware 실행이 된후에 여기까지 왔을때 404 보내서 에러 메세지를 보낸다.
app.use(function (err, req, res, next) {
  console.error(err.stack);
  res.status(500).send("Something broke!");
});
// next(err) 시에 바로 인자가 4개인 err가 호출
app.listen(port, () => {
  console.log(`Example app listening on port ${port}`);
});
