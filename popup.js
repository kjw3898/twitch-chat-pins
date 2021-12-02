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
    document.getElementById('btnPinManager').checked = localStorage.getItem('PinManager') === 'true';
    document.getElementById('btnPinManager').addEventListener('change', function() {ToggleButton('PinManager')});
    document.getElementById('pinManagerLabel').innerHTML = chrome.i18n.getMessage('PinManagerLabel');
    document.getElementById('btnPinVIP').checked = localStorage.getItem('PinVIP') === 'true';
    document.getElementById('btnPinVIP').addEventListener('change', function(){ToggleButton('PinVIP')});
    document.getElementById('pinVIPLabel').innerHTML = chrome.i18n.getMessage('PinVIPLabel');
    document.getElementById('inputBody').addEventListener('keyup', enterkey);
    document.getElementById('title').innerHTML = chrome.i18n.getMessage('appName');
    document.getElementById('page-title').innerHTML = chrome.i18n.getMessage('appName');
    document.getElementById('user-id').innerHTML = chrome.i18n.getMessage('userID');
    document.getElementById('remove-user').innerHTML = chrome.i18n.getMessage('removeUser');
    document.getElementById('inputBody').setAttribute("placeholder", chrome.i18n.getMessage('inputPlaceholder'));
    document.getElementById('btnAddWord').innerHTML = chrome.i18n.getMessage('addButton');
    document.getElementById("inputBody").focus();
});

function ToggleButton(name) {
    var buttonState = document.getElementById('btn' + name).checked
    localStorage.setItem(name, buttonState);
    console.log(name + ' ' + localStorage.getItem(name))
    chrome.runtime.sendMessage({ method: 'set' + name, buttonState: buttonState }, function (response) {
        console.log(response.data);
    });
}
function setButton(name) {
    
}

function enterkey() {
    if (window.event.keyCode == 13) { // enter key
        AddWord();
    }
}

function AddWord() {
    var inputBody = document.getElementById('inputBody');
    if (inputBody.value == '' || inputBody.value == null) {
        alert('Please enter an username.');
        return false;
    }
    if (filterList.indexOf(inputBody.value) != -1) {
        alert('This username already exists.');
        return false;
    }
    filterList.push(inputBody.value);
    AddTableItem(inputBody.value);
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
    setTimeout(function() {
        tr.className = tr.className + "-show";
      }, 10);
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
        parentTR.className = parentTR.className.replace('-show', '');
        setTimeout(function() {
            parentTR.remove();
          }, 400);
        setFilterList();
    }
}