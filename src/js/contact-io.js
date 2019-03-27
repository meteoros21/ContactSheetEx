function ContactIO()
{
    this.contactGroupList = null;

    // 서버로부터 주소록 그룹 리스트를 얻어 온다.
    this.loadContactGroupList = function(callback)
    {
        let init = {
            method: 'GET',
            async: true,
            headers: {
                Authorization: 'Bearer ' + authToken,
                'Content-Type': 'application/json',
                'GData-Version': '3.0',
                'Access-Control-Allow-Origin': '*'
            },
            'contentType': 'json'
        };

        var thisContactIO = this;

        fetch('https://www.google.com/m8/feeds/groups/default/full?alt=json', init)
            .then((response) => response.json())
            .then(function(data) {
                //console.log(data);
                
                thisContactIO.contactGroupList = new Array();
                var entries = data['feed']['entry'];
                for (var i = 0; i < entries.length; i++)
                {
                    var entry = entries[i];
                    
                    if (entry['gContact$systemGroup'] != null)
                    {
                        if (entry['gContact$systemGroup']['id'] == 'Contacts')
                        {
                            var group = new Object();
                            group['id'] = entry['id']['$t'];
                            group['label'] = '내 주소록';
                            thisContactIO.contactGroupList.push(group);
                        }
                    }
                    else
                    {
                        var group = new Object();
                        group['id'] = entry['id']['$t'];
                        group['label'] = entry['title']['$t'];
                        thisContactIO.contactGroupList.push(group);
                    }
                }
                
                var groupSelect = $('#group-selector');
                for (var i = 0; i < thisContactIO.contactGroupList.length; i++)
                {
                    var option = $('<option>' + thisContactIO.contactGroupList[i].label + '</option>');
                    option.attr('value', thisContactIO.contactGroupList[i].id);
                    groupSelect.append(option);
                }

                callback(thisContactIO.contactGroupList);
                
                // showWaitScreen();
                
                // getContactList(null, null, 1, 15000, function(contactList) {
                    
                //     sortContactList(contactList, 'full-name', 'family-name');
                //     mySheet.setContactList(contactGroupList, contactList);
                    
                //     hideWaitScreen();
                // });
            });
    }

    // 서버로부터 주소록 목록을 얻어온다(JSON)
    this.loadContactList = function(groupId, keyword, startIndex, maxCount, callback)
    {
        var params = 'alt=json';

        if (typeof startIndex == 'undefined')
            startIndex = 1;
        if (typeof maxCount == 'undefined')
            maxCount = 15000;
        if (typeof groupId == 'undefined' || groupId == null)
            groupId = "";
        if (typeof keyword == 'undefined' || keyword == null)
            keyword = "";
    
        if (groupId != "")
            params += '&group=' + encodeURIComponent(groupId);
        if (keyword != "")
            params += '&q=' + encodeURIComponent(keyword);
        params += '&max-results=' + maxCount;
        params += '&start-index=' + startIndex;
        
        let init = {
            method: 'GET',
            async: true,
            headers: {
                Authorization: 'Bearer ' + authToken,
                'Content-Type': 'application/json',
                'GData-Version': '3.0',
                'Access-Control-Allow-Origin': '*'
            },
            'contentType': 'json'
        };

        var thisContactIO = this;
        
        fetch('https://www.google.com/m8/feeds/contacts/default/full?' + params, init)
            .then((response) => response.json())
            .then(function(data) {
                console.log(data);
                var feed = data['feed'];
                var entries = feed['entry'];

                _clientId = encodeURIComponent(feed['id']['$t']);
                
                var contactList = new Array();
                
                if (Array.isArray(entries))
                {
                    for (var i = 0; i < entries.length; i++)
                    {
                        var contact = thisContactIO._extractContactInfo(entries[i]);
                        
                        if (contact != null)
                            contactList.push(contact);
                    }
                }    
                callback(contactList);
            });
    }

    // 서버로부터 contactId에 대응되는 주소록을 얻어온다(XML)
    this.loadContact = function(contactId, callback)
    {
        let init = {
			method: 'GET',
			async: false,
			cache: "no-cache",
			headers: {
				Authorization: 'Bearer ' + authToken,
				'If-Match': '*',
				'Content-Type': 'application/atom+xml',
				'GData-Version': '3.0'
			}
		};
		
		fetch('https://www.google.com/m8/feeds/contacts/default/full/' + contactId, init)
			.then(response => {
				
				var decoder = new TextDecoder();
				var reader = response.body.getReader();
				var xml = '';				
				
				return reader.read().then(function processResult(result) {
					if (result.done) {
						//console.log("Fetch complete");
						return xml;
					}
					
					xml += decoder.decode(result.value, {stream: true});
					
					return reader.read().then(processResult);
				})
			})
			.then(function(xml) {
				
				var parser = new DOMParser();
				var xmlDoc = parser.parseFromString(xml, "text/xml");
				callback(xmlDoc);
				
			})
			.catch(function(e) {
				console.log('fail to load contact');
                console.log(e);
                callback(null);
            });
    }

    this.getContact = function(contactList, contactId)
    {
        if (typeof contactList == 'undefined' || contactList == null)
            return null;
        
        var contact = null;
        if (Array.isArray(contactList))
        {
            for (var i = 0; i < contactList.length; i++)
            {
                if (contactList[i].fields['id'] == contactId)
                {
                    contact = contactList[i];
                    break;
                }
            }
        }

        return contact;
    }

    this._cloneNode = function(xmlDoc, contactId)
    {
        var fullContactId = 'http://www.google.com/m8/feeds/contacts/' + _clientId + '/base/' + contactId;
        var entries = xmlDoc.getElementsByTagName('entry');
        for (var i = 0; i < entries.length; i++)
        {
            var entry = entries[i];
            var id = entry.getElementsByTagName('id')[0].childNodes[0].nodeValue;

            if (id == fullContactId)
            {
                return entry.cloneNode(true);
            }
        }

        return null;
    }

    this._sendBatchOperation = function(xmlDoc, callback)
    {
        var xmlText = new XMLSerializer().serializeToString(xmlDoc);
        xmlText = xmlText.split('xmlns=""').join('');
       
        console.log(xmlText);
        
        let init = {
            method: 'POST',
            async: false,
            headers: {
                Authorization: 'Bearer ' + authToken,
                'Content-Type': 'application/atom+xml',
                'GData-Version': '3.0'
            },
            body: xmlText
        };

        var thisContactIO = this;
        
        fetch('https://www.google.com/m8/feeds/contacts/default/full/batch', init)
            .then(response => {
                
                var decoder = new TextDecoder();
                var reader = response.body.getReader();
                var xml = '';				
                
                return reader.read().then(function processResult(result) {
                    if (result.done) {
                        //console.log("Fetch complete");
                        return xml;
                    }
                    
                    xml += decoder.decode(result.value, {stream: true});
                    
                    return reader.read().then(processResult);
                })
            })
            .then(function(xml) {
                
                console.log(xml);
                var parser = new DOMParser();
                var xmlDoc = parser.parseFromString(xml, "text/xml");
                //var contact = thisContactIO._extractContactInfoFromXmlDoc(xmlDoc);
                callback(xmlDoc);
                
            })
            .catch(function(e) {
                console.log(e);
                callback(null);
            });
    }

    this.syncContacts = function(contactsSheet, contactList, syncInfo, callback)
    {
        var startIndex = 0;

        // batch 작업 내의 최대 데이터수가 100개로 제한된다.
        var pages = Math.ceil(syncInfo.needToSync.length / 100);
        for (var i = 0; i < pages; i++)
        {
            this._syncContactsInternal(startIndex, contactsSheet, contactList, syncInfo, function() {
                if (i == pages)
                    callback();
            });

            startIndex += 100;
        }
    }

    this._syncContactsInternal = function(startIndex, contactsSheet, contactList, syncInfo, callback)
    {
        var xmlDoc = this._createBatchFeedXml();
        var endIndex = startIndex + 100;

        if (endIndex > syncInfo.needToSync.length)
            endIndex = syncInfo.needToSync.length;

        // 업데이트가 필요한 컨텍트가 존재하면 우선 서버로부터 새로운 데이터를 읽어들인다.
        for (var i = startIndex; i < endIndex; i++)
        {
            var info = syncInfo.needToSync[i];
            if (info.type == 'u') // need to update
            {
                this._createRetrieveEntry(xmlDoc, info.contactId);
            }
        }

        var ns1 = "http://www.w3.org/2005/Atom";
        var nsBatch = "http://schemas.google.com/gdata/batch";
        var nsContact = "http://schemas.google.com/contact/2008";
        var nsGd = "http://schemas.google.com/g/2005";

        var feed = xmlDoc.getElementsByTagName('feed')[0];
        feed.setAttribute('xmlns', ns1);
        feed.setAttribute('xmlns:batch', nsBatch);
        feed.setAttribute('xmlns:gContact', nsContact);
        feed.setAttribute('xmlns:gd', nsGd);


        var thisContactIO = this;

        // 업데이트에 필요한 새로운 데이터를 조회한다.
        this._sendBatchOperation(xmlDoc, function(resultFeed) {

            xmlDoc = thisContactIO._createBatchFeedXml();

            var ns1 = "http://www.w3.org/2005/Atom";
            var nsBatch = "http://schemas.google.com/gdata/batch";
            var nsContact = "http://schemas.google.com/contact/2008";
            var nsGd = "http://schemas.google.com/g/2005";
    
            var feed = xmlDoc.getElementsByTagName('feed')[0];
            feed.setAttribute('xmlns', ns1);
            feed.setAttribute('xmlns:batch', nsBatch);
            feed.setAttribute('xmlns:gContact', nsContact);
            feed.setAttribute('xmlns:gd', nsGd);
    

            for (var i = startIndex; i < endIndex; i++)
            {
                var info = syncInfo.needToSync[i];

                if (info.type == 'i')
                {
                    var contact = thisContactIO.getContact(contactList, info.contactId);
                    thisContactIO._createInsertEntry(xmlDoc, contact);
                }
                else if (info.type == 'u')
                {
                    var contact = thisContactIO.getContact(contactList, info.contactId);
                    var entry = thisContactIO._cloneNode(resultFeed, info.contactId);
                    thisContactIO._createUpdateEntry(xmlDoc, entry, contact);
                }
                else if (info.type == 'd')
                {
                    thisContactIO._createDeleteEntry(xmlDoc, info.contactId, info.eTag);
                }
            }

            thisContactIO._sendBatchOperation(xmlDoc, function(resultFeed2) {

                if (typeof resultFeed2 == 'undefined' || resultFeed2 == null)
                    callback();

                var entries = resultFeed2.getElementsByTagName('entry');
                for (var i = 0; i < entries.length; i++)
                {
                    var entry = entries[i];
                    var oOperation = entry.getElementsByTagName('batch:operation')[0];
                    var operation = oOperation.getAttribute('type');

                    var oStatus = entry.getElementsByTagName('batch:status')[0];
                    var statusCode = oStatus.getAttribute('code');
                    var reason = oStatus.getAttribute('reason');

                    if (operation == 'insert')
                    {
                        var pos = i + startIndex;
                        var si = syncInfo.needToSync[pos];

                        if (statusCode == 201)
                        {
                            var contact = thisContactIO._extractContactInfoXml(entry);
                            contactsSheet.onContactInserted(si.contactId, contact, true);
                            syncInfo.addSyncResult(si.contactId, true);
                        }
                        else
                        {
                            syncInfo.addSyncResult(si.contactId, false);
                        }
                    }
                    else if (operation == 'update')
                    {
                        if (statusCode == 200)
                        {
                            var contact = thisContactIO._extractContactInfoXml(entry);
                            var contactId = contact.fields['id'];
                            contactsSheet.onContactUpdated(contactId, contact, true);
                            syncInfo.addSyncResult(contactId, true);
                        }
                        else
                        {
                            var oContactId = entry.getElementsByTagName('id')[0];
                            var contactId = oContactId.childNodes[0].nodeValue;
                            var pos = contactId.lastIndexOf('/');
                            contactId = contactId.substring(pos+1);
                            contactsSheet.onContactUpdated(contactId, null, false);
                            syncInfo.addSyncResult(contactId, false);
                        }
                    }
                    else if (operation == 'delete')
                    {
                        var oContactId = entry.getElementsByTagName('id')[0];
                        var contactId = oContactId.childNodes[0].nodeValue;
                        var pos = contactId.lastIndexOf('/');
                        contactId = contactId.substring(pos+1);

                        if (statusCode == 200)
                        {
                            syncInfo.addSyncResult(contactId, true);
                        }
                        else
                        {
                            syncInfo.addSyncResult(contactId, false);
                        }
                    }
                }

                console.log('=====> aaaa');
                callback();

            });

        });
    }

    // 변경된 주소록 데이터를 서버에 반영한다.
    this.syncContacts3 = function(contactsSheet, contactList, syncInfo, callback)
    {
        for (var i = 0; i < syncInfo.needToSync.length; i++)
        {
            var info = syncInfo.needToSync[i];
            if (info.type == 'i')
            {
                contact = this.getContact(contactList, info.contactId);
                this._insertContact(contact, function(orgContactId, con, result) {
                    syncInfo.addSyncResult(orgContactId, result);
                    contactsSheet.onContactInserted(orgContactId, con, result);
                    if (syncInfo.isSyncFinished())
                    {
                        callback();
                    }
                });
            }
            else if (info.type == 'u')
            {
                var contact = this.getContact(contactList, info.contactId);
                this._updateContact(contact, function(con, result) {
                    syncInfo.addSyncResult(con.fields['id'], result);
                    contactsSheet.onContactUpdated(con.fields['id'], con, result);
                    if (syncInfo.isSyncFinished())
                    {
                        callback();
                    }
                });
            }
            else if (info.type == 'd')
            {
                this._deleteContact(info.contactId, function(contactId, result) {
                    syncInfo.addSyncResult(contactId, result);
                    if (syncInfo.isSyncFinished())
                    {
                        callback();
                    }
                });
            }
        }
    }

    this._createBatchFeedXml = function()
    {
        var xmlDoc = document.implementation.createDocument(null, 'feed');

        return xmlDoc;
    }

    this._createRetrieveEntry = function(xmlDoc, contactId)
    {
        var feed = xmlDoc.getElementsByTagName('feed')[0];
        var entry = xmlDoc.createElementNS(feed.namespaceURI, 'entry');
        feed.appendChild(entry);

        var batchId = xmlDoc.createElement('batch:id');
        batchId.appendChild(xmlDoc.createTextNode('retrieve'));
        batchId.removeAttribute('xmlns:batch');
        entry.appendChild(batchId);

        var batchOperation = xmlDoc.createElement('batch:operation');
        batchOperation.setAttribute('type', 'query');
        batchOperation.removeAttribute('xmlns:batch');
        entry.appendChild(batchOperation);

        var id = xmlDoc.createElement('id');
        id.appendChild(xmlDoc.createTextNode('https://www.google.com/m8/feeds/contacts/' + _clientId + '/full/' + contactId));
        entry.appendChild(id);
    }

    this._createInsertEntry = function(xmlDoc, contact)
    {
        var contactInfo = contact.fields;
        var feed = xmlDoc.getElementsByTagName('feed')[0];

        var entry = xmlDoc.createElement('entry');
        feed.appendChild(entry);

        var batchId = xmlDoc.createElement('batch:id');
        batchId.appendChild(xmlDoc.createTextNode('create'));
        entry.appendChild(batchId);

        var batchOperation = xmlDoc.createElement('batch:operation');
        batchOperation.setAttribute('type', 'insert');
        entry.appendChild(batchOperation);

        var category = xmlDoc.createElement('category');
        category.setAttribute('scheme', 'http://schemas.google.com/g/2005#kind');
        category.setAttribute('term', 'http://schemas.google.com/g/2008#contact');
        entry.appendChild(category);

        var oName = xmlDoc.createElement('gd:name');
        var nameInfos = [
            {"key": "full-name", "tag": "gd:fullName"},
            {"key": "given-name", "tag": "gd:givenName"},
            {"key": "family-name", "tag": "gd:familyName"},
            {"key": "middle-name", "tag": "gd:additionalName"}];

        for (var i = 0; i < nameInfos.length; i++)
        {
            var key = nameInfos[i]['key'];
            var tag = nameInfos[i]['tag'];

            if (contact.getValue(key) != '')
            {
                var oSubName = xmlDoc.createElement(tag);
                oSubName.appendChild(xmlDoc.createTextNode(contact.getValue(key)));
                oName.appendChild(oSubName);
            }
        }
        entry.appendChild(oName);

        var emailInfos = [{"key": "email-home", "rel": "home"},
            {"key": "email-work", "rel": "work"},
            {"key": "email-other", "rel": "other"}];

        for (var i = 0; i < emailInfos.length; i++)
        {
            var key = emailInfos[i]['key'];
            var rel = emailInfos[i]['rel'];
            var val = contact.getValue(key);

            if (val != '')
            {    
                var obj = xmlDoc.createElement('gd:email');
                obj.setAttribute('rel', 'http://schemas.google.com/g/2005#' + rel);
                obj.setAttribute('address', val);
                entry.appendChild(obj);
            }
        }

        var phoneInfos = [{"key": "phone-home", "rel": "home"},
            {"key": "phone-work", "rel": "work"},
            {"key": "phone-mobile", "rel": "mobile"}];

        for (var i = 0; i < emailInfos.length; i++)
        {
            var key = phoneInfos[i]['key'];
            var rel = phoneInfos[i]['rel'];
            var val = contact.getValue(key);

            if (val != '')
            {    
                var obj = xmlDoc.createElement('gd:phoneNumber');
                obj.setAttribute('rel', 'http://schemas.google.com/g/2005#' + rel);
                obj.appendChild(xmlDoc.createTextNode(val));
                entry.appendChild(obj);
            }
        }
        
        var orgName = contact.getValue('org-name');
        var orgTitle = contact.getValue('org-title');
        
        if ((orgName != null && orgName != '') || (orgTitle != null && orgTitle != ''))
        {
            var oOrg = xmlDoc.createElement('gd:organization');
            oOrg.setAttribute('rel', 'http://schemas.google.com/g/2005#other');
            
            if (orgName != null && orgName != '')
            {
                var obj = xmlDoc.createElement('gd:orgName');
                obj.appendChild(xmlDoc.createTextNode(orgName));
                oOrg.appendChild(obj);
            }
    
            if (orgTitle != null && orgTitle != '')
            {
                var obj = xmlDoc.createElement('gd:orgTitle');
                obj.appendChild(xmlDoc.createTextNode(orgTitle));
                oOrg.appendChild(obj);
            }
            entry.appendChild(oOrg);
        }
        
        if (contactInfo['groups'] != null && contactInfo['groups'].length > 0)
        {
            for (var i = 0; i < contactInfo['groups'].length; i++)
            {
                var obj = xmlDoc.createElement('gContact:groupMembershipInfo');
                obj.setAttribute('href', contactInfo['groups'][i].id);
                obj.setAttribute('deleted', 'false');
                entry.appendChild(obj);
            }
        }

        if (contactInfo['postal-address'] != null && contactInfo['postal-address'] != '')
        {
            var oStructuredAddr = xmlDoc.createElement('gd:structuredPostalAddress');
            oStructuredAddr.setAttribute('rel', 'http://schemas.google.com/g/2005#other');
            entry.appendChild(oStructuredAddr);

            var oFormattedAddr = xmlDoc.createElement('gd:formattedAddress');
            oFormattedAddr.appendChild(xmlDoc.createTextNode(contactInfo['postal-address']));
            oStructuredAddr.appendChild(oFormattedAddr);
        }

        if (contactInfo['note'] != null && contactInfo['note'] != '')
        {
            var oContent = xmlDoc.createElement('content');
            oContent.setAttribute('type', 'text');
            oContent.appendChild(xmlDoc.createTextNode(contactInfo['note']));
            entry.appendChild(oContent);
        }
    }

    this._createDeleteEntry = function(xmlDoc, contactId, etag)
    {
        //var len = etag.length;
        //etag = etag.substring(1, len-1);
        var feed = xmlDoc.getElementsByTagName('feed')[0];

        var entry = xmlDoc.createElement('entry');
        feed.appendChild(entry);
        entry.setAttribute('gd:etag', etag);

        var batchId = xmlDoc.createElement('batch:id');
        batchId.appendChild(xmlDoc.createTextNode('delete'));
        entry.appendChild(batchId);

        var batchOperation = xmlDoc.createElement('batch:operation');
        batchOperation.setAttribute('type', 'delete');
        entry.appendChild(batchOperation);

        var id = xmlDoc.createElement('id');
        id.appendChild(xmlDoc.createTextNode('https://www.google.com/m8/feeds/contacts/' + _clientId + '/full/' + contactId));
        entry.appendChild(id);
    }

    this._createUpdateEntry = function(xmlDoc, entry, contact)
    {
        var contactInfo = contact.fields;
        var feed = xmlDoc.getElementsByTagName('feed')[0];
        feed.appendChild(entry);

        var batchId = entry.getElementsByTagName('batch:id')[0];
        batchId.childNodes[0].nodeValue = 'update';

        var batchOperation = entry.getElementsByTagName('batch:operation')[0];
        batchOperation.setAttribute('type', 'update');

        var nameObj = null;

        if (entry.getElementsByTagName('gd:name').length > 0)
        {
            nameObj = entry.getElementsByTagName('gd:name')[0];
        }
        else
        {
            nameObj = xmlDoc.createElement('gd:name');
            entry.appendChild(nameObj);
        }
        
        var nameInfos = [
            {"key": "full-name", "tag": "gd:fullName"},
            {"key": "given-name", "tag": "gd:givenName"},
            {"key": "family-name", "tag": "gd:familyName"},
            {"key": "middle-name", "tag": "gd:additionalName"}];

        for (var i = 0; i < nameInfos.length; i++)
        {
            var key = nameInfos[i]['key'];
            var tag = nameInfos[i]['tag'];
            var orgKey = 'origin-' + key;

            var name = contact.getValue(key);
            var orgName = contact.getValue(orgKey);

            if (name != orgName)
            {
                if (orgName == '')
                {
                    var obj = xmlDoc.createElement(tag);
                    obj.appendChild(xmlDoc.createTextNode(name));
                    nameObj.appendChild(obj);
                }
                else
                {
                    if (name == '') // 삭제된 경우.
                    {
                        var obj = nameObj.getElementsByTagName(tag)[0];
                        nameObj.removeChild(obj);
                    }
                    else
                    {
                        var obj = nameObj.getElementsByTagName(tag)[0];
                        obj.childNodes[0].nodeValue = name;	
                    }
                }
            }
        }
        
        var emailInfo = [
            {'key': 'email-home', 'rel': 'http://schemas.google.com/g/2005#home'},
            {'key': 'email-work', 'rel': 'http://schemas.google.com/g/2005#work'},
            {'key': 'email-other', 'rel': 'http://schemas.google.com/g/2005#other'}
        ];
        
        for (var j = 0; j < emailInfo.length; j++)
        {
            var key = emailInfo[j]['key'];
            var email = contactInfo[key];
            var originEmail = contactInfo['origin-' + key];
            email = (typeof email == 'undefined') ? '' : email.trimRight();
            originEmail = (typeof originEmail == 'undefined') ? '' : originEmail.trimRight(); 
                    
            if (email != originEmail)
            {
                if (originEmail == null || originEmail == '')
                {
                    if (email != null && email != '')
                    {
                        var emailObj = xmlDoc.createElement('gd:email');
                        emailObj.setAttribute('rel', emailInfo[j]['rel']);
                        emailObj.setAttribute('address', email);
                        entry.appendChild(emailObj);
                        //console.log('email added: ' + email + ', ' + emailInfo[j]['rel']);
                    }
                }
                else
                {
                    if (email == null || email == '')
                    {
                        var emailObjs = entry.getElementsByTagName('gd:email');
                        for (var k = 0; k < emailObjs.length; k++)
                        {
                            var emailObj = emailObjs[k];
                            var test1 = emailObj.getAttribute('rel');
                            var test2 = emailObj.getAttribute('address');
    
                            if (emailObj.getAttribute('rel') == emailInfo[j]['rel'] &&
                                    emailObj.getAttribute('address') == originEmail)
                            {
                                entry.removeChild(emailObj);
                                //console.log('email removed: ' + test2 + ', ' + emailInfo[j]['rel']);
                                break;
                            }
                        }					
                    }
                    else
                    {
                        var emailObjs = entry.getElementsByTagName('gd:email');
                        for (var k = 0; k < emailObjs.length; k++)
                        {
                            var emailObj = emailObjs[k];
                            var test1 = emailObj.getAttribute('rel');
                            var test2 = emailObj.getAttribute('address');
                            
                            if (emailObj.getAttribute('rel') == emailInfo[j]['rel'] &&
                                    emailObj.getAttribute('address') == originEmail)
                            {
                                emailObj.setAttribute('address', email);
                                break;
                            }
                        }
                    }
                }
            }
        }
    
        var pnInfo = [
            {'key': 'phone-home', 'rel': 'http://schemas.google.com/g/2005#home'},
            {'key': 'phone-work', 'rel': 'http://schemas.google.com/g/2005#work'},
            {'key': 'phone-mobile', 'rel': 'http://schemas.google.com/g/2005#mobile'}
        ];
        
        for (var j = 0; j < pnInfo.length; j++)
        {
            var key = pnInfo[j]['key'];
            var pn = (typeof contactInfo[key] == 'undefined') ? '' : contactInfo[key].trimRight();
            var originPn = contactInfo['origin-' + key];
            originPn = (typeof originPn == 'undefined') ? '' : originPn.trimRight();
            
            if (pn != originPn)
            {
                if (originPn == null || originPn == '')
                {
                    if (pn != '')
                    {
                        var pnObj = xmlDoc.createElement('gd:phoneNumber');
                        pnObj.setAttribute('rel', pnInfo[j]['rel']);
                        pnObj.appendChild(xmlDoc.createTextNode(pn));
                        entry.appendChild(pnObj);
                    }
                }
                else
                {
                    if (pn == null || pn == '')
                    {
                        var pnObjs = entry.getElementsByTagName('gd:phoneNumber');
                        for (var k = 0; k < pnObjs.length; k++)
                        {
                            var pnObj = pnObjs[k];
                            if (pnObj.getAttribute('rel') == pnInfo[j]['rel'] &&
                                    pnObj.childNodes[0].nodeValue == originPn)
                            {
                                entry.removeChild(pnObj);
                                break;
                            }
                        }					
                    }
                    else
                    {
                        var pnObjs = entry.getElementsByTagName('gd:phoneNumber');
                        for (var k = 0; k < pnObjs.length; k++)
                        {
                            var pnObj = pnObjs[k];							
                            if (pnObj.getAttribute('rel') == pnInfo[j]['rel'] &&
                                    pnObj.childNodes[0].nodeValue == originPn)
                            {
                                pnObj.childNodes[0].nodeValue = pn;
                                break;
                            }
                        }
                    }
                }
            }
        }
        
        var orgName = (typeof contactInfo['org-name'] == 'undefined' || contactInfo['org-name'] == null) ? null : contactInfo['org-name'].trimRight();
        var originOrgName = (typeof contactInfo['origin-org-name'] == 'undefined' || contactInfo['origin-org-name'] == null) ? null : contactInfo['origin-org-name'].trimRight();
        var orgTitle = (typeof contactInfo['org-title'] == 'undefined' || contactInfo['org-title'] == null) ? null : contactInfo['org-title'].trimRight();
        var originOrgTitle = (typeof contactInfo['origin-org-title'] == 'undefined' || contactInfo['origin-org-title'] == null) ? null : contactInfo['origin-org-title'].trimRight();
        
        if (orgName != originOrgName || orgTitle != originOrgTitle)
        {
            var found = false;
            var orgs = entry.getElementsByTagName('gd:organization');
            
            for (var k = 0; k < orgs.length; k++)
            {
                var org = orgs[k];
                var match = true;
                
                if (originOrgName != null && originOrgName != '')
                {
                    var orgNameObj = org.getElementsByTagName('gd:orgName')[0];
                    if (orgNameObj.childNodes[0].nodeValue != originOrgName)
                        match = false;
                }
                
                if (originOrgTitle != null && originOrgTitle != '')
                {
                    var orgTitleObj = org.getElementsByTagName('gd:orgTitle')[0];
                    if (orgTitleObj.childNodes[0].nodeValue != originOrgTitle)
                        match = false;
                }
                
                if (match == true)
                {
                    if (org.getElementsByTagName('gd:orgName').length == 0)
                    {
                        if (orgName != null && orgName != '')
                        {
                            var orgNameObj = xmlDoc.createElement('gd:orgName');
                            orgNameObj.appendChild(xmlDoc.createTextNode(orgName));
                            org.appendChild(orgNameObj);
                        }
                    }
                    else
                    {
                        var orgNameObj = org.getElementsByTagName('gd:orgName')[0];
                        orgNameObj.childNodes[0].nodeValue = orgName;
                    }
                    
                    if (org.getElementsByTagName('gd:orgTitle').length == 0)
                    {
                        if (orgTitle != null && orgTitle != '')
                        {
                            var orgTitleObj = xmlDoc.createElement('gd:orgTitle');
                            orgTitleObj.appendChild(xmlDoc.createTextNode(orgTitle));
                            org.appendChild(orgTitleObj);
                        }
                    }
                    else
                    {
                        var orgTitleObj = org.getElementsByTagName('gd:orgTitle')[0];
                        orgTitleObj.childNodes[0].nodeValue = orgTitle;
                    }
                    
                    found = true;
                    break;
                }
            }
            
            if (found == false)
            {
                var org = document.createElement('gd:organization');
                org.setAttribute('rel', 'http://schemas.google.com/g/2005#other');
                
                if (orgName != null && orgName != '')
                {
                    var orgNameObj = xmlDoc.createElement('gd:orgName');
                    orgNameObj.appendChild(document.createTextNode(orgName));
                    org.appendChild(orgNameObj);
                }
                if (orgTitle != null && orgTitle != '')
                {
                    var orgTitleObj = xmlDoc.createElement('gd:orgTitle');
                    orgTitleObj.appendChild(document.createTextNode(orgTitle));
                    org.appendChild(orgTitleObj);
                }
    
                entry.appendChild(org);
            }
        }
        
        var groupObjects = entry.getElementsByTagName('gContact:groupMembershipInfo');
        for (var j = groupObjects.length-1; j >= 0; j--)
        {
            var found = false;
            var groupObject = groupObjects[j];
            
            for (var i = 0; i < contactInfo['groups'].length; i++)
            {
                var group = contactInfo['groups'][i];
                if (groupObject.getAttribute('href') == group['id'])
                {
                    found = true;
                    break;
                }
            }
            
            if (found == false)
                entry.removeChild(groupObject);
        }
        
        if (contactInfo['groups'] != null)
        {
            for (var j = 0; j < contactInfo['groups'].length; j++)
            {
                var found = false;
                var group = contactInfo['groups'][j];
                var groupObjects = entry.getElementsByTagName('gContact:groupMembershipInfo');
                for (var i = 0; i < groupObjects.length; i++)
                {
                    var groupObject = groupObjects[i];
                    if (group['id'] == groupObject.getAttribute('href'))
                    {
                        found = true;
                        break;
                    }
                }
                
                if (found == false)
                {
                    var groupObject = xmlDoc.createElement('gContact:groupMembershipInfo');
                    groupObject.setAttribute('deleted', 'false');
                    groupObject.setAttribute('href', group['id']);
                    entry.appendChild(groupObject);
                }
            }
        }

        var postalAddress = contact.getValue('postal-address');
        var originPostalAddress = contact.getValue('origin-postal-address');

        if (postalAddress != originPostalAddress)
        {
            var objs = entry.getElementsByTagName('gd:formattedAddress');
            if (objs.length == 0)
            {
                var oStructuredAddr = xmlDoc.createElement('gd:structuredPostalAddress');
                oStructuredAddr.setAttribute('rel', 'http://schemas.google.com/g/2005#other');

                var oFormattedAddr = xmlDoc.createElement('gd:formattedAddress');
                oFormattedAddr.appendChild(xmlDoc.createTextNode(postalAddress));
                oStructuredAddr.appendChild(oFormattedAddr);

                entry.appendChild(oStructuredAddr);
            }
            else
            {
                for (var i = 0; i < objs.length; j++)
                {
                    var oFormattedAddr = objs[0];
                    if (oFormattedAddr.childNodes[0].nodeValue == originPostalAddress)
                    {
                        oFormattedAddr.childNodes[0].nodeValue = postalAddress;
                        break;
                    }
                }

            }
        }

        var note = contact.getValue('note');
        var originNote = contact.getValue('origin-note');

        if (note != originNote)
        {
            var objs = entry.getElementsByTagName('content');
            if (objs.length == 0)
            {
                var oNote = xmlDoc.createElement('content');
                oNote.setAttribute('type', 'text');
                oNote.appendChild(xmlDoc.createTextNode(note));
                entry.appendChild(oNote);
            }
            else
            {
                var oNote = objs[0];
                oNote.childNodes[0].nodeValue = note;
            }
        }
    }

    // 하나의 주소록을 등록한다.
    this._insertContact = function(contact, callback)
    {
        var tempContactId = contact.fields['id'];
        var contactInfo = contact.fields;

        var txt = '<atom:entry xmlns:atom="http://www.w3.org/2005/Atom" xmlns:gContact="http://schemas.google.com/contact/2008" xmlns:gd="http://schemas.google.com/g/2005">';
        txt += '<atom:category scheme="http://schemas.google.com/g/2005#kind" term="http://schemas.google.com/contact/2008#contact"/>';
        txt += '</atom:entry>';
        
        var parser = new DOMParser();
        var xmlDoc = parser.parseFromString(txt, "text/xml");
        var entry = xmlDoc.getElementsByTagName('atom:entry')[0];
        
        var oName = xmlDoc.createElement('gd:name');
        var nameInfos = [
            {"key": "full-name", "tag": "gd:fullName"},
            {"key": "given-name", "tag": "gd:givenName"},
            {"key": "family-name", "tag": "gd:familyName"},
            {"key": "middle-name", "tag": "gd:additionalName"}];

        for (var i = 0; i < nameInfos.length; i++)
        {
            var key = nameInfos[i]['key'];
            var tag = nameInfos[i]['tag'];

            if (contact.getValue(key) != '')
            {
                var oSubName = xmlDoc.createElement(tag);
                oSubName.appendChild(xmlDoc.createTextNode(contact.getValue(key)));
                oName.appendChild(oSubName);
            }
        }
        entry.appendChild(oName);
        
        var emailInfos = [{"key": "email-home", "rel": "home"},
            {"key": "email-work", "rel": "work"},
            {"key": "email-other", "rel": "other"}];

        for (var i = 0; i < emailInfos.length; i++)
        {
            var key = emailInfos[i]['key'];
            var rel = emailInfos[i]['rel'];
            var val = contact.getValue(key);

            if (val != '')
            {    
                var obj = xmlDoc.createElement('gd:email');
                obj.setAttribute('rel', 'http://schemas.google.com/g/2005#' + rel);
                obj.setAttribute('address', val);
                entry.appendChild(obj);
            }
        }

        var phoneInfos = [{"key": "phone-home", "rel": "home"},
            {"key": "phone-work", "rel": "work"},
            {"key": "phone-mobile", "rel": "mobile"}];

        for (var i = 0; i < emailInfos.length; i++)
        {
            var key = phoneInfos[i]['key'];
            var rel = phoneInfos[i]['rel'];
            var val = contact.getValue(key);

            if (val != '')
            {    
                var obj = xmlDoc.createElement('gd:phoneNumber');
                obj.setAttribute('rel', 'http://schemas.google.com/g/2005#' + rel);
                obj.appendChild(xmlDoc.createTextNode(val));
                entry.appendChild(obj);
            }
        }
        
        var orgName = contact.getValue('org-name');
        var orgTitle = contact.getValue('org-title');
        
        if ((orgName != null && orgName != '') || (orgTitle != null && orgTitle != ''))
        {
            var oOrg = xmlDoc.createElement('gd:organization');
            oOrg.setAttribute('rel', 'http://schemas.google.com/g/2005#other');
            
            if (orgName != null && orgName != '')
            {
                var obj = xmlDoc.createElement('gd:orgName');
                obj.appendChild(xmlDoc.createTextNode(orgName));
                oOrg.appendChild(obj);
            }
    
            if (orgTitle != null && orgTitle != '')
            {
                var obj = xmlDoc.createElement('gd:orgTitle');
                obj.appendChild(xmlDoc.createTextNode(orgTitle));
                oOrg.appendChild(obj);
            }
            entry.appendChild(oOrg);
        }
        
        if (contactInfo['groups'] != null && contactInfo['groups'].length > 0)
        {
            for (var i = 0; i < contactInfo['groups'].length; i++)
            {
                var obj = xmlDoc.createElement('gContact:groupMembershipInfo');
                obj.setAttribute('href', contactInfo['groups'][i].id);
                obj.setAttribute('deleted', 'false');
                entry.appendChild(obj);
            }
        }
    
        var xmlText = new XMLSerializer().serializeToString(entry)
        console.log(xmlText);
        
        let init = {
            method: 'POST',
            async: false,
            headers: {
                Authorization: 'Bearer ' + authToken,
                'Content-Type': 'application/atom+xml',
                'GData-Version': '3.0'
            },
            body: xmlText
        };

        var thisContactIO = this;
        
        fetch('https://www.google.com/m8/feeds/contacts/default/full', init)
            .then(response => {
                
                var decoder = new TextDecoder();
                var reader = response.body.getReader();
                var xml = '';				
                
                return reader.read().then(function processResult(result) {
                    if (result.done) {
                        //console.log("Fetch complete");
                        return xml;
                    }
                    
                    xml += decoder.decode(result.value, {stream: true});
                    
                    return reader.read().then(processResult);
                })
            })
            .then(function(xml) {
                
                console.log(xml);
                var parser = new DOMParser();
                var xmlDoc = parser.parseFromString(xml, "text/xml");
                var contact = thisContactIO._extractContactInfoFromXmlDoc(xmlDoc);
                callback(tempContactId, contact, true);
                
            })
            .catch(function(e) {
                console.log(e);
                callback(tempContactId, contact, false);
            });
    }

    // 하나의 주소록을 갱신한다.
    this._updateContact = function(contact, callback)
    {
        if (typeof contact.xmlDoc != 'undefined' && contact.xmlDoc != null && contact.xmlDoc != '')
        {
            this._updateContactInternal(contact, function(con, result) {
                if (result == false)
                    contact.xmlDoc = null;

                callback(con, result);
            });
        }
        else
        {
            var thisContactIO = this;
            this.loadContact(contact.fields['id'], function(xmlDoc) {
                
                if (xmlDoc != null)
                {
                    contact.xmlDoc = xmlDoc;
                    thisContactIO._updateContactInternal(contact, function(con, result) {
                        callback(con, result);
                    });
                }
                else
                {
                    callback(contact, false);
                }
            });
        }
    }

    // 하나의 주소록을 삭제한다.
    this._deleteContact = function(contactId, callback)
    {
        let init = {
			method: 'DELETE',
			async: false,
			headers: {
				Authorization: 'Bearer ' + authToken,
				'If-Match': '*'
			}
		};
		
		fetch('https://www.google.com/m8/feeds/contacts/default/full/' + contactId, init)
			.then(response => {
				
				//mySheet.deleteContact(contactId);
                console.log(response);
                callback(contactId, true);
			});
    }

    // 주소록 목록을 정렬한다.
    this.sortContactList = function(contactList, key1, key2)
    {
        contactList.sort(function(a, b) {
            var fn1 = a.fields[key1] == null ? '' : a.fields[key1];
            var fn2 = b.fields[key1] == null ? '' : b.fields[key1];
            
            var cmp = fn1.localeCompare(fn2);
            
            if (cmp == 0)
            {
                var gn1 = a.fields[key2] == null ? '' : a.fields[key2];
                var gn2 = b.fields[key2] == null ? '' : b.fields[key2];
                
                return gn1.localeCompare(gn2);
            }
            else
            {
                return cmp;
            }
        });
    }

    this._extractContactInfo = function(entry)
    {
        var contact = new Contact();
	
        var contactId = entry['id']['$t'];
        var pos = contactId.lastIndexOf('/');
        contact.fields['id'] = contactId.substring(pos+1);
        contact.eTag = entry['gd$etag'];
        
        if (entry['gd$name'])
        {
            if (entry['gd$name']['gd$fullName'])
            {
                contact.fields['full-name'] = entry['gd$name']['gd$fullName']['$t'];
                contact.fields['origin-full-name'] = entry['gd$name']['gd$fullName']['$t'];
            }
            if (entry['gd$name']['gd$givenName'])
            {
                contact.fields['given-name'] = entry['gd$name']['gd$givenName']['$t'];
                contact.fields['origin-given-name'] = entry['gd$name']['gd$givenName']['$t'];
            }
            if (entry['gd$name']['gd$familyName'])
            {
                contact.fields['family-name'] = entry['gd$name']['gd$familyName']['$t'];
                contact.fields['origin-family-name'] = entry['gd$name']['gd$familyName']['$t'];
            }
            if (entry['gd$name']['gd$additionalName'])
            {
                contact.fields['middle-name'] = entry['gd$name']['gd$additionalName']['$t'];
                contact.fields['origin-middle-name'] = entry['gd$name']['gd$additionalName']['$t'];
            }
        }
        else
        {
            //return null;
        }
        
        var emailHome = this._extractEmail(entry, 'http://schemas.google.com/g/2005#home');
        if (emailHome != null)
        {
            contact.fields['email-home'] = emailHome;
            contact.fields['origin-email-home'] = emailHome;
        }
    
        var emailWork = this._extractEmail(entry, 'http://schemas.google.com/g/2005#work');
        if (emailWork != null)
        {
            contact.fields['email-work'] = emailWork;
            contact.fields['origin-email-work'] = emailWork;
        }
    
        var emailOther = this._extractEmail(entry, 'http://schemas.google.com/g/2005#other');
        if (emailOther != null)
        {
            contact.fields['email-other'] = emailOther;
            contact.fields['origin-email-other'] = emailOther;
        }
        
        
        var pnHome = this._extractPhone(entry, 'http://schemas.google.com/g/2005#home');
        if (pnHome != null)
        {
            contact.fields['phone-home'] = pnHome;
            contact.fields['origin-phone-home'] = pnHome;
        }
    
        var pnWork = this._extractPhone(entry, 'http://schemas.google.com/g/2005#work');
        if (pnWork != null)
        {
            contact.fields['phone-work'] = pnWork;
            contact.fields['origin-phone-work'] = pnWork;
        }
    
        var pnMobile = this._extractPhone(entry, 'http://schemas.google.com/g/2005#mobile');
        if (pnMobile != null)
        {
            contact.fields['phone-mobile'] = pnMobile;
            contact.fields['origin-phone-mobile'] = pnMobile;
        }
        
        if (entry['gd$organization'] != null)
        {
            if (entry['gd$organization'].length > 0)
            {
                var organization = entry['gd$organization'][0];
                if (organization['gd$orgTitle'] != null)
                {
                    contact.fields['org-title'] = organization['gd$orgTitle']['$t'];
                    contact.fields['origin-org-title'] = organization['gd$orgTitle']['$t'];
                }
                if (organization['gd$orgName'] != null)
                {
                    contact.fields['org-name'] = organization['gd$orgName']['$t'];
                    contact.fields['origin-org-name'] = organization['gd$orgName']['$t'];
                }
            }
        }
        
        if (entry['gContact$groupMembershipInfo'] != null)
        {
            var groups = new Array();
            for (var k = 0; k < entry['gContact$groupMembershipInfo'].length; k++)
            {
                var groupEntry = entry['gContact$groupMembershipInfo'][k];
                if (groupEntry['deleted'] == 'false')
                {
                    var group = this._findGroup(groupEntry['href']);
                    
                    if (group != null)
                        groups.push(group);
                }
            }
            
            groups.sort();
            
            contact.fields['groups'] = groups;
            contact.fields['origin-groups'] = groups;
        }

        if (entry['gd$structuredPostalAddress'] != null)
        {
            var formattedAddress = entry['gd$structuredPostalAddress'][0]['gd$formattedAddress']['$t'];
            if (formattedAddress != null && formattedAddress != '')
            {
                //formattedAddress = formattedAddress.split('\n').join(' ');
                contact.fields['postal-address'] = formattedAddress;
                contact.fields['origin-postal-address'] = formattedAddress;
            }
        }

        // 메모는 중복해서 들어가지 않는다.
        if (entry['content'] != null)
        {
            var memo = entry['content']['$t'];
            if (memo != null && memo != '')
            {
                contact.fields['note'] = memo;
                contact.fields['origin-note'] = memo;
            }
            //console.log(memo);
        }
        
        return contact;
    }
    
    // XML Document로부터 주소록 세부정보를 얻어낸다.
    this._extractContactInfoFromXmlDoc = function(xmlDoc)
    {
        var entry = xmlDoc.getElementsByTagName('entry')[0];

        if (entry == null)
        {
            return null;
        }

        return this._extractContactInfoXml(entry);
    }

    this._extractContactInfoXml = function(entry)
    {   
        var contactInfo = new Object();
        var oId = entry.getElementsByTagName('id')[0];
        var contactId = oId.childNodes[0].nodeValue;
        var pos = contactId.lastIndexOf('/');
        contactInfo['id'] = contactId.substring(pos+1);
        
        var oFullName = entry.getElementsByTagName('gd:fullName')[0];
        if (oFullName != null)
        {
            contactInfo['origin-full-name'] = oFullName.childNodes[0].nodeValue;
            contactInfo['full-name'] = contactInfo['origin-full-name'];
        }
        var oGivenName = entry.getElementsByTagName('gd:givenName')[0];
        if (oGivenName != null)
        {
            contactInfo['origin-given-name'] = oGivenName.childNodes[0].nodeValue;
            contactInfo['given-name'] = contactInfo['origin-given-name'];		
        }
        var oFamilyName = entry.getElementsByTagName('gd:familyName')[0];
        if (oFamilyName != null)
        {
            contactInfo['origin-family-name'] = oFamilyName.childNodes[0].nodeValue;
            contactInfo['family-name'] = contactInfo['origin-family-name'];
        }
        var oAdditionalName = entry.getElementsByTagName('gd:additionalName')[0];
        if (oAdditionalName != null)
        {
            contactInfo['origin-middle-name'] = oAdditionalName.childNodes[0].nodeValue;
            contactInfo['middle-name'] = contactInfo['origin-middle-name'];
        }
        
        var oEmails = entry.getElementsByTagName('gd:email');
        for (var i = 0; i < oEmails.length; i++)
        {
            var oEmail = oEmails[i];
            if (oEmail.getAttribute('rel') == 'http://schemas.google.com/g/2005#home')
            {
                if (contactInfo['email-home'] == null)
                {
                    contactInfo['email-home'] = oEmail.getAttribute('address');
                    contactInfo['origin-email-home'] = contactInfo['email-home'];
                }
            }
            else if (oEmail.getAttribute('rel') == 'http://schemas.google.com/g/2005#work')
            {
                if (contactInfo['email-work'] == null)
                {
                    contactInfo['email-work'] = oEmail.getAttribute('address');
                    contactInfo['origin-email-work'] = contactInfo['email-work'];
                }			
            }
            else if (oEmail.getAttribute('rel') == 'http://schemas.google.com/g/2005#other')
            {
                if (contactInfo['email-other'] == null)
                {
                    contactInfo['email-other'] = oEmail.getAttribute('address');
                    contactInfo['origin-email-other'] = contactInfo['email-other'];
                }
            }
        }
        
        var oPhones = entry.getElementsByTagName('gd:phoneNumber');
        for (var i = 0; i < oPhones.length; i++)
        {
            var oPhone = oPhones[i];
            if (oPhone.getAttribute('rel') == 'http://schemas.google.com/g/2005#home')
            {
                if (contactInfo['phone-home'] == null)
                {
                    contactInfo['phone-home'] = oPhone.childNodes[0].nodeValue;
                    contactInfo['origin-phone-home'] = contactInfo['phone-home'];
                }
            }
            else if (oPhone.getAttribute('rel') == 'http://schemas.google.com/g/2005#work')
            {
                if (contactInfo['phone-work'] == null)
                {
                    contactInfo['phone-work'] = oPhone.childNodes[0].nodeValue;
                    contactInfo['origin-phone-work'] = contactInfo['phone-work'];
                }			
            }
            else if (oPhone.getAttribute('rel') == 'http://schemas.google.com/g/2005#mobile')
            {
                if (contactInfo['phone-mobile'] == null)
                {
                    contactInfo['phone-mobile'] = oPhone.childNodes[0].nodeValue;
                    contactInfo['origin-phone-mobile'] = contactInfo['phone-mobile'];
                }
            }
        }
        
        var oOrgs = entry.getElementsByTagName('gd:organization');
        if (oOrgs.length > 0)
        {
            var oOrgName = oOrgs[0].getElementsByTagName('gd:orgName')[0];
            if (oOrgName != null)
            {
                contactInfo['org-name'] = oOrgName.childNodes[0].nodeValue;
                contactInfo['origin-org-name'] = contactInfo['org-name'];
            }
            var oOrgTitle = oOrgs[0].getElementsByTagName('gd:orgTitle')[0];
            if (oOrgTitle != null)
            {
                contactInfo['org-title'] = oOrgTitle.childNodes[0].nodeValue;
                contactInfo['origin-org-title'] = contactInfo['org-title'];
            }
        }
        
        var groupList = new Array();
        var groups = entry.getElementsByTagName('gContact:groupMembershipInfo');
        for (var i = 0; i < groups.length; i++)
        {
            var group = groups[i];
            var groupInfo = this._findGroup(group.getAttribute('href'));
            
            if (groupInfo != null)
                groupList.push(groupInfo);
        }
        
        groupList.sort();
        
        contactInfo['groups'] = groupList;
        contactInfo['origin-groups'] = groupList;

        var oContents = entry.getElementsByTagName('content');
        for (var i = 0; i < oContents.length; i++)
        {
            if (oContents[i].getAttribute('type') == 'text')
            {
                var note = oContents[i].childNodes[0].nodeValue;
                contactInfo['note'] = note;
                contactInfo['origin-note'] = note;
            }
        }

        var objs = entry.getElementsByTagName('gd:formattedAddress');
        if (objs.length > 0)
        {
            contactInfo['postal-address'] = objs[0].childNodes[0].nodeValue;
            contactInfo['origin-postal-address'] = contactInfo['postal-address'];
        }

        var objs = entry.getElementsByTagName('content');
        if (objs.length > 0)
        {
            contactInfo['note'] = objs[0].childNodes[0].nodeValue;
            contactInfo['origin-note'] = contactInfo['note'];
        }

        var contact = new Contact();
        contact.setFields(contactInfo, false);
        contact.eTag = entry.getAttribute('gd:etag');
        
        return contact;
    }

    // XML Entry 노드에서 이름 정보를 얻어낸다.
    this._extaractName = function(entry)
    {

    }

    // XML Entry 노드에서 전화번호 정보를 얻어낸다.
    this._extractPhone = function(entry, rel)
    {
        if (entry['gd$phoneNumber'] == null)
            return null;
        
        for (var i = 0; i < entry['gd$phoneNumber'].length; i++)
        {
            if (entry['gd$phoneNumber'][i].rel == rel)
            {
                return entry['gd$phoneNumber'][i]['$t'];
            }
        }
        
        return null;
    }

    // XML Entry 노드에서 이메일 정보를 얻어낸다.
    this._extractEmail = function(entry, rel)
    {
        if (entry['gd$email'] == null)
    		return null;
	
        for (var i = 0; i < entry['gd$email'].length; i++)
        {
            if (entry['gd$email'][i].rel == rel)
            {
                return entry['gd$email'][i].address;
            }
        }
        
        return null;

    }

    this._updateContactInternal = function(contact, callback)
    {
        var contactInfo = contact.fields;
        var contactId = contactInfo['id'];
        var xmlDoc = contact.xmlDoc;
        
        var entry = xmlDoc.getElementsByTagName('entry')[0];
        var nameObj = entry.getElementsByTagName('gd:name')[0];
        
        var nameInfos = [
            {"key": "full-name", "tag": "gd:fullName"},
            {"key": "given-name", "tag": "gd:givenName"},
            {"key": "family-name", "tag": "gd:familyName"},
            {"key": "middle-name", "tag": "gd:additionalName"}];

        for (var i = 0; i < nameInfos.length; i++)
        {
            var key = nameInfos[i]['key'];
            var tag = nameInfos[i]['tag'];
            var orgKey = 'origin-' + key;

            var name = contact.getValue(key);
            var orgName = contact.getValue(orgKey);

            if (name != orgName)
            {
                if (orgName == '')
                {
                    var obj = xmlDoc.createElement(tag);
                    obj.appendChild(xmlDoc.createTextNode(name));
                    nameObj.appendChild(obj);
                }
                else
                {
                    var obj = nameObj.getElementsByTagName(tag)[0];
                    obj.childNodes[0].nodeValue = name;	
                }
            }
        }
        
        var emailInfo = [
            {'key': 'email-home', 'rel': 'http://schemas.google.com/g/2005#home'},
            {'key': 'email-work', 'rel': 'http://schemas.google.com/g/2005#work'},
            {'key': 'email-other', 'rel': 'http://schemas.google.com/g/2005#other'}
        ];
        
        for (var j = 0; j < emailInfo.length; j++)
        {
            var key = emailInfo[j]['key'];
            var email = contactInfo[key];
            var originEmail = contactInfo['origin-' + key];
            email = (typeof email == 'undefined') ? '' : email.trimRight();
            originEmail = (typeof originEmail == 'undefined') ? '' : originEmail.trimRight(); 
                    
            if (email != originEmail)
            {
                if (originEmail == null || originEmail == '')
                {
                    if (email != null && email != '')
                    {
                        var emailObj = xmlDoc.createElement('gd:email');
                        emailObj.setAttribute('rel', emailInfo[j]['rel']);
                        emailObj.setAttribute('address', email);
                        entry.appendChild(emailObj);
                        //console.log('email added: ' + email + ', ' + emailInfo[j]['rel']);
                    }
                }
                else
                {
                    if (email == null || email == '')
                    {
                        var emailObjs = entry.getElementsByTagName('gd:email');
                        for (var k = 0; k < emailObjs.length; k++)
                        {
                            var emailObj = emailObjs[k];
                            var test1 = emailObj.getAttribute('rel');
                            var test2 = emailObj.getAttribute('address');
    
                            if (emailObj.getAttribute('rel') == emailInfo[j]['rel'] &&
                                    emailObj.getAttribute('address') == originEmail)
                            {
                                entry.removeChild(emailObj);
                                //console.log('email removed: ' + test2 + ', ' + emailInfo[j]['rel']);
                                break;
                            }
                        }					
                    }
                    else
                    {
                        var emailObjs = entry.getElementsByTagName('gd:email');
                        for (var k = 0; k < emailObjs.length; k++)
                        {
                            var emailObj = emailObjs[k];
                            var test1 = emailObj.getAttribute('rel');
                            var test2 = emailObj.getAttribute('address');
                            
                            if (emailObj.getAttribute('rel') == emailInfo[j]['rel'] &&
                                    emailObj.getAttribute('address') == originEmail)
                            {
                                emailObj.setAttribute('address', email);
                                break;
                            }
                        }
                    }
                }
            }
        }
    
        var pnInfo = [
            {'key': 'phone-home', 'rel': 'http://schemas.google.com/g/2005#home'},
            {'key': 'phone-work', 'rel': 'http://schemas.google.com/g/2005#work'},
            {'key': 'phone-mobile', 'rel': 'http://schemas.google.com/g/2005#mobile'}
        ];
        
        for (var j = 0; j < pnInfo.length; j++)
        {
            var key = pnInfo[j]['key'];
            var pn = (typeof contactInfo[key] == 'undefined') ? '' : contactInfo[key].trimRight();
            var originPn = contactInfo['origin-' + key];
            originPn = (typeof originPn == 'undefined') ? '' : originPn.trimRight();
            
            if (pn != originPn)
            {
                if (originPn == null || originPn == '')
                {
                    if (pn != '')
                    {
                        var pnObj = xmlDoc.createElement('gd:phoneNumber');
                        pnObj.setAttribute('rel', pnInfo[j]['rel']);
                        pnObj.appendChild(xmlDoc.createTextNode(pn));
                        entry.appendChild(pnObj);
                    }
                }
                else
                {
                    if (pn == null || pn == '')
                    {
                        var pnObjs = entry.getElementsByTagName('gd:phoneNumber');
                        for (var k = 0; k < pnObjs.length; k++)
                        {
                            var pnObj = pnObjs[k];
                            if (pnObj.getAttribute('rel') == pnInfo[j]['rel'] &&
                                    pnObj.childNodes[0].nodeValue == originPn)
                            {
                                entry.removeChild(pnObj);
                                break;
                            }
                        }					
                    }
                    else
                    {
                        var pnObjs = entry.getElementsByTagName('gd:phoneNumber');
                        for (var k = 0; k < pnObjs.length; k++)
                        {
                            var pnObj = pnObjs[k];							
                            if (pnObj.getAttribute('rel') == pnInfo[j]['rel'] &&
                                    pnObj.childNodes[0].nodeValue == originPn)
                            {
                                pnObj.childNodes[0].nodeValue = pn;
                                break;
                            }
                        }
                    }
                }
            }
        }
        
        var orgName = (typeof contactInfo['org-name'] == 'undefined' || contactInfo['org-name'] == null) ? null : contactInfo['org-name'].trimRight();
        var originOrgName = (typeof contactInfo['origin-org-name'] == 'undefined' || contactInfo['origin-org-name'] == null) ? null : contactInfo['origin-org-name'].trimRight();
        var orgTitle = (typeof contactInfo['org-title'] == 'undefined' || contactInfo['org-title'] == null) ? null : contactInfo['org-title'].trimRight();
        var originOrgTitle = (typeof contactInfo['origin-org-title'] == 'undefined' || contactInfo['origin-org-title'] == null) ? null : contactInfo['origin-org-title'].trimRight();
        
        if (orgName != originOrgName || orgTitle != originOrgTitle)
        {
            var found = false;
            var orgs = entry.getElementsByTagName('gd:organization');
            
            for (var k = 0; k < orgs.length; k++)
            {
                var org = orgs[k];
                var match = true;
                
                if (originOrgName != null && originOrgName != '')
                {
                    var orgNameObj = org.getElementsByTagName('gd:orgName')[0];
                    if (orgNameObj.childNodes[0].nodeValue != originOrgName)
                        match = false;
                }
                
                if (originOrgTitle != null && originOrgTitle != '')
                {
                    var orgTitleObj = org.getElementsByTagName('gd:orgTitle')[0];
                    if (orgTitleObj.childNodes[0].nodeValue != originOrgTitle)
                        match = false;
                }
                
                if (match == true)
                {
                    if (org.getElementsByTagName('gd:orgName').length == 0)
                    {
                        if (orgName != null && orgName != '')
                        {
                            var orgNameObj = xmlDoc.createElement('gd:orgName');
                            orgNameObj.appendChild(xmlDoc.createTextNode(orgName));
                            org.appendChild(orgNameObj);
                        }
                    }
                    else
                    {
                        var orgNameObj = org.getElementsByTagName('gd:orgName')[0];
                        orgNameObj.childNodes[0].nodeValue = orgName;
                    }
                    
                    if (org.getElementsByTagName('gd:orgTitle').length == 0)
                    {
                        if (orgTitle != null && orgTitle != '')
                        {
                            var orgTitleObj = xmlDoc.createElement('gd:orgTitle');
                            orgTitleObj.appendChild(xmlDoc.createTextNode(orgTitle));
                            org.appendChild(orgTitleObj);
                        }
                    }
                    else
                    {
                        var orgTitleObj = org.getElementsByTagName('gd:orgTitle')[0];
                        orgTitleObj.childNodes[0].nodeValue = orgTitle;
                    }
                    
                    found = true;
                    break;
                }
            }
            
            if (found == false)
            {
                var org = document.createElement('gd:organization');
                org.setAttribute('rel', 'http://schemas.google.com/g/2005#other');
                
                if (orgName != null && orgName != '')
                {
                    var orgNameObj = xmlDoc.createElement('gd:orgName');
                    orgNameObj.appendChild(document.createTextNode(orgName));
                    org.appendChild(orgNameObj);
                }
                if (orgTitle != null && orgTitle != '')
                {
                    var orgTitleObj = xmlDoc.createElement('gd:orgTitle');
                    orgTitleObj.appendChild(document.createTextNode(orgTitle));
                    org.appendChild(orgTitleObj);
                }
    
                entry.appendChild(org);
            }
        }
        
        var groupObjects = entry.getElementsByTagName('gContact:groupMembershipInfo');
        for (var j = groupObjects.length-1; j >= 0; j--)
        {
            var found = false;
            var groupObject = groupObjects[j];
            
            for (var i = 0; i < contactInfo['groups'].length; i++)
            {
                var group = contactInfo['groups'][i];
                if (groupObject.getAttribute('href') == group['id'])
                {
                    found = true;
                    break;
                }
            }
            
            if (found == false)
                entry.removeChild(groupObject);
        }
        
        if (contactInfo['groups'] != null)
        {
            for (var j = 0; j < contactInfo['groups'].length; j++)
            {
                var found = false;
                var group = contactInfo['groups'][j];
                var groupObjects = entry.getElementsByTagName('gContact:groupMembershipInfo');
                for (var i = 0; i < groupObjects.length; i++)
                {
                    var groupObject = groupObjects[i];
                    if (group['id'] == groupObject.getAttribute('href'))
                    {
                        found = true;
                        break;
                    }
                }
                
                if (found == false)
                {
                    var groupObject = xmlDoc.createElement('gContact:groupMembershipInfo');
                    groupObject.setAttribute('deleted', 'false');
                    groupObject.setAttribute('href', group['id']);
                    entry.appendChild(groupObject);
                }
            }
        }
        
        var xmlText = new XMLSerializer().serializeToString(entry)
        //console.log(xmlText);
        
        let init = {
            method: 'PUT',
            async: false,
            headers: {
                Authorization: 'Bearer ' + authToken,
                'If-Match': '*',
                'Content-Type': 'application/atom+xml',
                'GData-Version': '3.0'
            },
            body: xmlText
        };

        var thisContactIO = this;
        
        fetch('https://www.google.com/m8/feeds/contacts/default/full/' + contactId, init)
            .then(response => {
                
                var decoder = new TextDecoder();
                var reader = response.body.getReader();
                var xml = '';				
                
                return reader.read().then(function processResult(result) {
                    if (result.done) {
                        //console.log("Fetch complete");
                        return xml;
                    }
                    
                    xml += decoder.decode(result.value, {stream: true});
                    
                    return reader.read().then(processResult);
                })
            })
            .then(function(xml) {
                
                //console.log(xml);
                var parser = new DOMParser();
                var xmlDoc = parser.parseFromString(xml, "text/xml");
                var newContact = thisContactIO._extractContactInfoFromXmlDoc(xmlDoc);
                if (newContact != null)
                {
                    console.log('contact update success: ' + newContact.id);
                    callback(newContact, true);
                }
                else
                {
                    console.log('fail to update contact: ' + xml);
                    callback(newContact, false);
                }
            })
            .catch(function(e) {
                //mySheet.onFailUpdate(contactId);
                callback(contact, false, e);
                console.log('contact update failed');
                console.log(e);
            });
    }

    this._findGroup = function(groupId)
    {
        for (var i = 0; i < this.contactGroupList.length; i++)
        {
            if (this.contactGroupList[i]['id'] == groupId)
            {
                var group = new Object();
                group['id'] = groupId;
                group['label'] = this.contactGroupList[i]['label'];
                return group;
            }
        }
        
        return null;    
    }
}