function ActionHandler(contactSheet)
{
    this.contactSheet = contactSheet;

    this.isEnable = function (menuId) {

        if (menuId == 'cmd-export' || menuId == 'cmd-import')
            return false;

        return true;
    }

    this.doMenuAction = function(menuId) {
        if (menuId === 'cmd-sync')
            onSave();
        else if (menuId === 'cmd-text-find')
            onFind();
        else if (menuId === 'cmd-setting')
            onSetOption();
        else
            alert(menuId);
    }

    this.getMenuItemListForContext1 = function ()
    {
        var menuItemList = [
            {id: 'cmd-undo', icon: 'img/undo.png', label: '실행취소', shortCut: '⌘+Z'},
            {id: 'cmd-redo', icon: 'img/redo.png', label: '재실행', shortCut: '⌘+Y'},
            {id: '', label: 'sep'},
            {id: 'cmd-cut', icon: 'img/cut.png', label: '잘라내기', shortCut: '⌘+X'},
            {id: 'cmd-paste', icon: 'img/paste.png', label: '붙여넣기', shortCut: '⌘+V'},
            {id: 'cmd-copy', icon: 'img/copy.png', label: '복사', shortCut: '⌘+C'},
            {id: '', label: 'sep'},
            {id: 'cmd-delete-cell', icon: 'img/erase-v2.png', label: '값 삭제', shortCut: 'Del'},
            {id: 'cmd-select-row', icon: 'img/delete-database.png', label: '행 색제', shortCut: '⌘+Del'},
            {id: 'cmd-modify-group', label: '그룹 설정', shortCut: '⌘+G'},
        ];

        return menuItemList;
    }

    this.getMenuItemListForContext2 = function ()
    {
        var menuItemList = [
            {id: 'cmd-undo', icon: 'img/undo.png', label: '실행취소', shortCut: '⌘+Z'},
            {id: 'cmd-redo', icon: 'img/redo.png', label: '재실행', shortCut: '⌘+Y'},
            {id: '', label: 'sep'},
            {id: 'cmd-cut', icon: 'img/cut.png', label: '잘라내기', shortCut: '⌘+X'},
            {id: 'cmd-paste', icon: 'img/paste.png', label: '붙여넣기', shortCut: '⌘+V'},
            {id: 'cmd-copy', icon: 'img/copy.png', label: '복사', shortCut: '⌘+C'},
            {id: '', label: 'sep'},
            {id: 'cmd-select-row', icon: 'img/delete-database.png', label: '행 색제', shortCut: '⌘+Del'},
            {id: 'cmd-modify-group', label: '그룹 설정', shortCut: '⌘+G'},
            {id: '', label: 'sep'},
        ];

        return menuItemList;
    }
}