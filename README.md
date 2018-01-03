# DCE proformance

使用了 [puppeteer](https://github.com/GoogleChrome/puppeteer) 来做自动性能测试

## 使用

```bash
git clone git@github.com:congjiujiu/dce-performance.git

cd dce-performance

yarn # or npm install

node index.js
```

需要更改 `index.js` 里面的 run 的 url 和 setPageEvents 函数内的 setExtraHTTPHeaders 的 token