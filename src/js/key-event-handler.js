function keydownHandler(event)
{
    var sheetInfo = mySheet.sheetInfo;

    if (sheetInfo.groupMenu.isVisible())
    {
        keyDownHandlerForGroupMenu(event);
        return true;
    }

    var target = $(event.target);
    var targetId = target.attr('id');

    if (target.attr('editing') !== 'true')
    {
        keyDownHandlerForSheet(event);
    }
    else
    {
        // 탭 키가 눌렸거나, 한 줄 데이터 입력 중에 엔터가 눌린 경우
        if (event.keyCode === 9 || (targetId === 'cell-input' && event.keyCode === 13)) // enter
        {
        	event.preventDefault();
        	var col = sheetInfo.currentCell.col; 
        	var row = sheetInfo.currentCell.row;

        	// 현재 편집 중이던 데이터의 편집을 정상종료한다(데이터 저장)
        	sheetInfo.cellWindow.stopEditing();

        	if (col < sheetInfo.getColumnCount() - 1)
        		sheetInfo.cellWindow.setCurrentCell(col + 1, row);
        	else if (row < sheetInfo.getRowCount() - 1)
        		sheetInfo.cellWindow.setCurrentCell(0, row + 1);
        }
        // ESC 키가 눌린 경우, 편집을 취소한다.
        else if (event.keyCode === 27)
        {
            event.preventDefault();
            sheetInfo.cellWindow.cancelEditing();
        }
    }
}

function keyDownHandlerForGroupMenu(event)
{
    event.preventDefault();

    var groupMenu = mySheet.sheetInfo.groupMenu;

    // ESC
    if (event.keyCode === 27)
    {
        // 편집을 취소한다.
        mySheet.sheetInfo.cellWindow.cancelEditing();
    }
    // Enter
    else if (event.keyCode === 13)
    {
        // 편집을 종료한다.
        mySheet.sheetInfo.cellWindow.stopEditing();
    }
    // UP
    else if (event.keyCode === 38)
    {
        event.metaKey ? groupMenu.pageUp() : groupMenu.moveUp();
    }
    // DN
    else if (event.keyCode === 40)
    {
        event.metaKey ? groupMenu.pageDown() : groupMenu.moveDown();
    }
    // PAGEUP
    else if (event.keyCode === 33)
    {
        groupMenu.pageUp();
    }
    // PAGEDN
    else if (event.keyCode === 34)
    {
        groupMenu.pageDown();
    }
    // HOME
    else if (event.keyCode == 36)
    {
        groupMenu.moveFirst();
    }
    // END
    else if (event.keyCode == 35)
    {
        groupMenu.moveLast();
    }
    // SPACE
    else if (event.keyCode == 32)
    {
        groupMenu.toggleSelection();
    }
    else
    {
        keyDownHandlerForSheet(event);
    }
}

function keyDownHandlerForSheet(event)
{
    var sheetInfo = mySheet.sheetInfo;
    var cellWindow = mySheet.sheetInfo.cellWindow;

    if (event.keyCode === 9) // TAB
    {
        event.preventDefault();

        // 편집을 멈추고 다음 행으로 이동한다.
        sheetInfo.cellWindow.stopEditing();

        var col = sheetInfo.currentCell.col;
        var row = sheetInfo.currentCell.row;

        if (event.shiftKey == false)
        {
            if (col < sheetInfo.getColumnCount() - 1)
            {
                sheetInfo.cellWindow.setCurrentCell(col+1, row);
            }
            else
            {
                if (row < sheetInfo.tableCell[0].rows.length - 1)
                    sheetInfo.cellWindow.setCurrentCell(0, row+1);
            }
        }
        else
        {
            if (col > 0)
            {
                sheetInfo.cellWindow.setCurrentCell(col-1, row);
            }
            else
            {
                if (row > 0)
                    sheetInfo.cellWindow.setCurrentCell(sheetInfo.getColumnCount()-1, row-1);
            }
        }
    }
    else if (event.keyCode === 13)
    {
        if ($('.group-menu-wrap').css('display') != 'none')
        {
            event.preventDefault();
            sheetInfo.cellWindow.stopEditing();
        }
        else
        {
            event.preventDefault();
            sheetInfo.cellWindow.startEditing();
        }
    }
    else if (event.keyCode === 27)
    {
        if ($('.group-menu-wrap').css('display') != 'none')
        {
            event.preventDefault();
            sheetInfo.cellWindow.stopEditing();
        }
        else
        {
            sheetInfo.cellWindow.unselectRows();
            sheetInfo.cellWindow.unselectCells();
        }
    }
    else if (event.keyCode == 37) // left
    {
        event.preventDefault();
        sheetInfo.cellWindow.unselectRows();

        var oldCol = sheetInfo.currentCell.col;
        var newCol = 0;
        var newRow = sheetInfo.currentCell.row;

        if (event.shiftKey && sheetInfo.colForSel >= 0)
        {
            oldCol = sheetInfo.colForSel;
            newRow = sheetInfo.rowForSel;
        }

        if (event.metaKey)
            newCol = 0;
        else
            newCol = (oldCol > 0) ? oldCol - 1 : 0;

        if (event.shiftKey)
        {
            sheetInfo.cellWindow.selectCells(newCol, newRow);
            sheetInfo.cellWindow.checkScroll(newCol, newRow);
        }
        else
        {
            sheetInfo.cellWindow.unselectCells();
            sheetInfo.cellWindow.setCurrentCell(newCol, newRow);
        }
    }
    else if (event.keyCode == 38) // up
    {
        if ($('.group-menu-wrap').css('display') != 'none')
        {
            event.preventDefault();
            sheetInfo.groupMenu.moveUp();
        }
        else
        {
            event.preventDefault();
            sheetInfo.cellWindow.unselectRows();

            var oldCol = sheetInfo.currentCell.col;
            var oldRow = sheetInfo.currentCell.row;
            var newRow = 0;

            if (event.shiftKey)
            {
                if (sheetInfo.colForSel >= 0)
                {
                    oldCol = sheetInfo.colForSel;
                    oldRow = sheetInfo.rowForSel;
                }
            }

            if (event.metaKey)
            {
                if (event.ctrlKey == true)
                {
                    newRow = 0;
                }
                else
                {
                    var rowCnt = Math.round(sheetInfo.cellWindow.tableCell.parent().outerHeight() / parseInt(sheetInfo.defaultRowHeight));
                    var newRow = oldRow - rowCnt;

                    if (newRow < 0)
                        newRow = 0;
                }
            }
            else
            {
                newRow = (oldRow > 0) ? oldRow-1 : 0;
            }

            if (event.shiftKey)
            {
                sheetInfo.cellWindow.selectCells(oldCol, newRow);
                sheetInfo.cellWindow.checkScroll(oldCol, newRow);
            }
            else
            {
                sheetInfo.cellWindow.unselectCells();
                sheetInfo.cellWindow.setCurrentCell(oldCol, newRow);
            }
        }
    }
    else if (event.keyCode == 39) // right
    {
        event.preventDefault();
        sheetInfo.cellWindow.unselectRows();

        var oldCol = sheetInfo.currentCell.col;
        var newCol = 0;
        var newRow = sheetInfo.currentCell.row;

        if (event.shiftKey && sheetInfo.colForSel >= 0)
        {
            oldCol = sheetInfo.colForSel;
            newRow = sheetInfo.rowForSel;
        }

        if (event.metaKey == true)
        {
            var newCol = sheetInfo.getColumnCount() - 1;
        }
        else
        {
            var newCol = (oldCol < sheetInfo.getColumnCount() - 2) ? oldCol + 1 : sheetInfo.getColumnCount()-1;
        }

        if (event.shiftKey)
        {
            sheetInfo.cellWindow.selectCells(newCol, newRow);
            sheetInfo.cellWindow.checkScroll(newCol, newRow);
        }
        else
        {
            sheetInfo.cellWindow.unselectCells();
            sheetInfo.cellWindow.setCurrentCell(newCol, newRow);
        }
    }
    // PageDN
    else if (event.keyCode === 33)
    {

    }
    // PageDN
    else if (event.keyCode === 34)
    {

    }
    else if (event.keyCode == 40) // down
    {
        if ($('.group-menu-wrap').css('display') != 'none')
        {
            event.preventDefault();
            sheetInfo.groupMenu.moveDown();
        }
        else
        {
            event.preventDefault();
            sheetInfo.cellWindow.unselectRows();

            var oldRow = sheetInfo.currentCell.row;
            var newCol = sheetInfo.currentCell.col;
            var newRow = oldRow;

            if (event.shiftKey)
            {
                if (sheetInfo.colForSel >= 0)
                {
                    oldRow = sheetInfo.rowForSel;
                    newCol = sheetInfo.colForSel;
                }
            }

            if (event.metaKey == true)
            {
                if (event.ctrlKey == true)
                {
                    newRow = sheetInfo.cellWindow.tableCell[0].rows.length-1;
                }
                else
                {
                    var rowCnt = Math.round(sheetInfo.cellWindow.tableCell.parent().outerHeight() / parseInt(sheetInfo.defaultRowHeight));

                    newRow = oldRow + rowCnt;
                    if (newRow > sheetInfo.cellWindow.tableCell[0].rows.length-1)
                        newRow = sheetInfo.cellWindow.tableCell[0].rows.length-1
                }
            }
            else
            {
                if (oldRow < sheetInfo.cellWindow.tableCell[0].rows.length-1)
                    newRow = oldRow+1;
            }

            if (event.shiftKey)
            {
                sheetInfo.cellWindow.selectCells(newCol, newRow);
                sheetInfo.cellWindow.checkScroll(newCol, newRow);
            }
            else
            {
                sheetInfo.cellWindow.unselectRows();
                sheetInfo.cellWindow.setCurrentCell(newCol, newRow);
            }
        }
    }
    else if (event.keyCode == 36) // home
    {
        sheetInfo.cellWindow.unselectRows();
        event.preventDefault();
        if (event.ctrlKey)
        {
            var col = sheetInfo.currentCell.col;
            sheetInfo.cellWindow.setCurrentCell(col, 0);
        }
        else
        {
            var row = sheetInfo.currentCell.row;
            var col = 0;
            sheetInfo.cellWindow.setCurrentCell(col, row);
        }
    }
    else if (event.keyCode == 35) // end
    {
        sheetInfo.cellWindow.unselectRows();
        event.preventDefault();
        if (event.ctrlKey)
        {
            var col = sheetInfo.currentCell.col;
            var row = sheetInfo.cellWindow.tableCell[0].rows.length-1;
            sheetInfo.cellWindow.setCurrentCell(col, row);
        }
        else
        {
            var row = sheetInfo.currentCell.row;
            var col = sheetInfo.getColumnCount() - 1;
            sheetInfo.cellWindow.setCurrentCell(col, row);
        }
    }
    else if (event.keyCode == 46 || event.keyCode == 8) // delete
    {
        event.preventDefault();

        if (sheetInfo.selectedRows != null && sheetInfo.selectedRows.length > 0)
        {
            // showWaitScreen().then(function() {
            //     mySheet.deleteSelectedRow();
            //     hideWaitScreen();
            // });
            cellWindow.deleteSelectedRow();
        }
        else
            cellWindow.deleteSelectedCellText();
    }
    else if (event.keyCode == 90) // 'z'
    {
        if (event.metaKey || event.ctrlKey) // Cmd+Z, Ctrl+Z
        {
            event.preventDefault();
            if (event.shiftKey)
                sheetInfo.undoManager.redo();
            else
                sheetInfo.undoManager.undo();
        }
    }
    else if (event.keyCode == 89) // 'y'
    {
        if (event.ctrlKey || event.metaKey) // Ctrl+Y
        {
            event.preventDefault();
            sheetInfo.undoManager.redo();
        }
    }
    else if (event.keyCode >= 48)
    {
        if (event.metaKey == false && event.ctrlKey == false && event.altKey == false)
        {
            event.target.focus();
            sheetInfo.cellWindow.startEditing(false);
        }
    }
}