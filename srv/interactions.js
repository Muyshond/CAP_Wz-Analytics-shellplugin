const cds = require('@sap/cds');
const { getDestination } = require('@sap-cloud-sdk/connectivity');
const { executeHttpRequest } = require('@sap-cloud-sdk/http-client'); 

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
            console.log('HR_API_KEY:', process.env.HR_API_KEY ? 'SET' : 'NOT SET');
            const destination = await getDestination({ destinationName: 'piwik-hrconnect' });

            if (!destination) {
                console.log('Destination piwik-hrconnect not found!');
                return;
            }

            const token = destination.authTokens?.[0]?.value;
            console.log('Token:', token ? 'SET' : 'NOT SET');
            console.log('authTokens:', JSON.stringify(destination.authTokens));

            const response = await executeHttpRequest(destination, {
                method: 'GET',
                url: '/employees/00002164',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'x-api-key': process.env.HR_API_KEY
                }
            });

            console.log('response.data type:', typeof response.data);
            console.log('response.status:', response.status);
            return JSON.stringify(response.data);

        } catch (error) {
            console.error(error);
            return "Error fetching employee: " + error.message;
        }

    });

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