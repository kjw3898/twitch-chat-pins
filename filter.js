var true_check = false;
var filterPinedUserList = [];
var lessMode = false;

const filterBlackListUser = ['ssakdook', 'nightbot', 'bbangddeock', 'streamelements', 'moobot', 'fossabot', 'twipkr'];
const modFilterList = ['Moderator', 'Broadcaster', '매니저', '스트리머']
// Check if chat contains broadcaster or manager badge
const managerSelectorString = 'img[alt="스트리머"].chat-badge, img[alt="Broadcaster"].chat-badge, img[alt="매니저"].chat-badge,  img[alt="Moderator"].chat-badge'
const vipSelectorString = 'img[alt="VIP"].chat-badge'
var pinManager = false;
var pinVIP = false;

const waitForElement = async selector => {
  while (document.querySelector(selector) === null) {
    await new Promise(resolve => requestAnimationFrame(resolve))
  }
  return document.querySelector(selector)
}
function getFilterList() {
  chrome.runtime.sendMessage({ method: "getFilterList" }, function (response) {
    console.log(response.data);
  });
}

function setFilterList() {
  chrome.runtime.sendMessage({ method: "setFilterList", filterList: filterPinedUserList }, function (response) {
    console.log(response.data);
  });
}
function getPinManager() {
  chrome.runtime.sendMessage({ method: "getPinManager" }, function (response) {
    console.log(response.data);
  });
}
function setPinManager() {
  chrome.runtime.sendMessage({ method: "setPinManager", pinManager: pinManager }, function (response) {
    console.log(response.data);
  });
}
function getPinVIP() {
  chrome.runtime.sendMessage({ method: "getPinVIP" }, function (response) {
    console.log(response.data);
  });
}
function setPinVIP() {
  chrome.runtime.sendMessage({ method: "setPinVIP", pinVIP: pinVIP }, function (response) {
    console.log(response.data);
  });
}

let temp_nickname = "";
function PinButtonCilck(e) {
  if (filterPinedUserList.indexOf(temp_nickname) != -1) {
    filterPinedUserList.pop(temp_nickname);
    e.target.innerText = chrome.i18n.getMessage('pinChatting');
  }
  else {
    if (temp_nickname) {
      filterPinedUserList.push(temp_nickname);
      e.target.innerText = chrome.i18n.getMessage('unpinChatting');
    }
  }
  setFilterList();
}

function addPinButton(node) {
  temp_nickname = node.querySelector('figure[aria-label]').getAttribute('aria-label');
  let wisperButton = node.querySelector('button[data-a-target="usercard-whisper-button"]');
  if (wisperButton) {
    let buttonParent = wisperButton.parentNode.parentNode.parentNode;
    let pinButtonDiv = wisperButton.parentNode.parentNode.cloneNode(true);
    let pinButton = pinButtonDiv.querySelector('[data-a-target="usercard-whisper-button"]');
    pinButton.removeAttribute("data-a-target");
    pinButton.removeAttribute("data-test-selector");
    if (filterPinedUserList.indexOf(temp_nickname) != -1) {
      pinButton.querySelector('[data-a-target="tw-core-button-label-text"]').innerText = chrome.i18n.getMessage('unpinChatting');
    } else {
      pinButton.querySelector('[data-a-target="tw-core-button-label-text"]').innerText = chrome.i18n.getMessage('pinChatting');
    }
    pinButton.addEventListener("click", PinButtonCilck, false);
    buttonParent.insertBefore(pinButtonDiv, buttonParent.childNodes[2]);
  }
}

let pinedVODChatList;             // VOD chat messeage list
let pinedLiveChatList;            // live chat messages list
let scrollableChatList;           // main chat list (use for resizing)
let pinnedLiveChatScrollView;     // scrollable live chat view
let pinnedVODChatScrollView;     // scrollable vod chat view
const maxChatHeight = 200;        // Max height for pinned chats

const VODObserver = new MutationObserver(function (mutations) {
  mutations.forEach(function (mutation) {
    mutation.addedNodes.forEach(function (node) {
      if (node.tagName == 'LI' && node.querySelectorAll('.vod-message--user-notice').length == 0) {
        let username = node.querySelector('[data-a-user]').dataset.aUser;
        let nickname = node.querySelector('[data-a-user]').innerText;
        
        if (filterPinedUserList.indexOf(username) != -1 || filterPinedUserList.indexOf(nickname) != -1 
          || (pinManager && node.querySelectorAll(managerSelectorString).length > 0 && !filterBlackListUser.includes(username.toLowerCase())) 
          || (pinVIP && node.querySelectorAll(vipSelectorString).length > 0)) {
          let fixChat = node.cloneNode(true);
          pinedVODChatList.appendChild(fixChat);

          resizeVODPinnedChatList(node);
          if (pinedVODChatList.childNodes.length > 400) {
            pinedVODChatList.removeChild(pinedVODChatList.firstChild);
          }
        }
      }
    });
  });
});

const LIVEObserver = new MutationObserver(function (mutations) {
  mutations.forEach(function (mutation) {
    mutation.addedNodes.forEach(function (node) {
      if (node.className == 'chat-line__message') {
        let username = node.querySelector('[data-a-user]').dataset.aUser;
        let nickname = node.querySelector('[data-a-user]').innerText;
        if (filterPinedUserList.indexOf(username) != -1 || filterPinedUserList.indexOf(nickname) != -1 
          || (pinManager && node.querySelectorAll(managerSelectorString).length > 0 && !filterBlackListUser.includes(username.toLowerCase())) 
          || (pinVIP && node.querySelectorAll(vipSelectorString).length > 0)) {
          let fixChat = node.cloneNode(true);
          if (fixChat.querySelector('.chat-line__message-highlight')) fixChat.querySelector('.chat-line__message-highlight').remove();
          if (fixChat.querySelector('.chat-line__reply-icon')) fixChat.querySelector('.chat-line__reply-icon').remove();
          pinedLiveChatList.appendChild(fixChat);
          resizePinnedChatList();
          if(pinedLiveChatList.childElementCount > 400) {
            pinedLiveChatList.removeChild(pinedLiveChatList.firstChild);  //for memory safty remove old chat over 400
          }
        }
      }
    });
  });
});

const userCardObserver = new MutationObserver(function (mutations) {
  mutations.forEach(function (mutation) {
    mutation.addedNodes.forEach(function (node) {
      if (node.nodeName != "#text") {
        if (node.getAttribute('data-a-target') == 'viewer-card') {
          addPinButton(node);
        }
        else {
          node = node.querySelector('[data-a-target="viewer-card"]');
          if (node) {
            addPinButton(node);
          }
        }
      }
    })
  })
});

function resizePinnedChatList() {
  let maxHeightPoint = 0.2;  //need relation value for theatre mode (video and chat vertical arrangement)
  let maxHeight = '20%';
  let lessThreshold = 76.2;
  let pinedChatListHeight = pinedLiveChatList.offsetHeight + 12.4 * !!pinedLiveChatList.offsetHeight; //for safty badge height (each 0.6) + lessbutton(10px)
  let chatListHeight = scrollableChatList.parentElement.offsetHeight;
  if (lessMode) {     //in less mode
    if (pinedChatListHeight > lessThreshold) {
      maxHeight = lessThreshold + 'px';
      scrollableChatList.style.minHeight = maxHeight;
    }
    else {
      scrollableChatList.style.minHeight = pinedChatListHeight;
    }
  }
  else {    //not in less mode
    if ((pinedChatListHeight / chatListHeight) < maxHeightPoint) {
      scrollableChatList.style.minHeight = pinedChatListHeight + 'px';
    }
    else {
      scrollableChatList.style.minHeight = maxHeight;
    }
  }
  scrollableChatList.style.maxHeight = scrollableChatList.style.minHeight;
  // scroll to bottom
  // TODO: Add a stop if scrolled up
  pinnedLiveChatScrollView.scrollTop = pinnedLiveChatScrollView.scrollHeight;
}

function resizeVODPinnedChatList() {
  let maxHeightPoint = 0.2;  //need relation value for theatre mode (video and chat vertical arrangement)
  let maxHeight = '20%';
  let lessThreshold = 76.2;
  let pinedChatListHeight = pinedVODChatList.scrollHeight + 12.4 * !!pinedVODChatList.scrollHeight; //for safty badge height (each 0.6) + lessbutton(10px)
  let chatListHeight = scrollableChatList.parentElement.offsetHeight;
  if (lessMode) {     //in less mode
    if (pinedChatListHeight > lessThreshold) {
      maxHeight = lessThreshold + 'px';
      scrollableChatList.style.minHeight = maxHeight;
    }
    else {
      scrollableChatList.style.minHeight = pinedChatListHeight;
    }
  }
  else {    //not in less mode
    if ((pinedChatListHeight / chatListHeight) < maxHeightPoint) {
      scrollableChatList.style.minHeight = pinedChatListHeight + 'px';
    }
    else {
      scrollableChatList.style.minHeight = maxHeight;
    }
  }
  scrollableChatList.style.maxHeight = scrollableChatList.style.minHeight;
  // scroll to bottom
  // TODO: Add a stop if scrolled up
  scrollableChatList.scrollTop = scrollableChatList.scrollHeight;
}

function lessButtonCilck() { //lessButton Click Event Handler
  lessMode = !lessMode;
  resizePinnedChatList();
}

//Answer background.js handshake
chrome.runtime.onMessage.addListener(function (msg, sender, sendResponse) {
  if (msg.text === 'check') {
    sendResponse({ status: 'confirmed' });
  }
  else if ('urlChanged' in msg) {
    true_check = true;
    setTimeout(initChatPins, 5000);
    sendResponse({ status: 'ok' })
  }
  else if ('filterList' in msg) {
    filterPinedUserList = msg.filterList.slice();
    setTimeout(initChatPins, 5000);
    sendResponse({ status: 'ok' })
  }
  else if ('pinManager' in msg) {
    pinManager = msg.pinManager === 'true';
    sendResponse({ status: 'ok' })
  }
  else if ('pinVIP' in msg) {
    pinVIP = msg.pinVIP === 'true';
    console.log('filter.js vip set ' + pinVIP);
    sendResponse({ status: 'ok' })
  }
});

function initChatPins() {
  if (!true_check) { return }
  true_check = false;
  getFilterList();
  getPinManager();
  getPinVIP();
  waitForElement('[data-a-target="chat-user-card"]').then((selector) => {
    userCardObserver.disconnect();
    userCardObserver.observe(selector, {
      attributes: false,
      childList: true,
      subtree: true
    });
  });
  //vod chat observer
  waitForElement('.video-chat__message-list-wrapper ul').then((selector) => {
    if (document.querySelectorAll('div.video-chat__message-list-wrapper').length > 1) {
      pinedVODChatList.innerHTML = '';
      scrollableChatList.style.minHeight = '0px';
      scrollableChatList.style.maxHeight = '0px';
      return;
    }
    let chatListSelector = document.querySelector('div.video-chat__message-list-wrapper');
    let parentChatList = document.querySelector('div.video-chat__message-list-wrapper').parentNode.parentNode;
    scrollableChatList = chatListSelector.cloneNode(true);
    // hide at initization by setting min and max height both needs to be set resizes with main chat
    scrollableChatList.style.minHeight = '0px';
    scrollableChatList.style.maxHeight = '0px';
    scrollableChatList.style.boxShadow = 'inset 0 -1px 0 0 rgb(255 255 255 / 10%)';
    pinedVODChatList = scrollableChatList.querySelector('ul');
    parentChatList.insertBefore(scrollableChatList, parentChatList.lastChild);
    VODObserver.disconnect();
    VODObserver.observe(chatListSelector, {
      attributes: false,
      childList: true,
      subtree: true
    });
  });
  //live chat observer
  waitForElement('.chat-scrollable-area__message-container').then((selector) => {
    //prevent duplicate
    if (document.querySelectorAll('.chat-scrollable-area__message-container').length > 1) {
      return;
    }
    // Main Twitch Chat document.querySelector('div.chat-list--default')
    let parentChatList = document.querySelector('div[class*=chat-list]');
    scrollableChatList = selector.parentElement.parentElement.parentElement.parentElement.cloneNode(true);
    // hide at initization by setting min and max height both needs to be set resizes with main chat
    scrollableChatList.style.minHeight = '0px';
    scrollableChatList.style.maxHeight = '0px';
    scrollableChatList.style.borderBottom = 'var(--border-width-default) solid var(--color-border-base)';
    //scrollableChatList.style.boxShadow = 'inset 0 -1px 0 0 rgb(255 255 255 / 10%)';
    pinnedLiveChatScrollView = scrollableChatList.querySelector('.simplebar-scroll-content');
    pinedLiveChatList = scrollableChatList.querySelector('.chat-scrollable-area__message-container');
    pinedLiveChatList.className = pinedLiveChatList.className.replace('tw-pd-b-1', '');
    pinedLiveChatList.style.padding = '0px';
    pinedLiveChatList.innerHTML = ''; // Clear pinned chat list
    parentChatList.insertBefore(scrollableChatList, parentChatList.firstChild);
    var moreButtonDiv = document.createElement("div"); //add less more control button
    moreButtonDiv.innerHTML = '<div class="tw-flex tw-full-width tw-justify-content-center" style="padding: .25rem"><div class="channel-leaderboard-header-rotating__expand-grabber tw-border-radius-large tw-c-background-alt-2" style="height: 0.5rem; width: 4rem;"></div></div>';
    moreButtonDiv.addEventListener("click", lessButtonCilck, false);
    scrollableChatList.appendChild(moreButtonDiv);
    window.addEventListener('resize', resizePinnedChatList);
    LIVEObserver.disconnect();
    LIVEObserver.observe(selector, {
      attributes: false,
      childList: true,
      subtree: false
    });
  });
}
function main() {
  setTimeout(function () {
    console.log("Twitch chat pins activated!")
    true_check = true;
    initChatPins();
  }, 100);
}

main();
