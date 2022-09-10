const fs = require("fs");
const idl = require("./dist/target/idl/canvas.json");

fs.writeFileSync("./web/idl.json", JSON.stringify(idl));