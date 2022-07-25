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
var bodyParser = require("body-parser");
var compression = require("compression");
app.use(bodyParser.urlencoded({ extended: false }));
app.use(compression());
//data 가 클경우 사용해서 data를 zip속에 넣어 둔다.
app.get("*", (request, response, next) => {
  // *는 모든 요청이라는 뜻
  // get 방식으로 들어오는 code만 이용된다 / post 는 해당 안된
  fs.readdir("./data", function (error, filelist) {
    request.list = filelist;
    next();
    //다음에 호출해야할 middle ware
  });
});
// form data use liek this
//bodyParser가 만든 미들웨어를 표현하는 표현식
//main.js 실행 될때 'bodyParser.urlencoded({ extended: false })'실행됨
app.get("/", function (request, response) {
  // fs.readdir("./data", function (error, filelist) {
  var title = "Welcome";
  var description = "Hello, Node.js";
  var list = template.list(request.list);
  var html = template.HTML(
    title,
    list,
    `<h2>${title}</h2>${description}`,
    `<a href="/create">create</a>`
  );
  response.send(html);
});

//app.get(path , callback)
app.get("/page/:pageId", function (request, response) {
  console.log(request.list);
  //[ 'expreww' ]
  // fs.readdir("./data", function (error, filelist) {
  var filteredId = path.parse(request.params.pageId).base;
  fs.readFile(`data/${filteredId}`, "utf8", function (err, description) {
    var title = request.params.pageId;
    var sanitizedTitle = sanitizeHtml(title);
    var sanitizedDescription = sanitizeHtml(description, {
      allowedTags: ["h1"],
    });
    var list = template.list(request.list);
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
  console.log(request.list);
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

app.listen(port, () => {
  console.log(`Example app listening on port ${port}`);
});
