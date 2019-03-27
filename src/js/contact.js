function Contact(contactId)
{
    this.fields = new Object();
    this.modified = false;
    this.isNew = false;

    if (typeof contactId != 'undefined')
    {
        this.fields['id'] = contactId;
        this.modified = true;
    }

    this.setValue = function(key, value)
    {
        if (key == 'groups')
        {
            if (value == null || value == '')
            {
                this.fields[key] = null;
            }
            else if (Array.isArray(value))
            {
                this.fields[key] = value;
            }
        }
        else
        {
            if (Array.isArray(value))
            {
                var label = '';

                for (var i = 0; i < value.length; i++)
                {
                    if (i > 0)
                        label += ', ';
                    label += value[i].label;
                }

                this.fields[key] = label;
            }
            else
            {
                this.fields[key] = value;
            }
        }

        var orgKey = 'origin-' + key;
        var equal = this.isValueEqual(key, this.fields[orgKey]);
        this.checkModification();

        return !equal;
    }

    this.checkModification = function()
    {
        var keys = Object.keys(this.fields);

        this.modified = false;

        for (var i = 0; i < keys.length; i++)
        {
            var key = keys[i];

            if (key != 'id' && key.indexOf('origin-') < 0)
            {
                var orgKey = 'origin-' + key;

                if (this.isValueEqual(key, this.fields[orgKey]) == false)
                {
                    this.modified = true;
                    break;
                }
            }
        }
    }

    this.isFieldModified = function(key) 
    {
        var orgKey = 'origin-' + key;
        
        var val = this.getValue(orgKey);
        return !this.isValueEqual(key, val);
    }

    this.isEmpty = function()
    {
        var empty = true;
        var keys = Object.keys(this.fields);

        for (var i = 0; i < keys.length; i++)
        {
            var key = keys[i];
            if (key != 'id')
            {
                if (key == 'groups')
                {
                    var groupList = this.fields[key];
                    if (groupList != null && Array.isArray(groupList) == true && groupList.length > 0)
                        empty = false;
                }
                else
                {
                    if (this.fields[key] != null && this.fields[key] != null && this.fields[key] != '')
                        empty = false;
                }
            }

            if (empty == false)
                break;
        }

        return empty;
    }

    this.getValue = function(key)
    {
        if (key == 'groups' || key == 'origin-groups')
        {
            if (Array.isArray(this.fields[key]))
                return this.fields[key].slice(0);
            else
                return null;
        }
        else
        {
            //str.replace(/<br\s*[\/]?>/gi, "\n");
            return typeof this.fields[key] == 'undefined' ? '' : this.fields[key];
        }
    }

    this.hasValue = function(key)
    {
        if (typeof this.fields[key] == 'undefined')
            return false;
        else
            return true;
    }

    this.getLabel = function(key)
    {
        if (key == 'groups' || key == 'origin-groups')
        {
            var label = '';
            var groups = this.fields[key];

            if (Array.isArray(groups))
            {
                for (var i = 0; i < groups.length; i++)
                {
                    if (i > 0)
                        label += ', ';
                    label += groups[i].label;
                }
            }

            return label;
        }
        else if (key == 'note' || key == 'origin-note' || key == 'postal-address' || key == 'origin-postal-address')
        {
            var value = (typeof this.fields[key] == 'undefined') ? '' : this.fields[key];
            return value.split('\n').join('<br>');
        }
        else
        {
            var label = (typeof this.fields[key] == 'undefined') ? '' : this.fields[key];
            if (label.indexOf('br') > 0)
            {
                var test = 1;
                test = 1 + test;
            }
            return label.replace(/<br\s*[\/]?>/gi, " ");
            //return typeof this.fields[key] == 'undefined' ? '' : this.fields[key].replace(/<br\s*[\/]?>/gi, " ");
        }
    }

    this.getFields = function(columnInfo)
    {
        var fields = new Object();

        if (typeof columnInfo != 'undefined')
        {
            for (var i = 0; i < columnInfo.length; i++)
            {
                var key = columnInfo[i].key;
                fields[key] = this.getValue(key);
            }
        }
        else
        {
            var keys = Object.keys(this.fields);
            for (var i = 0; i < keys.length; i++)
            {
                var key = keys[i];
                fields[key] = this.getValue(key);
            }
        }

        return fields;
    }

    this.setFields = function(fields, isNew)
    {
        if (typeof isNew == 'undefined')
            isNew = true;

        this.isNew = isNew;
        var keys = Object.keys(fields);
        for (var i = 0; i < keys.length; i++)
        {
            var key = keys[i];
            this.fields[key] = fields[key];
        }
    }

    this.isValueEqual = function(key, value)
    {
        if (key == 'groups')
        {
            var val1 = (typeof this.fields[key] == 'undefined' || this.fields[key] == null) ? new Array() : this.fields[key];
            var val2 = (typeof value == 'undefined' || value == null) ? new Array() : value;

            var eq = false;
            if (val1.length == val2.length)
            {
                eq = true;
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
                        eq = false;
                        break;
                    }
                }
            }

            return eq;
        }
        else
        {
            var val1 = (typeof this.fields[key] == 'undefined') ? '' : this.fields[key];
            var val2 = (typeof value == 'undefined') ? '' : value;

            return (val1 == val2);
        }
    }
}