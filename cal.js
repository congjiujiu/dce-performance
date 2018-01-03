const _ = require('lodash');

const getAvarageDuration = (ns) => {
  const all = ns.reduce((sum, value) => {
    return sum + value.duration;
  }, 0);

  return all / ns.length;
}

const getAvaReq = (network) => {
  return getAvarageDuration(network);
}

const getAvaXhrReq = (network) => {
  const _network = network.filter(v => v.initiatorType === 'xmlhttprequest');

  return getAvarageDuration(_network);
}

const getAvaSourceReq = (network) => {
  const _network = network.filter(v => ['link', 'script', 'img'].indexOf(v.initiatorType) !== -1);

  return getAvarageDuration(_network);
}

const getDocumentLoadTime = (loadTimes) => {
  return (loadTimes.finishDocumentLoadTime - loadTimes.startLoadTime) * 1000;
}

const getLoadTime = (timing) => {
  return timing.loadEventEnd - timing.navigationStart;
}

const getWhiteTime = (loadTimes) => {
  return (loadTimes.firstPaintTime - loadTimes.startLoadTime) * 1000;
}

const getXhrsTime = (xhrs) => {
  let allTimes = 0;
  let links = 0;
  _.forEach(xhrs, (v, k) => {
    allTimes += v.end - v.begin;
    links++;
  });

  return allTimes/links;
}

module.exports = {
  getAvaReq,
  getAvaXhrReq,
  getAvaSourceReq,
  getDocumentLoadTime,
  getLoadTime,
  getWhiteTime,
  getXhrsTime,
};