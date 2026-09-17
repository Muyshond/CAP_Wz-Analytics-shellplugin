const cds = require('@sap/cds');
const { getDestination } = require('@sap-cloud-sdk/connectivity');
const { executeHttpRequest } = require('@sap-cloud-sdk/http-client');
const crypto = require('crypto');

const employeeCache = new Map();

async function fetchEmployeeByEmail(userEmail) {
    const destination = await getDestination({ destinationName: 'piwik-hrconnect' });
    if (!destination) {
        throw new Error('piwik-hrconnect destination not found');
    }

    const filter = `contact_details_work_email eq '${userEmail}'`;
    const path = `/api/v1/internal/hrconnect/employees?limit=1&filter=${encodeURIComponent(filter)}`;

    const response = await executeHttpRequest(destination, {
        method: 'GET',
        url: path,
        headers: {
            'x-sncb-id': crypto.randomUUID()
        }
    });

    return response.data?.items?.[0] || null;
}

function getUserEmail(req) {
    try {
        const authHeader = req._.req?.headers?.authorization;
        if (authHeader) {
            const token = authHeader.replace('Bearer ', '');
            const payload = JSON.parse(Buffer.from(token.split('.')[1], 'base64').toString());
            return payload.email || payload.user_name || req.user.id;
        }
    } catch (e) {
        console.error('getUserEmail error:', e);
    }
    return req.user.id;
}

module.exports = cds.service.impl(async function () {

    this.on('getWorkzoneID', async (req) => {

        try {
            const destination = await getDestination({ destinationName: 'Piwik' });

            if (!destination) {
                console.log('Destination not found!');
                return req.error(404, 'Piwik destination not found');
            }

            const siteId = destination.originalProperties?.PiwikSiteID || 'No PiwikSiteID';

            return siteId;

        } catch (error) {
            return req.error(500, "Error fetching Workzone ID: " + error.message);
        }

    });

    this.on('getEmployee', async (req) => {

        try {
            var userEmail = getUserEmail(req).toLowerCase();
            //Emails have @testbelgiantrain.be behind so replace it
            userEmail = userEmail.split('@')[0] + "@test.belgiantrain.be"
            
            let employee = employeeCache.get(userEmail);

            if (!employee) {
                employee = await fetchEmployeeByEmail(userEmail);

                if (!employee) {
                    return req.error(404, `No employee found for work email ${userEmail}`);
                }

                employeeCache.set(userEmail, employee);
            }

            return JSON.stringify(employee);

        } catch (error) {
            console.error(error);
            return req.error(error.response?.status || 500, "Error fetching employee: " + error.message);
        }

    });

});
