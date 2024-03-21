public without sharing class getAccountsByBusinessCategory {

    // Get the ID of the 'Business_Registration' record type
    // This is used to filter the accounts by record type in the SOQL queries and in the LWC to select correct picklist values
    
        // Nested PicklistOption class
        public class PicklistOption {
            @AuraEnabled
            public String label;
            @AuraEnabled
            public String value;
    
            public PicklistOption(String label, String value) {
                this.label = label;
                this.value = value;
            }
        }
    
    public static String getBusinessRegistrationRecordTypeId() { 
        return Schema.SObjectType.Account.getRecordTypeInfosByName().get('Business Registration').getRecordTypeId(); 
    }

    @AuraEnabled(cacheable=true)
    public static List<PicklistOption> getBusinessCategoryPicklistValues() {

        System.debug('Entering getBusinessCategoryPicklistValues method');
        String businessRegistrationRecordTypeId = getBusinessRegistrationRecordTypeId();
        System.debug('businessRegistrationRecordTypeId: ' + businessRegistrationRecordTypeId);
        Schema.DescribeFieldResult fieldResult = Account.Business_Category__c.getDescribe();
        List<Schema.PicklistEntry> picklistEntries = fieldResult.getPicklistValues();
        List<PicklistOption> picklistOptions = new List<PicklistOption>();
        for (Schema.PicklistEntry entry : picklistEntries) {
            picklistOptions.add(new PicklistOption(entry.getLabel(), entry.getValue()));
        }
        System.debug('picklistOptions: ' + picklistOptions);
        return picklistOptions;     
    }    
    
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
