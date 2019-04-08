function CellData(key, label, value)
{
    this.key = (typeof key == 'undefined') ? null : key;
    this.label = (typeof label == 'undefined') ? null : label;
    this.value = (typeof value == 'undefined') ? null : value;

    this.col = -1;
    this.row = -1;

    this.setCellData = function(data)
    {
        this.col = data.col;
        this.row = data.row;

        if (this.key == null)
        {
            this.key = data.key;
            this.label = data.label;
            this.value = data.value;
        }
        else if (this.key === 'groups')
        {
            if (data.key === 'groups')
            {
                this.label = data.label;
                this.value = data.value;
            }
        }
        else
        {
            if (data.key === 'groups')
            {
                this.label = data.label;
                this.value = data.label;
            }
            else
            {
                this.label = data.label;
                this.value = data.value;
            }
        }
    };

    this.isEqual = function(data)
    {
        if (this.key != 'groups' && data.key != 'groups')
        {
            var val1 = (typeof this.value == 'undefined') ? '' : this.value;
            var val2 = (typeof data.value == 'undefined') ? '' : data.value;

            return (val1 == val2);
        }
        else if (this.key == 'groups' && data.key == 'groups')
        {
            var val1 = (typeof this.value == 'undefined' || this.value == null) ? new Array() : this.value;
            var val2 = (typeof data.value == 'undefined' || data.value == null) ? new Array() : data.value;

            var modified = false;
            
            if (val1.length != val2.length)
            {
                modified = true;
            }
            else
            {
                // 기존의 그룹 배열과 선택된 그룹 배열을 비교하여 수정되었는지 여부를 판단한다.
                for (var i = 0; i < val1.length; i++)
                {
                    var found = false;

                    for (var j = 0; j < val2.length; j++)
                    {
                        if (val1[i].id == val2[j].id)
                        {
                            found = true;
                            break;
                        }
                    }
                    
                    if (found == false)
                    {
                        modified = true;
                        break;
                    }
                }
            }

            return !modified;
        }
        else if (this.key != 'groups')
        {
            var val1 = (typeof this.value == 'undefined') ? '' : this.value;
            var val2 = (typeof data.label == 'undefined') ? '' : data.label;

            return (val1 == val2);
        }
        else
        {
            return false;
        }
    }
}

function UndoData(type, page)
{
    this.type = (typeof type == 'undefined') ? 'write' : type;
    this.sortKey = null;
    this.sortType = null;
    this.actionList = new Array();
    this.page = (typeof page == 'undefined') ? 0 : page;

    this.addAction = function(action)
    {
        if (typeof action.col != 'undefined')
            action.key = mySheet.sheetInfo.getColumnKey(action.col);

        this.actionList.push(action);
    }

    this.addWriteAction = function(col, contactId, oldCellData, newCellData, rowAdded, contactIdx)
    {
        var action = new Object();
        action.key = mySheet.sheetInfo.getColumnKey(col);
        action.col = col;
        action.contactIdx = contactIdx;
        action.contactId = contactId;
        action.oldCellData = oldCellData;
        action.newCellData = newCellData;

        if (typeof rowAdded == 'undefined')
            rowAdded = false;
        
        action.rowAdded = rowAdded;

        this.addAction(action);
    }
};

function SyncInfo()
{
    this.needToSync = new Array();
    this.synched = new Array();

    this.reset = function()
    {
        this.needToSync = new Array();
        this.synched = new Array();
    }

    this.addNeedToInsert = function(contactId)
    {
        var obj = new Object();
        obj.contactId = contactId;
        obj.type = 'i';
        this.needToSync.push(obj);
    }

    this.addNeedToUpdate = function(contactId)
    {
        var obj = new Object();
        obj.contactId = contactId;
        obj.type = 'u';
        this.needToSync.push(obj);
    }

    this.addNeedToDelete = function(contactId, eTag)
    {
        var obj = new Object();
        obj.contactId = contactId;
        obj.type = 'd';
        obj.eTag = eTag;
        this.needToSync.push(obj);
    }

    this.addSyncResult = function(contactId, result)
    {
        var obj = new Object();
        obj.contactId = contactId;
        obj.result = result;
        this.synched.push(obj);
    }

    this.isSyncFinished = function()
    {
        if (this.needToSync.length == this.synched.length)
            return true;
        else
            return false;
    }

    this.getFailedResultCount = function()
    {
        var count = 0;
        for (var i = 0; i < this.synched.length; i++)
        {
            if (this.synched.result == false)
                count++;
        }

        return count;
    }

    this.getSuccessedResultCount = function()
    {
        var count = 0;
        for (var i = 0; i < this.synched.length; i++)
        {
            if (this.synched.result == true)
                count++;
        }

        return count;
    }
}