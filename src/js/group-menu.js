/**
 * 
 */
(function($) {
	
	$.fn.testMenu = function(dataList) {

		var myPlugin = {
				init: function(parent) {
					this.parent = parent;
					this.menu = $('<div class="group-menu-wrap"></div>');
					var groupMenu = $('<div class="group-menu"></div>');
					this.menu.append(groupMenu);
					
					var btns = $('<div style="width:100%; height: 20px; padding: 10px; font-size:12px; text-align:right"><a id="group-menu-ok" href="#">확인</a> <a id="group-menu-cancel" href="#">취소</a></div>');
					groupMenu.append(btns);
					
					var ul = $('<ul class="options"></ul>');
					groupMenu.append(ul);
					
					for (var i = 0; i < dataList.length; i++)
					{
						var li = $('<li><input type="checkbox" id="' + dataList[i].id + '" value="' + dataList[i].label + '"><label for="' + dataList[i].id + '"><span></span>' + dataList[i].label +'</label></li>');
						ul.append(li);
					}
					parent.append(this.menu);
				},
				isVisible: function() {
					return !(this.menu.css('display') == 'none');
				},
				moveUp: function() {
					var itemCnt = this.menu.find('li').length;
					var curIdx = this.menu.find('li.active').index();
					this.menu.find('.active').removeClass('active');
					
					if (curIdx == 0)
						this.menu.find('li:nth-child(' + (itemCnt) + ')').addClass('active');
					else
						this.menu.find('li:nth-child(' + (curIdx) + ')').addClass('active');
				},
				moveDown: function() {
					var itemCnt = this.menu.find('li').length;
					var curIdx = this.menu.find('.active').index();
					this.menu.find('.active').removeClass('active');

					if (curIdx == itemCnt-1)
						this.menu.find('li:nth-child(1)').addClass('active');
					else
						this.menu.find('li:nth-child(' + (curIdx+2) + ')').addClass('active');
				},
				toggleSelection: function() {
					var cb = this.menu.find('.active').children('input[type="checkbox"]');
					cb[0].checked = !cb[0].checked;
					
				},
				getSelectedValue: function() {
					var result = new Array();
					this.menu.find('input[type="checkbox"]').each(function(idx, element) {
						if (element.checked)
						{
							var item = new Object();
							item.id = $(element).attr('id');
							item.label = $(element).attr('value');
							result.push(item);
						}						
					});

					result.sort(function(a, b) {
						var val1 = a.id;
						var val2 = b.id;
						return val1.localeCompare(val2);
					});
					
					return result;
				},
				getSelectedLabel: function() {
					var text = '';
					this.menu.find('input[type="checkbox"]').each(function(idx, element) {
						if (element.checked)
						{
							if (text != '')
								text += ', ';
							text += $(element).attr('value');
						}						
					});
					
					return text;
				},
				show: function(td, selectedList) {
					
					if (this.isVisible())
						return;

					this.menu.find('.active').removeClass('active');
					
					var test = this.menu.find('input[type="checkbox"]');
					test.prop('checked', false);
					
					$(selectedList).each(function(idx, element) {					
						var aa = document.getElementById(element.id);
						aa.checked = true;
					});
					
					var ph = this.parent[0].offsetHeight;
					var pw = this.parent[0].offsetWidth;
					var pst = this.parent[0].scrollTop;
					var psl = this.parent[0].scrollLeft;
					
					var left = td[0].offsetLeft;
					var top  = td[0].offsetTop + td[0].offsetHeight;
					
					var menuWidth  = this.menu.outerWidth();
					var menuHeight = this.menu.outerHeight();
					
					if (left + menuWidth > pw + psl)
						this.menu.css('left', (td[0].offsetLeft + td[0].offsetWidth - menuWidth) + 'px');
					else
						this.menu.css('left', left + 'px');
					
					if (top + menuHeight > ph + pst)
						this.menu.css('top', (td[0].offsetTop - menuHeight) + 'px');
					else
						this.menu.css('top', top + 'px');
					
					$('.options > li:nth-child(1)').addClass('active');
					this.menu.css('display', 'block');
					this.menu.focus();
				},
				hide: function() {
					this.menu.css('display', 'none');
				}
		}
		
		myPlugin.init(this);
		return myPlugin;
	}
})(jQuery);