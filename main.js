const express = require("express");
// express 는 모듈이기에 express를 가져오는 것
const app = express();
//express 호출 , aplication이라는 객체가 담긴다.
const port = 3000;
var fs = require("fs");
var qs = require("querystring");
var template = require("./lib/template.js");
var path = require("path");
var sanitizeHtml = require("sanitize-html");
const { request } = require("http");
const { response } = require("express");
app.get("/", (request, response) => {
  fs.readdir("./data", function (error, filelist) {
    var title = "Welcome";
    var description = "Hello, Node.js";
    var list = template.list(filelist);
    var html = template.HTML(
      title,
      list,
      `<h2>${title}</h2>${description}`,
      `<a href="/create">create</a>`
    );
    response.send(html);
  });
});
//app.get(path , callback)
app.get("/page/:pageId", (request, response) => {
  fs.readdir("./data", function (error, filelist) {
    var filteredId = path.parse(request.params.pageId).base;
    fs.readFile(`data/${filteredId}`, "utf8", function (err, description) {
      var title = request.params.pageId;
      var sanitizedTitle = sanitizeHtml(title);
      var sanitizedDescription = sanitizeHtml(description, {
        allowedTags: ["h1"],
      });
      var list = template.list(filelist);
      var html = template.HTML(
        sanitizedTitle,
        list,
        `<h2>${sanitizedTitle}</h2>${sanitizedDescription}`,
        ` <a href="/create">create</a>
            <a href="/update?id=${sanitizedTitle}">update</a>
            <form action="/delete_process" method="post">
              <input type="hidden" name="id" value="${sanitizedTitle}">
              <input type="submit" value="delete">
            </form>`
      );
      response.send(html);
    });
  });
});
//HTML => req.params안에 들어가있음
//pageId 를 통해서 {'pageId' :'HTML'}로 표현됨

app.get("/create", (request, response) => {
  fs.readdir("./data", function (error, filelist) {
    var title = "WEB - create";
    var list = template.list(filelist);
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
});

app.post("/create_process", (request, response) => {
  var body = "";
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
  });
});

app.get("/update/:pageId", (request, response) => {
  fs.readdir("./data", function (error, filelist) {
    var filteredId = path.parse(request.params.pageId).base;
    fs.readFile(`data/${filteredId}`, "utf8", function (err, description) {
      var title = request.params.pageId;
      var list = template.list(filelist);
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
});

app.post("/update_process", (request, response) => {
  var body = "";
  request.on("data", function (data) {
    body = body + data;
  });
  request.on("end", function () {
    var post = qs.parse(body);
    var id = post.id;
    var title = post.title;
    var description = post.description;
    fs.rename(`data/${id}`, `data/${title}`, function (error) {
      fs.writeFile(`data/${title}`, description, "utf8", function (err) {
        //response.writeHead(302, { Location: `/?id=${title}` });
        //response.end();
        response.redirect(`/?id=${title}`);
      });
    });
  });
});

app.post("/delete_process", (request, response) => {
  var body = "";
  request.on("data", function (data) {
    body = body + data;
  });
  request.on("end", function () {
    var post = qs.parse(body);
    var id = post.id;
    var filteredId = path.parse(id).base;
    fs.unlink(`data/${filteredId}`, function (error) {
      //response.writeHead(302, { Location: `/` });
      //response.end();
      response.redirect("/");
    });
  });
});

app.listen(port, () => {
  console.log(`Example app listening on port ${port}`);
});

/*var http = require("http");
var fs = require("fs");
var url = require("url");



var sanitizeHtml = require("sanitize-html");

var app = http.createServer(function (request, response) {
  var _url = request.url;
  var queryData = url.parse(_url, true).query;
  var pathname = url.parse(_url, true).pathname;
  if (pathname === "/") {
    if (queryData.id === undefined) {
     
    } else {
   
    }
  } else if (pathname === "/create") {
 
  } else if (pathname === "/create_process") {
  
  } else if (pathname === "/update") {
   
  } else if (pathname === "/update_process") {
   
  } else if (pathname === "/delete_process") {
    var body = "";
    request.on("data", function (data) {
      body = body + data;
    });
    request.on("end", function () {
      var post = qs.parse(body);
      var id = post.id;
      var filteredId = path.parse(id).base;
      fs.unlink(`data/${filteredId}`, function (error) {
        response.writeHead(302, { Location: `/` });
        response.end();
      });
    });
  } else {
    response.writeHead(404);
    response.end("Not found");
  }
});
app.listen(3000);
*/
