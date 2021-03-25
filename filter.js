var true_check = false;
var filterPinedUserList = [];
var lessMode = true;
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

let pinedVODChatList;
let pinedLiveChatList;            // chat messages list
let scrollableChatList;           // main chat list (use for resizing)
let pinnedLiveChatScrollView;     // scrollable live chat view
const maxChatHeight = 200;        // Max height for pinned chats

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
          //fixChat.style.cssText = 'padding-left: 0px; padding-right: 0px';
          //fixChat.querySelector('.chat-line__username-container').firstChild.remove();
          pinedLiveChatList.appendChild(fixChat);

          ResizePinnnedChatList(node);
          //hideChatOverTwo();
        }
      }
    });
  });
});

// resize pinned chat list
function ResizePinnnedChatList(node) {
  let chatListHeight = scrollableChatList.offsetHeight + node.offsetHeight + (scrollableChatList.offsetHeight > 10 ? 0 : 10);
  scrollableChatList.style.minHeight = chatListHeight > maxChatHeight ? maxChatHeight + 'px' : chatListHeight + 'px';
  scrollableChatList.style.maxHeight = scrollableChatList.style.minHeight;
  // scroll to bottom
  // TODO: Add a stop if scrolled up
  pinnedLiveChatScrollView.scrollTop = pinnedLiveChatScrollView.scrollHeight;
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
function hideChatOverTwo() {
  let parentChatList = document.querySelector('div.chat-input');
  let chatList = parentChatList.querySelectorAll('div.chat-input .chat-line__message');
  let moreButtonDiv = parentChatList.firstChild;
  if (lessMode && chatList.length > 2) {
    let nowTransform = moreButtonDiv.firstChild.style.transform;
    if (!nowTransform) {
      moreButtonDiv.innerHTML = '<svg version="1.1" viewBox="0 0 20 20" x="0px" y="0px" ><g><path d="M13.5 14.5L9 10l4.5-4.5L12 4l-6 6 6 6 1.5-1.5z"></path></g></svg>';
      moreButtonDiv.setAttribute("style", "display: table;margin-left: auto;margin-right: auto;height: 15px;");
      moreButtonDiv.firstChild.setAttribute("style", "fill: currentColor;transform: rotate(90deg);height: 15px;");
      moreButtonDiv.firstChild.addEventListener("click", moreButtonCilck, false);
    } else if (nowTransform != "rotate(90deg)") {
      moreButtonDiv.firstChild.setAttribute("style", "fill: currentColor;transform: rotate(90deg);height: 15px;");
    }
    for (let i = 0; i < chatList.length - 2; i++) {
      chatList[i].style.display = "none";
    }
  }
  else {
    if (chatList.length > 2) {
      moreButtonDiv.firstChild.setAttribute("style", "fill: currentColor;transform: rotate(270deg);height: 15px;");
    }
    for (let i = 0; i < chatList.length; i++) {
      chatList[i].style.display = "block";
    }
  }
}
function moreButtonCilck(e) {
  lessMode = !lessMode;
  hideChatOverTwo();
}

// Clear pinned chat list
function clearPinnedChat() {
  pinedLiveChatList.innerHTML = '';
}

function initChatPins() {
  if (!true_check) { return }
  true_check = false;
  getFilterList();
  waitForElement('[data-a-target="chat-user-card"]').then((selector) => {
    userCardObserver.disconnect();
    userCardObserver.observe(selector, {
      attributes: false,
      childList: true,
      subtree: true
    });
  });
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
  waitForElement('.chat-scrollable-area__message-container').then((selector) => {
    if (document.querySelectorAll('.chat-scrollable-area__message-container').length > 1) {
      return;
    }
    // Main Twitch Chat
    let parentChatList = document.querySelector('div.chat-list--default');
    scrollableChatList = selector.parentElement.parentElement.parentElement.parentElement.cloneNode(true);
    // hide at initization by setting min and max height both needs to be set resizes with main chat
    scrollableChatList.style.minHeight = '0px';
    scrollableChatList.style.maxHeight = '0px';
    pinnedLiveChatScrollView = scrollableChatList.querySelector('.simplebar-scroll-content')
    pinedLiveChatList = scrollableChatList.querySelector('.chat-scrollable-area__message-container');
    clearPinnedChat();
    scrollableChatList.classList.add('tw-border-b');
    parentChatList.insertBefore(scrollableChatList, parentChatList.firstChild);
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

