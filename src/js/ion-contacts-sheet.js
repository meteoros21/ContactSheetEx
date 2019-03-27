(function($) {
	
	var defaultOptions = {
			tableHandler: null,
			syncInfo: null,
			rows: 1,
			rowsPerPage: 1000,
			currentPage: 0,
			defaultColWidth: '100px',
			defaultRowHeight: '30px',
			operationMode: 0, // 0:default, 1:select(mark), 2:edit
			currentCell: {col: 0, row: 0},
			selectedCells: null, // Array of {col1, col2, row1, row2}
			colForSel: -1,
			rowForSel: -1,
			selectedRow: -1,
			lastSelectedRow: 0,
			selectedRows: null, // Array of int
			contactList: null,
			deletedContactList: null,
			groupList: null,
			tableCell: null,
			tableRow: null,
			undoBuffer: null,
			redoBuffer: null,
			sortInfo: {key: "full-name", type: "sortAsc"},
			lastContactId: 1,
			contextMenu: null,
			columnInfo: [
				{label:"Full name", type:"Name", width:"90px", key: "full-name"}, 
				{label:"Family name", type:"Name", width:"50px", key:"family-name"},
				{label:"Middle name", type:"Name", width:"50px", key:"middle-name"}, 
				{label:"Given name", type:"Name", width:"50px", key:"given-name"}, 
				{label:"E-mail(home)", type:"Email", width:"220px", key:"email-home"},
				{label:"E-mail(work)", type:"Email", width:"220px", key:"email-work"},
				{label:"E-mail(other)", type:"Email", width:"220px", key:"email-other"},
				{label:"Phone(home)", type:"Phone", width:"140px", key:"phone-home"},
				{label:"Phone(work)", type:"Phone", width:"140px", key:"phone-work"}, 
				{label:"Phone(mobile)", type:"Phone", width:"140px", key:"phone-mobile"}, 
				{label:"Organization name", type:"Organization", width:"200px", key:"org-name"},
				{label:"Organization title", type:"Position", width:"150px", key:"org-title"},
				{label:"Contact group", type:"Group", width:"200px", key:"groups"},
				{label:"Postal address", type:"postal-address", width:"200px", key:"postal-address"},
				{label:"Note", type:"note", width:"200px", key:"note"}],
			getColumnInfo: function() {
				return this.columnInfo;
			},
			getColumnKey: function(colIdx) {
				return this.columnInfo[colIdx]['key'];
			},
			getColumnIndex: function(key) {
				for (var i = 0; i < this.columnInfo.length; i++)
				{
					if (this.columnInfo[i].key == key)
						return i;
				}
				return -1;
			},
			getColumnCount: function() {
				return this.columnInfo.length;
			},
			getRowCount: function() {
				return this.tableCell[0].rows.length;
			},
			getContactList: function() {
				return this.contactList;
			},
			getPageCount: function() {
				var pageCount = Math.ceil(this.contactList.length / this.rowsPerPage);
				return (pageCount == 0 ? 1 : pageCount);
			},
			getNextContactId: function() {
				this.lastContactId++;
				return this.lastContactId;
			},
			getContact: function(contactId) {
				
				if (this.contactList != null)
				{
					for (var i = 0; i < this.contactList.length; i++)
					{
						if (this.contactList[i].fields['id'] == contactId)
							return this.contactList[i];
					}
				}
				
				return null;
			},
			getContactByRow: function(row) {
				var contactId = $(this.tableCell[0].rows[row]).attr('contact-id');
				return this.getContact(contactId);
			},
			deleteContact: function(contactId) {
				var contact = null;
				if (this.contactList != null)
				{
					for (var i = 0; i < this.contactList.length; i++)
					{
						if (this.contactList[i].fields['id'] == contactId)
						{
							contact = this.contactList[i];

							if (this.deletedContactList == null)
								this.deletedContactList = new Array();
							this.deletedContactList.push(contact);
							this.contactList.splice(i, 1);
							break;
						}
					}
				}

				return contact;
			},
			removeDeletedContact: function(contactId) {
				var contact = null;
				if (this.deletedContactList != null)
				{
					for (var i = 0; i < this.deletedContactList.length; i++)
					{
						if (this.deletedContactList[i].fields['id'] == contactId)
						{
							contact = this.deletedContactList[i];
							this.deletedContactList.splice(i, 1);
							break;
						}
					}
				}

				return contact;
			},

			insertContact: function(idx, contactInfo) {
				this.contactList.splice(idx, 0, contactInfo);
			},
			getDataCell: function(col, row) {

				if (row < 0 || row > this.tableCell[0].rows.length-1)
					return null;
				return this.tableCell[0].rows[row].cells[col];
			},
			getRowCell: function(row) {
				if (row < 0 || row > this.tableRow[0].rows.length-1)
					return null;
				return this.tableRow[0].rows[row].cells[0];
			},
			isSelectedCell: function(col, row) {
				if (this.selectedCells == null)
					return false;
				
				for (var k = 0; k < this.selectedCells.length; k++)
				{
					var sel = this.selectedCells[k];
					
					if (col >= sel.col1 && col <= sel.col2)
					{
						if (row >= sel.row1 && row <= sel.row2)
						{
							return true;
						}
					}
				}
				
				return false;
			},
			
			addUndoAction: function(action) {
				if (this.undoBuffer == null)
					this.undoBuffer = new Array();
		
				this.undoBuffer.push(action);
				this.redoBuffer = new Array();
			},
			
			getContactIdByRowIndex: function(rowIdx) {
				if (rowIdx < 0 || rowIdx > this.tableCell[0].rows.length-1)
					return -1;

				return $(this.tableCell[0].rows[rowIdx]).attr('contact-id');
			},

			sortContactList: function(key1, key2, sortType) {

				if (sortType == 'sortAsc')
				{
					this.contactList.sort(function(a, b) {
						//var fn1 = a.fields[key1] == null ? '' : a.fields[key1];
						//var fn2 = b.fields[key1] == null ? '' : b.fields[key1];
						var fn1 = a.getLabel(key1);
						var fn2 = b.getLabel(key1);
						
						var cmp = fn1.localeCompare(fn2);
						
						if (cmp == 0)
						{
							var gn1 = a.getLabel(key2);
							var gn2 = b.getLabel(key2);
							//var gn1 = a.fields[key2] == null ? '' : a.fields[key2];
							//var gn2 = b.fields[key2] == null ? '' : b.fields[key2];
							
							return gn1.localeCompare(gn2);
						}
						else
						{
							return cmp;
						}
					});
				}
				else
				{
					this.contactList.sort(function(b, a) {
						// var fn1 = a.fields[key1] == null ? '' : a.fields[key1];
						// var fn2 = b.fields[key1] == null ? '' : b.fields[key1];
						var fn1 = a.getLabel(key1);
						var fn2 = b.getLabel(key1);

						
						var cmp = fn1.localeCompare(fn2);
						
						if (cmp == 0)
						{
							// var gn1 = a.fields[key2] == null ? '' : a.fields[key2];
							// var gn2 = b.fields[key2] == null ? '' : b.fields[key2];
							var gn1 = a.getLabel(key2);
							var gn2 = b.getLabel(key2);
							
							return gn1.localeCompare(gn2);
						}
						else
						{
							return cmp;
						}
					});
				}
			}
	};
	
	$.fn.ionContactSheet = function(options) {
		
		var sheetInfo2 = $.extend({}, defaultOptions, options);
		var deletedContacts = new Array();
		
		var myPlugin = {
				
				clipboardData: null,
				getColumnInfo: function() {
					return sheetInfo2.getColumnInfo();
				},
				
				showGroupMenu: function(td, selectedList) {
					
				},
				
				hideGroupMenu: function() {
					sheetInfo2.groupMenu.hideMenu();
				},
				
				setPage: function(page) {
					
					if (page < 1 || page > sheetInfo2.getPageCount())
					{
						hideWaitScreen();
						return;
					}
					
					var pageOldGroupNo = Math.ceil(sheetInfo2.currentPage / 10);
					var pageNewGroupNo = Math.ceil(page / 10);
					
					sheetInfo2.tableHandler.drawContacts(page);
					sheetInfo2.currentPage = page;
					
					if (pageOldGroupNo != pageNewGroupNo)
					{
						sheetInfo2.currentPage = page;
						sheetInfo2.tableHandler.drawPager();
						
						$('.pagination a').on('click', function(e) {
							var page = $(this).attr('page');
							$('.pagination .active').removeClass('active');
							$(this).addClass('active');
							
							showWaitScreen().then(function() {
								mySheet.setPage(page);
							});
						});
					}
					else
					{
						sheetInfo2.currentPage = page;
						$('.pagination .active').removeClass('active');
						$('.pagination a[page=' + page + ']').addClass('active');
					}

					sheetInfo2.tableHandler.unselectCells();
					sheetInfo2.tableHandler.unselectRows();

					sheetInfo2.tableHandler.addMouseHandler();
					// sheetInfo2.tableHandler.removeCellMouseEvent();
					// sheetInfo2.tableHandler.addCellMouseEvent();
					
					sheetInfo2.tableHandler.setCurrentCell(0, 0);
					
					hideWaitScreen();
				},
				
				setContactList: function(groupList, contactList, pageNo) {
				
					if (groupList != null)
					{
						sheetInfo2.groupList = groupList;
						sheetInfo2.container.find('.group-menu').remove();

						// group menu
						var div = sheetInfo2.tableCell.parent();
						sheetInfo2.groupMenu = div.testMenu(sheetInfo2.groupList);
						$('#group-menu-ok').unbind('click');
						$('#group-menu-cancel').unbind('click');
						
						$('#group-menu-cancel').on('click', function(e) {
							sheetInfo2.tableHandler.cancelEditing();
						});

						$('#group-menu-ok').on('click', function(e) {
							sheetInfo2.tableHandler.stopEditing();
						});
					}
					
					if (contactList != null)
					{
						sheetInfo2.contactList = contactList;
						sheetInfo2.currentPage = 0; // for redrawing 
					}

					var page = (typeof pageNo != 'undefined') ? pageNo : 1;	
					this.setPage(page);
					sheetInfo2.tableHandler.setCurrentCell(0, 0);

					// sheetInfo2.tableCol.find('.sortAsc').removeClass('sortAsc');
					// sheetInfo2.tableCol.find('.sortAsc').removeClass('sortDsc');
					// $(sheetInfo2.tableCol[0].rows[0].cells[0]).addClass('sortAsc');
				},
				
				onContactInserted: function(contactId, contact, result)
				{
					if (contact == null || result == false)
						return;
					
					var tr = sheetInfo2.tableHandler.findRow(contactId);
					
					if (tr.length == 1)
					{
						tr.children().removeClass('modified');
						tr.attr('contact-id', contact.fields['id']); // new contactId
						
						var idx = tr.parent().children().index(tr);
						var rowNumCell = $(sheetInfo2.tableRow[0].rows[idx].cells[0]);
						rowNumCell.removeClass('modified');

						var rowIdx = sheetInfo2.tableHandler.findTableRowIdxByContactId(contact.fields['id']);
						if (rowIdx >= 0)
							sheetInfo2.tableHandler.redrawContact(rowIdx, contact);
					}

					// replace old contact with new one
					for (var i = 0; i < sheetInfo2.contactList.length; i++)
					{
						if (sheetInfo2.contactList[i].fields['id'] == contactId)
						{
							sheetInfo2.contactList.splice(i, 1, contact);
							break;
						}
					}
					
				},

				// 동기화가 끝나고 호출된다.
				onContactUpdated: function(contactId, contact, result)
				{
					if (contact == null || result == false)
						return;
					
					var tr = sheetInfo2.tableHandler.findRow(contactId);
					
					if (tr.length == 1)
					{
						tr.children().removeClass('modified');
						
						var idx = tr.parent().children().index(tr);
						var rowNumCell = $(sheetInfo2.tableRow[0].rows[idx].cells[0]);
						rowNumCell.removeClass('modified');
					}
					
					// replace old contact this new one
					for (var i = 0; i < sheetInfo2.contactList.length; i++)
					{
						if (sheetInfo2.contactList[i].fields['id'] == contactId)
						{
							sheetInfo2.contactList.splice(i, 1, contact);
							break;
						}
					}
				},
				
				getContactList: function() {
					return sheetInfo2.contactList;
				},

				getGroupList: function() {
					return sheetInfo2.groupList;
				},

				setSelectedGroupList: function(groupList) {
					var rowArray = new Array();
					if (sheetInfo2.selectedRows != null && sheetInfo2.selectedRows.length > 0)
					{
						for (var i = 0; i < sheetInfo2.selectedRows.length; i++)
						{
							var row = sheetInfo2.selectedRows[i];
							rowArray.push(row);
						}
					}
					else if (sheetInfo2.selectedCells != null && sheetInfo2.selectedCells.length > 0)
					{
						for (var i = 0; i < sheetInfo2.selectedCells.length; i++)
						{
							var sel = sheetInfo2.selectedCells[i];
							for (var j = sel.row1; j <= sel.row2; j++)
							{
								rowArray.push(j);
							}
						}
					}
					else
					{
						var row = sheetInfo2.currentCell.row;
						rowArray.push(row);
					}

					var undoData = new UndoData('write');
					var offsetRow = (sheetInfo2.currentPage - 1) * sheetInfo2.rowsPerPage;
					var col = sheetInfo2.getColumnIndex('groups');

					if (rowArray.length > 1)
					{
						undoData.sortKey = sheetInfo2.sortInfo['key'];
						undoData.sortType = sheetInfo2.sortInfo['type'];
					}

					for (var i = 0; i < rowArray.length; i++)
					{
						var row = rowArray[i];
						var contact = sheetInfo2.tableHandler.getContactByRowIdx(row);
						var contactId = contact.fields['id'];

						var orgCellData = new CellData('groups');
						orgCellData.label = contact.getLabel('groups');
						orgCellData.value = contact.getValue('groups');

						contact.setValue('groups', groupList);

						var newCellData = new CellData('groups');
						newCellData.label = contact.getLabel('groups');
						newCellData.value = contact.getValue('groups');

						sheetInfo2.tableHandler.redrawContact(row, contact);

						undoData.addWriteAction(col, contactId, orgCellData, newCellData, false, row + offsetRow);
					}

					sheetInfo2.addUndoAction(undoData);
				},
				
				resetSortColumn: function() {
					//default soft
					sheetInfo2.tableCol.find('.sortAsc').removeClass('sortAsc');
					sheetInfo2.tableCol.find('.sortAsc').removeClass('sortDsc');
					$(sheetInfo2.tableCol[0].rows[0].cells[0]).addClass('sortAsc');
				},

				getCurrentCellText: function() {
					var text = sheetInfo2.tableCell[0].rows[sheetInfo2.currentCell.row].cells[sheetInfo2.currentCell.col].innerText; 
					return (typeof text == 'undefined') ? '' : text.trimRight();
				},

				getCellData: function(col, row) {

					var key = sheetInfo2.getColumnKey(col);
					var contact = sheetInfo2.getContactByRow(row);
					var cellData = new CellData(key);

					if (contact != null)
					{
						cellData.label = contact.getLabel(key);
						cellData.value = contact.getValue(key);
					}
					else
					{
						var dataCell = sheetInfo2.getDataCell(col, row);

						cellData.label = $(dataCell).text().trimRight();
						cellData.value = (key == 'groups') ? JSON.parse($(cell).attr('group-data')) : cellData.label;
					}

					return cellData;
				},
				
				getSelectionCount: function() {
					return sheetInfo2.selectedCells == null ? 0 : sheetInfo2.selectedCells.length;
				},

				getSelectedRows: function() {
					return sheetInfo2.selectedRows;
				},
				
				getClipboardData: function() {
					
					if (sheetInfo2.selectedRows != null && sheetInfo2.selectedRows.length > 0)
					{
						var clipboardData = new Object();
						clipboardData.dataType = 'rows';
						clipboardData.rows = new Array();

						var offsetRow = (sheetInfo2.currentPage - 1) * sheetInfo2.rowsPerPage;
						
						for (var i = 0; i < sheetInfo2.selectedRows.length; i++)
						{
							var row = sheetInfo2.selectedRows[i];
							var contact = sheetInfo2.getContactByRow(row);
							var contactId = contact.fields['id'];
							clipboardData.rows.push(contactId);
						}

						return JSON.stringify(clipboardData);
					}
					else
					{
						var clipboardData = new Object();
						clipboardData.dataType = 'cells';
						clipboardData.col = 1000000;
						clipboardData.row = 1000000;
						
						var cellDataList = new Array();
						
						if (sheetInfo2.selectedCells != null)
						{
							for (var k = 0; k < sheetInfo2.selectedCells.length; k++)
							{
								var selection = sheetInfo2.selectedCells[k];
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
							clipboardData.col = sheetInfo2.currentCell.col;
							clipboardData.row = sheetInfo2.currentCell.row;

							var cellData = this.getCellData(sheetInfo2.currentCell.col, sheetInfo2.currentCell.row);
							cellData.col = sheetInfo2.currentCell.col;
							cellData.row = sheetInfo2.currentCell.row;
							cellDataList.push(cellData);
						}
						
						clipboardData.cellDataList = cellDataList;
						
						return JSON.stringify(clipboardData);
					}
				},
				
				pasteClipboardData: function(jsonString) {
					
					var clipboardData = JSON.parse(jsonString);

					if (clipboardData.dataType == 'rows')
					{
						var offsetRow = (sheetInfo2.currentPage - 1) * sheetInfo2.rowsPerPage;
						var undoData = new UndoData('pasteRow');
						var rows = clipboardData.rows;
						for (var j = 0; j < rows.length; j++)
						{
							var orgContactId = rows[j];
							var orgContact = sheetInfo2.getContact(orgContactId);
							var fields = orgContact.getFields(sheetInfo2.columnInfo);

							var contactId = sheetInfo2.getNextContactId();
							var contact = new Contact(contactId);
							contact.setFields(fields);

							var rowIdx = sheetInfo2.tableCell[0].rows.length - 1;
							sheetInfo2.tableHandler.addContact(rowIdx + offsetRow, contact);

							var undoAction = new Object();
							undoAction['contact-id'] = contactId; // 저장하면 contactId가 달라지므로, 저장 시에는 UndoData를 리셋해야한다.
							undoAction['row-idx'] = rowIdx + offsetRow;
							undoAction['page'] = sheetInfo2.currentPage;
							undoAction['fields'] = contact.getFields(sheetInfo2.columnInfo);
							undoAction['sort-key'] = sheetInfo2.sortInfo['key'];
							undoAction['sort-type'] = sheetInfo2.sortInfo['type'];
	
							undoData.addAction(undoAction);
						}

						var rowIdx = sheetInfo2.tableCell[0].rows.length - 2;
						sheetInfo2.tableHandler.setCurrentCell(0, rowIdx);

						sheetInfo2.addUndoAction(undoData);
					}
					else
					{
						var offsetRow = (sheetInfo2.currentPage - 1) * sheetInfo2.rowsPerPage;
						var offsetX = sheetInfo2.currentCell.col - clipboardData.col;
						var offsetY = sheetInfo2.currentCell.row - clipboardData.row;
						
						var undoData = new UndoData('write');
						
						for (var i = 0; i < clipboardData.cellDataList.length; i++)
						{						
							var data = clipboardData.cellDataList[i];
							var newCellData = new CellData();
							newCellData.setCellData(data);

							var col = newCellData.col + offsetX;
							var row = newCellData.row + offsetY;

							var rowAdded = false;
							var key = sheetInfo2.columnInfo[col].key;

							var orgCellData = new CellData();
							var contactId = null;

							// Is there need to add new row and contact object
							if (sheetInfo2.tableCell[0].rows.length-1 <= row)
							{
								// create new contact object with new temporary id
								contactId = sheetInfo2.getNextContactId();
								var contact = new Contact(contactId);
								contact.setValue(key, newCellData.value);
								contact.isNew = true;

								orgCellData.label = '';
								orgCellData.value = (key == 'groups') ? null : '';

								sheetInfo2.tableHandler.addContact(row + offsetRow, contact);
								rowAdded = true;
							}
							else
							{
								var contact = sheetInfo2.tableHandler.getContactByRowIdx(row);
								contactId = contact.fields['id'];
								orgCellData.label = contact.getLabel(key);
								orgCellData.value = contact.getValue(key);

								contact.setValue(key, newCellData.value);
								sheetInfo2.tableHandler.redrawContact(row, contact);
							}

							// Undo action
							undoData.addWriteAction(col, contactId, orgCellData, newCellData, rowAdded, row + offsetRow);
						}

						var rowCnt = 0; 
						var lastContactId = '';
						for (var i = 0; i < undoData.actionList.length; i++)
						{
							if (undoData.actionList[i].contactId != lastContactId)
							{
								rowCnt++;
								lastContactId = undoData.actionList[i].contactId;
							}
						}

						if (rowCnt > 1)
						{
							undoData.sortKey = sheetInfo2.sortInfo['key'];
							undoData.sortType = sheetInfo2.sortInfo['type'];
						}

						// Undo action을 등록한다.
						sheetInfo2.addUndoAction(undoData);
					}
				},

				pasteText: function(text) {

					var offsetRow = (sheetInfo2.currentPage - 1) * sheetInfo2.rowsPerPage;
					var crntCol = sheetInfo2.currentCell.col;
					var crntRow = sheetInfo2.currentCell.row;
					var key = sheetInfo2.getColumnKey(crntCol);

					if (key == 'groups')
						return;

					var newCellData = new CellData();
					newCellData.label = text;
					newCellData.value = text;

					var rowAdded = false;
					var undoData = new UndoData('write');
					if (sheetInfo2.tableCell[0].rows.length-1 <= crntRow)
					{
						var contactId = sheetInfo2.getNextContactId();
						var contact = new Contact(contactId);
						contact.setValue(key, newCellData.value);
						contact.isNew = true;
						sheetInfo2.tableHandler.addContact(crntRow + offsetRow, contact);
						var orgCellData = new CellData();
						orgCellData.label = '';
						orgCellData.value = '';
						undoData.addWriteAction(crntCol, contactId, orgCellData, newCellData, true, crntRow + offsetRow);
					}
					else
					{
						var contact = sheetInfo2.getContactByRow(crntRow);
						var contactId = contact.fields['id'];
						var orgCellData = new CellData();
						orgCellData.label = contact.getLabel(key);
						orgCellData.value = contact.getValue(key);

						contact.setValue(key, newCellData.value);
						sheetInfo2.tableHandler.redrawContact(crntRow, contact);

						undoData.addWriteAction(crntCol, contactId, orgCellData, newCellData, false, crntRow + offsetRow);
					}
					sheetInfo2.addUndoAction(undoData);
					
				},
				
				deleteSelectedCellText: function() {
					
					if (sheetInfo2.selectedCells == null || sheetInfo2.selectedCells.length == 0)
					{
						var col = sheetInfo2.currentCell.col;
						var row = sheetInfo2.currentCell.row;
						var offsetRow = (sheetInfo2.currentPage - 1) * sheetInfo2.rowsPerPage;

						var contact = sheetInfo2.tableHandler.getContactByRowIdx(row);
						if (contact != null)
						{
							var contactId = contact.fields['id'];
							var key = sheetInfo2.getColumnKey(col);

							var label = contact.getLabel(key);
							var value = contact.getValue(key);
							var oldCellData = new CellData(key, label, value);
							var newCellData = new CellData(key, '', '');

							contact.setValue(key, '');
							sheetInfo2.tableHandler.redrawContact(row, contact);

							var undoData = new UndoData('write');
							undoData.addWriteAction(col, contactId, oldCellData, newCellData, false, row+offsetRow);
							sheetInfo2.addUndoAction(undoData);
						}
					}
					else
					{
						var offsetRow = (sheetInfo2.currentPage - 1) * sheetInfo2.rowsPerPage;
						// undo action을 생성한다.
						var undoData = new UndoData('write');
						var rowCnt = 0;
						
						for (var k = 0; k < sheetInfo2.selectedCells.length; k++)
						{
							var selection = sheetInfo2.selectedCells[k];
							for (var j = selection.row1; j <= selection.row2; j++)
							{
								rowCnt++;
								var contact = sheetInfo2.tableHandler.getContactByRowIdx(j);

								if (contact != null)
								{
									var contactId = contact.fields['id'];

									for (var i = selection.col1; i <= selection.col2; i++)
									{
										var key = sheetInfo2.getColumnKey(i);
										var oldCellData = new CellData();
										oldCellData.label = contact.getLabel(key);
										oldCellData.value = contact.getValue(key);

										var newCellData = new CellData(key, '', '');
										contact.setValue(key, '');
										sheetInfo2.tableHandler.redrawContact(j, contact);

										undoData.addWriteAction(i, contactId, oldCellData, newCellData, false, j+offsetRow);
									}
								}
							}
						}

						if (rowCnt > 1)
						{
							undoData.sortKey = sheetInfo2.sortInfo['key'];
							undoData.sortType = sheetInfo2.sortInfo['type'];
						}
						sheetInfo2.addUndoAction(undoData);
					}
				},

				prepareAddContact: function() {
					var row = sheetInfo2.tableCell[0].rows.length - 1;
					sheetInfo2.tableHandler.setCurrentCell(0, row);
					sheetInfo2.tableHandler.startEditing();
				},
				
				clearSelection: function() {
					sheetInfo2.tableHandler.unselectCells();
				},
				
				undo: function() {
					if (sheetInfo2.undoBuffer != null && sheetInfo2.undoBuffer.length > 0)
					{
						if (sheetInfo2.redoBuffer == null)
							sheetInfo2.redoBuffer = new Array();

						var action = sheetInfo2.undoBuffer.pop();
						sheetInfo2.redoBuffer.push(action);
						
						sheetInfo2.tableHandler.undo(action);
					}
				},
				
				redo: function() {
					if (sheetInfo2.redoBuffer != null && sheetInfo2.redoBuffer.length > 0)
					{
						if (sheetInfo2.undoBuffer == null)
							sheetInfo2.undoBuffer = new Array();
						
						var action = sheetInfo2.redoBuffer.pop();
						sheetInfo2.undoBuffer.push(action);
						
						sheetInfo2.tableHandler.redo(action);
					}
				},
				
				syncContacts: function(contactIO) {

					var thisSheet = this;
					showWaitScreen().then(function() {
						var syncInfo = new SyncInfo();
						
						if (sheetInfo2.deletedContactList != null)
						{
							for (var i = 0; i < sheetInfo2.deletedContactList.length; i++)
							{
								var contact = sheetInfo2.deletedContactList[i];
								if (contact.isNew == false)
									syncInfo.addNeedToDelete(contact.fields['id'], contact.eTag);
							}
						}

						if (sheetInfo2.contactList != null)
						{
							for (var i = 0; i < sheetInfo2.contactList.length; i++)
							{
								var contact = sheetInfo2.contactList[i];
								if (contact.modified == true)
								{
									if (contact.isNew == true)
										syncInfo.addNeedToInsert(contact.fields['id']);
									else
										syncInfo.addNeedToUpdate(contact.fields['id']);
								}
							}
						}

						if (syncInfo.needToSync.length > 0)
						{
							contactIO.syncContacts(thisSheet, sheetInfo2.contactList, syncInfo, function() {
								sheetInfo2.deletedContactList = new Array();
								sheetInfo2.undoBuffer = null;
								sheetInfo2.redoBuffer = null;
								hideWaitScreen();
							});
						}
						else
						{
							hideWaitScreen();
						}
					});
				},
				
				find: function(option) {
					var startCol = sheetInfo2.currentCell.col;
					var offsetRow = (sheetInfo2.currentPage-1) * sheetInfo2.rowsPerPage;
					var startRow = offsetRow + sheetInfo2.currentCell.row;
					var lastResult = sheetInfo2.findResult;
					
					var range = new Object();
					if (option.scope == 1)
					{
						range.startRow = 0;
						range.endRow = sheetInfo2.contactList.length-1;
					}
					else if (option.scope == 2)
					{
						range.startRow = (sheetInfo2.currentPage-1) * sheetInfo2.rowsPerPage;
						range.endRow = range.startRow + sheetInfo2.tableCell[0].rows.length - 2;
					}
					else if (option.scope == 3)
					{
						if (sheetInfo2.selectedCells == null || sheetInfo2.selectedCells.length == 0)
							return;
						range.selectedCells = sheetInfo2.selectedCells;
						range.offsetRow = offsetRow;
					}
					
					if (typeof lastResult != 'undefined' && lastResult != null)
					{
						if (lastResult.txtFind == option.txtFind && lastResult.col == sheetInfo2.currentCell.col &&
								lastResult.row == sheetInfo2.currentCell.row + offsetRow)
						{
							if (option.direction == 1)
								startCol += 1;
							else
								startCol -= 1;
							
							if (startCol >= sheetInfo2.columnInfo.length)
							{
								startCol = 0;
								startRow += 1;
							}
							
							if (startRow >= sheetInfo2.contactList.length)
								startRow = 0;
						}
					}
					
					var findResult = sheetInfo2.tableHandler.findText(startCol, startRow, option.txtFind, option.direction, range);
					if (findResult != null)
					{
						sheetInfo2.findResult = findResult;
						
						if (findResult.page != sheetInfo2.currentPage)
						{
							showWaitScreen().then(function() {
								mySheet.setPage(findResult.page);
								offsetRow = (sheetInfo2.currentPage-1) * sheetInfo2.rowsPerPage;
								sheetInfo2.tableHandler.setCurrentCell(findResult.col, findResult.row - offsetRow);
							});
						}
						else
						{
							sheetInfo2.tableHandler.setCurrentCell(findResult.col, findResult.row - offsetRow);
						}
					}
				},
				
				replace: function(option) {
					var col = sheetInfo2.currentCell.col;
					var row = sheetInfo2.currentCell.row;
					var offsetRowIdx = (sheetInfo2.currentPage - 1) * sheetInfo2.rowsPerPage;
					var cid = sheetInfo2.getContactIdByRowIndex(row);

					var key = sheetInfo2.columnInfo[col].key;
					if (key == 'groups')
						return;

					var contact = sheetInfo2.contactList[offsetRowIdx + row];
					var contactId = contact.fields['id'];

					var oldValue = contact.getValue(key);
					var newValue = oldValue.split(option.txtFind).join(option.txtReplace);

					var oldCellData = new CellData(key, oldValue, oldValue);
					var newCellData = new CellData(key, newValue, newValue);

					var undoData = new UndoData('write');
					undoData.addWriteAction(col, contactId, oldCellData, newCellData, false, offsetRowIdx + row);
					sheetInfo2.addUndoAction(undoData);

					contact.setValue(key, newValue);
					sheetInfo2.tableHandler.redrawContact(row, contact);
				},

				replaceAll: function(option) {
					var offsetRow = (sheetInfo2.currentPage-1) * sheetInfo2.rowsPerPage;					
					var range = new Object();
					range.scope = option.scope;

					if (option.scope == 1) // all page
					{
						range.startRow = 0;
						range.endRow = sheetInfo2.contactList.length-1;
					}
					else if (option.scope == 2) // current page
					{
						range.startRow = offsetRow;
						range.endRow = range.startRow + sheetInfo2.tableCell[0].rows.length - 2;
					}
					else if (option.scope == 3) // selected area
					{
						if (sheetInfo2.selectedCells == null || sheetInfo2.selectedCells.length == 0)
							return;
						
						range.scope = 3;
						range.selectedCells = sheetInfo2.selectedCells;
						range.offsetRow = offsetRow;
					}
					
					sheetInfo2.tableHandler.replaceAllText(sheetInfo2, option.txtFind, option.txtReplace, range);
					$('#test-input').focus();
				},

				deleteSelectedRow: function() {

					var table = sheetInfo2.tableCell;
					var contactIds = new Array();

					for (var i = sheetInfo2.selectedRows.length-1; i >= 0; i--)
					{
						var row = sheetInfo2.selectedRows[i];
						var contactId = $(table[0].rows[row]).attr('contact-id');

						contactIds.push(contactId);
					}

					var undoData = new UndoData('deleteRow');
					var offsetRowIdx = (sheetInfo2.currentPage - 1) * sheetInfo2.rowsPerPage;

					for (var i = 0; i < contactIds.length; i++)
					{
						var contactId = contactIds[i];
						var contactIdx = sheetInfo2.tableHandler.getContactIdxByContactId(contactId);

						if (contactIdx >= 0)
						{
							var contact = sheetInfo2.deleteContact(contactId);
							sheetInfo2.tableHandler.deleteTableRow(contactIdx - offsetRowIdx);

							var undoAction = new Object();
							undoAction['contact-idx'] = contactIdx;
							undoAction['contact-id'] = contactId;
							undoAction['contact'] = contact;
							undoAction['sort-key'] = sheetInfo2.sortInfo['key'];
							undoAction['sort-type'] = sheetInfo2.sortInfo['type'];
							undoData.actionList.push(undoAction);
						}
					}

					sheetInfo2.addUndoAction(undoData);

					console.log('start adding row');
					// 삭제가 되면 페이지 다시 계산하고, 삭제된 만큼 다음 페이지에서 불러 와야 한다.
					var rowCnt = sheetInfo2.tableCell[0].rows.length - 1;
					if (rowCnt < sheetInfo2.rowsPerPage)
					{
						var cnt = sheetInfo2.rowsPerPage - rowCnt; // 하단에 추가해서 표시해야할 데이터 개수
						for (var i = 0; i < cnt; i++)
						{
							var contactIdx = i + offsetRowIdx + rowCnt;
							if (contactIdx >= sheetInfo2.contactList.length)
								break;

							var contact = sheetInfo2.contactList[contactIdx];
							var rowIdx = sheetInfo2.tableHandler.addTableRow(false);
							sheetInfo2.tableHandler.redrawContact(rowIdx, contact);
						}
					}

					// sheetInfo2.tableHandler.removeCellMouseEvent();
					// sheetInfo2.tableHandler.addCellMouseEvent();
					// sheetInfo2.tableHandler.addRowMouseEvent();
		
					console.log('end adding row');
				},

				reinit: function(element, options) {
					
					dummyTblRow = undefined;
					var groupList = sheetInfo2.groupList;
					var contactList = sheetInfo2.contactList;

					sheetInfo2.container.remove();

					if (options != null)
						sheetInfo2 = $.extend({}, defaultOptions, options);

					this.init(element);
					this.setContactList(groupList, contactList);
					sheetInfo2.myPlugin = this;
					return sheetInfo2.mySheet;
				},
				
				init: function(elem) {
					// draw tables in sheet
					var tableHandler = new TableHandler(sheetInfo2);
					var container = tableHandler.drawSheet(sheetInfo2);
					elem.append(container);
					sheetInfo2.container = container;
					sheetInfo2.tableCell = container.find('.tbl-cell');
					sheetInfo2.tableRow = container.find('.tbl-row');
					sheetInfo2.tableCol = container.find('.tbl-column');
					sheetInfo2.tableHandler = tableHandler;
					sheetInfo2.mySheet = this;

					sheetInfo2.currentCellMarker = null;
					sheetInfo2.sortInfo.key = sheetInfo2.getColumnKey(0);

					// default soft
					$(sheetInfo2.tableCol[0].rows[0].cells[0]).addClass('sortAsc');

					sheetInfo2.tableCell[0].oncontextmenu = function (e) {
						if (sheetInfo2.contextMenu != null)
							sheetInfo2.contextMenu.destroyMenu();

						sheetInfo2.contextMenu = new PopupMenu(menuHandler);
						var menuItemList = menuHandler.getMenuItemListForContext1();
						sheetInfo2.contextMenu.createMenu(e.pageX, e.pageY, menuItemList);

						$(window).on('click.contextMenu', function (e) {
							if (sheetInfo2.contextMenu != null) {
								sheetInfo2.contextMenu.destroyMenu();
								sheetInfo2.contextMenu = null;
							}
							$(window).off('click.contextMenu');
						});
						return false;
					};
					
					// $('#context-menu1 div').each(function(index, obj) {
					// 	if (index == 0)
					// 	{
					// 		obj.addEventListener('click', function() {
					// 			sheetInfo2.mySheet.undo();
					// 		});
					// 	}
					// 	else if (index == 1)
					// 	{
					// 		obj.addEventListener('click', function() {
					// 			sheetInfo2.mySheet.redo();
					// 		});
					// 	}
					// 	else if (index == 2)
					// 	{
					// 		obj.addEventListener('click', function() {
					// 			document.execCommand('copy');
					// 		});
					// 	}
					// 	else if (index == 3)
					// 	{
					// 		obj.addEventListener('click', function() {
					// 			document.execCommand('cut');
					// 		});
					// 	}
					// 	else if (index == 4) // paste
					// 	{
					// 		obj.addEventListener('click', function() {
					//
					// 			var mySheet = sheetInfo2.myPlugin;
					// 			if (mySheet.clipboardData == null)
					// 				return;
					//
					// 			var text = mySheet.clipboardData.text;
					// 			var jsonString = mySheet.clipboardData.jsonString;
					//
					// 			if (jsonString != null && jsonString != '')
					// 			{
					// 				mySheet.pasteClipboardData(jsonString);
					// 			}
					// 			else
					// 			{
					// 				mySheet.setCurrentCellText(text);
					// 			}
					// 		});
					// 	}
					// 	else if (index == 5) // delete
					// 	{
					// 		obj.addEventListener('click', function() {
					//
					// 			if (sheetInfo2.selectedRows != null && sheetInfo2.selectedRows.length > 0)
					// 			{
					// 				showWaitScreen().then(function() {
					// 					sheetInfo2.myPlugin.deleteSelectedRow();
					// 					hideWaitScreen();
					// 				});
					// 			}
					// 			else
					// 				sheetInfo2.myPlugin.deleteSelectedCellText();
					// 		});
					// 	}
					// 	else if (index == 6) // select row
					// 	{
					// 		obj.addEventListener('click', function() {
					//
					// 			var row = sheetInfo2.currentCell.row;
					// 			sheetInfo2.tableHandler.selectRow(row);
					// 			sheetInfo2.tableHandler.setCurrentCell(0, row);
					// 		});
					// 	}
					// 	else if (index == 7) // group
					// 	{
					// 		obj.addEventListener('click', function() {
					//
					// 			var rowArray = new Array();
					// 			var selectedGroups = new Array();
					//
					// 			if (sheetInfo2.selectedRows != null && sheetInfo2.selectedRows.length > 0)
					// 			{
					// 				for (var i = 0; i < sheetInfo2.selectedRows.length; i++)
					// 				{
					// 					var row = sheetInfo2.selectedRows[i];
					// 					rowArray.push(row);
					// 				}
					// 			}
					// 			else if (sheetInfo2.selectedCells != null && sheetInfo2.selectedCells.length > 0)
					// 			{
					// 				for (var i = 0; i < sheetInfo2.selectedCells.length; i++)
					// 				{
					// 					var sel = sheetInfo2.selectedCells[i];
					// 					for (var j = sel.row1; j <= sel.row2; j++)
					// 					{
					// 						rowArray.push(j);
					// 					}
					// 				}
					// 			}
					// 			else
					// 			{
					// 				var row = sheetInfo2.currentCell.row;
					// 				rowArray.push(row);
					// 			}
					//
					// 			for (var i = 0; i < rowArray.length; i++)
					// 			{
					// 				var row = rowArray[i];
					// 				var contact = sheetInfo2.getContactByRow(row);
					// 				var groups = contact.getValue('groups');
					//
					// 				if (groups != null)
					// 				{
					// 					for (var k = 0; k < groups.length; k++)
					// 					{
					// 						var found = false;
					// 						var groupId = groups[k]['id'];
					// 						for (var j = 0; j < selectedGroups.length; j++)
					// 						{
					// 							if (selectedGroups[j] == groupId)
					// 							{
					// 								found = true;
					// 								break;
					// 							}
					// 						}
					//
					// 						if (found == false)
					// 							selectedGroups.push(groupId);
					// 					}
					// 				}
					// 			}
					//
					// 			onGroup(selectedGroups);
					// 		});
					// 	}
					// });
					//
					// sheetInfo2.tableCell.contextmenu(function(e) {
					// 	$('#context-menu1').css('display', 'block');
					// 	$('#context-menu1').css('left', e.pageX + 'px');
					// 	$('#context-menu1').css('top', e.pageY + 'px');
					//
					// 	if (sheetInfo2.undoBuffer != null && sheetInfo2.undoBuffer.length > 0)
					// 	{
					// 		$('#context-menu-undo').removeClass('menu-item2');
					// 		$('#context-menu-undo').addClass('menu-item');
					// 	}
					// 	else
					// 	{
					// 		$('#context-menu-undo').removeClass('menu-item');
					// 		$('#context-menu-undo').addClass('menu-item2');
					// 	}
					//
					// 	if (sheetInfo2.redoBuffer != null && sheetInfo2.redoBuffer.length > 0)
					// 	{
					// 		$('#context-menu-redo').removeClass('menu-item2');
					// 		$('#context-menu-redo').addClass('menu-item');
					// 	}
					// 	else
					// 	{
					// 		$('#context-menu-redo').removeClass('menu-item');
					// 		$('#context-menu-redo').addClass('menu-item2');
					// 	}
					//
					// 	return false;
					// });


					$('#context-menu2 div').each(function(index, obj) {
						if (index == 0)
						{
							obj.addEventListener('click', function() {
								sheetInfo2.mySheet.undo();
							});
						}
						else if (index == 1)
						{
							obj.addEventListener('click', function() {
								sheetInfo2.mySheet.redo();
							});
						}
						else if (index == 2)
						{
							obj.addEventListener('click', function() {
								document.execCommand('copy');
							});
						}
						else if (index == 3) // paste
						{
							obj.addEventListener('click', function() {
								
								var mySheet = sheetInfo2.myPlugin;

								if (mySheet.clipboardData == null)
									return;

								var text = mySheet.clipboardData.text;
								var jsonString = mySheet.clipboardData.jsonString;
								
								if (jsonString != null && jsonString != '')
								{
									mySheet.pasteClipboardData(jsonString);
								}
								else
								{
									mySheet.setCurrentCellText(text);
								}
							});
						}
						else if (index == 4) // delete
						{
							obj.addEventListener('click', function() {

								if (sheetInfo2.selectedRows != null && sheetInfo2.selectedRows.length > 0)
								{
									showWaitScreen().then(function() {
										sheetInfo2.myPlugin.deleteSelectedRow();
										hideWaitScreen();
									});
								}
								else
									sheetInfo2.myPlugin.deleteSelectedCellText();
							});
						}
						else if (index == 5) // group
						{
							obj.addEventListener('click', function() {

								var rowArray = new Array();
								var selectedGroups = new Array();

								if (sheetInfo2.selectedRows != null && sheetInfo2.selectedRows.length > 0)
								{
									for (var i = 0; i < sheetInfo2.selectedRows.length; i++)
									{
										var row = sheetInfo2.selectedRows[i];
										rowArray.push(row);
									}
								}
								else if (sheetInfo2.selectedCells != null && sheetInfo2.selectedCells.length > 0)
								{
									for (var i = 0; i < sheetInfo2.selectedCells.length; i++)
									{
										var sel = sheetInfo2.selectedCells[i];
										for (var j = sel.row1; j <= sel.row2; j++)
										{
											rowArray.push(j);
										}
									}
								}
								else
								{
									var row = sheetInfo2.currentCell.row;
									rowArray.push(row);
								}

								for (var i = 0; i < rowArray.length; i++)
								{
									var row = rowArray[i];
									var contact = sheetInfo2.getContactByRow(row);
									var groups = contact.getValue('groups');

									if (groups != null)
									{
										for (var k = 0; k < groups.length; k++)
										{
											var found = false;
											var groupId = groups[k]['id'];
											for (var j = 0; j < selectedGroups.length; j++)
											{
												if (selectedGroups[j] == groupId)
												{
													found = true;
													break;
												}
											}

											if (found == false)
												selectedGroups.push(groupId);
										}
									}
								}

								onGroup(selectedGroups);
							});
						}
					});

					sheetInfo2.tableRow.contextmenu(function(e) {
						$('#context-menu2').css('display', 'block');
						$('#context-menu2').css('left', e.pageX + 'px');
						$('#context-menu2').css('top', e.pageY + 'px');

						if (sheetInfo2.undoBuffer != null && sheetInfo2.undoBuffer.length > 0)
						{
							$('#context-menu-undo').removeClass('menu-item2');
							$('#context-menu-undo').addClass('menu-item');
						}
						else
						{
							$('#context-menu-undo').removeClass('menu-item');
							$('#context-menu-undo').addClass('menu-item2');
						}

						if (sheetInfo2.redoBuffer != null && sheetInfo2.redoBuffer.length > 0)
						{
							$('#context-menu-redo').removeClass('menu-item2');
							$('#context-menu-redo').addClass('menu-item');
						}
						else
						{
							$('#context-menu-redo').removeClass('menu-item');
							$('#context-menu-redo').addClass('menu-item2');
						}

						return false;
					});
					
					window.addEventListener("click", function() {
						$('.context-menu').css('display', 'none');
					})

					// draw column resize handles
					var tblColumn = $(container.find('.tbl-column')[0]);		
					var handleContainer = sheetInfo2.tableHandler.drawColumnResizeHandles(tblColumn);
					handleContainer.insertBefore(tblColumn);
					
					// column click event handler
					tblColumn.find('.column-label').on('click', function(e) {
						var key = $(this).attr('column-key');
						var key2 = 'full-name';
						
						if (key == 'full-name')
							key2 = 'family-name';

						$(this).parents('tr').find('td').removeClass('sortAsc');
						$(this).parents('tr').find('td').removeClass('sortDsc');

						var asc = true;
						var sortType = 'sortAsc';

						if (sheetInfo2.sortInfo != null)
						{
							if (sheetInfo2.sortInfo.key == key)
							{
								if (sheetInfo2.sortInfo.type == 'sortAsc')
									sortType = 'sortDsc';
								else
									sortType = 'sortAsc';
							}
						}

						sheetInfo2.sortInfo = new Object();
						sheetInfo2.sortInfo.key = key;
						sheetInfo2.sortInfo.type = sortType;

						var td = $(this).parents('td');
						td.addClass(sortType);
						
						showWaitScreen().then(function() {
							sheetInfo2.sortContactList(key, key2, sortType);
							mySheet.setContactList(null, sheetInfo2.contactList);							
						});
					});
					
					// Scroll event handler
					container.find('.cell-container').scroll(function() {
						var top  = $(this).scrollTop();
						var left = $(this).scrollLeft();
						
						$(this).parents('.ion-sheet-container').find('.column-container').scrollLeft(left);
						$(this).parents('.ion-sheet-container').find('.row-container').scrollTop(top);
					});

					// Column resize handle
					container.find('.col-resize-handle').draggable({
						axis:"x",
						start: function(event, ui) {
							currentHandle = $(event.currentTarget);
							resizeHandleIdx = currentHandle.parent().children('div').index(currentHandle);
							orgX = ui.position.left;
							
							if (resizeHandleIdx == 0)
								limitX = 0;
							else
								limitX = currentHandle.prev().position().left;

							sheetInfo2.currentCellMarker.css('display', 'none');
						},
						drag: function(event, ui) {
							if (ui.position.left < limitX)
								ui.position.left = limitX;
							
							var width = ui.position.left - limitX;
							var cell = currentHandle.parents('.ion-sheet-container').find('.tbl-column')[0].rows[0].cells[resizeHandleIdx];
							$(cell).css('width', width + 'px');
							$(cell).css('min-width', width + 'px');
							$(cell).css('max-width', width + 'px');
			
							var div = $(cell).children().first();
							div.css('width', width + 'px');
			
							var container = currentHandle.parents('.ion-sheet-container');
							for (var i = 0; i < sheetInfo2.getRowCount(); i++)
							{
								cell = container.find('.tbl-cell')[0].rows[i].cells[resizeHandleIdx];
								$(cell).css('width', width + 'px');
								$(cell).css('min-width', width + 'px');
								$(cell).css('max-width', width + 'px');
							}
						},
						stop: function(event, ui) {
			
							var dx = -orgX + ui.position.left;
							var children = currentHandle.parent().children('div');
							
							for (var i = resizeHandleIdx + 1; i < sheetInfo2.getColumnCount() - 1; i++)
							{
								var newLeft = $(children[i]).position().left + dx;
								$(children[i]).css('left', newLeft + 'px');
							}
							
							var tblCell = sheetInfo2.tableCell;
							for (var i = 0; i < sheetInfo2.getColumnCount(); i++)
							{
								var width = $(tblCell[0].rows[0].cells[i]).css('width');
								sheetInfo2.columnInfo[i]['width'] = width;
							}

							dummyTblRow = undefined;
							dummyTblCell = undefined;

							sheetInfo2.currentCellMarker.css('display', 'block');
							sheetInfo2.tableHandler.setCurrentCell(sheetInfo2.currentCell.col, sheetInfo2.currentCell.row);
							
							loadUserOption(function(userDefineColumnList) {
								
								for (var i = 0; i < sheetInfo2.columnInfo.length; i++)
								{
									var key = sheetInfo2.getColumnKey(i);
									var width = sheetInfo2.columnInfo[i]['width'];

									for (var j = 0; j < userDefineColumnList.length; j++)
									{
										if (userDefineColumnList[j].key == key)
										{
											userDefineColumnList[j].width = width;
											break;
										}
									}
								}
								userColumnList = userDefineColumnList;
								saveUserOption(userDefineColumnList);
							});
						}
					});

					$('#cell-input').on('keydown', keydownHandler);
					$('#cell-input')[0].focus();
					$('#cell-ta').on('keydown', keydownHandler);
					
					$(window).on('keyup', function(event) {

						var target = $(event.target);

						function resize()
						{
							var curRow = sheetInfo2.currentCell.row;
							var curCol = sheetInfo2.currentCell.col;

							target.css('height', 'auto');
							target.css('height', (target[0].scrollHeight) + 'px');

							sheetInfo2.tableCell[0].rows[curRow].cells[curCol].style.height = '30px';

							var h1 = target[0].offsetHeight + 3;
							var h2 = sheetInfo2.tableCell[0].rows[curRow].offsetHeight;

							var h = (h1 > h2) ? h1 : h2;

							sheetInfo2.tableCell[0].rows[curRow].cells[curCol].style.height = h + 'px';
							sheetInfo2.tableRow[0].rows[curRow].cells[0].style.height = h + 'px';
						}

						function delayedResize()
						{
							window.setTimeout(resize, 0);
						}

						if (target.attr('id') == 'cell-ta' && event.keyCode != 27 && event.keyCode != 9)
						{
							if (target.attr('editing') == 'true')
							{
								delayedResize();
							// 	var curRow = sheetInfo2.currentCell.row;
							// 	var curCol = sheetInfo2.currentCell.col;

							// 	target.css('height', 'auto');
							// 	target.css('height', (target[0].scrollHeight) + 'px');

							// 	var h = target[0].offsetHeight + 3;

							// 	sheetInfo2.tableCell[0].rows[curRow].cells[curCol].style.height = h + 'px';
							// 	sheetInfo2.tableRow[0].rows[curRow].cells[0].style.height = h + 'px';
							}
						}
					});

					// $(window).on('keydown', function(event) {
			
					// 	var target = $(event.target);

					// 	if (target.attr('id') == 'cell-input')
					// 	{
					// 		return;
					// 	}
					// 	else if (target.attr('id') == 'cell-ta')
					// 	{
					// 		return;
					// 	}

					// 	return;
						
					// 	var test = document.activeElement.tagName;
					// 	if (document.activeElement.tagName == 'INPUT' || document.activeElement.tagName == 'TEXTAREA')
					// 		return;
						
					// 	var table = container.find('.tbl-cell');
					// 	var editing = table.find('.edting-now').length > 0 ? true : false;
						
					// 	if (event.keyCode == 90) // 'z'
					// 	{
					// 		if (event.metaKey || event.ctrlKey) // Cmd+Z, Ctrl+Z
					// 		{
					// 			event.preventDefault();
					// 			if (event.shiftKey)
					// 			{
					// 				sheetInfo2.myPlugin.redo();									
					// 			}
					// 			else
					// 			{
					// 				sheetInfo2.myPlugin.undo();
					// 			}
					// 			return;
					// 		}
					// 	}
					// 	else if (event.keyCode == 89) // 'y'
					// 	{
					// 		if (event.ctrlKey) // Ctrl+Y
					// 		{
					// 			event.preventDefault();
					// 			sheetInfo2.myPlugin.redo();
					// 		}
					// 	}
					// 	else if (event.keyCode == 27) // esc
					// 	{
					// 		if ($('.group-menu-wrap').css('display') != 'none')
					// 		{
					// 			event.preventDefault();
					// 			sheetInfo2.tableHandler.cancelEditing();
					// 		}
					// 	}
					// 	else if (event.keyCode == 32) // space
					// 	{
					// 		if ($('.group-menu-wrap').css('display') != 'none')
					// 		{
					// 			event.preventDefault();
					// 			sheetInfo2.groupMenu.toggleSelection();
					// 		}
					// 	}
					// 	else if (event.keyCode == 36) // HOME
					// 	{
					// 		event.preventDefault();
					// 		if (event.ctrlKey)
					// 		{
					// 			var col = sheetInfo2.currentCell.col;
					// 			sheetInfo2.tableHandler.setCurrentCell(col, 0);
					// 		}
					// 		else
					// 		{
					// 			var row = sheetInfo2.currentCell.row;
					// 			var col = 0;
					// 			sheetInfo2.tableHandler.setCurrentCell(col, row);
					// 		}
					// 	}
					// 	else if (event.keyCode == 35) // END
					// 	{
					// 		event.preventDefault();
					// 		if (event.ctrlKey)
					// 		{
					// 			var col = sheetInfo2.currentCell.col;
					// 			var row = sheetInfo2.tableCell[0].rows.length-1;
					// 			sheetInfo2.tableHandler.setCurrentCell(col, row);
					// 		}
					// 		else
					// 		{
					// 			var row = sheetInfo2.currentCell.row;
					// 			var col = sheetInfo2.getColumnCount() - 1;
					// 			sheetInfo2.tableHandler.setCurrentCell(col, row);
					// 		}
					// 	}
					// 	else if (event.keyCode == 37) // left
					// 	{
					// 		if (event.metaKey)
					// 		{
					// 			event.preventDefault();
					// 			var row = sheetInfo2.currentCell.row;
					// 			var col = 0;
					// 			sheetInfo2.tableHandler.setCurrentCell(col, row);
					// 		}
					// 		else
					// 		{
					// 			if (!editing && sheetInfo2.currentCell.col > 0)
					// 			{
					// 				event.preventDefault();
					// 				var col = sheetInfo2.currentCell.col - 1;
					// 				var row = sheetInfo2.currentCell.row;
					// 				sheetInfo2.tableHandler.setCurrentCell(col, row);
					// 			}
					// 		}
					// 	}
					// 	else if (event.keyCode == 38) // up
					// 	{
					// 		if ($('.group-menu-wrap').css('display') != 'none')
					// 		{
					// 			event.preventDefault();
					// 			sheetInfo2.groupMenu.moveUp();
					// 		}
					// 		else if (!editing && sheetInfo2.currentCell.row > 0)
					// 		{
					// 			event.preventDefault();

					// 			if (event.metaKey == true)
					// 			{
					// 				if (event.ctrlKey == true)
					// 				{
					// 					var col = sheetInfo2.currentCell.col;
					// 					sheetInfo2.tableHandler.setCurrentCell(col, 0);
					// 				}
					// 				else
					// 				{
					// 					var rowCnt = Math.round(sheetInfo2.tableCell.parent().outerHeight() / parseInt(sheetInfo2.defaultRowHeight));
										
					// 					var col = sheetInfo2.currentCell.col;
					// 					var row = sheetInfo2.currentCell.row;
					// 					if (row - rowCnt > 0)
					// 						sheetInfo2.tableHandler.setCurrentCell(col, row-rowCnt);
					// 					else
					// 						sheetInfo2.tableHandler.setCurrentCell(col, 0);
					// 				}
					// 			}
					// 			else
					// 			{
					// 				var col = sheetInfo2.currentCell.col;
					// 				var row = sheetInfo2.currentCell.row;
									
					// 				sheetInfo2.tableHandler.setCurrentCell(col, row-1);
					// 			}
					// 		}
					// 	}
					// 	else if (event.keyCode == 39) // right
					// 	{
					// 		if (event.metaKey == true)
					// 		{
					// 			event.preventDefault();
					// 			var row = sheetInfo2.currentCell.row;
					// 			var col = sheetInfo2.getColumnCount() - 1;
					// 			sheetInfo2.tableHandler.setCurrentCell(col, row);
					// 		}
					// 		else
					// 		{
					// 			if (sheetInfo2.currentCell.col < sheetInfo2.getColumnCount()-1)
					// 			{
					// 				event.preventDefault();
					// 				var col = sheetInfo2.currentCell.col + 1;
					// 				var row = sheetInfo2.currentCell.row;
					// 				sheetInfo2.tableHandler.setCurrentCell(col, row);
					// 			}
					// 		}
					// 	}
					// 	else if (event.keyCode == 40) // down
					// 	{
					// 		if ($('.group-menu-wrap').css('display') != 'none')
					// 		{
					// 			event.preventDefault();
					// 			sheetInfo2.groupMenu.moveDown();
					// 		}
					// 		else if (!editing && sheetInfo2.currentCell.row < sheetInfo2.getRowCount() - 1)
					// 		{
					// 			event.preventDefault();
					// 			if (event.metaKey == true)
					// 			{
					// 				if (event.ctrlKey == true)
					// 				{
					// 					var col = sheetInfo2.currentCell.col;
					// 					var row = sheetInfo2.tableCell[0].rows.length-1;
					// 					sheetInfo2.tableHandler.setCurrentCell(col, row);
					// 				}
					// 				else
					// 				{
					// 					var rowCnt = Math.round(sheetInfo2.tableCell.parent().outerHeight() / parseInt(sheetInfo2.defaultRowHeight));

					// 					var col = sheetInfo2.currentCell.col;
					// 					var row = sheetInfo2.currentCell.row;
					// 					if (row + rowCnt > sheetInfo2.tableCell[0].rows.length-1)
					// 						sheetInfo2.tableHandler.setCurrentCell(col, sheetInfo2.tableCell[0].rows.length-1);
					// 					else
					// 						sheetInfo2.tableHandler.setCurrentCell(col, row + rowCnt);
					// 				}
					// 			}
					// 			else
					// 			{
					// 				var col = sheetInfo2.currentCell.col;
					// 				var row = sheetInfo2.currentCell.row;
	
					// 				sheetInfo2.tableHandler.setCurrentCell(col, row+1);
					// 			}
					// 		}
					// 	}
					// 	else if (event.keyCode == 46 || event.keyCode == 8) // delete
					// 	{
					// 		event.preventDefault();

					// 		if (sheetInfo2.selectedRows != null && sheetInfo2.selectedRows.length > 0)
					// 		{
					// 			showWaitScreen().then(function() {
					// 				sheetInfo2.myPlugin.deleteSelectedRow();
					// 				hideWaitScreen();
					// 			});
					// 			//sheetInfo2.myPlugin.deleteSelectedRow();
					// 		}
					// 		else
					// 			sheetInfo2.myPlugin.deleteSelectedCellText();
					// 	}
					// 	else if (event.keyCode == 9) // tab
					// 	{
					// 		event.preventDefault();
							
					// 		if (editing)
					// 			sheetInfo2.tableHandler.stopEditing();

					// 		var col = sheetInfo2.currentCell.col;
					// 		var row = sheetInfo2.currentCell.row;

					// 		if (event.shiftKey == false)
					// 		{
					// 			if (col < sheetInfo2.getColumnCount() - 1)
					// 			{
					// 				sheetInfo2.tableHandler.setCurrentCell(col+1, row);
					// 			}
					// 			else
					// 			{
					// 				if (row < sheetInfo2.tableCell[0].rows.length - 1)
					// 					sheetInfo2.tableHandler.setCurrentCell(0, row+1);
					// 			}
					// 		}
					// 		else
					// 		{
					// 			if (col > 0)
					// 			{
					// 				sheetInfo2.tableHandler.setCurrentCell(col-1, row);
					// 			}
					// 			else
					// 			{
					// 				if (row > 0)
					// 					sheetInfo2.tableHandler.setCurrentCell(sheetInfo2.getColumnCount()-1, row-1);
					// 			}
					// 		}
					// 	}
					// 	else if (event.keyCode == 13) // enter
					// 	{
					// 		if ($('.group-menu-wrap').css('display') != 'none')
					// 		{
					// 			event.preventDefault();
					// 			sheetInfo2.tableHandler.stopEditing();
					// 		}
					// 		else
					// 		{
					// 			event.preventDefault();
					// 			sheetInfo2.tableHandler.startEditing();
					// 		}
					// 	}
					// 	else
					// 	{
					// 		var test = Event;
					// 		if (event.metaKey == false && event.ctrlKey == false && event.altKey == false)
					// 		{
					// 			//$('#cell-input').focus();
					// 			//var ip = $('#cell-input')[0].dispatchEvent(event.originalEvent);
					// 			//sheetInfo2.tableHandler.startEditing(false);
					// 		}
					// 		// var e = jQuery.Event('keydown');
					// 		// e.keyCode = event.keyCode;
					// 		// var test = $('#cell-editor');
					// 		// test.trigger(e);
					// 	}
					// })
				}
		};
		
		myPlugin.init(this);
		sheetInfo2.myPlugin = myPlugin;
		
		mySheetInfo = sheetInfo2;
		return myPlugin;
	};
})(jQuery);

$.fn.ionContactSheet.showMessage = function(title, message)
{
	var html = '<div id="message-box" title="' + title + '">';
	html += '<p><span class="ui-icon ui-icon-circle-check" style="float:left; margin:0 7px 50px 0;"></span>';
	html += message;
	html += '</p></div>';
	$(html).dialog({
		modal: true,
		buttons: {
			Ok: function() {
				$(this).dialog('close');
			}
		}
	});
}
