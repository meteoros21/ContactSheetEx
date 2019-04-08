function CellWindow(contactSheet)
{
    this.contactSheet = contactSheet;
    this.sheetInfo = contactSheet.sheetInfo;
    this.undoManager = this.sheetInfo.undoManager;
    this.currentCell = this.sheetInfo.currentCell;

    this.container = null;
    this.currentCellMarker = null;
    this.tableCell = null;

    this.groupMenu = null;

    // 빠른 테이블 그리기를 위해 임시로 만든 테이블
    this.dummyTableCell = null;

    this.prevCellData = null;
    this.prevCellHeight = 0;

    this.create = function (parent)
    {
        $('.cell-container').remove();

        this.container = $('<div class="cell-container"></div>');
        this.tableCell = $('<table class="tbl-cell"></table>');

        //if (this.dummyTableCell == null)
            this.createDummyTable();

        this.redraw(this.sheetInfo.currentPage);

        // Cell Marker
        this.currentCellMarker = $('<div id="cell-marker" style="display: none"></div>');
        this.container.append(this.currentCellMarker);
        this.currentCellMarker.on('keydown', function(e) {
            e.preventDefault();
            e.stopImmediatePropagation();
        });

        // Scroll Event
        this.setScrollEvent(this.container);

        // Mouse Event
        this.setMouseDownEvent(this.tableCell);
        this.setMouseOverEvent(this.tableCell);
        this.setMouseUpEvent(this.tableCell);
        this.setMouseDblclkEvent(this.tableCell);

        this.container.append(this.tableCell);
        parent.append(this.container);
    }

    this.redraw = function (page)
    {
        var sheetInfo = this.sheetInfo;
        var startIndex = (page - 1) * this.sheetInfo.rowsPerPage;
        var length = sheetInfo.contactList.length - startIndex;

        if (length > sheetInfo.rowsPerPage)
            length = sheetInfo.rowsPerPage;


        // 임시 테이블을 생성한다.
        var tmpTableCell = $('<table class="tbl-cell"></table>');

        // 테이블을 복사한다.
        tmpTableCell[0].innerHTML = this.dummyTableCell[0].innerHTML;

        for (var j = startIndex, row = 0; j < startIndex + length; j++, row++)
        {
            var contact = this.sheetInfo.contactList[j];
            var tr = tmpTableCell[0].rows[row];
            $(tr).attr('contact-id', contact.fields['id']);

            for (var i = 0; i < this.sheetInfo.columnList.length; i++)
            {
                var td = tr.cells[i];

                var key = this.sheetInfo.columnList[i].key;
                td.innerHTML = contact.getLabel(key);

                if (contact.isFieldModified(key))
                    $(td).addClass('modified');
            }
        }

        // 삭제해야할 테이블 Row수
        var rowCnt = sheetInfo.rowsPerPage - length;
        for (var i = 0; i < rowCnt; i++)
        {
            $(tmpTableCell[0].rows[length+1]).remove();
        }

        this.tableCell[0].innerHTML = tmpTableCell[0].innerHTML;
        // this.tableCell[0].parentNode.replaceChild(tmpTableCell[0], this.tableCell[0]);
        // this.tableCell = $('.table-cell');


        var tableRow = sheetInfo.rowIndexWindow.tableRow[0];
        this.tableCell.find('tr').each(function (idx, tr) {

            //var h = tr.offsetHeight;
            $(tableRow.rows[idx].cells[0]).css('height', tr.offsetHeight);
        })
    }

    this.hideCellMarker = function ()
    {
        this.currentCellMarker.css('display', 'none');
    }

    this.showCellMarker = function (col, row)
    {
        if (typeof col == 'undefined')
            col = this.sheetInfo.currentCell.col;
        if (typeof row == 'undefined')
            row = this.sheetInfo.currentCell.row;

        var cell = this.tableCell[0].rows[row].cells[col];

        var offsetLeft = cell.offsetLeft;
        var offsetTop = cell.offsetTop;
        var offsetWidth = cell.offsetWidth;
        var offsetHeight = cell.offsetHeight;

        this.currentCellMarker.css('left', offsetLeft + 'px')
            .css('top', offsetTop + 'px')
            .css('width', offsetWidth + 'px')
            .css('height', offsetHeight + 'px')
            .css('display', 'block');
    }

    this.setColumnWidth = function(col, width, finished)
    {
        for (var i = 0; i < this.tableCell[0].rows.length; i++)
        {
            var cell = $(this.tableCell[0].rows[i].cells[col]);
            cell.css('width', width + 'px');
            cell.css('min-width', width + 'px');
            cell.css('max-width', width + 'px');
        }

        if (finished)
        {
            if (this.dummyTableCell == null)
                return;

            for (i = 0; i < this.dummyTableCell[0].rows.length; i++)
            {
                var cell = $(this.dummyTableCell[0].rows[i].cells[col]);
                cell.css('width', width + 'px');
                cell.css('min-width', width + 'px');
                cell.css('max-width', width + 'px');
            }
        }
    }

    this.redrawContact = function (contactId, contact)
    {
        var tr = this.tableCell.find('tr[contact-id=' + contactId + ']');

        if (typeof contact == 'undefined')
            contact = this.contactSheet.getContactById(contactId);

        if (tr.length === 0 || contact == null)
            return;

        for (var i = 0; i < this.sheetInfo.getColumnCount(); i++)
        {
            var td = $(tr[0].cells[i]);

            var key = this.sheetInfo.getColumnKey(i);
            td.html(contact.getLabel(key));

            if (contact.isFieldModified(key))
                $(td).addClass('modified');
            else
                $(td).removeClass('modified');

        }

        var height = tr[0].offsetHeight;
        var row = tr.index();

        var tdRow = $(this.sheetInfo.rowIndexWindow.tableRow[0].rows[row].cells[0]);
        if (contact.modified)
            tdRow.addClass('modified');
        else
            tdRow.removeClass('modified');

        tdRow.css('height', height + 'px');

        //this.setCurrentCell(this.sheetInfo.currentCell.col, this.sheetInfo.currentCell.row);
    }

    // 하나의 셀만 다시 그린다.
    this.redrawCell = function (col, row, contact)
    {
        var key = this.sheetInfo.getColumnKey(col);
        var td = this.tableCell[0].rows[row].cells[col];
        td.innerHTML = contact.getLabel(key);

        if (contact.modified)
        {
            $(td).addClass('modified');
            $(this.sheetInfo.rowIndexWindow.tableRow[0].rows[row].cells[0]).addClass('modified');
        }
        else
        {
            $(td).removeClass('modified');
            $(this.sheetInfo.rowIndexWindow.tableRow[0].rows[row].cells[0]).removeClass('modified');
        }

        this.recalcRowHeight(row);
    }

    this.createDummyTable = function ()
    {
        this.dummyTableCell = $('<table></table>');

        for (var j = 0; j < this.sheetInfo.rowsPerPage + 1; j++)
        {
            var tr = $('<tr></tr>');

            for (var i = 0; i < this.sheetInfo.columnList.length; i++)
            {
                var columnInfo = this.sheetInfo.columnList[i];

                var key = columnInfo.key;
                var width = columnInfo.width;
                var td = $('<td style="width:' + width + '; min-width:' + width + '; max-width:' + width + '"></td>');

                if (key == 'postal-address' || key == 'note')
                    td.addClass('multiline-text');
                else
                    td.addClass('singleline-text');
                tr.append(td);
            }

            this.dummyTableCell.append(tr);

        }
    }

    this.setScrollEvent = function (container)
    {
        var thisCellWindow = this;

        container.scroll(function () {

            var top = $(this).scrollTop();
            var left = $(this).scrollLeft();

            thisCellWindow.contactSheet.sheetInfo.columnWindow.container.scrollLeft(left);
            thisCellWindow.contactSheet.sheetInfo.rowIndexWindow.container.scrollTop(top);
        });
    }

    this.setMouseDblclkEvent = function (table)
    {
        var thisCellWindow = this;

        table.on('dblclick', function (event)
        {
            thisCellWindow.startEditing();
        })
    }

    this.setMouseDownEvent = function (table)
    {
        var thisCellWindow = this;

        table.on('mousedown', function (event)
        {
            if (event.which === 1)
            {
                var sheetInfo = thisCellWindow.sheetInfo;
                var td = $(event.target).closest('td');

                var col = td.index();
                var row = td.parent().index();

                // cmd key
                if (event.metaKey)
                {
                    if ($(this).find('.editing-now').length == 0)
                    {
                        if (event.shiftKey)
                        {
                            thisCellWindow.selectCells(col, row);
                        }
                        else
                        {
                            thisCellWindow.setCurrentCell(col, row);
                            thisCellWindow.selectCells(col, row, true);
                        }
                    }
                }
                else if (event.shiftKey)
                {
                    if ((col != sheetInfo.currentCell.col || row != sheetInfo.currentCell.row) && $(this).find('.editing-now').length == 0)
                    {
                        thisCellWindow.selectCells(col, row);
                    }
                }
                else
                {
                    if (sheetInfo.selectedRows != null && sheetInfo.selectedRows.length > 0)
                        thisCellWindow.unselectRows();

                    thisCellWindow.unselectCells();

                    if (col != sheetInfo.currentCell.col || row != sheetInfo.currentCell.row)
                    {
                        thisCellWindow.setCurrentCell(col, row);
                    }
                    else if (sheetInfo.getColumnKey(col) == 'groups')
                    {
                        if (sheetInfo.groupMenu.isVisible())
                            thisCellWindow.stopEditing();
                    }
                }
            }
        })
    }

    this.setMouseOverEvent = function (table)
    {
        var thisCellWindow = this;

        table.on('mouseover', function (event)
        {
            if (event.which === 1 && $(thisCellWindow).find('.editing-now').length == 0)
            {
                event.preventDefault();

                var td = $(event.target).closest('td');
                var col = td.index();
                var row = td.parent().index();

                thisCellWindow.selectCells(col, row);
                thisCellWindow.checkScroll(col, row);
            }
        })
    }

    this.setMouseUpEvent = function (table)
    {
        var thisCellWindow = this;

        table.on('mouseup', function (event)
        {
            if (event.which == 1 && $(thisCellWindow).find('.editing-now').length == 0)
            {
                event.preventDefault();

                var td = $(event.target).closest('td');
                var col = td.index();
                var row = td.parent().index();

                var key = thisCellWindow.sheetInfo.getColumnKey(col);
                if (key == 'postal-address' || key == 'note')
                    $('#cell-ta')[0].focus();
                else
                    $('#cell-input')[0].focus();

                thisCellWindow.checkScroll(col, row);
            }
        })
    }

    this.updateSelectedRows = function ()
    {
        var sheetInfo = this.sheetInfo;
        var table = this.tableCell;

        var selectedRows = sheetInfo.normalizeSelectedRow();

        table.find('.selected-cell-lefttop').removeClass('selected-cell-lefttop');
        table.find('.selected-cell-righttop').removeClass('selected-cell-righttop');
        table.find('.selected-cell-leftbottom').removeClass('selected-cell-leftbottom');
        table.find('.selected-cell-rightbottom').removeClass('selected-cell-rightbottom');
        table.find('.selected-cell-left').removeClass('selected-cell-left');
        table.find('.selected-cell-top').removeClass('selected-cell-top');
        table.find('.selected-cell-right').removeClass('selected-cell-right');
        table.find('.selected-cell-bottom').removeClass('selected-cell-bottom');
        table.find('.selected-cell').removeClass('selected-cell');

        var colCnt = sheetInfo.getColumnCount();

        for (var i = 0; i < selectedRows.length; i++)
        {
            var top = false;
            var bottom = false;

            var prevRow = (i == 0) ? -1 : selectedRows[i-1];
            var crntRow = selectedRows[i];
            var nextRow = (i == colCnt-1) ? -1 : selectedRows[i+1];

            if (prevRow < 0 || prevRow+1 != crntRow)
                top = true;

            if (nextRow < 0 || nextRow-1 != crntRow)
                bottom = true;


            for (var j = 0; j < colCnt; j++)
            {
                var td = $(table[0].rows[crntRow].cells[j]);
                td.addClass('selected-cell');

                if (top)
                    td.addClass('selected-cell-top');
                if (bottom)
                    td.addClass('selected-cell-bottom');

                if (j === 0)
                    td.addClass('selected-cell-left');
                else if (j === colCnt-1)
                    td.addClass('selected-cell-right');
            }
        }
    }

    this.selectRow = function(row)
    {
        var sheetInfo = this.sheetInfo;
        var table = this.tableCell;

        if (sheetInfo.selectedRows == null)
            sheetInfo.selectedRows = new Array();

        for (var i = 0; i < sheetInfo.selectedRows.length; i++)
        {
            if (sheetInfo.selectedRows[i] === row)
                return;
        }
        sheetInfo.selectedRows.push(row);
        sheetInfo.selectedRows.sort();

        for (i = 0; i < sheetInfo.getColumnCount(); i++)
        {
            var td = $(table[0].rows[row].cells[i]);

            if (i === 0)
            {
                td.addClass('selected-cell-lefttop');
                td.addClass('selected-cell-leftbottom');
            }
            else if (i === sheetInfo.getColumnCount()-1)
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

    this.selectCells = function(col, row, isNewSelection)
    {
        var table = this.tableCell;
        var sheetInfo = this.sheetInfo;

        if (isNewSelection === true || sheetInfo.selectedCells == null)
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
    this.unselectCells = function(col, row)
    {
        var tbl = this.tableCell;
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
    }

    this.unselectRows = function ()
    {
        if (this.sheetInfo.selectedRows == null || this.sheetInfo.selectedRows.length === 0)
            return;

        var tbl = this.tableCell;
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

    this.startEditing = function(editMode)
    {
        if (typeof editMode == 'undefined')
            editMode = true;

        var sheetInfo = this.contactSheet.sheetInfo;
        var col = sheetInfo.currentCell.col;
        var row = sheetInfo.currentCell.row;
        var key = sheetInfo.getColumnKey(col);

        var table = this.tableCell;
        var cell = table.find('.current-cell');
        cell.addClass('editing-now').removeClass('current-cell');
        this.currentCellMarker.css('display', 'none');

        this.prevCellData = this.getCellData(col, row);
        //this.prevCellHeight = cell[0].offsetHeight;


        if (key === 'groups')
        {
            sheetInfo.groupMenu.show(cell, this.prevCellData.value);
        }
        else if (key === 'note' || key === 'postal-address')
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
                input.val(this.prevCellData.value);
            input[0].focus();

            cell.text('');
        }
        else
        {
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
                input.val(this.prevCellData.label);
            input[0].focus();

            cell.text('');
        }
    }
    this.stopEditing = function ()
    {
        var currentCell = this.tableCell.find('.editing-now');
        if (currentCell.length !== 1)
            return;

        currentCell.css('height', this.sheetInfo.defaultRowHeight);
        currentCell.removeClass('editing-now').addClass('current-cell');

        var tr = currentCell.parent();
        var col = currentCell.index();
        var row = tr.index();

        var contactId = tr.attr('contact-id');
        var contact = this.contactSheet.getContactById(contactId);

        var key = this.sheetInfo.getColumnKey(col)
        var newCellData = new CellData(key);
        var oldCellData = new CellData(key);

        if (key === 'groups')
        {
            newCellData.label = this.sheetInfo.groupMenu.getSelectedLabel();
            newCellData.value = this.sheetInfo.groupMenu.getSelectedValue();
            this.sheetInfo.groupMenu.hide();
            $('#cell-input')[0].focus();
        }
        else if (key === 'note' || key === 'postal-address')
        {
            $('#cell-ta-container').css('left', '-1000px');

            var input1 = $('#cell-ta');
            input1.attr('editing', 'false');

            newCellData.label = input1.val().trimRight();
            newCellData.value = newCellData.label;
            input1.val('');
        }
        else
        {
            $('#cell-input-container').css('left', '-1000px');

            var input2 = $('#cell-input');
            input2.attr('editing', 'false');

            newCellData.label = input2.val().trimRight();
            newCellData.value = newCellData.label;
            input2.val('');
        }

        var needRegisterUndo = false;
        if (contact == null && row === this.tableCell[0].rows.length - 1)
        {
            oldCellData.label = '';
            oldCellData.value = (key === 'groups') ? null : '';
            var offsetRow = (this.sheetInfo.currentPage - 1) * this.sheetInfo.rowsPerPage;

            if (newCellData.value != '')
            {
                contactId = this.contactSheet.getNextContactId();
                contact = new Contact(contactId);
                contact.setValue(key, newCellData.value);
                contact.isNew = true;

                tr.attr('contact-id', contactId);
                this.redrawCell(col, row, contact);

                this.contactSheet.addContact(row + offsetRow, contact);

                this.sheetInfo.rowIndexWindow.addRow(1);
                this.addRow(1);

                needRegisterUndo = true;
            }
        }
        else
        {
            oldCellData.label = contact.getLabel(key);
            oldCellData.value = contact.getValue(key);

            if (contact.isValueEqual(key, newCellData.value) === false)
            {
                contact.setValue(key, newCellData.value);
                this.redrawCell(col, row, contact);

                needRegisterUndo = true;
            }
            else
            {
                currentCell[0].innerHTML = oldCellData.label;
            }
        }

        if (needRegisterUndo)
        {
            var undoData = new UndoData('write');
            undoData.addWriteAction(col, contactId, oldCellData, newCellData);
            this.undoManager.addUndoData(undoData);
        }

        this.setCurrentCell(col, row);
    }
    this.cancelEditing = function ()
    {
        var sheetInfo = this.sheetInfo;
        var cell = this.tableCell.find('.editing-now');
        if (cell.length <= 0)
            return;

        var col = cell.index();
        var key = this.sheetInfo.getColumnKey(col);

        cell.removeClass('editing-now').addClass('current-cell');

        this.currentCellMarker.css('display', 'block');
        cell.html(this.prevCellData.label);

        if (key === 'groups')
        {
            sheetInfo.groupMenu.hide();
        }
        if (key === 'note' || key === 'postal-address')
        {
            $('#cell-ta-container').css('left', '-1000px');

            var input = $('#cell-ta');
            input.attr('editing', 'false');
            input.val('');
        }
        else
        {
            $('#cell-input-container').css('left', '-1000px');

            var input = $('#cell-input');
            input.attr('editing', 'false');
            input.val('');
        }

        this.recalcRowHeight(sheetInfo.currentCell.row);
    }
    this.recalcRowHeight = function(row)
    {
        var height = this.tableCell[0].rows[row].offsetHeight;
        $(this.sheetInfo.rowIndexWindow.tableRow[0].rows[row].cells[0]).css('height', height + 'px');
    }
    this.checkScroll = function(col, row)
    {
        var table = this.tableCell;
        var cell = $(table[0].rows[row].cells[col]);

        var left = cell[0].offsetLeft;
        var top = cell[0].offsetTop;
        var right = left + cell.outerWidth();
        var bottom = top + cell.outerHeight();

        var container = this.container;
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
    }

    // this.setColumnWidth = function (col, width)
    // {
    //     if (this.dummyTableCell == null)
    //         return;
    //
    //     for (var i = 0; i < this.dummyTableCell[0].rows.length; i++)
    //         $(this.dummyTableCell[0].rows[i].cells[col]).css('width', width);
    // }

    this.setCurrentCellByContactId = function (contactId, col)
    {
        var idx = this.contactSheet.getContactIdx(contactId);

        if (idx >= 0)
        {
            var page = Math.ceil((idx + 1) / this.sheetInfo.rowsPerPage);
            var row = idx - (page - 1) * this.sheetInfo.rowsPerPage;

            if (page !== this.sheetInfo.currentPage)
                this.contactSheet.setPage(page);

            this.setCurrentCell(col, row);
        }
        else
        {
            this.setCurrentCell(col, this.tableCell[0].rows.length-1);
        }
    }

    this.setCurrentCell = function(col, row)
    {
        var cellMarker = this.currentCellMarker;
        var tableCell = this.tableCell;

        if (typeof findDialog != 'undefined')
        {
            var cellText = tableCell[0].rows[row].cells[col].innerText.trimRight();
            findDialog.checkButtons(cellText);
        }

        // 편집 중인 셀이 있으면 편집을 종료한다.
        if (tableCell.find('.editing-now').length > 0)
            this.stopEditing();

        // 기존의 현재 셀 속성을 삭제한다.
        tableCell.find('.current-cell').removeClass('current-cell').addClass('unselectable');

        this.sheetInfo.currentCell.col = col;
        this.sheetInfo.currentCell.row = row;

        // 새로 선태된 셀을 현재 셀로 변경
        var newCell = $(tableCell[0].rows[row].cells[col]);
        newCell.addClass('current-cell').removeClass('unselectable');
        this.sheetInfo.rowIndexWindow.setCurrentRow(row);
        this.sheetInfo.columnWindow.setCurrentCol(col);

        // 셀 선택 상자를 그린다.
        this.showCellMarker();
        // var offsetLeft = newCell[0].offsetLeft;
        // var offsetTop = newCell[0].offsetTop;
        // var offsetWidth = newCell[0].offsetWidth;
        // var offsetHeight = newCell[0].offsetHeight;
        // cellMarker.css('left', offsetLeft + 'px');
        // cellMarker.css('top', offsetTop + 'px');
        // cellMarker.css('width', offsetWidth + 'px');
        // cellMarker.css('height', offsetHeight + 'px');
        // cellMarker.css('display', 'block');

        this.checkScroll(col, row);

        var key = this.sheetInfo.getColumnKey(col);
        if (key == 'postal-address' || key == 'note')
            $('#cell-ta')[0].focus();
        else
            $('#cell-input')[0].focus();
    }

    this.getContactIdByRowIndex = function(rowIdx)
    {
        return $(this.tableCell[0].rows[rowIdx]).attr('contact-id');
    }

    this.getRowIndexByContactId = function (contactId)
    {
        var tr = this.tableCell.find('tr[contact-id=' + contactId + ']');
        return tr.length === 0 ? -1 : tr.index();
    }

    this.addRow = function (count)
    {
        if (typeof count == 'undefined')
            count = 1;

        for (var i = 0; i < count; i++)
        {
            var tr = $('<tr></tr>');

            for (var i = 0; i < this.sheetInfo.columnList.length; i++) {
                var columnInfo = this.sheetInfo.columnList[i];

                var key = columnInfo.key;
                var width = columnInfo.width;
                var td = $('<td class="unselectable" style="width:' + width + '; min-width:' + width + '; max-width:' + width + '"></td>');

                if (key == 'postal-address' || key == 'note')
                    td.addClass('multiline-text');
                else
                    td.addClass('singleline-text');
                tr.append(td);
            }

            this.tableCell.find('tr:last').after(tr);
        }
    }

    this.addContact = function(contactIdx, contact)
    {
        var offset = (this.sheetInfo.currentPage - 1) * this.sheetInfo.rowsPerPage;
        var row = contactIdx - offset;

        var tr = $('<tr contact-id="' + contact.fields['id'] + '"></tr>');
        for (var i = 0; i < this.sheetInfo.columnList.length; i++) {
            var columnInfo = this.sheetInfo.columnList[i];

            var key = columnInfo.key;
            var width = columnInfo.width;
            var td = $('<td class="unselectable" style="width:' + width + '; min-width:' + width + '; max-width:' + width + '">' + contact.getLabel(key) + '</td>');

            if (contact.isFieldModified(key))
                td.addClass('modified');

            if (key === 'postal-address' || key === 'note')
                td.addClass('multiline-text');
            else
                td.addClass('singleline-text');
            tr.append(td);
        }

        this.tableCell.find('tr:nth-child(' + row + ')').after(tr);
        this.sheetInfo.rowIndexWindow.insertRow(row, 1, contact.modified);

        this.recalcRowHeight(row);
    }

    this.deleteContact = function(contactId)
    {
        var tr = this.tableCell.find('tr[contact-id=' + contactId + ']');
        var row = tr.index();

        tr.remove();
        this.sheetInfo.rowIndexWindow.deleteRow(row);
    }

    this.deleteSelectedCellText = function()
    {
        var undoData = new UndoData('write');
        var offset = (this.sheetInfo.currentPage - 1) * this.sheetInfo.rowsPerPage;

        // 선택된 영역이 없는 경우
        if (this.sheetInfo.selectedCells == null || this.sheetInfo.selectedCells.length === 0)
        {
            var col = this.currentCell.col;
            var row = this.currentCell.row;
            var key = this.sheetInfo.getColumnKey(col);
            var contact = this.getContactByRow(row);

            if (contact != null)
            {
                var oldCellData = new CellData(key, contact.getLabel(key), contact.getValue(key));
                var newCellData = new CellData(key, '', '');

                contact.setValue(key, '');
                this.redrawCell(col, row, contact);

                undoData.addWriteAction(col, contact.fields['id'], oldCellData, newCellData, false, row+offset);
                this.undoManager.addUndoData(undoData);
            }
        }
        else
        {
            for (var k = 0; k < this.sheetInfo.selectedCells.length; k++)
            {
                var selection = this.sheetInfo.selectedCells[k];

                for (var j = selection.row1; j <= selection.row2; j++)
                {
                    var contact = this.getContactByRow(j);

                    if (contact != null)
                    {
                        var contactId = contact.fields['id'];

                        for (var i = selection.col1; i <=  selection.col2; i++)
                        {
                            var key = this.sheetInfo.getColumnKey(i);

                            var oldCellData = new CellData(key, contact.getLabel(key), contact.getValue(key));
                            var newCellData = new CellData(key, '', '');

                            contact.setValue(key, '');
                            this.redrawCell(i, j, contact);

                            undoData.addWriteAction(i, contactId, oldCellData, newCellData, false, j+offset);
                        }
                    }
                }
            }

            if (undoData.actionList.length > 0)
                this.undoManager.addUndoData(undoData);
        }
    }

    this.deleteSelectedRow = function ()
    {
        if (this.sheetInfo.selectedRows == null || this.sheetInfo.selectedRows.length == 0)
            return;

        var undoData = new UndoData('deleteRow', this.sheetInfo.currentPage);
        var offsetRowIdx = (this.sheetInfo.currentPage-1) * this.sheetInfo.rowsPerPage;

        var selectedRows = this.sheetInfo.normalizeSelectedRow();
        for (var i = selectedRows.length-1; i >= 0; i--)
        {
            var row = selectedRows[i];
            var contactId = $(this.tableCell[0].rows[row]).attr('contact-id');
            var contact = this.contactSheet.getContactById(contactId);

            this.contactSheet.deleteContact(contactId);
            this.deleteContact(contactId);

            var undoAction = {
                'contact-idx': offsetRowIdx + row,
                'contact-id': contactId,
                'contact': contact
            }
            undoData.actionList.push(undoAction);
        }

        this.undoManager.addUndoData(undoData);

        var crntRow = this.sheetInfo.currentCell.row;
        this.hideCellMarker();

        // 필요한 만큼 Row 를 추가한다.
        if (this.tableCell[0].rows.length - 1 < this.sheetInfo.contactList.length)
        {
            var rowIdx = this.tableCell[0].rows.length - 1 + offsetRowIdx;
            var cnt = this.sheetInfo.contactList.length - this.tableCell[0].rows.length + 1;

            for (var i = rowIdx; i < rowIdx + cnt; i++)
            {
                var contact = this.sheetInfo.contactList[i];
                this.addContact(i, contact);
            }
        }

        if (crntRow > this.tableCell[0].rows.length-1)
            crntRow = this.tableCell[0].rows.length-1;

        this.setCurrentCell(this.sheetInfo.currentCell.col, crntRow);
    }

    this.clearSelection = function()
    {

    }

    this.getContactByRow = function(row)
    {
        var contactId = this.getContactIdByRowIndex(row);
        return this.contactSheet.getContactById(contactId);
    }


    this.getCellData = function (col, row)
    {
        var key = this.sheetInfo.getColumnKey(col);
        var contact = this.getContactByRow(row);

        var cellData = new CellData(key);

        if (contact == null)
        {
            cellData.label = '';
            cellData.value = key == 'groups' ? null : '';
        }
        else
        {
            cellData.label = contact.getLabel(key);
            cellData.value = contact.getValue(key);
        }

        return cellData;
    }

    this.getCellText = function (col, row)
    {
        var key = this.sheetInfo.getColumnKey(col);
        var contact = this.getContactByRow(row);

        return contact.getLabel(key);
    }

    this.getCurrentCellText = function ()
    {
        return this.getCellText(this.sheetInfo.currentCell.col, this.sheetInfo.currentCell.row);
    }

    this.getClipboardData = function ()
    {
        var sheetInfo = this.sheetInfo;
        var clipboardData = new Object();

        if (sheetInfo.selectedRows != null && sheetInfo.selectedRows.length > 0)
        {
            var selectedRows = sheetInfo.normalizeSelectedRow();

            clipboardData.dataType = 'rows';
            clipboardData.rows = new Array();

            for (var i = 0; i < selectedRows.length; i++)
            {
                var row = selectedRows[i];
                var contact = this.getContactByRow(row);
                var contactId = contact.fields['id'];
                clipboardData.rows.push(contactId);
            }

            return JSON.stringify(clipboardData);
        }
        else
        {
            clipboardData.dataType = 'cells';
            clipboardData.col = 1000000;
            clipboardData.row = 1000000;

            var cellDataList = new Array();

            if (sheetInfo.selectedCells != null)
            {
                for (var k = 0; k < sheetInfo.selectedCells.length; k++)
                {
                    var selection = sheetInfo.selectedCells[k];
                    for (var j = selection.row1; j <= selection.row2; j++)
                    {
                        if (j < clipboardData.row)
                            clipboardData.row = j;

                        for (var i = selection.col1; i <= selection.col2; i++)
                        {
                            if (i < clipboardData.col)
                                clipboardData.col = i;

                            var cellData = this.getCellData(i, j);
                            cellData.col = i;
                            cellData.row = j;

                            cellDataList.push(cellData);
                        }
                    }
                }
            }
            else
            {
                clipboardData.col = sheetInfo.currentCell.col;
                clipboardData.row = sheetInfo.currentCell.row;

                var cellData = this.getCellData(sheetInfo.currentCell.col, sheetInfo.currentCell.row);
                cellData.col = sheetInfo.currentCell.col;
                cellData.row = sheetInfo.currentCell.row;
                cellDataList.push(cellData);
            }

            clipboardData.cellDataList = cellDataList;

            return JSON.stringify(clipboardData);
        }
    }

    this.pasteClipboardData = function (jsonString)
    {
        var sheetInfo = this.sheetInfo;
        var clipboardData = JSON.parse(jsonString);

        if (clipboardData.dataType === 'rows')
        {
            this.unselectRows();

            var offsetRow = (sheetInfo.currentPage - 1) * sheetInfo.rowsPerPage;
            var undoData = new UndoData('pasteRow');
            var rows = clipboardData.rows;
            for (var j = 0; j < rows.length; j++)
            {
                var orgContactId = rows[j];
                var orgContact = this.contactSheet.getContactById(orgContactId);
                var fields = orgContact.getFields(sheetInfo.columnInfo);

                var contactId = this.contactSheet.getNextContactId();
                var contact = new Contact(contactId);
                contact.isNew = true;
                contact.setFields(fields);
                contact.fields['id'] = contactId;

                var rowIdx = this.tableCell[0].rows.length - 1;
                this.contactSheet.addContact(rowIdx + offsetRow, contact);
                this.addContact(rowIdx, contact);

                var undoAction = new Object();
                undoAction['contact-id'] = contactId; // 저장하면 contactId가 달라지므로, 저장 시에는 UndoData를 리셋해야한다.
                undoAction['row-idx'] = rowIdx + offsetRow;
                undoAction['page'] = sheetInfo.currentPage;
                undoAction['fields'] = contact.getFields(sheetInfo.columnList);
                undoAction['sort-info'] = sheetInfo.sortInfo;

                undoData.addAction(undoAction);
            }

            var rowIdx = this.tableCell[0].rows.length - 2;
            this.setCurrentCell(0, rowIdx);

            this.undoManager.addUndoData(undoData);
        }
        else
        {
            var offsetRow = (sheetInfo.currentPage - 1) * sheetInfo.rowsPerPage;
            var offsetX = sheetInfo.currentCell.col - clipboardData.col;
            var offsetY = sheetInfo.currentCell.row - clipboardData.row;

            var undoData = new UndoData('write');

            for (var i = 0; i < clipboardData.cellDataList.length; i++)
            {
                var data = clipboardData.cellDataList[i];
                var newCellData = new CellData();
                newCellData.setCellData(data);

                var col = newCellData.col + offsetX;
                var row = newCellData.row + offsetY;

                var rowAdded = false;
                var key = sheetInfo.getColumnKey(col);

                var orgCellData = new CellData(key);
                var contactId = null;

                // Is there need to add new row and contact object
                if (this.tableCell[0].rows.length-1 <= row)
                {
                    // create new contact object with new temporary id
                    contactId = this.contactSheet.getNextContactId();
                    var contact = new Contact(contactId, true);
                    contact.setValue(key, newCellData.value);

                    orgCellData.label = '';
                    orgCellData.value = (key === 'groups') ? null : '';

                    this.contactSheet.addContact(row + offsetRow, contact);
                    this.addContact(row + offsetRow, contact);

                    rowAdded = true;
                }
                else
                {
                    var contact = this.getContactByRow(row);
                    contactId = contact.fields['id'];
                    orgCellData.label = contact.getLabel(key);
                    orgCellData.value = contact.getValue(key);

                    if ((key == 'groups' && newCellData.key == 'groups') || key != 'groups')
                    {
                        contact.setValue(key, newCellData.value);
                        this.redrawContact(contactId, contact);
                    }
                }

                // Undo action
                undoData.addWriteAction(col, contactId, orgCellData, newCellData, rowAdded, row + offsetRow);
            }

            // var rowCnt = 0;
            // var lastContactId = '';
            // for (var i = 0; i < undoData.actionList.length; i++)
            // {
            //     if (undoData.actionList[i].contactId != lastContactId)
            //     {
            //         rowCnt++;
            //         lastContactId = undoData.actionList[i].contactId;
            //     }
            // }

            // if (rowCnt > 1)
            // {
            //     undoData.sortKey = sheetInfo.sortInfo['key'];
            //     undoData.sortType = sheetInfo.sortInfo['type'];
            // }

            // Undo action을 등록한다.
            this.undoManager.addUndoData(undoData);
        }
    }
}