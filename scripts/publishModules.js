const fs = require("fs");
const path = require("path");
const { exec } = require("child_process");
const { directoryName, registry, version } = require("./config.json");

let promises = [];

// 判断压缩目的文件是否存在
if (!fs.existsSync(path.resolve(__dirname, `../${directoryName}`))) {
	fs.mkdirSync(path.resolve(__dirname, `../${directoryName}`));
	// 同时创建package.json文件
	exec(
		`npm init -y`,
		{ cwd: path.resolve(__dirname, `../${directoryName}`) },
		(err) => {
			if (err) throw err;
			const packageJson = require(`../${directoryName}/package.json`);
			packageJson.version = version;
			fs.writeFileSync(
				path.resolve(__dirname, `../${directoryName}/package.json`),
				JSON.stringify(packageJson),
				"utf-8"
			);

			console.log(
				"🚀 ~ file: publishModules.js:19 ~ packageJson:",
				packageJson
			);
		}
	);
}

const files = fs.readdirSync(path.resolve(__dirname, "../node_modules"));

files.forEach((file) => {
	const filePath = path.join(path.resolve(__dirname, "../node_modules"), file);
	const stat = fs.statSync(filePath);
	let newFilePath = path.resolve(__dirname, `../${directoryName}/${file}`);
	if (stat.isDirectory()) {
		if (!fs.existsSync(newFilePath)) {
			fs.mkdirSync(newFilePath);
		}
		promises.push(
			new Promise((resolve, reject) => {
				exec(
					`tar zcvf ${newFilePath}/${file}.tar.gz -C ${filePath} .`,
					(err) => {
						if (err) {
							reject(`${files}压缩失败`, err);
						} else {
							resolve(`${file}压缩完毕`);
						}
					}
				);
			})
		);
	}
});

Promise.all(promises)
	.then((results) => {
		console.log("全部压缩完毕，开始发布");
		exec(
			`npm publish --registry=${registry}`,
			{ cwd: path.resolve(__dirname, `../${directoryName}`) },
			(err) => {
				if (err) {
					console.log("🤪当前版本存在，正在撤销已发布版本", err);
					exec(
						`npm unpublish ${directoryName}@${version} --registry ${registry}`,
						{ cwd: path.resolve(__dirname, `../${directoryName}`) },
						(err) => {
							if (err) throw err;
							console.log("cheban");
						}
					);
				}
			}
		);
	})
	.catch((err) => {
		console.log("压缩失败", err);
	});
