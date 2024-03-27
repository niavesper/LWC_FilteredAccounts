// Date:    03/26/24
// Author:  niavesper
// Description: This class supports the LWC filterAccountByBusinessCategory. It fetches accounts based on the filters provided
// by the user in the LWC UI. The filters include business categories, counties, and a search key.
// History: V.1

public with sharing class GetAccountsByBusinessCategory {

    private static final String BUSINESS_REGISTRATION = 'Business Registration';

    // Get the ID of the 'Business_Registration' record type.
    // This ID is used to filter accounts by record type in the SOQL queries.
    public static String getBusinessRegistrationRecordTypeId() { 
        return Schema.SObjectType.Account.getRecordTypeInfosByName().get(BUSINESS_REGISTRATION).getRecordTypeId(); 
    }

    // Fetch accounts based on the filters provided (these filters get added to the basic query).
    @AuraEnabled(cacheable=false)
    public static List<Account> filterAccounts (List<String> filterBusinessCategories, List<String> filterCounties, String searchkey) {
        String businessRegistrationRecordTypeId = getBusinessRegistrationRecordTypeId();
        
        // If the 'Business Registration' record type ID is found, build the query
        if (businessRegistrationRecordTypeId != null) {
        String key = '%' + searchkey + '%';
        String accountQuery = buildAccountQuery();

        // If business categories are selected, add them to the query
        if (filterBusinessCategories != null && filterBusinessCategories.size() > 0) {
            accountQuery += ' AND Business_Category__c IN :filterBusinessCategories';
        }    
        
        // If counties are selected, add them to the query
        if (filterCounties != null && filterCounties.size() > 0) {
            accountQuery += ' AND County__c IN :filterCounties';
        }
        
        // If a tring is entered in a search bar, add it the query
        if (searchkey != null && searchkey != '') {
            accountQuery += ' AND (Name LIKE :key OR Business_Description__c LIKE :key)';
        }
        
        // Sort results in ascending order regardless of what the final query looks like
        accountQuery += ' ORDER BY Name ASC';

        try {
            return Database.query(accountQuery);
        } catch (QueryException e) {
            System.debug('An error occurred while executing the query: ' + e.getMessage());
            // If an error occurs while executing the query, return an empty list
            return new List<Account>();
        }
    }
    // If the 'Business Registration' record type ID is not found, return an empty list
    return new List<Account>();
    }

    // Build the basic SOQL query. If no filter category is provided and no search key is provided, this basic query is used
    private static String buildAccountQuery() {
        return 'SELECT Id, Name, Business_Category__c, Business_Description__c, County__c, BillingCity, Website FROM Account WHERE RecordTypeId = :businessRegistrationRecordTypeId';
    }
}
