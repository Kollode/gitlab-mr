console.log('==> Loaded Gitlab Extension');

if (document.head.querySelector('meta[content="GitLab"]') !== null) {
    start();
} else {
    console.log('==> Not a gitlab page');
}

async function start(event) {

    var listOfMergeRequests = Array.from(document.querySelectorAll('.mr-list li.merge-request'));

    if (listOfMergeRequests.length == 0) {
        console.log('==> Has no merge request elements on the page');
        return;
    }

    var currentMrState = getCurrentState();
    var currentPage = getCurrentPageNumber();
    var currentProjectId = getCurrentProjectId();
    var response = await fetch(`/api/v4/projects/${currentProjectId}/merge_requests/?state=${currentMrState}&page=${currentPage}`, { credentials: "same-origin" });
    var mergeRequestJson = await response.json();

    console.log('==> JSON for page', currentProjectId, currentPage, currentMrState, mergeRequestJson);

    listOfMergeRequests.forEach(async (mrElement, index) => {
        var mrData = mergeRequestJson[index];
        var approvalsResponse = await fetch(`/api/v4/projects/${currentProjectId}/merge_requests/${mrData.iid}/approvals/`, { credentials: "same-origin" });

        if (!approvalsResponse.ok) {
            console.log('==> MR is not using approvals');
            return;
        }

        var approvalData = await approvalsResponse.json();

        var tempDiv = document.createElement('div');
        tempDiv.classList.add('pull-right');
        tempDiv.textContent = 'Approvals: ' + Math.abs(approvalData.approvals_required - approvalData.approvals_left) + '/' + approvalData.approvals_required;

        var entryPoint = mrElement.querySelector('div.issuable-updated-at');
        entryPoint.insertAdjacentElement('afterend', tempDiv);
    });
};

function getCurrentProjectId() {
    var hiddenProjectIdField = document.querySelector('#search_project_id');

    if (hiddenProjectIdField) {
        return hiddenProjectIdField.value;
    }

    throw new Error('Could not find project id');
}

function getCurrentPageNumber() {
    var activePageElement = document.querySelector('.mr-list + .gl-pagination li.active.page a');

    if (activePageElement) {
        return activePageElement.text;
    }

    return 1;
}

function getCurrentState() {
    var activeStateElement = document.querySelector('ul.issues-state-filters li.active a');

    if (activeStateElement) {
        return activeStateElement.dataset.state;
    }

    return 'opened';
}



