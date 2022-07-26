var express = require("express");
var router = express.Router();
var template = require("../lib/template.js");

router.get("/", function (request, response) {
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

module.exports = router;
