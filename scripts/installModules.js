const fs = require("fs");
const path = require("path");
const { registry, directoryName } = require("./config.json");
const spawnSync = require("child_process").spawnSync;

// 每次执行下载脚本时，在项目根目录生成一个.npmrc文件，设置针对当前项目的registry地址
const npmrcPath = path.resolve(__dirname, "../.npmrc");

// 从config.json中的registry地址，写入到.npmrc文件中
if (!fs.existsSync(npmrcPath)) {
	fs.writeFileSync(npmrcPath, `registry=${registry}\n`);
}

// 从registry地址下载config中给定的module
/**
 * 安装模块
 * @param {string} moduleName - 模块名称
 */
function installModule(moduleName) {
	const command = `npm install ${moduleName} --registry=${registry}`;
	console.log(command);
	const { status } = spawnSync(command, {
		stdio: "inherit",
		shell: true
	});
	if (status !== 0) {
		console.log("安装失败");
	}
}
installModule(directoryName);
