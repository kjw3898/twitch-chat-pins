var true_check = false;
var filterPinedUserList = [];
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
let pinedLiveChatList;
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
          fixChat.style.cssText = 'padding-left: 0px; padding-right: 0px';
          fixChat.querySelector('.chat-line__username-container').firstChild.remove();
          pinedLiveChatList.appendChild(fixChat);
          if (pinedLiveChatList.childNodes.length > 8) {
            pinedLiveChatList.removeChild(pinedLiveChatList.firstChild);
          }
        }
      }
    });
  });
});

const userCardObserver = new MutationObserver(function (mutations) {
  mutations.forEach(function (mutation) {
    mutation.addedNodes.forEach(function (node) {
      if (node.hasAttribute('data-a-target')) {
        if (node.dataset.aTarget == 'viewer-card') {
          let nickname = node.querySelector('figure[aria-label]').getAttribute('aria-label');
          console.log("found viewer-card." + nickname);
          let wisperButton = node.querySelector('button[data-a-target="usercard-whisper-button"]');
          let buttonParent = wisperButton.parentNode.parentNode.parentNode;
          let pinButtonDiv = wisperButton.parentNode.parentNode.cloneNode(true);
          let pinButton = pinButtonDiv.querySelector('[data-a-target="usercard-whisper-button"]');
          pinButton.removeAttribute("data-a-target");
          pinButton.removeAttribute("data-test-selector");
          pinButton.querySelector('[data-a-target="tw-core-button-label-text"]').innerText = chrome.i18n.getMessage('pinChatting');
          buttonParent.insertBefore(pinButtonDiv, buttonParent.childNodes[2]);
          filterPinedUserList.push(nickname);
          setFilterList();
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
    let parentChatList = document.querySelector('div.chat-input');
    pinedLiveChatList = selector.cloneNode(false);
    parentChatList.insertBefore(pinedLiveChatList, parentChatList.firstChild);
    parentChatList.classList.add('tw-border-t');
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

