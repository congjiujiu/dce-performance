const puppeteer = require('puppeteer');
const _ = require('lodash');

const cal = require('./cal.js');

const xhrs = {};
const sources = {};

const times = {};
const dom = {};

// 设定 page 的监听
const setPageEvents = async (page, domain) => {
  page.on('console', (msg) => {
    msg.args.forEach(v => {
      v.jsonValue().then(res => {
        // console.log('onlog', res);
      })
    });
  });

  page.on('pageerror', msg => {
    console.log(msg);
  });

  page.on('request', request => {
    const date = +(new Date());
    if (request.url.indexOf('data:') === 0 || request.url.indexOf(domain) === -1) return;

    const urlSplits = request.url.split('.');
    const lastWord = urlSplits[urlSplits.length - 1];

    if (['js', 'css', 'svg', 'png', 'gif'].indexOf(lastWord) !== -1) {
      // console.log(`source: ${request.url}`);
      sources[request.url] = {
        begin: date,
      };
    } else {
      // console.log(`xhr: ${request.url}`);
      xhrs[request.url] = {
        begin: date,
      };
    }
  });

  page.on('requestfinished', response => {
    const date = +(new Date());
    if (response.url.indexOf('data:') === 0 || response.url.indexOf(domain) === -1) return;

    const urlSplits = response.url.split('.');
    const lastWord = urlSplits[urlSplits.length - 1];

    if (['js', 'css', 'svg', 'png', 'gif'].indexOf(lastWord) !== -1) {
      // console.log(`source: ${response.url} - ${date - sources[response.url].begin}ms`);
      sources[response.url].end = date;
    } else {
      // console.log(`xhr: ${response.url} - ${date - xhrs[response.url].begin}ms`);
      xhrs[response.url].end = date;
    }
  });

  page.on('load', () => {
    console.log(`loaded`);
  });

  page.setExtraHTTPHeaders({
    'x-dce-access-token': 'eyJhbGciOiJIUzI1NiIsImV4cCI6MTUxNzU4ODQzMiwiaWF0IjoxNTE0OTk2NDMyfQ.eyJ1c2VybmFtZSI6ImNvbmcifQ.xSRno7fkQBev2FcX0qiSVgMXSAXHWWCBcq9MnEpPRLw',
  });

  return Promise.resolve(page);
}

// 获取一些特定时间
const getPageTimes = async (page) => {
  times.xhr = cal.getXhrsTime(xhrs);

  // await page.addScriptTag({
  //   content: `console.log({type: 'loadTimes', value: window.chrome.loadTimes()})`,
  // });
  const loadTimes = await page.evaluate(() => {
    return Promise.resolve(window.chrome.loadTimes());
  });

  const timing = await page.evaluate(() => {
    return Promise.resolve(window.performance.timing.toJSON());
  });

  const network = await page.evaluate(() => {
    return Promise.resolve(window.performance.getEntries().map(v => v.toJSON()));
  });

  const totalJSHeapSize = await page.evaluate(() => {
    return Promise.resolve(window.performance.memory.totalJSHeapSize);
  });

  const usedJSHeapSize = await page.evaluate(() => {
    return Promise.resolve(window.performance.memory.usedJSHeapSize);
  });

  times.white = cal.getWhiteTime(loadTimes);
  times.domContentLoad = cal.getDocumentLoadTime(loadTimes);
  times.load = cal.getLoadTime(timing);
  times.avarageRequest = cal.getAvaReq(network);
  times.avarageXhr = cal.getAvaXhrReq(network);
  times.avarageSource = cal.getAvaSourceReq(network);
  times.totalJSHeapSize = totalJSHeapSize;
  times.usedJSHeapSize = usedJSHeapSize;

  return Promise.resolve(times);
}

// 获取 dom 相关
const getDomData = async (page) => {
  const dom_numbers = await page.evaluate(() => {
    return Promise.resolve(document.querySelectorAll('*').length);
  });

  dom.domNumbers = dom_numbers;

  return Promise.resolve(dom);
}

const run = async (domain) => {
  const browser = await puppeteer.launch({
    ignoreHTTPSErrors: true,
    headless: false,
    devtools: true,
  });
  const page = await browser.newPage();

  try {
    await setPageEvents(page, 'http://192.168.123.2');
    await page.goto(domain, {
      timeout: 1000000,
      waitUntil: 'networkidle2',
    });

    await getPageTimes(page);
    await getDomData(page);

    let now = +new Date();

    const waitAppList = () => {
      return page.waitForSelector('#app .app-list .dao-table-toolbar .dao-btn');
    }
    
    const waitCreateAppDialog = () => {
      return page.waitForSelector('#app .application-detail');
    }

    const waitAppDetailMoreMenu = () => {
      return page.waitForSelector('#app-detail-more-menu');
    }

    await page.click('.dao-left-nav .dao-left-nav-section:nth-child(4) .dao-left-nav-group:nth-child(2) .dao-left-nav-ul-title')
    await waitAppList();
    await getDomData(page);
    console.log(`查看应用列表 ${(+new Date()) - now}ms`);
    now = +new Date();

    // await page.click('#app .app-list .dao-table tbody tr:first-child .name .item-logo-text .item-major a');
    // await waitCreateAppDialog();
    // console.log(`应用详情 ${(+new Date()) - now}`);
    // now = +new Date();

    // await page.click('#app .application-detail #app-detail-more-btn');
    // await waitAppDetailMoreMenu();
    // console.log(`应用详情更多菜单 ${(+new Date()) - now}`);
    // now = +new Date();

    console.log(times);
    console.log(dom);
    console.log(cal.calcXhrs(xhrs));
    // console.log(timing);
    // console.log(network);

  } catch (err) {
    console.error(err);
  }

  // await browser.close();
};

run('http://localhost:8013');