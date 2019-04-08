function ContactSheet()
{
    this.sheetInfo = {
        parentElement: null,
        columnList: [],
        allColumnList: [],
        contactList: [],
        deletedContactList: [],
        contactGroupList: [],
        filteredContactList: [],

        mainMenu: null,
        toolbar: null,
        columnWindow: null,
        rowIndexWindow: null,
        cellWindow: null,
        pagerWindow: null,
        groupMenu: null,

        contactIO: null,
        actionHandler: null,
        clipboardManager: null,
        undoManager: null,

        rowsPerPage: 1000,
        currentPage: 1,
        defaultColWidth: '100px',
        defaultRowHeight: '30px',
        currentCell: {col: 0, row: 0},
        checkFocus: true, // 숨겨진 input에 대한 포커스 체크
        selectedCells: null,
        selectedRows: null,

        getColumnKey: function (colIdx) {
            return this.columnList[colIdx].key;
        },
        getCurrentColumnKey: function() {
            return this.columnList[this.currentCell.col].key;
        },
        getColumnIndex: function (key) {
            for (var i = 0; this.columnList.length; i++)
            {
                if (this.columnList[i].key == key)
                    return i;
            }
            return -1;
        },
        getColumnCount: function () {
            return this.columnList.length;
        },
        getPageCount: function () {
            var pageCount = Math.ceil(this.contactList.length / this.rowsPerPage);
            return (pageCount === 0 ? 1 : pageCount);
        },
        selectRow: function(selInfo, addNew)
        {
            if (this.selectedRows == null)
                this.selectedRows = new Array();

            if (addNew)
            {
                this.selectedRows.push(selInfo);
            }
            else
            {
                this.selectedRows.pop();
                this.selectedRows.push(selInfo);
            }
        },
        toggleSelectedRow: function (row)
        {
            if (this.selectedRows == null)
                this.selectedRows = [];

            var found = false;
            for (var i = 0; i < this.selectedRows.length; i++)
            {
                var selection = this.selectedRows[i];

                if (selection.s === row)
                {
                    selection.s++;
                    found = true;
                    break;
                }
                else if (selection.e === row)
                {
                    selection.e--;
                    found = true;
                    break;
                }
                else if (row > selection.s && row < selection.e)
                {
                    var selection2 = {s:row+1, e: selection.e};
                    this.selectedRows.splice(i+1, 0, selection2);

                    selection.e = row-1;
                    found = true;
                    break;
                }
            }

            if (found === false)
            {
                this.selectedRows.push({s:row, e:row});
                this.selectedRows.sort();
            }
        },

        normalizeSelectedRow: function ()
        {
            var normalizedSelection = [];

            if (this.selectedRows == null)
                return normalizedSelection;

            for (var i = 0; i < this.selectedRows.length; i++)
            {
                var selection = this.selectedRows[i];
                for (var row = selection.s; row <= selection.e; row++)
                {
                    var found = false;
                    for (var j = 0; j < normalizedSelection.length; j++)
                    {
                        if (normalizedSelection[j] === row)
                        {
                            found = true;
                            break;
                        }
                    }

                    if (!found)
                        normalizedSelection.push(row);
                }
            }

            normalizedSelection.sort(function (a, b) { return parseInt(a)-parseInt(b) });
            return normalizedSelection;
        }
    }

    this.init = function (parent)
    {
        this.lastContactId = 1;
        this.sheetInfo.parentElement = parent;
        this.sheetInfo.contactIO = new ContactIO(this);
        this.sheetInfo.actionHandler = new ActionHandler(this);
//        this.sheetInfo.clipboardManager = new ClipboardManager(this);
        this.sheetInfo.undoManager = new UndoManager(this);

        // 메인 메뉴
        this.sheetInfo.mainMenu = new Menu1(this.sheetInfo.actionHandler);
        this.sheetInfo.mainMenu.init();
        this.sheetInfo.mainMenu.create($('.nav-main-menu'));

        // 툴바
        this.sheetInfo.toolbar = new Toolbar(this.sheetInfo.actionHandler);
        this.sheetInfo.toolbar.init();
        this.sheetInfo.toolbar.create($('.nav-toolbar'));

        var input1 = $('#cell-input');
        var input2 = $('#cell-ta');

        input1.on('keydown', keydownHandler);
        input2.on('keydown', keydownHandler);

        input1.on('blur', function () {
            var key = mySheet.sheetInfo.getCurrentColumnKey();
            if (key !== 'note' && key !== 'postal-address' && mySheet.sheetInfo.checkFocus)
            {
                console.log('blur');
                this.focus();
            }
        });

        input2.on('blur', function () {
            var key = mySheet.sheetInfo.getCurrentColumnKey();
            if ((key === 'note' || key === 'postal-address') && mySheet.sheetInfo.checkFocus)
            {
                console.log('blur');
                this.focus();
            }
        });

        input1[0].focus();



        var thisSheet = this;

        // 사용자 옵션을 읽고, 주소록을 읽어 화면에 표시한다.
        this.loadUserOption(function(columnList) {

            // 이전에 저장된 정보가 없으면 디폴트 정보를 저장한다.
            if (columnList == null || Array.isArray(columnList) == false)
            {
                thisSheet.saveUserOption(defaultColumnList);
                columnList = defaultColumnList;
            }

            // 화면에 표시할 컬럼 리스트를 저장한다.
            thisSheet.sheetInfo.allColumnList = columnList;
            thisSheet.sheetInfo.columnList = new Array();
            for (var i = 0; i < columnList.length; i++)
            {
                if (columnList[i].visible == true)
                    thisSheet.sheetInfo.columnList.push(columnList[i]);
            }

            // 각 윈도우를 생성한다.
            thisSheet.createWindows(parent);

            // 시차를 두고 주소록을 읽어 들인다.
            setTimeout(function() {
                thisSheet.loadContacts();
            }, 200);
        });
    }

    this.reinit = function (columnList)
    {
        this.sheetInfo.allColumnList = columnList;
        this.sheetInfo.columnList = new Array();
        for (var i = 0; i < columnList.length; i++)
        {
            if (columnList[i].visible == true)
                this.sheetInfo.columnList.push(columnList[i]);
        }

        var header = $('.ion-sheet-header');
        var body = $('.ion-sheet-body');

        this.sheetInfo.columnWindow.create(header);
        this.sheetInfo.cellWindow.create(body);

        var page = this.sheetInfo.currentPage;
        this.sheetInfo.rowIndexWindow.redraw(page);
        this.sheetInfo.cellWindow.redraw(page);

        this.sheetInfo.cellWindow.setCurrentCell(0, 0);
        this.sheetInfo.pagerWindow.update();
    }

    // 화면 구성에 필요한 윈도우들을 생성한다.
    this.createWindows = function (parent)
    {
        var container = $('<div class="ion-sheet-container"></div>');
        var header = $('<div class="ion-sheet-header"></div>');
        var body = $('<div class="ion-sheet-body"></div>');
        var footer = $('<div class="ion-sheet-footer"></div>');

        container.append(header);
        container.append(body);
        container.append(footer);

        // 컬럼
        this.sheetInfo.columnWindow = new ColumnWindow(this);
        this.sheetInfo.columnWindow.create(header);

        // Row Num
        this.sheetInfo.rowIndexWindow = new RowIndexWindow(this);
        this.sheetInfo.rowIndexWindow.create(body);

        // Cell
        this.sheetInfo.cellWindow = new CellWindow(this);
        this.sheetInfo.cellWindow.create(body);

        // Paging
        this.sheetInfo.pagerWindow = new PagerWindow(this)
        this.sheetInfo.pagerWindow.create(footer);

        parent.append(container);

        this.sheetInfo.columnWindow.createColumnResizeHandles();
        this.sheetInfo.columnWindow.addDraggableEvent();
    }

    this.setPage = function(page)
    {
        if (this.sheetInfo.currentPage == page || page < 1)
            return;

        if (Math.ceil((this.sheetInfo.contactList.length + 1) / this.sheetInfo.rowsPerPage) < page)
            return;

        var sheetInfo = this.sheetInfo;

        showWaitScreen().then(function () {

            sheetInfo.cellWindow.redraw(page);
            sheetInfo.rowIndexWindow.redraw(page);
            sheetInfo.cellWindow.setCurrentCell(0, 0);
            sheetInfo.pagerWindow.redraw(page);

            hideWaitScreen();
        })
    }

    // 크롬 저장소로부터 저장된 사용자 옵션을 읽는다.
    this.loadUserOption = function(callback)
    {
        chrome.storage.sync.get('option', function(data) {
            var optionString = data['option'];

            if (optionString != null && optionString != '')
            {
                //console.log(optionString);
                callback(JSON.parse(optionString));
            }
            else
            {
                callback(null);
            }
        });
    }

    this.saveUserOption = function(userOption)
    {
        var optionString = JSON.stringify(userOption);
        chrome.storage.sync.set({"option": optionString});
    }

    this.setContactGroupList = function (contactGroupList)
    {
        this.sheetInfo.contactGroupList = contactGroupList;
        this.sheetInfo.groupMenu = this.sheetInfo.cellWindow.container.testMenu(contactGroupList);
    }

    this.setContactList = function (contactList)
    {
        this.sheetInfo.contactList = contactList;
        this.sheetInfo.rowIndexWindow.redraw(1);
        this.sheetInfo.cellWindow.redraw(1);
        //this.sheetInfo.pagingWindow.redraw(1);

        this.sheetInfo.cellWindow.setCurrentCell(0, 0);
    }

    this.sortContactList = function(key1, key2, direction)
    {
        var col = this.sheetInfo.getColumnIndex(key1);
        this.sheetInfo.columnWindow.setSortColumn(col, direction);
        this.sheetInfo.sortInfo = {
            type: 'simple',
            direction: direction,
            key1: key1,
            key2: key2
        };

        var sheetInfo = this.sheetInfo;
        var curPage = this.sheetInfo.currentPage;

        showWaitScreen().then(function () {
            sheetInfo.contactIO.sortContactList(sheetInfo.contactList, key1, key2, direction);
            sheetInfo.cellWindow.redraw(curPage);
            sheetInfo.cellWindow.setCurrentCell(sheetInfo.currentCell.col, sheetInfo.currentCell.row);
            hideWaitScreen();
        });
    }

    this.loadContacts = function ()
    {
        var thisContactSheet = this;

        chrome.identity.getAuthToken({interactive:true}, function(token) {

            authToken = token;
            console.log('token' + token);

            var contactIO = thisContactSheet.sheetInfo.contactIO;

            contactIO.loadContactGroupList(function(groupList) {
                showWaitScreen();
                var contactGroupList = groupList;

                contactIO.loadContactList(null, null, 1, 20000, function(contactList) {

                    var key = thisContactSheet.sheetInfo.getColumnKey(0);
                    var subkey = 'family-name';

                    if (key == 'full-name')
                        subkey = 'family-name';
                    else
                        subkey = 'full-name';

                    mySheet.sheetInfo.columnWindow.setSortColumn(0, 'sortAsc');
                    contactIO.sortContactList(contactList, key, subkey);

                    mySheet.setContactGroupList(contactGroupList);
                    mySheet.setContactList(contactList);

                    hideWaitScreen();
                });

            });
        });
    }

    this.saveContacts = function ()
    {

    }

    this.addContact = function(contactIdx, contact)
    {
        this.sheetInfo.contactList.splice(contactIdx, 0, contact);
    }

    this.deleteContact = function (contactId, saveContact)
    {
        if (this.sheetInfo.contactList == null)
            return;

        if (typeof saveContact == 'undefined')
            saveContact = true;

        var sheetInfo = this.sheetInfo;
        var contact = null;

        for (var i = 0; i < sheetInfo.contactList.length; i++)
        {
            if (sheetInfo.contactList[i].fields['id'] === contactId)
            {
                contact = sheetInfo.contactList[i];

                if (saveContact)
                {
                    if (sheetInfo.deletedContactList == null)
                        sheetInfo.deletedContactList = new Array();

                    sheetInfo.deletedContactList.push(contact);
                }

                sheetInfo.contactList.splice(i, 1);

                break;
            }
        }

        return contact;
    }

    this.removeDeletedContact = function(contactId)
    {
        var sheetInfo = this.sheetInfo;
        var contact = null;

        if (sheetInfo.deletedContactList != null)
        {
            for (var i = 0; i < sheetInfo.deletedContactList.length; i++)
            {
                if (sheetInfo.deletedContactList[i].fields['id'] == contactId)
                {
                    contact = sheetInfo.deletedContactList[i];
                    sheetInfo.deletedContactList.splice(i, 1);
                    break;
                }
            }
        }

        return contact;
    }

    this.getContactById = function(contactId)
    {
        if (this.sheetInfo.contactList != null)
        {
            for (var i = 0; i < this.sheetInfo.contactList.length; i++)
            {
                if (this.sheetInfo.contactList[i].fields['id'] == contactId)
                    return this.sheetInfo.contactList[i];
            }
        }

        return null;
    }

    this.getContactIdx = function (contactId)
    {
        for (var i = 0; i < this.sheetInfo.contactList.length; i++)
        {
            if (contactId == this.sheetInfo.contactList[i].fields['id'])
                return i;
        }

        return -1;
    }

    this.getNextContactId = function()
    {
        return this.lastContactId++;
    }

    this.getSelectionCount = function()
    {
        return this.sheetInfo.selectedCells == null ? 0 : this.sheetInfo.selectedCells.length;
    }
}
