var filterList = null;
document.addEventListener('DOMContentLoaded', function () {
    filterList = JSON.parse(localStorage.getItem('filterList'));
    var btnAddWord = document.getElementById('btnAddWord');
    btnAddWord.addEventListener('click', AddWord);
    if (filterList == null) {
        filterList = [];
    } else {
        CreateTable();
    }
    document.getElementById('inputBody').addEventListener('keyup', enterkey);
    document.getElementById('title').innerHTML = chrome.i18n.getMessage('appName');
    document.getElementById('page-title').innerHTML = chrome.i18n.getMessage('appName');
    document.getElementById('user-id').innerHTML = chrome.i18n.getMessage('userID');
    document.getElementById('remove-user').innerHTML = chrome.i18n.getMessage('removeUser');
    document.getElementById('inputBody').setAttribute("placeholder", chrome.i18n.getMessage('inputPlaceholder'));
    document.getElementById('btnAddWord').innerHTML = chrome.i18n.getMessage('addButton');
    document.getElementById("inputBody").focus();
});

function enterkey() {
    if (window.event.keyCode == 13) { // enter key
        AddWord();
    }
}

function AddWord() {
    var inputBody = document.getElementById('inputBody');
    if (inputBody.value == '' || inputBody.value == null) {
        alert('please input username.');
        return false;
    }
    if (filterList.indexOf(inputBody.value) != -1) {
        alert('this username is exist : ' + inputBody.value);
        return false;
    }
    AddTableItem(inputBody.value);
    filterList.push(inputBody.value);
    inputBody.value = '';
}

function CreateTable() {
    for (var i = 0; i < filterList.length; i++) {
        AddTableItem(filterList[i]);
    }
}

function AddTableItem(filterWord) {
    var listBody = document.getElementById('filterListBody');

    var tr = document.createElement('tr');
    var tdWord = document.createElement('td');
    var tdDestroy = document.createElement('td');
    var btDestroy = document.createElement('button');
    var trashDestroy = document.createElement('span');
    trashDestroy.setAttribute('class', 'trash')
    btDestroy.setAttribute('type', 'button');
    btDestroy.setAttribute('class', 'btn btn-danger btn-sm trashbutton');
    btDestroy.addEventListener('click', DeleteTableItem);
    btDestroy.appendChild(trashDestroy);
    tdDestroy.setAttribute('class', 'align-middle col-sm-3');
    tdDestroy.appendChild(btDestroy);
    tdWord.setAttribute('class', 'align-middle col-sm-9');
    tdWord.innerHTML = filterWord;
    tr.setAttribute('class', 'row');
    tr.appendChild(tdWord);
    tr.appendChild(tdDestroy);
    listBody.appendChild(tr);
    localStorage.removeItem('filterList');
    localStorage.setItem('filterList', JSON.stringify(filterList));
    setFilterList();
}
function setFilterList() {
    chrome.runtime.sendMessage({ method: "setFilterList", filterList: filterList }, function (response) {
      console.log(response.data);
    });
  }


function DeleteTableItem(e) {
    var parentTR = e.target.parentNode.parentNode.parentNode;
    var index = filterList.indexOf(parentTR.querySelector('td').innerText);
    if (index != -1) {
        filterList.splice(index, 1);
        parentTR.remove();
        setFilterList();
    }
}