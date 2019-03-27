function Menu1(menuHandler)
{
    this.popupMenu = null;
    this.currentMenuId = '';
    this.menuHandler = menuHandler;
    this.menuItemList = null;

    this.init = function () {
        this.menuItemList = [
            {
                id: 'menu-file',
                label: '파일',
                submenuList: [
                    {id: 'cmd-import', icon: 'img/icons8-upload-24.png', label: '가져오기..', shortCut: '⌘+O'},
                    {id: 'cmd-export', icon: 'img/icons8-download-24.png', label: '다른 이름으로 저장..', shortCut: '⌘+S'},
                    {id: 'cmd-sync', icon: 'img/upload-2.png', label: '서버에 저장', shortCut: '⌘+S'},
                    {id: '', label: 'sep'},
                    {id: 'cmd-setting', icon: 'img/gears-v1.png', label: '설정..'},
                ]
            },
            {
                id: 'menu-edit',
                label: '수정',
                submenuList: [
                    {id: 'cmd-undo', icon: 'img/undo.png', label: '실행취소', shortCut: '⌘+Z'},
                    {id: 'cmd-redo', icon: 'img/redo.png', label: '재실행', shortCut: '⌘+Y'},
                    {id: '', label: 'sep'},
                    {id: 'cmd-cut', icon: 'img/cut.png', label: '잘라내기', shortCut: '⌘+X'},
                    {id: 'cmd-paste', icon: 'img/paste.png', label: '붙여넣기', shortCut: '⌘+V'},
                    {id: 'cmd-copy', icon: 'img/copy.png', label: '복사', shortCut: '⌘+C'},
                    {id: '', label: 'sep'},
                    {id: 'cmd-delete-cell', icon: 'img/erase-v2.png', label: '값 삭제', shortCut: 'Del'},
                    {id: 'cmd-delete-row', icon: 'img/delete-database.png', label: '행 색제', shortCut: '⌘+Del'},
                    {id: '', label: 'sep'},
                    {id: 'cmd-unselect', label: '선택취소'},
                ]
            },
            {
                id: 'menu-view',
                label: '보기',
                submenuList: [
                    {id: 'cmd-field-toggle', icon: 'img/visible.png', label: '필드보이기 / 숨기기'},
                    {id: 'cmd-field-order', icon: 'img/data-in-both-directions.png', label: '필드순서 바꾸기'},
                    {id: 'cmd-zoom-in', icon: 'img/zoom-in.png', label: '확대/축소'},
                    {id: 'cmd-view-all', icon: 'img/expand.png', label: '전체보기'},
                    {id: 'cmd-multi-order', icon: 'img/reorder.png', label: '복수정렬'},
                ]
            },
            {
                id: 'menu-style',
                label: '서식',
                submenuList: [
                    {id: 'cmd-pn-style', icon: 'img/phone.png', label: '전화번호'},
                    {
                        id: 'cmd-txt-style', icon: 'img/text.png', label: '텍스트', submenuList: [
                            {id: 'sm-test1', label: 'test1'},
                            {id: 'sm-test1', label: 'test2'},
                            {id: 'sm-test1', label: 'test3'},
                            {id: 'sm-test1', label: 'test4'},
                        ]
                    },
                    {id: '', label: 'sep'},
                    {id: 'cmd-merge-cell', icon: 'img/merge-documents.png', label: '셀내용 합치기'},
                    {id: 'cmd-sep-cell', icon: 'img/separate-document.png', label: '셀내용 나누기'},
                ]
            },
            {
                id: 'menu-find',
                label: '찾기',
                submenuList: [
                    {id: 'cmd-text-find', icon: 'img/icons8-search-24.png', label: '문자로 찾기', shortCut: '⌘+F'},
                    {id: 'cmd-text-cnt-find', label: '문자수로 찾기'},
                    {id: 'cmd-cond-find', label: '필드조건으로 찾기'},
                    {id: '', label: 'sep'},
                    {id: 'cmd-replace', icon: 'img/replace.png', label: '바꾸기'},
                ]
            },
            {
                id: 'menu-group',
                label: '그룹',
                submenuList: [
                    {id: 'cmd-add-group', icon: 'img/add-user-group-man-man.png', label: '그룹 생성'},
                    {id: 'cmd-edit-group', label: '그룹명 변경'},
                    {id: 'cmd-del-group', label: '그룹 삭제'},
                    {id: '', label: 'sep'},
                    {id: 'cmd-merge-group', label: '그룹 병합'},
                ]

            },
            {
                id: 'menu-tool',
                label: '부가기능',
                submenuList: [
                    {id: 'cmd-show-countrycode', icon: 'img/country.png', label: '국가코드 보기'},
                    {id: 'cmd-show-city-code', icon: 'img/postcode.png', label: '국가별 도시코드 보기'},
                ]

            }
        ]
    }

    this.create = function(parent) {

        // Menu Container
        var ul = $('<ul class="menu-item-container"></ul>');
        parent.append(ul);

        // Add Menu items
        for (var i = 0; i < this.menuItemList.length; i++)
        {
            var menu = this.menuItemList[i];
            var li = $('<li class="menu-item" id="' + menu.id + '"><span>' + menu.label + '</span>');
            ul.append(li);
        }

        var thisMenu = this;
        $('.menu-item span').on('click', function (e) {

            e.preventDefault();
            e.stopPropagation();

            var id = $(this).parent().attr('id');

            if (thisMenu.popupMenu == null)
            {
                var menuItem = thisMenu.getMenuItem(id);
                if (menuItem != null) {
                    var rect = this.getBoundingClientRect();
                    var x = rect.x;
                    var y = (rect.y + rect.height + 1);
                    thisMenu.popupMenu = new PopupMenu(thisMenu.menuHandler);
                    thisMenu.popupMenu.createMenu(x, y, menuItem.submenuList);
                }
                thisMenu.currentMenuId = id;
            }
            else
            {
                thisMenu.popupMenu.destroyMenu();
                thisMenu.popupMenu= null;
                thisMenu.currentMenuId = '';
            }
        });

        $('.menu-item span').on('mouseover', function (e) {

            var id = $(this).parent().attr('id');

            if (thisMenu.popupMenu != null)
            {
                if (id != thisMenu.currentMenuId)
                {
                    thisMenu.popupMenu.destroyMenu();
                    thisMenu.popupMenu= null;
                }

                if (thisMenu.popupMenu == null)
                {
                    var menuItem = thisMenu.getMenuItem(id);
                    if (menuItem != null) {

                        var rect = this.getBoundingClientRect();
                        var x = rect.x;
                        var y = (rect.y + rect.height + 1);
                        thisMenu.popupMenu = new PopupMenu(thisMenu.menuHandler);
                        thisMenu.popupMenu.createMenu(x, y, menuItem.submenuList);
                    }
                }
            }

            thisMenu.currentMenuId = id;
        });

        $(window).on('click', function (e) {
            if (thisMenu.popupMenu != null)
            {
                thisMenu.popupMenu.destroyMenu();
                thisMenu.popupMenu = null;
                thisMenu.currentMenuId = '';
            }
        })
    }

    this.getMenuItem = function (id)
    {
        var menuItem = null;

        for (var i = 0; i < this.menuItemList.length; i++)
        {
            if (id == this.menuItemList[i].id)
            {
                menuItem = this.menuItemList[i];
                break;
            }
        }

        return menuItem;
    }
}

function PopupMenu(menuHandler)
{
    this.menuHandler = menuHandler;
    this.menuItemList = null;
    this.menuContainer = null;
    this.subMenu = null;
    this.currentMenuId = '';

    // 새로운 팝업 메뉴를 생성한다.
    // 메뉴가 표시될 좌표와 메뉴 항목
    this.createMenu = function(x, y, menuItemList)
    {
        this.menuItemList = menuItemList;

        var menuContainer = $('<div class="popup-menu"></div>');

        var tbl = $('<table class="popup-menu1"></table>');
        for (var i = 0; i < menuItemList.length; i++)
        {
            var submenu = menuItemList[i];

            if (submenu.label == 'sep')
            {
                var tr = $('<tr class="sep"><td></td><td colspan="2"><hr></td></tr>');
                tbl.append(tr);
            }
            else
            {
                var tr = $('<tr id="' + submenu.id + '"></tr>');
                var td = null;

                if (typeof submenu.icon == 'undefined')
                    td = $('<td></td>');
                else
                    td = $('<td><img class="menu-icon" src="' + submenu.icon + '"></td>');
                tr.append(td);

                td = $('<td>' + submenu.label + '</td>');
                tr.append(td);

                if (typeof submenu.shortCut != 'undefined')
                    td = $('<td>' + submenu.shortCut + '</td>');
                else if (typeof submenu.submenuList != 'undefined') {
                    td = $('<td class="more-menu"></td>');
                    tr.addClass('has-child');
                }
                else
                    td = $('<td></td>');

                if (this.menuHandler.isEnable(submenu.id) === false)
                    tr.addClass('disabled');

                tr.append(td);
                tbl.append(tr);
            }
        }

        menuContainer.append(tbl);
        menuContainer.css('left', x + 'px');
        menuContainer.css('top', y + 'px');
        $(document.body).append(menuContainer);

        var thisMenu = this;

        // 메뉴가 클릭되는 경우
        $(tbl).find('tr').on('click', function (e) {
            if (!$(this).hasClass('has-child') && !$(this).hasClass('sep') && !$(this).hasClass('disabled'))
            {
                var menuId = $(this).attr('id');
                thisMenu.destroyMenu();
                thisMenu.menuHandler.doMenuAction(menuId);
            }
        });

        // 마우스가 메뉴 위를 지나는 경우.
        $(tbl).find('tr').on('mouseover', function (e) {
            var menuId = $(this).attr('id');

            if (thisMenu.subMenu != null && thisMenu.currentMenuId != menuId)
            {
                thisMenu.subMenu.destroyMenu();
                thisMenu.subMenu = null;
            }

            // 서브 메뉴가 존재하는 경우
            if ($(this).hasClass('has-child') && thisMenu.subMenu == null)
            {
                var menuItem = thisMenu.getMenuItem(menuId);

                var rect = this.getBoundingClientRect();
                var x = rect.left + rect.width + 4;
                var y = rect.top;

                // 서브 메뉴를 생성한다.
                thisMenu.subMenu = new PopupMenu(thisMenu.menuHandler);
                thisMenu.subMenu.createMenu(x, y, menuItem.submenuList);
            }

            thisMenu.currentMenuId = menuId;
        });

        this.menuContainer = menuContainer;

        return menuContainer;
    }

    this.destroyMenu = function ()
    {
        // 하위 메뉴가 존재하면 삭제한다.
        if (this.subMenu != null)
        {
            this.subMenu.destroyMenu();
            this.subMenu = null;
        }

        // 현재 메뉴를 삭제한다.
        if (this.menuContainer != null)
            this.menuContainer.remove();
    }

    this.getMenuItem = function (menuId)
    {
        for (var i = 0; i < this.menuItemList.length; i++)
        {
            if (this.menuItemList[i].id == menuId)
                return this.menuItemList[i];
        }
        return null;
    }
}