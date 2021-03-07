try {
  var filterPinedUserList = []
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
        try {
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
        } catch (error) {
          // TODO: Remove try/catch once the code is fully tested
          console.error(error);
        }
      });
    });
  });

  const LIVEObserver = new MutationObserver(function (mutations) {
    mutations.forEach(function (mutation) {
      mutation.addedNodes.forEach(function (node) {
        if (node.className == 'chat-line__message') {
          try {
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
          } catch (error) {
            // TODO: Remove try/catch once the code is fully tested
            console.error(error);
          }
        }

      });
    });
  });
  waitForElement('.video-chat__message-list-wrapper').then((selector) => {

    let parentChatList = document.querySelector('div.qa-vod-chat');
    let pinedVODChatListParent = selector.cloneNode(false);
    pinedVODChatList = selector.querySelector('ul').cloneNode(false);
    pinedVODChatListParent.appendChild(pinedVODChatList);
    pinedVODChatListParent.classList.replace('video-chat__message-list-wrapper', 'tw-border-b')
    pinedVODChatListParent.classList.add('tw-border-b');
    parentChatList.insertBefore(pinedVODChatListParent, parentChatList.lastChild);
    VODObserver.observe(selector, {
      attributes: false,
      childList: true,
      subtree: true
    });
  })
  waitForElement('.chat-scrollable-area__message-container').then((selector) => {

    selector.classList.add('tw-border-b');
    let parentChatList = document.querySelector('div.chat-input');
    pinedLiveChatList = selector.cloneNode(false);
    parentChatList.insertBefore(pinedLiveChatList, parentChatList.firstChild);
    LIVEObserver.observe(selector, {
      attributes: false,
      childList: true,
      subtree: false
    });
  })



} catch (e) {
  alert(e);
  console.log(e);
}