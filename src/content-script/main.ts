import Browser from 'webextension-polyfill';
import hijackXHR from './injectHijackXHR?script&module';
import { Config } from '../constants/config';
import {
  KEY_TWITTER_BOOKMARKS,
  MESSAGE_COLLECT_TWEETS_BOOKMARKS,
  MESSAGE_GET_PHASE_SPECIFIC_RAW_DATA,
  MESSAGE_ORIGIN_BACKGROUND,
  MESSAGE_SYNC_TO_PKM,
} from '../constants/twitter';
import { parseBookmarkResponse } from '../parser/twitter';

function insertScript() {
  const script = document.createElement('script');
  script.src = Browser.runtime.getURL(hijackXHR);
  console.log('script:', script);
  script.type = 'module';
  document.head.prepend(script);
}

insertScript();

Browser.runtime.onMessage.addListener(async function (
  message,
  sender,
  sendResponse: any,
) {
  console.log(
    'content JS chrome.runtime.onMessage.addListener:',
    JSON.stringify(message),
    typeof message,
  );
  if (message?.from === MESSAGE_ORIGIN_BACKGROUND) {
    console.log('Received message from background: ' + message, "type:", message.type);

    if (message?.type === MESSAGE_COLLECT_TWEETS_BOOKMARKS) {
      console.log('xi:Let us collect twitter bookmarks');
      collectTwitterBookmarks('message');
    }

    if (message?.type === MESSAGE_SYNC_TO_PKM) {
      console.log('xi:Let us SYNC_TO_PKM', message?.from);
      syncToPKM();
    }

    if (message?.type === MESSAGE_GET_PHASE_SPECIFIC_RAW_DATA) {
      const data = (localStorage as any).getItem(KEY_TWITTER_BOOKMARKS);
      const list = JSON.parse(data);
      const formattedData = list.map((x: TweetEntry) => parseBookmarkResponse(x))
      console.log("formattedData", formattedData);
      sendResponse({ data: formattedData });
      return true
    }
  }
});

await import('./loader');

let preScrollTop = 0;

//  测试专用
let count = 0;

function scroll() {
  window.scrollBy(0, 2000);

  count++;
  if (count > 3) {
    console.log('测试环境已经滚动到页面底部了！');
    return false;
  }

  var scrollTop = window.scrollY || document.documentElement.scrollTop;
  if (scrollTop === preScrollTop) {
    console.log('已经滚动到页面底部了！');
    return false;
  } else {
    preScrollTop = scrollTop;
  }
  return true;
}

function scrollUntilLastBookmark() {
  const scrollInterval = setInterval(function () {
    const hasNext = scroll();
    if (!hasNext) {
      clearInterval(scrollInterval); // 如果找到元素，停止滚动
      // 通知已经全部劫持完成
      localStorage.removeItem('TWITTER_BOOKMARKS_XHR_HIJACK');
    }
  }, 1000); // 每秒执行一次
}

function collectTwitterBookmarks(mode: string) {
  console.log(
    'fn collectTwitterBookmarks init',
    window.location.pathname,
    window.top === window,
    mode,
  );
  if (window.location.pathname !== '/i/bookmarks') {
    location.href = '/i/bookmarks';
  } else {
    // reload page for first XHR
  }
  // await delay(2000)
  // 让 XHR 开始劫持
  localStorage.setItem('TWITTER_BOOKMARKS_XHR_HIJACK', '1');
  console.log('让 XHR 开始劫持');
  // 页面滚动
  // 调用函数，传入你想要查找的元素的选择器
  // 哪个是到底部的标准
  // -api  的 entry 返回不是 22（20+2） 个。
  // 或者 翻到底了
  scrollUntilLastBookmark();
}

function syncToPKM() {
  console.log('fn syncToPKM init');
  console.log('task: parse storage data');
}
