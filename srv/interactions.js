const cds = require('@sap/cds');
const { getDestination } = require('@sap-cloud-sdk/connectivity');
const { executeHttpRequest } = require('@sap-cloud-sdk/http-client');
const https = require('https');

module.exports = cds.service.impl(async function () {

    
    this.on('getWorkzoneID', async (req) => {
        
        try{

            const destination = await getDestination({ destinationName: 'Piwik' });
    
            if (!destination) {
                console.log('Destination not found!');
                return;
            }
            console.log('URL:', destination.url); 
            console.log('Authentication:', destination.authentication); 
            console.log('Custom Headers:', destination.headers);            

           
            const siteId = destination.originalProperties?.PiwikSiteID || 'No PiwikSiteID';

            return siteId;
            
        } catch(error){
            return "error fetching Workzone ID"  + error; 
        }
        
    });

    this.on('getEmployee', async (req) => {

        try {
            const userEmail = await getUserEmail(req);
            
            const destination = await getDestination({ destinationName: 'piwik-hrconnect' });

            if (!destination) {
                console.log('Destination piwik-hrconnect not found!');
                return;
            }

            const token = destination.authTokens?.[0]?.value;

            const data = await new Promise((resolve, reject) => {
                const options = {
                    hostname: 'b-int-dev.test01.apimanagement.eu20.hana.ondemand.com',
                    port: 443,
                    path: '/v1/private/hrconnect/employees/00002164',
                    method: 'GET',
                    headers: {
                        'Authorization': `Bearer ${token}`,
                        'x-api-key': process.env.HR_API_KEY
                    }
                };
                const req = https.request(options, (res) => {
                    let body = '';
                    res.on('data', chunk => body += chunk);
                    res.on('end', () => resolve(body));
                });
                req.on('error', reject);
                req.end();
            });

            return data;

        } catch (error) {
            console.error(error);
            return "Error fetching employee: " + error.message;
        }

    });


    function getUserEmail(req) {
        try {
            const authHeader = req._.req?.headers?.authorization;
            if (authHeader) {
                const token = authHeader.replace('Bearer ', '');
                const payload = JSON.parse(Buffer.from(token.split('.')[1], 'base64').toString());
                return payload.email || payload.user_name || req.user.id;
            }
        } catch(e) {
            console.error('getUserEmail error:', e);
        }
        return req.user.id;
    }
    // this.on('getUserEmail', async (req) => {
    //     try {
    //         const authHeader = req._.req?.headers?.authorization;
    //         if (authHeader) {
    //             const token = authHeader.replace('Bearer ', '');
    //             const payload = JSON.parse(Buffer.from(token.split('.')[1], 'base64').toString());
    //             return payload.email || payload.user_name || req.user.id;
    //         }
    //     } catch(e) {
    //         console.error('getUserEmail error:', e);
    //     }
    //     return req.user.id;
    // });

    // this.on('getPiwikjs', async (req) => {
        
    //     try {
    //         const destination = await getDestination({ destinationName: 'Piwik' });
    //         const response = await executeHttpRequest(destination, {
    //             method: 'GET',
    //             url: '' 
    //         });

    //         return response.data; 

    //     } catch (error) {
    //         console.error(error);
    //         return "Error fetching piwik.js: " + error.message;
    //     }
        
    // });






});