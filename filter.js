try {
  const waitForElement = async selector => {
    while (document.querySelector(selector) === null) {
      await new Promise(resolve => requestAnimationFrame(resolve))
    }
    return document.querySelector(selector)
  }
  const VODObserver = new MutationObserver(function (mutations) {
    mutations.forEach(function (mutation) {
      mutation.addedNodes.forEach(function (node) {
        if (node.tagName == 'LI') {


        }
      });
    });
  });

  const LIVEObserver = new MutationObserver(function (mutations) {
    mutations.forEach(function (mutation) {
      mutation.addedNodes.forEach(function (node) {
        if (node.className == "chat-line__message") {
          try {
            let username = node.querySelector("[data-a-user]").getAttribute('data-a-user');
            if (filterList.indexOf(username) != -1) {
              let fixChat = node.cloneNode(true);
              fixChat.style.cssText = "padding-left: 0px; padding-right: 0px";
              dupNode.appendChild(fixChat);
              if (dupNode.childNodes.length > 8) {
                dupNode.removeChild(dupNode.firstChild);
              }
            }
          } catch (error) {
            // TODO: Remove try/catch once the code is fully tested
            console.error(error)
            node.style.background = "rgba(255, 0, 255, 0.2)";
          }
        }

      });
    });
  });

  waitForElement('.chat-scrollable-area__message-container').then((selector) => {

    selector.classList.add("tw-border-b");
    let parentChatList = document.querySelector('div.chat-input');
    dupNode = selector.cloneNode(false);
    parentChatList.insertBefore(dupNode, parentChatList.firstChild);
    LIVEObserver.observe(selector, {
      childList: true
    });
  })
  waitForElement('.video-chat__message-list-wrapper').then((selector) => {

    selector.classList.add("tw-border-b");
    let parentChatList = document.querySelector('div.chat-input');
    dupNode = selector.cloneNode(false);
    parentChatList.insertBefore(dupNode, parentChatList.firstChild);
    VODObserver.observe(selector, {
      childList: true
    });
  })


} catch (e) {
  alert(e);
  console.log(e);
}