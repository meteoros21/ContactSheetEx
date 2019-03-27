function UndoManager(contactSheet)
{
    this.contactSheet = contactSheet;
    this.sheetInfo = contactSheet.sheetInfo;

    this.undoBuffer = new Array();
    this.redoBuffer = new Array();

    this.addUndoAction = function(action)
    {
        this.undoBuffer.push(action);
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
            var action = this.undoBuffer.pop();
            this.redoBuffer.push(action);

            if (action.type === 'write' && action.actionList != null)
            {
                this.undoWriteAction(action);
            }
            else if (action.type === 'pasteRow' && action.actionList != null)
            {
                this.undoPasteRowAction(action);
            }
            else if (action.type == 'deleteRow' && action.actionList != null)
            {
                this.undoDeleteRowAction(action);
            }
        }
    }

    this.redo = function ()
    {
        if (this.redoBuffer != null && this.redoBuffer.length > 0)
        {
            var action = this.redoBuffer.pop();
            this.undoBuffer.push(action);

            if (action.type === 'write' && action.actionList != null)
            {
                this.redoWriteAction(action);
            }
            else if (action.type === 'pasteRow' && action.actionList != null)
            {
                this.redoPasteRowAction(action);
            }
            else if (action.type == 'deleteRow' && action.actionList != null)
            {
                this.redoDeleteRowAction(action);
            }
        }
    }

    this.undoWriteAction = function (undoData)
    {
        var sheetInfo = this.contactSheet.sheetInfo;
        var cellWindow = sheetInfo.cellWindow;

        var lastAction = undoData.actionList[0];
        var lastRowIdx = lastAction.contactIdx;
        var lastPage = Math.ceil((lastRowIdx - 1) / sheetInfo.rowsPerPage);
        var needSortData = false;

        var lastContactId = lastAction.contactId;
        lastRowIdx = cellWindow.getRowIndexByContactId(lastContactId);

        if (undoData.sortKey != null && undoData.sortType != null &&
            (undoData.sortKey !== sheetInfo.sortInfo['key'] || undoData.sortType !== sheetInfo.sortInfo['type']))
        {
            needSortData = true;
        }

        for (var i = undoData.actionList.length-1; i >= 0; i--)
        {
            var action = undoData.actionList[i];

            // 데이터가 새로 추가된 경우
            if (action.rowAdded)
            {
                this.contactSheet.deleteContact(action.contactId);

                if (!needSortData)
                    this.cellWindow.deleteContact(action.contactId);
            }
            // 데이터가 수정된 경우
            else
            {
                var contact = this.contactSheet.getContactById(action.contactId);
                var key = sheetInfo.getColumnKey(action.col);
                contact.setValue(key, action.oldCellData.value);

                if (!needSortData)
                    cellWindow.redrawContact(action.contactId);
            }
        }

        // 정렬이 필요한 경우
        if (needSortData)
        {
            this.contactSheet.sortData(undoData.sortKey, undoData.sortType, lastPage);
            this.cellWindow.redraw(this.sheetInfo.currentPage);
        }

        if (lastAction.rowAdded === false)
            lastRowIdx = cellWindow.getRowIndexByContactId(lastContactId);

        cellWindow.setCurrentCell(lastAction.col, lastRowIdx);
    }

    this.undoPasteRowAction = function (action)
    {

    }

    this.undoDeleteRowAction = function (action)
    {

    }

    this.redoWriteAction = function (action)
    {

    }

    this.redoPasteRowAction = function (action)
    {

    }

    this.redoDeleteRowAction = function (action)
    {

    }

}