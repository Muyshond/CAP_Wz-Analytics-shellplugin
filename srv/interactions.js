const cds = require('@sap/cds');
const { getDestination } = require('@sap-cloud-sdk/connectivity');
const { executeHttpRequest } = require('@sap-cloud-sdk/http-client');
const crypto = require('crypto');

const EMPLOYEE_FIELDS = 'contact_details_work_email,directorate_id,directorate_description,supra_division_id,supra_division_description';
const CACHE_REFRESH_MS = 2 * 24 * 60 * 60 * 1000; // 2 days
const PAGE_SIZE = 1000;

let employeeCache = new Map();
let cacheLoadingPromise = null;

async function loadEmployeeCache() {
    const destination = await getDestination({ destinationName: 'piwik-hrconnect' });
    if (!destination) {
        throw new Error('piwik-hrconnect destination not found');
    }

    const newCache = new Map();
    let offset = 0;
    let total = null;

    while (total === null || offset < total) {
        const path = `/api/v1/internal/hrconnect/employees?limit=${PAGE_SIZE}&offset=${offset}&fields=${encodeURIComponent(EMPLOYEE_FIELDS)}`;

        const response = await executeHttpRequest(destination, {
            method: 'GET',
            url: path,
            headers: {
                'x-sncb-id': crypto.randomUUID()
            }
        });

        const items = response.data?.items || [];
        for (const employee of items) {
            if (employee.contact_details_work_email) {
                newCache.set(employee.contact_details_work_email.toLowerCase(), employee);
            }
        }

        if (total === null) {
            total = response.data?.meta?.totalRecords ?? items.length;
        }
        offset += items.length;

        if (items.length === 0) break;
    }

    employeeCache = newCache;
    console.log(`Employee cache refreshed: ${employeeCache.size} employees loaded`);
}

function ensureEmployeeCache() {
    if (!cacheLoadingPromise) {
        cacheLoadingPromise = loadEmployeeCache().catch(error => {
            cacheLoadingPromise = null;
            throw error;
        });
    }
    return cacheLoadingPromise;
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

    ensureEmployeeCache().catch(error => console.error('Initial employee cache load failed:', error));
    setInterval(() => {
        loadEmployeeCache().catch(error => console.error('Employee cache refresh failed:', error));
    }, CACHE_REFRESH_MS);

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
            const userEmail = getUserEmail(req);

            await ensureEmployeeCache();

            const employee = employeeCache.get(userEmail.toLowerCase());

            if (!employee) {
                return req.error(404, `No employee found for work email ${userEmail}`);
            }

            return JSON.stringify(employee);

        } catch (error) {
            console.error(error);
            return req.error(error.response?.status || 500, "Error fetching employee: " + error.message);
        }

    });

});
