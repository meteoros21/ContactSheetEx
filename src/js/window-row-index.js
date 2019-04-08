function RowIndexWindow(contactSheet)
{
    this.contactSheet = contactSheet;
    this.sheetInfo = contactSheet.sheetInfo;

    this.container = null;
    this.tableRow = null;
    this.dummyTableRow = null;

    this.create = function (parent)
    {
        this.container = $('<div class="row-container"></div>');
        this.tableRow = $('<table class="tbl-row"></table>');

        if (this.dummyTableRow == null)
            this.createDummyTable();

        this.redraw(1);

        this.container.append(this.tableRow);
        parent.append(this.container);

        this.addMouseEventHandler();
    }

    this.createDummyTable = function ()
    {
        this.dummyTableRow = $('<table></table>');

        for (var j = 0; j < this.sheetInfo.rowsPerPage + 1; j++)
            this.dummyTableRow.append($('<tr><td></td></tr>'));
    }

    this.redraw = function(page)
    {
        var sheetInfo = this.sheetInfo;
        var startIndex = (page - 1) * sheetInfo.rowsPerPage;
        var length = sheetInfo.contactList.length - startIndex;

        if (length > sheetInfo.rowsPerPage)
            length = sheetInfo.rowsPerPage;

        var tmpTableRow = $('<table></table>');
        tmpTableRow[0].innerHTML = this.dummyTableRow[0].innerHTML;

        for (var j = startIndex, row = 0; j < startIndex + length + 1; j++, row++)
            tmpTableRow[0].rows[row].cells[0].innerText = (j+1);

        // 남는 Row 를 삭제한다.
        var rowCnt = this.sheetInfo.rowsPerPage - length;
        for (var i = 0; i < rowCnt; i++)
            $(tmpTableRow[0].rows[length+1]).remove();

        this.tableRow[0].innerHTML = tmpTableRow[0].innerHTML;
    }

    this.setCurrentRow = function(row)
    {
        this.tableRow.find('.current-row').removeClass('current-row');
        $(this.tableRow[0].rows[row].cells[0]).addClass('current-row');
    }

    this.insertRow = function(idx, count)
    {
        if (typeof count == 'undefined')
            count = 1;

        for (var i = 0; i < count; i++)
            this.tableRow.find('tr:nth-child(' + idx + ')').after('<tr><td class="modified"></td></tr>');

        for (var i = idx; i < this.tableRow[0].rows.length; i++)
        {
            this.tableRow[0].rows[i].cells[0].innerText = (i+1);
        }
    }

    this.addRow = function (count)
    {
        if (typeof count == 'undefined')
            count = 1;

        var tr = this.tableRow.find('tr:last')[0];
        var val = parseInt(tr.cells[0].innerText);

        for (var i = 0; i < count; i++)
            this.tableRow.find('tr:last').after('<tr><td>' + (++val) + '</td></tr>');
    }

    this.deleteRow = function(idx)
    {
        this.tableRow.find('tr:nth-child(' + (idx+1) + ')').remove();
        for (var i = idx; i < this.tableRow[0].rows.length; i++)
        {
            this.tableRow[0].rows[i].cells[0].innerText = (i+1);
        }
    }

    this.addMouseEventHandler = function ()
    {
        var contactSheet = this.contactSheet;
        var sheetInfo = this.sheetInfo;

        this.tableRow.on('mousedown', function (event)
        {
            var td = $(event.target).closest('td');
            var row = td.parent().index();

            if (event.which != 1)
                return;

            event.preventDefault();

            if (event.metaKey)
            {
                sheetInfo.toggleSelectedRow(row);
                sheetInfo.lastSelectedRow = row;

                sheetInfo.cellWindow.setCurrentCell(0, row);
                sheetInfo.cellWindow.updateSelectedRows();
            }
            else if (event.shiftKey)
            {
                if (row > sheetInfo.lastSelectedRow)
                    sheetInfo.selectRow({s:sheetInfo.lastSelectedRow, e:row}, false);
                else
                    sheetInfo.selectRow({s:row, e:sheetInfo.lastSelectedRow}, false);

                sheetInfo.cellWindow.updateSelectedRows();
            }
            else
            {
                var row = td.parent().index();

                sheetInfo.selectedRows = [];
                sheetInfo.selectedRows.push({s:row, e:row});
                sheetInfo.cellWindow.updateSelectedRows();

                sheetInfo.lastSelectedRow = row;
                sheetInfo.cellWindow.setCurrentCell(0, row);
            }
        });
    }
}