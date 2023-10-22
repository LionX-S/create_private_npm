const fs = require("fs");
const path = require("path");
const { exec } = require("child_process");
const { directoryName, registry, version } = require("./config.json");

const tgzModule = path.resolve(__dirname, `../${directoryName}`);
let promises = [];

// 判断压缩目的文件是否存在
if (!fs.existsSync(tgzModule)) {
	fs.mkdirSync(tgzModule);
	// 同时创建package.json文件
	exec(`npm init -y`, { cwd: tgzModule }, (err) => {
		if (err) throw err;
		const packageJson = require(`../${directoryName}/package.json`);
		packageJson.version = version;
		fs.writeFileSync(
			path.resolve(__dirname, `../${directoryName}/package.json`),
			JSON.stringify(packageJson),
			"utf-8"
		);
	});
}

const files = fs.readdirSync(path.resolve(__dirname, "../node_modules"));

// 遍历，采用shell命令压缩文件
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
	.then(() => {
		console.log("全部压缩完毕，开始发布");
		return publishPackage();
	})
	.then((message) => {
		console.log(message);
		// 成功后删除压缩后的文件
		console.log("开始删除多余文件夹");
		deleteFolderRecursive(tgzModule);
		console.log(`删除完毕`);
	})
	.catch(({ err }) => {
		console.log("失败", err);
	});

// 发布package方法
const publishPackage = () => {
	return new Promise((resolve, reject) => {
		// 先执行unpublish
		exec(
			`npm unpublish ${directoryName}@${version} --force --registry ${registry}`,
			{ cwd: tgzModule },
			(err) => {
				// 如果报错，则说明版本不存在，开始发布
				if (err) {
					console.log("版本已存在，先unpublish当前版本");
					commonPublish(resolve, reject);
				} else {
					// 成功的话继续发布
					commonPublish(resolve, reject);
				}
			}
		);
	});
};

const commonPublish = (resolve, reject) => {
	exec(
		`npm publish --registry=${registry}`,
		{ cwd: path.resolve(__dirname, `../${directoryName}`) },
		(err) => {
			if (err) {
				console.log();
				reject({ message: "🤪发布失败，请查看错误信息", err });
			} else {
				resolve("🥰发布成功");
			}
		}
	);
};

// 删除文件
const deleteFolderRecursive = (path) => {
	if (fs.existsSync(path)) {
		fs.readdirSync(path).forEach((file) => {
			const curPath = path + "/" + file;
			if (fs.lstatSync(curPath).isDirectory()) {
				// 递归删除子文件夹
				deleteFolderRecursive(curPath);
			} else {
				// 删除文件
				fs.unlinkSync(curPath);
			}
		});

		// 删除空文件夹
		fs.rmdirSync(path);
	}
};
