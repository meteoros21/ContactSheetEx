function TableHandler(sheetInfo)
{
    this.sheetInfo = sheetInfo;

    this.addContact = function(contactIdx, contact)
    {
        var tableCell = this.sheetInfo.tableCell;

        var firstVisibleRow = (this.sheetInfo.currentPage - 1) * this.sheetInfo.rowsPerPage;
        var lastVisibleRow = firstVisibleRow + tableCell[0].rows.length - 1;

        this.sheetInfo.insertContact(contactIdx, contact);

        if (contactIdx >= firstVisibleRow && contactIdx <= lastVisibleRow)
        {
            var rowIdx = contactIdx - firstVisibleRow;
            this.insertTableRow(rowIdx);
            this.redrawContact(rowIdx, contact);
        }
        else if (contactIdx < firstVisibleRow)
        {
            this.insertTableRow(0);
            var contact = this.sheetInfo.contactList[firstVisibleRow];
            this.redrawContact(0, contact);
        }
    };

    this.insertContact = function(contactIdx, contact)
    {
        var tableCell = this.sheetInfo.tableCell;

        var firstVisibleRow = (this.sheetInfo.currentPage - 1) * this.sheetInfo.rowsPerPage;
        var lastVisibleRow = firstVisibleRow + tableCell[0].rows.length - 1;

        this.sheetInfo.insertContact(contactIdx, contact);

        if (contactIdx >= firstVisibleRow && contactIdx < lastVisibleRow)
        {
            var rowIdx = contactIdx - firstVisibleRow;
            this.insertTableRow(rowIdx);
            this.redrawContact(rowIdx, contact);

            var lastRow = tableCell[0].rows.length - 2;
            this.deleteTableRow(lastRow);
        }
    };

    this.deleteContact = function(contactId)
    {
        var tableCell = this.sheetInfo.tableCell;

        var firstVisibleRow = (this.sheetInfo.currentPage - 1) * this.sheetInfo.rowsPerPage;
        var lastVisibleRow = firstVisibleRow + tableCell[0].rows.length - 1;
        var contactIdx = this.getContactIdxByContactId(contactId);
        
        if (contactIdx >= firstVisibleRow && contactIdx < lastVisibleRow)
        {
            var rowIdx = contactIdx - firstVisibleRow;
            this.deleteTableRow(rowIdx);
        }

        sheetInfo.deleteContact(contactId);
    };

    this.getPageNoWithContactId = function(contactId)
    {
        var contactIdx = this.sheetInfo.getContactIdxByContactId(contactId);
        var page = 1 + Math.floor(contactIdx / this.sheetInfo.rowsPerPage);
        return page;
    };

    this.findTableRowIdxByContactId = function(contactId)
    {
        var tableCell = this.sheetInfo.tableCell;

        var tr = tableCell.find('tr[contact-id=\"' + contactId + '\"]');
        return tableCell.find('tr').index(tr);
    };

    this.findRow = function(contactId)
    {
        return this.sheetInfo.tableCell.find('tr[contact-id=\"' + contactId + '\"]');
    };

    this.addTableRow = function(rebindEvent)
    {
        var tableCell = this.sheetInfo.tableCell;

        var rowIdx = tableCell[0].rows.length - 2;
        this.insertTableRow(rowIdx, rebindEvent);
        return rowIdx;
    };

    this.insertTableRow = function(rowIdx)
    {
        var tableRow  = this.sheetInfo.tableRow;
        var tableCell = this.sheetInfo.tableCell;

        var cellTr = $('<tr></tr>');

        for (var i = 0; i < this.sheetInfo.getColumnCount(); i++)
        {
            var key = this.sheetInfo.getColumnKey(i);
            var width = this.sheetInfo.columnInfo[i].width;
            var td = $('<td class="unselectable"></td>');
                
            td.css('width', width);
            td.css('min-width', width);
            td.css('max-width', width);

            if (i == 0)
                td.css('height', this.sheetInfo.defaultRowHeight);

            if (key == 'postal-address' || key == 'note')
                td.addClass('multiline-text');
            else
                td.addClass('singleline-text');
            
            cellTr.append(td);
        }

        cellTr.insertBefore($(tableCell[0].rows[rowIdx]));

        tempTr = $(tableRow[0].rows[rowIdx]);
        var rowTr = $('<tr></tr>').insertBefore(tempTr);
        var rowTd = $('<td class="unselectable"></td>');
        rowTd.css('height', this.sheetInfo.defaultRowHeight);
        rowTr.append(rowTd);

        var offsetRowIdx = (this.sheetInfo.currentPage-1) * this.sheetInfo.rowsPerPage;

        for (var i = rowIdx; i < tableRow[0].rows.length-1; i++)
            tableRow[0].rows[i].cells[0].innerText = '' + (i+1 + offsetRowIdx);
    };

    this.deleteTableRow = function(rowIdx)
    {
        if (rowIdx >= this.sheetInfo.tableCell[0].rows.length)
            return;

        var tableRow  = this.sheetInfo.tableRow;
        var tableCell = this.sheetInfo.tableCell;

        var offsetRowIdx = (this.sheetInfo.currentPage - 1) * this.sheetInfo.rowsPerPage;
        $(tableRow[0].rows[rowIdx]).remove();

        this.sheetInfo.selectedRows = new Array();

        var rowCnt = tableRow[0].rows.length-1;

        for (var i = rowIdx; i < rowCnt; i++)
        {
            var label = '' + (i+offsetRowIdx+1);
            tableRow[0].rows[i].cells[0].innerText = label;
        }
        
        $(tableCell[0].rows[rowIdx]).remove();
        
        rowCnt = tableCell[0].rows.length;
        
        if (this.sheetInfo.currentCell.row > rowCnt - 1)
            this.setCurrentCell(0, rowCnt-1);
        else
            this.setCurrentCell(0, this.sheetInfo.currentCell.row);
    }

    this.redrawContact = function(rowIdx, contact)
    {
        var tableRow  = this.sheetInfo.tableRow;
        var tableCell = this.sheetInfo.tableCell;

        var trCell = $(tableCell[0].rows[rowIdx]);
        trCell.attr('contact-id', contact.fields['id']);

        for (var i = 0; i < this.sheetInfo.getColumnCount(); i++)
        {
            var td = $(tableCell[0].rows[rowIdx].cells[i]);

            var key = this.sheetInfo.columnInfo[i].key;
            td.html(contact.getLabel(key));

            if (contact.isFieldModified(key))
                $(td).addClass('modified');
            else
                $(td).removeClass('modified');
        }

        var height = trCell[0].offsetHeight;

        var tdRow = $(tableRow[0].rows[rowIdx].cells[0]);
        if (contact.modified)
            tdRow.addClass('modified');
        else
            tdRow.removeClass('modified');

        tdRow.css('height', height + 'px');

        this.setCurrentCell(this.sheetInfo.currentCell.col, this.sheetInfo.currentCell.row);
    };

    this.setCurrentCell = function(col, row)
    {
        if (this.sheetInfo.currentCellMarker == null)
        {
            this.sheetInfo.currentCellMarker = $('<div id="cell-marker"></div>');
            this.sheetInfo.tableCell.parent().append(this.sheetInfo.currentCellMarker);
            this.sheetInfo.currentCellMarker.on('keydown', function(e) {
                e.preventDefault();
                //e.stopPropagation();
                e.stopImmediatePropagation();
            });
            // this.sheetInfo.currentCellMarker.focus(function(e) {
            //     $('#cell-input').focus();
            // });
        }

        var cellMarker = this.sheetInfo.currentCellMarker;
        var tableRow  = this.sheetInfo.tableRow;
        var tableCell = this.sheetInfo.tableCell;

        var cell = tableCell.find('.editing-now');
        
        if (typeof findDialog != 'undefined')
        {
            var cellText = tableCell[0].rows[row].cells[col].innerText.trimRight();
            findDialog.checkButtons(cellText);
        }
        
        // 편집 중인 셀이 있으면 편집을 종료한다. 
        if (cell.length > 0)
            this.stopEditing();
                
        var prevCell = tableCell.find('.current-cell');
        prevCell.removeClass('current-cell');
        prevCell.addClass('unselectable');

        this.sheetInfo.currentCell.col = col;
        this.sheetInfo.currentCell.row = row;

        var newCell = $(tableCell[0].rows[row].cells[col]); 
        newCell.addClass('current-cell');
        newCell.removeClass('unselectable');

        var offsetLeft = newCell[0].offsetLeft;
        var offsetTop = newCell[0].offsetTop;
        var offsetWidth = newCell[0].offsetWidth;
        var offsetHeight = newCell[0].offsetHeight;
        cellMarker.css('left', offsetLeft + 'px');
        cellMarker.css('top', offsetTop + 'px');
        cellMarker.css('width', offsetWidth + 'px');
        cellMarker.css('height', offsetHeight + 'px');
        cellMarker.css('display', 'block');

//        var h = tableCell[0].rows[row].offsetHeight;
        
        this.recalcRowHeight(row);
        tableRow.find('.current-row').removeClass('current-row');
        $(tableRow[0].rows[row].cells[0]).addClass('current-row');
//        $(tableRow[0].rows[row].cells[0]).css('height', h + 'px');
    
        this.sheetInfo.tableCol.find('.current-col').removeClass('current-col');
        $(this.sheetInfo.tableCol[0].rows[0].cells[col]).addClass('current-col');
    
        this.checkScroll(col, row);

        var key = this.sheetInfo.getColumnKey(col);
        if (key == 'postal-address' || key == 'note')
            $('#cell-ta')[0].focus();
        else
            $('#cell-input')[0].focus();
    };

    this.setAbsCurrentCell = function(col, row, callback)
    {
        var tableCell = this.sheetInfo.tableCell;

        var firstVisibleIdx = (this.sheetInfo.currentPage - 1) * this.sheetInfo.rowsPerPage;
        var lastVisibleIdx = firstVisibleIdx + tableCell[0].rows.length-1;

        if (row >= firstVisibleIdx && row <= lastVisibleIdx)
        {
			var rowIdx = row - firstVisibleIdx;
            this.setCurrentCell(col, rowIdx);
            if (typeof callback != 'undefined')
                callback();
        }
        else
        {
            var page = 1 + Math.floor(row / this.sheetInfo.rowsPerPage);
			var offset = (page - 1) * this.sheetInfo.rowsPerPage;
            var rowIdx = row - offset;
            var thisObj = this;

            if (typeof callback == 'undefined')
            {
                showWaitScreen().then(function() {
                    sheetInfo.myPlugin.setPage(page);
                    thisObj.setCurrentCell(col, rowIdx);
                    hideWaitScreen();
                });
            }
            else
            {
                sheetInfo.myPlugin.setPage(page);
                thisObj.setCurrentCell(col, rowIdx);
                callback();
            }
        }
    };

    this.checkScroll = function(col, row)
    {
        var table = this.sheetInfo.tableCell;
        var cell = $(table[0].rows[row].cells[col]);
	
        var left = cell[0].offsetLeft;
        var top = cell[0].offsetTop;
        var right = left + cell.outerWidth();
        var bottom = top + cell.outerHeight();
        
        var container = table.parents('.cell-container');
        var scrollLeft = container.scrollLeft();
        var scrollTop  = container.scrollTop();
        
        if (left - scrollLeft < 0)
        {
            var dx = scrollLeft - left;
            container.scrollLeft(scrollLeft-dx);
        }
        else if (right - scrollLeft > container.innerWidth() - 20)
        {
            var dx = right - scrollLeft - container.innerWidth() + 20;
            container.scrollLeft(scrollLeft+dx);
        }
        
        if (top - scrollTop < 0)
        {
            var dy = scrollTop - top;
            container.scrollTop(scrollTop - dy);
        }
        else if (bottom - scrollTop > container.innerHeight() - 20)
        {
            var dy = bottom - scrollTop - container.innerHeight() + 20;
            container.scrollTop(scrollTop + dy);
        }
    };

    this.getContactIdxByContactId = function(contactId)
    {
        var idx = -1;
        var contactList = this.sheetInfo.contactList;

        for (var i = 0; i < contactList.length; i++)
        {
            if (contactList[i].fields['id'] == contactId)
            {
                idx = i;
                break;
            }
        }

        return idx;
    };

    this.getContactByRowIdx = function(rowIdx)
    {
        var tr = this.sheetInfo.tableCell[0].rows[rowIdx];
        var contactId = $(tr).attr('contact-id');
        return sheetInfo.getContact(contactId);
    };

    this.recalcRowHeight = function(row)
    {
        var height = this.sheetInfo.tableCell[0].rows[row].offsetHeight;
        $(this.sheetInfo.tableRow[0].rows[row].cells[0]).css('height', height + 'px');
    }

    this.startEditing = function(editMode)
    {
        if (typeof editMode == 'undefined')
            editMode = true;

        var sheetInfo = this.sheetInfo;
        var table = sheetInfo.tableCell;
        
        var cell = table.find('.current-cell');
        cell.addClass('editing-now');
        cell.removeClass('current-cell');
        sheetInfo.currentCellMarker.css('display', 'none');

        var col = sheetInfo.currentCell.col;
        var row = sheetInfo.currentCell.row;

        if (cell.length == 0)
        {
            var test = 1;
            console.log('tet');
        }
        var cellData = sheetInfo.myPlugin.getCellData(col, row);
        sheetInfo.prevCellData = cellData;
        sheetInfo.prevCellHeight = cell[0].offsetHeight;

        console.log('startEditing');

        if (sheetInfo.getColumnKey(col) == 'groups')
        {
            sheetInfo.groupMenu.show(cell, cellData.value);
        }
        else if (sheetInfo.getColumnKey(col) == 'note' || sheetInfo.getColumnKey(col) == 'postal-address')
        {
            var rect = cell[0].getBoundingClientRect();
            var inputContainer = $('#cell-ta-container');
            inputContainer.css('display', 'block');
            inputContainer.css('left', rect.x + 'px');
            inputContainer.css('top', rect.y + 'px');
            inputContainer.css('width', (rect.width-1) + 'px');
            inputContainer.css('height', (rect.height-1) + 'px');

            cell.css('height', rect.height + 'px');

            var input = $('#cell-ta');
            input.attr('editing', 'true');
            input.css('width', (rect.width-1) + 'px');
            input.css('height', (rect.height-1) + 'px');

            if (editMode)
                input.val(cellData.value);
            input[0].focus();
            cell.text('');
        }
        else
        {
            cell.text('');
            var rect = cell[0].getBoundingClientRect();
            var inputContainer = $('#cell-input-container');
            inputContainer.css('display', 'block');
            inputContainer.css('left', rect.x + 'px');
            inputContainer.css('top', rect.y + 'px');
            inputContainer.css('width', (rect.width-1) + 'px');
            inputContainer.css('height', (rect.height-1) + 'px');

            var input = $('#cell-input');
            input.attr('editing', 'true');
            if (editMode)
                input.val(cellData.label);
            input[0].focus();
        }

        //this.recalcRowHeight(row);
    }

    this.cancelEditing = function()
    {
        var sheetInfo = this.sheetInfo;
        var table = sheetInfo.tableCell;
        var cell = table.find('.editing-now');
        if (cell.length <= 0)
            return;
        
        var tr = cell.parent();
        var colIdx = tr.children().index(cell);
        var rowIdx = tr.parent().children().index(tr);
        var prevCellHeight = sheetInfo.prevCellHeight;
        cell.css('height', prevCellHeight + 'px');
        
        cell.removeClass('editing-now');
        cell.addClass('current-cell');
        sheetInfo.currentCellMarker.css('display', 'block');
        cell.html(sheetInfo.prevCellData.label);
        
        if (sheetInfo.columnInfo[colIdx].key == 'groups')
        {
            sheetInfo.groupMenu.hide();
        }
        if (sheetInfo.columnInfo[colIdx].key == 'note' || sheetInfo.columnInfo[colIdx].key == 'postal-address')
        {
            var inputContainer = $('#cell-ta-container');
            inputContainer.css('left', '-1000px');

            var input = $('#cell-ta');
            input.attr('editing', 'false');
            input.val('');
        }
        else
        {
            var inputContainer = $('#cell-input-container');
            inputContainer.css('left', '-1000px');

            var input = $('#cell-input');
            input.attr('editing', 'false');
            input.val('');
        }

        this.recalcRowHeight(sheetInfo.currentCell.row);
    }

    this.stopEditing = function()
    {
        var sheetInfo = this.sheetInfo;
        var table = sheetInfo.tableCell;
        var dataCell = table.find('.editing-now');
        
        if (dataCell.length > 0)
        {
            dataCell.removeClass('editing-now');
            dataCell.addClass('current-cell');
            dataCell.css('height', sheetInfo.defaultRowHeight);

            var offsetRow = (sheetInfo.currentPage - 1) * sheetInfo.rowsPerPage;
            var tr = dataCell.parent();
            var col = tr.children().index(dataCell);
            var row = tr.parent().children().index(tr);
            var key = sheetInfo.getColumnKey(col);

            var contactId = tr.attr('contact-id');
            var contact = sheetInfo.getContact(contactId);

            var newCellData = new CellData(key);
            if (newCellData.key == 'groups')
            {
                newCellData.label = sheetInfo.groupMenu.getSelectedLabel();
                newCellData.value = sheetInfo.groupMenu.getSelectedValue();
                sheetInfo.groupMenu.hide();
                $('#cell-input')[0].focus();
            }
            else if (newCellData.key == 'note' || newCellData.key == 'postal-address')
            {
                var inputContainer = $('#cell-ta-container');
                inputContainer.css('left', '-1000px');
    
                var input = $('#cell-ta');
                input.attr('editing', 'false');
                
                newCellData.label = input.val().trimRight();
                newCellData.value = newCellData.label;
                input.val('');
            }
            else
            {
                var inputContainer = $('#cell-input-container');
                inputContainer.css('left', '-1000px');
    
                var input = $('#cell-input');
                input.attr('editing', 'false');
                
                newCellData.label = input.val().trimRight();
                newCellData.value = newCellData.label;
                input.val('');
            }

            var oldCellData = new CellData(key);
            if (contact == null && row == table[0].rows.length - 1)
            {
                oldCellData.label = '';
                oldCellData.value = (key == 'groups') ? null : '';

                if (newCellData.value != '')
                {
                    var contactId = sheetInfo.getNextContactId();
                    var contact = new Contact(contactId);
                    contact.setValue(key, newCellData.value);
                    contact.isNew = true;
                    sheetInfo.tableHandler.addContact(row + offsetRow, contact);

                    var undoData = new UndoData('write');
                    undoData.addWriteAction(col, contactId, oldCellData, newCellData, true, row + offsetRow);
                    sheetInfo.addUndoAction(undoData);
                }
            }
            else
            {
                oldCellData.label = contact.getLabel(key);
                oldCellData.value = contact.getValue(key);

                if (contact.isValueEqual(key, newCellData.value) == false)
                {
                    var undoData = new UndoData('write');
                    undoData.addWriteAction(col, contactId, oldCellData, newCellData, false, row + offsetRow);
                    sheetInfo.addUndoAction(undoData);
                }

                contact.setValue(key, newCellData.value);
                sheetInfo.tableHandler.redrawContact(row, contact, key);
            }

            this.recalcRowHeight(sheetInfo.currentCell.row);
            this.setCurrentCell(sheetInfo.currentCell.col, sheetInfo.currentCell.row);
        }
    }

    this.sortData = function(key, sortType, page)
    {
        var key2 = (key == 'full-name') ? 'family-name' : 'full-name';

        var cellIdx = sheetInfo.getColumnIndex(key);
        $(sheetInfo.tableCol).find('.sortAsc').removeClass('sortAsc');
        $(sheetInfo.tableCol).find('.sortDsc').removeClass('sortDsc');
        $(sheetInfo.tableCol[0].rows[0].cells[cellIdx]).addClass(sortType);

        sheetInfo.sortContactList(key, key2, sortType);
        mySheet.setContactList(null, sheetInfo.contactList);

        sheetInfo.sortInfo['key'] = key;
        sheetInfo.sortInfo['type'] = sortType;
    }

    this.undo = function(undoData)
    {
        var sheetInfo = this.sheetInfo;
        var thisHandler = this;

        if (undoData.type == 'write' && undoData.actionList != null)
        {
            var lastAction = undoData.actionList[0];
            var lastRowIdx = lastAction.contactIdx;
            var lastPage = Math.ceil((lastRowIdx - 1) / sheetInfo.rowsPerPage);
            var needSortData = false;

            var lastContactId = lastAction.contactId;
            lastRowIdx = thisHandler.getContactIdxByContactId(lastContactId);

            if (undoData.sortKey != null && undoData.sortType != null && 
                (undoData.sortKey != sheetInfo.sortInfo['key'] || undoData.sortType != sheetInfo.sortInfo['type']))
            {
                needSortData = true;
            }

            for (var i = undoData.actionList.length-1; i >= 0; i--)
            {
                var action = undoData.actionList[i];
                if (action.rowAdded)
                {
                    thisHandler.deleteContact(action.contactId);
                }
                else
                {
                    var contact = sheetInfo.getContact(action.contactId);
                    var key = sheetInfo.getColumnKey(action.col);
                    contact.setValue(key, action.oldCellData.value);

                    var rowIdx = thisHandler.findTableRowIdxByContactId(action.contactId);
                    if (rowIdx >= 0)
                        thisHandler.redrawContact(rowIdx, contact);
                }
            }

            if (needSortData)
                thisHandler.sortData(undoData.sortKey, undoData.sortType, lastPage);

            if (lastAction.rowAdded == false)
                lastRowIdx = thisHandler.getContactIdxByContactId(lastContactId);

            this.setAbsCurrentCell(lastAction.col, lastRowIdx);


            // thisHandler.sortData(lastAction['sort-key'], lastAction['sort-type'], lastPage);

            // for (var i = undoData.actionList.length-1; i >= 0; i--)
            // {
            //     var action = undoData.actionList[i];

            //     if (action.rowAdded == true) // row가 추가된 경우
            //     {
            //         this.deleteContact(action.contactId);
            //     }
            //     else
            //     {
            //         var contact = sheetInfo.getContact(action.contactId);
            //         var key = sheetInfo.getColumnKey(action.col);
            //         contact.setValue(key, action.oldCellData.value);

            //         var rowIdx = this.findTableRowIdxByContactId(action.contactId);
            //         if (rowIdx >= 0)
            //             this.redrawContact(rowIdx, contact, key);
            //     }
            // }

            // this.setAbsCurrentCell(lastAction.col, lastRowIdx);
        }
        else if (undoData.type == 'pasteRow' && undoData.actionList != null)
        {
            showWaitScreen().then(function() {

                var lastAction = undoData.actionList[0];
                var lastRowIdx = lastAction['row-idx'];
                var sortInfo = sheetInfo.sortInfo;
                var lastPage = Math.ceil((lastRowIdx - 1) / sheetInfo.rowsPerPage);
                lastPage = (lastPage == 0) ? 1 : lastPage;

                var needSortData = (sortInfo['key'] != lastAction['sort-key'] || sortInfo['type'] != lastAction['sort-type']);
                var needMovePage = (lastPage != sheetInfo.currentPage);

                if (needSortData == true || needMovePage == true)
                {
                    for (var i = undoData.actionList.length-1; i >= 0; i--)
                    {
                        var action = undoData.actionList[i];
                        var contactId = action['contact-id'];
                        sheetInfo.deleteContact(contactId);
                    }

                    if (needSortData)
                        thisHandler.sortData(lastAction['sort-key'], lastAction['sort-type'], lastPage);

                    if (lastPage != sheetInfo.currentPage)
                        mySheet.setPage(lastPage);

                    var row = lastRowIdx - (sheetInfo.currentPage - 1) * sheetInfo.rowsPerPage;
                    thisHandler.setCurrentCell(0, row);
                }
                else
                {
                    for (var i = undoData.actionList.length-1; i >= 0; i--)
                    {
                        var action = undoData.actionList[i];
                        var contactId = action['contact-id'];
                        thisHandler.deleteContact(contactId);
                    }
                    thisHandler.setCurrentCell(0, sheetInfo.tableCell[0].rows.length-1);
                }

                hideWaitScreen();
            });
        }
        else if (undoData.type == 'deleteRow' && undoData.actionList != null)
        {
            showWaitScreen().then(function() {

                var lastAction = undoData.actionList[0];
                var lastRowIdx = lastAction['contact-idx'];
                var sortInfo = sheetInfo.sortInfo;
                var lastPage = Math.ceil(lastRowIdx / sheetInfo.rowsPerPage);

                if (sortInfo['key'] != lastAction['sort-key'] || sortInfo['type'] != lastAction['sort-type'])
                    thisHandler.sortData(lastAction['sort-key'], lastAction['sort-type'], 1);

                var offsetRowIdx = (sheetInfo.currentPage - 1) * sheetInfo.rowsPerPage;
    
                for (var i = undoData.actionList.length-1; i >= 0; i--)
                {
                    var action = undoData.actionList[i];
                    var contact = action['contact'];
                    var contactIdx = action['contact-idx'];
                    sheetInfo.insertContact(contactIdx, contact);
    
                    var contactId = contact.fields['id'];
                    sheetInfo.removeDeletedContact(contactId);
    
                    var rowIdx = contactIdx - offsetRowIdx;
                    if (rowIdx >= 0 && rowIdx < sheetInfo.rowsPerPage)
                    {
                        thisHandler.insertTableRow(rowIdx);
                        thisHandler.redrawContact(rowIdx, contact);

                        if (sheetInfo.tableCell[0].rows.length -1 > sheetInfo.rowsPerPage)
                        {
                            var rowIdx = sheetInfo.tableCell[0].rows.length-2;
                            thisHandler.deleteTableRow(rowIdx);
                        }
                    }
                }
    
                thisHandler.setAbsCurrentCell(0, lastRowIdx, function() {

                    //offsetRowIdx = (sheetInfo.currentPage - 1) * sheetInfo.rowsPerPage;
                    for (var i = undoData.actionList.length-1; i >= 0; i--)
                    {
                        var action = undoData.actionList[i];
                        var contactId = action['contact-id'];
                        var rowIdx = thisHandler.findTableRowIdxByContactId(contactId);
                        thisHandler.selectRow(rowIdx);
                    }
                    hideWaitScreen();
                });
            });
        }
    };

    this.redo = function(undoData)
    {
        var sheetInfo = this.sheetInfo;
        var thisHandler = this;

        if (undoData.type == 'write' && undoData.actionList != null && undoData.actionList.length > 0)
        {
            var tmp = undoData.actionList.length - 1;
            var lastAction = undoData.actionList[tmp];
            var lastRowIdx = lastAction.contactIdx;
            var lastColIdx = lastAction.col;

            for (var i = 0; i < undoData.actionList.length; i++)
            {
                var action = undoData.actionList[i];
                var contactId = action.contactId;
                var key = sheetInfo.columnInfo[action.col].key;

                if (action.rowAdded == true)
                {
                    var contact = new Contact(contactId);
                    contact.setValue(key, action.newCellData.value);
                    contact.isNew = true;
                    var contactIdx = action.contactIdx;
                    this.insertContact(contactIdx, contact);
                }
                else
                {
                    var contact = sheetInfo.getContact(contactId);
                    contact.setValue(key, action.newCellData.value);

                    var rowIdx = this.findTableRowIdxByContactId(contactId);
                    if (rowIdx >= 0)
                        this.redrawContact(rowIdx, contact, key);
                }
            }
            this.setAbsCurrentCell(lastColIdx, lastRowIdx);
        }
        else if (undoData.type == 'pasteRow' && undoData.actionList != null && undoData.actionList.length > 0)
        {
            showWaitScreen().then(function() {

                var tmp = undoData.actionList.length - 1;
                var lastAction = undoData.actionList[tmp];
                var lastRowIdx = lastAction['row-idx'];
                var sortInfo = sheetInfo.sortInfo;
                var lastPage = Math.ceil((lastRowIdx + 1) / sheetInfo.rowsPerPage) - 1;
                lastPage = (lastPage == 0) ? 1 : lastPage;

                // 정렬 키 및 순서가 변경된 경우, 원래의 정렬 상태로 되돌린다.
                if (sortInfo['key'] != lastAction['sort-key'] || sortInfo['type'] != lastAction['sort-type'])
                    thisHandler.sortData(lastAction['sort-key'], lastAction['sort-type'], lastPage);

                if (lastPage != sheetInfo.currentPage)
                    mySheet.setPage(lastPage);

                for (var i = 0; i < undoData.actionList.length; i++)
                {
                    var action = undoData.actionList[i];
                    var contactIdx = action['row-idx'];
                    var contactId = action['contact-id'];
                    var fields = action['fields'];

                    var contact = new Contact(contactId);
                    contact.setFields(fields);
                    contact.isNew = true;

                    thisHandler.addContact(contactIdx, contact);
                }

                var row = lastRowIdx - (sheetInfo.currentPage - 1) * sheetInfo.rowsPerPage;
                thisHandler.setCurrentCell(0, row);
                hideWaitScreen();
            })
        }
        else if (undoData.type == 'deleteRow' && undoData.actionList != null && undoData.actionList.length > 0)
        {
            var tmp = undoData.actionList.length - 1;
            var lastAction = undoData.actionList[tmp];
            var lastRowIdx = lastAction['contact-idx'];
            var sortInfo = sheetInfo.sortInfo;

            // 정렬 키 및 순서가 변경된 경우, 원래의 정렬 상태로 되돌린다.
            if (sortInfo['key'] != lastAction['sort-key'] || sortInfo['type'] != lastAction['sort-type'])
                thisHandler.sortData(lastAction['sort-key'], lastAction['sort-type'], 1);

            // 삭제할 데이터가 존재하는 페이지를 얻는다.
            var lastPage = Math.ceil( (lastRowIdx + 1) / sheetInfo.rowsPerPage);

            for (var i = 0; i < undoData.actionList.length; i++)
            {
                var action = undoData.actionList[i];
                var contactId = action['contact-id'];

                // 현재 페이지 내에 삭제할 데이터가 있다면, 데이터와 테이블 로우를 같이 삭제한다.
                if (lastPage == sheetInfo.currentPage)
                    thisHandler.deleteContact(contactId);
                else
                    thisHandler.sheetInfo.deleteContact(contactId);
            }

            var offsetRowIdx = (this.sheetInfo.currentPage - 1) * this.sheetInfo.rowsPerPage;
            if (lastPage == sheetInfo.currentPage)
                thisHandler.setCurrentCell(0, lastRowIdx - offsetRowIdx);
            else
                thisHandler.setAbsCurrentCell(0, lastRowIdx);
        }
    };

    this.findText = function(startCol, startRow, txt, direction, range)
    {
        var sheetInfo = this.sheetInfo;

        if (direction == 1) // forward
        {
            var contactList = sheetInfo.getContactList();

            if (typeof range.startRow != 'undefined')
            {
                var contact = contactList[startRow];

                for (var colIdx = startCol; colIdx < sheetInfo.columnInfo.length; colIdx++)
                {
                    var key = sheetInfo.getColumnKey(colIdx);

                    if (key != 'groups' && contact.getLabel(key).indexOf(txt) >= 0)
                    {
                        var page = Math.ceil((startRow + 1) / sheetInfo.rowsPerPage);
                        return {page: page, col: colIdx, row: startRow, txtFind: txt};
                    }
                }

                for (var rowIdx = startRow+1; rowIdx <= range.endRow; rowIdx++)
                {
                    var contact = contactList[rowIdx];

                    for (var colIdx = 0; colIdx < sheetInfo.columnInfo.length; colIdx++)
                    {
                        var key = sheetInfo.getColumnKey(colIdx);

                        if (key != 'groups' && contact.getLabel(key).indexOf(txt) >= 0)
                        {
                            var page = Math.ceil((rowIdx + 1) / sheetInfo.rowsPerPage);
                            return {page: page, col: colIdx, row: rowIdx, txtFind: txt};
                        }
                    }
                }

                for (var rowIdx = range.startRow; rowIdx <= startRow; rowIdx++)
                {
                    var contact = contactList[rowIdx];

                    for (var colIdx = 0; colIdx < sheetInfo.columnInfo.length; colIdx++)
                    {
                        var key = sheetInfo.getColumnKey(colIdx);

                        if (key != 'groups' && contact.getLabel(key).indexOf(txt) >= 0)
                        {
                            var page = Math.ceil((rowIdx + 1) / sheetInfo.rowsPerPage);
                            return {page: page, col: colIdx, row: rowIdx, txtFind: txt};
                        }
                    }
                }
            }
            // selected area
            else
            {
                var minRow = contactList.length-1;
                var maxRow = 0;
                
                for (var idx = 0; idx < range.selectedCells.length; idx++)
                {
                    var selection = range.selectedCells[idx];
                    
                    for (var j = selection.row1; j <= selection.row2; j++)
                    {
                        var r = j + range.offsetRow;
                        
                        if (r > maxRow)
                            maxRow = r;
                        if (r < minRow)
                            minRow = r;
                    }
                }
                
                var contact = contactList[startRow];
                
                for (var i = startCol; i < sheetInfo.columnInfo.length; i++)
                {
                    var key = sheetInfo.columnInfo[i].key;
                    
                    if (key != 'groups')
                    {
                        var val = (typeof contact.fields[key] == 'undefined') ? '' : contact.fields[key];
                        if (val.indexOf(txt) >= 0)
                        {
                            if (sheetInfo.isSelectedCell(i, startRow-range.offsetRow))
                            {
                                var page = Math.ceil((startRow + 1) / sheetInfo.rowsPerPage);
                                return {page: page, col: i, row: startRow, txtFind: txt};
                            }
                        }
                    }
                }
                
                for (var j = startRow+1; j <= maxRow; j++)
                {
                    contact = contactList[j];
                    
                    for (var i = 0; i < sheetInfo.columnInfo.length; i++)
                    {
                        var key = sheetInfo.columnInfo[i].key;
                        
                        if (key != 'groups')
                        {
                            var val = (typeof contact.fields[key] == 'undefined') ? '' : contact.fields[key];
                            if (val.indexOf(txt) >= 0)
                            {
                                if (sheetInfo.isSelectedCell(i, j-range.offsetRow))
                                {
                                    var page = Math.ceil((j + 1) / sheetInfo.rowsPerPage);
                                    return {page: page, col: i, row: j, txtFind: txt};
                                }
                            }
                        }				
                    }
                }
                
                for (var j = minRow; j <= startRow; j++)
                {
                    contact = contactList[j];
                    
                    for (var i = 0; i < sheetInfo.columnInfo.length; i++)
                    {
                        var key = sheetInfo.columnInfo[i].key;
                        
                        if (key != 'groups')
                        {
                            var val = (typeof contact.fields[key] == 'undefined') ? '' : contact.fields[key];
                            if (val.indexOf(txt) >= 0)
                            {
                                if (sheetInfo.isSelectedCell(i, j-range.offsetRow))
                                {
                                    var page = Math.ceil((j + 1) / sheetInfo.rowsPerPage);
                                    return {page: page, col: i, row: j, txtFind: txt};
                                }
                            }
                        }				
                    }			
                }
                
            }
            
            return null;
        }
        else if (direction == 2)
        {
            var contactList = sheetInfo.getContactList();
            
            if (typeof range.startRow != 'undefined')
            {
                var contact = contactList[startRow];
                
                for (var i = startCol; i >= 0; i--)
                {
                    var key = sheetInfo.columnInfo[i].key;
                    
                    if (key != 'groups')
                    {
                        var val = (typeof contact.fields[key] == 'undefined') ? '' : contact.fields[key];
                        if (val.indexOf(txt) >= 0)
                        {
                            if (sheetInfo.isSelectedCell(i, startRow))
                            {
                                var page = Math.ceil((startRow + 1) / sheetInfo.rowsPerPage);
                                return {page: page, col: i, row: startRow, txtFind: txt};
                            }
                        }
                    }
                }
                
                for (var j = startRow-1; j >= range.startRow; j--)
                {
                    contact = contactList[j];
                    
                    for (var i = sheetInfo.columnInfo.length-1; i >= 0; i--)
                    {
                        var key = sheetInfo.columnInfo[i].key;
                        
                        if (key != 'groups')
                        {
                            var val = (typeof contact.fields[key] == 'undefined') ? '' : contact.fields[key];
                            if (val.indexOf(txt) >= 0)
                            {
                                var page = Math.ceil((j + 1) / sheetInfo.rowsPerPage);
                                return {page: page, col: i, row: j, txtFind: txt};
                            }
                        }				
                    }
                }
                
                for (var j = range.endRow; j >= startRow; j--)
                {
                    contact = contactList[j];
                    
                    for (var i = sheetInfo.columnInfo.length-1; i >= 0; i--)
                    {
                        var key = sheetInfo.columnInfo[i].key;
                        
                        if (key != 'groups')
                        {
                            var val = (typeof contact.fields[key] == 'undefined') ? '' : contact.fields[key];
                            if (val.indexOf(txt) >= 0)
                            {
                                var page = Math.ceil((j + 1) / sheetInfo.rowsPerPage);
                                return {page: page, col: i, row: j, txtFind: txt};
                            }
                        }				
                    }			
                }
            }
            else
            {
                var minRow = contactList.length-1;
                var maxRow = 0;
                
                for (var idx = 0; idx < range.selectedCells.length; idx++)
                {
                    var selection = range.selectedCells[idx];
                    
                    for (var j = selection.row1; j <= selection.row2; j++)
                    {
                        var r = j + range.offsetRow;
                        
                        if (r > maxRow)
                            maxRow = r;
                        if (r < minRow)
                            minRow = r;
                    }
                }
                
                var contact = contactList[startRow];
                
                for (var i = startCol; i >= 0; i--)
                {
                    var key = sheetInfo.columnInfo[i].key;
                    
                    if (key != 'groups')
                    {
                        var val = (typeof contact.fields[key] == 'undefined') ? '' : contact.fields[key];
                        if (val.indexOf(txt) >= 0)
                        {
                            if (sheetInfo.isSelectedCell(i, startRow-range.offsetRow))
                            {
                                var page = Math.ceil((startRow + 1) / sheetInfo.rowsPerPage);
                                return {page: page, col: i, row: startRow, txtFind: txt};
                            }
                        }
                    }
                }
                
                for (var j = startRow-1; j >= minRow; j--)
                {
                    contact = contactList[j];
                    
                    for (var i = sheetInfo.columnInfo.length-1; i >= 0; i--)
                    {
                        var key = sheetInfo.columnInfo[i].key;
                        
                        if (key != 'groups')
                        {
                            var val = (typeof contact.fields[key] == 'undefined') ? '' : contact.fields[key];
                            if (val.indexOf(txt) >= 0)
                            {
                                if (sheetInfo.isSelectedCell(i, j-range.offsetRow))
                                {
                                    var page = Math.ceil((j + 1) / sheetInfo.rowsPerPage);
                                    return {page: page, col: i, row: j, txtFind: txt};
                                }
                            }
                        }				
                    }
                }
                
                for (var j = maxRow; j >= startRow; j--)
                {
                    contact = contactList[j];
                    
                    for (var i = sheetInfo.columnInfo.length-1; i >= 0; i--)
                    {
                        var key = sheetInfo.columnInfo[i].key;
                        
                        if (key != 'groups')
                        {
                            var val = (typeof contact.fields[key] == 'undefined') ? '' : contact.fields[key];
                            if (val.indexOf(txt) >= 0)
                            {
                                if (sheetInfo.isSelectedCell(i, j-range.offsetRow))
                                {
                                    var page = Math.ceil((j + 1) / sheetInfo.rowsPerPage);
                                    return {page: page, col: i, row: j, txtFind: txt};
                                }
                            }
                        }				
                    }			
                }	
            }
            
            return null;		
        }
    }

    this.replaceAllText = function(sheetInfo, txtFind, txtReplace, range)
    {
        var sheetInfo = this.sheetInfo;
        var contactList = sheetInfo.getContactList();
        var firstVisibleRow = (sheetInfo.currentPage-1) * sheetInfo.rowsPerPage;
        var lastVisibleRow = firstVisibleRow + sheetInfo.tableCell[0].rows.length - 2;

        if (range.scope == 1 || range.scope == 2) // current page
        {
            var undoData = new UndoData('write');

            for (var i = range.startRow; i <= range.endRow; i++)
            {
                var contact = contactList[i];
                var contactId = contact.fields['id'];

                for (var j = 0; j < sheetInfo.columnInfo.length; j++)
                {
                    var key = sheetInfo.columnInfo[j].key;

                    if (key != 'groups' && contact.getValue(key).indexOf(txtFind) >= 0)
                    {
                        var oldVal = contact.getValue(key);
                        var newVal = contact.getValue(key).split(txtFind).join(txtReplace);

                        var oldCellData = new CellData(key, oldVal, oldVal);
                        var newCellData = new CellData(key, newVal, newVal);
                        undoData.addWriteAction(j, contactId, oldCellData, newCellData, false, i + firstVisibleRow);

                        contact.setValue(key, newVal);

                        if (i >= firstVisibleRow && i <= lastVisibleRow)
                            this.redrawContact(i-firstVisibleRow, contact);
                    }
                }
            }

            if (undoData.actionList.length > 0)
                sheetInfo.addUndoAction(undoData);
        }
        else // selected area
        {
            var undoData = new UndoData('write');

            var minRow = contactList.length-1;
            var maxRow = 0;
            
            for (var idx = 0; idx < range.selectedCells.length; idx++)
            {
                var selection = range.selectedCells[idx];
                
                for (var j = selection.row1; j <= selection.row2; j++)
                {
                    var r = j + range.offsetRow;
                    
                    if (r > maxRow)
                        maxRow = r;
                    if (r < minRow)
                        minRow = r;
                }
            }
            
            for (var i = minRow; i <= maxRow; i++)
            {
                var contact = contactList[i];
                var contactId = contact.fields['id'];

                for (var j = 0; j < sheetInfo.columnInfo.length; j++)
                {
                    if (sheetInfo.isSelectedCell(j, i-firstVisibleRow))
                    {
                        var key = sheetInfo.columnInfo[j].key;

                        if (key != 'groups' && contact.getValue(key).indexOf(txtFind) >= 0)
                        {
                            var oldVal = contact.getValue(key);
                            var newVal = contact.getValue(key).split(txtFind).join(txtReplace);

                            var oldCellData = new CellData(key, oldVal, oldVal);
                            var newCellData = new CellData(key, newVal, newVal);
                            undoData.addWriteAction(j, contactId, oldCellData, newCellData, false, i + firstVisibleRow);

                            contact.setValue(key, newVal);

                            if (i >= firstVisibleRow && i <= lastVisibleRow)
                                this.redrawContact(i-firstVisibleRow, contact);
                        }
                    }
                }
            }

            if (undoData.actionList.length > 0)
                sheetInfo.addUndoAction(undoData);
        }
    }

    this.selectCells = function(col, row, isNewSelection)
    {
        var table = this.sheetInfo.tableCell;
        var sheetInfo = this.sheetInfo;

        if (isNewSelection == true || sheetInfo.selectedCells == null)
        {
            if (sheetInfo.selectedCells == null)
                sheetInfo.selectedCells = new Array();
            
            var selection = new Object();
            selection.col1 = -1;
            selection.col2 = -1;
            selection.row1 = -1;
            selection.row2 = -1;
            sheetInfo.selectedCells.push(selection);
        }
        
        sheetInfo.colForSel = col;
        sheetInfo.rowForSel = row;

        var selectionIdx = sheetInfo.selectedCells.length-1;
        var selection = sheetInfo.selectedCells[selectionIdx];
        
        var objTbl = table[0];
        
        // 기존 선택 영역이 있으면 지운다.
        if (selection.col1 >= 0)
        {
            var td = $(table[0].rows[selection.row1].cells[selection.col1]);
            td.removeClass('selected-cell-lefttop');
            td = $(objTbl.rows[selection.row1].cells[selection.col2]);
            td.removeClass('selected-cell-righttop');
            td = $(objTbl.rows[selection.row2].cells[selection.col1]);
            td.removeClass('selected-cell-leftbottom');
            td = $(objTbl.rows[selection.row2].cells[selection.col2]);
            td.removeClass('selected-cell-rightbottom');
            
            for (var j = selection.row1 + 1; j <= selection.row2 - 1; j++)
            {
                td = $(objTbl.rows[j].cells[selection.col1]);
                td.removeClass('selected-cell-left');
                td = $(objTbl.rows[j].cells[selection.col2]);
                td.removeClass('selected-cell-right');
            }
            
            for (var i = selection.col1 + 1; i <= selection.col2 - 1; i++)
            {
                td = $(objTbl.rows[selection.row1].cells[i]);
                td.removeClass('selected-cell-top');
                td = $(objTbl.rows[selection.row2].cells[i]);
                td.removeClass('selected-cell-bottom');			
            }
            
            for (var j = selection.row1; j <= selection.row2; j++)
            {
                for (var i = selection.col1; i <= selection.col2; i++)
                {
                    var td = $(table[0].rows[j].cells[i]);
                    td.removeClass('selected-cell');
                }
            }
        }
        
        if (col <= sheetInfo.currentCell.col)
        {
            selection.col1 = col;
            selection.col2 = sheetInfo.currentCell.col;
        }
        else
        {
            selection.col2 = col;
            selection.col1 = sheetInfo.currentCell.col;
        }
        if (row <= sheetInfo.currentCell.row)
        {
            selection.row1 = row;
            selection.row2 = sheetInfo.currentCell.row;
        }
        else
        {
            selection.row2 = row;
            selection.row1 = sheetInfo.currentCell.row;
        }
        
        // 선택된 셀 영역이 있으면, 선택된 텍스트나 기타 요소의 선택을 해제한다.
        if (selection.row1 != selection.row2 ||
                selection.col1 != selection.col2)
        {
            var sel;
            if ((sel = document.selection) && sel.empty)
            {
                sel.empty();
            }
            else
            {
                if (window.getSelection)
                {
                    window.getSelection().removeAllRanges();
                }
            }
        }
        
        for (var j = selection.row1; j <= selection.row2; j++)
        {
            for (var i = selection.col1; i <= selection.col2; i++)
            {
                var td = $(table[0].rows[j].cells[i]);
                td.addClass('selected-cell');
            }
        }
        
        var td = $(table[0].rows[selection.row1].cells[selection.col1]);
        td.addClass('selected-cell-lefttop');
        td = $(objTbl.rows[selection.row1].cells[selection.col2]);
        td.addClass('selected-cell-righttop');
        td = $(objTbl.rows[selection.row2].cells[selection.col1]);
        td.addClass('selected-cell-leftbottom');
        td = $(objTbl.rows[selection.row2].cells[selection.col2]);
        td.addClass('selected-cell-rightbottom');
        
        for (var j = selection.row1 + 1; j <= selection.row2 - 1; j++)
        {
            td = $(objTbl.rows[j].cells[selection.col1]);
            td.addClass('selected-cell-left');
            td = $(objTbl.rows[j].cells[selection.col2]);
            td.addClass('selected-cell-right');
        }
        
        for (var i = selection.col1 + 1; i <= selection.col2 - 1; i++)
        {
            td = $(objTbl.rows[selection.row1].cells[i]);
            td.addClass('selected-cell-top');
            td = $(objTbl.rows[selection.row2].cells[i]);
            td.addClass('selected-cell-bottom');			
        }
    }

    this.unselectCells = function()
    {
        var tbl = this.sheetInfo.tableCell;
        tbl.find('.selected-cell-lefttop').removeClass('selected-cell-lefttop');
        tbl.find('.selected-cell-righttop').removeClass('selected-cell-righttop');
        tbl.find('.selected-cell-leftbottom').removeClass('selected-cell-leftbottom');
        tbl.find('.selected-cell-rightbottom').removeClass('selected-cell-rightbottom');
        tbl.find('.selected-cell-left').removeClass('selected-cell-left');
        tbl.find('.selected-cell-top').removeClass('selected-cell-top');
        tbl.find('.selected-cell-right').removeClass('selected-cell-right');
        tbl.find('.selected-cell-bottom').removeClass('selected-cell-bottom');
        tbl.find('.selected-cell').removeClass('selected-cell');
    
        this.sheetInfo.selectedCells = null;

        this.sheetInfo.colForSel = -1; // 키보드를 이용한 선택에 사용
        this.sheetInfo.rowForSel = -1;
    };

    this.selectRow = function(row)
    {
        var sheetInfo = this.sheetInfo;
        var table = sheetInfo.tableCell;

        if (sheetInfo.selectedRows == null)
            sheetInfo.selectedRows = new Array();
        
        for (var i = 0; i < sheetInfo.selectedRows.length; i++)
        {
            if (sheetInfo.selectedRows[i] == row)
                return;
        }
        sheetInfo.selectedRows.push(row);
        sheetInfo.selectedRows.sort();
        
        for (var i = 0; i < sheetInfo.getColumnCount(); i++)
        {
            var td = $(table[0].rows[row].cells[i]);
            
            if (i == 0)
            {
                td.addClass('selected-cell-lefttop');
                td.addClass('selected-cell-leftbottom');
            }
            else if (i == sheetInfo.getColumnCount()-1)
            {
                td.addClass('selected-cell-righttop');
                td.addClass('selected-cell-rightbottom');			
            }
            
            td.addClass('selected-cell');
            td.addClass('selected-cell-top');
            td.addClass('selected-cell-bottom');
            sheetInfo.selectedRow = row;
        }
    }

    this.unselectRows = function()
    {
        if (this.sheetInfo.selectedRows == null || this.sheetInfo.selectedRows.length == 0)
            return;

        var tbl = this.sheetInfo.tableCell;
        tbl.find('.selected-cell-lefttop').removeClass('selected-cell-lefttop');
        tbl.find('.selected-cell-righttop').removeClass('selected-cell-righttop');
        tbl.find('.selected-cell-leftbottom').removeClass('selected-cell-leftbottom');
        tbl.find('.selected-cell-rightbottom').removeClass('selected-cell-rightbottom');
        tbl.find('.selected-cell-left').removeClass('selected-cell-left');
        tbl.find('.selected-cell-top').removeClass('selected-cell-top');
        tbl.find('.selected-cell-right').removeClass('selected-cell-right');
        tbl.find('.selected-cell-bottom').removeClass('selected-cell-bottom');
        tbl.find('.selected-cell').removeClass('selected-cell');
        
        this.sheetInfo.selectedRows = new Array();        
    }

    function cellMousedownHandler(event)
    {
        var sheetInfo = mySheetInfo;
        var thisHandler = sheetInfo.tableHandler;

        var td = $(event.target).closest('td');
            
        if (event.which == 1)
        {
            var col = td.index();
            var row = td.parent().index();

            // cmd key
            if (event.metaKey)
            {
                if ($(this).find('.editing-now').length == 0)
                {
                    if (event.shiftKey)
                    {
                        thisHandler.selectCells(col, row);
                    }
                    else
                    {
                        thisHandler.setCurrentCell(col, row);
                        thisHandler.selectCells(col, row, true);
                    }
                }
            }
            else if (event.shiftKey)
            {
                if ((col != sheetInfo.currentCell.col || row != sheetInfo.currentCell.row) && $(this).find('.editing-now').length == 0)
                {
                    thisHandler.selectCells(col, row);
                }
            }
            else
            {
                if (sheetInfo.selectedRows != null && sheetInfo.selectedRows.length > 0)
                        sheetInfo.tableHandler.unselectRows();

                thisHandler.unselectCells();

                if (col != sheetInfo.currentCell.col || row != sheetInfo.currentCell.row)
                {
                    thisHandler.setCurrentCell(col, row);
                }
                else if (sheetInfo.columnInfo[col].key == 'groups')
                {
                    if (sheetInfo.groupMenu.isVisible())
                        thisHandler.stopEditing();
                }
            }
        }        
    }

    function cellMouseoverHandler(event)
    {
        var sheetInfo = mySheetInfo;
        var thisHandler = sheetInfo.tableHandler;
        var td = $(event.target).closest('td');

        if (event.which == 1 && $(this).find('.editing-now').length == 0)
        {
            event.preventDefault();
            
            var col = td.index();
            var row = td.parent().index();
            
            thisHandler.selectCells(col, row);
            thisHandler.checkScroll(col, row);
        }
    }

    function cellMouseupHandler(event)
    {
        var sheetInfo = mySheetInfo;
        var thisHandler = sheetInfo.tableHandler;
        var td = $(event.target).closest('td');

        if (event.which == 1 && $(this).find('.editing-now').length == 0)
        {
            event.preventDefault();
            
            var col = td.index();
            var row = td.parent().index();

            var key = sheetInfo.getColumnKey(col);
            if (key == 'postal-address' || key == 'note')
                $('#cell-ta')[0].focus();
            else
                $('#cell-input')[0].focus();
    
            //thisHandler.selectCells(col, row);
            //thisHandler.setCurrentCell(col, row);
            thisHandler.checkScroll(col, row);
        }
    }

    function cellDblclkHandler(event)
    {
        mySheetInfo.tableHandler.startEditing();
    }

    function rowMousedownHandler(event)
    {
        var sheetInfo = mySheetInfo;
        var thisHandler = sheetInfo.tableHandler;
        var td = $(event.target).closest('td');

        if (event.which == 1)
        {
            if (event.metaKey)
            {
                event.preventDefault();
                var row = td.parent().index();
                    
                thisHandler.selectRow(row);
                thisHandler.setCurrentCell(0, row);
                sheetInfo.lastSelectedRow = row;
            }
            else if (event.shiftKey)
            {
                event.preventDefault();
                var row = td.parent().index();
                thisHandler.setCurrentCell(0, row);

                if (row > sheetInfo.lastSelectedRow)
                {
                    for (var i = sheetInfo.lastSelectedRow; i <= row; i++)
                    {
                        thisHandler.selectRow(i);
                    }
                }
                else
                {
                    for (var i = row; i <= sheetInfo.lastSelectedRow; i++)
                    {
                        thisHandler.selectRow(i);
                    }
                }
            }
            else
            {
                event.preventDefault();
        
                var col = td.index();
                var row = td.parent().index();
                
                thisHandler.unselectRows();
                thisHandler.selectRow(row);
                sheetInfo.lastSelectedRow = row;
                
                thisHandler.setCurrentCell(0, row);
            }
        }
        else if (event.which == 3)
        {
            var row = td.parent().index();

            if (sheetInfo.selectedRows == null || sheetInfo.selectedRows.length == 0)
            {
                thisHandler.selectRow(row);
                thisHandler.setCurrentCell(0, row);
            }
        }
    }

    this.addMouseHandler = function()
    {
        var tableCell = this.sheetInfo.tableCell;
        var tableRow = this.sheetInfo.tableRow;

        tableCell.unbind('mousedown');
        tableCell.unbind('mouseover');
        tableCell.unbind('mouseup');
        tableCell.unbind('dblclick');
        tableRow.unbind('mousedown');

        tableCell.on('mousedown', cellMousedownHandler);
        tableCell.on('mouseover', cellMouseoverHandler);
        tableCell.on('mouseup', cellMouseupHandler);
        tableCell.on('dblclick', cellDblclkHandler);

        tableRow.on('mousedown', rowMousedownHandler);
    }

    this.drawContacts = function(page)
    {
        var sheetInfo = this.sheetInfo;

        // 현재 페이지에 표시될 데이터의 시작 위치
        var startIndex = (page - 1) * sheetInfo.rowsPerPage;
        // 현재 페이지에 표시될 데이터의 개수
        var length = (sheetInfo.contactList.length - startIndex);
        if (length > sheetInfo.rowsPerPage)
            length = sheetInfo.rowsPerPage;

        var ts1 = Date.now();
        if (typeof dummyTblRow == 'undefined' || dummyTblRow == null)
        {
            dummyTblRow = $('<table></table>');
            dummyTblCell = $('<table></table>');

            for (var j = startIndex, row = 0; j < startIndex + sheetInfo.rowsPerPage + 1; j++, row++)
            {
                var tr = $('<tr></tr>');

                for (var i = 0; i < sheetInfo.getColumnCount(); i++)
                {
                    var key = sheetInfo.getColumnKey(i);
                    var width = sheetInfo.columnInfo[i].width;
                    var td = $('<td class="unselectable" style="width:' + width + '; min-width:' + width + '; max-width:' + width + '"></td>');

                    if (key == 'postal-address' || key == 'note')
                        td.addClass('multiline-text');
                    else
                        td.addClass('singleline-text');
                    tr.append(td);
                }
                dummyTblCell.append(tr);
                
                var tr = $('<tr><td></td></tr>');
                dummyTblRow.append(tr);
            }

            var tr = $('<tr><td></td></tr>');
            dummyTblRow.append(tr);
        }

        var tmpTblRow = $('<table></table>');
        var tmpTblCell = $('<table></table>');

        // 빈 테이블을 복사한다.
        tmpTblRow[0].innerHTML = dummyTblRow[0].innerHTML;
        tmpTblCell[0].innerHTML = dummyTblCell[0].innerHTML;

        for (var j = startIndex, row = 0; j < startIndex + length; j++, row++)
        {
            var contact = sheetInfo.contactList[j];
            var tr = $(tmpTblCell[0].rows[row]);
            tr.attr('contact-id', contact.fields['id']);

            for (var i = 0; i < sheetInfo.getColumnCount(); i++)
            {
                var td = tmpTblCell[0].rows[row].cells[i];
                
                var key = sheetInfo.columnInfo[i].key;
                td.innerHTML = contact.getLabel(key);

                if (contact.isFieldModified(key))
                    $(td).addClass('modified');
            }

            if (contact.isNew)
            {
                tr = $(tmpTblRow[0].rows[row]);
                tr.addClass('modified');
            }

            tmpTblRow[0].rows[row].cells[0].innerText = (j+1);
        }

        // 삭제해야할 테이블 Row수
        var rowCnt = sheetInfo.rowsPerPage - length;
        for (var i = 0; i < rowCnt; i++)
        {
            $(tmpTblRow[0].rows[length]).remove();
            $(tmpTblCell[0].rows[length]).remove();
        }

        length = tmpTblCell[0].rows.length - 1;
        tmpTblRow[0].rows[length].cells[0].innerText = '' + (startIndex + length + 1);

        console.log("Build: " + (Date.now() - ts1));
        ts1 = Date.now();

        //sheetInfo.tableRow.children().replaceWith(tmpTblRow.children());
        //sheetInfo.tableCell.children().replaceWith(tmpTblCell.children());
        sheetInfo.tableRow[0].innerHTML = tmpTblRow[0].innerHTML;
        sheetInfo.tableCell[0].innerHTML = tmpTblCell[0].innerHTML;

        var tableRow = sheetInfo.tableRow[0];
        sheetInfo.tableCell.find('tr').each(function(idx, tr) {
            var height = tr.offsetHeight;
            $(tableRow.rows[idx].cells[0]).css('height', height + 'px');
        });
        console.log("transfer: " + (Date.now() - ts1));
    }

    this.drawContacts3 = function(page)
    {
        var sheetInfo = this.sheetInfo;

        var startIndex = (page - 1) * sheetInfo.rowsPerPage;
        var length = (sheetInfo.contactList.length - startIndex);
        if (length > sheetInfo.rowsPerPage)
            length = sheetInfo.rowsPerPage;

        if (typeof tmpTblRow == 'undefined')
        {
            tmpTblRow = $('<table></table>');
            tmpTblCell = $('<table></table>');

            var ts1 = Date.now();
            for (var j = startIndex, row = 0; j < startIndex + length; j++, row++)
            {
                var contact = sheetInfo.contactList[j];
                var tr = $('<tr contact-id="' + contact.fields['id'] + '"></tr>');

                var html = '';
                for (var i = 0; i < sheetInfo.getColumnCount(); i++)
                {
                    // var width = sheetInfo.columnInfo[i].width;
                    // var val = contact.getLabel(sheetInfo.columnInfo[i].key);
                    
                    // if (i == 0)
                    //     html += '<td class="unselectable" style="width:' + width + '; min-width:' + width + '; max-width:' + width + '; height:' + sheetInfo.defaultRowHeight + '">' + val + '</td>';
                    // else
                    //     html += '<td class="unselectable" style="width:' + width + '; min-width:' + width + '; max-width:' + width + '">' + val + '</td>';
                    // tr.html(html);
                    var width = sheetInfo.columnInfo[i].width;
                    var td = $('<td class="unselectable" style="width:' + width + '; min-width:' + width + '; max-width:' + width + '"></td>');
                    
                    //td.css('width', width);
                    //td.css('min-width', width);
                    //td.css('max-width', width);
                    
                    //if (i == 0)
                    //    td.css('height', sheetInfo.defaultRowHeight);
                    
                    var key = sheetInfo.columnInfo[i].key;
                    td.text(contact.getLabel(key));
                    tr.append(td);
                }
                tmpTblCell.append(tr);
                
                //var tr = $('<tr><td style="height:' + sheetInfo.defaultRowHeight + '">' + (j+1) + '</td></tr>');
                var tr = $('<tr><td>' + (j+1) + '</td></tr>');
                tmpTblRow.append(tr);
            }
        }
        else
        {
            for (var j = startIndex, row = 0; j < startIndex + length; j++, row++)
            {
                var contact = sheetInfo.contactList[j];
                for (var i = 0; i < sheetInfo.getColumnCount(); i++)
                {
                    var td = tmpTblCell[0].rows[row].cells[i];
                    
                    var key = sheetInfo.columnInfo[i].key;
                    td.innerText = contact.getLabel(key);
                }

                tmpTblRow[0].rows[row].cells[0].innerText = (j+1);
            }
        }

        console.log("Build: " + (Date.now() - ts1));
        ts1 = Date.now();

        //sheetInfo.tableRow.children().replaceWith(tmpTblRow.children());
        //sheetInfo.tableCell.children().replaceWith(tmpTblCell.children());
        sheetInfo.tableRow[0].innerHTML = tmpTblRow[0].innerHTML;
        sheetInfo.tableCell[0].innerHTML = tmpTblCell[0].innerHTML;
        console.log("transfer: " + (Date.now() - ts1));
    }

    this.drawContacts2 = function(page)
    {
        var sheetInfo = this.sheetInfo;
        var tblCell = sheetInfo.tableCell[0];
        var tblRow  = sheetInfo.tableRow[0];

        var startIndex = (page - 1) * sheetInfo.rowsPerPage;
        var length = (sheetInfo.contactList.length - startIndex);
        if (length > sheetInfo.rowsPerPage)
            length = sheetInfo.rowsPerPage;
        
        // 테이블의 row수보다 표시해야할 데이터가 큰 경우
        if (tblCell.rows.length < length + 1)
        {
            var cnt = length + 1 - tblCell.rows.length;
            for (var k = 0; k < cnt; k++)
            {
                var tr = $('<tr></tr>');
                
                for (var i = 0; i < sheetInfo.getColumnCount(); i++)
                {
                    var width = sheetInfo.columnInfo[i].width;
                    var td = $('<td class="unselectable"></td>');
                    
                    td.css('width', width);
                    td.css('min-width', width);
                    td.css('max-width', width);
                    
                    if (i == 0)
                        td.css('height', sheetInfo.defaultRowHeight);
                    
                    tr.append(td);
                }
                $(tblCell).append(tr);
                
                var tr = $('<tr><td style="height:' + sheetInfo.defaultRowHeight + '"></td></tr>');
                $(tblRow).append(tr);
            }
            
            // 스크롤을 위해서 열번호 테이블의 row 하나를 더 등록한다.
            var tr = $('<tr><td style="height:' + sheetInfo.defaultRowHeight + '"></td></tr>');
            $(tblRow).append(tr);
        }
        // 테이블의 row 수가 표시해야할 데이터보다 큰 경우
        else if (tblCell.rows.length > length + 1)
        {
            var cnt = tblCell.rows.length - length - 1;
            for (var i = 0; i < cnt; i++)
            {
                $(tblCell.rows[0]).remove();
                $(tblRow.rows[0]).remove();
            }
        }

        $(tblCell).find('.modified').removeClass('modified');
        $(tblRow).find('.modified').removeClass('modified');
        
        var contactList = sheetInfo.getContactList();
        
        for (var i = startIndex, row = 0; i < startIndex + length; i++, row++)
        {
            $(tblRow.rows[row].cells[0]).text(i+1);
            
            var objRow = tblCell.rows[row];
            $(objRow).attr('contact-id', contactList[i].fields['id']);

            if (contactList[i].modified)
                $(tblRow.rows[row].cells[0]).addClass('modified');

            for (var j = 0; j < sheetInfo.getColumnCount(); j++)
            {
                var key = sheetInfo.columnInfo[j].key;
                var value = contactList[i].getLabel(key);
                
                if (key != 'groups')
                    value = (value == null) ? '' : value.replace(new RegExp('\r?\n', 'g'), ', ');

                objRow.cells[j].innerText = value;
                
                if (contactList[i].isFieldModified(key))
                    $(objRow.cells[j]).addClass('modified');
            }
            
            var height = tblCell.rows[row].cells[0].offsetHeight;
            $(tblRow.rows[row].cells[0]).css('height', height + 'px');
        }
        
        for (var j = 0; j < sheetInfo.getColumnCount(); j++)
            tblCell.rows[length].cells[j].innerText = '';
        
        $(tblRow.rows[length].cells[0]).css('height', sheetInfo.defaultRowHeight);
        $(tblRow.rows[length].cells[0]).text(startIndex + length + 1);
        
        console.log('genTable(' + page + ') finished');
    }
    this.drawSheet = function()
    {
        var container = $('<div class="ion-sheet-container"></div>');
        var header = $('<div class="ion-sheet-header"></div>');
        var body = $('<div class="ion-sheet-body"></div>');
        var footer = $('<div class="ion-sheet-footer"></div>');
        
        container.append(header);
        container.append(body);
        container.append(footer);
        
        // left top corner
        var leftTop = $('<div class="ion-sheet-left-top"><table><tr><td></td></tr></table</div>');
        header.append(leftTop);
        
        // column headers
        var columns = this.drawColumnTable();
        header.append(columns);
        
        // row labels
        var rows = this.drawRowTable();
        body.append(rows);
        
        // cells
        var cells = this.drawCellTable();
        body.append(cells);
        
        // footer
        var footerContent = this.drawFooter();
        footer.append(footerContent);
        //<div id="cell-select-handle" style="position: absolute; width: 6px; height: 6px; border: 3px solid LightSteelBlue; cursor: crosshair;"></div>
            
        return container;
    }
    
    this.drawColumnTable = function()
    {
        var sheetInfo = this.sheetInfo;
        var columnContainer = $('<div class="column-container"></div>');
        var tbl = $('<table class="tbl-column"></table>');
        var tr = $('<tr></tr>');
        tbl.append(tr);
        
        for (var i = 0; i < sheetInfo.getColumnCount()+1; i++)
        {
            var label = '';
            var width = sheetInfo.defaultColWidth;
            
            if (i < sheetInfo.getColumnCount())
            {
                label = sheetInfo.columnInfo[i].label;
                width = sheetInfo.columnInfo[i].width;
            }
    
            var td = $('<td></td>');
            td.css('width', width);
            td.css('min-width', width);
            td.css('max-width', width);
            td.addClass('unselectable');
            
            // 마지막 컬럼
            if (i != sheetInfo.getColumnCount())
            {
                var div = $('<div></div>');
                div.css('width', '100%');
                //div.text(label);
                td.append(div);
                
                var key = sheetInfo.columnInfo[i].key;
                var span = $('<span class="column-label" column-key="' + key + '">' + label + '</span>');
                div.append(span);
            }
            
            tr.append(td);
        }
        columnContainer.append(tbl);
        
        return columnContainer;
    }
    
    this.drawColumnResizeHandles = function(columnTable)
    {
        var width = columnTable[0].offsetWidth + 'px';
        
        var divContainer = $('<div class="resize-handle-container"></div>');
        divContainer.css('width', width);
        divContainer.css('height', '0px');
        divContainer.css('position', 'relative');
        
        var left = 0;
        var tbl = columnTable[0];
        
        for (var i = 0; i < sheetInfo.getColumnCount()-1; i++)
        {
            left += tbl.rows[0].cells[i].offsetWidth;
            
            var divHandler = $('<div></div>');
            divHandler.attr('class', 'col-resize-handle');
            divHandler.css('left', left + 'px');
            //divHandler.css('background-color', 'red');
            divHandler.addClass('draggable');
            divContainer.append(divHandler);
        }
        
        return divContainer;	
    }
    
    this.drawRowTable = function()
    {
        var sheetInfo = this.sheetInfo;
        var container = $('<div class="row-container"></div>');
        var tbl = $('<table class="tbl-row"></table>');
        
        for (var i = 0; i < sheetInfo.rows+1; i++)
        {
            var tr = $('<tr></tr>');
            tbl.append(tr);
    
            var td = $('<td></td>');
            td.css('height', sheetInfo.defaultRowHeight);
            td.addClass('unselectable');
            
            if (i != sheetInfo.rows)
                td.text('' + (i+1));
            
            tr.append(td);
        }
        container.append(tbl);
        return container;
    }
    
    this.drawCellTable = function()
    {
        var sheetInfo = this.sheetInfo;
        var container = $('<div class="cell-container"></div>');
        var tbl = $('<table class="tbl-cell"></table>');
        
        for (var j = 0; j < sheetInfo.rows; j++)
        {
            var tr = $('<tr></tr>');
            tbl.append(tr);
    
            for (var i = 0; i < sheetInfo.getColumnCount(); i++)
            {
                var width = sheetInfo.columnInfo[i].width;
                var td = $('<td class="unselectable"></td>');
                
                td.css('width', width);
                td.css('min-width', width);
                td.css('max-width', width);
                
                if (i == 0)
                    td.css('height', sheetInfo.defaultRowHeight);
                
                tr.append(td);
            }
        }
    
        var handle = $('<div class="cell-select-handle" style="display:none"></div>');
        container.append(handle);
    
        container.append(tbl);
        
        return container;
    }
    
    this.drawFooter = function()
    {
        return null;
    }
    
    this.drawPager = function()
    {
        var sheetInfo = this.sheetInfo;
        var page  = sheetInfo.currentPage == 0 ? 1 : sheetInfo.currentPage;
        var page10 = Math.ceil(page / 10);
        var pageCnt = sheetInfo.getPageCount();
        var pageCnt10 = Math.ceil(pageCnt / 10);
        var startPage = 1 + (page10-1) * 10;
        var endPage = (startPage + 9 > pageCnt) ? pageCnt : startPage + 9;
        
        var prevPage = (page10-1) * 10;
        var nextPage = (page10) * 10 + 1; 
        
        var html = '<div class="pagination">';
        
        if (prevPage > 0)
            html += '<a href="#" page="' + prevPage + '">&laquo;</a>';
        
        for (var i = startPage; i <= endPage; i++)
        {
            if (i == page)
                html += '<a href="#" class="active" page="' + i + '">' + i + '</a>';
            else
                html += '<a href="#" page="' + i + '">' + i + '</a>';
        }
        
        if (nextPage <= pageCnt)
            html += '<a href="#" page="' + nextPage + '">&raquo;</a>';
        
        $('.pagination').remove();
        $('.ion-sheet-footer').append($(html));
    }

}