function UndoManager(contactSheet)
{
    this.contactSheet = contactSheet;
    this.sheetInfo = contactSheet.sheetInfo;

    this.undoBuffer = new Array();
    this.redoBuffer = new Array();

    this.addUndoData = function(undoData)
    {
        this.undoBuffer.push(undoData);
        this.redoBuffer = new Array();
    }

    this.canUndo = function ()
    {
        return (this.undoBuffer != null && this.undoBuffer.length > 0);
    }

    this.canRedo = function ()
    {
        return (this.redoBuffer != null && this.redoBuffer.length > 0);
    }

    this.undo = function ()
    {
        if (this.undoBuffer != null && this.undoBuffer.length > 0)
        {
            var undoData = this.undoBuffer.pop();
            this.redoBuffer.push(undoData);

            if (undoData.type === 'write' && undoData.actionList != null)
            {
                this.undoWriteAction(undoData);
            }
            else if (undoData.type === 'pasteRow' && undoData.actionList != null)
            {
                this.undoPasteRowAction(undoData);
            }
            else if (undoData.type == 'deleteRow' && undoData.actionList != null)
            {
                this.undoDeleteRowAction(undoData);
            }
        }
    }

    this.redo = function ()
    {
        if (this.redoBuffer != null && this.redoBuffer.length > 0)
        {
            var undoData = this.redoBuffer.pop();
            this.undoBuffer.push(undoData);

            if (undoData.type === 'write' && undoData.actionList != null)
            {
                this.redoWriteAction(undoData);
            }
            else if (undoData.type === 'pasteRow' && undoData.actionList != null)
            {
                this.redoPasteRowAction(undoData);
            }
            else if (undoData.type === 'deleteRow' && undoData.actionList != null)
            {
                this.redoDeleteRowAction(undoData);
            }
        }
    }

    this.undoWriteAction = function (undoData)
    {
        var sheetInfo = this.contactSheet.sheetInfo;
        var cellWindow = sheetInfo.cellWindow;

        var lastAction = undoData.actionList[0];
        var lastContactId = lastAction.contactId;

        for (var i = undoData.actionList.length-1; i >= 0; i--)
        {
            var action = undoData.actionList[i];

            // 데이터가 새로 추가된 경우
            if (action.rowAdded)
            {
                this.contactSheet.deleteContact(action.contactId, false);
                cellWindow.deleteContact(action.contactId);
            }
            // 데이터가 수정된 경우
            else
            {
                var contact = this.contactSheet.getContactById(action.contactId);
                contact.setData(action.oldCellData);
                cellWindow.redrawContact(action.contactId, contact);
            }
        }

        cellWindow.setCurrentCellByContactId(lastContactId, lastAction.col);
    }

    this.undoPasteRowAction = function (undoData)
    {
        var sheetInfo = this.contactSheet.sheetInfo;
        var cellWindow = sheetInfo.cellWindow;

        var firstAction = undoData.actionList[0];
        var rowIdx = firstAction['row-idx'];

        for (var i = 0; i < undoData.actionList.length; i++)
        {
            var action = undoData.actionList[i];
            var contactId = action['contact-id'];

            this.contactSheet.deleteContact(contactId);

            if (undoData.page === sheetInfo.currentPage)
                cellWindow.deleteContact(contactId);
        }

        if (undoData.page != sheetInfo.currentPage)
        {
            this.contactSheet.setPage(page);
        }

        rowIdx = rowIdx - (undoData.page -1) * sheetInfo.rowsPerPage;
        cellWindow.setCurrentCell(0, rowIdx);
    }

    this.undoDeleteRowAction = function (undoData)
    {
        var lastAction = undoData.actionList[0];
        var lastRowIdx = lastAction['contact-idx'];
        var offsetRow = (undoData.page - 1) * this.sheetInfo.rowsPerPage;

        for (var i = undoData.actionList.length-1; i >= 0; i--)
        {
            var action = undoData.actionList[i];
            var contactIdx = action['contact-idx'];
            var contact = action['contact'];

            this.contactSheet.addContact(contactIdx, contact);

            // 페이지가 이동되므로 화면에 갱신이 필요없다.
            if (undoData.page == this.sheetInfo.currentPage)
                this.sheetInfo.cellWindow.addContact(contactIdx-offsetRow, contact);
        }

        if (undoData.page != this.sheetInfo.currentPage)
        {
            var row = lastRowIdx - offsetRow;
            var cellWindow = this.sheetInfo.cellWindow;

            this.contactSheet.setPage(undoData.page, function () {

                    cellWindow.setCurrentCell(0, row);
                });
        }
        else
        {
            this.sheetInfo.cellWindow.hideCellMarker();
            if (this.sheetInfo.cellWindow.tableCell[0].rows.length > this.sheetInfo.rowsPerPage + 1) {
                var cnt = this.sheetInfo.cellWindow.tableCell[0].rows.length - this.sheetInfo.rowsPerPage - 1;
                for (var i = 0; i < cnt; i++) {
                    var idx = this.sheetInfo.cellWindow.tableCell[0].rows.length - 2;
                    this.sheetInfo.cellWindow.deleteRow(idx);
                }
            }
            var row = lastRowIdx - (undoData.page - 1) * this.sheetInfo.rowsPerPage;
            this.sheetInfo.cellWindow.setCurrentCell(0, row);
        }
    }

    this.redoWriteAction = function (undoData)
    {
        var cellWindow = this.sheetInfo.cellWindow;
        var lastAction = undoData.actionList[undoData.actionList.length - 1];

        for (var i = 0; i < undoData.actionList.length; i++)
        {
            var action = undoData.actionList[i];
            var contactId = action.contactId;

            if (action.rowAdded === true)
            {
                var contact = new Contact(contactId, true);
                contact.setValue(action.key, action.newCellData.value);

                this.contactSheet.addContact(action.contactIdx, contact);
                cellWindow.addContact(action.contactIdx, contact);
            }
            else
            {
                var contact = this.contactSheet.getContactById(contactId);
                contact.setValue(action.key, action.newCellData.value);
                cellWindow.redrawContact(contactId, contact);
            }
        }

        cellWindow.setCurrentCellByContactId(lastAction.contactId, lastAction.col);
    }

    this.redoPasteRowAction = function (undoData)
    {
        if (undoData.actionList.length === 0)
            return;

        if (undoData.page !== this.sheetInfo.currentPage)
            this.contactSheet.setPage(undoData.page);

        var lastAction = undoData.actionList[undoData.actionList.length - 1];
        var lastRowIdx = lastAction['row-idx'];

        for (var i = 0; i < undoData.actionList.length; i++)
        {
            var action = undoData.actionList[i];
            var contactIdx = action['row-idx'];
            var contact = action['contact'];

            this.contactSheet.addContact(contactIdx, contact);
            this.sheetInfo.cellWindow.addContact(contactIdx, contact);
        }

        var rowIdx = lastRowIdx - (undoData.page -1) * this.sheetInfo.rowsPerPage;
        this.sheetInfo.cellWindow.setCurrentCell(0, rowIdx)
    }

    this.redoDeleteRowAction = function (undoData)
    {
        if (undoData.actionList.length === 0)
            return;

        var lastAction = undoData.actionList[undoData.actionList.length - 1];
        var lastRowIdx = lastAction['contact-idx'];

        for (var i = 0; i < undoData.actionList.length; i++)
        {
            var contactId = undoData.actionList[i]['contact-id'];

            this.contactSheet.deleteContact(contactId);

            if (undoData.page === this.sheetInfo.currentPage)
                this.sheetInfo.cellWindow.deleteContact(contactId);
        }

        var cellWindow = this.sheetInfo.cellWindow;
        var rowIdx = lastRowIdx - (undoData.page -1) * this.sheetInfo.rowsPerPage;

        this.contactSheet.setPage(undoData.page, function () {
            cellWindow.setCurrentCell(0, rowIdx);
        })
    }

}