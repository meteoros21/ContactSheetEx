function ColumnWindow(contactSheet)
{
    this.contactSheet = contactSheet;
    this.sheetInfo = contactSheet.sheetInfo;
    this.container = null;
    this.tableCol = null;

    this.create = function (parent)
    {
        // 기존에 존재하는 것을 삭제한다.
        $('.column-container').remove();
        $('.ion-sheet-left-top').remove();

        // 왼쪽 상단 코너
        var leftTop = $('<div class="ion-sheet-left-top"><table><tr><td></td></tr></table</div>');
        parent.append(leftTop);

        this.container = $('<div class="column-container"></div>');
        this.tableCol = $('<table class="tbl-column"></table>');
        var tr = $('<tr></tr>');
        this.tableCol.append(tr);

        var sheetInfo = this.contactSheet.sheetInfo;
        var columnCount = sheetInfo.columnList.length;

        for (var i = 0; i < columnCount+1; i++)
        {
            var label = '';
            var width = sheetInfo.defaultColWidth;

            if (i < columnCount)
            {
                label = sheetInfo.columnList[i].label;
                width = sheetInfo.columnList[i].width;
            }

            var td = $('<td></td>');
            td.css('width', width);
            td.css('min-width', width);
            td.css('max-width', width);
            td.addClass('unselectable');

            // 마지막 컬럼
            if (i != columnCount)
            {
                var div = $('<div></div>');
                div.css('width', '100%');
                //div.text(label);
                td.append(div);

                var key = sheetInfo.columnList[i].key;
                var span = $('<span class="column-label" column-key="' + key + '">' + label + '</span>');
                div.append(span);
            }

            tr.append(td);
        }

        this.container.append(this.tableCol);
        parent.append(this.container);

        this.addClickEvent();
    }

    this.createColumnResizeHandles = function()
    {
        var sheetInfo = this.contactSheet.sheetInfo;

        var w = 0;
        for (var i = 0; i <sheetInfo.columnList.length; i++)
            w += parseInt(sheetInfo.columnList[i].width, 10);

        var divContainer = $('<div class="resize-handle-container"></div>');
        divContainer.css('width', w + 'px');
        divContainer.css('height', '0px');
        divContainer.css('position', 'absolute');

        var left = 0;

        for (var i = 0; i < sheetInfo.getColumnCount()-1; i++)
        {
            left += parseInt(sheetInfo.columnList[i].width, 10);

            var divHandler = $('<div></div>');
            //divHandler.attr('class', 'col-resize-handle');
            divHandler.css('left', left + 'px');
            divHandler.addClass('col-resize-handle');
            divHandler.addClass('draggable');
            divContainer.append(divHandler);
        }

        divContainer.insertBefore(this.tableCol);

        return divContainer;
    }

    this.setSortColumn = function (col, className)
    {
        $(this.tableCol).find('.sortAsc').removeClass('sortAsc');
        $(this.tableCol).find('.sortDsc').removeClass('sortDsc');
        $(this.tableCol[0].rows[0].cells[col]).addClass(className);
    }

    this.setCurrentCol = function(col)
    {
        this.tableCol.find('.current-col').removeClass('current-col');
        $(this.tableCol[0].rows[0].cells[col]).addClass('current-col');
    }

    this.addClickEvent = function ()
    {
        var contactSheet = this.contactSheet;
        var sheetInfo = this.sheetInfo;

        this.tableCol.off('click');

        this.tableCol.on('click', function (e)
        {
            var td = $(e.target).closest('td');
            var col = td.index();
            var direction = td.hasClass('sortAsc') ? 'sortDsc' : 'sortAsc';

            var key1 = sheetInfo.getColumnKey(col);
            var key2 = (key1 == 'family-name') ? 'given-name' : 'family-name';

            contactSheet.sortContactList(key1, key2, direction);
        });
    }

    this.addDraggableEvent = function ()
    {
        var thisWindow = this;
        var sheetInfo = this.contactSheet.sheetInfo;
        var currentHandle = null;
        var resizeHandleIdx = -1;
        var orgX = 0;
        var limitX = 0;

        this.container.find('.col-resize-handle').draggable({
            axis:"x",
            start: function(event, ui) {
                currentHandle = $(event.currentTarget);
                resizeHandleIdx = currentHandle.parent().children('div').index(currentHandle);
                orgX = ui.position.left;

                if (resizeHandleIdx === 0)
                    limitX = 0;
                else
                    limitX = currentHandle.prev().position().left;

                sheetInfo.cellWindow.hideCellMarker();
                //sheetInfo.currentCellMarker.css('display', 'none');
            },
            drag: function(event, ui) {
                if (ui.position.left < limitX)
                    ui.position.left = limitX;

                // 컬럼 셀의 크기를 조정한다.
                var width = ui.position.left - limitX;
                var cell = $(thisWindow.tableCol[0].rows[0].cells[resizeHandleIdx]);
                //var cell = currentHandle.parents('.ion-sheet-container').find('.tbl-column')[0].rows[0].cells[resizeHandleIdx];
                cell.css('width', width + 'px');
                cell.css('min-width', width + 'px');
                cell.css('max-width', width + 'px');

                var div = $(cell).children().first();
                div.css('width', width + 'px');

                sheetInfo.cellWindow.setColumnWidth(resizeHandleIdx, width, false);
            },
            stop: function(event, ui) {

                var dx = -orgX + ui.position.left;
                var children = currentHandle.parent().children('div');

                // 리사이즈 핸들의 위치를 재조정한다.
                for (var i = resizeHandleIdx + 1; i < sheetInfo.getColumnCount() - 1; i++)
                {
                    var newLeft = $(children[i]).position().left + dx;
                    $(children[i]).css('left', newLeft + 'px');
                }

                // 컬럼 옵션의 넓이를 재설정
                var cell = sheetInfo.cellWindow.tableCell[0].rows[0].cells[resizeHandleIdx];
                var width = $(cell).css('width');
                sheetInfo.columnList[resizeHandleIdx].width = width;

                var key = sheetInfo.getColumnKey(resizeHandleIdx);
                sheetInfo.cellWindow.setColumnWidth(resizeHandleIdx, parseInt(width, 10), true);

                for (var j = 0; j < sheetInfo.allColumnList.length; j++)
                {
                    if (sheetInfo.allColumnList[j].key == key)
                    {
                        sheetInfo.allColumnList[j].width = width;
                        break;
                    }
                }

                // 숨겼던 핸재 셀 마커를 다시 표시한다.
                sheetInfo.cellWindow.showCellMarker();

                // 컬럼 옵션을 저장한다.
                thisWindow.contactSheet.saveUserOption(sheetInfo.allColumnList);
            }
        });
    }
}