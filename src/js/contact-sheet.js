function ContactSheet()
{
    this.sheetInfo = {
        parentElement: null,
        columnList: [],
        allColumnList: [],
        contactList: [],
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
        getColumnCount: function () {
            return this.columnList.length;
        },
        getPageCount: function () {
            var pageCount = Math.ceil(this.contactList.length / this.rowsPerPage);
            return (pageCount === 0 ? 1 : pageCount);
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

    this.getCellData = function(col, row)
    {
        var key = this.sheetInfo.getColumnKey(col);
        var contact = this.getContactByRow(row);
        var cellData = new CellData(key);

        if (contact != null)
        {
            cellData.label = contact.getLabel(key);
            cellData.value = contact.getValue(key);
        }
        else
        {
            cellData.label = '';
            cellData.value = (key === 'groups') ? null : '';
            // var dataCell = sheetInfo2.getDataCell(col, row);
            //
            // cellData.label = $(dataCell).text().trimRight();
            // cellData.value = (key == 'groups') ? JSON.parse($(cell).attr('group-data')) : cellData.label;
        }

        return cellData;
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

    this.getContactByRow = function(row)
    {
        var contactId = this.sheetInfo.cellWindow.getContactIdByRowIndex(row);
        return this.getContactById(contactId);
    }

    this.getNextContactId = function()
    {
        return this.lastContactId++;
    }

    this.addUndoAction = function (action)
    {

    }
}
