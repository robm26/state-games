/**
 * Created by mccaul on 3/30/18.
 */
// Connect to DynamoDB and retieve table rows

const DYNAMODB_TABLE = 'askStateGames';


function setTableTitle() {
    document.getElementById['DynamoDBtablename'].innerHTML = DYNAMODB_TABLE;

}

function testy() {
    console.log('testy here');
}
function cleartable() {
    document.getElementById('maintable').innerHTML = '';
    setStatus('ready');

}
function setStatus(status) {
    document.getElementById('status').innerText = status;
}

function loadtable() {

    document.getElementById('DynamoDBtablename').innerHTML = DYNAMODB_TABLE;

    cleartable();

    // let userrow = usertable.insertRow(-1);
    //
    // let rows = {};

        const params = {
            TableName: DYNAMODB_TABLE
            // FilterExpression : 'Year = :this_year',
            // ExpressionAttributeValues : {':this_year' : 2015}
        };

        docClient.scan(params, function (err, data) {
            if (err) console.log(err);
            else {
                setStatus(data.Items.length + ' records found');
                if (data.Items.length > 0) {
                    let rowcounter = 1;

                    let tbl = document.getElementById('maintable');
                    let header = tbl.createTHead();
                    let hrow = header.insertRow(0);
                    hrow.className = 'maintableheader';
                    let hcell1 = hrow.insertCell(0);
                    hcell1.innerHTML = 'lastUse';
                    let hcell2 = hrow.insertCell(1);
                    hcell2.innerHTML = 'userId tail';
                    let hcell3 = hrow.insertCell(2);
                    hcell3.innerHTML = 'Persistent Attributes';


                    for(row in data.Items) {

                        addTableRow(data.Items[row], rowcounter++, 'maintable');
                    }

                }

            }
        });

    setTimeout(function () {  // give AWS docClient a moment to connect
        toggleUserTable(1);
    }, 500);

}
function toggleUserTable(rowId) {
    if (document.getElementById('attrtable' + rowId)) {

        let tabletoggle = document.getElementById('attrtable' + rowId);
        let anc = document.getElementById('link' + rowId);

        if (tabletoggle.className == "attrTableVisible") {
            tabletoggle.className = "attrTableHidden";
            anc.innerHTML = anc.innerHTML.replace('-', '+');
        } else {
            tabletoggle.className = "attrTableVisible";
            anc.innerHTML = anc.innerHTML.replace('+', '-');
        }
    }
}

function addTableRow(newrow, rowId, tabletarget) {
    // rowcells = Object.keys(newrow).map(i => newrow[i]);

    let usertable = document.getElementById(tabletarget);
    let userrow = usertable.insertRow(-1);

    const userIdshort = newrow.id.substring(219, 225);
    //const userIdClick = "<a href='#' onClick='alert(" + userIdshort + ");'>" + userIdshort + "</a>";
    const lastUseDatetime = new Date(newrow.attributes.lastUseTimestamp);
    const lastUseDatetimeDisplay = lastUseDatetime.toString().substring(0, 25);

    // var rightnow = new Date();
    // var tzo = rightnow.getTimezoneOffset();
    // var utcDate1 = new Date(rightnow.getTime() + (tzo * 60 * 1000));

    // console.log('rightnow ' + rightnow);
    // console.log('tzo ' + tzo);
    // console.log('utcDate1 ' + utcDate1);


    let cell1 = userrow.insertCell();
    cell1.className = "dateTableRow";
    cell1.innerHTML = lastUseDatetimeDisplay;

    let cell2 = userrow.insertCell();
    cell2.className = "userIdTableRow";

    let a = document.createElement('a');
    a.setAttribute("id", "link" + rowId);

    let linkText = document.createTextNode(userIdshort + ' [+]');

    a.className = 'userIdLink';

    a.appendChild(linkText);

    a.title = "user persistent attributes toggle";
    a.href = "#";
    a.onclick = function() {
        toggleUserTable(rowId);
    };

    cell2.appendChild(a);

    // cell2.innerHTML = userIdshort + ' ' + rowId;

    let cell3 = userrow.insertCell();

    let attrtable = document.createElement('table');
    attrtable.setAttribute("id", "attrtable" + rowId);
    attrtable.className = 'attrTableHidden';

    cell3.setAttribute("id", "attrcell" + rowId);

    cell3.appendChild(attrTableBuild(newrow.attributes, attrtable));


}
function attrTableBuild(attrs, table) {


    Object.keys(attrs).forEach(function(key) {
        let val = attrs[key]
        let classNameKey = "tablecellblank1";
        let classNameVal = "tablecellblank2";

        if (
            (val && val.length > 0)
            || (typeof val === 'object' && val !== null && JSON.stringify(val) !== '{}' && !Array.isArray(val))
            || (typeof val === 'number' && val > 0)
            || (typeof val === 'boolean' && val)
            || (Array.isArray(val) && val.length > 0)
        )
        {

            classNameKey = "tablecell1";  // show name column highlighted

            if (typeof val == "number") {
                classNameVal = "tablecellNum";
            } else if (typeof val === 'object' && val !== null && !Array.isArray(val)) {

                classNameVal = "tablecellObj";

            } else if (Array.isArray(val) && val.length > 0) {
                classNameVal = "tablecellArray";

            } else {
                classNameVal = "tablecell2";
            }

        }

        let row = table.insertRow();

        let cellKey = row.insertCell();
        cellKey.className = classNameKey;
        cellKey.innerHTML = key;

        let cellValue = row.insertCell();
        cellValue.className = classNameVal;

        if (Array.isArray(val) && val.length > 0 && key == 'history') {
            cellValue.appendChild(renderHistoryTable(val));  // build history table
            // cellValue.innerHTML =  renderAttrVal(val);

        } else {
            cellValue.innerHTML =  renderAttrVal(val);

        }

    });

    return table;
}

function renderAttrVal(val) {
    let newval = '';

    if (typeof val === 'object' && val !== null && !Array.isArray(val)) {
        newval = JSON.stringify(val);

    } else if (Array.isArray(val) ) {

        for (let i = 0; i < val.length; i++) {

            newval += val[i] + '<br/>';
            // renderIntentSlotLine()

        }
        newval = '[' + newval + ' ]';

    } else if (Number.isInteger(val) && val >  1500000000000  && val <  2500000000000) {  // assume a unix timestamp
        let newDate = new Date();
        newDate.setTime(val);
        dateString = newDate.toUTCString();

        newval = val + '<br/>' + dateString;

    } else {
        newval = val;
    }

    return  newval;

}
function renderHistoryTable(val) {
    let table = document.createElement("TABLE");

    for (let i = 0; i < val.length; i++) {
        let row = table.insertRow();
        let cellKey = row.insertCell();

        cellKey.innerHTML = renderIntentSlotLine(val[i]);
        if (
            val[i]['IntentRequest']
            && (
                val[i]['IntentRequest'] == 'AMAZON.StopIntent' || val[i]['IntentRequest'] == 'AMAZON.CancelIntent' || val[i]['IntentRequest'] == 'SessionEndedRequest'
            )
        )
        {

            cellKey.className = 'historyTableStop';
        }
        // renderIntentSlotLine(val[i]) + '<br/>';
    }
    return table;

}
function renderIntentSlotLine(obj) {
    let returnstring = '';

    if (obj['IntentRequest']) {
        returnstring = obj['IntentRequest'];
        if(obj['slots']) {
            for (let slot in obj['slots']) {
                returnstring += ' ' + slot + ': <b>' + obj['slots'][slot] + '</b>';
            }

        }
        return returnstring;
    } else {
        return JSON.stringify(obj);
    }

}
function shadeColor(color, percent) {
    var f=parseInt(color.slice(1),16),t=percent<0?0:255,p=percent<0?percent*-1:percent,R=f>>16,G=f>>8&0x00FF,B=f&0x0000FF;
    return "#"+(0x1000000+(Math.round((t-R)*p)+R)*0x10000+(Math.round((t-G)*p)+G)*0x100+(Math.round((t-B)*p)+B)).toString(16).slice(1);
}
