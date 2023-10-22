const fs = require("fs");
const path = require("path");

// 每次执行下载脚本时，在项目根目录生成一个.npmrc文件，设置针对当前项目的registry地址
const npmrcPath = path.resolve(__dirname, "../.npmrc");
if (!fs.existsSync(npmrcPath)) {
	fs.mkdirSync(npmrcPath);
}
