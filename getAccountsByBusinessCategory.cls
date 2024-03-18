// This class is used to fetch Account records based on certain filters
public without sharing class getAccountsByBusinessCategory {

    // Get the ID of the 'Business_Registration' record type
    // This is used to filter the accounts by record type in the SOQL queries and in the LWC to select correct picklist values
    
    public static String getBusinessRegistrationRecordTypeId() { 
        return Schema.SObjectType.Account.getRecordTypeInfosByName().get('Business Registration').getRecordTypeId(); 
    }

    // This method is exposed to Aura components and is not cacheable
    // It takes a filter category and a search key as parameters
    @AuraEnabled(cacheable=false)
    public static List<Account> filterAccounts (List<String> filterCategories, List<String> filterCounties, String searchkey) {
        
        System.debug('Entering filterAccounts method');
        System.debug('filterCategories: ' + filterCategories);
        System.debug('filterCounties: ' + filterCounties);
        System.debug('searchkey: ' + searchkey);
        
        // Initialize an empty list to store the results
        List<Account> results = new List<Account>();

        // Prepare the search key for the SOQL LIKE clause
        String key = '%' + searchkey + '%';
        
        String businessRegistrationRecordTypeId = getBusinessRegistrationRecordTypeId();
            
        // If no filter category is provided and no search key is provided, fetch all accounts of 'Business_Registration' record type
        String accountQuery = 'SELECT Id, Name, Business_Category__c, Business_Description__c, County__c, BillingCity, Website FROM Account WHERE RecordTypeId = :businessRegistrationRecordTypeId';

        // If filter categories are provided, add ' AND Business_Category__c IN :filterCategories' to the query
        if (filterCategories != null && filterCategories.size() > 0) {
            accountQuery += ' AND Business_Category__c IN :filterCategories';
        }    
        // If filter counties are provided, add ' AND County__c IN :filterCounties' to the query
        if (filterCounties != null && filterCounties.size() > 0) {
            accountQuery += ' AND County__c IN :filterCounties';
        }
        // If a search key is provided, add ' AND Name LIKE :key' to query
        if (searchkey != null && searchkey != '') {
            accountQuery += ' AND (Name LIKE :key OR Business_Description__c LIKE :key)';
        }
        // Sort results in ascending order regardless of what the final query looks like
        accountQuery += ' ORDER BY Name ASC';

        // Debug log the SOQL query
        System.debug(accountQuery);

        try {
            // Execute the SOQL query and store the results
            results = Database.query(accountQuery);
        } catch (QueryException e) {
            System.debug('An error occurred while executing the query: ' + e.getMessage());
        }
        
        // Return the results
        return results;
    }
}
