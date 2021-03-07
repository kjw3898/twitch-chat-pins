var true_check = false;
var filterPinedUserList = [];
const waitForElement = async selector => {
  while (document.querySelector(selector) === null) {
    await new Promise(resolve => requestAnimationFrame(resolve))
  }
  return document.querySelector(selector)
}
let pinedVODChatList;
let pinedLiveChatList;
const VODObserver = new MutationObserver(function (mutations) {
  mutations.forEach(function (mutation) {
    mutation.addedNodes.forEach(function (node) {
      if (node.tagName == 'LI') {
        let username = node.querySelector('[data-a-user]').dataset.aUser;
        if (filterPinedUserList.indexOf(username) != -1) {
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
        if (filterPinedUserList.indexOf(username) != -1) {
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
  })
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
  })
}
function main() {
  setTimeout(function () {
    console.log("Twitch chat pins activated!")
    true_check = true;
    initChatPins();
  }, 5000);
}

main();

