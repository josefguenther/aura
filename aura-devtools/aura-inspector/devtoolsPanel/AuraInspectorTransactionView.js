function AuraInspectorTransactionView(devtoolsPanel) {
	var outputList;
	var clearButton;
	var queuedData = [];
	var transactions = {};

	var labels = {
		"clear" : chrome.i18n.getMessage("menu_clear"),
		"id" : chrome.i18n.getMessage("transactions_id"),
		"starttime" : chrome.i18n.getMessage("transactions_starttime"),
		"starttime_info" : chrome.i18n.getMessage("transactions_starttime_info"),
		"duration" : chrome.i18n.getMessage("transactions_duration"),
		"duration_info" : chrome.i18n.getMessage("transactions_duration_info"),
		"context" : chrome.i18n.getMessage("transactions_context"),
		"actions" : chrome.i18n.getMessage("transactions_actions"),
		"XHRs" : chrome.i18n.getMessage("transactions_xhrs")
	};

	var markup = `
		<div class="aura-panel panel-status-bar">
			<button class="clear-status-bar-item status-bar-item" title="${labels.clear}">
				<div class="glyph"></div><div class="glyph shadow"></div>
			</button>
		</div>
		<div class="transactions" id="trs">
			<table>
				<thead>
					<th>${labels.id}</th>
					<th>${labels.starttime}<br /><span class="th-description">${labels.starttime_info}</span></th>
					<th>${labels.duration}<br /><span class="th-description">${labels.duration_info}</span></th>
					<th>${labels.context}</th>
					<th>${labels.actions}</th>
					<th>${labels.XHRs}</th>
				</thead>
				<tbody>
				</tbody>
			</table>
		</div>
	`;


	function OutputListTable_OnClick(event) {
		var id = event.target.dataset.id;
		if(id!==undefined) {
			var command = "console.log(" + JSON.stringify(transactions[id]) + ")";
	        chrome.devtools.inspectedWindow.eval(command, function (payload, exception) {
	            if (exception) {
	            	console.log('ERROR, CMD:', command, exception);
	            }
	        });
	    }
	}

	function ClearTable_OnClick(event) {
		if(outputList) {
			var tbody = outputList.querySelector('tbody');

			while (tbody.firstChild) {
	    		tbody.removeChild(tbody.firstChild);
			}
		}
	}


	this.addTableRow = function (t) {
		var container = outputList;
		var tbody = container.querySelector('tbody');
		var tr = document.createElement('tr');
		var tid = t.id + ':' + Math.floor(t.ts);

		transactions[tid] = t;

		tr.innerHTML = [
			'<td class="id"><a href="javascript:void(0)" data-id="'+ tid +'">' + t.id + '</a></td>',
			'<td class="ts">' + this.contextualizeTime(t) +'</td>',
			'<td class="dur">' + Math.floor(t.duration * 1000) / 1000 +'</td>',
			'<td class="ctx"><aurainspector-json>' + JSON.stringify(t.context, null, '\t') + '</aurainspector-json></td>',
			'<td class="actions">' + this.summarizeActions(t) + '</td>',
			'<td class="xhr">' + this.summarizeXHR(t) + '</td>',
		].join('');

		tbody.appendChild(tr);
	}

	this.init = function(tabBody) {
		tabBody.innerHTML = markup;
		tabBody.classList.add("trans-panel");

		devtoolsPanel.subscribe("Transactions:OnTransactionEnd", function(transactions){
			this.addTransactions(JSON.parse(transactions));
		}.bind(this));
	};

	this.summarizeActions = function (t) {
		var serverActions = t.marks.serverActions || [];
		// Should be this, but it has issues too such as m.context.ids being null.
		//var serverActions = t.marks.serverActions || t.marks.queuedActions || t.marks.actions || [];
		return (serverActions.filter(function (m) {
			return m.phase === 'stamp';
		})).reduce(function (r, m) {
			return m.context.ids.length + r;
		}, 0);
	};
	this.summarizeXHR = function (t) {
		var transportMarks = t.marks.transport || [];
		var counter = 0;
        var queue = {};
        for (var i = 0; i < transportMarks.length; i++) {
            var id = transportMarks[i].context["auraXHRId"];
            var phase = transportMarks[i].phase;
            if (phase === 'processed') {
                ++counter;
            } else if (phase === 'start') {
                queue[id] = transportMarks[i];
            } else if (phase === 'end' && queue[id]){
                ++counter;
                delete queue[id];
            }
        }
        return counter;
	};

	this.contextualizeTime = function (t) {
		return Math.floor(t.ts / 10) / 100;
	};

	this.render = function() {
		// Already rendered
		if (outputList) {
			return;
		}

		outputList = document.getElementById('trs');
		clearButton = document.querySelector('#tab-body-transaction .clear-status-bar-item');

        outputList.addEventListener('click', OutputListTable_OnClick.bind(this), false);
        clearButton.addEventListener('click', ClearTable_OnClick.bind(this), false);
		devtoolsPanel.hideSidebar();

		while (queuedData.length) {
			this.addTransactions(queuedData.pop());
		}
	};

	this.addTransactions = function (rowData) {
		if (!outputList) {
			queuedData.push(rowData);
			return;
		}

		this.addTableRow(rowData);
	};
}
