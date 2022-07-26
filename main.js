const express = require("express");
// express 는 모듈이기에 express를 가져오는 것
const app = express();
//express 호출 , aplication이라는 객체가 담긴다.
const port = 3000;
var fs = require("fs");
var path = require("path");
var qs = require("querystring");
var sanitizeHtml = require("sanitize-html");
var template = require("./lib/template.js");

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
    `<a href="/create">create</a>`
  );
  response.send(html);
});

//app.get(path , callback)
app.get("/page/:pageId", function (request, response, next) {
  var filteredId = path.parse(request.params.pageId).base;
  // fs.readdir("./data", function (error, filelist) {
  fs.readFile(`data/${filteredId}`, "utf8", function (err, description) {
    if (err) {
      next(err);
      // next('') 아무런 값이 없으면 다음 midware을 바로 실행
      // err 는 err를 던짐
    } else {
      var title = request.params.pageId;
      var sanitizedTitle = sanitizeHtml(title);
      var sanitizedDescription = sanitizeHtml(description, {
        allowedTags: ["h1"],
      });
      var list = template.list(request.list);
      //console.log(request.list);
      //[ 'expreww' ]
      var html = template.HTML(
        sanitizedTitle,
        list,
        `<h2>${sanitizedTitle}</h2>${sanitizedDescription}`,
        ` <a href="/create">create</a>
          <a href="/update/${sanitizedTitle}">update</a>
          <form action="/delete_process" method="post">
            <input type="hidden" name="id" value="${sanitizedTitle}">
            <input type="submit" value="delete">
          </form>`
      );
      response.send(html);
    }
  });
});

//HTML => req.params안에 들어가있음
//pageId 를 통해서 {'pageId' :'HTML'}로 표현됨

app.get("/create", function (request, response) {
  //fs.readdir("./data", function (error, filelist) {
  var title = "WEB - create";
  var list = template.list(request.list);
  var html = template.HTML(
    title,
    list,
    `
      <form action="/create_process" method="post">
        <p><input type="text" name="title" placeholder="title"></p>
        <p>
          <textarea name="description" placeholder="description"></textarea>
        </p>
        <p>
          <input type="submit">
        </p>
      </form>
    `,
    ""
  );
  response.send(html);
});

/*var body = "";
  request.on("data", function (data) {
    body = body + data;
  });
  request.on("end", function () {
    var post = qs.parse(body);
    var title = post.title;
    var description = post.description;
    fs.writeFile(`data/${title}`, description, "utf8", function (err) {
      response.writeHead(302, { Location: `/?id=${title}` });
      response.end();
    });
  });*/

// this is body-parser
app.post("/create_process", function (request, response) {
  //console.log(request.list);
  //| undefined > 글 목록 data를 가져오지 않음
  var post = request.body;
  var title = post.title;
  var description = post.description;
  fs.writeFile(`data/${title}`, description, "utf8", function (err) {
    response.writeHead(302, { Location: `/?id=${title}` });
    response.end();
  });
});

app.get("/update/:pageId", function (request, response) {
  var filteredId = path.parse(request.params.pageId).base;
  fs.readFile(`data/${filteredId}`, "utf8", function (err, description) {
    var title = request.params.pageId;
    var list = template.list(request.list);
    var html = template.HTML(
      title,
      list,
      `
        <form action="/update_process" method="post">
          <input type="hidden" name="id" value="${title}">
          <p><input type="text" name="title" placeholder="title" value="${title}"></p>
          <p>
            <textarea name="description" placeholder="description">${description}</textarea>
          </p>
          <p>
            <input type="submit">
          </p>
        </form>
        `,
      `<a href="/create">create</a> <a href="/update?id=${title}">update</a>`
    );
    response.send(html);
  });
});

app.post("/update_process", function (request, response) {
  var post = request.body;
  var id = post.id;
  var title = post.title;
  var description = post.description;
  fs.rename(`data/${id}`, `data/${title}`, function (error) {
    fs.writeFile(`data/${title}`, description, "utf8", function (err) {
      response.redirect(`/?id=${title}`);
    });
  });
});

app.post("/delete_process", (request, response) => {
  var post = request.body;
  var id = post.id;
  var filteredId = path.parse(id).base;
  fs.unlink(`data/${filteredId}`, function (error) {
    //response.writeHead(302, { Location: `/` });
    //response.end();
    response.redirect("/");
  });
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
