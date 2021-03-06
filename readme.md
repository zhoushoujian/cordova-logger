# Cordova-logger

```Cordova logger system for android```

## First

1. Before cordova-logger, you should install cordova-plugin-file and cordova-plugin-android-permissions first.

2. You should install cordova-logger in Front-End project folder.

## Usage

```js
import Logger from "cordova-logger"
const logger = new Logger({
  folder: "cordova",
  column: "log",
  filename: "file.log"
})
logger.info("logger", "string")  // [2020-2-2 22:13:54.551]  [INFO]  logger [ext] string

logger.checkFileWritePriority()  // return true or false
logger.requestFileWritePriority('folder', 'column', 'file')  // request app write permission
logger.checkExternalFileExistOrNot('filename')  // return true or false
console.log("logger", logger)
```

## Functions

1. Only logger.debug doesn't log to file, all of them can be print in console.

2. Only identify 999 levels in input value which contains object or array.

3. Data type includes Number, String, Undefined, Null, Boolean, Object, Array, Function, Error, Set, Map and Symbol can be support stringify. If something can't be stringify, it will be print data type, such as DOM element, it will print '[object HTMLDivElement]'

4. Although we support print Function, Set, Map and Symbol directly, we still don't recommend to print it without any transfer, and it will give a warn to remind you if you set dataTypeWarn to be true.

5. Support new multiple cordova-logger instance to log different files.

6. `logger.checkFileWritePriority` could check app have file write permission or not

7. `logger.requestFileWritePriority` request app write permission

8. `logger.checkExternalFileExistOrNot` check file exist or not

9. All of logger method support Promise chain call

## License

[MIT](https://github.com/zhoushoujian/cordova-logger/blob/master/LICENSE)
