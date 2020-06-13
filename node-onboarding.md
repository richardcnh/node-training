# Node Onboarding
This is just a guidelines to show some important aspects in node development.

## 1. Node的几个特点
### 1.1 异步I/O

### 1.2 事件和回调
```javascript
const http = require('http');
http.createServer(function(req, res) {
    let postData = '';
    req.setEncoding('utf8');
    req.on('data', function(trunk) {
        postData += trunk;
    });

    req.on('end', function() {
        res.end(postData);
    });
}).listen(8080);
console.log('Server started, listenning port: 8080');
```

### 1.3 单线程

Node保持了JavaScript在浏览器中单线程的特点。而且在Node中，JavaScript与其余线程是无法共享任何状态的。单线程的最大好处是不用像多线程编程那样处处在意状态的同步问题，这里没有死锁的存在，也没有线程上下文交换所带来的性能上的开销。

同样，单线程也是有弱点的，主要体现在以下几个方面：

- 无法利用多核CPU
- 错误会引起整个应用退出，不够健壮
- 大量计算占用CPU导致无法继续调用异步I/O

#### 1.3.1 如何利用多核CPU的优点？
![如何利用多核CPU的优点？](https://user-images.githubusercontent.com/7699062/84472862-9dd38100-acba-11ea-8f70-961708d448f9.jpg)

```javascript
const cluster = require('cluster');
const http = require('http');
const numCPUs = require('os').cpus().length;

if (cluster.isMaster) {
    console.log(`主进程 ${process.pid} 正在运行`);

    // 衍生工作进程。
    for (let i = 0; i < numCPUs; i++) {
        cluster.fork();
    }

    cluster.on('exit', (worker, code, signal) => {
        console.log(`工作进程 ${worker.process.pid} 已退出`);
    });
} else {
    // 工作进程可以共享任何 TCP 连接。
    // 在本例子中，共享的是一个 HTTP 服务器。
    http.createServer((req, res) => {
        res.writeHead(200);
        res.end('你好世界\n');
    }).listen(8000);

    console.log(`工作进程 ${process.pid} 已启动`);
}
```

## 2. Node的应用场景
### 2.1 I/O密集型
### 2.2 真的不擅长CPU密集型业务吗？
![计算斐波那契数列的耗时排行](https://pic2.zhimg.com/80/v2-31c3c7ab7f3a9589255b3e0d4ca5f159_1440w.jpg)
> CPU密集型应用给Node带来的挑战主要是：由于JavaScript单线程的原因，如果有长时间运行的计算（比如大循环），将会导致CPU时间片不能释放，使得后续I/O无法发起。但是适当调整和分解大型运算任务为多个小任务，使得运算能够适时释放，不阻塞I/O调用的发起，这样既可同时享受到并行异步I/O的好处，又能充分利用CPU，I/O阻塞造成的性能浪费远比CPU的影响小。

### 2.3 分布式系统
> DT时代，数据系统通常要在数据库集群中去寻找数据，最后合并起来，这样的场景非常适合异步I/O高效工作。

## 3. 模块机制
### 3.1 CommonJS规范
```javascript
'use strict';

// 同步加载引用模块
const XoRequest = require('xo-request');
const xoRequest = new XoRequest();
const handleRequestError = require('./handle-request-error');

class SettingsApi {
    // 构造函数
    constructor({ settingsApi, apikey, token } = {}) {
        // 赋值给内部属性
        this.settingsApi = settingsApi;
        this.apikey = apikey;
        this.requestOptions = {
            headers: {
                Authorization: 'Bearer ' + token
            }
        };
    };
    // 方法定义
    get(storefrontId) {
        // 引用内部属性(this.settingsApi)
        let url = `${this.settingsApi}/storefronts/${storefrontId}/settings`;
        if (this.apikey) {
            url  += `?apikey=${this.apikey}`;
        }

        return xoRequest.get(url, this.requestOptions)
            .then((response) => response.getBody(), handleRequestError)
            .then((results = []) => results[0]);
    }
}

// 导出模块
exports = module.exports = SettingsApi;
module.exports = SettingsApi;
```
[你知道exports和module.exports的区别吗？](https://segmentfault.com/a/1190000015560156)

### 3.2 NPM(Node Package Module)
> CommonJS规范是理论，NPM是其中一种实现

#### 3.2.1 包结构
```json
{
    "name": "service-security-api",
    "version": "7.7.8",
    "private": false,
    "description": "Service",
    "homepage": "https://git.xogrp.com/LocalPartners/service-security-api#readme",
    "main": "src/service.js",
    "bugs": {
        "url": "https://git.xogrp.com/LocalPartners/service-security-api/issues"
    },
    "repository": {
        "type": "git",
        "url": "git+https://git.xogrp.com/LocalPartners/service-security-api.git"
    },
    "keywords": [
        "service",
        "service-security-api"
    ],
    "author": "XO Group",
    "license": "MIT",
    "devDependencies": {
        "eslint": "4.x.x",
        "eslint-plugin-xogroup": "2.x.x",
        "mocha": "4.x.x",
        "nyc": "13.x.x",
        "proxyquire": "1.x.x",
        "xo-test-helper": "10.x.x"
    },
    "dependencies": {
        "@okta/jwt-verifier": "0.0.11",
        "analytics-node": "2.x.x",
        "bcryptjs": "2.x.x",
        "bluebird": "3.5.2",
        "boom": "7.x.x",
        "catbox-redis": "4.2.1",
        "ez-config": "0.2.1",
        "glue": "5.0.0",
        "hapi": "17.5.4",
        "xo-request": "4.x.x"
    }
}
```
#### 3.2.2 NPM常用命令

- npm -v
- npm init
- npm install
- npm install -g
- npm install -save-dev
- npm install -save
- npm run

## 异步I/O

![异步I/O示意图](http://www.ituring.com.cn/figures/2013/Node.js/07.d03z.01.png)

**场景一(同步方式）**

```javascript
// 耗时为M毫秒
getData('from_db');
// 耗时为N毫秒
getData('from_remote_api');

// 总时长为M + N
```

**场景二(异步方式）**

```javascript
getData('from_db', function(data) {
    // 耗时为M毫秒
});
getData('from_remote_api', function(data) {
    // 耗时为N毫秒
});

// 总时长为max(M, N)
```

问题：在现在的工作当中，你会如何优化**场景一**呢？

### 4.1 计算机内核I/O

- 调用阻塞I/O的过程

![阻塞I/O示意图](http://www.ituring.com.cn/figures/2013/Node.js/07.d03z.02.png)

- 调用非阻塞I/O的过程

![非阻塞I/O示意图](http://www.ituring.com.cn/figures/2013/Node.js/07.d03z.03.png)

> 任意技术都并非完美的。阻塞I/O造成CPU等待浪费，非阻塞带来的麻烦却是需要轮询去确认是否完全完成数据获取，它会让CPU处理状态判断，是对CPU资源的浪费。

- 理想的异步I/O示意图

![理想的异步I/O示意图](http://www.ituring.com.cn/figures/2013/Node.js/07.d03z.08.png)

- 现实的异步I/O示意图

![理想的异步I/O示意图](http://www.ituring.com.cn/figures/2013/Node.js/07.d03z.09.png)

### 4.2 Node的异步I/O

> 由于Windows平台和*nix平台的差异，Node提供了libuv作为抽象封装层，使得所有平台兼容性的判断都由这一层来完成，并保证上层的Node与下层的自定义线程池及IOCP之间各自独立。Node在编译期间会判断平台条件，选择性编译unix目录或是win目录下的源文件到目标程序中，其架构如下图所示。

![理想的异步I/O示意图](http://www.ituring.com.cn/figures/2013/Node.js/07.d03z.10.png)


### 4.3 非I/O的异步API

#### 4.3.1 定时器(setTimeout, setInterval)
#### 4.3.2 process.nextTick()
```javascript
process.nextTick(function () {
  console.log('延迟执行');
});
console.log('正常执行');
```
#### 4.3.3 setImmediate()
```javascript
setImmediate(function () {
  console.log('延迟执行');
});
console.log('正常执行');
```

```javascript
process.nextTick(function () {
  console.log('nextTick延迟执行');
});
setImmediate(function () {
  console.log('setImmediate延迟执行');
});
console.log('正常执行');
```
> process.nextTick()中的回调函数执行的优先级要高于setImmediate()。这里的原因在于事件循环对观察者的检查是有先后顺序的，process.nextTick()属于idle观察者，setImmediate()属于check观察者。在每一个轮循环检查中，idle观察者先于I/O观察者，I/O观察者先于check观察者。在具体实现上，process.nextTick()的回调函数保存在一个数组中，setImmediate()的结果则是保存在链表中。在行为上，process.nextTick()在每轮循环中会将数组中的回调函数全部执行完，而setImmediate()在每轮循环中执行链表中的一个回调函数。

```javascript
// 加入两个nextTick()的回调函数
process.nextTick(function () {
  console.log('nextTick延迟执行1');
});
process.nextTick(function () {
  console.log('nextTick延迟执行2');
});
// 加入两个setImmediate()的回调函数
setImmediate(function () {
  console.log('setImmediate延迟执行1');
  // 进入下次循环
  process.nextTick(function () {
    console.log('强势插入');
  });
});
setImmediate(function () {
  console.log('setImmediate延迟执行2');
});
console.log('正常执行');
```

## 5 Stream

![流抽象认识](http://segmentfault.com/img/bVcla6)

- 流是一种抽象的接口，node中很多对象都对它进行了实现。
- 所有流的对象都是**EventEmitter**的实例，都实现了**EventEmitter**的接口。
- 也就是流具有事件的能力，可以通过发射事件来反馈流的状态。这样我们就可以注册监听流的事件，来达到我们的目的。也就是我们订阅了流的事件，这个事件触发时，流会通知我，然后我就可以做相应的操作了。

### 5.1 为什么要使用流？

在node中读取文件的方式有来两种，一个是利用fs模块，一个是利用流来读取。如果读取小文件，我们可以使用fs读取，fs读取文件的时候，是将文件一次性读取到本地内存。而如果读取一个大文件，一次性读取会占用大量内存，效率很低，这个时候需要用流来读取。流是将数据分割段，一段一段的读取，效率很高。

![](https://pic2.zhimg.com/v2-8effc2872ff7de1c917c984b3123a80d_r.jpg)

```javascript
let reader = fs.createReadStream('in.txt');
let writer = fs.createWriteStream('out.txt');

reader.on('data', function(chunk) {
    writer.write(chunk);
});
reader.on('end', function() {
    writer.end();
});
```

### 5.2 流的分类

- Readable Stream :可读数据流
- Writeable Stream ：可写数据流
- Duplex Stream ：双向数据流，可以同时读和写
- Transform Stream： 转换数据流，可读可写，同时可以转换（处理）数据

### 5.3 读取流

#### 5.3.1 读取流的模式

- flowing: 可读流自动从系统底层读取数据，并通过EventEmitter接口的事件尽快将数据提供给应用。
- paused: 必须显示调用stream.read()方法来从流中读取数据片段

**注意**：如果可读流切换到流动模式，并且没有消费者处理流中的数据，这些数据将会丢失。

```javascript
var fs = require("fs");
var data = '';

// 创建可读流
var readerStream = fs.createReadStream('input.txt');

// 设置编码为 utf8。
readerStream.setEncoding('UTF8');

// 处理流事件 --> data, end, and error
readerStream.on('data', function(chunk) {
   data += chunk;
});

readerStream.on('end',function(){
   console.log(data);
});

readerStream.on('error', function(err){
   console.log(err.stack);
});

console.log("程序执行完毕");
```

### 5.4 写入流

```javascript
var fs = require("fs");
var data = '初始化内容';

// 创建一个可以写入的流，写入到文件 output.txt 中
var writerStream = fs.createWriteStream('output.txt');

// 使用 utf8 编码写入数据
writerStream.write(data,'UTF8');

// 标记文件末尾
writerStream.end();

// 处理流事件 --> data, end, and error
writerStream.on('finish', function() {
    console.log("写入完成。");
});

writerStream.on('error', function(err){
   console.log(err.stack);
});

console.log("程序执行完毕");
```

### 5.5 管道流
管道提供了一个输出流到输入流的机制。通常我们用于从一个流中获取数据并将数据传递到另外一个流中。

```javascript
var fs = require("fs");

// 创建一个可读流
var readerStream = fs.createReadStream('input.txt');

// 创建一个可写流
var writerStream = fs.createWriteStream('output.txt');

// 管道读写操作
// 读取 input.txt 文件内容，并将内容写入到 output.txt 文件中
readerStream.pipe(writerStream);

console.log("程序执行完毕");
```

### 5.6 链式流
链式是通过连接输出流到另外一个流并创建多个流操作链的机制。链式流一般用于管道操作。

```javascript
var fs = require("fs");
var zlib = require('zlib');

// 压缩 input.txt 文件为 input.txt.gz
fs.createReadStream('input.txt')
  .pipe(zlib.createGzip())
  .pipe(fs.createWriteStream('input.txt.gz'));

console.log("文件压缩完成。");
```

### 5.7 几个示例

```javascript
var http = require("http");
var fs = require("fs");

http.createServer(function(req, res) {
    fs.readFile(__dirname + "/test10.js", function(err, data) {
        if (err) {
            res.statusCode = 500;
            res.end(String(err));
        } else {
            res.end(data);
        }
    })
}).listen(8000);
```

思考：这个实现有什么问题吗？

**一个使用Stream的简单的静态web服务器**

```javascript
var http = require("http");
var fs = require("fs");

http.createServer(function(req, res) {
    fs.createReadStream(__dirname + "/test10.js").pipe(res);
}).listen(8000);
```
**使用gzip压缩静态web服务器**

```javascript
var http = require("http");
var fs = require("fs");
var zlib = require("zlib");

http.createServer(function(req, res) {
    res.writeHead(200, {
        "content-encoding": "gzip"
    });
    fs.createReadStream(__dirname + "/test10.js").pipe(zlib.createGzip()).pipe(res);

}).listen(8000);
```
### 5.8 Stream的错误处理

**在Stream处理过程中捕获错误**

```javascript
var fs = require("fs");

fs.createReadStream('Not found');

stream.on('error', function(err) {
    console.trace();
    console.error('Stack:', err.stack);
    console.error('The error raised was:', err);
});
```

### 5.9 自定义Stream
```javascript
let EventEmitter = require('events');
let fs = require('fs');
class WriteStream extends EventEmitter {
    constructor(path, options) {
        super();
        this.path = path;
        this.highWaterMark = options.highWaterMark || 16 * 1024;
        this.autoClose = options.autoClose || true;
        this.mode = options.mode;
        this.start = options.start || 0;
        this.flags = options.flags || 'w';
        this.encoding = options.encoding || 'utf8';

        // 可写流 要有一个缓存区，当正在写入文件是，内容要写入到缓存区中
        // 在源码中是一个链表 => []

        this.buffers = [];

        // 标识 是否正在写入
        this.writing = false;

        // 是否满足触发drain事件
        this.needDrain = false;

        // 记录写入的位置
        this.pos = 0;

        // 记录缓存区的大小
        this.length = 0;
        this.open();
    }
    destroy() {
        if (typeof this.fd !== 'number') {
            return this.emit('close');
        }
        fs.close(this.fd, () => {
            this.emit('close')
        })
    }
    open() {
        fs.open(this.path, this.flags, this.mode, (err, fd) => {
            if (err) {
                this.emit('error', err);
                if (this.autoClose) {
                    this.destroy();
                }
                return
            }
            this.fd = fd;
            this.emit('open');
        })
    }
    write(chunk, encoding = this.encoding, callback = () => {}) {
        chunk = Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk, encoding);
        // write 返回一个boolean类型
        this.length += chunk.length;
        let ret = this.length < this.highWaterMark; // 比较是否达到了缓存区的大小
        this.needDrain = !ret; // 是否需要触发needDrain
        // 判断是否正在写入 如果是正在写入 就写入到缓存区中
        if (this.writing) {
            this.buffers.push({
                encoding,
                chunk,
                callback
            }); // []
        } else {
            // 专门用来将内容 写入到文件内
            this.writing = true;
            this._write(chunk, encoding, () => {
                callback();
                this.clearBuffer();
            }); // 8
        }
        return ret;
    }
    clearBuffer() {
        let buffer = this.buffers.shift();
        if (buffer) {
            this._write(buffer.chunk, buffer.encoding, () => {
                buffer.callback();
                this.clearBuffer()
            });
        } else {
            this.writing = false;
            if (this.needDrain) { // 是否需要触发drain 需要就发射drain事件
                this.needDrain = false;
                this.emit('drain');
            }
        }
    }
    _write(chunk, encoding, callback) {
        if (typeof this.fd !== 'number') {
            return this.once('open', () => this._write(chunk, encoding, callback));
        }
        fs.write(this.fd, chunk, 0, chunk.length, this.pos, (err, byteWritten) => {
            this.length -= byteWritten;
            this.pos += byteWritten;

            callback(); // 清空缓存区的内容
        });
    }
}

module.exports = WriteStream;
```

### 5.10 缓存区
> 不管是可读流还是可写流都会将数据存储到内部的缓冲器中。缓冲器的大小取决于传递给流构造函数的highWaterMark选项。对于普通的流，highWaterMark指定了总共的字节数。对于工作在对象模式的流，指定了对象的总数。

## 6 Node调试

### 6.1 Debugger
```
node debug test.js
```
步进指令：

- cont or c
- next or n
- step or s, enter into inner of function
- out or o, go out from a function
- pause

通过断点进入交互提示后，通过步进指令还可以继续设置断点

- setBreakpoint() or sb()
- setBreakpoint(line) or sb(line)
- setBreakpoint('script.js', 1) or sb('script', 1)
- clearBreakpoint() or cb()

查看信息指令

- backtrace or bt
- list(5)
- watch(expr)
- unwatch(expr)
- watchers
- repl

对已经运行的进程启动调试
```
kill -s USR1 [pid]
```

### 6.2 DevTools

- Enter **about:inspect** in browser address
- Click **Open dedicated DevTools for Node**
- Run the following command to debug

```
node --inspect-brk test.js
```


参考资料：

- [Offical document](https://nodejs.org/dist/latest-v12.x/docs/api/documentation.html)
- [一步步分析 Node.js 的异步I/O机制](https://juejin.im/post/5cf4e86de51d45776031afa9)
- [nodejs中流(stream)的理解](https://segmentfault.com/a/1190000000519006)
- [nodejs中的管道流和链式流](https://blog.csdn.net/suwu150/article/details/76174937)
- [nodejs中的子进程](https://juejin.im/post/5b83f3f8f265da43464b100f)
