;! function (self) {
	let LOGGER_LEVEL = ["debug", "info", "warn", "error"],
		loopTimes = 0,
		deepcopy = require('./deepcopy'),
		isAndroidApp = self._cordovaNative && navigator.userAgent.toLowerCase().indexOf('android') !== -1

	function dealWithItems(item) {
		try {
			const dist = deepcopy(item);
			return JSON.stringify(dist, function (key, value) {
				return formatDataType(value)
			}, 4)
		} catch (err) {
			return Object.prototype.toString.call(item)
		}
	}

	function formatDataType(value) {
		loopTimes++
		let formattedOnes = ""
		try {
			const valueType = Object.prototype.toString.call(value)
			switch (valueType) {
				case '[object Number]':
				case '[object String]':
				case '[object Undefined]':
				case '[object Null]':
				case '[object Boolean]':
					formattedOnes = value
					break;
				case '[object Object]':
				case '[object Array]':
					for (let i in value) {
						try {
							if (value.hasOwnProperty && value.hasOwnProperty(i)) {
								if (loopTimes > 999) {
									value[i] = Object.prototype.toString.call(value[i])
								} else {
									value[i] = formatDataType(value[i])
								}
							} else {
								value[i] = Object.prototype.toString.call(value[i])
							}
						} catch (err) {
							value[i] = valueType
						}
					}
					formattedOnes = value
					break;
				case '[object Function]':
					console.warn("we don't recommend to print function directly")
					formattedOnes = Function.prototype.toString.call(value)
					break;
				case '[object Error]':
					formattedOnes = value.stack || value.toString()
					break;
				case '[object Symbol]':
					console.warn("we don't recommend to print Symbol directly")
					formattedOnes = value.toString()
					break;
				case '[object Set]':
					console.warn("we don't recommend to print Set directly")
					formattedOnes = [...value]
					break;
				case '[object Map]':
					console.warn("we don't recommend to print Map directly")
					const obj = {}
					for (let [key, item] of value) {
						obj[key] = item
					}
					formattedOnes = obj
					break;
				default:
					formattedOnes = Object.prototype.toString.call(value)
					break;
			}
		} catch (err) {
			formattedOnes = {}
		}
		return formattedOnes
	}

	function createAndWriteFile(data = "", folder, column, filename) {
		if (!self.requestFileSystem && !self.LocalFileSystem) {
			throw new Error("^^^^^^^^cordova-logger: please install cordova-plugin-file first")
		}
		return new Promise(function (res) {
			self.requestFileSystem(self.LocalFileSystem.PERSISTENT, 0, function (fs) {
				fs.root.getDirectory(folder, {
					create: true
				}, function (dirEntry) {
					dirEntry.getDirectory(column, {
						create: true
					}, function (subDirEntry) {
						subDirEntry.getFile(
							filename, {
								create: true,
								exclusive: false
							},
							function (fileEntry) {
								fileEntry.createWriter(function (fileWriter) {
									fileWriter.onwriteend = function () {
										res(data)
									};
									fileWriter.onerror = function (e) {
										console.error("cordova-logger: write file fail" + JSON.stringify(e));
										res(e)
									};
									fileWriter.seek(fileWriter.length);
									fileWriter.write(data);
								});
							}, onErrorCreateFile);
					}, onErrorLoadFs);
				}, onErrorGetDir);
			}, onErrorGetDir);
		})
	}

	function onErrorCreateFile(error) {
		console.error("cordova-logger: file folder create fail!", error)
		throw new Error("^^^^^^^^cordova-logger: file folder create fail" + error)
	}

	function onErrorLoadFs(error) {
		console.error("cordova-logger: file system load error!", error)
		throw new Error("^^^^^^^^cordova-logger: file system load error!" + error)
	}

	function onErrorGetDir(error) {
		console.error("cordova-logger: file folder create fail!", error)
		throw new Error("^^^^^^^^cordova-logger: file folder create fail" + error)
	}

	function onErrorLoadFs(error) {
		console.error("cordova-logger: file system load fail!", error)
		throw new Error("^^^^^^^^cordova-logger: file system load fail!" + error)
	}

	function getTime() {
		let year = new Date().getFullYear();
		let month = new Date().getMonth() + 1;
		let day = new Date().getDate();
		let hour = new Date().getHours();
		let minute = new Date().getMinutes();
		let second = new Date().getSeconds();
		let mileSecond = new Date().getMilliseconds();
		if (hour < 10) {
			hour = "0" + hour
		}
		if (minute < 10) {
			minute = "0" + minute
		}
		if (second < 10) {
			second = "0" + second
		}
		if (mileSecond < 10) {
			mileSecond = "00" + mileSecond
		}
		if (mileSecond < 100) {
			mileSecond = "0" + mileSecond
		}
		const time = `${year}-${month}-${day} ${hour}:${minute}:${second}.${mileSecond}`;
		return time;
	}

	function Logger(config) {
		if (config === undefined || Object.prototype.toString.call(config) === '[object Object]') {
			self.userConfig = (config || {})
			self.userConfig.folder = (typeof (self.userConfig.folder) === 'string' ? self.userConfig.folder : "cordova-logger")
			self.userConfig.column = (typeof (self.userConfig.column) === 'string' ? self.userConfig.column : "log")
			self.userConfig.filename = (typeof (self.userConfig.filename) === 'string' ? self.userConfig.filename : "logger.log")
			self.logger = {};
			LOGGER_LEVEL.map(item => {
				self['logger'][item] = (buffer = "", ...args) => {
					const param = [buffer, ...args]
					if (item === 'debug') {
						console.log(`[${getTime()}] [DEBUG]`, buffer, ...args);
						return Promise.resolve(...param)
					} else {
						loopTimes = 0
						console[item](`[${getTime()}] [${item.toUpperCase()}] `, buffer, ` [ext]`, ...args)
						if (isAndroidApp) {
							const {
								folder,
								column,
								filename
							} = self.userConfig
							buffer = JSON.stringify(buffer, function (key, value) {
								return formatDataType(value)
							}, 4)
							let extend = [];
							if (args.length) {
								extend = args.map(item => dealWithItems(item));
								if (extend.length) {
									extend = `  [ext] ${extend.join("")}`;
								}
							}
							const content = `${buffer}` + `${extend}` + "\r\n";
							const rawData = `[${getTime()}] [${item.toUpperCase()}] ${content}`;
							return createAndWriteFile(rawData, folder, column, filename);
						} else {
							return Promise.resolve(...param)
						}
					}
				}
			})
			self.logger.userConfig = self.userConfig
			return self.logger
		} else {
			throw new Error("^^^^^^^^cordova-logger config must be an object")
		}
	}

	Logger.prototype.checkFileWritePriority = function () {
		if (!self.permissions) {
			throw new Error("^^^^^^^^cordova-logger: please install cordova-plugin-android-permissions first")
		}
		return new Promise(res => {
			if (isAndroidApp) {
				self.permissions.checkPermission(permissions.WRITE_EXTERNAL_STORAGE, function (status) {
					if (status.hasPermission) {
						res(true)
					} else {
						res(false)
					}
				})
			} else {
				res(true)
			}
		})
	}

	Logger.prototype.requestFileWritePriority = function (folder, column, file) {
		if (!self.requestFileSystem && !self.LocalFileSystem) {
			throw new Error("^^^^^^^^cordova-logger: please install cordova-plugin-file first")
		}
		return new Promise(res => {
			if (isAndroidApp) {
				self.requestFileSystem(self.LocalFileSystem.PERSISTENT, 0, function (fs) {
					fs.root.getDirectory(folder, {
						create: true
					}, function (dirEntry) {
						dirEntry.getDirectory(column, {
								create: true
							},
							function (subDirEntry) {
								//持久化数据保存
								subDirEntry.getFile(
									file, {
										create: true,
										exclusive: false
									},
									function (fileEntry) {
										res()
									},
									function (error) {
										res()
									}
								)
							}
						)
					})
				})
			} else {
				res()
			}
		})
	}

	Logger.prototype.checkExternalFileExistOrNot = function (filename) {
		if (!self.requestFileSystem && !self.LocalFileSystem) {
			throw new Error("^^^^^^^^cordova-logger: please install cordova-plugin-file first")
		}
		return new Promise((resolve) => {
			self.resolveLocalFileSystemURL(
				self.cordova.file.externalApplicationStorageDirectory,
				function (fs) {
					fs.getFile(
						filename, {
							create: false,
							exclusive: true
						},
						function (fileEntry) {
							resolve(true)
						},
						function (error) {
							resolve(false)
						}
					)
				}
			)
		})
	}

	module.exports = Logger

}(self)
