var true_check = false;
var filterPinedUserList = [];
var lessMode = false;

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

const VODObserver = new MutationObserver(function (mutations) {
  mutations.forEach(function (mutation) {
    mutation.addedNodes.forEach(function (node) {
      if (node.tagName == 'LI') {
        let username = node.querySelector('[data-a-user]').dataset.aUser;
        let nickname = node.querySelector('[data-a-user]').innerText;
        if (filterPinedUserList.indexOf(username) != -1 || filterPinedUserList.indexOf(nickname) != -1) {
          let fixChat = node.cloneNode(true);
          fixChat.querySelector('.chat-badge').remove();
          fixChat.querySelector('[data-a-target="chat-badge"]').remove();
          pinedVODChatList.appendChild(fixChat);
          if (pinedVODChatList.childNodes.length > 8) {
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
        if (filterPinedUserList.indexOf(username) != -1 || filterPinedUserList.indexOf(nickname) != -1) {
          let fixChat = node.cloneNode(true);
          pinedLiveChatList.appendChild(fixChat);
          resizePinnedChatList();
          if(pinedLiveChatList.childElementCount>400){
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
  let maxHeightPoint = 0.3;  //need relation value for theatre mode (video and chat vertical arrangement)
  let maxHeight = '30%';
  let lessThreshold = 76.2;
  let pinedChatListHeight = pinedLiveChatList.offsetHeight + 12.4; //for safty badge height (each 0.6) + lessbutton(10px)
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

function lessButtonCilck() { //lessButton Click Event Handler
  lessMode = !lessMode;
  resizePinnedChatList();
}

//Answer background.js handshake
chrome.runtime.onMessage.addListener(function (msg, sender, sendResponse) {
  if (msg.text === 'check') {
    sendResponse({ status: 'confirmed' });
  }
  if ('urlChanged' in msg) {
    true_check = true;
    setTimeout(initChatPins, 5000);
    sendResponse({ status: 'ok' })
  }
  if ('filterList' in msg) {
    filterPinedUserList = msg.filterList.slice();
    setTimeout(initChatPins, 5000);
    sendResponse({ status: 'ok' })
  }
});

function initChatPins() {
  if (!true_check) { return }
  true_check = false;
  getFilterList();
  waitForElement('[data-a-target="chat-user-card"]').then((selector) => { // chat observer
    userCardObserver.disconnect();
    userCardObserver.observe(selector, {
      attributes: false,
      childList: true,
      subtree: true
    });
  });
  //vod chat observer
  waitForElement('.video-chat__message-list-wrapper').then((selector) => {
    let parentChatList = document.querySelector('div.qa-vod-chat');
    let pinedVODChatListParent = selector.cloneNode(false);
    pinedVODChatList = selector.querySelector('ul').cloneNode(false);
    pinedVODChatListParent.appendChild(pinedVODChatList);
    pinedVODChatListParent.classList.replace('video-chat__message-list-wrapper', 'tw-border-b')
    parentChatList.insertBefore(pinedVODChatListParent, parentChatList.lastChild);
    VODObserver.disconnect();
    VODObserver.observe(selector, {
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
    // Main Twitch Chat
    let parentChatList = document.querySelector('div.chat-list--default');
    scrollableChatList = selector.parentElement.parentElement.parentElement.parentElement.cloneNode(true);
    // hide at initization by setting min and max height both needs to be set resizes with main chat
    scrollableChatList.style.minHeight = '0px';
    scrollableChatList.style.maxHeight = '0px';
    scrollableChatList.style.borderBottom = 'var(--border-width-default) solid var(--color-border-base)';
    pinnedLiveChatScrollView = scrollableChatList.querySelector('.simplebar-scroll-content')
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
  }, 5000);
}

main();

