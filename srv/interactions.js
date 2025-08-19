const cds = require('@sap/cds');
const { getDestination } = require('@sap-cloud-sdk/connectivity');
const { executeHttpRequest } = require('@sap-cloud-sdk/http-client'); 

module.exports = cds.service.impl(async function () {

    
    this.on('getWorkzoneID', async (req) => {
        
        try{

            
            // Basic destination retrieval 
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

    this.on('getPiwikjs', async (req) => {
        
        try {
            const destination = await getDestination({ destinationName: 'Piwik' });
            const response = await executeHttpRequest(destination, {
                method: 'GET',
                url: '' 
            });

            return response.data; 

        } catch (error) {
            console.error(error);
            return "Error fetching piwik.js: " + error.message;
        }
        
    });






});